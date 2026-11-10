import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import { Trash2, ShieldCheck, RefreshCw, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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

export const CheckoutPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotalCents } = useCart();
  const navigate = useNavigate();

  const [customerEmail, setCustomerEmail] = useState('client@heavyweight.nyc');
  const [customerName, setCustomerName] = useState('Alexander Vance');
  const [idempotencyKey, setIdempotencyKey] = useState(generateUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      clearCart();
      navigate(`/orders/${result.order.id}`, {
        state: { order: result.order, isReplayed: result.isReplayed }
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center pt-32">
        <h2 className="anton-heading text-6xl mb-4 text-ink">YOUR BAG IS EMPTY</h2>
        <p className="space-grotesk text-sm text-zinc-600 mb-8 max-w-sm">
          No luxury pieces currently selected. Browse the essentials collection to reserve pieces.
        </p>
        <Link
          to="/"
          className="bg-ink text-white px-8 py-3 text-xs font-bold uppercase tracking-widest space-grotesk sharp-shadow hover:bg-zinc-800"
        >
          RETURN TO ESSENTIALS
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-6xl mx-auto">
      <Link
        to="/bag"
        className="inline-flex items-center gap-2 text-xs font-bold uppercase space-grotesk mb-8 hover:line-through"
      >
        <ArrowLeft className="w-4 h-4" /> BACK TO SHOPPING BAG
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Cart Items & Client Form */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <h1 className="anton-heading text-5xl mb-2 text-ink">CHECKOUT</h1>
            <p className="space-grotesk text-xs text-zinc-600 uppercase tracking-wider">
              {cart.length} DISTINCT {cart.length === 1 ? 'ITEM' : 'ITEMS'} IN ALLOCATION RESERVATION
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
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-zinc-400 hover:text-accentRed transition-colors"
                        title="Remove piece"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-[10px] space-grotesk text-zinc-500 uppercase tracking-widest">
                      SKU: {item.product.sku}
                    </span>
                    <div className="text-xs font-bold space-grotesk mt-1 text-ink">
                      ${(item.product.price_cents / 100).toFixed(2)} USD
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs space-grotesk">
                    <div className="flex items-center border border-zinc-400 bg-white">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="px-2.5 py-0.5 hover:bg-zinc-200 font-bold"
                      >
                        -
                      </button>
                      <span className="px-3 py-0.5 font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="px-2.5 py-0.5 hover:bg-zinc-200 disabled:opacity-30 font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-bold text-ink">
                      ${((item.product.price_cents * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Customer Information Form */}
          <div className="bg-white p-8 border border-zinc-300 sharp-shadow space-y-4">
            <h3 className="anton-heading text-2xl text-ink">CLIENT INFORMATION</h3>
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

            <div className="pt-2">
              <label className="block text-[10px] uppercase font-bold tracking-widest text-zinc-600 mb-1">
                DELIVERY ADDRESS
              </label>
              <input
                type="text"
                defaultValue="740 Park Avenue, Penthouse B, New York, NY 10021"
                className="w-full border border-zinc-400 p-2.5 outline-none focus:border-ink text-xs space-grotesk"
              />
            </div>
          </div>
        </div>

        {/* Right: Idempotency & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          {/* Idempotency Inspector Box */}
          <div className="bg-zinc-900 text-white p-6 border border-zinc-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-zinc-400">
              <span className="flex items-center gap-1.5 font-bold text-amber-400 text-[11px]">
                <ShieldCheck className="w-4 h-4" /> IDEMPOTENCY INSPECTOR
              </span>
              <button
                type="button"
                onClick={() => setIdempotencyKey(generateUUID())}
                className="flex items-center gap-1 text-[10px] text-zinc-300 hover:text-white underline"
                title="Generate fresh UUID"
              >
                <RefreshCw className="w-3 h-3" /> RE-GENERATE
              </button>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 uppercase block mb-1">
                Active Header: Idempotency-Key
              </span>
              <input
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full bg-black/60 border border-zinc-700 px-3 py-1.5 text-[11px] text-emerald-400 font-mono outline-none focus:border-emerald-500"
              />
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed font-sans">
              Protects against double-charging on duplicate clicks or network retry timeouts. The server caches this key inside PostgreSQL and returns the original order without re-deducting stock.
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-white p-8 border border-zinc-300 sharp-shadow space-y-6">
            <h3 className="anton-heading text-2xl text-ink">ORDER SUMMARY</h3>

            <div className="space-y-3 text-xs space-grotesk border-b border-zinc-300 pb-6">
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">SUBTOTAL</span>
                <span className="font-bold">{formattedSubtotal} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">INSURED EXPRESS SHIPPING</span>
                <span className="font-bold text-emerald-700 uppercase">COMPLIMENTARY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase">IMPORT DUTIES &amp; HANDLING</span>
                <span className="text-zinc-400">INCLUDED</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline text-sm space-grotesk font-bold">
              <span className="uppercase">TOTAL SETTLEMENT</span>
              <span className="text-2xl text-accentRed">{formattedSubtotal} USD</span>
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
              className="w-full bg-ink text-white py-4 text-xs font-bold uppercase tracking-widest space-grotesk sharp-shadow hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> EXECUTING TRANSACTION...
                </>
              ) : (
                <>
                  CONFIRM &amp; PAY {formattedSubtotal} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSubmitOrder(idempotencyKey)}
              disabled={isSubmitting}
              className="w-full bg-zinc-100 text-zinc-700 border border-zinc-300 py-2.5 text-[10px] font-bold uppercase tracking-wider space-grotesk hover:bg-zinc-200 transition-colors"
            >
              SIMULATE DUPLICATE SUBMISSION (REPLAY TEST)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
