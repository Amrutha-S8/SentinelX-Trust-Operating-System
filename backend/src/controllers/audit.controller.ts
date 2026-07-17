import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';
import mongoose from 'mongoose';

class AuditController {
  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, eventCategory, severity, startDate, endDate, limit, skip } = req.query;

      const filters: any = {};
      if (userId) filters.userId = new mongoose.Types.ObjectId(userId as string);
      if (eventCategory) filters.eventCategory = eventCategory;
      if (severity) filters.severity = severity;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = Number(limit);
      if (skip) filters.skip = Number(skip);

      const result = await AuditService.getLogs(filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getLogDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { logId } = req.params;
      const filters = { _id: new mongoose.Types.ObjectId(logId) };
      const result = await AuditService.getLogs(filters);
      
      if (result.logs.length === 0) {
        return res.status(404).json({ error: 'Log not found' });
      }

      res.json({ log: result.logs[0] });
    } catch (error) {
      next(error);
    }
  }

  async searchLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const searchParams = req.body;
      const logs = await AuditService.searchLogs(searchParams);
      res.json({ logs });
    } catch (error) {
      next(error);
    }
  }

  async verifyChain(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuditService.verifyChain();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async verifyRange(req: Request, res: Response, next: NextFunction) {
    try {
      const { startSequence, endSequence } = req.body;
      const result = await AuditService.verifyChain(startSequence, endSequence);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getVerificationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuditService.verifyChain();
      res.json({ verified: result.valid, ...result });
    } catch (error) {
      next(error);
    }
  }

  async exportLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { filters, format = 'json' } = req.body;
      const exported = await AuditService.exportLogs(filters, format as 'json' | 'csv');
      
      const contentType = format === 'csv' ? 'text/csv' : 'application/json';
      const filename = `audit-logs-${Date.now()}.${format}`;

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(exported);
    } catch (error) {
      next(error);
    }
  }

  async downloadExport(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getExports(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getAnalyticsOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await AuditService.getStatistics({
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
      });
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async getTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, startDate, endDate, interval = 'day' } = req.query;
      const timeline = await AuditService.getTimeline({
        userId: userId ? new mongoose.Types.ObjectId(userId as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
        interval: interval as 'hour' | 'day' | 'week',
      });
      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const stats = await AuditService.getStatistics({
        startDate: startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate as string) : new Date(),
      });
      res.json({ byCategory: stats.byCategory });
    } catch (error) {
      next(error);
    }
  }

  async getByUser(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getSecurityEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate, severity, limit } = req.query;
      const events = await AuditService.getSecurityEvents({
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        severity: severity as string,
        limit: limit ? Number(limit) : undefined,
      });
      res.json({ events });
    } catch (error) {
      next(error);
    }
  }

  async generateComplianceReport(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getReports(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }
}

export const auditController = new AuditController();
