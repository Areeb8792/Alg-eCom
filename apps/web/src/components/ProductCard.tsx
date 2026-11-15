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

  // Extract distinct sizes and colors if variants exist
  const sizes = Array.from(new Set(product.variants?.map((v) => v.size) || []));
  const colors = Array.from(
    new Map(product.variants?.map((v) => [v.color, v.color_hex]) || []).entries()
  );

  return (
    <div className="w-full group cursor-pointer block select-none bg-white border-2 border-[#1B0E0D] shadow-[4px_4px_0px_#1B0E0D] hover:shadow-[6px_6px_0px_#C72A09] transition-all">
      <Link
        to={`/products/${product.slug}`}
        onClick={() => {
          if (onSelect) {
            onSelect(product);
          }
        }}
        className="block"
      >
        <div className="aspect-[3/4] relative overflow-hidden bg-zinc-900 border-b-2 border-[#1B0E0D]">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
            loading="lazy"
          />

          {/* Category Tag */}
          <div className="absolute top-2.5 right-2.5 bg-white border border-[#1B0E0D] px-2 py-0.5 text-[9px] font-bold space-grotesk uppercase text-[#1B0E0D]">
            {product.category}
          </div>

          {/* Fit Badge */}
          {product.fit_type && (
            <div className="absolute top-2.5 left-2.5 bg-[#1B0E0D] text-white px-2 py-0.5 text-[9px] font-bold space-grotesk uppercase">
              {product.fit_type}
            </div>
          )}

          {/* Stock Badge */}
          <div className="absolute bottom-2.5 left-2.5">
            {isSoldOut ? (
              <span className="bg-[#C72A09] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-black">
                SOLD OUT
              </span>
            ) : isLowStock ? (
              <span className="bg-[#1B0E0D] text-[#31EF07] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-black">
                ONLY {product.stock} LEFT
              </span>
            ) : (
              <span className="bg-[#1B0E0D]/90 text-zinc-300 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
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
              className="absolute inset-x-0 bottom-0 bg-[#1B0E0D] text-white py-3 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#C72A09]"
            >
              + QUICK ADD TO BAG
            </button>
          )}
        </div>

        <div className="p-4 space-grotesk">
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <div>
              <h3 className="text-[#1B0E0D] text-xs font-bold uppercase tracking-wider group-hover:text-[#C72A09] transition-colors line-clamp-1">
                {product.name}
              </h3>
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest">SKU: {product.sku}</span>
            </div>
            <span className="text-[#C72A09] text-xs font-bold whitespace-nowrap">{formattedPrice} USD</span>
          </div>

          {/* Available Sizes and Colorway dots */}
          <div className="mt-3 pt-2.5 border-t border-zinc-200 flex justify-between items-center text-[10px]">
            {/* Colorway dots */}
            <div className="flex items-center gap-1.5">
              {colors.slice(0, 4).map(([name, hex]) => (
                <span
                  key={name}
                  className="w-2.5 h-2.5 rounded-none border border-zinc-500 inline-block"
                  style={{ backgroundColor: hex }}
                  title={name}
                />
              ))}
              {colors.length > 4 && (
                <span className="text-zinc-500 text-[9px]">+{colors.length - 4}</span>
              )}
            </div>

            {/* Sizes available */}
            {sizes.length > 0 && (
              <div className="flex gap-1 text-zinc-600 font-bold uppercase">
                {sizes.slice(0, 4).map((sz) => (
                  <span key={sz} className="border border-zinc-300 px-1 py-0.2">
                    {sz}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
