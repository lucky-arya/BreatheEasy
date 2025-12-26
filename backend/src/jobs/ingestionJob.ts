import cron from 'node-cron';
import { ingestFromMultipleCountries } from '../services/ingestionService.js';
import { notificationService } from '../services/notificationService.js';
import config from '../config/index.js';
import logger from '../config/logger.js';

class IngestionJob {
  private task: cron.ScheduledTask | null = null;
  private isRunning: boolean = false;

  start(): void {
    if (!config.cron.enabled) {
      logger.info('Cron jobs are disabled');
      return;
    }

    // Schedule ingestion every 10 minutes
    this.task = cron.schedule(config.cron.ingestionInterval, async () => {
      if (this.isRunning) {
        logger.warn('Previous ingestion job still running, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        logger.info('Starting scheduled data ingestion...');

        await ingestFromMultipleCountries();

        logger.info('Scheduled ingestion completed');

        // Check for alerts after ingestion
        await notificationService.checkAndCreateAlerts();
        logger.info('Alert check completed');

      } catch (error) {
        logger.error('Scheduled ingestion failed:', error);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info(`Ingestion cron job scheduled: ${config.cron.ingestionInterval}`);
  }

  stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      logger.info('Ingestion cron job stopped');
    }
  }

  async runNow(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Ingestion job already running');
      return;
    }

    try {
      this.isRunning = true;
      logger.info('Running immediate data ingestion...');
      await ingestFromMultipleCountries();
      await notificationService.checkAndCreateAlerts();
      logger.info('Immediate ingestion completed');
    } catch (error) {
      logger.error('Immediate ingestion failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}

export const ingestionJob = new IngestionJob();
