import React, { useState, useEffect } from 'react';
import { dataCache } from '../utils/dataCache';

interface CacheIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  showDetails?: boolean;
}

export const CacheIndicator: React.FC<CacheIndicatorProps> = ({ 
  position = 'bottom-right',
  showDetails = false 
}) => {
  const [stats, setStats] = useState<{ totalEntries: number; keys: string[] }>({ 
    totalEntries: 0, 
    keys: [] 
  });
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const updateStats = () => {
      setStats(dataCache.getStats());
    };

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    updateStats(); // Initial update

    return () => clearInterval(interval);
  }, []);

  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 1000,
      padding: '8px 12px',
      backgroundColor: stats.totalEntries > 0 ? '#28a745' : '#6c757d',
      color: 'white',
      borderRadius: '20px',
      fontSize: '12px',
      cursor: showDetails ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      default:
        return { ...baseStyles, bottom: '20px', right: '20px' };
    }
  };

  const tooltipStyles: React.CSSProperties = {
    position: 'absolute',
    bottom: '100%',
    right: '0',
    marginBottom: '8px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: 'white',
    borderRadius: '4px',
    fontSize: '11px',
    whiteSpace: 'nowrap',
    opacity: showTooltip ? 1 : 0,
    transform: showTooltip ? 'translateY(0)' : 'translateY(4px)',
    transition: 'opacity 0.2s ease, transform 0.2s ease',
    pointerEvents: 'none'
  };

  if (!showDetails && stats.totalEntries === 0) return null;

  return (
    <div 
      style={getPositionStyles()}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <span>📦 {stats.totalEntries} cached</span>
      
      {showDetails && showTooltip && stats.keys.length > 0 && (
        <div style={tooltipStyles}>
          Cached: {stats.keys.join(', ')}
        </div>
      )}
    </div>
  );
};
