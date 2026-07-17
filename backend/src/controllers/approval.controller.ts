import { Request, Response, NextFunction } from 'express';
import { ApprovalService } from '../services/approval.service';
import ApprovalRequest from '../models/ApprovalRequest';
import mongoose from 'mongoose';

class ApprovalController {
  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { action, actionDetails, trustLogId, policyId } = req.body;

      const request = await ApprovalService.createApprovalRequest(
        user._id,
        action,
        actionDetails,
        new mongoose.Types.ObjectId(trustLogId),
        new mongoose.Types.ObjectId(policyId)
      );

      res.status(201).json({ request });
    } catch (error) {
      next(error);
    }
  }

  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { status, limit = 50, skip = 0 } = req.query;

      const query: any = {
        $or: [
          { requesterId: user._id },
          { 'approvers.userId': user._id },
        ],
      };

      if (status) {
        query.status = status;
      }

      const requests = await ApprovalRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .skip(Number(skip))
        .populate('requesterId', 'email firstName lastName')
        .populate('approvers.userId', 'email firstName lastName');

      const total = await ApprovalRequest.countDocuments(query);

      res.json({ requests, total });
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;

      const requests = await ApprovalService.getPendingRequestsForUser(user._id);

      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }

  async getRequestDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { requestId } = req.params;

      const request = await ApprovalRequest.findById(requestId)
        .populate('requesterId', 'email firstName lastName')
        .populate('approvers.userId', 'email firstName lastName')
        .populate('trustLogId');

      if (!request) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      res.json({ request });
    } catch (error) {
      next(error);
    }
  }

  async approveRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { comments } = req.body;

      const result = await ApprovalService.approveRequest(
        new mongoose.Types.ObjectId(requestId),
        user._id,
        comments
      );

      res.json({
        message: result.approved ? 'Request approved' : 'Approval recorded',
        approved: result.approved,
        request: result.request,
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { comments } = req.body;

      const request = await ApprovalService.rejectRequest(
        new mongoose.Types.ObjectId(requestId),
        user._id,
        comments
      );

      res.json({ message: 'Request rejected', request });
    } catch (error) {
      next(error);
    }
  }

  async useBreakGlass(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { reason } = req.body;

      const request = await ApprovalService.useBreakGlass(
        new mongoose.Types.ObjectId(requestId),
        user._id,
        reason
      );

      res.json({ message: 'Break-glass used', request });
    } catch (error) {
      next(error);
    }
  }

  async delegateRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { requestId } = req.params;
      const { delegateToUserId, reason } = req.body;

      if (!delegateToUserId) {
        return res.status(400).json({ error: 'delegateToUserId is required' });
      }

      const request = await ApprovalRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({ error: 'Approval request not found' });
      }

      const isApprover = request.approvers?.some(
        (a: any) => a.userId?.toString() === user._id.toString()
      );
      if (!isApprover && user.role !== 'admin') {
        return res.status(403).json({ error: 'Only existing approvers or admins can delegate' });
      }

      if (!request.approvers) request.approvers = [];
      request.approvers.push({
        userId: new mongoose.Types.ObjectId(delegateToUserId),
        status: 'pending',
        delegatedBy: user._id,
        delegatedReason: reason,
        addedAt: new Date(),
      } as any);

      if (!request.escalations) request.escalations = [];
      request.escalations.push({
        level: 1,
        escalatedTo: [new mongoose.Types.ObjectId(delegateToUserId)],
        reason: `Delegated by ${user.email}: ${reason}`,
        escalatedAt: new Date(),
      } as any);

      await (request as any).save();
      res.json({ message: 'Request delegated successfully', request });
    } catch (error) {
      next(error);
    }
  }

  async escalateRequest(req: Request, res: Response, next: NextFunction) {    try {
      const { requestId } = req.params;
      const { level, escalatedTo, reason } = req.body;

      const request = await ApprovalService.escalateRequest(
        new mongoose.Types.ObjectId(requestId),
        level,
        escalatedTo.map((id: string) => new mongoose.Types.ObjectId(id)),
        reason
      );

      res.json({ message: 'Request escalated', request });
    } catch (error) {
      next(error);
    }
  }

  async getEscalations(req: Request, res: Response, next: NextFunction) {
    try {
      const requests = await ApprovalRequest.find({
        escalations: { $exists: true, $ne: [] },
      })
        .sort({ createdAt: -1 })
        .limit(50);

      res.json({ requests });
    } catch (error) {
      next(error);
    }
  }

  async sendNotifications(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getNotifications(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async markNotificationRead(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getApprovalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        ApprovalRequest.countDocuments({}),
        ApprovalRequest.countDocuments({ status: 'pending' }),
        ApprovalRequest.countDocuments({ status: 'approved' }),
        ApprovalRequest.countDocuments({ status: 'rejected' }),
      ]);

      res.json({ total, pending, approved, rejected });
    } catch (error) {
      next(error);
    }
  }

  async getUserApprovalStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const [requested, approved, rejected] = await Promise.all([
        ApprovalRequest.countDocuments({ requesterId: userId }),
        ApprovalRequest.countDocuments({
          'approvers.userId': userId,
          'approvers.status': 'approved',
        }),
        ApprovalRequest.countDocuments({
          'approvers.userId': userId,
          'approvers.status': 'rejected',
        }),
      ]);

      res.json({ requested, approved, rejected });
    } catch (error) {
      next(error);
    }
  }
}

export const approvalController = new ApprovalController();
