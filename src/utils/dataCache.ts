interface CacheEntry<T> {
  data: T;
  lastFetched: number;
  version: string; // Hash or version to detect changes
}

interface CacheOptions {
  maxAge?: number; // Cache expiry time in milliseconds (default: 5 minutes)
  forceRefresh?: boolean;
}

class DataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache or fetch from database if needed
   */
  async getCachedData<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { maxAge = this.DEFAULT_MAX_AGE, forceRefresh = false } = options;
    
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if valid and not forcing refresh
    if (cached && !forceRefresh && (now - cached.lastFetched) < maxAge) {
      console.log(`Cache hit for key: ${key}`);
      return cached.data;
    }

    console.log(`Cache miss or expired for key: ${key}, fetching from database...`);
    
    try {
      const data = await fetchFunction();
      const version = this.generateVersion(data);
      
      // Only update cache if data has actually changed
      if (!cached || cached.version !== version) {
        this.cache.set(key, {
          data,
          lastFetched: now,
          version
        });
        console.log(`Cache updated for key: ${key}`);
      } else {
        // Data hasn't changed, just update timestamp
        cached.lastFetched = now;
        console.log(`Data unchanged for key: ${key}, timestamp updated`);
      }
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      // Return cached data if available, even if expired
      if (cached) {
        console.log(`Returning stale cache data for key: ${key}`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`Cache invalidated for key: ${key}`);
  }

  /**
   * Invalidate all cache entries matching pattern
   */
  invalidatePattern(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Cache invalidated for pattern: ${pattern}, keys: ${keysToDelete.join(', ')}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('All cache cleared');
  }

  /**
   * Generate a simple version hash for data comparison
   */
  private generateVersion(data: any): string {
    const str = JSON.stringify(data, (_, value) => {
      // Handle Firestore Timestamps
      if (value && typeof value.toDate === 'function') {
        return value.toDate().getTime();
      }
      return value;
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Get cache statistics
   */
  getStats(): { totalEntries: number; keys: string[] } {
    return {
      totalEntries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    key: string,
    fetchFunction: () => Promise<T>
  ): Promise<void> {
    try {
      await this.getCachedData(key, fetchFunction);
    } catch (error) {
      console.error(`Error preloading cache for key ${key}:`, error);
    }
  }
}

// Create singleton instance
export const dataCache = new DataCache();

// Utility functions for common cache keys
export const getCacheKey = {
  exams: (userId: string) => `exams_${userId}`,
  examDetail: (examId: string) => `exam_${examId}`,
  questions: (examId: string) => `questions_${examId}`,
  groupTypes: (examId: string) => `groupTypes_${examId}`,
  users: () => 'users_all',
  userExams: (userId: string) => `userExams_${userId}`,
};

// Utility function to invalidate related caches when data changes
export const invalidateRelatedCaches = {
  onExamCreate: (userId: string) => {
    dataCache.invalidate(getCacheKey.exams(userId));
  },
  onExamUpdate: (examId: string, userId: string) => {
    dataCache.invalidate(getCacheKey.examDetail(examId));
    dataCache.invalidate(getCacheKey.exams(userId));
  },
  onQuestionAdd: (examId: string) => {
    dataCache.invalidate(getCacheKey.questions(examId));
    dataCache.invalidate(getCacheKey.examDetail(examId));
  },
  onGroupTypeAdd: (examId: string) => {
    dataCache.invalidate(getCacheKey.groupTypes(examId));
  },
  onExamAssignment: (studentUserId: string) => {
    dataCache.invalidate(getCacheKey.userExams(studentUserId));
    dataCache.invalidate(`studentExams_${studentUserId}`);
  },
};
