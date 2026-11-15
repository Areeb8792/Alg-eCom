import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { ProductController } from '../controllers/productController.js';
import { OrderController } from '../controllers/orderController.js';
import { AdminController } from '../controllers/adminController.js';
import { CustomerAuthController } from '../controllers/customerAuthController.js';
import { CustomerUserController } from '../controllers/customerUserController.js';
import { requireAdminAuth, requireCustomerAuth, optionalCustomerAuth } from '../middleware/auth.js';
import { orderLookupLimiter } from '../middleware/rateLimiter.js';

export const apiRouter = Router();

const healthController = new HealthController();
const productController = new ProductController();
const orderController = new OrderController();
const adminController = new AdminController();
const customerAuthController = new CustomerAuthController();
const customerUserController = new CustomerUserController();

// Health & Observability
apiRouter.get('/health/live', healthController.live);
apiRouter.get('/health/ready', healthController.ready);
apiRouter.get('/metrics', healthController.metrics);

// Customer Authentication & Identity (Season 04)
apiRouter.post('/auth/register', customerAuthController.register);
apiRouter.post('/auth/login', customerAuthController.login);
apiRouter.post('/auth/refresh', customerAuthController.refreshToken);
apiRouter.post('/auth/logout', requireCustomerAuth, customerAuthController.logout);
apiRouter.post('/auth/verify-email', customerAuthController.verifyEmail);
apiRouter.post('/auth/resend-verification', customerAuthController.resendVerification);
apiRouter.post('/auth/forgot-password', customerAuthController.forgotPassword);
apiRouter.post('/auth/reset-password', customerAuthController.resetPassword);

// Customer Profile, Onboarding Preferences & Address Book
apiRouter.get('/user/profile', requireCustomerAuth, customerUserController.getProfile);
apiRouter.patch('/user/profile', requireCustomerAuth, customerUserController.updateProfile);
apiRouter.get('/user/preferences', requireCustomerAuth, customerUserController.getPreferences);
apiRouter.put('/user/preferences', requireCustomerAuth, customerUserController.updatePreferences);
apiRouter.get('/user/addresses', requireCustomerAuth, customerUserController.getAddresses);
apiRouter.post('/user/addresses', requireCustomerAuth, customerUserController.addAddress);
apiRouter.patch('/user/addresses/:id', requireCustomerAuth, customerUserController.updateAddress);
apiRouter.delete('/user/addresses/:id', requireCustomerAuth, customerUserController.deleteAddress);

// Catalog / Products, Categories & Collections
apiRouter.get('/categories', productController.getCategories);
apiRouter.get('/collections', productController.getCollections);
apiRouter.get('/recommendations', optionalCustomerAuth, productController.getRecommendations);
apiRouter.get('/products', productController.getAll);
apiRouter.get('/products/:id', productController.getById);

// Orders / Checkout
apiRouter.post('/orders', orderController.create);
apiRouter.get('/orders/:id', orderLookupLimiter, orderController.getById);

// Admin Operations
apiRouter.post('/admin/auth/login', adminController.login);
apiRouter.patch('/admin/products/:id', requireAdminAuth, adminController.updateProduct);
apiRouter.post('/admin/products/:id/stock-adjustments', requireAdminAuth, adminController.adjustStock);
apiRouter.get('/admin/audit-events', requireAdminAuth, adminController.getAuditEvents);
