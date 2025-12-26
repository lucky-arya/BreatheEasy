import React from 'react';

const legendItems = [
  { range: '0-50', label: 'Good', color: '#00e400', description: 'Air quality is satisfactory' },
  { range: '51-100', label: 'Moderate', color: '#ffff00', description: 'Acceptable quality' },
  { range: '101-150', label: 'Unhealthy (Sensitive)', color: '#ff7e00', description: 'Sensitive groups affected' },
  { range: '151-200', label: 'Unhealthy', color: '#ff0000', description: 'Everyone may feel effects' },
  { range: '201-300', label: 'Very Unhealthy', color: '#8f3f97', description: 'Health alert' },
  { range: '300+', label: 'Hazardous', color: '#7e0023', description: 'Emergency conditions' },
];

function AQILegend() {
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-lg border border-slate-200 w-48 sm:w-64">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
        </div>
        <div>
          <h3 className="text-xs sm:text-sm font-semibold text-slate-800">AQI Scale</h3>
          <p className="text-[9px] sm:text-[10px] text-slate-500">Air Quality Index</p>
        </div>
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        {legendItems.map((item) => (
          <div 
            key={item.range} 
            className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-default group"
          >
            <div
              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-md flex-shrink-0 border border-slate-200"
              style={{ 
                backgroundColor: item.color,
                boxShadow: `0 0 8px ${item.color}50`
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs text-slate-700 font-medium">{item.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] sm:text-[10px] text-slate-500">{item.range}</span>
                <span className="hidden sm:inline text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity truncate ml-2">
                  {item.description}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] sm:text-[10px] text-slate-500">Live</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-cyan-600 font-medium">OpenAQ</span>
        </div>
      </div>
    </div>
  );
}

export default AQILegend;
