import { Request, Response } from 'express';
import { User, Alert, Location } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import logger from '../config/logger.js';

export const subscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email, subscription } = req.body;

  // Find or create user
  let user = await User.findOne({ email });

  if (user) {
    // Update push subscription
    user.pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    };
    user.preferences.notificationsEnabled = true;
    await user.save();
  } else {
    // Create new user
    user = await User.create({
      email,
      pushSubscription: {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      preferences: {
        notificationsEnabled: true,
        aqiThreshold: 100,
      },
    });
  }

  res.status(201).json({
    success: true,
    data: {
      userId: user._id,
      message: 'Successfully subscribed to notifications',
    },
  });
});

export const unsubscribe = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  user.pushSubscription = undefined;
  user.preferences.notificationsEnabled = false;
  await user.save();

  res.json({
    success: true,
    message: 'Successfully unsubscribed from notifications',
  });
});

export const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const { email, preferences } = req.body;

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { preferences } },
    { new: true, runValidators: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user.preferences,
  });
});

export const getAlerts = asyncHandler(async (req: Request, res: Response) => {
  const { locationId, active = 'true' } = req.query;

  const query: any = {};
  if (locationId) query.locationId = locationId;
  if (active === 'true') query.isActive = true;

  const alerts = await Alert.find(query)
    .sort({ triggeredAt: -1 })
    .limit(50)
    .populate('locationId', 'name city country')
    .lean();

  res.json({
    success: true,
    data: alerts,
    meta: {
      count: alerts.length,
    },
  });
});

export const createAlert = asyncHandler(async (req: Request, res: Response) => {
  const { locationId, threshold, email } = req.body;

  // Verify location exists
  const location = await Location.findById(locationId);
  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Location not found',
    });
  }

  // Find user if email provided
  let userId = null;
  if (email) {
    const user = await User.findOne({ email });
    if (user) {
      userId = user._id;
      // Update user's default location
      user.preferences.defaultLocation = locationId;
      user.preferences.aqiThreshold = threshold;
      await user.save();
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Alert expires in 7 days

  const alert = await Alert.create({
    userId,
    locationId,
    type: 'threshold',
    threshold,
    currentAqi: 0, // Will be updated when triggered
    message: `Alert set for AQI threshold of ${threshold}`,
    isActive: true,
    triggeredAt: new Date(),
    expiresAt,
  });

  res.status(201).json({
    success: true,
    data: alert,
    message: 'Alert created successfully',
  });
});

export const acknowledgeAlert = asyncHandler(async (req: Request, res: Response) => {
  const { alertId } = req.params;

  const alert = await Alert.findByIdAndUpdate(
    alertId,
    {
      isActive: false,
      acknowledgedAt: new Date(),
    },
    { new: true }
  );

  if (!alert) {
    return res.status(404).json({
      success: false,
      error: 'Alert not found',
    });
  }

  res.json({
    success: true,
    data: alert,
  });
});
