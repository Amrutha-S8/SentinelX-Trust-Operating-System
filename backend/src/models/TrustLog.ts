import mongoose, { Document, Schema } from 'mongoose';

export interface ITrustLog extends Document {
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  action: string;
  trustScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contextData: {
    device: {
      fingerprint: string;
      type: string;
      os: string;
      browser: string;
      trusted: boolean;
    };
    network: {
      ipAddress: string;
      asn: string;
      country: string;
      vpnDetected: boolean;
      torDetected: boolean;
    };
    timing: {
      localTime: string;
      timezone: string;
      dayOfWeek: string;
      isWorkingHours: boolean;
    };
    environmental: {
      location: {
        lat: number;
        lon: number;
        city: string;
        country: string;
      };
      velocity: number; // km/h for impossible travel detection
      distanceFromLast: number; // km
    };
  };
  behavioralScore: number;
  behavioralSignals: {
    typingPattern: number[];
    mouseMovements: number[];
    navigationPattern: number[];
    similarityScore: number;
    anomalyDetected: boolean;
  };
  factors: Array<{
    name: string;
    weight: number;
    value: number;
    contribution: number;
  }>;
  authMethodsUsed: string[];
  stepUpRequired: boolean;
  stepUpCompleted: boolean;
  approvalRequired: boolean;
  approvalRequestId?: mongoose.Types.ObjectId;
  decision: 'allow' | 'deny' | 'pending' | 'step-up' | 'approval-required';
  explanation: string;
  confidenceScore: number;
}

const TrustLogSchema = new Schema<ITrustLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  trustScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true,
    index: true
  },
  contextData: {
    device: {
      fingerprint: { type: String, required: true },
      type: { type: String, required: true },
      os: { type: String, required: true },
      browser: { type: String, required: true },
      trusted: { type: Boolean, default: false }
    },
    network: {
      ipAddress: { type: String, required: true },
      asn: { type: String },
      country: { type: String },
      vpnDetected: { type: Boolean, default: false },
      torDetected: { type: Boolean, default: false }
    },
    timing: {
      localTime: { type: String, required: true },
      timezone: { type: String, required: true },
      dayOfWeek: { type: String, required: true },
      isWorkingHours: { type: Boolean, required: true }
    },
    environmental: {
      location: {
        lat: { type: Number },
        lon: { type: Number },
        city: { type: String },
        country: { type: String }
      },
      velocity: { type: Number, default: 0 },
      distanceFromLast: { type: Number, default: 0 }
    }
  },
  behavioralScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  behavioralSignals: {
    typingPattern: [{ type: Number }],
    mouseMovements: [{ type: Number }],
    navigationPattern: [{ type: Number }],
    similarityScore: { type: Number, min: 0, max: 1 },
    anomalyDetected: { type: Boolean, default: false }
  },
  factors: [{
    name: { type: String, required: true },
    weight: { type: Number, required: true },
    value: { type: Number, required: true },
    contribution: { type: Number, required: true }
  }],
  authMethodsUsed: [{ type: String }],
  stepUpRequired: {
    type: Boolean,
    default: false
  },
  stepUpCompleted: {
    type: Boolean,
    default: false
  },
  approvalRequired: {
    type: Boolean,
    default: false
  },
  approvalRequestId: {
    type: Schema.Types.ObjectId,
    ref: 'ApprovalRequest'
  },
  decision: {
    type: String,
    enum: ['allow', 'deny', 'pending', 'step-up', 'approval-required'],
    required: true,
    index: true
  },
  explanation: {
    type: String,
    required: true
  },
  confidenceScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
TrustLogSchema.index({ userId: 1, timestamp: -1 });
TrustLogSchema.index({ riskLevel: 1, timestamp: -1 });
TrustLogSchema.index({ decision: 1, timestamp: -1 });
TrustLogSchema.index({ 'contextData.network.ipAddress': 1 });
TrustLogSchema.index({ 'contextData.device.fingerprint': 1 });

export default mongoose.model<ITrustLog>('TrustLog', TrustLogSchema);
