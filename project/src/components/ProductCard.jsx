import { Tag, MapPin, ImageIcon } from 'lucide-react';

export default function ProductCard({ product, onClick }) {
  const badgeColors = {
    available: 'bg-emerald-100 text-emerald-700',
    reserved:  'bg-amber-100 text-amber-700',
    sold:      'bg-slate-200 text-slate-600',
  };

  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:shadow-lg hover:ring-2 hover:ring-teal-500/20"
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <ImageIcon className="h-12 w-12" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badgeColors[product.status] ?? badgeColors.available}`}
        >
          {product.status}
        </span>
        {product.exchange_type !== 'sell' && (
          <span className="absolute right-3 top-3 rounded-full bg-teal-600 px-2.5 py-1 text-xs font-semibold text-white">
            {product.exchange_type === 'both' ? 'Sell/Trade' : 'Trade'}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{product.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>

        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs font-medium text-slate-600">{product.category}</span>
            </div>
            <span className="text-xs text-slate-400">{product.condition}</span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-lg font-bold text-teal-600">
              {product.price === 0 ? 'Free' : `$${Number(product.price).toFixed(2)}`}
            </span>
            {product.profiles && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <MapPin className="h-3 w-3" />
                {product.profiles.university}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
