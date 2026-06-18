import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Users, CreditCard, CalendarCheck, FileText,
  Bell, Shield, Settings, Scale, Database, LogOut, Globe,
  HeartHandshake, ChevronRight, UserCircle, ListChecks, History,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { NavLink, useNavigate } from 'react-router-dom';

interface LayoutProps { children: ReactNode; }

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/members', icon: Users, labelKey: 'nav.members' },
  { to: '/contributions', icon: ListChecks, labelKey: 'nav.contributions' },
  { to: '/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { to: '/penalties', icon: AlertCircle, labelKey: 'nav.penalties' },
  { to: '/special-contributions', icon: HeartHandshake, labelKey: 'nav.specialContributions' },
  { to: '/attendance', icon: CalendarCheck, labelKey: 'nav.attendance' },
  { to: '/fines', icon: Scale, labelKey: 'nav.fines' },
  { to: '/reports', icon: FileText, labelKey: 'nav.reports' },
  { to: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { to: '/history', icon: History, labelKey: 'nav.history' },
  { to: '/audit-logs', icon: Shield, labelKey: 'nav.auditLogs' },
  { to: '/settings', icon: Settings, labelKey: 'nav.settings' },
  { to: '/backup', icon: Database, labelKey: 'nav.backup' },
  { to: '/profile', icon: UserCircle, labelKey: 'nav.profile' },
];

const auditorNav = [
  { to: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { to: '/members', icon: Users, labelKey: 'nav.members' },
  { to: '/contributions', icon: ListChecks, labelKey: 'nav.contributions' },
  { to: '/payments', icon: CreditCard, labelKey: 'nav.payments' },
  { to: '/penalties', icon: AlertCircle, labelKey: 'nav.penalties' },
  { to: '/special-contributions', icon: HeartHandshake, labelKey: 'nav.specialContributions' },
  { to: '/attendance', icon: CalendarCheck, labelKey: 'nav.attendance' },
  { to: '/fines', icon: Scale, labelKey: 'nav.fines' },
  { to: '/reports', icon: FileText, labelKey: 'nav.reports' },
  { to: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { to: '/history', icon: History, labelKey: 'nav.history' },
  { to: '/profile', icon: UserCircle, labelKey: 'nav.profile' },
];

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = user?.role === 'ADMIN' ? adminNav : auditorNav;

  const toggleLanguage = () => {
    const next = i18n.language === 'om' ? 'en' : 'om';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  // Get profile picture URL
  const API_URL = import.meta.env.VITE_API_URL || '/api';
  const BASE = API_URL.replace('/api', '');
  const profilePictureUrl = user?.role === 'MEMBER' 
    ? (user?.member?.profilePicture ? `${BASE}${user.member.profilePicture}` : null)
    : (user?.profilePicture ? `${BASE}${user.profilePicture}` : null);
  
  const userInitial = (user?.username || user?.phone || 'U')[0].toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col shrink-0 relative"
        style={{ background: 'linear-gradient(165deg, #0f2d1a 0%, #14532d 60%, #0f2d1a 100%)' }}>

        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, #16a34a, #d97706)' }} />

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
              style={{ background: 'linear-gradient(135deg, #16a34a, #d97706)' }}>
              A
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm leading-tight">{t('app.name')}</h1>
              <p className="text-slate-400 text-xs">{t('app.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-green-600/20 text-green-400 shadow-sm'
                    : 'text-slate-400 hover:bg-white/6 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={17} className={isActive ? 'text-green-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className="flex-1">{t(labelKey)}</span>
                  {isActive && <ChevronRight size={14} className="text-green-400 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer — user info only */}
        <div className="px-3 pb-4 pt-3 border-t border-white/8">
          <div className="mx-1 px-3 py-2 rounded-lg bg-white/4 flex items-center gap-2">
            {profilePictureUrl ? (
              <img 
                src={profilePictureUrl} 
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/20"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
              style={{ 
                background: 'linear-gradient(135deg, #16a34a, #d97706)',
                display: profilePictureUrl ? 'none' : 'flex'
              }}>
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="text-slate-300 text-xs font-medium truncate">{user?.username || user?.phone}</p>
              <p className="text-slate-500 text-xs">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200/60 px-8 py-4 flex items-center justify-between">
          <div />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm">
              <Globe size={14} />
              {i18n.language === 'om' ? 'English' : 'Afaan Oromoo'}
            </button>
            <button onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-red-600 bg-white border border-red-100 hover:bg-red-50 transition-all shadow-sm">
              <LogOut size={14} />
              Logout
            </button>
            <button onClick={() => navigate('/profile')} title="My Profile"
              className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden text-white text-xs font-semibold ml-1 hover:ring-2 hover:ring-green-400 transition-all"
              style={{ background: profilePictureUrl ? 'transparent' : 'linear-gradient(135deg, #16a34a, #d97706)' }}>
              {profilePictureUrl ? (
                <img 
                  src={profilePictureUrl} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.style.background = 'linear-gradient(135deg, #16a34a, #d97706)';
                      parent.textContent = userInitial;
                    }
                  }}
                />
              ) : (
                userInitial
              )}
            </button>
          </div>
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
