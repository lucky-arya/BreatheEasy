import { Router } from 'express';
import {
  searchLocations,
  searchByCoordinates,
  reverseGeocode,
} from '../controllers/searchController.js';
import { searchValidation, coordinateValidation } from '../middleware/validation.js';

const router = Router();

/**
 * @route   GET /api/search
 * @desc    Search locations by city name or text
 * @query   q - Search query
 * @query   limit - Max results (default: 10)
 */
router.get('/', searchValidation, searchLocations);

/**
 * @route   GET /api/search/coordinates
 * @desc    Search locations near coordinates
 * @query   lat - Latitude
 * @query   lng - Longitude
 * @query   radius - Search radius in km
 */
router.get('/coordinates', coordinateValidation, searchByCoordinates);

/**
 * @route   GET /api/search/reverse
 * @desc    Reverse geocode to find nearest location
 * @query   lat - Latitude
 * @query   lng - Longitude
 */
router.get('/reverse', reverseGeocode);

export default router;
