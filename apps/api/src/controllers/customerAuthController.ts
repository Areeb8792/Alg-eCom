import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from '../services/customerAuthService.js';
import {
  customerRegisterSchema,
  customerLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/customerValidators.js';

export class CustomerAuthController {
  private authService: CustomerAuthService;

  constructor(authService?: CustomerAuthService) {
    this.authService = authService || new CustomerAuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = customerRegisterSchema.parse(req.body);
      const meta = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      };
      const result = await this.authService.register(parsed, meta);
      res.status(201).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = customerLoginSchema.parse(req.body);
      const meta = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      };
      const result = await this.authService.login(parsed, meta);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser?.userId;
      const refreshToken = req.body?.refreshToken;
      if (userId) {
        await this.authService.logout(userId, refreshToken);
      }
      res.status(200).json({
        data: { message: 'Successfully logged out.' }
      });
    } catch (err) {
      next(err);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = verifyEmailSchema.parse(req.body);
      const result = await this.authService.verifyEmail(parsed.token);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = resendVerificationSchema.parse(req.body);
      const result = await this.authService.resendVerification(parsed.email);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = forgotPasswordSchema.parse(req.body);
      const result = await this.authService.forgotPassword(parsed.email);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(parsed.token, parsed.password);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      next(err);
    }
  };
}
