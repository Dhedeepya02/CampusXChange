import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Package, Plus, Clock, ArrowLeft, ImageIcon, Trash2 } from 'lucide-react';

export default function MyListingsPage({ onBack, onNewListing }) {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('listings');

  const fetchMyData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: prods } = await api.get('/products/');
      // Filter to only user's own products
      const { data: me } = await api.get('/auth/me');
      const myProducts = prods.filter((p) => p.user_id === me.user.id);
      setProducts(myProducts);

      // Fetch offers for each of my products
      const allOffers = [];
      for (const p of myProducts) {
        try {
          const { data: offerData } = await api.get(`/offers/product/${p.id}`);
          allOffers.push(...offerData);
        } catch { /* ignore */ }
      }
      setOffers(allOffers);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMyData(); }, [fetchMyData]);

  async function handleDeleteProduct(productId) {
    if (!confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${productId}`);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err) {
      alert('Failed to delete: ' + (err.response?.data?.error || err.message));
    }
  }

  async function handleMarkSold(productId) {
    try {
      const { data } = await api.patch(`/products/${productId}`, { status: 'sold' });
      setProducts((prev) => prev.map((p) => p.id === productId ? data : p));
    } catch (err) {
      alert('Failed to update: ' + (err.response?.data?.error || err.message));
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 md:hidden">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Listings & Offers</h1>
        <button onClick={onNewListing} className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500">
          <Plus className="h-4 w-4" /> New Listing
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b border-slate-200">
        {[
          { key: 'listings', label: 'My Listings', icon: <Package className="h-4 w-4" />, count: products.length },
          { key: 'offers', label: 'Received Offers', icon: <Clock className="h-4 w-4" />, count: offers.length },
        ].map(({ key, label, icon, count }) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${tab === key ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {icon} {label} ({count})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200" />)}</div>
      ) : tab === 'listings' ? (
        products.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Package className="mx-auto mb-3 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-900">No listings yet</h3>
            <p className="mt-1 text-sm text-slate-500">Post your first item to start exchanging.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{product.title}</p>
                  <p className="text-sm text-slate-500">{product.category} · {product.condition} · {product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</p>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${product.status === 'available' ? 'bg-emerald-100 text-emerald-700' : product.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
                    {product.status}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {product.status === 'available' && (
                    <button onClick={() => handleMarkSold(product.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100">Mark Sold</button>
                  )}
                  <button onClick={() => handleDeleteProduct(product.id)} className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : offers.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Clock className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900">No offers received</h3>
          <p className="mt-1 text-sm text-slate-500">Offers on your listings will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <div key={offer.id} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {offer.products?.image_url ? <img src={offer.products.image_url} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon className="h-8 w-8" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{offer.products?.title ?? 'Unknown item'}</p>
                <p className="text-sm text-slate-600">
                  Offer from {offer.profiles?.full_name ?? 'Unknown'}: {offer.offer_price != null ? `$${offer.offer_price.toFixed(2)}` : 'Trade offer'}
                </p>
                {offer.offer_message && <p className="mt-0.5 truncate text-xs text-slate-400">{offer.offer_message}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${offer.status === 'pending' ? 'bg-amber-100 text-amber-700' : offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : offer.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                {offer.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
