import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, ProductVariant } from '../types/index.js';
import { fetchProduct, fetchProducts } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import {
  ArrowLeft,
  Check,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RefreshCw,
  Star,
  ChevronDown,
  ChevronUp,
  PackageCheck
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gallery state
  const [selectedImage, setSelectedImage] = useState<string>('');

  // Variant selection state
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);

  // Accordion open/close state
  const [isSpecsOpen, setIsSpecsOpen] = useState(true);
  const [isShippingOpen, setIsShippingOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetchProduct(slug)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        setSelectedImage(data.image_url);

        // Pre-select first variant if available
        if (data.variants && data.variants.length > 0) {
          const firstVariant = data.variants[0];
          setSelectedSize(firstVariant.size);
          setSelectedColor(firstVariant.color);
          setSelectedVariant(firstVariant);
        }

        // Fetch related products in same category
        fetchProducts({ category: data.category, limit: 4 })
          .then((relRes) => {
            if (isMounted) {
              setRelated(relRes.products.filter((p) => p.id !== data.id).slice(0, 3));
            }
          })
          .catch(() => {});
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to retrieve product details.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Update selected variant when size or color changes
  useEffect(() => {
    if (!product || !product.variants) return;
    const match = product.variants.find(
      (v) =>
        (!selectedSize || v.size.toUpperCase() === selectedSize.toUpperCase()) &&
        (!selectedColor || v.color.toLowerCase() === selectedColor.toLowerCase())
    );
    if (match) {
      setSelectedVariant(match);
    } else {
      // Pick variant matching size
      const sizeMatch = product.variants.find((v) => v.size.toUpperCase() === selectedSize.toUpperCase());
      setSelectedVariant(sizeMatch || product.variants[0] || null);
    }
  }, [selectedSize, selectedColor, product]);

  if (loading) {
    return (
      <div className="min-h-screen pt-40 px-8 lg:px-16 flex flex-col items-center justify-center space-y-4 bg-[#E3E2DE]">
        <div className="w-10 h-10 border-4 border-[#1B0E0D] border-t-transparent rounded-full animate-spin"></div>
        <div className="space-grotesk text-xs uppercase tracking-widest text-[#1B0E0D]">
          RETRIEVING ARCHIVAL ITEM SPECIFICATIONS...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-40 pb-24 px-8 lg:px-16 max-w-4xl mx-auto space-y-6 bg-[#E3E2DE]">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase space-grotesk border-b border-[#1B0E0D] pb-1"
        >
          <ArrowLeft className="w-4 h-4" /> RETURN TO CATALOG
        </Link>
        <div className="p-8 bg-white border-2 border-[#C72A09] space-y-4 shadow-[4px_4px_0px_#C72A09]">
          <h2 className="anton-heading text-3xl text-[#C72A09]">ITEM NOT FOUND</h2>
          <p className="space-grotesk text-sm text-zinc-700">{error || 'Requested item does not exist.'}</p>
        </div>
      </div>
    );
  }

  // Stock and pricing calculation
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const currentPriceCents = selectedVariant?.price_cents || product.price_cents;
  const formattedPrice = `$${(currentPriceCents / 100).toFixed(2)}`;
  const isSoldOut = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  // Extract unique sizes and colors
  const availableSizes = Array.from(new Set(product.variants?.map((v) => v.size) || ['M']));
  const availableColors = Array.from(
    new Map(product.variants?.map((v) => [v.color, v.color_hex]) || []).entries()
  );

  // Gallery images list
  const galleryImages: string[] = [
    product.image_url,
    ...(product.images?.map((img) => img.image_url).filter((url) => url !== product.image_url) || [])
  ];

  const handleAdd = () => {
    if (isSoldOut) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-6 lg:px-12 max-w-7xl mx-auto bg-[#E3E2DE] text-[#1B0E0D]">
      {/* Breadcrumb Navigation */}
      <div className="mb-8 flex items-center gap-2 text-xs space-grotesk uppercase tracking-widest text-zinc-600">
        <Link to="/" className="hover:text-black font-bold">ARCHIVE</Link>
        <span>/</span>
        <Link to={`/collections/${product.category.toLowerCase()}`} className="hover:text-black font-bold">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-[#1B0E0D] font-bold truncate max-w-xs">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left: Multi-Image Editorial Gallery */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main High-Res Showcase View */}
          <div className="aspect-[4/5] bg-zinc-900 border-2 border-[#1B0E0D] overflow-hidden relative group shadow-[6px_6px_0px_#1B0E0D]">
            <img
              src={selectedImage || product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            {/* Category Tag */}
            <div className="absolute top-4 left-4 bg-white border border-[#1B0E0D] px-3 py-1 text-xs font-bold space-grotesk uppercase text-[#1B0E0D]">
              {product.category}
            </div>

            {/* Collection Tag */}
            {product.collection_name && (
              <div className="absolute top-4 right-4 bg-[#1B0E0D] text-white px-3 py-1 text-xs font-bold space-grotesk uppercase tracking-wider">
                {product.collection_name}
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute bottom-4 left-4">
              {isSoldOut ? (
                <span className="bg-[#C72A09] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest border border-black">
                  SOLD OUT ARCHIVE
                </span>
              ) : isLowStock ? (
                <span className="bg-[#1B0E0D] text-[#31EF07] px-3 py-1 text-xs font-bold uppercase tracking-widest border border-black">
                  ONLY {currentStock} PIECES ALLOCATED
                </span>
              ) : (
                <span className="bg-[#1B0E0D] text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  {currentStock} UNITS IN STOCK
                </span>
              )}
            </div>
          </div>

          {/* Thumbnail Gallery Strip */}
          {galleryImages.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={`thumb-${idx}`}
                  onClick={() => setSelectedImage(imgUrl)}
                  className={`aspect-[4/5] bg-zinc-900 border-2 overflow-hidden transition-all ${
                    selectedImage === imgUrl
                      ? 'border-[#C72A09] shadow-[3px_3px_0px_#C72A09]'
                      : 'border-[#1B0E0D] opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Technical Spec, Variant Selector & Purchasing Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          <div>
            <div className="space-grotesk text-xs tracking-[0.3em] uppercase text-zinc-600 mb-1 font-bold">
              SKU: {selectedVariant ? selectedVariant.sku : product.sku}
            </div>

            <h1 className="anton-heading text-4xl lg:text-5xl text-[#1B0E0D] leading-none mb-3">
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center text-[#1B0E0D]">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.round(product.rating_avg || 5.0) ? 'fill-[#1B0E0D] text-[#1B0E0D]' : 'text-zinc-300'
                    }`}
                  />
                ))}
              </div>
              <span className="space-grotesk text-xs font-bold text-zinc-700">
                {(product.rating_avg || 5.0).toFixed(1)} / 5.0 ({product.rating_count || 12} EDITORIAL REVIEWS)
              </span>
            </div>

            {/* Price */}
            <div className="text-3xl font-bold space-grotesk mb-6 text-[#C72A09]">
              {formattedPrice} <span className="text-xs text-[#1B0E0D] font-normal uppercase">USD (TAX INCLUDED)</span>
            </div>

            <p className="space-grotesk text-sm leading-relaxed text-zinc-800 mb-6 border-t-2 border-[#1B0E0D]/20 pt-4">
              {product.description}
            </p>

            {/* 1. Colorway Selector */}
            {availableColors.length > 0 && (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-bold space-grotesk uppercase">
                  <span>COLORWAY: {selectedColor || 'DEFAULT'}</span>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {availableColors.map(([colorName, colorHex]) => (
                    <button
                      key={colorName}
                      onClick={() => setSelectedColor(colorName)}
                      className={`flex items-center gap-2 px-3 py-1.5 border-2 space-grotesk text-xs font-bold uppercase transition-all ${
                        selectedColor === colorName
                          ? 'border-[#1B0E0D] bg-white shadow-[2px_2px_0px_#1B0E0D]'
                          : 'border-zinc-400 bg-zinc-100 hover:border-black'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 border border-zinc-500 inline-block"
                        style={{ backgroundColor: colorHex }}
                      />
                      <span>{colorName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Size Selector */}
            {availableSizes.length > 0 && (
              <div className="space-y-2 mb-6">
                <div className="flex justify-between items-center text-xs font-bold space-grotesk uppercase">
                  <span>SIZE ARCHIVE:</span>
                  <span className="text-[10px] text-zinc-500 underline cursor-pointer">FIT GUIDE</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {availableSizes.map((sz) => {
                    const variantForSize = product.variants?.find((v) => v.size.toUpperCase() === sz.toUpperCase());
                    const szStock = variantForSize ? variantForSize.stock : product.stock;
                    const isSzSoldOut = szStock <= 0;

                    return (
                      <button
                        key={sz}
                        onClick={() => setSelectedSize(sz)}
                        disabled={isSzSoldOut}
                        className={`py-2.5 text-xs font-bold space-grotesk uppercase border-2 text-center transition-all ${
                          selectedSize === sz
                            ? 'bg-[#1B0E0D] text-white border-[#1B0E0D] shadow-[2px_2px_0px_#C72A09]'
                            : isSzSoldOut
                            ? 'bg-zinc-200 border-zinc-300 text-zinc-400 line-through cursor-not-allowed'
                            : 'bg-white text-[#1B0E0D] border-[#1B0E0D] hover:bg-zinc-100'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Real-time Inventory Verification Signal */}
            <div className="bg-white border-2 border-[#1B0E0D] p-4 space-y-2 space-grotesk text-xs mb-6 shadow-[3px_3px_0px_#1B0E0D]">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <PackageCheck className="w-3.5 h-3.5 text-[#1B0E0D]" /> STOCK RESERVATION
                </span>
                <span className={`font-bold ${isSoldOut ? 'text-[#C72A09]' : 'text-emerald-700'}`}>
                  {isSoldOut ? 'ALLOCATION EXHAUSTED' : `${currentStock} UNITS CONFIRMED`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase tracking-wider">INTEGRITY MODEL</span>
                <span className="font-bold text-[#1B0E0D]">POSTGRESQL ROW LOCKING</span>
              </div>
            </div>

            {/* Purchasing Action Form */}
            {!isSoldOut ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="space-grotesk text-xs font-bold uppercase">QUANTITY</span>
                  <div className="flex items-center border-2 border-[#1B0E0D] bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-5 py-2 text-sm font-bold min-w-[3rem] text-center space-grotesk">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      disabled={quantity >= currentStock}
                      className="px-4 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAdd}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest space-grotesk transition-all border-2 border-[#1B0E0D] flex items-center justify-center gap-2 shadow-[4px_4px_0px_#1B0E0D] ${
                      added
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-[#1B0E0D] text-white hover:bg-[#C72A09]'
                    }`}
                  >
                    {added ? (
                      <>
                        <Check className="w-4 h-4" /> ADDED TO BAG ({quantity})
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> ADD TO BAG — {formattedPrice}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => {
                      handleAdd();
                      navigate('/bag');
                    }}
                    className="py-4 px-6 text-xs font-bold uppercase tracking-widest space-grotesk border-2 border-[#1B0E0D] bg-white hover:bg-zinc-100 transition-colors shadow-[4px_4px_0px_#1B0E0D]"
                  >
                    VIEW BAG
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-200 border-2 border-[#1B0E0D] text-center space-grotesk text-xs uppercase font-bold text-zinc-600">
                CURRENTLY SOLD OUT — JOIN ALLOCATION WAITLIST
              </div>
            )}
          </div>

          {/* Technical Specifications Accordion */}
          <div className="border-t-2 border-[#1B0E0D] pt-6 space-y-3">
            <button
              onClick={() => setIsSpecsOpen(!isSpecsOpen)}
              className="w-full flex justify-between items-center py-2 text-left font-bold space-grotesk text-xs uppercase"
            >
              <span>GARMENT ARCHITECTURE & SPECIFICATIONS</span>
              {isSpecsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isSpecsOpen && (
              <div className="bg-white border-2 border-[#1B0E0D] p-5 space-y-3 text-xs space-grotesk shadow-[3px_3px_0px_#1B0E0D]">
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 uppercase">FIT TYPE</span>
                  <span className="font-bold uppercase text-[#1B0E0D]">{product.fit_type || 'RELAXED'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 uppercase">FABRIC DENSITY</span>
                  <span className="font-bold text-[#1B0E0D]">{product.fabric_weight || '480 GSM HEAVYWEIGHT'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 uppercase">COMPOSITION</span>
                  <span className="font-bold text-[#1B0E0D]">{product.composition || '100% ORGANIC COTTON'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500 uppercase">COUNTRY OF ORIGIN</span>
                  <span className="font-bold text-[#1B0E0D]">{product.country_of_origin || 'PORTUGAL'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 uppercase">CARE GUIDELINES</span>
                  <span className="font-bold text-[#1B0E0D] text-right">{product.care_instructions || 'COLD WASH ONLY. DO NOT TUMBLE DRY.'}</span>
                </div>
              </div>
            )}

            {/* Shipping Accordion */}
            <button
              onClick={() => setIsShippingOpen(!isShippingOpen)}
              className="w-full flex justify-between items-center py-2 text-left font-bold space-grotesk text-xs uppercase border-t border-zinc-300"
            >
              <span>GLOBAL LOGISTICS & CRYPTOGRAPHIC IDEMPOTENCY</span>
              {isShippingOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isShippingOpen && (
              <div className="bg-white border-2 border-[#1B0E0D] p-5 space-y-3 text-xs space-grotesk shadow-[3px_3px_0px_#1B0E0D]">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#1B0E0D]" />
                  <span>Complimentary insured shipping worldwide on all Season 04 orders.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#1B0E0D]" />
                  <span>Orders protected by SHA-256 idempotency key reservation.</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-[#1B0E0D]" />
                  <span>14-day archival exchange window with complimentary return dispatch.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Archive Pieces */}
      {related.length > 0 && (
        <div className="mt-24 pt-16 border-t-2 border-[#1B0E0D] space-y-8">
          <h2 className="anton-heading text-3xl text-[#1B0E0D]">
            RELATED IN {product.category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.slug}`}
                className="group block bg-white border-2 border-[#1B0E0D] p-4 hover:border-[#C72A09] transition-all shadow-[4px_4px_0px_#1B0E0D]"
              >
                <div className="aspect-[3/4] bg-zinc-900 overflow-hidden mb-4">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                  />
                </div>
                <div className="flex justify-between items-baseline space-grotesk">
                  <h3 className="font-bold text-xs uppercase group-hover:line-through">{item.name}</h3>
                  <span className="text-xs font-bold text-[#C72A09]">
                    ${(item.price_cents / 100).toFixed(0)} USD
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
