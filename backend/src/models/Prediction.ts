import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPredictionPoint {
  timestamp: Date;
  aqi: number;
  aqiLower: number;
  aqiUpper: number;
}

export interface IPrediction extends Document {
  locationId: Types.ObjectId;
  generatedAt: Date;
  modelVersion: string;
  forecastHorizon: number;
  predictions: IPredictionPoint[];
  confidence: number;
  inputFeatures: {
    historicalHours: number;
    includesWeather: boolean;
  };
  metadata: {
    modelType: string;
    trainingDataPoints: number;
    mape?: number;
  };
  expiresAt: Date;
  createdAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    modelVersion: {
      type: String,
      required: true,
      default: '1.0.0',
    },
    forecastHorizon: {
      type: Number,
      required: true,
      default: 24,
    },
    predictions: [
      {
        timestamp: {
          type: Date,
          required: true,
        },
        aqi: {
          type: Number,
          required: true,
          min: 0,
          max: 500,
        },
        aqiLower: {
          type: Number,
          required: true,
          min: 0,
        },
        aqiUpper: {
          type: Number,
          required: true,
          max: 600,
        },
      },
    ],
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },
    inputFeatures: {
      historicalHours: {
        type: Number,
        default: 168, // 7 days
      },
      includesWeather: {
        type: Boolean,
        default: false,
      },
    },
    metadata: {
      modelType: {
        type: String,
        default: 'prophet',
      },
      trainingDataPoints: Number,
      mape: Number,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for fetching latest prediction
PredictionSchema.index({ locationId: 1, generatedAt: -1 });

// TTL index for automatic expiration
PredictionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
