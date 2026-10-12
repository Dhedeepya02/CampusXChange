import { useAuth } from '@/context/AuthContext';
import { GraduationCap, Home, Plus, MessageSquare, Package, LogOut, User as UserIcon } from 'lucide-react';

export default function Navbar({ currentPage, onNavigate }) {
  const { profile, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 transition hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="hidden text-lg font-bold text-slate-900 sm:block">
            Campus<span className="text-teal-600">XChange</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {[
            { page: 'home', icon: <Home className="h-4 w-4" />, label: 'Browse' },
            { page: 'new-listing', icon: <Plus className="h-4 w-4" />, label: 'New Listing' },
            { page: 'messages', icon: <MessageSquare className="h-4 w-4" />, label: 'Messages' },
            { page: 'my-listings', icon: <Package className="h-4 w-4" />, label: 'My Listings' },
            { page: 'profile', icon: <UserIcon className="h-4 w-4" />, label: 'Profile' },
          ].map(({ page, icon, label }) => (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${currentPage === page ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              {icon}{label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">{profile?.full_name ?? 'Student'}</p>
            <p className="text-xs text-slate-500">{profile?.university ?? ''}</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
            {profile?.full_name?.charAt(0).toUpperCase() ?? 'S'}
          </div>
          <button onClick={signOut} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900">
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex items-center justify-around border-t border-slate-200 px-2 py-1.5 md:hidden">
        {[
          { page: 'home', icon: <Home className="h-5 w-5" />, label: 'Browse' },
          { page: 'new-listing', icon: <Plus className="h-5 w-5" />, label: 'Sell' },
          { page: 'messages', icon: <MessageSquare className="h-5 w-5" />, label: 'Chat' },
          { page: 'my-listings', icon: <Package className="h-5 w-5" />, label: 'Mine' },
          { page: 'profile', icon: <UserIcon className="h-5 w-5" />, label: 'Me' },
        ].map(({ page, icon, label }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${currentPage === page ? 'text-teal-600' : 'text-slate-500'}`}
          >
            {icon}{label}
          </button>
        ))}
      </div>
    </nav>
  );
}
