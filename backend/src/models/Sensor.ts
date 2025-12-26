import mongoose, { Schema, Types, Document } from 'mongoose';

export interface ISensor {
  locationId: Types.ObjectId;
  sensorId: string;
  name: string;
  type: 'reference' | 'low-cost' | 'mobile';
  manufacturer?: string;
  sensorModel?: string;
  parameters: string[];
  elevation?: number;
  isActive: boolean;
  lastReading?: Date;
  metadata: {
    source: string;
    externalId?: string;
    installDate?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SensorSchema = new Schema(
  {
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    sensorId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['reference', 'low-cost', 'mobile'],
      default: 'reference',
    },
    manufacturer: String,
    sensorModel: String,
    parameters: {
      type: [String],
      default: ['pm25', 'pm10', 'o3', 'no2', 'so2', 'co'],
    },
    elevation: {
      type: Number,
      min: -500,
      max: 10000,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastReading: Date,
    metadata: {
      source: {
        type: String,
        required: true,
        default: 'openaq',
      },
      externalId: String,
      installDate: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying active sensors by location
SensorSchema.index({ locationId: 1, isActive: 1 });

// Index for sensor lookup
SensorSchema.index({ sensorId: 1 });

export const Sensor = mongoose.model('Sensor', SensorSchema);
