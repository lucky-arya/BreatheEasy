import { Router } from 'express';
import {
  subscribe,
  unsubscribe,
  updatePreferences,
  getAlerts,
  createAlert,
  acknowledgeAlert,
} from '../controllers/pushController.js';
import { subscribeValidation, alertValidation } from '../middleware/validation.js';

const router = Router();

/**
 * @route   POST /api/push/subscribe
 * @desc    Subscribe to push notifications
 * @body    email, subscription
 */
router.post('/subscribe', subscribeValidation, subscribe);

/**
 * @route   POST /api/push/unsubscribe
 * @desc    Unsubscribe from push notifications
 * @body    email
 */
router.post('/unsubscribe', unsubscribe);

/**
 * @route   PUT /api/push/preferences
 * @desc    Update notification preferences
 * @body    email, preferences
 */
router.put('/preferences', updatePreferences);

/**
 * @route   GET /api/alerts
 * @desc    Get alerts
 * @query   locationId - Optional filter by location
 * @query   active - Filter active alerts (default: true)
 */
router.get('/alerts', getAlerts);

/**
 * @route   POST /api/alerts
 * @desc    Create a new alert
 * @body    locationId, threshold, email (optional)
 */
router.post('/alerts', alertValidation, createAlert);

/**
 * @route   PUT /api/alerts/:alertId/acknowledge
 * @desc    Acknowledge an alert
 */
router.put('/alerts/:alertId/acknowledge', acknowledgeAlert);

export default router;
