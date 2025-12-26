import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { ingestFromMultipleCountries, fetchOpenAQData } from '../services/ingestionService.js';
import { notificationService } from '../services/notificationService.js';
import logger from '../config/logger.js';

export const triggerIngestion = asyncHandler(async (req: Request, res: Response) => {
  const { apiKey } = req.headers;
  const { country, limit } = req.body;

  // Simple API key validation for internal use
  // In production, use proper authentication
  if (process.env.NODE_ENV === 'production' && apiKey !== process.env.INGEST_API_KEY) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  logger.info(`Manual ingestion triggered${country ? ` for country: ${country}` : ''}`);
  
  // Run ingestion in background
  const ingestionPromise = country 
    ? fetchOpenAQData(country, limit || 50) 
    : ingestFromMultipleCountries();
    
  ingestionPromise
    .then(() => {
      logger.info('Manual ingestion completed');
      // Check for alerts after ingestion
      notificationService.checkAndCreateAlerts();
    })
    .catch((error) => {
      logger.error('Manual ingestion failed:', error);
    });

  res.json({
    success: true,
    message: 'Ingestion started in background',
    timestamp: new Date().toISOString(),
  });
});

export const getIngestionStatus = asyncHandler(async (req: Request, res: Response) => {
  const { AQReading } = await import('../models/AQReading.js');
  
  // Get latest reading timestamp
  const latestReading = await AQReading.findOne()
    .sort({ timestamp: -1 })
    .select('timestamp')
    .lean();

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const readingsLast24h = await AQReading.countDocuments({
    timestamp: { $gte: oneDayAgo },
  });

  res.json({
    success: true,
    data: {
      lastIngestion: latestReading?.timestamp || null,
      readingsLast24Hours: readingsLast24h,
      status: latestReading ? 'active' : 'no_data',
    },
  });
});
