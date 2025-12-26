import { Router } from 'express';
import {
  getHeatmapData,
  getLocationDetails,
  getNearbyLocations,
} from '../controllers/heatmapController.js';
import { heatmapValidation, coordinateValidation } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/heatmap
 * @desc    Get GeoJSON data for heatmap visualization
 * @query   bounds - Optional bounding box (sw_lat,sw_lng,ne_lat,ne_lng)
 * @query   zoom - Optional zoom level
 */
router.get('/', heatmapValidation, getHeatmapData);

/**
 * @route   GET /api/heatmap/location/:locationId
 * @desc    Get detailed data for a specific location
 */
router.get('/location/:locationId', getLocationDetails);

/**
 * @route   GET /api/heatmap/nearby
 * @desc    Get nearby locations based on coordinates
 * @query   lat - Latitude
 * @query   lng - Longitude
 * @query   radius - Search radius in km (default: 50)
 */
router.get('/nearby', coordinateValidation, getNearbyLocations);

export default router;
