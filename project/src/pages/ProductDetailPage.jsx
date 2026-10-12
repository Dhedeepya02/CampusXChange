import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ArrowLeft, Tag, Sparkles, DollarSign, Repeat,
  MessageSquare, User as UserIcon, CheckCircle, XCircle,
  Loader2, ImageIcon,
} from 'lucide-react';

export default function ProductDetailPage({ productId, onBack, onMessage }) {
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerType, setOfferType] = useState('purchase');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id === product?.user_id;

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/products/${productId}`);
      setProduct(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load this listing.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  const fetchOffers = useCallback(async () => {
    try {
      const { data } = await api.get(`/offers/product/${productId}`);
      setOffers(data);
    } catch { /* ignore */ }
  }, [productId]);

  useEffect(() => {
    fetchProduct();
    fetchOffers();
  }, [fetchProduct, fetchOffers]);

  async function handleStartChat() {
    try {
      const { data } = await api.post('/conversations/', { product_id: productId });
      onMessage(data.id);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start conversation.');
    }
  }

  async function handleMakeOffer(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        product_id: productId,
        offer_type: offerType,
        offer_message: offerMessage.trim() || null,
      };
      if (offerType === 'purchase') {
        const p = parseFloat(offerPrice);
        if (isNaN(p) || p < 0) { setError('Please enter a valid offer price.'); setSubmitting(false); return; }
        payload.offer_price = p;
      }
      await api.post('/offers/', payload);
      setShowOfferForm(false);
      setOfferPrice('');
      setOfferMessage('');
      await fetchOffers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit offer.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleOfferAction(offerId, status) {
    try {
      await api.patch(`/offers/${offerId}`, { status });
      await fetchOffers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update offer.');
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;

  if (error && !product) return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center"><p className="text-slate-600">{error}</p></div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-medium text-teal-600 transition hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> Back to listings
      </button>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
          {product.image_url
            ? <img src={product.image_url} alt={product.title} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center text-slate-300"><ImageIcon className="h-16 w-16" /></div>}
        </div>

        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${product.status === 'available' ? 'bg-emerald-100 text-emerald-700' : product.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>
              {product.status}
            </span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
              {product.exchange_type === 'both' ? 'Sell or Trade' : product.exchange_type === 'trade' ? 'Trade Only' : 'For Sale'}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{product.title}</h1>
          <p className="mt-3 text-3xl font-bold text-teal-600">{product.price === 0 ? 'Free' : `$${product.price.toFixed(2)}`}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Tag className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{product.category}</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              <Sparkles className="h-4 w-4 text-slate-400" /><span className="text-slate-600">{product.condition}</span>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-1.5 text-sm font-semibold text-slate-900">Description</h3>
            <p className="text-sm leading-relaxed text-slate-600">{product.description}</p>
          </div>

          {product.profiles && (
            <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                {product.profiles.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">{product.profiles.full_name}</p>
                <p className="text-xs text-slate-500">{product.profiles.university}</p>
              </div>
            </div>
          )}

          {!isOwner && product.status === 'available' && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button onClick={handleStartChat} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-teal-600 py-2.5 text-sm font-semibold text-teal-600 transition hover:bg-teal-50">
                <MessageSquare className="h-4 w-4" /> Message Seller
              </button>
              {product.exchange_type !== 'trade' && (
                <button onClick={() => { setOfferType('purchase'); setShowOfferForm((s) => !s); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500">
                  <DollarSign className="h-4 w-4" /> Make an Offer
                </button>
              )}
              {product.exchange_type !== 'sell' && (
                <button onClick={() => { setOfferType('trade'); setShowOfferForm(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500">
                  <Repeat className="h-4 w-4" /> Propose Trade
                </button>
              )}
            </div>
          )}

          {showOfferForm && !isOwner && (
            <form onSubmit={handleMakeOffer} className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="text-sm font-semibold text-slate-900">{offerType === 'trade' ? 'Propose a Trade' : 'Make an Offer'}</h4>
              {product.exchange_type === 'both' && (
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOfferType('purchase')} className={`flex-1 rounded-lg border py-2 text-sm font-medium ${offerType === 'purchase' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 bg-white text-slate-600'}`}>Purchase Offer</button>
                  <button type="button" onClick={() => setOfferType('trade')} className={`flex-1 rounded-lg border py-2 text-sm font-medium ${offerType === 'trade' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 bg-white text-slate-600'}`}>Trade Offer</button>
                </div>
              )}
              {offerType === 'purchase' && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Your Offer ($)</label>
                  <input type="number" min="0" step="0.01" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder={`Max asking: $${product.price}`} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Message (optional)</label>
                <textarea value={offerMessage} onChange={(e) => setOfferMessage(e.target.value)} rows={2} maxLength={500} placeholder="Add a note to the seller..." className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowOfferForm(false)} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 rounded-lg bg-teal-600 py-2 text-sm font-semibold text-white hover:bg-teal-500 disabled:opacity-60">
                  {submitting ? 'Sending...' : 'Submit Offer'}
                </button>
              </div>
            </form>
          )}

          {isOwner && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">This is your listing. Respond to offers below or mark it as sold when complete.</p>
            </div>
          )}
        </div>
      </div>

      {offers.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900">{isOwner ? 'Offers on this item' : 'Your offer'}</h2>
          <div className="space-y-3">
            {offers.map((offer) => (
              <div key={offer.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${offer.status === 'pending' ? 'bg-amber-100 text-amber-700' : offer.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : offer.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                        {offer.status}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(offer.created_at).toLocaleDateString()}</span>
                    </div>
                    {offer.profiles && <p className="mt-1 text-sm text-slate-600">From: {offer.profiles.full_name}</p>}
                    {offer.offer_price != null && <p className="mt-1 text-lg font-bold text-slate-900">Offer: ${offer.offer_price.toFixed(2)}</p>}
                    {offer.offer_message && <p className="mt-1 text-sm text-slate-600">{offer.offer_message}</p>}
                  </div>
                  {isOwner && offer.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleOfferAction(offer.id, 'accepted')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
                        <CheckCircle className="h-3.5 w-3.5" /> Accept
                      </button>
                      <button onClick={() => handleOfferAction(offer.id, 'rejected')} className="flex items-center gap-1 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
