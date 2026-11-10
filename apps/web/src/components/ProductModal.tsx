import React, { useState } from 'react';
import { Product } from '../types/index.js';
import { X, Check } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const formattedPrice = `$${(product.price_cents / 100).toFixed(2)}`;
  const isSoldOut = product.stock <= 0;

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart(product, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-concrete text-ink rounded-none border border-ink sharp-shadow overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 hover:bg-white text-ink flex items-center justify-center transition-colors rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image */}
        <div className="md:w-1/2 aspect-square md:aspect-auto relative bg-zinc-900 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute top-4 left-4 bg-white px-2 py-1 text-[10px] font-bold space-grotesk uppercase">
            {product.category}
          </div>
        </div>

        {/* Details & Actions */}
        <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-between overflow-y-auto">
          <div>
            <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase text-zinc-500 block mb-2">
              SKU: {product.sku}
            </span>
            <h2 className="anton-heading text-4xl lg:text-5xl mb-4 leading-none">{product.name}</h2>
            <div className="text-2xl font-bold space-grotesk mb-6 text-accentRed">
              {formattedPrice} <span className="text-xs text-zinc-500 font-normal">USD</span>
            </div>

            <p className="space-grotesk text-sm leading-relaxed text-zinc-700 mb-8">
              {product.description}
            </p>

            <div className="border-t border-b border-zinc-300 py-4 mb-6 space-y-2 text-xs space-grotesk">
              <div className="flex justify-between">
                <span className="text-zinc-500">AVAILABILITY</span>
                <span className={`font-bold ${isSoldOut ? 'text-accentRed' : 'text-emerald-700'}`}>
                  {isSoldOut ? 'OUT OF STOCK' : `${product.stock} PIECES AVAILABLE`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">SHIPPING</span>
                <span>GLOBAL COMPLIMENTARY COURIER</span>
              </div>
            </div>
          </div>

          <div>
            {!isSoldOut && (
              <div className="flex items-center gap-4 mb-6">
                <span className="space-grotesk text-xs font-bold uppercase">QUANTITY</span>
                <div className="flex items-center border border-ink bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="px-3 py-1 hover:bg-zinc-200 transition-colors disabled:opacity-30"
                  >
                    -
                  </button>
                  <span className="px-4 py-1 text-sm font-bold min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="px-3 py-1 hover:bg-zinc-200 transition-colors disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleAdd}
              disabled={isSoldOut || added}
              className={`w-full py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                isSoldOut
                  ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  : added
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ink text-white hover:bg-zinc-800 sharp-shadow hover:translate-y-[-2px]'
              }`}
            >
              {isSoldOut ? (
                'UNAVAILABLE'
              ) : added ? (
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" /> ADDED TO BAG
                </span>
              ) : (
                `ADD TO BAG — $${((product.price_cents * quantity) / 100).toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
