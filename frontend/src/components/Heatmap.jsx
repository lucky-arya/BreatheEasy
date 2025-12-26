import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { getAQIColor, getAQICategory, getMarkerSize } from '../utils/helpers';
import 'leaflet/dist/leaflet.css';

// Component to handle map updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);

  return null;
}

function Heatmap({ data, onMarkerClick, sliderHour, center, zoom }) {
  const defaultCenter = center || [20.5937, 78.9629]; // Default to India
  const defaultZoom = zoom || 4;

  const features = data?.features || [];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      className="w-full h-full"
      zoomControl={true}
      zoomControlOptions={{ position: 'bottomleft' }}
      scrollWheelZoom={false}
      style={{ background: '#e5e7eb' }}
    >
      <MapUpdater center={center} zoom={zoom} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />

      {features.map((feature, index) => {
        const { properties, geometry } = feature;
        const [lng, lat] = geometry.coordinates;
        const aqi = properties.aqi;
        const color = getAQIColor(aqi);
        const size = getMarkerSize(aqi);

        return (
          <CircleMarker
            key={properties.id || index}
            center={[lat, lng]}
            radius={size}
            pathOptions={{
              fillColor: color,
              fillOpacity: 0.9,
              color: '#1e293b',
              weight: 2,
              opacity: 0.9,
            }}
            eventHandlers={{
              click: () => onMarkerClick && onMarkerClick(feature),
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 sm:p-3 min-w-[200px] sm:min-w-56 bg-slate-800 rounded-lg">
                <div className="flex items-start justify-between mb-2 sm:mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate">{properties.name}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm truncate">{properties.city}</p>
                    <p className="text-slate-500 text-[10px] sm:text-xs">{properties.country}</p>
                  </div>
                  <div 
                    className="w-11 h-11 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg flex-shrink-0"
                    style={{ 
                      backgroundColor: color,
                      boxShadow: `0 4px 15px ${color}50`
                    }}
                  >
                    <span className="text-lg sm:text-xl">{aqi}</span>
                    <span className="text-[7px] sm:text-[8px] uppercase opacity-80">AQI</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                  <span 
                    className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium text-white"
                    style={{ backgroundColor: color }}
                  >
                    {getAQICategory(aqi)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500">
                    {new Date(properties.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {properties.pollutants && (
                  <div className="bg-slate-700/50 rounded-lg p-1.5 sm:p-2 mb-2 sm:mb-3">
                    <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider mb-1">Pollutants</p>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {properties.pollutants.pm25 != null && (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-600/50 rounded text-[10px] sm:text-xs text-slate-200 font-medium">
                          PM2.5: <span className="text-cyan-400">{properties.pollutants.pm25.toFixed(1)}</span>
                        </span>
                      )}
                      {properties.pollutants.pm10 != null && (
                        <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-600/50 rounded text-[10px] sm:text-xs text-slate-200 font-medium">
                          PM10: <span className="text-cyan-400">{properties.pollutants.pm10.toFixed(1)}</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button 
                  className="w-full py-2 sm:py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all duration-200 shadow-lg shadow-cyan-500/20"
                  onClick={() => onMarkerClick && onMarkerClick(feature)}
                >
                  View Forecast
                </button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

export default Heatmap;
