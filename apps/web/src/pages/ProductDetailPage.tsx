import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product } from '../types/index.js';
import { fetchProducts } from '../services/api.js';
import { useCart } from '../context/CartContext.js';
import { ArrowLeft, Check, ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetchProducts()
      .then((res) => {
        if (!isMounted) return;
        const found = res.products.find((p) => p.slug === slug || p.id === slug);
        if (found) {
          setProduct(found);
          setRelated(res.products.filter((p) => p.id !== found.id && p.category === found.category).slice(0, 3));
        } else {
          setError(`Product "${slug}" was not found in the luxury archive.`);
        }
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

  if (loading) {
    return (
      <div className="min-h-screen pt-40 px-8 lg:px-16 flex items-center justify-center">
        <div className="space-grotesk text-sm uppercase tracking-widest text-zinc-500 animate-pulse">
          Loading archive item details...
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-40 px-8 lg:px-16 max-w-4xl mx-auto space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase space-grotesk border-b border-ink pb-1"
        >
          <ArrowLeft className="w-4 h-4" /> RETURN TO CATALOG
        </Link>
        <div className="p-8 bg-zinc-900 text-white border border-zinc-800 space-y-4">
          <h2 className="anton-heading text-3xl text-accentRed">ITEM NOT FOUND</h2>
          <p className="space-grotesk text-sm text-zinc-400">{error || 'Requested item does not exist.'}</p>
        </div>
      </div>
    );
  }

  const formattedPrice = `$${(product.price_cents / 100).toFixed(2)}`;
  const isSoldOut = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const handleAdd = () => {
    if (isSoldOut) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="min-h-screen pt-32 pb-24 px-8 lg:px-16 max-w-7xl mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="mb-8 flex items-center gap-3 text-xs space-grotesk uppercase tracking-widest text-zinc-500">
        <Link to="/" className="hover:text-ink transition-colors">ARCHIVE</Link>
        <span>/</span>
        <Link to={`/collections/${product.category.toLowerCase()}`} className="hover:text-ink transition-colors">
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-ink font-bold">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left: Product Imagery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/5] bg-zinc-900 border border-ink overflow-hidden sharp-shadow relative group">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 bg-white px-3 py-1 text-xs font-bold space-grotesk uppercase text-ink">
              {product.category}
            </div>
            <div className="absolute bottom-4 left-4">
              {isSoldOut ? (
                <span className="bg-accentRed text-white px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  SOLD OUT
                </span>
              ) : isLowStock ? (
                <span className="bg-amber-500 text-ink px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  ONLY {product.stock} PIECES LEFT
                </span>
              ) : (
                <span className="bg-black/80 backdrop-blur-sm text-zinc-300 px-3 py-1 text-xs font-bold uppercase tracking-widest">
                  {product.stock} IN STOCK
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Editorial & Purchasing Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div>
            <div className="space-grotesk text-xs tracking-[0.3em] uppercase text-zinc-500 mb-2">
              SKU: {product.sku}
            </div>
            <h1 className="anton-heading text-5xl lg:text-6xl text-ink leading-none mb-4">
              {product.name}
            </h1>
            <div className="text-3xl font-bold space-grotesk mb-6 text-accentRed">
              {formattedPrice} <span className="text-xs text-zinc-600 font-normal">USD</span>
            </div>

            <p className="space-grotesk text-sm leading-relaxed text-zinc-800 mb-8 border-t border-zinc-300 pt-6">
              {product.description}
            </p>

            {/* Inventory Status Table */}
            <div className="bg-white border border-ink p-5 space-y-3 space-grotesk text-xs mb-8">
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 uppercase tracking-wider">STOCK RESERVATION</span>
                <span className={`font-bold ${isSoldOut ? 'text-accentRed' : 'text-emerald-700'}`}>
                  {isSoldOut ? 'ALLOCATION DEPLETED' : `${product.stock} UNITS ALLOCATED`}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-zinc-200">
                <span className="text-zinc-500 uppercase tracking-wider">INTEGRITY MODEL</span>
                <span className="font-bold text-ink">POSTGRESQL ROW LOCKING</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 uppercase tracking-wider">LOGISTICS</span>
                <span className="text-zinc-800">GLOBAL EXPRESS COMPLIMENTARY</span>
              </div>
            </div>

            {/* Quantity Selector and CTA */}
            {!isSoldOut ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="space-grotesk text-xs font-bold uppercase">QUANTITY</span>
                  <div className="flex items-center border border-ink bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-4 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 text-sm font-bold"
                    >
                      -
                    </button>
                    <span className="px-5 py-2 text-sm font-bold min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                      disabled={quantity >= product.stock}
                      className="px-4 py-2 hover:bg-zinc-200 transition-colors disabled:opacity-30 text-sm font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={handleAdd}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest space-grotesk transition-all border border-ink flex items-center justify-center gap-2 ${
                      added ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-ink text-white hover:bg-zinc-800'
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
                    className="py-4 px-6 text-xs font-bold uppercase tracking-widest space-grotesk border border-ink bg-white hover:bg-zinc-100 transition-colors"
                  >
                    VIEW BAG
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-zinc-200 border border-zinc-400 text-center space-grotesk text-xs uppercase font-bold text-zinc-600">
                CURRENTLY SOLD OUT — JOIN ALLOCATION WAITLIST
              </div>
            )}
          </div>

          {/* Value Props */}
          <div className="pt-8 border-t border-zinc-300 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] space-grotesk text-zinc-600">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-ink flex-shrink-0" />
              <span>Complimentary insured shipping worldwide</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-ink flex-shrink-0" />
              <span>Cryptographic order idempotency</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-ink flex-shrink-0" />
              <span>14-day archival exchange window</span>
            </div>
          </div>
        </div>
      </div>

      {/* Related Items Section */}
      {related.length > 0 && (
        <div className="mt-24 pt-16 border-t border-zinc-300 space-y-8">
          <h2 className="anton-heading text-3xl text-ink">RELATED IN {product.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/products/${item.slug}`}
                className="group block bg-white border border-zinc-300 p-4 hover:border-ink transition-all"
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
                  <span className="text-xs font-bold text-accentRed">
                    ${(item.price_cents / 100).toFixed(0)}
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
