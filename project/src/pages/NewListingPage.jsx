import { useState } from 'react';
import api from '@/lib/api';
import { Upload, Loader2, CheckCircle, Tag, Sparkles, DollarSign, Repeat } from 'lucide-react';

const CATEGORIES  = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Sports', 'Other'];
const CONDITIONS  = ['New', 'Like New', 'Good', 'Fair'];
const EXCHANGE_TYPES = [
  { value: 'sell', label: 'Sell' },
  { value: 'trade', label: 'Trade' },
  { value: 'both', label: 'Sell or Trade' },
];

export default function NewListingPage({ onDone }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Books');
  const [condition, setCondition] = useState('Good');
  const [price, setPrice] = useState('');
  const [exchangeType, setExchangeType] = useState('both');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  function validate() {
    if (!title.trim() || title.trim().length < 3) return 'Title must be at least 3 characters.';
    if (!description.trim() || description.trim().length < 10) return 'Description must be at least 10 characters.';
    if (exchangeType !== 'trade') {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) return 'Please enter a valid price (0 for free).';
      if (p > 99999) return 'Price cannot exceed $99,999.';
    }
    return null;
  }

  function handleImageChange(file) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      let imageUrl = null;

      if (imageFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const { data: imgData } = await api.post('/images/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = imgData.url;
        setUploading(false);
      }

      await api.post('/products/', {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        price: exchangeType === 'trade' ? 0 : parseFloat(price) || 0,
        exchange_type: exchangeType,
        image_url: imageUrl,
      });

      setSuccess(true);
      setTimeout(() => onDone(), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4">
        <CheckCircle className="mb-4 h-16 w-16 text-emerald-500" />
        <h2 className="text-xl font-bold text-slate-900">Listing Created!</h2>
        <p className="mt-2 text-sm text-slate-600">Your item is now available for other students to discover.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Create a New Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Product Photo</label>
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 transition hover:border-teal-500 hover:bg-teal-50/50">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="h-full w-full rounded-xl object-cover" />
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                  <Upload className="h-6 w-6 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload a photo</p>
                <p className="mt-1 text-xs text-slate-400">JPEG, PNG, WebP — max 10 MB (auto-resized by server)</p>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Calculus Textbook 3rd Edition" maxLength={100} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe condition, what's included, and any other details..." rows={4} maxLength={1000} className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
          <p className="mt-1 text-xs text-slate-400">{description.length}/1000</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700"><Tag className="mr-1 inline h-3.5 w-3.5" />Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700"><Sparkles className="mr-1 inline h-3.5 w-3.5" />Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-500">
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><Repeat className="mr-1 inline h-3.5 w-3.5" />Exchange Type</label>
          <div className="grid grid-cols-3 gap-2">
            {EXCHANGE_TYPES.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setExchangeType(opt.value)} className={`rounded-lg border py-2.5 text-sm font-medium transition ${exchangeType === opt.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {exchangeType !== 'trade' && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700"><DollarSign className="mr-1 inline h-3.5 w-3.5" />Price (USD)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00 (0 for free)" className="w-full rounded-lg border border-slate-300 py-2.5 pl-8 pr-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
            </div>
            <p className="mt-1 text-xs text-slate-400">Enter 0 for free items.</p>
          </div>
        )}

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button type="button" onClick={onDone} className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={submitting || uploading} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />{uploading ? 'Uploading image...' : 'Creating...'}</> : 'Post Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
