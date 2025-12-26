/**
 * Get AQI color based on value
 */
export function getAQIColor(aqi) {
  if (aqi <= 50) return '#00e400';      // Green - Good
  if (aqi <= 100) return '#ffff00';     // Yellow - Moderate
  if (aqi <= 150) return '#ff7e00';     // Orange - Unhealthy for Sensitive
  if (aqi <= 200) return '#ff0000';     // Red - Unhealthy
  if (aqi <= 300) return '#8f3f97';     // Purple - Very Unhealthy
  return '#7e0023';                      // Maroon - Hazardous
}

/**
 * Get AQI category label
 */
export function getAQICategory(aqi) {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Get AQI category key
 */
export function getAQICategoryKey(aqi) {
  if (aqi <= 50) return 'good';
  if (aqi <= 100) return 'moderate';
  if (aqi <= 150) return 'unhealthy_sensitive';
  if (aqi <= 200) return 'unhealthy';
  if (aqi <= 300) return 'very_unhealthy';
  return 'hazardous';
}

/**
 * Get health recommendation based on AQI
 */
export function getHealthRecommendation(aqi) {
  if (aqi <= 50) {
    return 'Air quality is satisfactory. Enjoy outdoor activities!';
  }
  if (aqi <= 100) {
    return 'Air quality is acceptable. Unusually sensitive people should consider reducing prolonged outdoor exertion.';
  }
  if (aqi <= 150) {
    return 'Sensitive groups should reduce prolonged outdoor exertion. Others can enjoy outdoor activities.';
  }
  if (aqi <= 200) {
    return 'Everyone should reduce prolonged outdoor exertion. Sensitive groups should avoid outdoor activities.';
  }
  if (aqi <= 300) {
    return 'Everyone should avoid prolonged outdoor exertion. Sensitive groups should stay indoors.';
  }
  return 'Health warning: everyone should avoid all outdoor activities. Stay indoors with air filtration.';
}

/**
 * Format date for display
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date) {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Calculate hours from now
 */
export function hoursFromNow(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours);
  return date;
}

/**
 * Get marker size based on AQI
 */
export function getMarkerSize(aqi) {
  if (aqi <= 50) return 12;
  if (aqi <= 100) return 14;
  if (aqi <= 150) return 16;
  if (aqi <= 200) return 18;
  if (aqi <= 300) return 20;
  return 24;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
