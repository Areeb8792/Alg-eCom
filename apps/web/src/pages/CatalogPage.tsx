import React from 'react';
import { Product } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { Search } from 'lucide-react';

interface CatalogPageProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  loading,
  error,
  onSelectProduct,
  onQuickAdd,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  const categories = ['ALL', 'OUTERWEAR', 'TOPS', 'TAILORING', 'ACCESSORIES'];

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Split Hero Section */}
      <section className="relative min-h-[92vh] w-full flex overflow-hidden">
        {/* Left Side Content */}
        <div className="w-full lg:w-[45%] h-full flex flex-col justify-end p-8 lg:p-16 pb-24 z-10 pt-32">
          <h1 className="anton-heading text-[12vw] lg:text-[8vw] leading-[0.85] mb-8 text-ink">
            COUTURE<br />STATEMENT
          </h1>
          <div className="space-y-6">
            <p className="space-grotesk text-sm leading-relaxed max-w-[360px] text-ink opacity-80">
              Curated luxury pieces designed for the fashion-forward minimalist. Timeless silhouettes that transcend seasons. Handpicked collections engineered with strict inventory consistency.
            </p>
            <a
              href="#essentials"
              className="inline-block space-grotesk font-bold text-sm uppercase border-b-2 border-ink pb-1 hover:line-through transition-all"
            >
              EXPLORE ESSENTIALS ↓
            </a>
          </div>
        </div>

        {/* Right Side Image */}
        <div className="hidden lg:block absolute right-0 top-0 w-[58%] h-full overflow-hidden grayscale-hover group">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Luxury Fashion Editorial"
            className="w-full h-full object-cover object-left"
          />
          <div className="absolute bottom-12 left-0 z-20">
            <span className="vertical-text anton-heading text-4xl text-white mix-blend-difference opacity-40">
              COLLECTION 004
            </span>
          </div>
        </div>
      </section>

      {/* Essentials Section (Dark Strip) */}
      <section id="essentials" className="bg-ink py-24 lg:py-32 overflow-hidden text-white">
        <div className="px-8 lg:px-16 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="anton-heading text-5xl lg:text-7xl text-white">ESSENTIALS</h2>
            <p className="space-grotesk text-xs text-zinc-400 mt-2">
              REAL-TIME CATALOG SYNCHRONIZED WITH POSTGRESQL BACKEND
            </p>
          </div>

          {/* Search & Category Filter Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="SEARCH ARCHIVE..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 text-xs px-9 py-2 rounded-none space-grotesk outline-none focus:border-white text-white placeholder:text-zinc-500 w-48 lg:w-64"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => onSelectCategory(cat)}
                  className={`text-[11px] font-bold uppercase space-grotesk px-3 py-1.5 transition-all ${
                    selectedCategory === cat
                      ? 'bg-white text-ink'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="px-8 lg:px-16 py-12 text-zinc-400 space-grotesk text-sm animate-pulse">
            Retrieving inventory from API backend...
          </div>
        )}

        {error && (
          <div className="px-8 lg:px-16 py-12 text-accentRed space-grotesk text-sm">
            Failed to connect to API: {error}
          </div>
        )}

        {/* Horizontal Carousel */}
        {!loading && !error && (
          <div className="flex overflow-x-auto gap-8 px-8 lg:px-16 pb-8 hide-scrollbar snap-x">
            {products.length === 0 ? (
              <div className="text-zinc-500 text-sm space-grotesk py-8">
                No pieces found matching the current search criteria.
              </div>
            ) : (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  onQuickAdd={onQuickAdd}
                />
              ))
            )}
          </div>
        )}
      </section>

      {/* Featured Collections Section */}
      <section id="collections" className="grid grid-cols-12 gap-0 border-t border-zinc-300">
        <div className="col-span-12 lg:col-span-4 bg-white p-8 lg:p-16 lg:sticky lg:top-0 h-fit border-b lg:border-b-0 lg:border-r border-zinc-200">
          <h2 className="anton-heading text-5xl lg:text-6xl mb-6">FEATURED COLLECTIONS</h2>
          <div className="border-l-4 border-ink pl-6 space-y-4">
            <p className="space-grotesk text-xs uppercase font-bold tracking-widest text-accentRed">
              NEW: SPRING/SUMMER 2025 EDITORIAL
            </p>
            <p className="space-grotesk text-sm leading-relaxed opacity-70">
              Explore our carefully curated seasonal collections. Each piece is selected for its architectural silhouette, quality craftsmanship, and timeless appeal.
            </p>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="aspect-square grayscale-hover overflow-hidden border-b border-zinc-200">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1000&auto=format&fit=crop"
                alt="Collection Editorial 1"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square grayscale-hover overflow-hidden border-l border-b border-zinc-200">
              <img
                src="https://images.unsplash.com/photo-1445205170230-053b830c6050?q=80&w=1000&auto=format&fit=crop"
                alt="Collection Editorial 2"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-1 md:col-span-2 aspect-video grayscale-hover overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?q=80&w=2000&auto=format&fit=crop"
                alt="Collection Editorial 3"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
