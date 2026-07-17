import ApprovalRequest, { IApprovalRequest, IApprover } from '../models/ApprovalRequest';
import Policy, { IPolicy } from '../models/Policy';
import User from '../models/User';
import { logger } from '../config/logger';
import mongoose from 'mongoose';

export class ApprovalService {
  // Create an approval request based on policy
  static async createApprovalRequest(
    requesterId: mongoose.Types.ObjectId,
    action: string,
    actionDetails: any,
    trustLogId: mongoose.Types.ObjectId,
    policyId: mongoose.Types.ObjectId
  ): Promise<IApprovalRequest> {
    const policy = await Policy.findById(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }

    // Find applicable rule with approval config
    const rule = policy.rules.find((r) => r.enabled && r.approvalRequired);
    if (!rule || !rule.approvalConfig) {
      throw new Error('No approval configuration found in policy');
    }

    const config = rule.approvalConfig;

    // Prepare approvers
    const approvers: IApprover[] = config.approvers.map((a) => ({
      userId: a.userId,
      weight: a.weight || 1,
      status: 'pending' as const,
    }));

    // Calculate expiration
    const expiresAt = new Date(Date.now() + config.expirationMinutes * 60 * 1000);

    const approvalRequest = new ApprovalRequest({
      requesterId,
      action,
      actionDetails,
      trustLogId,
      policyId,
      policyType: config.type,
      approvers,
      requiredApprovals: config.requiredApprovals || 1,
      requiredWeight: config.requiredWeight || 0,
      expiresAt,
    });

    await approvalRequest.save();

    // Send notifications
    await this.sendNotifications(approvalRequest);

    // Schedule escalation if configured
    if (config.escalationConfig?.enabled) {
      await this.scheduleEscalations(approvalRequest, config.escalationConfig);
    }

    return approvalRequest;
  }

  // Approve a request
  static async approveRequest(
    requestId: mongoose.Types.ObjectId,
    approverId: mongoose.Types.ObjectId,
    comments?: string
  ): Promise<{ approved: boolean; request: IApprovalRequest }> {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    if (new Date() > request.expiresAt) {
      request.status = 'expired';
      await request.save();
      throw new Error('Request has expired');
    }

    // Find approver
    const approver = request.approvers.find((a) => a.userId.equals(approverId));
    if (!approver) {
      throw new Error('User is not an approver for this request');
    }

    if (approver.status !== 'pending') {
      throw new Error('User has already responded');
    }

    // Update approver status
    approver.status = 'approved';
    approver.respondedAt = new Date();
    if (comments) {
      approver.comments = comments;
    }

    // Recalculate approval counts
    request.updateApprovalCounts();

    // Check if threshold is met
    const thresholdMet = request.isApprovalThresholdMet();

    if (thresholdMet) {
      request.status = 'approved';
      request.resolvedAt = new Date();
    }

    await request.save();

    return {
      approved: thresholdMet,
      request,
    };
  }

  // Reject a request
  static async rejectRequest(
    requestId: mongoose.Types.ObjectId,
    approverId: mongoose.Types.ObjectId,
    comments?: string
  ): Promise<IApprovalRequest> {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    // Find approver
    const approver = request.approvers.find((a) => a.userId.equals(approverId));
    if (!approver) {
      throw new Error('User is not an approver for this request');
    }

    if (approver.status !== 'pending') {
      throw new Error('User has already responded');
    }

    // Update approver status
    approver.status = 'rejected';
    approver.respondedAt = new Date();
    if (comments) {
      approver.comments = comments;
    }

    // Mark request as rejected
    request.status = 'rejected';
    request.resolvedAt = new Date();

    await request.save();

    return request;
  }

  // Use break-glass procedure
  static async useBreakGlass(
    requestId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId,
    reason: string
  ): Promise<IApprovalRequest> {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not pending');
    }

    // Verify user has break-glass permission
    const user = await User.findById(userId);
    if (!user || !['admin', 'security-admin'].includes(user.role)) {
      throw new Error('User does not have break-glass permission');
    }

    // Apply break-glass
    request.breakGlassUsed = true;
    request.breakGlassBy = userId;
    request.breakGlassReason = reason;
    request.breakGlassAt = new Date();
    request.status = 'break-glass-used';
    request.resolvedAt = new Date();

    await request.save();

    logger.warn(`Break-glass used for request ${requestId} by user ${userId}:${reason}`);

    return request;
  }

  // Escalate request
  static async escalateRequest(
    requestId: mongoose.Types.ObjectId,
    level: number,
    escalatedTo: mongoose.Types.ObjectId[],
    reason: string
  ): Promise<IApprovalRequest> {
    const request = await ApprovalRequest.findById(requestId);
    if (!request) {
      throw new Error('Approval request not found');
    }

    request.escalations.push({
      level,
      escalatedAt: new Date(),
      escalatedTo,
      reason,
    });

    // Add escalated users as approvers if not already
    for (const userId of escalatedTo) {
      const existingApprover = request.approvers.find((a) => a.userId.equals(userId));
      if (!existingApprover) {
        request.approvers.push({
          userId,
          weight: 1,
          status: 'pending',
        });
      }
    }

    await request.save();

    // Send notifications to escalated users
    await this.sendEscalationNotifications(request, escalatedTo, level);

    return request;
  }

  // Send notifications
  private static async sendNotifications(request: IApprovalRequest): Promise<void> {
    // In production, this would integrate with email/SMS/push notification services
    const approverIds = request.approvers.map((a) => a.userId);

    for (const approverId of approverIds) {
      request.notificationsSent.push({
        userId: approverId,
        channel: 'email',
        sentAt: new Date(),
        delivered: false, // Would be updated by notification service callback
      });
    }

    await request.save();

    logger.info(`Notifications sent for approval request ${request._id}`);
  }

  // Send escalation notifications
  private static async sendEscalationNotifications(
    request: IApprovalRequest,
    userIds: mongoose.Types.ObjectId[],
    level: number
  ): Promise<void> {
    for (const userId of userIds) {
      request.notificationsSent.push({
        userId,
        channel: 'email',
        sentAt: new Date(),
        delivered: false,
      });
    }

    await request.save();

    logger.info(`Escalation notifications sent (level ${level}) for request ${request._id}`);
  }

  // Schedule escalations
  private static async scheduleEscalations(
    request: IApprovalRequest,
    escalationConfig: any
  ): Promise<void> {
    // In production, this would use a job queue like Bull or agenda
    // For now, just log the scheduled escalations
    logger.info(`Escalations scheduled for request ${request._id}`, {
      levels: escalationConfig.levels.length,
    });

    // Placeholder for job scheduling
    // Would create delayed jobs for each escalation level
  }

  // Check and expire old requests (called by scheduled job)
  static async expireOldRequests(): Promise<number> {
    const result = await ApprovalRequest.updateMany(
      {
        status: 'pending',
        expiresAt: { $lt: new Date() },
      },
      {
        $set: { status: 'expired', resolvedAt: new Date() },
      }
    );

    return result.modifiedCount;
  }

  // Get pending requests for a user
  static async getPendingRequestsForUser(
    userId: mongoose.Types.ObjectId
  ): Promise<IApprovalRequest[]> {
    return ApprovalRequest.find({
      'approvers.userId': userId,
      'approvers.status': 'pending',
      status: 'pending',
      expiresAt: { $gt: new Date() },
    })
      .populate('requesterId', 'email firstName lastName')
      .populate('trustLogId')
      .sort({ createdAt: -1 });
  }
}
