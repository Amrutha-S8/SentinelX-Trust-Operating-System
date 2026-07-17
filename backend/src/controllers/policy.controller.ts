import { Request, Response, NextFunction } from 'express';
import Policy from '../models/Policy';
import mongoose from 'mongoose';

class PolicyController {
  async createPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const policyData = req.body;

      const policy = new Policy({
        ...policyData,
        createdBy: user._id,
        updatedBy: user._id,
      });

      await policy.save();

      res.status(201).json({ policy });
    } catch (error) {
      next(error);
    }
  }

  async getPolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, enabled } = req.query;

      const query: any = {};
      if (category) query.category = category;
      if (enabled !== undefined) query.enabled = enabled === 'true';

      const policies = await Policy.find(query).sort({ priority: -1 });

      res.json({ policies });
    } catch (error) {
      next(error);
    }
  }

  async getPolicyDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      res.json({ policy });
    } catch (error) {
      next(error);
    }
  }

  async updatePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { policyId } = req.params;
      const updates = req.body;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      Object.assign(policy, updates);
      policy.updatedBy = user._id;
      policy.version += 1;

      await policy.save();

      res.json({ policy });
    } catch (error) {
      next(error);
    }
  }

  async deletePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      await Policy.findByIdAndDelete(policyId);

      res.json({ message: 'Policy deleted' });
    } catch (error) {
      next(error);
    }
  }

  async enablePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      await Policy.findByIdAndUpdate(policyId, { enabled: true });

      res.json({ message: 'Policy enabled' });
    } catch (error) {
      next(error);
    }
  }

  async disablePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      await Policy.findByIdAndUpdate(policyId, { enabled: false });

      res.json({ message: 'Policy disabled' });
    } catch (error) {
      next(error);
    }
  }

  async testPolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;
      const { testData } = req.body;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      const matches = policy.evaluateConditions(testData);

      res.json({ matches, policy: policy.name });
    } catch (error) {
      next(error);
    }
  }

  async evaluatePolicies(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, userRoles, userDepartment, contextData } = req.body;

      const policies = await Policy.find({ enabled: true }).sort({ priority: -1 });

      const applicablePolicies = policies.filter((policy) =>
        policy.appliesToUser(
          new mongoose.Types.ObjectId(userId),
          userRoles,
          userDepartment
        )
      );

      const matchedPolicies = applicablePolicies.filter((policy) =>
        policy.evaluateConditions(contextData)
      );

      res.json({
        applicablePolicies: applicablePolicies.length,
        matchedPolicies: matchedPolicies.map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          priority: p.priority,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  async addException(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      const { policyId } = req.params;
      const { userId, reason, expiresAt } = req.body;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      policy.exceptions.push({
        userId: new mongoose.Types.ObjectId(userId),
        reason,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        createdAt: new Date(),
        createdBy: user._id,
      });

      await policy.save();

      res.json({ message: 'Exception added', policy });
    } catch (error) {
      next(error);
    }
  }

  async removeException(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId, exceptionId } = req.params;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      policy.exceptions = policy.exceptions.filter(
        (ex: any) => ex._id?.toString() !== exceptionId
      );

      await policy.save();

      res.json({ message: 'Exception removed' });
    } catch (error) {
      next(error);
    }
  }

  async getExceptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      const policy = await Policy.findById(policyId).populate('exceptions.userId', 'email firstName lastName');

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      res.json({ exceptions: policy.exceptions });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async applyTemplate(req: Request, res: Response, next: NextFunction) {
    res.status(501).json({ error: 'Not implemented' });
  }

  async getPolicyStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { policyId } = req.params;

      const policy = await Policy.findById(policyId);

      if (!policy) {
        return res.status(404).json({ error: 'Policy not found' });
      }

      res.json({ statistics: policy.statistics });
    } catch (error) {
      next(error);
    }
  }

  async getOverviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [total, enabled, disabled] = await Promise.all([
        Policy.countDocuments({}),
        Policy.countDocuments({ enabled: true }),
        Policy.countDocuments({ enabled: false }),
      ]);

      res.json({ total, enabled, disabled });
    } catch (error) {
      next(error);
    }
  }
}

export const policyController = new PolicyController();
