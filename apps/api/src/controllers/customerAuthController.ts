import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { CustomerAuthService } from '../services/customerAuthService.js';
import { config } from '../config/index.js';
import {
  customerRegisterSchema,
  customerLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema
} from '../validators/customerValidators.js';

const REFRESH_COOKIE_NAME = 'algions_refresh_token';
const CSRF_COOKIE_NAME = 'algions_csrf_token';

function setAuthCookies(res: Response, refreshToken?: string): string {
  const isProd = config.NODE_ENV === 'production';

  if (refreshToken) {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
  }

  const csrfToken = crypto.randomBytes(16).toString('hex');
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Accessible by client JS for double-submit header
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  return csrfToken;
}

function clearAuthCookies(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
  res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
}

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
      const csrfToken = setAuthCookies(res, result.refreshToken);
      res.status(201).json({
        data: {
          ...result,
          csrfToken
        }
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
      const csrfToken = setAuthCookies(res, result.refreshToken);
      res.status(200).json({
        data: {
          ...result,
          csrfToken
        }
      });
    } catch (err) {
      next(err);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      const rawToken = cookieRefreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];

      // CSRF protection: If client refreshed using HTTP-only cookie, verify matching double-submit CSRF header if present
      if (cookieRefreshToken && req.cookies?.[CSRF_COOKIE_NAME]) {
        const clientCsrf = req.headers['x-csrf-token'] || req.body?.csrfToken;
        if (clientCsrf && clientCsrf !== req.cookies[CSRF_COOKIE_NAME]) {
          res.status(403).json({
            error: {
              code: 'CSRF_VALIDATION_FAILED',
              message: 'Invalid CSRF token for authenticated session refresh.'
            }
          });
          return;
        }
      }

      const parsed = refreshTokenSchema.parse({ refreshToken: rawToken });
      const meta = {
        userAgent: req.get('user-agent'),
        ipAddress: req.ip
      };
      const result = await this.authService.rotateRefreshToken(parsed.refreshToken, meta);
      const csrfToken = setAuthCookies(res, result.refreshToken);

      res.status(200).json({
        data: {
          ...result,
          csrfToken
        }
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      const result = await this.authService.logout(userId, refreshToken);
      clearAuthCookies(res);
      res.status(200).json({
        data: result
      });
    } catch (err) {
      clearAuthCookies(res);
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
