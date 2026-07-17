import mongoose, { Document, Schema } from 'mongoose';

export interface IPasskeyCredential {
  credentialId: string;
  publicKey: string;
  signCount: number;
  deviceName: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface IOAuthAccount {
  provider: 'google' | 'github' | 'microsoft';
  providerId: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface ITrustedDevice {
  deviceId: string;
  name: string;
  firstSeen: Date;
  lastSeen: Date;
  trustFactor: number;
  userAgent?: string;
  ipAddress?: string;
}

export interface IBehavioralProfile {
  averageTypingSpeed: number;
  averageMouseSpeed: number;
  averageScrollSpeed: number;
  peakActivityTime: string;
  commonWeekdays: number[];
  sessionDuration: number;
  lastUpdated: Date;
}

export interface ITrustHistoryEntry {
  trustScore: number;
  timestamp: Date;
  action: string;
  reason: string;
}

export interface ISecurityAlert {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  resolved: boolean;
}

export interface IUser extends Document {
  email: string;
  username: string;
  passwordHash?: string;
  role: 'user' | 'manager' | 'admin' | 'security_admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  lastLocation?: {
    city: string;
    country: string;
    latitude: number;
    longitude: number;
  };
  lastLoginTime?: Date;
  totpSecret?: string;
  totpEnabled: boolean;
  passkeyCredentials: IPasskeyCredential[];
  backupCodes: string[];
  oauthAccounts: IOAuthAccount[];
  trustedDevices: ITrustedDevice[];
  behavioralProfile: IBehavioralProfile;
  trustHistory: ITrustHistoryEntry[];
  securityAlerts: ISecurityAlert[];
  phone?: string;
  currentTrustScore: number;
  failedLoginAttempts: number;
  lockoutUntil?: Date;
  managerId?: string;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true },
  passwordHash: { type: String },
  role: {
    type: String,
    enum: ['user', 'manager', 'admin', 'security_admin'],
    default: 'user',
  },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  lastLoginTime: { type: Date },
  lastLocation: {
    city: String,
    country: String,
    latitude: Number,
    longitude: Number,
  },
  totpSecret: { type: String },
  totpEnabled: { type: Boolean, default: false },
  passkeyCredentials: [{
    credentialId: { type: String, required: true },
    publicKey: { type: String, required: true },
    signCount: { type: Number, default: 0 },
    deviceName: { type: String, default: 'Unknown Device' },
    createdAt: { type: Date, default: Date.now },
    lastUsed: { type: Date, default: Date.now },
  }],
  backupCodes: [{ type: String }],
  oauthAccounts: [{
    provider: { type: String, enum: ['google', 'github', 'microsoft'] },
    providerId: String,
    email: String,
    name: String,
    accessToken: String,
    refreshToken: String,
    expiresAt: Date,
  }],
  trustedDevices: [{
    deviceId: String,
    name: String,
    firstSeen: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    trustFactor: { type: Number, default: 1.0 },
    userAgent: String,
    ipAddress: String,
  }],
  behavioralProfile: {
    averageTypingSpeed: { type: Number, default: 0 },
    averageMouseSpeed: { type: Number, default: 0 },
    averageScrollSpeed: { type: Number, default: 0 },
    peakActivityTime: { type: String, default: '09:00' },
    commonWeekdays: { type: [Number], default: [1, 2, 3, 4, 5] },
    sessionDuration: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  trustHistory: [{
    trustScore: Number,
    timestamp: { type: Date, default: Date.now },
    action: String,
    reason: String,
  }],
  securityAlerts: [{
    type: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high', 'critical'] },
    message: String,
    timestamp: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
  }],
  phone: { type: String },
  currentTrustScore: { type: Number, default: 75 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockoutUntil: { type: Date },
  managerId: { type: String },
}, {
  timestamps: true,
});

// Index for performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'oauthAccounts.provider': 1, 'oauthAccounts.providerId': 1 });

export const User = mongoose.model<IUser>('User', UserSchema);
