import mongoose, { Document, Schema } from 'mongoose';

export interface IPolicyCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: any;
}

export interface IPolicyRule {
  name: string;
  conditions: IPolicyCondition[];
  logicOperator: 'AND' | 'OR';
  requiredTrustScore: number;
  authMethods: string[];
  mfaRequired: boolean;
  approvalRequired: boolean;
  approvalConfig?: {
    type: 'm-of-n' | 'weighted' | 'hierarchy' | 'break-glass';
    approvers: Array<{
      userId: mongoose.Types.ObjectId;
      weight?: number;
      level?: number;
    }>;
    requiredApprovals?: number;
    requiredWeight?: number;
    expirationMinutes: number;
    escalationConfig?: {
      enabled: boolean;
      levels: Array<{
        delayMinutes: number;
        escalateTo: mongoose.Types.ObjectId[];
      }>;
    };
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface IPolicy extends Document {
  name: string;
  description: string;
  category: 'authentication' | 'authorization' | 'data-access' | 'admin' | 'financial' | 'custom';
  priority: number;
  enabled: boolean;
  rules: IPolicyRule[];
  fallbackAction: 'allow' | 'deny' | 'step-up' | 'approval';
  notificationChannels: Array<'email' | 'sms' | 'push' | 'slack'>;
  auditLevel: 'minimal' | 'standard' | 'detailed' | 'verbose';
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  version: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  appliesTo: {
    userIds?: mongoose.Types.ObjectId[];
    roles?: string[];
    departments?: string[];
    all?: boolean;
  };
  exceptions: Array<{
    userId: mongoose.Types.ObjectId;
    reason: string;
    expiresAt?: Date;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
  }>;
  metadata: {
    tags: string[];
    customFields: Map<string, any>;
  };
  statistics: {
    timesTriggered: number;
    timesApproved: number;
    timesRejected: number;
    averageApprovalTime: number;
    lastTriggered?: Date;
  };
}

const PolicySchema = new Schema<IPolicy>({
  name: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data-access', 'admin', 'financial', 'custom'],
    required: true,
    index: true
  },
  priority: {
    type: Number,
    required: true,
    default: 100,
    index: true
  },
  enabled: {
    type: Boolean,
    default: true,
    index: true
  },
  rules: [{
    name: {
      type: String,
      required: true
    },
    conditions: [{
      field: { type: String, required: true },
      operator: {
        type: String,
        enum: ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'in', 'nin', 'contains', 'regex'],
        required: true
      },
      value: { type: Schema.Types.Mixed, required: true }
    }],
    logicOperator: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND'
    },
    requiredTrustScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    authMethods: [{ type: String }],
    mfaRequired: {
      type: Boolean,
      default: false
    },
    approvalRequired: {
      type: Boolean,
      default: false
    },
    approvalConfig: {
      type: {
        type: String,
        enum: ['m-of-n', 'weighted', 'hierarchy', 'break-glass']
      },
      approvers: [{
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        weight: Number,
        level: Number
      }],
      requiredApprovals: Number,
      requiredWeight: Number,
      expirationMinutes: {
        type: Number,
        default: 60
      },
      escalationConfig: {
        enabled: {
          type: Boolean,
          default: false
        },
        levels: [{
          delayMinutes: {
            type: Number,
            required: true
          },
          escalateTo: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
          }]
        }]
      }
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  fallbackAction: {
    type: String,
    enum: ['allow', 'deny', 'step-up', 'approval'],
    default: 'deny'
  },
  notificationChannels: [{
    type: String,
    enum: ['email', 'sms', 'push', 'slack']
  }],
  auditLevel: {
    type: String,
    enum: ['minimal', 'standard', 'detailed', 'verbose'],
    default: 'standard'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: Number,
    default: 1
  },
  effectiveFrom: {
    type: Date,
    default: Date.now,
    index: true
  },
  effectiveUntil: {
    type: Date,
    index: true
  },
  appliesTo: {
    userIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    roles: [String],
    departments: [String],
    all: {
      type: Boolean,
      default: false
    }
  },
  exceptions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    expiresAt: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  metadata: {
    tags: [String],
    customFields: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  statistics: {
    timesTriggered: {
      type: Number,
      default: 0
    },
    timesApproved: {
      type: Number,
      default: 0
    },
    timesRejected: {
      type: Number,
      default: 0
    },
    averageApprovalTime: {
      type: Number,
      default: 0
    },
    lastTriggered: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
PolicySchema.index({ category: 1, enabled: 1, priority: -1 });
PolicySchema.index({ effectiveFrom: 1, effectiveUntil: 1 });
PolicySchema.index({ 'appliesTo.userIds': 1 });
PolicySchema.index({ 'appliesTo.roles': 1 });

// Method to check if policy applies to a user
PolicySchema.methods.appliesToUser = function(
  userId: mongoose.Types.ObjectId,
  userRoles: string[],
  userDepartment: string
): boolean {
  if (this.appliesTo.all) {
    return true;
  }

  // Check exceptions
  const hasException = this.exceptions.some(
    (ex: any) => 
      ex.userId.equals(userId) && 
      (!ex.expiresAt || ex.expiresAt > new Date())
  );
  if (hasException) {
    return false;
  }

  // Check user IDs
  if (this.appliesTo.userIds && this.appliesTo.userIds.length > 0) {
    if (this.appliesTo.userIds.some((id: mongoose.Types.ObjectId) => id.equals(userId))) {
      return true;
    }
  }

  // Check roles
  if (this.appliesTo.roles && this.appliesTo.roles.length > 0) {
    if (this.appliesTo.roles.some((role: string) => userRoles.includes(role))) {
      return true;
    }
  }

  // Check departments
  if (this.appliesTo.departments && this.appliesTo.departments.length > 0) {
    if (this.appliesTo.departments.includes(userDepartment)) {
      return true;
    }
  }

  return false;
};

// Method to evaluate policy conditions
PolicySchema.methods.evaluateConditions = function(contextData: any): boolean {
  for (const rule of this.rules) {
    if (!rule.enabled) continue;

    const conditionResults = rule.conditions.map((condition: IPolicyCondition) => {
      const fieldValue = this.getNestedValue(contextData, condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });

    const ruleMatches = rule.logicOperator === 'AND'
      ? conditionResults.every(r => r)
      : conditionResults.some(r => r);

    if (ruleMatches) {
      return true;
    }
  }

  return false;
};

// Helper to get nested object value
PolicySchema.methods.getNestedValue = function(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

// Helper to evaluate a single condition
PolicySchema.methods.evaluateCondition = function(
  fieldValue: any,
  operator: string,
  conditionValue: any
): boolean {
  switch (operator) {
    case 'eq':
      return fieldValue === conditionValue;
    case 'ne':
      return fieldValue !== conditionValue;
    case 'gt':
      return fieldValue > conditionValue;
    case 'gte':
      return fieldValue >= conditionValue;
    case 'lt':
      return fieldValue < conditionValue;
    case 'lte':
      return fieldValue <= conditionValue;
    case 'in':
      return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
    case 'nin':
      return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
    case 'contains':
      return typeof fieldValue === 'string' && fieldValue.includes(conditionValue);
    case 'regex':
      return new RegExp(conditionValue).test(fieldValue);
    default:
      return false;
  }
};

export default mongoose.model<IPolicy>('Policy', PolicySchema);
