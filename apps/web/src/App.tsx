import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Product } from './types/index.js';
import { fetchProducts } from './services/api.js';
import { CartProvider, useCart } from './context/CartContext.js';
import { GrainOverlay } from './components/GrainOverlay.js';
import { MainHeader } from './components/MainHeader.js';
import { FloatingCartButton } from './components/FloatingCartButton.js';
import { HealthSignal } from './components/HealthSignal.js';
import { MainFooter } from './components/MainFooter.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { BagPage } from './pages/BagPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { AdminPage } from './pages/AdminPage.js';

// Scroll to top helper on navigation
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const AppRoutes: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const { addToCart, totalCartCount } = useCart();

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchProducts(selectedCategory, searchQuery);
      setProducts(res.products);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error connecting to service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen relative flex flex-col bg-concrete text-ink selection:bg-ink selection:text-white">
      <GrainOverlay />
      <ScrollToTop />

      {/* Main Global Navigation Header */}
      <MainHeader cartCount={totalCartCount} />

      {/* Floating Action Cart Button */}
      <FloatingCartButton itemCount={totalCartCount} />

      {/* Main Content Area with React Router */}
      <main className="flex-1">
        <Routes>
          {/* Home / Essentials Catalog */}
          <Route
            path="/"
            element={
              <CatalogPage
                products={products}
                loading={loading}
                error={error}
                onQuickAdd={(p) => addToCart(p, 1)}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            }
          />

          {/* Collection Category Filter */}
          <Route
            path="/collections/:categorySlug"
            element={
              <CatalogPage
                products={products}
                loading={loading}
                error={error}
                onQuickAdd={(p) => addToCart(p, 1)}
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            }
          />

          {/* Dedicated Product Detail Page */}
          <Route path="/products/:slug" element={<ProductDetailPage />} />

          {/* Shopping Bag Page */}
          <Route path="/bag" element={<BagPage />} />

          {/* Checkout Workflow Page */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Order Confirmation by UUID */}
          <Route path="/orders/:orderId" element={<OrderConfirmationPage />} />

          {/* Order Status & Tracking Page */}
          <Route path="/track-order" element={<OrderConfirmationPage />} />

          {/* Administrative Control Dashboard & Login */}
          <Route
            path="/admin"
            element={
              <AdminPage
                products={products}
                onRefreshCatalog={loadProducts}
              />
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminPage
                products={products}
                onRefreshCatalog={loadProducts}
              />
            }
          />

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Real-time Health Check Signal */}
      <HealthSignal />

      {/* Global Luxury Footer */}
      <MainFooter />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CartProvider>
        <AppRoutes />
      </CartProvider>
    </BrowserRouter>
  );
};
