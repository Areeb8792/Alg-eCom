import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types/index.js';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onSelect?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickAdd, onSelect }) => {
  const formattedPrice = `$${(product.price_cents / 100).toFixed(0)}`;
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div className="flex-none w-80 snap-start group cursor-pointer block select-none">
      <Link
        to={`/products/${product.slug}`}
        onClick={() => {
          if (onSelect) {
            onSelect(product);
          }
        }}
        className="block"
      >
        <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 border border-zinc-800">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-110"
            loading="lazy"
          />

          {/* Category Tag */}
          <div className="absolute top-3 right-3 bg-white px-2 py-1 text-[10px] font-bold space-grotesk uppercase text-ink">
            {product.category}
          </div>

          {/* Stock Badge */}
          <div className="absolute bottom-3 left-3">
            {isSoldOut ? (
              <span className="bg-accentRed text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                SOLD OUT
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500 text-ink px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                ONLY {product.stock} LEFT
              </span>
            ) : (
              <span className="bg-black/70 backdrop-blur-sm text-zinc-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                {product.stock} IN STOCK
              </span>
            )}
          </div>

          {/* Quick Add Overlay on Hover */}
          {!isSoldOut && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickAdd(product);
              }}
              className="absolute inset-x-0 bottom-0 bg-white text-ink py-3 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-200"
            >
              + ADD TO BAG
            </button>
          )}
        </div>

        <div className="mt-4 space-grotesk flex justify-between items-start">
          <div>
            <h3 className="text-white text-sm font-bold uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
              {product.name}
            </h3>
            <span className="text-zinc-500 text-[10px] uppercase tracking-widest">SKU: {product.sku}</span>
          </div>
          <span className="text-white/80 text-xs font-bold">{formattedPrice}</span>
        </div>
      </Link>
    </div>
  );
};
