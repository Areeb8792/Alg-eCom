import { OrderRepository, Order } from '../repositories/orderRepository.js';
import { CreateOrderInput } from '../validators/index.js';

export class OrderService {
  private repo = new OrderRepository();

  async createOrder(
    input: CreateOrderInput,
    idempotencyKey?: string
  ): Promise<{ order: Order; isDuplicate: boolean; cachedStatusCode?: number; cachedBody?: unknown }> {
    const requestHash = idempotencyKey ? this.repo.calculatePayloadHash(input) : undefined;

    return await this.repo.createOrderTransactional({
      customerEmail: input.customerEmail,
      customerName: input.customerName,
      items: input.items,
      idempotencyKey,
      requestHash
    });
  }

  async getOrderById(id: string): Promise<Order | null> {
    return await this.repo.findById(id);
  }

  async getOrderByReference(reference: string): Promise<Order | null> {
    return await this.repo.findByReference(reference);
  }
}
