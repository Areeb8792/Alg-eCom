import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService.js';
import { adminLoginSchema, updateProductSchema, stockAdjustmentSchema } from '../validators/index.js';

export class AdminController {
  private service = new AdminService();

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = adminLoginSchema.parse(req.body);
      const result = await this.service.login(input);

      if (!result) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid username or password.'
          }
        });
        return;
      }

      res.status(200).json({
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updates = updateProductSchema.parse(req.body);

      const actor = {
        id: req.adminUser!.userId,
        username: req.adminUser!.username
      };

      const updated = await this.service.updateProduct(id, updates, actor, req.correlationId);

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Product with ID "${id}" was not found.`
          }
        });
        return;
      }

      res.status(200).json({
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  adjustStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const input = stockAdjustmentSchema.parse(req.body);

      const actor = {
        id: req.adminUser!.userId,
        username: req.adminUser!.username
      };

      const updated = await this.service.adjustStock(id, input, actor, req.correlationId);

      if (!updated) {
        res.status(404).json({
          error: {
            code: 'NOT_FOUND',
            message: `Product with ID "${id}" was not found.`
          }
        });
        return;
      }

      res.status(200).json({
        data: updated
      });
    } catch (error) {
      next(error);
    }
  };

  getAuditEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const events = await this.service.getAuditEvents(limit);

      res.status(200).json({
        data: events
      });
    } catch (error) {
      next(error);
    }
  };
}
