import { Request, Response } from 'express';
import { Location, AQReading } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

// Helper function to get AQI color
function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';      // Green
  if (aqi <= 100) return '#ffff00';     // Yellow
  if (aqi <= 150) return '#ff7e00';     // Orange
  if (aqi <= 200) return '#ff0000';     // Red
  if (aqi <= 300) return '#8f3f97';     // Purple
  return '#7e0023';                      // Maroon
}

export const getHeatmapData = asyncHandler(async (req: Request, res: Response) => {
  const { bounds, zoom } = req.query;

  let query: any = { isActive: true };

  // Parse bounds if provided (format: "sw_lat,sw_lng,ne_lat,ne_lng")
  if (bounds && typeof bounds === 'string') {
    const [swLat, swLng, neLat, neLng] = bounds.split(',').map(Number);
    query['coordinates'] = {
      $geoWithin: {
        $box: [
          [swLng, swLat],
          [neLng, neLat],
        ],
      },
    };
  }

  // Get all active locations
  const locations = await Location.find(query).lean();

  // Get latest reading for each location
  const features = await Promise.all(
    locations.map(async (location) => {
      const latestReading = await AQReading.findOne({ locationId: location._id })
        .sort({ timestamp: -1 })
        .lean();

      if (!latestReading) return null;

      return {
        type: 'Feature',
        geometry: location.coordinates,
        properties: {
          id: location._id,
          name: location.name,
          city: location.city,
          country: location.country,
          aqi: latestReading.aqi,
          aqiCategory: latestReading.aqiCategory,
          color: getAQIColor(latestReading.aqi),
          timestamp: latestReading.timestamp,
          pollutants: latestReading.pollutants,
        },
      };
    })
  );

  const validFeatures = features.filter((f) => f !== null);

  const geojson = {
    type: 'FeatureCollection',
    features: validFeatures,
    metadata: {
      count: validFeatures.length,
      generatedAt: new Date().toISOString(),
    },
  };

  res.json({
    success: true,
    data: geojson,
  });
});

export const getLocationDetails = asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.params;

  const location = await Location.findById(locationId).lean();

  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found',
    });
  }

  // Get recent readings (last 24 hours)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentReadings = await AQReading.find({
    locationId,
    timestamp: { $gte: oneDayAgo },
  })
    .sort({ timestamp: -1 })
    .limit(48)
    .lean();

  res.json({
    success: true,
    data: {
      location,
      readings: recentReadings,
      latestReading: recentReadings[0] || null,
    },
  });
});

export const getNearbyLocations = asyncHandler(async (req: Request, res: Response) => {
  const { lat, lng, radius = 50 } = req.query;

  const latitude = parseFloat(lat as string);
  const longitude = parseFloat(lng as string);
  const radiusKm = parseInt(radius as string);

  const locations = await Location.find({
    coordinates: {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        $maxDistance: radiusKm * 1000, // Convert km to meters
      },
    },
    isActive: true,
  })
    .limit(20)
    .lean();

  // Get latest readings for each location
  const locationsWithReadings = await Promise.all(
    locations.map(async (location) => {
      const latestReading = await AQReading.findOne({ locationId: location._id })
        .sort({ timestamp: -1 })
        .lean();

      return {
        ...location,
        latestReading,
      };
    })
  );

  res.json({
    success: true,
    data: locationsWithReadings,
  });
});
