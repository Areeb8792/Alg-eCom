import React, { useState } from 'react';
import { Order } from '../types/index.js';
import { fetchOrder } from '../services/api.js';
import { CheckCircle2, ShieldCheck, Search, ArrowLeft, PackageCheck } from 'lucide-react';

interface OrderConfirmationPageProps {
  order: Order | null;
  isReplayed?: boolean;
  onBackToCatalog: () => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({
  order: initialOrder,
  isReplayed = false,
  onBackToCatalog
}) => {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(initialOrder);
  const [lookupQuery, setLookupQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLoading(true);
    setLookupError(null);

    try {
      const found = await fetchOrder(lookupQuery.trim());
      setCurrentOrder(found);
    } catch (err: unknown) {
      setLookupError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-4xl mx-auto space-y-12">
      <button
        onClick={onBackToCatalog}
        className="flex items-center gap-2 text-xs font-bold uppercase space-grotesk hover:line-through"
      >
        <ArrowLeft className="w-4 h-4" /> RETURN TO CATALOG
      </button>

      {/* Order Lookup Search Bar */}
      <div className="bg-zinc-900 text-white p-6 border border-zinc-800 space-y-3">
        <h4 className="space-grotesk text-xs uppercase font-bold tracking-widest text-zinc-400">
          TRACK AN EXISTING ORDER (API: GET /api/v1/orders/:id)
        </h4>
        <form onSubmit={handleLookup} className="flex gap-2">
          <input
            type="text"
            placeholder="ENTER ORDER REFERENCE (e.g. HW-2024-XXXX) OR UUID..."
            value={lookupQuery}
            onChange={(e) => setLookupQuery(e.target.value)}
            className="flex-1 bg-black/60 border border-zinc-700 text-xs px-4 py-2.5 font-mono text-white outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-ink px-6 py-2.5 text-xs font-bold uppercase tracking-widest space-grotesk hover:bg-zinc-200 flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> {loading ? 'FINDING...' : 'TRACK'}
          </button>
        </form>
        {lookupError && <p className="text-accentRed text-xs space-grotesk">{lookupError}</p>}
      </div>

      {currentOrder ? (
        <div className="bg-white border border-zinc-300 p-8 lg:p-12 sharp-shadow space-y-8 animate-fadeIn">
          {/* Header & Status */}
          <div className="border-b border-zinc-200 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="space-grotesk text-xs font-bold tracking-widest uppercase">
                  ORDER CONFIRMED & COMMITTED TO DATABASE
                </span>
              </div>
              <h1 className="anton-heading text-4xl lg:text-5xl">{currentOrder.order_reference}</h1>
              <p className="space-grotesk text-xs text-zinc-500 mt-1">
                Placed on {new Date(currentOrder.created_at).toLocaleString()}
              </p>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2">
              <span className="bg-ink text-white px-3 py-1 text-xs font-bold uppercase tracking-widest space-grotesk">
                {currentOrder.status}
              </span>
              {isReplayed && (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> IDEMPOTENT REPLAY DETECTED
                </span>
              )}
            </div>
          </div>

          {/* Client Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs space-grotesk bg-concrete p-6 border border-zinc-200">
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mb-1">
                RECIPIENT CLIENT
              </span>
              <p className="font-bold text-sm">{currentOrder.customer_name}</p>
              <p className="text-zinc-600">{currentOrder.customer_email}</p>
            </div>
            <div>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mb-1">
                ORDER INTERNAL IDENTIFIER (UUID)
              </span>
              <p className="font-mono text-zinc-700 break-all">{currentOrder.id}</p>
            </div>
          </div>

          {/* Itemized Snapshots */}
          <div>
            <h3 className="anton-heading text-2xl mb-4">PURCHASED PIECES (HISTORIC SNAPSHOT)</h3>
            <div className="border border-zinc-200 divide-y divide-zinc-200">
              {currentOrder.items?.map((item) => (
                <div key={item.id} className="p-4 flex justify-between items-center text-xs space-grotesk">
                  <div>
                    <h4 className="font-bold uppercase">{item.product_name_snapshot}</h4>
                    <span className="text-zinc-500 text-[10px]">
                      SKU: {item.sku_snapshot} • QTY: {item.quantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">
                      ${((item.unit_price_cents_snapshot * item.quantity) / 100).toFixed(2)} USD
                    </span>
                    <span className="block text-[10px] text-zinc-500">
                      @ ${(item.unit_price_cents_snapshot / 100).toFixed(2)} each
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-zinc-200 pt-6 flex justify-between items-baseline text-sm space-grotesk font-bold">
            <span className="uppercase">TOTAL AMOUNT SETTLED</span>
            <span className="text-2xl text-accentRed">
              ${(currentOrder.subtotal_cents / 100).toFixed(2)} {currentOrder.currency}
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-zinc-300 p-12 text-center sharp-shadow space-y-4">
          <PackageCheck className="w-12 h-12 text-zinc-400 mx-auto" />
          <h2 className="anton-heading text-3xl">TRACK YOUR ORDER</h2>
          <p className="space-grotesk text-xs text-zinc-600 max-w-sm mx-auto">
            Enter an order reference number or UUID above to inspect the transactional snapshot and current fulfillment status.
          </p>
        </div>
      )}
    </div>
  );
};
