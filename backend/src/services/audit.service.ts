import AuditLog, { IAuditLog } from '../models/AuditLog';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

export interface AuditEntry {
  userId?: mongoose.Types.ObjectId;
  sessionId?: string;
  eventType: string;
  eventCategory: 'auth' | 'trust' | 'approval' | 'admin' | 'data' | 'system' | 'security';
  severity: 'info' | 'warning' | 'error' | 'critical';
  action: string;
  resource: string;
  resourceId?: string;
  outcome: 'success' | 'failure' | 'pending';
  metadata?: any;
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
  securityContext?: {
    trustScore?: number;
    riskLevel?: string;
    authMethod?: string;
    mfaUsed?: boolean;
    approvalUsed?: boolean;
  };
  correlationId?: string;
  parentEventId?: mongoose.Types.ObjectId;
  tags?: string[];
}

export class AuditService {
  // Create a new audit log entry
  static async log(entry: AuditEntry): Promise<IAuditLog> {
    try {
      const auditLog = await AuditLog.createEntry(entry);
      return auditLog;
    } catch (error) {
      logger.error('Failed to create audit log entry:', error);
      throw error;
    }
  }

  // Verify the hash chain
  static async verifyChain(
    startSequence?: number,
    endSequence?: number
  ): Promise<{ valid: boolean; brokenAt?: number; total: number; verified: number }> {
    try {
      const result = await AuditLog.verifyChain(startSequence, endSequence);
      return result;
    } catch (error) {
      logger.error('Failed to verify audit chain:', error);
      throw error;
    }
  }

  // Get audit logs with filtering
  static async getLogs(filters: {
    userId?: mongoose.Types.ObjectId;
    eventCategory?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    skip?: number;
  }): Promise<{ logs: IAuditLog[]; total: number }> {
    const query: any = {};

    if (filters.userId) {
      query.userId = filters.userId;
    }

    if (filters.eventCategory) {
      query.eventCategory = filters.eventCategory;
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    const limit = filters.limit || 100;
    const skip = filters.skip || 0;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ sequenceNumber: -1 })
        .limit(limit)
        .skip(skip)
        .populate('userId', 'email firstName lastName'),
      AuditLog.countDocuments(query),
    ]);

    return { logs, total };
  }

  // Search audit logs
  static async searchLogs(searchParams: {
    text?: string;
    eventType?: string;
    action?: string;
    resource?: string;
    tags?: string[];
    limit?: number;
  }): Promise<IAuditLog[]> {
    const query: any = {};

    if (searchParams.text) {
      query.$text = { $search: searchParams.text };
    }

    if (searchParams.eventType) {
      query.eventType = new RegExp(searchParams.eventType, 'i');
    }

    if (searchParams.action) {
      query.action = new RegExp(searchParams.action, 'i');
    }

    if (searchParams.resource) {
      query.resource = new RegExp(searchParams.resource, 'i');
    }

    if (searchParams.tags && searchParams.tags.length > 0) {
      query.tags = { $in: searchParams.tags };
    }

    const limit = searchParams.limit || 50;

    const logs = await AuditLog.find(query)
      .sort({ sequenceNumber: -1 })
      .limit(limit)
      .populate('userId', 'email firstName lastName');

    return logs;
  }

  // Export audit logs
  static async exportLogs(
    filters: any,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    try {
      const exported = await AuditLog.exportLogs(filters, format);
      return exported;
    } catch (error) {
      logger.error('Failed to export audit logs:', error);
      throw error;
    }
  }

  // Get audit statistics
  static async getStatistics(timeRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalEvents: number;
    byCategory: any;
    bySeverity: any;
    byOutcome: any;
    securityEvents: number;
  }> {
    const query = {
      timestamp: {
        $gte: timeRange.startDate,
        $lte: timeRange.endDate,
      },
    };

    const [totalEvents, byCategory, bySeverity, byOutcome, securityEvents] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$eventCategory', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      AuditLog.aggregate([
        { $match: query },
        { $group: { _id: '$outcome', count: { $sum: 1 } } },
      ]),
      AuditLog.countDocuments({ ...query, eventCategory: 'security' }),
    ]);

    return {
      totalEvents,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      byOutcome: byOutcome.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      securityEvents,
    };
  }

  // Get timeline of events
  static async getTimeline(filters: {
    userId?: mongoose.Types.ObjectId;
    startDate: Date;
    endDate: Date;
    interval: 'hour' | 'day' | 'week';
  }): Promise<any[]> {
    const query: any = {
      timestamp: {
        $gte: filters.startDate,
        $lte: filters.endDate,
      },
    };

    if (filters.userId) {
      query.userId = filters.userId;
    }

    // Determine date format for grouping
    let dateFormat: any;
    switch (filters.interval) {
      case 'hour':
        dateFormat = {
          $dateToString: { format: '%Y-%m-%d %H:00', date: '$timestamp' },
        };
        break;
      case 'day':
        dateFormat = {
          $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
        };
        break;
      case 'week':
        dateFormat = {
          $dateToString: { format: '%Y-%U', date: '$timestamp' },
        };
        break;
    }

    const timeline = await AuditLog.aggregate([
      { $match: query },
      {
        $group: {
          _id: dateFormat,
          count: { $sum: 1 },
          criticalCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] },
          },
          errorCount: {
            $sum: { $cond: [{ $eq: ['$severity', 'error'] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return timeline;
  }

  // Get security events
  static async getSecurityEvents(filters: {
    startDate?: Date;
    endDate?: Date;
    severity?: string;
    limit?: number;
  }): Promise<IAuditLog[]> {
    const query: any = {
      eventCategory: 'security',
    };

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        query.timestamp.$lte = filters.endDate;
      }
    }

    if (filters.severity) {
      query.severity = filters.severity;
    }

    const limit = filters.limit || 100;

    const events = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'email firstName lastName');

    return events;
  }

  // Clean up old audit logs (respecting retention periods)
  static async cleanupExpiredLogs(): Promise<number> {
    const result = await AuditLog.deleteMany({
      retentionUntil: { $lt: new Date() },
    });

    logger.info(`Cleaned up ${result.deletedCount} expired audit logs`);
    return result.deletedCount;
  }
}
