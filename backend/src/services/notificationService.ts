import webpush from 'web-push';
import config from '../config/index.js';
import logger from '../config/logger.js';
import { User, Alert, Location } from '../models/index.js';

// Configure VAPID keys
if (config.vapid.publicKey && config.vapid.privateKey) {
  webpush.setVapidDetails(
    config.vapid.subject,
    config.vapid.publicKey,
    config.vapid.privateKey
  );
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}

class NotificationService {
  async sendPushNotification(
    subscription: webpush.PushSubscription,
    payload: PushPayload
  ): Promise<boolean> {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify(payload)
      );
      return true;
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Subscription expired or unsubscribed
        logger.info('Push subscription expired');
        return false;
      }
      logger.error('Push notification error:', error);
      return false;
    }
  }

  async notifyUsersOfAlert(alert: any): Promise<void> {
    try {
      // Get location details
      const location = await Location.findById(alert.locationId);
      if (!location) return;

      // Find users subscribed to this location or with global notifications
      const users = await User.find({
        $or: [
          { 'preferences.defaultLocation': alert.locationId },
          { 'preferences.notificationsEnabled': true },
        ],
        'preferences.aqiThreshold': { $lte: alert.currentAqi },
        pushSubscription: { $exists: true },
        isActive: true,
      });

      const payload: PushPayload = {
        title: `Air Quality Alert - ${location.city}`,
        body: alert.message,
        icon: '/icons/alert-icon.png',
        badge: '/icons/badge.png',
        data: {
          locationId: alert.locationId.toString(),
          aqi: alert.currentAqi,
          severity: alert.severity,
          url: `/location/${alert.locationId}`,
        },
      };

      for (const user of users) {
        if (user.pushSubscription) {
          const subscription: webpush.PushSubscription = {
            endpoint: user.pushSubscription.endpoint,
            keys: {
              p256dh: user.pushSubscription.keys.p256dh,
              auth: user.pushSubscription.keys.auth,
            },
          };

          const success = await this.sendPushNotification(subscription, payload);
          
          if (!success) {
            // Remove invalid subscription
            await User.findByIdAndUpdate(user._id, {
              $unset: { pushSubscription: 1 },
            });
          }
        }
      }

      logger.info(`Sent alert notifications to ${users.length} users`);
    } catch (error) {
      logger.error('Error notifying users:', error);
    }
  }

  async checkAndCreateAlerts(): Promise<void> {
    try {
      // Get users with notification preferences
      const users = await User.find({
        'preferences.notificationsEnabled': true,
        'preferences.defaultLocation': { $exists: true },
        isActive: true,
      }).populate('preferences.defaultLocation');

      for (const user of users) {
        if (!user.preferences.defaultLocation) continue;

        const locationId = user.preferences.defaultLocation;
        const threshold = user.preferences.aqiThreshold;

        // Get latest reading
        const latestReading = await (await import('../models/AQReading.js')).AQReading
          .findOne({ locationId })
          .sort({ timestamp: -1 });

        if (!latestReading) continue;

        // Check if AQI exceeds threshold
        if (latestReading.aqi >= threshold) {
          // Check for existing active alert
          const existingAlert = await Alert.findOne({
            userId: user._id,
            locationId,
            isActive: true,
          });

          if (!existingAlert) {
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 6);

            const alert = await Alert.create({
              userId: user._id,
              locationId,
              type: 'threshold',
              threshold,
              currentAqi: latestReading.aqi,
              message: `AQI has reached ${latestReading.aqi}, exceeding your threshold of ${threshold}`,
              triggeredAt: new Date(),
              expiresAt,
            });

            await this.notifyUsersOfAlert(alert);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking alerts:', error);
    }
  }
}

export const notificationService = new NotificationService();
