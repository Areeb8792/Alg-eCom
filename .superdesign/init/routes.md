# Superdesign Routes Spec

## Route Architecture
1. `/` (Catalogue / Storefront Home)
   - Editorial hero section
   - Essentials horizontal product carousel with real-time stock indicators
   - Product detail modal / drawer on selection
   - Featured seasonal collections grid
2. `/checkout` (Shopping Bag & Order Submission)
   - Cart item list with quantity adjustment and stock validation
   - Order submission with client-generated UUID `Idempotency-Key`
3. `/order/:id` (Order Tracking & Status)
   - Order summary, financial snapshot (price in integer minor units), status lifecycle
4. `/admin` (Operations & Inventory Management)
   - Admin login (JWT authentication)
   - Live stock adjustment controls with optimistic locks
   - Audit event log table showing actor, action, timestamp, and entity diff
5. `/health` & `/readiness` (API Health Signal View)
   - Visual health inspection for DevOps demonstration
