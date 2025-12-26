import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

export const heatmapValidation = [
  query('bounds')
    .optional()
    .isString()
    .withMessage('Bounds must be a string'),
  query('zoom')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Zoom must be between 1 and 20'),
  validate,
];

export const searchValidation = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Search query is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Query must be between 2 and 100 characters'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  validate,
];

export const predictionValidation = [
  param('locationId')
    .isMongoId()
    .withMessage('Invalid location ID'),
  validate,
];

export const subscribeValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('subscription')
    .isObject()
    .withMessage('Push subscription object is required'),
  body('subscription.endpoint')
    .isURL()
    .withMessage('Valid endpoint URL is required'),
  body('subscription.keys')
    .isObject()
    .withMessage('Subscription keys are required'),
  body('subscription.keys.p256dh')
    .isString()
    .notEmpty()
    .withMessage('p256dh key is required'),
  body('subscription.keys.auth')
    .isString()
    .notEmpty()
    .withMessage('auth key is required'),
  validate,
];

export const alertValidation = [
  body('locationId')
    .isMongoId()
    .withMessage('Valid location ID is required'),
  body('threshold')
    .isInt({ min: 0, max: 500 })
    .withMessage('Threshold must be between 0 and 500'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required'),
  validate,
];

export const coordinateValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  query('radius')
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage('Radius must be between 1 and 500 km'),
  validate,
];
