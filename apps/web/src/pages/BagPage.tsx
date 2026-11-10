import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.js';
import { Trash2, ArrowLeft, ArrowRight, ShieldAlert, ShoppingBag } from 'lucide-react';

export const BagPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotalCents, totalCartCount } = useCart();
  const navigate = useNavigate();

  const formattedSubtotal = `$${(subtotalCents / 100).toFixed(2)}`;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen pt-40 pb-24 px-8 lg:px-16 max-w-4xl mx-auto flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h1 className="anton-heading text-4xl lg:text-5xl text-ink">YOUR BAG IS EMPTY</h1>
        <p className="space-grotesk text-sm text-zinc-600 max-w-md">
          Explore our seasonal archive of curated luxury silhouettes. All orders feature transactional stock locking and complimentary courier delivery.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-ink text-white px-8 py-3 text-xs font-bold uppercase tracking-widest space-grotesk hover:bg-zinc-800 transition-colors"
        >
          EXPLORE CATALOG <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-ink pb-6">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase space-grotesk hover:line-through mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> RETURN TO CATALOG
          </Link>
          <h1 className="anton-heading text-5xl lg:text-6xl text-ink leading-none">
            SHOPPING BAG ({totalCartCount})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs uppercase font-bold space-grotesk text-zinc-500 hover:text-accentRed transition-colors underline"
        >
          CLEAR ENTIRE BAG
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Cart Items List */}
        <div className="lg:col-span-8 space-y-6">
          {cart.map((item) => {
            const lineTotal = `$${((item.product.price_cents * item.quantity) / 100).toFixed(2)}`;
            const isExceedingStock = item.quantity > item.product.stock;

            return (
              <div
                key={item.product.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-white border border-zinc-300 gap-6 sharp-shadow"
              >
                <div className="flex items-center gap-6">
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="w-24 h-32 bg-zinc-900 border border-zinc-200 overflow-hidden flex-shrink-0"
                  >
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                    />
                  </Link>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 space-grotesk">
                      {item.product.category} | SKU: {item.product.sku}
                    </span>
                    <Link to={`/products/${item.product.slug}`}>
                      <h3 className="anton-heading text-xl text-ink hover:line-through transition-all">
                        {item.product.name}
                      </h3>
                    </Link>
                    <div className="text-sm font-bold space-grotesk text-zinc-800">
                      ${(item.product.price_cents / 100).toFixed(2)} USD
                    </div>
                    {isExceedingStock && (
                      <div className="text-[11px] text-accentRed space-grotesk font-bold flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" /> Exceeds stock (max: {item.product.stock})
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 self-end sm:self-center">
                  <div className="flex items-center border border-ink bg-white">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="px-3 py-1 hover:bg-zinc-200 transition-colors text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-3 py-1 text-sm font-bold min-w-[2.5rem] text-center space-grotesk">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="px-3 py-1 hover:bg-zinc-200 transition-colors disabled:opacity-30 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right min-w-[5rem]">
                    <span className="text-base font-bold space-grotesk text-ink block">
                      {lineTotal}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-zinc-400 hover:text-accentRed transition-colors mt-1 p-1 inline-block"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-4">
          <div className="bg-ink text-white p-8 sharp-shadow border border-ink space-y-6 sticky top-28">
            <h2 className="anton-heading text-3xl">SUMMARY</h2>

            <div className="space-y-3 space-grotesk text-xs border-b border-zinc-700 pb-6">
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase">MERCHANDISE SUBTOTAL</span>
                <span className="font-bold">{formattedSubtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase">ESTIMATED SHIPPING</span>
                <span className="text-emerald-400 uppercase font-bold">COMPLIMENTARY EXPRESS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400 uppercase">DUTIES & TAXES</span>
                <span className="text-zinc-400">CALCULATED AT CHECKOUT</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline space-grotesk">
              <span className="text-sm uppercase font-bold text-zinc-300">ESTIMATED TOTAL</span>
              <span className="text-2xl font-bold text-white">{formattedSubtotal} USD</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full bg-white text-ink py-4 text-xs font-bold uppercase tracking-widest space-grotesk hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
            >
              PROCEED TO CHECKOUT <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-[10px] space-grotesk text-zinc-500 leading-relaxed text-center">
              Stock reservations are guaranteed upon submission through transactional atomic deduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
