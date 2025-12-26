import { Router } from 'express';
import {
  getPrediction,
  getHistoricalData,
  triggerManualForecast,
} from '../controllers/predictionController.js';
import { predictionValidation } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/predictions/:locationId
 * @desc    Get 24-hour AQI forecast for a location
 */
router.get('/:locationId', predictionValidation, getPrediction);

/**
 * @route   GET /api/predictions/:locationId/history
 * @desc    Get historical AQI data
 * @query   hours - Number of hours of history (default: 168, max: 720)
 */
router.get('/:locationId/history', predictionValidation, getHistoricalData);

/**
 * @route   POST /api/predictions/:locationId/refresh
 * @desc    Trigger manual forecast generation
 */
router.post('/:locationId/refresh', predictionValidation, triggerManualForecast);

export default router;
