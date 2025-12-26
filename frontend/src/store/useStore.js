import { create } from 'zustand';

export const useStore = create((set) => ({
  // Heatmap data
  heatmapData: null,
  setHeatmapData: (data) => set({ heatmapData: data }),

  // Selected location
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location }),

  // Predictions
  predictions: null,
  setPredictions: (predictions) => set({ predictions }),

  // Alerts
  alerts: [],
  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({ 
    alerts: [alert, ...state.alerts] 
  })),
  removeAlert: (alertId) => set((state) => ({
    alerts: state.alerts.filter((a) => a._id !== alertId)
  })),

  // UI State
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),

  // User preferences
  userPreferences: {
    aqiThreshold: 100,
    notificationsEnabled: false,
  },
  setUserPreferences: (preferences) => set((state) => ({
    userPreferences: { ...state.userPreferences, ...preferences }
  })),

  // Map state
  mapCenter: [20, 0],
  setMapCenter: (center) => set({ mapCenter: center }),
  mapZoom: 3,
  setMapZoom: (zoom) => set({ mapZoom: zoom }),
}));
