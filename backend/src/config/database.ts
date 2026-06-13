import mongoose from 'mongoose';
import config from './index.js';
import logger from './logger.js';

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);

    logger.info(`MongoDB Connected: ${mongoose.connection.host}`);

    mongoose.connection.on('error', (err: Error) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

  } catch (error: unknown) {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
