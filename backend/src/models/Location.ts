import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation extends Document {
  name: string;
  city: string;
  country: string;
  countryCode: string;
  coordinates: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  timezone: string;
  population?: number;
  isActive: boolean;
  metadata: {
    source: string;
    externalId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    countryCode: {
      type: String,
      required: true,
      uppercase: true,
      minlength: 2,
      maxlength: 3,
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (v: number[]) {
            return (
              v.length === 2 &&
              v[0] >= -180 &&
              v[0] <= 180 &&
              v[1] >= -90 &&
              v[1] <= 90
            );
          },
          message: 'Invalid coordinates',
        },
      },
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    population: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      source: {
        type: String,
        required: true,
        default: 'openaq',
      },
      externalId: String,
    },
  },
  {
    timestamps: true,
  }
);

// Geospatial index for location queries
LocationSchema.index({ coordinates: '2dsphere' });

// Compound index for search
LocationSchema.index({ city: 'text', name: 'text', country: 'text' });

// Index for active locations
LocationSchema.index({ isActive: 1 });

export const Location = mongoose.model<ILocation>('Location', LocationSchema);
