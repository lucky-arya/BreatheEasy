import axios from 'axios';
import config from '../config/index.js';
import logger from '../config/logger.js';
import { AQReading, Prediction, Location } from '../models/index.js';

interface ForecastRequest {
  location_id: string;
  historical_data: {
    ds: string;
    y: number;
    temperature?: number;
    humidity?: number;
  }[];
  forecast_hours: number;
}

interface ForecastResponse {
  location_id: string;
  predictions: {
    timestamp: string;
    aqi: number;
    aqi_lower: number;
    aqi_upper: number;
  }[];
  model_version: string;
  confidence: number;
}

class MLService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.mlServiceUrl;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      logger.error('ML Service health check failed:', error);
      return false;
    }
  }

  async triggerForecast(locationId: string): Promise<void> {
    try {
      // Get historical data for the past 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const historicalReadings = await AQReading.find({
        locationId,
        timestamp: { $gte: sevenDaysAgo },
      })
        .sort({ timestamp: 1 })
        .lean();

      if (historicalReadings.length < 24) {
        logger.warn(`Not enough data for location ${locationId}. Found ${historicalReadings.length} readings.`);
        return;
      }

      const forecastRequest: ForecastRequest = {
        location_id: locationId,
        historical_data: historicalReadings.map((r) => ({
          ds: r.timestamp.toISOString(),
          y: r.aqi,
          temperature: r.weather?.temperature,
          humidity: r.weather?.humidity,
        })),
        forecast_hours: 24,
      };

      const response = await axios.post<ForecastResponse>(
        `${this.baseUrl}/forecast`,
        forecastRequest
      );

      const forecastData = response.data;

      // Store prediction in database
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expire in 1 hour

      await Prediction.create({
        locationId,
        generatedAt: new Date(),
        modelVersion: forecastData.model_version,
        forecastHorizon: 24,
        predictions: forecastData.predictions.map((p) => ({
          timestamp: new Date(p.timestamp),
          aqi: Math.round(p.aqi),
          aqiLower: Math.round(p.aqi_lower),
          aqiUpper: Math.round(p.aqi_upper),
        })),
        confidence: forecastData.confidence,
        inputFeatures: {
          historicalHours: historicalReadings.length,
          includesWeather: historicalReadings.some((r) => r.weather?.temperature),
        },
        metadata: {
          modelType: 'prophet',
          trainingDataPoints: historicalReadings.length,
        },
        expiresAt,
      });

      logger.info(`Forecast generated for location ${locationId}`);
    } catch (error) {
      logger.error(`Error generating forecast for location ${locationId}:`, error);
      throw error;
    }
  }

  async getLatestPrediction(locationId: string) {
    return Prediction.findOne({ locationId })
      .sort({ generatedAt: -1 })
      .lean();
  }

  async trainModel(locationId: string): Promise<void> {
    try {
      // Get historical data for training
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const historicalReadings = await AQReading.find({
        locationId,
        timestamp: { $gte: thirtyDaysAgo },
      })
        .sort({ timestamp: 1 })
        .lean();

      if (historicalReadings.length < 168) {
        logger.warn(`Not enough data for training. Need at least 168 readings (7 days).`);
        return;
      }

      await axios.post(`${this.baseUrl}/train`, {
        location_id: locationId,
        training_data: historicalReadings.map((r) => ({
          ds: r.timestamp.toISOString(),
          y: r.aqi,
          temperature: r.weather?.temperature,
          humidity: r.weather?.humidity,
        })),
      });

      logger.info(`Model trained for location ${locationId}`);
    } catch (error) {
      logger.error(`Error training model for location ${locationId}:`, error);
      throw error;
    }
  }
}

export const mlService = new MLService();
