import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAlert extends Document {
  userId?: Types.ObjectId;
  locationId: Types.ObjectId;
  type: 'threshold' | 'forecast' | 'trend';
  severity: 'info' | 'warning' | 'critical';
  threshold: number;
  currentAqi: number;
  message: string;
  isActive: boolean;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['threshold', 'forecast', 'trend'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    currentAqi: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    triggeredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    acknowledgedAt: Date,
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

// Compound index for active alerts per location
AlertSchema.index({ locationId: 1, isActive: 1, triggeredAt: -1 });

// Compound index for user alerts
AlertSchema.index({ userId: 1, isActive: 1, triggeredAt: -1 });

// TTL index for automatic expiration
AlertSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Helper to determine severity based on AQI
AlertSchema.pre('save', function (next) {
  if (this.currentAqi <= 100) this.severity = 'info';
  else if (this.currentAqi <= 150) this.severity = 'warning';
  else this.severity = 'critical';
  next();
});

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
