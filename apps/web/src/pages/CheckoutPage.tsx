import React, { useState } from 'react';
import { CartItem, Order } from '../types/index.js';
import { createOrder } from '../services/api.js';
import { Trash2, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';

interface CheckoutPageProps {
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderCompleted: (order: Order, isReplayed: boolean) => void;
  onBackToCatalog: () => void;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderCompleted,
  onBackToCatalog
}) => {
  const [customerEmail, setCustomerEmail] = useState('client@heavyweight.nyc');
  const [customerName, setCustomerName] = useState('Alexander Vance');
  const [idempotencyKey, setIdempotencyKey] = useState(generateUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const subtotalCents = cart.reduce((sum, item) => sum + item.product.price_cents * item.quantity, 0);
  const formattedSubtotal = `$${(subtotalCents / 100).toFixed(2)}`;

  const handleSubmitOrder = async (overrideKey?: string) => {
    if (cart.length === 0) return;
    if (!customerEmail || !customerName) {
      setErrorMessage('Please provide customer name and email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const keyToUse = overrideKey || idempotencyKey;

    try {
      const payload = {
        customerEmail,
        customerName,
        items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity }))
      };

      const result = await createOrder(payload, keyToUse);
      onClearCart();
      onOrderCompleted(result.order, result.isReplayed);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center pt-32">
        <h2 className="anton-heading text-6xl mb-4">YOUR BAG IS EMPTY</h2>
        <p className="space-grotesk text-sm text-zinc-600 mb-8 max-w-sm">
          No luxury pieces currently selected. Browse the essentials collection to reserve pieces.
        </p>
        <button
          onClick={onBackToCatalog}
          className="bg-ink text-white px-8 py-3 text-xs font-bold uppercase tracking-widest space-grotesk sharp-shadow hover:bg-zinc-800"
        >
          RETURN TO ESSENTIALS
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-6xl mx-auto">
      <button
        onClick={onBackToCatalog}
        className="flex items-center gap-2 text-xs font-bold uppercase space-grotesk mb-8 hover:line-through"
      >
        <ArrowLeft className="w-4 h-4" /> BACK TO CATALOG
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Cart Items & Client Form */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="anton-heading text-5xl mb-2">SHOPPING BAG</h1>
            <p className="space-grotesk text-xs text-zinc-600 uppercase tracking-wider">
              {cart.length} DISTINCT {cart.length === 1 ? 'ITEM' : 'ITEMS'} RESERVED
            </p>
          </div>

          {/* Line Items */}
          <div className="border-t border-b border-zinc-300 divide-y divide-zinc-200">
            {cart.map((item) => (
              <div key={item.product.id} className="py-6 flex gap-6 items-start">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-24 h-32 object-cover bg-zinc-900 grayscale hover:grayscale-0 transition-all"
                />
                <div className="flex-1 flex flex-col justify-between h-32">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="space-grotesk font-bold uppercase text-sm">{item.product.name}</h3>
                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-zinc-400 hover:text-accentRed transition-colors"
                        title="Remove piece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] space-grotesk text-zinc-500 uppercase tracking-widest">
                      SKU: {item.product.sku}
                    </span>
                    <div className="text-xs font-bold space-grotesk mt-1">
                      ${(item.product.price_cents / 100).toFixed(2)} USD
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs space-grotesk">
                    <div className="flex items-center border border-zinc-400 bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-0.5 hover:bg-zinc-200"
                      >
                        -
                      </button>
                      <span className="px-3 py-0.5 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2.5 py-0.5 hover:bg-zinc-200 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold">
                      ${((item.product.price_cents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Information Form */}
          <div className="bg-white p-8 border border-zinc-300 sharp-shadow space-y-4">
            <h3 className="anton-heading text-2xl">CLIENT INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs space-grotesk">
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full border border-zinc-400 p-2.5 outline-none focus:border-ink"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full border border-zinc-400 p-2.5 outline-none focus:border-ink"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Idempotency & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Idempotency Inspector Box */}
          <div className="bg-zinc-900 text-white p-6 border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                <ShieldCheck className="w-4 h-4" /> IDEMPOTENCY KEY (SECTION 3.3)
              </span>
              <button
                onClick={() => setIdempotencyKey(generateUUID())}
                className="hover:text-white flex items-center gap-1 text-[10px]"
                title="Regenerate unique key"
              >
                <RefreshCw className="w-3 h-3" /> REFRESH
              </button>
            </div>
            <div className="bg-black/60 p-2.5 rounded border border-zinc-800 break-all select-all text-emerald-400 text-[11px]">
              {idempotencyKey}
            </div>
            <p className="text-[10px] text-zinc-400 leading-normal">
              This UUID is attached as the <code className="text-zinc-200">Idempotency-Key</code> header. Repeating checkout with this exact key returns the original cached order and prevents duplicate billing or stock deduction.
            </p>
          </div>

          {/* Financial Breakdown */}
          <div className="bg-white p-8 border border-zinc-300 sharp-shadow space-y-6">
            <h3 className="anton-heading text-3xl">SUMMARY</h3>

            <div className="space-y-3 text-xs space-grotesk border-b border-zinc-200 pb-4">
              <div className="flex justify-between text-zinc-600">
                <span>SUBTOTAL</span>
                <span>{formattedSubtotal} USD</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>COMPLIMENTARY SHIPPING</span>
                <span>$0.00 USD</span>
              </div>
              <div className="flex justify-between text-zinc-600">
                <span>DUTIES & TAXES INCLUDED</span>
                <span>$0.00 USD</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline text-sm space-grotesk font-bold">
              <span>TOTAL (SERVER CALCULATED)</span>
              <span className="text-xl text-accentRed">{formattedSubtotal} USD</span>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-accentRed text-accentRed text-xs space-grotesk flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              onClick={() => handleSubmitOrder()}
              disabled={isSubmitting}
              className="w-full bg-ink text-white py-4 text-xs font-bold uppercase tracking-widest space-grotesk sharp-shadow hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'PROCESSING TRANSACTION...' : `PLACE ORDER — ${formattedSubtotal}`}
            </button>

            <button
              type="button"
              onClick={() => handleSubmitOrder(idempotencyKey)}
              disabled={isSubmitting}
              className="w-full bg-zinc-200 text-ink py-2 text-[10px] font-bold uppercase tracking-wider space-grotesk hover:bg-zinc-300 transition-colors"
            >
              TEST IDEMPOTENCY (RE-SEND EXACT SAME KEY)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
