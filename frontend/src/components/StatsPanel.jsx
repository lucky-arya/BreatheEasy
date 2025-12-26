import React from 'react';
import { getAQIColor } from '../utils/helpers';

function StatsPanel({ stats }) {
  if (!stats) return null;

  const { avgAqi, maxAqi, minAqi, goodCount, moderateCount, unhealthyCount, total } = stats;

  return (
    <div className="p-3 sm:p-4 w-64 sm:w-80">
      <h3 className="text-xs sm:text-sm font-semibold text-slate-600 mb-3 sm:mb-4 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Air Quality Overview
      </h3>

      {/* Average AQI Display */}
      <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div 
          className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex flex-col items-center justify-center shadow-lg"
          style={{ 
            backgroundColor: getAQIColor(avgAqi),
            boxShadow: `0 0 20px ${getAQIColor(avgAqi)}40`
          }}
        >
          <span className="text-lg sm:text-2xl font-bold text-white">{avgAqi}</span>
          <span className="text-[8px] sm:text-[10px] text-white/80 uppercase tracking-wide">AVG</span>
        </div>
        <div className="flex-1">
          <p className="text-slate-800 font-semibold text-sm sm:text-base">Average AQI</p>
          <p className="text-[10px] sm:text-xs text-slate-500">Across {total} stations</p>
        </div>
      </div>

      {/* Min/Max */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="bg-slate-100 rounded-lg p-2 sm:p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
              style={{ backgroundColor: getAQIColor(minAqi) }}
            ></div>
            <span className="text-[10px] sm:text-xs text-slate-500">Best</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-0.5 sm:mt-1">{minAqi}</p>
        </div>
        <div className="bg-slate-100 rounded-lg p-2 sm:p-3 border border-slate-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
              style={{ backgroundColor: getAQIColor(maxAqi) }}
            ></div>
            <span className="text-[10px] sm:text-xs text-slate-500">Worst</span>
          </div>
          <p className="text-lg sm:text-xl font-bold text-red-600 mt-0.5 sm:mt-1">{maxAqi}</p>
        </div>
      </div>

      {/* Distribution Bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <span className="text-[10px] sm:text-xs text-slate-500">Quality Distribution</span>
        </div>
        <div className="h-2.5 sm:h-3 rounded-full overflow-hidden flex bg-slate-200">
          <div 
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${(goodCount / total) * 100}%` }}
          ></div>
          <div 
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 transition-all duration-500"
            style={{ width: `${(moderateCount / total) * 100}%` }}
          ></div>
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-red-400 transition-all duration-500"
            style={{ width: `${(unhealthyCount / total) * 100}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1.5 sm:mt-2 text-[9px] sm:text-[10px]">
          <span className="text-emerald-600 flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500"></span>
            Good: {goodCount}
          </span>
          <span className="text-yellow-600 flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-yellow-500"></span>
            Mod: {moderateCount}
          </span>
          <span className="text-red-600 flex items-center gap-0.5 sm:gap-1">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-red-500"></span>
            Bad: {unhealthyCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default StatsPanel;
