import { Request, Response, NextFunction } from 'express';
import { CustomerAuthService } from '../services/customerAuthService.js';
import {
  updateCustomerProfileSchema,
  customerPreferencesSchema,
  customerAddressSchema
} from '../validators/customerValidators.js';

export class CustomerUserController {
  private authService: CustomerAuthService;

  constructor(authService?: CustomerAuthService) {
    this.authService = authService || new CustomerAuthService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const profile = await this.authService.getProfile(userId);
      res.status(200).json({ data: profile });
    } catch (err) {
      next(err);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const parsed = updateCustomerProfileSchema.parse(req.body);
      const updated = await this.authService.updateProfile(userId, parsed);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const preferences = await this.authService.getPreferences(userId);
      res.status(200).json({ data: preferences });
    } catch (err) {
      next(err);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const parsed = customerPreferencesSchema.parse(req.body);
      const updated = await this.authService.updatePreferences(userId, parsed);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  };

  getAddresses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const addresses = await this.authService.getAddresses(userId);
      res.status(200).json({ data: addresses });
    } catch (err) {
      next(err);
    }
  };

  addAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const parsed = customerAddressSchema.parse(req.body);
      const address = await this.authService.addAddress(userId, parsed);
      res.status(201).json({ data: address });
    } catch (err) {
      next(err);
    }
  };

  updateAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const addressId = req.params.id;
      const parsed = customerAddressSchema.partial().parse(req.body);
      const updated = await this.authService.updateAddress(userId, addressId, parsed);
      res.status(200).json({ data: updated });
    } catch (err) {
      next(err);
    }
  };

  deleteAddress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.customerUser!.userId;
      const addressId = req.params.id;
      const result = await this.authService.deleteAddress(userId, addressId);
      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  };
}
