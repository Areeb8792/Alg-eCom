import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { Search } from 'lucide-react';

interface CatalogPageProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onQuickAdd: (product: Product) => void;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectProduct?: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products,
  loading,
  error,
  onQuickAdd,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onSelectProduct
}) => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const categories = ['ALL', 'OUTERWEAR', 'TOPS', 'TAILORING', 'ACCESSORIES'];

  useEffect(() => {
    if (categorySlug) {
      const match = categories.find((c) => c.toLowerCase() === categorySlug.toLowerCase());
      if (match && match !== selectedCategory) {
        onSelectCategory(match);
      }
    }
  }, [categorySlug]);

  const handleCategoryClick = (cat: string) => {
    onSelectCategory(cat);
    if (cat === 'ALL') {
      navigate('/');
    } else {
      navigate(`/collections/${cat.toLowerCase()}`);
    }
  };

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
                  onClick={() => handleCategoryClick(cat)}
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

        {/* Products Horizontal Scroll / Grid */}
        {!loading && !error && (
          <div className="px-8 lg:px-16">
            {products.length === 0 ? (
              <div className="py-12 text-zinc-500 space-grotesk text-sm">
                No pieces found matching the current archive query.
              </div>
            ) : (
              <div className="flex gap-8 overflow-x-auto pb-8 pt-4 no-scrollbar snap-x">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickAdd={onQuickAdd}
                    onSelect={onSelectProduct}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Brand Ethos Section */}
      <section className="py-24 px-8 lg:px-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-ink">
        <div className="space-y-4">
          <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase text-zinc-500 block">
            01 / ARCHITECTURE
          </span>
          <h3 className="anton-heading text-2xl">TRANSACTIONAL STOCK LOCKING</h3>
          <p className="space-grotesk text-xs leading-relaxed text-zinc-700">
            Every inventory deduction executes in an isolated atomic PostgreSQL transaction with <code className="bg-zinc-200 px-1 py-0.5 font-mono text-[11px]">WHERE stock &gt;= requested</code> guards to prevent double-allocation under race conditions.
          </p>
        </div>

        <div className="space-y-4">
          <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase text-zinc-500 block">
            02 / RELIABILITY
          </span>
          <h3 className="anton-heading text-2xl">IDEMPOTENT ORDER CREATION</h3>
          <p className="space-grotesk text-xs leading-relaxed text-zinc-700">
            Network retries and multiple submissions are safely intercepted by an atomic database table keyed on client UUIDs, guaranteeing financial safety and preventing duplicate charges.
          </p>
        </div>

        <div className="space-y-4">
          <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase text-zinc-500 block">
            03 / OBSERVABILITY
          </span>
          <h3 className="anton-heading text-2xl">AUDITABLE OPERATIONS</h3>
          <p className="space-grotesk text-xs leading-relaxed text-zinc-700">
            Administrative adjustments, health checks, readiness probes and audit logs are recorded with structured JSON logs, Pino redaction, and sub-millisecond response latency.
          </p>
        </div>
      </section>
    </div>
  );
};
