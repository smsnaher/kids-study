import { dataCache, getCacheKey, invalidateRelatedCaches } from '../utils/dataCache';

// Import original data services
import { fetchAllUsers } from '../data/userData';
import { fetchQuestionsByExamId, saveQuestionToExam } from '../data/questionData';
import { fetchGroupTypesByExamId, addQuestionGroupType } from '../data/groupTypeService';
import { fetchAssignedExamsForUser } from '../data/assignedExamData';
import { fetchExamById } from '../data/examData';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

/**
 * Cached version of fetchAllUsers
 */
export const fetchAllUsersCached = async (forceRefresh: boolean = false) => {
  return dataCache.getCachedData(
    getCacheKey.users(),
    fetchAllUsers,
    { forceRefresh, maxAge: 10 * 60 * 1000 } // 10 minutes for users
  );
};

/**
 * Cached version of fetchQuestionsByExamId
 */
export const fetchQuestionsByExamIdCached = async (
  examId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    getCacheKey.questions(examId),
    () => fetchQuestionsByExamId(examId),
    { forceRefresh, maxAge: 2 * 60 * 1000 } // 2 minutes for questions
  );
};

/**
 * Cached version of fetchGroupTypesByExamId
 */
export const fetchGroupTypesByExamIdCached = async (
  examId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    getCacheKey.groupTypes(examId),
    () => fetchGroupTypesByExamId(examId),
    { forceRefresh, maxAge: 5 * 60 * 1000 } // 5 minutes for group types
  );
};

/**
 * Fetch exams for a specific user (cached)
 */
export const fetchExamsByUserIdCached = async (
  userId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    getCacheKey.exams(userId),
    async () => {
      const q = query(
        collection(db, 'examinations'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: data.id,
          name: data.name,
          userId: data.userId,
          createdAt: data.createdAt,
          docId: doc.id,
        };
      });
    },
    { forceRefresh, maxAge: 3 * 60 * 1000 } // 3 minutes for exams
  );
};

/**
 * Cached wrapper for saveQuestionToExam with cache invalidation
 */
export const saveQuestionToExamCached = async (
  examId: string,
  questionType: string,
  data?: number[],
  selectedGroupId?: string
) => {
  const result = await saveQuestionToExam(examId, questionType, data, selectedGroupId);
  
  // Invalidate related caches
  invalidateRelatedCaches.onQuestionAdd(examId);
  
  return result;
};

/**
 * Cached wrapper for addQuestionGroupType with cache invalidation
 */
export const addQuestionGroupTypeCached = async (
  examId: string,
  type: string,
  mark: string
) => {
  const result = await addQuestionGroupType(examId, type, mark);
  
  // Invalidate related caches
  invalidateRelatedCaches.onGroupTypeAdd(examId);
  
  return result;
};

/**
 * Create a new exam with cache invalidation
 */
export const createExamCached = async (
  examData: {
    id: string;
    name: string;
    userId: string;
    createdAt: Date;
  }
) => {
  const result = await addDoc(collection(db, 'examinations'), examData);
  
  // Invalidate user's exam cache
  invalidateRelatedCaches.onExamCreate(examData.userId);
  
  return result;
};

/**
 * Update an exam with cache invalidation
 */
export const updateExamCached = async (
  examDocId: string,
  examId: string,
  userId: string,
  updateData: { name: string }
) => {
  const result = await updateDoc(doc(db, 'examinations', examDocId), updateData);
  
  // Invalidate related caches
  invalidateRelatedCaches.onExamUpdate(examId, userId);
  
  return result;
};

/**
 * Delete an exam with cache invalidation
 */
export const deleteExamCached = async (
  examDocId: string,
  examId: string,
  userId: string
) => {
  const result = await deleteDoc(doc(db, 'examinations', examDocId));
  
  // Invalidate related caches
  invalidateRelatedCaches.onExamUpdate(examId, userId);
  
  return result;
};

/**
 * Cached version of fetchAssignedExamsForUser
 */
export const fetchAssignedExamsForUserCached = async (
  userId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    getCacheKey.userExams(userId),
    () => fetchAssignedExamsForUser(userId),
    { forceRefresh, maxAge: 5 * 60 * 1000 } // 5 minutes for assigned exams
  );
};

/**
 * Cached version of fetchExamById
 */
export const fetchExamByIdCached = async (
  examId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    getCacheKey.examDetail(examId),
    () => fetchExamById(examId),
    { forceRefresh, maxAge: 10 * 60 * 1000 } // 10 minutes for exam details
  );
};

/**
 * Fetch student exams with full caching (assigned exam IDs + exam details)
 */
export const fetchStudentExamsCached = async (
  userId: string,
  forceRefresh: boolean = false
) => {
  return dataCache.getCachedData(
    `studentExams_${userId}`,
    async () => {
      // First get assigned exam IDs
      const examIds = await fetchAssignedExamsForUser(userId);
      
      // Then fetch exam details for each ID
      const examObjs = await Promise.all(
        examIds.map(id => fetchExamById(id))
      );
      
      // Filter out null/undefined exams
      return examObjs.filter(Boolean);
    },
    { forceRefresh, maxAge: 3 * 60 * 1000 } // 3 minutes for complete student exam data
  );
};

/**
 * Preload commonly used data
 */
export const preloadCommonData = async (examId?: string) => {
  const promises: Promise<void>[] = [
    dataCache.preload(getCacheKey.users(), fetchAllUsers),
  ];

  if (examId) {
    promises.push(
      dataCache.preload(getCacheKey.questions(examId), () => fetchQuestionsByExamId(examId)),
      dataCache.preload(getCacheKey.groupTypes(examId), () => fetchGroupTypesByExamId(examId))
    );
  }

  await Promise.allSettled(promises);
};
