# Superdesign Pages Spec

## Screens to Implement
1. **Catalog Page (`apps/web/src/pages/CatalogPage.tsx`)**
   - Displays seeded products from `GET /api/v1/products`
   - Filter by category and search by keyword
   - Real-time stock availability badge
   - Quick "Add to Bag" and click-to-view details
2. **Product Details View (`apps/web/src/pages/ProductDetailPage.tsx`)**
   - High resolution editorial gallery
   - SKU, price snapshot, stock limits
   - Interactive quantity selector
3. **Cart & Checkout Page (`apps/web/src/pages/CheckoutPage.tsx`)**
   - Summary of selected items
   - Customer info fields
   - Idempotency key generation header
   - Immediate order creation via `POST /api/v1/orders`
4. **Order Confirmation & Tracking (`apps/web/src/pages/OrderConfirmationPage.tsx`)**
   - Order reference, total amount in formatted currency, line item snapshots, timestamps
5. **Admin Operations Dashboard (`apps/web/src/pages/AdminPage.tsx`)**
   - Secure login via `POST /api/v1/admin/auth/login`
   - Stock update controls with reason notes via `POST /api/v1/admin/products/:id/stock-adjustments`
   - Product active toggle via `PATCH /api/v1/admin/products/:id`
   - Real-time audit log stream from database
