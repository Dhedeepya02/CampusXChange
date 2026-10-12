import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import AuthPage from '@/pages/AuthPage';
import HomePage from '@/pages/HomePage';
import NewListingPage from '@/pages/NewListingPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import ChatPage from '@/pages/ChatPage';
import MessagesPage from '@/pages/MessagesPage';
import MyListingsPage from '@/pages/MyListingsPage';
import ProfilePage from '@/pages/ProfilePage';

function AppContent() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('home');
  const [productId, setProductId] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  function navigate(p) {
    setPage(p);
  }

  function openProduct(id) {
    setProductId(id);
    setPage('product-detail');
  }

  function openConversation(id) {
    setConversationId(id);
    setPage('chat');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        currentPage={page === 'product-detail' || page === 'chat' ? 'home' : page}
        onNavigate={navigate}
      />
      <main>
        {page === 'home' && <HomePage onProductClick={openProduct} />}
        {page === 'new-listing' && <NewListingPage onDone={() => navigate('home')} />}
        {page === 'product-detail' && productId && (
          <ProductDetailPage
            productId={productId}
            onBack={() => navigate('home')}
            onMessage={openConversation}
          />
        )}
        {page === 'chat' && conversationId && (
          <ChatPage conversationId={conversationId} onBack={() => navigate('messages')} />
        )}
        {page === 'messages' && (
          <MessagesPage onOpenConversation={openConversation} onBack={() => navigate('home')} />
        )}
        {page === 'my-listings' && (
          <MyListingsPage
            onBack={() => navigate('home')}
            onNewListing={() => navigate('new-listing')}
          />
        )}
        {page === 'profile' && <ProfilePage onBack={() => navigate('home')} />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
