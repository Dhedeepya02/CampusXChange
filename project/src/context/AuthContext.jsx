import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { connectSocket, disconnectSocket } from '@/lib/socket';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, email, created_at }
  const [profile, setProfile] = useState(null); // { full_name, campus_id, university, ... }
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('cxc_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/auth/me')
      .then(({ data }) => {
        setUser(data.user);
        setProfile(data.profile);
        connectSocket();
      })
      .catch(() => {
        localStorage.removeItem('cxc_token');
      })
      .finally(() => setLoading(false));
  }, []);

  const signUp = useCallback(async (email, password, profileData) => {
    try {
      const { data } = await api.post('/auth/signup', {
        email, password, ...profileData,
      });
      localStorage.setItem('cxc_token', data.token);
      setUser(data.user);
      setProfile(data.profile);
      connectSocket();
      return { error: null };
    } catch (err) {
      return { error: err.response?.data?.error || 'Sign-up failed.' };
    }
  }, []);

  const signIn = useCallback(async (email, password) => {
    try {
      const { data } = await api.post('/auth/signin', { email, password });
      localStorage.setItem('cxc_token', data.token);
      setUser(data.user);
      setProfile(data.profile);
      connectSocket();
      return { error: null };
    } catch (err) {
      return { error: err.response?.data?.error || 'Sign-in failed.' };
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem('cxc_token');
    disconnectSocket();
    setUser(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setProfile(data.profile);
    } catch { /* ignore */ }
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signUp, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
