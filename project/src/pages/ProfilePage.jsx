import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { User as UserIcon, Mail, IdCard, Building2, Phone, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage({ onBack: _onBack }) {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  async function handleSave(e) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.patch('/profile/', {
        full_name: fullName.trim(),
        university: university.trim(),
        phone: phone.trim() || null,
      });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">My Profile</h1>

      <div className="mb-6 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-2xl font-bold text-white">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">{profile.full_name}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          <p className="mt-1 text-xs text-slate-400">Joined {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Edit Profile</h2>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><Mail className="mr-1 inline h-3.5 w-3.5" />Email</label>
          <input type="email" value={user?.email ?? ''} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><UserIcon className="mr-1 inline h-3.5 w-3.5" />Full Name</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><IdCard className="mr-1 inline h-3.5 w-3.5" />Campus ID</label>
          <input type="text" value={profile.campus_id} disabled className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><Building2 className="mr-1 inline h-3.5 w-3.5" />University</label>
          <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700"><Phone className="mr-1 inline h-3.5 w-3.5" />Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" />
        </div>

        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
        {saved && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" /> Profile updated successfully!
          </div>
        )}

        <button type="submit" disabled={saving} className="flex items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-500 disabled:opacity-60">
          <Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
