import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MessageSquare, ArrowLeft, ImageIcon } from 'lucide-react';

export default function MessagesPage({ onOpenConversation, onBack }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/conversations/');
      setConversations(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 md:hidden">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Messages</h1>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200" />)}
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-900">No conversations yet</h3>
          <p className="mt-1 text-sm text-slate-500">Start a chat by messaging a seller from a listing page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const otherProfile = user?.id === conv.buyer_id ? conv.seller_profile : conv.buyer_profile;
            return (
              <button
                key={conv.id}
                onClick={() => onOpenConversation(conv.id)}
                className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:shadow-md hover:ring-2 hover:ring-teal-500/20"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
                  {otherProfile?.full_name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900">{otherProfile?.full_name ?? 'Unknown'}</p>
                  {conv.products && (
                    <p className="truncate text-sm text-slate-500">
                      {conv.products.title}
                      {conv.products.price > 0 && ` · $${conv.products.price.toFixed(2)}`}
                    </p>
                  )}
                </div>
                {conv.products?.image_url
                  ? <img src={conv.products.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-300"><ImageIcon className="h-6 w-6" /></div>
                }
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
