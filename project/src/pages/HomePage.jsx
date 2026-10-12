import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { Search, SlidersHorizontal, PackageSearch, X } from 'lucide-react';

const CATEGORIES = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other'];

export default function HomePage({ onProductClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/products/');
      setProducts(data);
    } catch {
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'all') result = result.filter((p) => p.category === selectedCategory);
    switch (priceRange) {
      case 'free':     result = result.filter((p) => p.price === 0); break;
      case 'under25':  result = result.filter((p) => p.price > 0 && p.price < 25); break;
      case 'under50':  result = result.filter((p) => p.price >= 25 && p.price < 50); break;
      case 'under100': result = result.filter((p) => p.price >= 50 && p.price < 100); break;
      case 'over100':  result = result.filter((p) => p.price >= 100); break;
      default: break;
    }
    switch (sortBy) {
      case 'price_low':  result.sort((a, b) => a.price - b.price); break;
      case 'price_high': result.sort((a, b) => b.price - a.price); break;
      default: result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return result;
  }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

  const activeFilters = (selectedCategory !== 'all' ? 1 : 0) + (priceRange !== 'all' ? 1 : 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-700 p-6 text-white sm:p-8">
        <h1 className="text-2xl font-bold sm:text-3xl">Browse Campus Listings</h1>
        <p className="mt-2 text-teal-100">Find books, electronics, furniture, and more from students near you.</p>
      </div>

      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for books, electronics, furniture..."
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
            showFilters || activeFilters > 0 ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilters > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-teal-600 px-1 text-xs text-white">{activeFilters}</span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500">
                <option value="all">All Categories</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Price Range</label>
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500">
                <option value="all">Any Price</option>
                <option value="free">Free</option>
                <option value="under25">Under $25</option>
                <option value="under50">$25 – $50</option>
                <option value="under100">$50 – $100</option>
                <option value="over100">$100+</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500">
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>
          </div>
          {activeFilters > 0 && (
            <button onClick={() => { setSelectedCategory('all'); setPriceRange('all'); }} className="mt-3 flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
              <X className="h-3.5 w-3.5" /> Clear filters
            </button>
          )}
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-slate-600">
          {loading ? 'Loading...' : `${filtered.length} listing${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchProducts} className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700">Try again</button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white">
              <div className="aspect-square rounded-t-xl bg-slate-200" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-5 w-1/3 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <PackageSearch className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900">No listings found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchQuery || activeFilters > 0 ? 'Try adjusting your search or filters.' : 'Be the first to post a listing!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} onClick={() => onProductClick(product.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
