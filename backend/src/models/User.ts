import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  preferences: {
    defaultLocation?: mongoose.Types.ObjectId;
    aqiThreshold: number;
    notificationsEnabled: boolean;
    timezone: string;
  };
  pushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  isActive: boolean;
  lastActive?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    name: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    preferences: {
      defaultLocation: {
        type: Schema.Types.ObjectId,
        ref: 'Location',
      },
      aqiThreshold: {
        type: Number,
        default: 100,
        min: 0,
        max: 500,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
    },
    pushSubscription: {
      endpoint: String,
      keys: {
        p256dh: String,
        auth: String,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActive: Date,
  },
  {
    timestamps: true,
  }
);

// Index for email lookup
UserSchema.index({ email: 1 });

// Index for notification queries
UserSchema.index({ 'preferences.notificationsEnabled': 1, isActive: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
