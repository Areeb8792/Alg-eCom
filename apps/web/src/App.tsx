import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from './types/index.js';
import { fetchProducts } from './services/api.js';
import { GrainOverlay } from './components/GrainOverlay.js';
import { MainHeader } from './components/MainHeader.js';
import { FloatingCartButton } from './components/FloatingCartButton.js';
import { HealthSignal } from './components/HealthSignal.js';
import { MainFooter } from './components/MainFooter.js';
import { ProductModal } from './components/ProductModal.js';
import { CatalogPage } from './pages/CatalogPage.js';
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage.js';
import { AdminPage } from './pages/AdminPage.js';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'checkout' | 'confirmation' | 'track' | 'admin'>('catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [modalProduct, setModalProduct] = useState<Product | null>(null);

  // Completed Order State
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isReplayedOrder, setIsReplayedOrder] = useState(false);

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

  // Cart actions
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleOrderCompleted = (order: Order, isReplayed: boolean) => {
    setConfirmedOrder(order);
    setIsReplayedOrder(isReplayed);
    setActiveTab('confirmation');
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen relative flex flex-col bg-concrete text-ink selection:bg-ink selection:text-white">
      <GrainOverlay />

      {/* Main Global Navigation */}
      <MainHeader
        activeTab={activeTab}
        onNavigate={(tab) => {
          setActiveTab(tab as any);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        cartCount={totalCartCount}
      />

      {/* Floating Action Cart Button */}
      <FloatingCartButton
        itemCount={totalCartCount}
        onClick={() => {
          setActiveTab('checkout');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'catalog' && (
          <CatalogPage
            products={products}
            loading={loading}
            error={error}
            onSelectProduct={(p) => setModalProduct(p)}
            onQuickAdd={(p) => handleAddToCart(p, 1)}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}

        {activeTab === 'checkout' && (
          <CheckoutPage
            cart={cart}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={() => setCart([])}
            onOrderCompleted={handleOrderCompleted}
            onBackToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'confirmation' && (
          <OrderConfirmationPage
            order={confirmedOrder}
            isReplayed={isReplayedOrder}
            onBackToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'track' && (
          <OrderConfirmationPage
            order={null}
            onBackToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            products={products}
            onRefreshCatalog={loadProducts}
            onBackToCatalog={() => setActiveTab('catalog')}
          />
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* Real-time Observability Health Signal */}
      <HealthSignal />

      {/* Editorial Luxury Footer */}
      <MainFooter />
    </div>
  );
};
