import mongoose, { Document, Schema } from 'mongoose';

export interface IApprover {
  userId: mongoose.Types.ObjectId;
  weight: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  respondedAt?: Date;
  comments?: string;
}

export interface IApprovalRequest extends Document {
  requesterId: mongoose.Types.ObjectId;
  action: string;
  actionDetails: any;
  trustLogId: mongoose.Types.ObjectId;
  policyId: mongoose.Types.ObjectId;
  policyType: 'm-of-n' | 'weighted' | 'hierarchy' | 'break-glass';
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'break-glass-used';
  approvers: IApprover[];
  requiredApprovals: number;
  currentApprovals: number;
  weightedScore: number;
  requiredWeight: number;
  breakGlassUsed: boolean;
  breakGlassBy?: mongoose.Types.ObjectId;
  breakGlassReason?: string;
  breakGlassAt?: Date;
  createdAt: Date;
  expiresAt: Date;
  resolvedAt?: Date;
  notificationsSent: Array<{
    userId: mongoose.Types.ObjectId;
    channel: 'email' | 'sms' | 'push' | 'slack';
    sentAt: Date;
    delivered: boolean;
  }>;
  escalations: Array<{
    level: number;
    escalatedAt: Date;
    escalatedTo: mongoose.Types.ObjectId[];
    reason: string;
  }>;
}

const ApprovalRequestSchema = new Schema<IApprovalRequest>({
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    index: true
  },
  actionDetails: {
    type: Schema.Types.Mixed,
    required: true
  },
  trustLogId: {
    type: Schema.Types.ObjectId,
    ref: 'TrustLog',
    required: true,
    index: true
  },
  policyId: {
    type: Schema.Types.ObjectId,
    ref: 'Policy',
    required: true,
    index: true
  },
  policyType: {
    type: String,
    enum: ['m-of-n', 'weighted', 'hierarchy', 'break-glass'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired', 'break-glass-used'],
    default: 'pending',
    index: true
  },
  approvers: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    weight: {
      type: Number,
      default: 1,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired'],
      default: 'pending'
    },
    respondedAt: Date,
    comments: String
  }],
  requiredApprovals: {
    type: Number,
    required: true,
    min: 1
  },
  currentApprovals: {
    type: Number,
    default: 0,
    min: 0
  },
  weightedScore: {
    type: Number,
    default: 0,
    min: 0
  },
  requiredWeight: {
    type: Number,
    default: 0,
    min: 0
  },
  breakGlassUsed: {
    type: Boolean,
    default: false
  },
  breakGlassBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  breakGlassReason: String,
  breakGlassAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  resolvedAt: Date,
  notificationsSent: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'push', 'slack'],
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    delivered: {
      type: Boolean,
      default: false
    }
  }],
  escalations: [{
    level: {
      type: Number,
      required: true
    },
    escalatedAt: {
      type: Date,
      default: Date.now
    },
    escalatedTo: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    reason: String
  }]
}, {
  timestamps: true
});

// Indexes for efficient querying
ApprovalRequestSchema.index({ requesterId: 1, createdAt: -1 });
ApprovalRequestSchema.index({ status: 1, createdAt: -1 });
ApprovalRequestSchema.index({ 'approvers.userId': 1, status: 1 });
ApprovalRequestSchema.index({ expiresAt: 1, status: 1 });

// Virtual for checking if expired
ApprovalRequestSchema.virtual('isExpired').get(function() {
  return this.status === 'pending' && this.expiresAt < new Date();
});

// Method to check if approval threshold is met
ApprovalRequestSchema.methods.isApprovalThresholdMet = function(): boolean {
  if (this.policyType === 'weighted') {
    return this.weightedScore >= this.requiredWeight;
  }
  return this.currentApprovals >= this.requiredApprovals;
};

// Method to update approval counts
ApprovalRequestSchema.methods.updateApprovalCounts = function(): void {
  const approvedApprovers = this.approvers.filter(a => a.status === 'approved');
  this.currentApprovals = approvedApprovers.length;
  this.weightedScore = approvedApprovers.reduce((sum, a) => sum + a.weight, 0);
};

export default mongoose.model<IApprovalRequest>('ApprovalRequest', ApprovalRequestSchema);
