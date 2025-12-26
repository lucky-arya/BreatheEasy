import React from 'react';
import { getAQIColor, getAQICategory, formatDateTime } from '../utils/helpers';
import { acknowledgeAlert } from '../services/api';
import { useStore } from '../store/useStore';

const severityColors = {
  info: 'border-blue-500 bg-blue-500/10',
  warning: 'border-yellow-500 bg-yellow-500/10',
  critical: 'border-red-500 bg-red-500/10',
};

const severityIcons = {
  info: (
    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  critical: (
    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

function AlertCard({ alert }) {
  const { removeAlert } = useStore();

  const handleAcknowledge = async () => {
    try {
      await acknowledgeAlert(alert._id);
      removeAlert(alert._id);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  const locationName = alert.locationId?.name || alert.locationId?.city || 'Unknown Location';
  const aqiColor = getAQIColor(alert.currentAqi);

  return (
    <div 
      className={`rounded-xl border-l-4 p-3 ${severityColors[alert.severity]} backdrop-blur-md transition-all duration-200 hover:scale-[1.02] cursor-pointer`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {severityIcons[alert.severity]}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white truncate">
              {locationName}
            </h4>
            <span 
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-lg"
              style={{ 
                backgroundColor: aqiColor,
                boxShadow: `0 0 10px ${aqiColor}50`
              }}
            >
              AQI {alert.currentAqi}
            </span>
          </div>
          
          <p className="text-xs text-slate-300 mt-1 line-clamp-2">
            {alert.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-slate-500">
              {formatDateTime(alert.triggeredAt)}
            </span>
            
            <button
              onClick={handleAcknowledge}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AlertCard;
