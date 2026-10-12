import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { ArrowLeft, Send, Loader2, ImageIcon } from 'lucide-react';

export default function ChatPage({ conversationId, onBack }) {
  const { user } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const fetchConversation = useCallback(async () => {
    try {
      const { data } = await api.get(`/conversations/${conversationId}`);
      setConversation(data);
    } catch {
      setError('Conversation not found.');
    }
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(data);
    } catch { /* ignore */ }
  }, [conversationId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConversation(), fetchMessages()]).finally(() => setLoading(false));
  }, [fetchConversation, fetchMessages]);

  // Set up Socket.IO room
  useEffect(() => {
    const socket = connectSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.emit('join_conversation', { conversation_id: conversationId });

    function handleNewMessage(msg) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    }

    function handleJoined() {
      setConnected(true);
    }

    socket.on('new_message', handleNewMessage);
    socket.on('joined', handleJoined);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.emit('leave_conversation', { conversation_id: conversationId });
      socket.off('new_message', handleNewMessage);
      socket.off('joined', handleJoined);
    };
  }, [conversationId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend(e) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;
    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('send_message', { conversation_id: conversationId, content });
      setSending(false);
    } else {
      // Fallback: REST if socket not connected
      api.post('/messages/conversation/' + conversationId, { content })
        .then(({ data }) => {
          setMessages((prev) => [...prev, data]);
        })
        .catch(() => {
          setError('Failed to send message.');
          setNewMessage(content);
        })
        .finally(() => setSending(false));
    }
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;

  if (error || !conversation) return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <button onClick={onBack} className="mb-4 flex items-center gap-2 text-sm text-teal-600"><ArrowLeft className="h-4 w-4" /> Back</button>
      <p className="text-slate-600">{error ?? 'Conversation not found.'}</p>
    </div>
  );

  const otherProfile = user?.id === conversation.buyer_id ? conversation.seller_profile : conversation.buyer_profile;

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></button>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          {otherProfile?.full_name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{otherProfile?.full_name ?? 'Unknown'}</p>
          {conversation.products && (
            <p className="truncate text-xs text-slate-500">
              Re: {conversation.products.title}
              {conversation.products.price > 0 && ` · $${conversation.products.price.toFixed(2)}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1">
          <span className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse bg-emerald-500' : 'bg-slate-400'}`} />
          <span className="text-xs font-medium text-emerald-700">{connected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <p className="text-sm text-slate-400">No messages yet.</p>
              <p className="mt-1 text-xs text-slate-400">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${isMe ? 'rounded-br-sm bg-teal-600 text-white' : 'rounded-bl-sm bg-white text-slate-900 shadow-sm'}`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p className={`mt-1 text-xs ${isMe ? 'text-teal-200' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-200 bg-white px-4 py-3">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 rounded-full border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </form>
    </div>
  );
}
