import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminRepository, AuditEvent } from '../repositories/adminRepository.js';
import { ProductRepository, Product } from '../repositories/productRepository.js';
import { config } from '../config/index.js';
import { UpdateProductInput, StockAdjustmentInput, AdminLoginInput } from '../validators/index.js';

export class AdminService {
  private adminRepo = new AdminRepository();
  private productRepo = new ProductRepository();

  async login(input: AdminLoginInput): Promise<{ token: string; user: { id: string; username: string; role: string } } | null> {
    const admin = await this.adminRepo.findByUsername(input.username);
    if (!admin) {
      return null;
    }

    const isMatch = await bcrypt.compare(input.password, admin.password_hash);
    if (!isMatch) {
      return null;
    }

    const payload = {
      userId: admin.id,
      username: admin.username,
      role: admin.role
    };

    const token = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '24h'
    });

    return {
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role
      }
    };
  }

  async updateProduct(
    id: string,
    updates: UpdateProductInput,
    actor: { id: string; username: string },
    correlationId?: string
  ): Promise<Product | null> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      return null;
    }

    const updated = await this.productRepo.updateProduct(id, updates);

    // Write audit event
    await this.adminRepo.createAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      action: 'PRODUCT_UPDATE',
      resourceType: 'PRODUCT',
      resourceId: id,
      beforeState: existing as unknown as Record<string, unknown>,
      afterState: updated as unknown as Record<string, unknown>,
      correlationId
    });

    return updated;
  }

  async adjustStock(
    id: string,
    input: StockAdjustmentInput,
    actor: { id: string; username: string },
    correlationId?: string
  ): Promise<Product | null> {
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      return null;
    }

    if (existing.stock + input.adjustment < 0) {
      throw new Error(`Stock adjustment of ${input.adjustment} would cause negative stock (current: ${existing.stock})`);
    }

    const updated = await this.productRepo.adjustStock(id, input.adjustment);

    // Write audit event
    await this.adminRepo.createAuditEvent({
      actorId: actor.id,
      actorUsername: actor.username,
      action: 'STOCK_ADJUSTMENT',
      resourceType: 'PRODUCT',
      resourceId: id,
      beforeState: { stock: existing.stock, reason: input.reason },
      afterState: { stock: updated?.stock, adjustment: input.adjustment, reason: input.reason },
      correlationId
    });

    return updated;
  }

  async getAuditEvents(limit = 50): Promise<AuditEvent[]> {
    return await this.adminRepo.getRecentAuditEvents(limit);
  }
}
