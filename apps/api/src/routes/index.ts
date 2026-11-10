import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { ProductController } from '../controllers/productController.js';
import { OrderController } from '../controllers/orderController.js';
import { AdminController } from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/auth.js';

export const apiRouter = Router();

const healthController = new HealthController();
const productController = new ProductController();
const orderController = new OrderController();
const adminController = new AdminController();

// Health & Observability
apiRouter.get('/health/live', healthController.live);
apiRouter.get('/health/ready', healthController.ready);
apiRouter.get('/metrics', healthController.metrics);

// Catalog / Products
apiRouter.get('/products', productController.getAll);
apiRouter.get('/products/:id', productController.getById);

// Orders / Checkout
apiRouter.post('/orders', orderController.create);
apiRouter.get('/orders/:id', orderController.getById);

// Admin Operations
apiRouter.post('/admin/auth/login', adminController.login);
apiRouter.patch('/admin/products/:id', requireAdminAuth, adminController.updateProduct);
apiRouter.post('/admin/products/:id/stock-adjustments', requireAdminAuth, adminController.adjustStock);
apiRouter.get('/admin/audit-events', requireAdminAuth, adminController.getAuditEvents);
