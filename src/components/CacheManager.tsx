import React, { useState, useEffect } from 'react';
import { dataCache } from '../utils/dataCache';

export const CacheManager: React.FC = () => {
  const [stats, setStats] = useState<{ totalEntries: number; keys: string[] }>({ 
    totalEntries: 0, 
    keys: [] 
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setStats(dataCache.getStats());
  }, [refreshKey]);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all cache? This will force all data to be refetched from the database.')) {
      dataCache.clear();
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleInvalidateKey = (key: string) => {
    if (window.confirm(`Are you sure you want to invalidate cache for: ${key}?`)) {
      dataCache.invalidate(key);
      setRefreshKey(prev => prev + 1);
    }
  };

  const handleRefreshStats = () => {
    setRefreshKey(prev => prev + 1);
  };

  const containerStyle: React.CSSProperties = {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    margin: '20px',
    fontFamily: 'Arial, sans-serif'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    margin: '4px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  const dangerButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: '#dc3545'
  };

  const listStyle: React.CSSProperties = {
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '4px',
    marginTop: '10px'
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    borderBottom: '1px solid #eee'
  };

  return (
    <div style={containerStyle}>
      <h3>Data Cache Manager</h3>
      <div>
        <p><strong>Total Cache Entries:</strong> {stats.totalEntries}</p>
        <div>
          <button style={buttonStyle} onClick={handleRefreshStats}>
            Refresh Stats
          </button>
          <button style={dangerButtonStyle} onClick={handleClearAll}>
            Clear All Cache
          </button>
        </div>
      </div>

      {stats.keys.length > 0 && (
        <div>
          <h4>Cached Keys:</h4>
          <div style={listStyle}>
            {stats.keys.map(key => (
              <div key={key} style={itemStyle}>
                <span>{key}</span>
                <button
                  style={dangerButtonStyle}
                  onClick={() => handleInvalidateKey(key)}
                >
                  Invalidate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>How it works:</strong></p>
        <ul>
          <li>Data is cached for faster loading (users: 10min, questions: 2min, group types: 5min)</li>
          <li>Cache is automatically invalidated when you add/update data</li>
          <li>Use "Invalidate" to force refresh specific data from database</li>
          <li>Use "Clear All" to reset entire cache</li>
        </ul>
      </div>
    </div>
  );
};
