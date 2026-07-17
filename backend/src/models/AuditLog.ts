import mongoose, { Document, Schema } from 'mongoose';
import crypto from 'crypto';

export interface IAuditLog extends Document {
  sequenceNumber: number;
  timestamp: Date;
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  eventType: string;
  eventCategory: 'auth' | 'trust' | 'approval' | 'admin' | 'data' | 'system' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  action: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'pending';
  metadata: any;
  contextData: {
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    location?: {
      country: string;
      city: string;
      lat: number;
      lon: number;
    };
  };
  changes?: {
    before: any;
    after: any;
    fields: string[];
  };
  securityContext: {
    trustScore?: number;
    riskLevel?: string;
    authMethod?: string;
    mfaUsed?: boolean;
    approvalUsed?: boolean;
  };
  correlationId?: string;
  parentEventId?: mongoose.Types.ObjectId;
  tags: string[];
  previousHash: string;
  currentHash: string;
  verified: boolean;
  exportedAt?: Date;
  retentionUntil: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  sequenceNumber: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    index: true
  },
  eventCategory: {
    type: String,
    enum: ['auth', 'trust', 'approval', 'admin', 'data', 'system', 'security'],
    required: true,
    index: true
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  resource: {
    type: String,
    required: true,
    index: true
  },
  resourceId: {
    type: String,
    index: true
  },
  outcome: {
    type: String,
    enum: ['success', 'failure', 'pending'],
    required: true,
    index: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  contextData: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    deviceFingerprint: String,
    location: {
      country: String,
      city: String,
      lat: Number,
      lon: Number
    }
  },
  changes: {
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    fields: [String]
  },
  securityContext: {
    trustScore: Number,
    riskLevel: String,
    authMethod: String,
    mfaUsed: Boolean,
    approvalUsed: Boolean
  },
  correlationId: {
    type: String,
    index: true
  },
  parentEventId: {
    type: Schema.Types.ObjectId,
    ref: 'AuditLog',
    index: true
  },
  tags: {
    type: [String],
    index: true
  },
  previousHash: {
    type: String,
    required: true
  },
  currentHash: {
    type: String,
    required: true,
    unique: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  exportedAt: Date,
  retentionUntil: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: false // We use our own timestamp field
});

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ eventCategory: 1, timestamp: -1 });
AuditLogSchema.index({ severity: 1, timestamp: -1 });
AuditLogSchema.index({ correlationId: 1, sequenceNumber: 1 });
AuditLogSchema.index({ retentionUntil: 1 });

// Pre-save hook to calculate hash
AuditLogSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Get previous log entry for hash chaining
    const previousLog = await mongoose.model('AuditLog')
      .findOne({})
      .sort({ sequenceNumber: -1 })
      .limit(1);

    // Set sequence number
    this.sequenceNumber = previousLog ? previousLog.sequenceNumber + 1 : 1;

    // Set previous hash (genesis block if first entry)
    this.previousHash = previousLog ? previousLog.currentHash : '0'.repeat(64);

    // Calculate current hash
    this.currentHash = this.calculateHash();
  }
  next();
});

// Method to calculate hash for this audit log entry
AuditLogSchema.methods.calculateHash = function(): string {
  const data = {
    sequenceNumber: this.sequenceNumber,
    timestamp: this.timestamp.toISOString(),
    userId: this.userId?.toString() || 'anonymous',
    eventType: this.eventType,
    eventCategory: this.eventCategory,
    action: this.action,
    resource: this.resource,
    outcome: this.outcome,
    metadata: JSON.stringify(this.metadata),
    previousHash: this.previousHash
  };

  const hashString = Object.entries(data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join('|');

  return crypto.createHash('sha256').update(hashString).digest('hex');
};

// Method to verify hash chain
AuditLogSchema.methods.verifyHash = function(): boolean {
  const calculatedHash = this.calculateHash();
  return calculatedHash === this.currentHash;
};

// Static method to verify entire chain
AuditLogSchema.statics.verifyChain = async function(
  startSequence?: number,
  endSequence?: number
): Promise<{ valid: boolean; brokenAt?: number; total: number; verified: number }> {
  const query: any = {};
  if (startSequence !== undefined) query.sequenceNumber = { $gte: startSequence };
  if (endSequence !== undefined) {
    query.sequenceNumber = query.sequenceNumber || {};
    query.sequenceNumber.$lte = endSequence;
  }

  const logs = await this.find(query).sort({ sequenceNumber: 1 });

  let previousHash = '0'.repeat(64);
  let verified = 0;

  for (const log of logs) {
    // Check if previous hash matches
    if (log.previousHash !== previousHash) {
      return {
        valid: false,
        brokenAt: log.sequenceNumber,
        total: logs.length,
        verified
      };
    }

    // Verify current hash
    if (!log.verifyHash()) {
      return {
        valid: false,
        brokenAt: log.sequenceNumber,
        total: logs.length,
        verified
      };
    }

    previousHash = log.currentHash;
    verified++;

    // Mark as verified
    if (!log.verified) {
      await this.updateOne(
        { _id: log._id },
        { $set: { verified: true } }
      );
    }
  }

  return {
    valid: true,
    total: logs.length,
    verified
  };
};

// Static method to create audit log entry
AuditLogSchema.statics.createEntry = async function(data: Partial<IAuditLog>): Promise<IAuditLog> {
  // Set retention period based on category and severity
  const retentionDays = this.getRetentionDays(data.eventCategory!, data.severity!);
  const retentionUntil = new Date();
  retentionUntil.setDate(retentionUntil.getDate() + retentionDays);

  const entry = new this({
    ...data,
    retentionUntil,
    timestamp: data.timestamp || new Date()
  });

  await entry.save();
  return entry;
};

// Helper to determine retention period
AuditLogSchema.statics.getRetentionDays = function(
  category: string,
  severity: string
): number {
  // Critical security events: 7 years
  if (severity === 'critical' || category === 'security') {
    return 365 * 7;
  }

  // Auth and approval events: 3 years
  if (category === 'auth' || category === 'approval') {
    return 365 * 3;
  }

  // Admin events: 2 years
  if (category === 'admin') {
    return 365 * 2;
  }

  // Default: 1 year
  return 365;
};

// Static method to export audit logs
AuditLogSchema.statics.exportLogs = async function(
  filters: any,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const logs = await this.find(filters)
    .sort({ sequenceNumber: 1 })
    .populate('userId', 'email firstName lastName')
    .lean();

  // Mark as exported
  await this.updateMany(
    { _id: { $in: logs.map((l: any) => l._id) } },
    { $set: { exportedAt: new Date() } }
  );

  if (format === 'json') {
    return JSON.stringify(logs, null, 2);
  } else {
    // CSV format
    if (logs.length === 0) return '';

    const headers = Object.keys(logs[0]).join(',');
    const rows = logs.map((log: any) =>
      Object.values(log).map(v =>
        typeof v === 'object' ? JSON.stringify(v) : v
      ).join(',')
    );

    return [headers, ...rows].join('\n');
  }
};

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
