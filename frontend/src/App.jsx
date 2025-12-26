import React, { useState, useEffect, useCallback } from 'react';
import Heatmap from './components/Heatmap';
import SearchBox from './components/SearchBox';
import AQILegend from './components/AQILegend';
import TimeSlider from './components/TimeSlider';
import ForecastModal from './components/ForecastModal';
import AlertCard from './components/AlertCard';
import StatsPanel from './components/StatsPanel';
import { useStore } from './store/useStore';
import { fetchHeatmapData, fetchAlerts } from './services/api';
import { getAQIColor } from './utils/helpers';

function App() {
  const { 
    selectedLocation, 
    setSelectedLocation,
    heatmapData,
    setHeatmapData,
    alerts,
    setAlerts,
    isLoading,
    setIsLoading
  } = useStore();

  const [showForecastModal, setShowForecastModal] = useState(false);
  const [sliderHour, setSliderHour] = useState(0);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India
  const [mapZoom, setMapZoom] = useState(4);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Track scroll to hide indicator
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [heatmapResponse, alertsResponse] = await Promise.all([
          fetchHeatmapData(),
          fetchAlerts()
        ]);
        
        if (heatmapResponse.success) {
          setHeatmapData(heatmapResponse.data);
        }
        if (alertsResponse.success) {
          setAlerts(alertsResponse.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Auto-refresh every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [setHeatmapData, setAlerts, setIsLoading]);

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    if (location.coordinates) {
      setMapCenter([location.coordinates[1], location.coordinates[0]]);
      setMapZoom(10);
    }
    setShowForecastModal(true);
  };

  const handleMarkerClick = (feature) => {
    setSelectedLocation({
      id: feature.properties.id,
      name: feature.properties.name,
      city: feature.properties.city,
      country: feature.properties.country,
      coordinates: feature.geometry.coordinates,
      aqi: feature.properties.aqi,
      aqiCategory: feature.properties.aqiCategory,
    });
    setShowForecastModal(true);
  };

  const handleQuickNav = (region) => {
    const regions = {
      india: { center: [20.5937, 78.9629], zoom: 5 },
      us: { center: [39.8283, -98.5795], zoom: 4 },
      world: { center: [20, 0], zoom: 2 },
    };
    if (regions[region]) {
      setMapCenter(regions[region].center);
      setMapZoom(regions[region].zoom);
    }
  };

  // Calculate stats from heatmap data
  const stats = React.useMemo(() => {
    const features = heatmapData?.features || [];
    if (features.length === 0) return null;
    
    const aqiValues = features.map(f => f.properties.aqi);
    const avgAqi = Math.round(aqiValues.reduce((a, b) => a + b, 0) / aqiValues.length);
    const maxAqi = Math.max(...aqiValues);
    const minAqi = Math.min(...aqiValues);
    const goodCount = aqiValues.filter(a => a <= 50).length;
    const moderateCount = aqiValues.filter(a => a > 50 && a <= 100).length;
    const unhealthyCount = aqiValues.filter(a => a > 100).length;
    
    return { avgAqi, maxAqi, minAqi, goodCount, moderateCount, unhealthyCount, total: features.length };
  }, [heatmapData]);

  return (
    <div className="min-h-screen w-screen bg-slate-100 overflow-x-hidden">
      {/* Header - Fixed at top */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between z-[1100] shadow-sm">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
              BreatheEasy
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide hidden sm:block">
              Real-Time Air Quality Monitor & Predictor
            </p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-2 sm:mx-8 hidden md:block">
          <SearchBox onSelect={handleLocationSelect} />
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          {/* Quick Navigation */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-slate-500 mr-2 hidden lg:inline">Quick View:</span>
            <button 
              onClick={() => handleQuickNav('india')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-emerald-300"
            >
              IN
            </button>
            <button 
              onClick={() => handleQuickNav('us')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-blue-300"
            >
              US
            </button>
            <button 
              onClick={() => handleQuickNav('world')}
              className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs font-medium bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 rounded-lg transition-all duration-200 border border-slate-200 hover:border-purple-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs text-slate-500">Last Updated</span>
              <span className="text-sm text-slate-700 font-medium">{new Date().toLocaleTimeString()}</span>
            </div>
            {isLoading && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>
      </header>

      {/* Map Section - 100vh height */}
      <div className="h-screen w-full relative pt-[48px] sm:pt-[60px]">
        {/* Mobile Search Bar */}
        <div className="md:hidden absolute top-[56px] left-2 right-2 z-[1000]">
          <SearchBox onSelect={handleLocationSelect} />
        </div>

        {/* Mobile Quick Nav */}
        <div className="md:hidden absolute top-[108px] left-2 z-[1000] flex gap-1">
          <button 
            onClick={() => handleQuickNav('india')}
            className="px-3 py-1.5 text-xs font-medium bg-white/95 backdrop-blur-sm text-slate-600 rounded-lg shadow-md border border-slate-200"
          >
            India
          </button>
          <button 
            onClick={() => handleQuickNav('us')}
            className="px-3 py-1.5 text-xs font-medium bg-white/95 backdrop-blur-sm text-slate-600 rounded-lg shadow-md border border-slate-200"
          >
            USA
          </button>
          <button 
            onClick={() => handleQuickNav('world')}
            className="px-3 py-1.5 text-xs font-medium bg-white/95 backdrop-blur-sm text-slate-600 rounded-lg shadow-md border border-slate-200"
          >
            World
          </button>
        </div>

        {/* Map - Full viewport */}
        <div className="absolute inset-0 top-[48px] sm:top-[60px] z-0">
          <Heatmap 
            data={heatmapData} 
            onMarkerClick={handleMarkerClick}
            sliderHour={sliderHour}
            center={mapCenter}
            zoom={mapZoom}
          />
        </div>

        {/* Stats Panel - Top Left - Hidden on mobile */}
        {stats && (
          <div className="hidden md:block absolute top-20 left-4 z-[1000]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 shadow-lg">
              <StatsPanel stats={stats} />
            </div>
          </div>
        )}

        {/* Alerts Panel - Below Stats - Hidden on mobile */}
        {alerts.length > 0 && (
          <div className="hidden md:block absolute top-[280px] left-4 z-[1000] w-80 max-h-64 overflow-y-auto scrollbar-thin">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-slate-200 p-4 shadow-lg">
              <h3 className="text-sm font-semibold text-amber-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                Active Alerts ({alerts.length})
              </h3>
              <div className="space-y-2">
                {alerts.slice(0, 3).map((alert) => (
                  <AlertCard key={alert._id} alert={alert} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right sidebar - Legend - Hidden on mobile */}
        <div className="hidden md:block absolute top-20 right-4 z-[1000]">
          <AQILegend />
        </div>

        {/* Floating Info Card - Bottom Right of Map */}
        <div className="absolute bottom-16 sm:bottom-20 right-2 sm:right-4 z-[1000]">
          <div className="bg-white/95 backdrop-blur-sm rounded-lg sm:rounded-xl border border-slate-200 px-3 sm:px-4 py-2 sm:py-3 shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-slate-500">Stations</p>
                <p className="text-lg sm:text-xl font-bold text-slate-800">{stats?.total || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator - hidden after scrolling */}
        {!hasScrolled && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] animate-bounce">
            <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 shadow-lg border border-slate-200 flex items-center gap-1 sm:gap-2">
              <span className="text-xs sm:text-sm text-slate-600">Scroll</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Stats & Legend Section - Only visible on mobile */}
      <div className="md:hidden bg-white border-t border-slate-200 px-3 py-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Stats Summary for Mobile */}
          {stats && (
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-10 h-10 rounded-lg flex flex-col items-center justify-center shadow-md"
                  style={{ 
                    backgroundColor: getAQIColor(stats.avgAqi),
                  }}
                >
                  <span className="text-lg font-bold text-white">{stats.avgAqi}</span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Avg AQI</p>
                  <p className="text-[10px] text-slate-500">{stats.total} stations</p>
                </div>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-emerald-600">Best: {stats.minAqi}</span>
                <span className="text-red-600">Worst: {stats.maxAqi}</span>
              </div>
            </div>
          )}

          {/* Legend for Mobile */}
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">AQI Scale</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                { label: 'Good', color: '#00e400', range: '0-50' },
                { label: 'Moderate', color: '#ffff00', range: '51-100' },
                { label: 'Unhealthy', color: '#ff7e00', range: '101-150' },
                { label: 'Very Bad', color: '#ff0000', range: '151+' },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] text-slate-600 truncate">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts for Mobile */}
        {alerts.length > 0 && (
          <div className="mt-3 bg-amber-50 rounded-xl p-3 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
              <span className="text-xs font-semibold text-amber-700">Active Alerts ({alerts.length})</span>
            </div>
            <div className="space-y-1">
              {alerts.slice(0, 2).map((alert) => (
                <p key={alert._id} className="text-[10px] text-amber-600 truncate">
                  {alert.message || alert.locationName}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Time Slider Section - Below Map with Light Theme */}
      <div className="bg-white border-t border-slate-200 px-3 sm:px-6 py-4 sm:py-8 shadow-inner">
        <div className="max-w-4xl mx-auto">
          <div className="mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="hidden sm:inline">24-Hour AQI Forecast Timeline</span>
              <span className="sm:hidden">AQI Forecast</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Slide to view predicted air quality</p>
          </div>
          <div className="bg-slate-50 rounded-lg sm:rounded-xl p-3 sm:p-6 border border-slate-200">
            <TimeSlider 
              value={sliderHour} 
              onChange={setSliderHour}
            />
          </div>
        </div>
      </div>

      {/* Forecast Modal */}
      {showForecastModal && selectedLocation && (
        <ForecastModal 
          location={selectedLocation}
          onClose={() => setShowForecastModal(false)}
        />
      )}
    </div>
  );
}

export default App;
