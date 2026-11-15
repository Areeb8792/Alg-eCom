import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Product, Category, Collection, ProductFilterParams } from '../types/index.js';
import { ProductCard } from '../components/ProductCard.js';
import { fetchProducts, fetchCategories, fetchCollections, fetchRecommendations } from '../services/api.js';
import { useAuth } from '../context/AuthContext.js';
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Grid,
  ListFilter,
  Check
} from 'lucide-react';

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

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const COLOR_SWATCHES = [
  { name: 'Ink Black', hex: '#1B0E0D' },
  { name: 'Concrete Bone', hex: '#E3E2DE' },
  { name: 'Burnt Red', hex: '#C72A09' },
  { name: 'Ash Grey', hex: '#7D7D7D' },
  { name: 'Olive Drab', hex: '#4A5340' },
  { name: 'Raw Cream', hex: '#F5F2EB' }
];

const FIT_OPTIONS = ['ALL', 'OVERSIZED', 'BOXY', 'TAILORED', 'RELAXED'];
const QUICK_CATEGORIES = ['ALL', 'OUTERWEAR', 'TOPS', 'TAILORING', 'ACCESSORIES'];

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onQuickAdd,
  onSelectProduct
}) => {
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  // Categories & Collections state
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  // Faceted Filtering State
  const [selectedCategory, setSelectedCategory] = useState<string>(categorySlug ? categorySlug.toUpperCase() : 'ALL');
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedFit, setSelectedFit] = useState<string>('ALL');
  const [maxPrice, setMaxPrice] = useState<number>(500); // in dollars ($0 - $500)
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popularity' | 'rating'>('newest');

  // Products & UI state
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState<boolean>(false);
  const [layoutMode, setLayoutMode] = useState<'grid' | 'editorial'>('grid');

  // Load initial reference taxonomy (categories, collections, recommendations)
  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([
      fetchCategories(),
      fetchCollections(),
      fetchRecommendations(token || undefined)
    ]).then(([catRes, colRes, recRes]) => {
      if (!isMounted) return;
      if (catRes.status === 'fulfilled') setCategories(catRes.value);
      if (colRes.status === 'fulfilled') setCollections(colRes.value);
      if (recRes.status === 'fulfilled') setRecommendations(recRes.value);
    });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Sync categorySlug URL parameter
  useEffect(() => {
    if (categorySlug) {
      setSelectedCategory(categorySlug.toUpperCase());
    }
  }, [categorySlug]);

  // Query catalog whenever filter parameters change
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMsg(null);

    const filterParams: ProductFilterParams = {
      category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      collection: selectedCollection || undefined,
      size: selectedSize || undefined,
      color: selectedColor || undefined,
      fit: selectedFit !== 'ALL' ? selectedFit : undefined,
      maxPrice: maxPrice < 500 ? maxPrice * 100 : undefined,
      inStockOnly: inStockOnly ? true : undefined,
      search: searchQuery.trim() || undefined,
      sort: sortBy
    };

    fetchProducts(filterParams)
      .then((res) => {
        if (!isMounted) return;
        setCatalogProducts(res.products);
        setTotalCount(res.total);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMsg(err instanceof Error ? err.message : 'Error retrieving collection archive');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    selectedCategory,
    selectedCollection,
    selectedSize,
    selectedColor,
    selectedFit,
    maxPrice,
    inStockOnly,
    searchQuery,
    sortBy
  ]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'ALL') {
      navigate('/');
    } else {
      navigate(`/collections/${cat.toLowerCase()}`);
    }
  };

  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedCollection('');
    setSelectedSize('');
    setSelectedColor('');
    setSelectedFit('ALL');
    setMaxPrice(500);
    setInStockOnly(false);
    setSearchQuery('');
    setSortBy('newest');
    navigate('/');
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    Boolean(selectedCollection) ||
    Boolean(selectedSize) ||
    Boolean(selectedColor) ||
    selectedFit !== 'ALL' ||
    maxPrice < 500 ||
    inStockOnly ||
    Boolean(searchQuery.trim());

  return (
    <div className="min-h-screen relative flex flex-col bg-[#E3E2DE] text-[#1B0E0D]">
      {/* 1. Hero Statement Section */}
      <section className="relative min-h-[85vh] w-full flex overflow-hidden border-b-2 border-[#1B0E0D]">
        <div className="w-full lg:w-[48%] h-full flex flex-col justify-end p-8 lg:p-16 pb-20 z-10 pt-32">
          <div className="space-grotesk text-xs tracking-[0.3em] font-bold text-[#C72A09] uppercase mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-[#C72A09] inline-block animate-pulse"></span>
            SEASON 04 // INDUSTRIAL LUXURY
          </div>
          <h1 className="anton-heading text-[11vw] lg:text-[7.5vw] leading-[0.88] mb-6 text-[#1B0E0D]">
            COUTURE<br />STATEMENT
          </h1>
          <p className="space-grotesk text-sm leading-relaxed max-w-[420px] text-[#1B0E0D]/80 mb-8">
            High-density organic cottons, modular tactical outer garments, and architectural silhouettes engineered with cryptographic inventory consistency.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href="#catalog-browser"
              className="px-6 py-3.5 bg-[#1B0E0D] text-white space-grotesk text-xs font-bold uppercase tracking-widest hover:bg-[#C72A09] transition-colors"
            >
              EXPLORE CATALOG ↓
            </a>
            {collections.length > 0 && (
              <span className="space-grotesk text-xs text-[#1B0E0D]/60 tracking-wider">
                {collections.length} ACTIVE COLLECTIONS AVAILABLE
              </span>
            )}
          </div>
        </div>

        {/* Right Hero Image */}
        <div className="hidden lg:block absolute right-0 top-0 w-[54%] h-full overflow-hidden grayscale-hover group border-l-2 border-[#1B0E0D]">
          <img
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop"
            alt="Algions Brutalist Haute Couture"
            className="w-full h-full object-cover object-left"
          />
          <div className="absolute bottom-8 left-8 z-20 bg-[#1B0E0D] text-white px-4 py-2 space-grotesk text-xs uppercase tracking-widest">
            HW ARCHIVE // RUNWAY 04
          </div>
        </div>
      </section>

      {/* 2. Personalized / Editorial Recommendation Bar */}
      {recommendations.length > 0 && (
        <section className="bg-[#1B0E0D] text-white py-12 px-8 lg:px-16 border-b-2 border-[#1B0E0D]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#31EF07]" />
              <div>
                <h3 className="anton-heading text-2xl lg:text-3xl tracking-wide">
                  {user ? `CURATED FOR ${user.full_name.toUpperCase()}` : 'EDITORIAL SELECTIONS // CURATED FOR YOU'}
                </h3>
                <p className="space-grotesk text-[11px] text-zinc-400 uppercase tracking-widest mt-1">
                  Algorithmic fit & style alignment matched to luxury preference profile
                </p>
              </div>
            </div>
            <Link
              to="/account"
              className="hidden sm:inline-block space-grotesk text-xs font-bold text-[#31EF07] border-b border-[#31EF07] pb-0.5 hover:text-white hover:border-white transition-all uppercase"
            >
              REFINE PREFERENCES →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <Link
                key={`rec-${item.id}`}
                to={`/products/${item.slug}`}
                className="group block bg-zinc-900 border border-zinc-800 p-3 hover:border-white transition-all"
              >
                <div className="aspect-[3/4] bg-zinc-800 overflow-hidden mb-3 relative">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-[#1B0E0D]/90 text-white text-[9px] font-bold px-1.5 py-0.5 space-grotesk uppercase">
                    {item.category}
                  </div>
                </div>
                <h4 className="space-grotesk text-xs font-bold uppercase truncate text-zinc-200 group-hover:text-white">
                  {item.name}
                </h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="space-grotesk text-xs font-bold text-[#C72A09]">
                    ${(item.price_cents / 100).toFixed(0)} USD
                  </span>
                  <span className="space-grotesk text-[10px] text-zinc-500 uppercase">
                    {item.fit_type || 'RELAXED'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Main Discovery Workspace */}
      <section id="catalog-browser" className="py-12 px-6 lg:px-12 flex-1">
        <div className="mb-6">
          <h2 className="anton-heading text-4xl lg:text-5xl text-[#1B0E0D] uppercase tracking-wide">
            ESSENTIALS
          </h2>
          <p className="space-grotesk text-xs text-zinc-600 uppercase tracking-widest mt-1">
            REAL-TIME CATALOG SYNCHRONIZED WITH POSTGRESQL BACKEND
          </p>
        </div>

        {/* Top Control Bar: Search, Category Quick Tabs, Layout & Mobile Filter Trigger */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="SEARCH ARCHIVE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-2 border-[#1B0E0D] text-xs font-medium px-10 py-3 space-grotesk outline-none focus:bg-white transition-all uppercase placeholder:text-zinc-500 shadow-[3px_3px_0px_#1B0E0D]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button & Sort Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsFilterSidebarOpen(!isFilterSidebarOpen)}
                className={`flex items-center gap-2 px-5 py-3 border-2 border-[#1B0E0D] text-xs font-bold uppercase tracking-wider space-grotesk transition-all shadow-[3px_3px_0px_#1B0E0D] ${
                  isFilterSidebarOpen || hasActiveFilters ? 'bg-[#1B0E0D] text-white' : 'bg-white text-[#1B0E0D]'
                }`}
              >
                <SlidersHorizontal className="w-4 h-4" />
                FILTERS {hasActiveFilters && `(ACTIVE)`}
              </button>

              {/* Sort By Dropdown */}
              <div className="relative flex items-center bg-white border-2 border-[#1B0E0D] px-3 py-2.5 shadow-[3px_3px_0px_#1B0E0D]">
                <ListFilter className="w-3.5 h-3.5 text-zinc-600 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent space-grotesk text-xs font-bold uppercase outline-none cursor-pointer pr-4"
                >
                  <option value="newest">SORT: LATEST DROPS</option>
                  <option value="price_asc">PRICE: LOW → HIGH</option>
                  <option value="price_desc">PRICE: HIGH → LOW</option>
                  <option value="popularity">POPULARITY</option>
                  <option value="rating">EDITORIAL RATING</option>
                </select>
              </div>

              {/* Layout Toggle */}
              <button
                onClick={() => setLayoutMode(layoutMode === 'grid' ? 'editorial' : 'grid')}
                className="hidden lg:flex items-center justify-center p-3 border-2 border-[#1B0E0D] bg-white shadow-[3px_3px_0px_#1B0E0D]"
                title="Toggle View Mode"
              >
                <Grid className="w-4 h-4 text-[#1B0E0D]" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-[#1B0E0D]/20 pt-2">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`text-xs font-bold uppercase space-grotesk px-4 py-2 border-2 transition-all flex-shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-[#1B0E0D] text-white border-[#1B0E0D] shadow-[2px_2px_0px_#C72A09]'
                    : 'bg-white text-[#1B0E0D] border-[#1B0E0D] hover:bg-zinc-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="space-grotesk text-[10px] font-bold uppercase text-zinc-500 mr-1">
                FILTER CRITERIA:
              </span>
              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  CAT: {selectedCategory}
                  <button onClick={() => setSelectedCategory('ALL')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedCollection && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  COLLECTION: {selectedCollection}
                  <button onClick={() => setSelectedCollection('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedSize && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  SIZE: {selectedSize}
                  <button onClick={() => setSelectedSize('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedColor && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  COLOR: {selectedColor}
                  <button onClick={() => setSelectedColor('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedFit !== 'ALL' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  FIT: {selectedFit}
                  <button onClick={() => setSelectedFit('ALL')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {maxPrice < 500 && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  UNDER ${maxPrice}
                  <button onClick={() => setMaxPrice(500)}><X className="w-3 h-3" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1B0E0D] text-white space-grotesk text-[11px] font-bold">
                  IN-STOCK ONLY
                  <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-[11px] font-bold space-grotesk uppercase text-[#C72A09] hover:underline ml-2"
              >
                <RotateCcw className="w-3 h-3" /> CLEAR ALL
              </button>
            </div>
          )}
        </div>

        {/* Content Layout: Filter Sidebar (Collapsible) + Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Faceted Filter Sidebar */}
          {isFilterSidebarOpen && (
            <aside className="lg:col-span-3 bg-white border-2 border-[#1B0E0D] p-6 space-y-8 shadow-[4px_4px_0px_#1B0E0D]">
              <div className="flex justify-between items-center pb-4 border-b-2 border-[#1B0E0D]">
                <h4 className="anton-heading text-xl uppercase tracking-wider">FILTERS</h4>
                <button
                  onClick={handleResetFilters}
                  className="space-grotesk text-[10px] font-bold uppercase text-[#C72A09] hover:underline"
                >
                  RESET
                </button>
              </div>

              {/* Category Taxonomy Tree Filter */}
              {categories.length > 0 && (
                <div className="space-y-3">
                  <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">
                    CATEGORY TAXONOMY
                  </span>
                  <div className="space-y-1.5">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() =>
                          setSelectedCategory(selectedCategory === cat.name.toUpperCase() ? 'ALL' : cat.name.toUpperCase())
                        }
                        className={`w-full text-left px-3 py-2 text-xs space-grotesk font-bold uppercase border flex justify-between items-center ${
                          selectedCategory === cat.name.toUpperCase()
                            ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                            : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        {cat.children && cat.children.length > 0 && (
                          <span className="text-[10px] opacity-70">[{cat.children.length} SUB]</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 1. Curated Collections Filter */}
              {collections.length > 0 && (
                <div className="space-y-3">
                  <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">
                    COLLECTION ARCHIVE
                  </span>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setSelectedCollection('')}
                      className={`w-full text-left px-3 py-2 text-xs space-grotesk font-bold uppercase border ${
                        selectedCollection === ''
                          ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                      }`}
                    >
                      ALL COLLECTIONS
                    </button>
                    {collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedCollection(selectedCollection === col.slug ? '' : col.slug)}
                        className={`w-full text-left px-3 py-2 text-xs space-grotesk font-bold uppercase border flex justify-between items-center ${
                          selectedCollection === col.slug
                            ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                            : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                        }`}
                      >
                        <span className="truncate">{col.name}</span>
                        {col.product_count !== undefined && (
                          <span className="text-[10px] opacity-70">[{col.product_count}]</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Size Facet Chips */}
              <div className="space-y-3">
                <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">
                  SIZE SELECTION
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {AVAILABLE_SIZES.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(selectedSize === sz ? '' : sz)}
                      className={`py-2 text-xs font-bold space-grotesk uppercase border text-center transition-all ${
                        selectedSize === sz
                          ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Color Swatch Filter */}
              <div className="space-y-3">
                <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">
                  PALETTE // COLORWAY
                </span>
                <div className="space-y-2">
                  {COLOR_SWATCHES.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(selectedColor === c.name ? '' : c.name)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 border text-xs space-grotesk font-bold uppercase transition-all ${
                        selectedColor === c.name
                          ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                      }`}
                    >
                      <span
                        className="w-4 h-4 border border-zinc-400 inline-block flex-shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="flex-1 text-left">{c.name}</span>
                      {selectedColor === c.name && <Check className="w-3.5 h-3.5 text-[#31EF07]" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Fit Selector */}
              <div className="space-y-3">
                <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500 block">
                  ARCHITECTURAL FIT
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {FIT_OPTIONS.map((f) => (
                    <button
                      key={f}
                      onClick={() => setSelectedFit(f)}
                      className={`py-2 text-xs font-bold space-grotesk uppercase border text-center transition-all ${
                        selectedFit === f
                          ? 'bg-[#1B0E0D] text-white border-[#1B0E0D]'
                          : 'bg-zinc-50 text-zinc-800 border-zinc-300 hover:border-[#1B0E0D]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Price Ceiling Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="space-grotesk text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    PRICE CEILING
                  </span>
                  <span className="space-grotesk text-xs font-bold text-[#C72A09]">
                    ${maxPrice} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                  className="w-full accent-[#1B0E0D] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] space-grotesk text-zinc-400">
                  <span>$50</span>
                  <span>$250</span>
                  <span>$500+</span>
                </div>
              </div>

              {/* 6. In-Stock Only Toggle */}
              <div className="pt-2 border-t border-zinc-200">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#1B0E0D]"
                  />
                  <span className="space-grotesk text-xs font-bold uppercase text-[#1B0E0D]">
                    IN-STOCK PIECES ONLY
                  </span>
                </label>
              </div>
            </aside>
          )}

          {/* Product Grid Area */}
          <main className={isFilterSidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'}>
            {/* Header info */}
            <div className="flex justify-between items-baseline mb-6 border-b border-[#1B0E0D]/20 pb-3">
              <span className="space-grotesk text-xs uppercase tracking-widest text-zinc-600 font-bold">
                SHOWING {catalogProducts.length} OF {totalCount} ARCHIVAL PIECES
              </span>
              <span className="space-grotesk text-[11px] uppercase tracking-wider text-zinc-500">
                POSTGRESQL SYNCHRONIZED
              </span>
            </div>

            {/* Loading & Error States */}
            {isLoading && (
              <div className="py-24 text-center space-y-4">
                <div className="w-8 h-8 border-4 border-[#1B0E0D] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-grotesk text-xs uppercase tracking-widest text-zinc-600">
                  SYNCHRONIZING INVENTORY WITH DATABASE...
                </div>
              </div>
            )}

            {errorMsg && (
              <div className="p-8 bg-white border-2 border-[#C72A09] space-y-3 shadow-[4px_4px_0px_#C72A09]">
                <h3 className="anton-heading text-2xl text-[#C72A09]">QUERY FAULT</h3>
                <p className="space-grotesk text-xs text-zinc-700">{errorMsg}</p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-[#1B0E0D] text-white text-xs font-bold space-grotesk uppercase tracking-wider"
                >
                  RESET QUERY FILTERS
                </button>
              </div>
            )}

            {/* Product Grid */}
            {!isLoading && !errorMsg && (
              <>
                {catalogProducts.length === 0 ? (
                  <div className="py-24 text-center bg-white border-2 border-[#1B0E0D] p-12 space-y-4 shadow-[4px_4px_0px_#1B0E0D]">
                    <h3 className="anton-heading text-3xl">NO MATCHING ARCHIVE PIECES</h3>
                    <p className="space-grotesk text-xs text-zinc-600 max-w-md mx-auto">
                      No products currently match your combined filter criteria. Try adjusting the size, color, or price ceiling.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-6 py-3 bg-[#1B0E0D] text-white space-grotesk text-xs font-bold uppercase tracking-widest hover:bg-[#C72A09] transition-colors"
                    >
                      RESET ALL FILTERS
                    </button>
                  </div>
                ) : (
                  <div
                    className={
                      layoutMode === 'grid'
                        ? isFilterSidebarOpen
                          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                          : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                        : 'grid grid-cols-1 sm:grid-cols-2 gap-8'
                    }
                  >
                    {catalogProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onQuickAdd={onQuickAdd}
                        onSelect={onSelectProduct}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </section>
    </div>
  );
};
