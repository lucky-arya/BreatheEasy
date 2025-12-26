import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Heatmap API
export const fetchHeatmapData = async (bounds) => {
  const params = bounds ? { bounds } : {};
  return api.get('/heatmap', { params });
};

export const fetchLocationDetails = async (locationId) => {
  return api.get(`/heatmap/location/${locationId}`);
};

export const fetchNearbyLocations = async (lat, lng, radius = 50) => {
  return api.get('/heatmap/nearby', { params: { lat, lng, radius } });
};

// Predictions API
export const fetchPrediction = async (locationId) => {
  return api.get(`/predictions/${locationId}`);
};

export const fetchHistoricalData = async (locationId, hours = 168) => {
  return api.get(`/predictions/${locationId}/history`, { params: { hours } });
};

export const refreshPrediction = async (locationId) => {
  return api.post(`/predictions/${locationId}/refresh`);
};

// Search API
export const searchLocations = async (query, limit = 10) => {
  return api.get('/search', { params: { q: query, limit } });
};

export const searchByCoordinates = async (lat, lng, radius = 25) => {
  return api.get('/search/coordinates', { params: { lat, lng, radius } });
};

export const reverseGeocode = async (lat, lng) => {
  return api.get('/search/reverse', { params: { lat, lng } });
};

// Alerts API
export const fetchAlerts = async (locationId, active = true) => {
  const params = { active };
  if (locationId) params.locationId = locationId;
  return api.get('/push/alerts', { params });
};

export const createAlert = async (locationId, threshold, email) => {
  return api.post('/push/alerts', { locationId, threshold, email });
};

export const acknowledgeAlert = async (alertId) => {
  return api.put(`/push/alerts/${alertId}/acknowledge`);
};

// Push notifications API
export const subscribeToPush = async (email, subscription) => {
  return api.post('/push/subscribe', { email, subscription });
};

export const unsubscribeFromPush = async (email) => {
  return api.post('/push/unsubscribe', { email });
};

export const updatePreferences = async (email, preferences) => {
  return api.put('/push/preferences', { email, preferences });
};

export default api;
