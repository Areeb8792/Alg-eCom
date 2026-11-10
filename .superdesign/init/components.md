# Superdesign Components Spec

## Identified Components
1. **Header / Navigation (`MainHeader`)**
   - Brand logo "HEAVY", metadata "Est. 2024 / NYC"
   - Desktop and mobile navigation links with strike-through hover
   - Difference blend mode (`mix-blend-difference`) for multi-background contrast
2. **Floating Action Cart (`FloatingCartButton`)**
   - Circular white badge with `sharp-shadow`, badge counter in red (`#dc2626`)
   - Links to shopping bag / checkout
3. **Hero Section (`HeroSplit`)**
   - Split view: Left editorial text with oversized Anton heading, right grayscale luxury photo with vertical title text
4. **Product Strip (`ProductHorizontalStrip`)**
   - Dark background container (`#0a0a0a`)
   - Product card: 3:4 aspect ratio, material badge (e.g. SILK BLEND, TECHNICAL WEAVE), title, price, stock status
5. **Product Detail View (`ProductDetailModalOrPage`)**
   - Image gallery, product description, live stock counter, size/quantity selector, add to bag button
6. **Cart Drawer & Checkout Form (`CheckoutWorkflow`)**
   - Line items with snapshots, subtotal calculation, Idempotency-Key generation, address and customer form
7. **Order Status Banner / Screen (`OrderStatusDisplay`)**
   - Order reference, itemized summary, price snapshot, status tracking
8. **Admin Operations Panel (`AdminOperations`)**
   - JWT auth, product catalog editing, stock adjustments, live audit trail log
9. **Utility Footer (`MainFooter`)**
   - Newsletter subscription input, multi-column navigation, payment badges, watermark logo
