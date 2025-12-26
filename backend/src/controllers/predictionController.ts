import { Request, Response } from 'express';
import { Prediction, AQReading, Location } from '../models/index.js';
import { mlService } from '../services/mlService.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

export const getPrediction = asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.params;

  // Verify location exists
  const location = await Location.findById(locationId);
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found',
    });
  }

  // Get latest prediction
  let prediction = await Prediction.findOne({ locationId })
    .sort({ generatedAt: -1 })
    .lean();

  // If no prediction or prediction is stale (> 1 hour old), generate new one
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  if (!prediction || prediction.generatedAt < oneHourAgo) {
    try {
      await mlService.triggerForecast(locationId);
      prediction = await Prediction.findOne({ locationId })
        .sort({ generatedAt: -1 })
        .lean();
    } catch (error) {
      logger.error('Failed to generate prediction:', error);
      // Return old prediction if available
      if (!prediction) {
        return res.status(503).json({
          success: false,
          error: 'Prediction service temporarily unavailable',
        });
      }
    }
  }

  res.json({
    success: true,
    data: {
      location: {
        id: location._id,
        name: location.name,
        city: location.city,
        country: location.country,
      },
      prediction,
    },
  });
});

export const getHistoricalData = asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.params;
  const { hours = 168 } = req.query; // Default to 7 days

  const hoursNum = Math.min(parseInt(hours as string), 720); // Max 30 days
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hoursNum);

  const readings = await AQReading.find({
    locationId,
    timestamp: { $gte: startDate },
  })
    .sort({ timestamp: 1 })
    .lean();

  // Aggregate by hour for large datasets
  const hourlyReadings = readings.reduce((acc: any[], reading) => {
    const hour = new Date(reading.timestamp);
    hour.setMinutes(0, 0, 0);
    const hourKey = hour.toISOString();

    const existing = acc.find((r) => r.hour === hourKey);
    if (existing) {
      existing.readings.push(reading);
    } else {
      acc.push({ hour: hourKey, readings: [reading] });
    }
    return acc;
  }, []);

  const aggregatedData = hourlyReadings.map((h) => ({
    timestamp: h.hour,
    aqi: Math.round(
      h.readings.reduce((sum: number, r: any) => sum + r.aqi, 0) / h.readings.length
    ),
    pollutants: {
      pm25: h.readings[0].pollutants?.pm25,
      pm10: h.readings[0].pollutants?.pm10,
    },
  }));

  res.json({
    success: true,
    data: {
      locationId,
      readings: aggregatedData,
      meta: {
        startDate,
        endDate: new Date(),
        totalReadings: readings.length,
        hourlyDataPoints: aggregatedData.length,
      },
    },
  });
});

export const triggerManualForecast = asyncHandler(async (req: Request, res: Response) => {
  const { locationId } = req.params;

  // Verify location exists
  const location = await Location.findById(locationId);
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found',
    });
  }

  await mlService.triggerForecast(locationId);

  const prediction = await Prediction.findOne({ locationId })
    .sort({ generatedAt: -1 })
    .lean();

  res.json({
    success: true,
    data: prediction,
    message: 'Forecast generated successfully',
  });
});
