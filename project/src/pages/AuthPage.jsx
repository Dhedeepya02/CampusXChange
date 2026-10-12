import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  GraduationCap, Eye, EyeOff, Mail, Lock,
  User, IdCard, Building2, Phone,
} from 'lucide-react';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [campusId, setCampusId] = useState('');
  const [university, setUniversity] = useState('');
  const [phone, setPhone] = useState('');

  function validate() {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email.';
    if (!password || password.length < 6) return 'Password must be at least 6 characters.';
    if (mode === 'signup') {
      if (!fullName.trim() || fullName.trim().length < 2) return 'Full name is required.';
      if (!campusId.trim()) return 'Campus ID is required.';
      if (!university.trim()) return 'University is required.';
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.trim(), password);
        if (error) setError(error.includes('Invalid') ? 'Incorrect email or password.' : error);
      } else {
        const { error } = await signUp(email.trim(), password, {
          full_name: fullName.trim(),
          campus_id: campusId.trim(),
          university: university.trim(),
          phone: phone.trim() || null,
          avatar_url: null,
        });
        if (error) setError(error.includes('already') ? 'An account with this email already exists.' : error);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/30">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">CampusXChange</h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login' ? 'Welcome back! Sign in to continue.' : 'Create your account to join the exchange.'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-700/50 bg-slate-800/80 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="mb-6 flex gap-2 rounded-lg bg-slate-900/60 p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  mode === m ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <InputField icon={<User className="h-5 w-5" />} label="Full Name" type="text" value={fullName} onChange={setFullName} placeholder="Jane Doe" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField icon={<IdCard className="h-5 w-5" />} label="Campus ID" type="text" value={campusId} onChange={setCampusId} placeholder="C12345" />
                  <InputField icon={<Building2 className="h-5 w-5" />} label="University" type="text" value={university} onChange={setUniversity} placeholder="State Univ." />
                </div>
                <InputField icon={<Phone className="h-5 w-5" />} label="Phone (optional)" type="tel" value={phone} onChange={setPhone} placeholder="555-0100" />
              </>
            )}

            <InputField icon={<Mail className="h-5 w-5" />} label="Email" type="email" value={email} onChange={setEmail} placeholder="you@university.edu" />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Your password'}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/60 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
              className="font-medium text-teal-400 hover:text-teal-300"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function InputField({ icon, label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-600 bg-slate-900/60 py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
        />
      </div>
    </div>
  );
}
