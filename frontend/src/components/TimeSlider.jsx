import React from 'react';
import { hoursFromNow, formatTime } from '../utils/helpers';

function TimeSlider({ value, onChange }) {
  const hours = Array.from({ length: 25 }, (_, i) => i);

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-800">Forecast</h3>
            <p className="text-xs sm:text-sm text-slate-500">AI-powered</p>
          </div>
        </div>
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl shadow-lg">
          <span className="text-xl sm:text-2xl font-bold text-white">
            {value === 0 ? 'Now' : `+${value}h`}
          </span>
        </div>
      </div>

      <div className="relative px-2">
        {/* Custom slider track */}
        <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-200"
            style={{ width: `${(value / 24) * 100}%` }}
          ></div>
        </div>
        
        <input
          type="range"
          min={0}
          max={24}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-4 opacity-0 cursor-pointer"
        />

        {/* Tick marks */}
        <div className="absolute top-0 left-0 right-0 h-4 flex items-center justify-between px-1 pointer-events-none">
          {[0, 6, 12, 18, 24].map((tick) => (
            <div 
              key={tick}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                value >= tick ? 'bg-white' : 'bg-slate-400'
              }`}
            ></div>
          ))}
        </div>

        {/* Slider thumb indicator */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full shadow-lg border-3 border-cyan-500 transition-all duration-200 pointer-events-none"
          style={{ left: `calc(${(value / 24) * 100}% - 12px)` }}
        ></div>

        {/* Time labels */}
        <div className="flex justify-between mt-3 sm:mt-4 text-xs sm:text-sm">
          <span className="text-emerald-600 font-semibold">Now</span>
          <span className="text-slate-500">+6h</span>
          <span className="text-slate-500">+12h</span>
          <span className="text-slate-500">+18h</span>
          <span className="text-purple-600 font-semibold">+24h</span>
        </div>
      </div>

      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-200 text-center">
        <p className="text-xs sm:text-sm text-slate-600">
          Forecast for: <span className="text-cyan-600 font-semibold">{formatTime(hoursFromNow(value))}</span>
        </p>
      </div>
    </div>
  );
}

export default TimeSlider;
