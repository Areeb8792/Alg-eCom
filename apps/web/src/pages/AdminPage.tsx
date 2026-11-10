import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Product, AuditEvent } from '../types/index.js';
import { adminLogin, adjustStock, updateProduct, fetchAuditEvents, fetchProducts } from '../services/api.js';
import { Lock, ShieldAlert, CheckCircle, RefreshCw, SlidersHorizontal, ArrowLeft, Database, Shield } from 'lucide-react';

interface AdminPageProps {
  products?: Product[];
  onRefreshCatalog?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  products: initialProducts,
  onRefreshCatalog
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('hw_admin_token');
    } catch {
      return null;
    }
  });
  const [username, setUsername] = useState('admin@algions.com');
  const [password, setPassword] = useState('AdminSecretPassword123!');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Stock Adjustment State
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [stockAdjustment, setStockAdjustment] = useState<number>(5);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Standard warehouse inventory restock');
  const [adjustMessage, setAdjustMessage] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const loadProductsInternal = async () => {
    try {
      const res = await fetchProducts();
      setProducts(res.products);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!initialProducts || initialProducts.length === 0) {
      loadProductsInternal();
    } else {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  useEffect(() => {
    if (token) {
      try {
        localStorage.setItem('hw_admin_token', token);
      } catch {
        // ignore
      }
      loadAudits(token);
    } else {
      try {
        localStorage.removeItem('hw_admin_token');
      } catch {
        // ignore
      }
    }
  }, [token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await adminLogin(username, password);
      setToken(res.token);
      loadAudits(res.token);
    } catch (err: unknown) {
      setLoginError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const loadAudits = async (authToken: string) => {
    setLoadingAudits(true);
    try {
      const list = await fetchAuditEvents(authToken);
      setAuditEvents(list);
    } catch {
      // Ignore
    } finally {
      setLoadingAudits(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedProductId) return;

    setAdjustMessage(null);
    setAdjustError(null);

    try {
      await adjustStock(selectedProductId, stockAdjustment, adjustmentReason, token);
      setAdjustMessage(`Stock successfully adjusted by ${stockAdjustment > 0 ? '+' : ''}${stockAdjustment}`);
      if (onRefreshCatalog) onRefreshCatalog();
      loadProductsInternal();
      loadAudits(token);
    } catch (err: unknown) {
      setAdjustError(err instanceof Error ? err.message : 'Adjustment failed');
    }
  };

  const handleToggleActive = async (product: Product) => {
    if (!token) return;
    try {
      await updateProduct(product.id, { is_active: !product.is_active }, token);
      if (onRefreshCatalog) onRefreshCatalog();
      loadProductsInternal();
      loadAudits(token);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to toggle status');
    }
  };

  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-6xl mx-auto space-y-12">
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase space-grotesk hover:line-through"
        >
          <ArrowLeft className="w-4 h-4" /> RETURN TO CATALOG
        </Link>

        <span className="text-xs space-grotesk bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1 font-bold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> RESTRICTED OPERATIONAL ENVIRONMENT
        </span>
      </div>

      {!token ? (
        /* Login Card */
        <div className="max-w-md mx-auto bg-white border border-zinc-300 p-8 lg:p-12 sharp-shadow space-y-6">
          <div className="flex items-center gap-3 text-ink">
            <Lock className="w-6 h-6 text-accentRed" />
            <h1 className="anton-heading text-3xl">ADMINISTRATOR ACCESS</h1>
          </div>
          <p className="space-grotesk text-xs text-zinc-600 leading-relaxed">
            Administrative endpoints are protected with JWT authentication and strict role-based access control. Every modification generates an immutable audit record in PostgreSQL.
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-xs space-grotesk">
            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                ADMIN USERNAME
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full border border-zinc-400 p-2.5 outline-none focus:border-ink font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                PASSWORD
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-zinc-400 p-2.5 outline-none focus:border-ink font-mono"
                required
              />
            </div>

            {loginError && (
              <div className="p-3 bg-red-50 border border-accentRed text-accentRed text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-ink text-white py-3 text-xs font-bold uppercase tracking-widest sharp-shadow hover:bg-zinc-800 transition-all"
            >
              AUTHENTICATE (GET JWT)
            </button>
          </form>
        </div>
      ) : (
        /* Authenticated Operational Dashboard */
        <div className="space-y-12">
          {/* Header Controls */}
          <div className="bg-ink text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest uppercase block">
                AUTHENTICATED AS {username} (ROLE: ADMIN)
              </span>
              <h1 className="anton-heading text-3xl">INVENTORY &amp; AUDIT CONTROL</h1>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => loadAudits(token)}
                disabled={loadingAudits}
                className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 text-xs font-bold space-grotesk flex items-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudits ? 'animate-spin' : ''}`} /> REFRESH AUDIT LOG
              </button>
              <button
                onClick={() => setToken(null)}
                className="bg-accentRed hover:bg-red-700 text-white px-4 py-2 text-xs font-bold space-grotesk"
              >
                LOGOUT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Stock Adjustment Card */}
            <div className="lg:col-span-5 bg-white border border-zinc-300 p-8 sharp-shadow space-y-6">
              <div className="flex items-center gap-2 border-b border-zinc-200 pb-4">
                <SlidersHorizontal className="w-5 h-5" />
                <h2 className="anton-heading text-2xl">ADJUST PRODUCT INVENTORY</h2>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-4 text-xs space-grotesk">
                <div>
                  <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                    SELECT PRODUCT
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full border border-zinc-400 p-2.5 outline-none bg-white font-bold"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (SKU: {p.sku}) — Current Stock: {p.stock}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                      STOCK DELTA (+/-)
                    </label>
                    <input
                      type="number"
                      value={stockAdjustment}
                      onChange={(e) => setStockAdjustment(parseInt(e.target.value, 10) || 0)}
                      className="w-full border border-zinc-400 p-2.5 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                      REASON NOTE
                    </label>
                    <input
                      type="text"
                      value={adjustmentReason}
                      onChange={(e) => setAdjustmentReason(e.target.value)}
                      className="w-full border border-zinc-400 p-2.5"
                      placeholder="e.g. Warehouse receipt"
                      required
                    />
                  </div>
                </div>

                {adjustMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-600 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{adjustMessage}</span>
                  </div>
                )}

                {adjustError && (
                  <div className="p-3 bg-red-50 border border-accentRed text-accentRed text-xs">
                    {adjustError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-ink text-white py-3 text-xs font-bold uppercase tracking-widest sharp-shadow hover:bg-zinc-800"
                >
                  COMMIT STOCK ADJUSTMENT &amp; RECORD AUDIT
                </button>
              </form>
            </div>

            {/* Product Status Toggle List */}
            <div className="lg:col-span-7 bg-white border border-zinc-300 p-8 sharp-shadow space-y-4">
              <h2 className="anton-heading text-2xl border-b border-zinc-200 pb-4">CATALOG ARCHIVE STATUS</h2>
              <div className="divide-y divide-zinc-200 max-h-[380px] overflow-y-auto pr-2">
                {products.map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs space-grotesk">
                    <div>
                      <span className="font-bold uppercase block">{p.name}</span>
                      <span className="text-zinc-500 text-[10px]">
                        SKU: {p.sku} | Stock: <b className="text-ink">{p.stock}</b> | Price: ${(p.price_cents / 100).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(p)}
                      className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        p.is_active
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-zinc-200 text-zinc-600 border border-zinc-400'
                      }`}
                    >
                      {p.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Trail Table */}
          <div className="bg-white border border-zinc-300 p-8 sharp-shadow space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                <h2 className="anton-heading text-2xl">POSTGRESQL AUDIT TRAIL LOGS</h2>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                {auditEvents.length} Recorded Operational Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs space-grotesk">
                <thead>
                  <tr className="border-b border-zinc-300 text-zinc-500 text-[10px] uppercase tracking-wider">
                    <th className="py-2 px-3">TIMESTAMP</th>
                    <th className="py-2 px-3">ACTION</th>
                    <th className="py-2 px-3">ENTITY</th>
                    <th className="py-2 px-3">ACTOR</th>
                    <th className="py-2 px-3">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono text-[11px]">
                  {auditEvents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-zinc-400 font-sans">
                        No audit events recorded yet. Perform an inventory adjustment above to generate one.
                      </td>
                    </tr>
                  ) : (
                    auditEvents.map((evt) => (
                      <tr key={evt.id} className="hover:bg-zinc-50">
                        <td className="py-2 px-3 text-zinc-500">
                          {new Date(evt.created_at).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3">
                          <span className="bg-zinc-200 px-1.5 py-0.5 font-bold">{evt.action}</span>
                        </td>
                        <td className="py-2 px-3 text-zinc-600">
                          {evt.resource_type}:{evt.resource_id.slice(0, 8)}...
                        </td>
                        <td className="py-2 px-3 text-zinc-700">{evt.actor_username || 'System'}</td>
                        <td className="py-2 px-3 text-zinc-500 truncate max-w-xs">
                          {JSON.stringify(evt.after_state)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
