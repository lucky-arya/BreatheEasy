import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAQReading extends Document {
  locationId: Types.ObjectId;
  sensorId?: Types.ObjectId;
  timestamp: Date;
  aqi: number;
  aqiCategory: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
  pollutants: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  };
  weather?: {
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    windDirection?: number;
    pressure?: number;
  };
  metadata: {
    source: string;
    quality: 'verified' | 'preliminary' | 'estimated';
  };
  createdAt: Date;
}

const AQReadingSchema = new Schema<IAQReading>(
  {
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    sensorId: {
      type: Schema.Types.ObjectId,
      ref: 'Sensor',
    },
    timestamp: {
      type: Date,
      required: true,
      index: true,
    },
    aqi: {
      type: Number,
      required: true,
      min: 0,
      max: 500,
    },
    aqiCategory: {
      type: String,
      enum: ['good', 'moderate', 'unhealthy_sensitive', 'unhealthy', 'very_unhealthy', 'hazardous'],
      required: true,
    },
    pollutants: {
      pm25: { type: Number, min: 0 },
      pm10: { type: Number, min: 0 },
      o3: { type: Number, min: 0 },
      no2: { type: Number, min: 0 },
      so2: { type: Number, min: 0 },
      co: { type: Number, min: 0 },
    },
    weather: {
      temperature: Number,
      humidity: { type: Number, min: 0, max: 100 },
      windSpeed: { type: Number, min: 0 },
      windDirection: { type: Number, min: 0, max: 360 },
      pressure: Number,
    },
    metadata: {
      source: {
        type: String,
        required: true,
        default: 'openaq',
      },
      quality: {
        type: String,
        enum: ['verified', 'preliminary', 'estimated'],
        default: 'preliminary',
      },
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    timeseries: {
      timeField: 'timestamp',
      metaField: 'locationId',
      granularity: 'minutes',
    },
  }
);

// Compound index for time-series queries (locationId + timestamp)
AQReadingSchema.index({ locationId: 1, timestamp: -1 });

// Index for recent readings
AQReadingSchema.index({ timestamp: -1 });

// Index for AQI range queries
AQReadingSchema.index({ aqi: 1, timestamp: -1 });

// TTL index to automatically delete old readings (optional - 90 days)
// AQReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

// Helper function to calculate AQI category
AQReadingSchema.pre('save', function (next) {
  if (this.aqi !== undefined) {
    if (this.aqi <= 50) this.aqiCategory = 'good';
    else if (this.aqi <= 100) this.aqiCategory = 'moderate';
    else if (this.aqi <= 150) this.aqiCategory = 'unhealthy_sensitive';
    else if (this.aqi <= 200) this.aqiCategory = 'unhealthy';
    else if (this.aqi <= 300) this.aqiCategory = 'very_unhealthy';
    else this.aqiCategory = 'hazardous';
  }
  next();
});

export const AQReading = mongoose.model<IAQReading>('AQReading', AQReadingSchema);
