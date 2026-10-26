import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Mail, Phone, MapPin, Heart, Share2, MessageCircle, Users, ArrowLeft, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isOm = i18n.language === 'om';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    const next = i18n.language === 'om' ? 'en' : 'om';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#091540' }}>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Main navbar ── */}
      <header className="sticky top-0 z-50 shadow-md"
        style={{ background: 'linear-gradient(135deg, #0d1e5e 0%, #091540 100%)' }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group" onClick={() => setMobileMenuOpen(false)}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shadow-md"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
              A
            </div>
            <div className="hidden xs:block">
              <p className="text-white font-bold text-sm sm:text-base leading-tight">Afosha</p>
              <p className="text-xs leading-tight" style={{ color: '#93c5fd' }}>
                {isOm ? 'Sirna Bulchiinsa' : 'Management System'}
              </p>
            </div>
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: isOm ? 'Fuula Jalqabaa' : 'Home' },
              { to: '/about', label: isOm ? 'Waa\'ee Keenya' : 'About' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 lg:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'text-white bg-white/15'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Hamburger menu button - mobile only */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-all"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Back to Dashboard button - only show if logged in */}
            {user && (
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg text-xs lg:text-sm font-semibold shadow-sm transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}
              >
                <ArrowLeft size={15} className="hidden lg:inline" />
                <span className="hidden md:inline">{isOm ? 'Gara Deshboorditti' : 'Dashboard'}</span>
                <ArrowLeft size={18} className="md:hidden" />
              </button>
            )}
            
            <button onClick={toggleLanguage}
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm text-blue-100 hover:bg-white/10 transition-all">
              <Globe size={14} sm:size={15} />
              <span className="hidden sm:inline">{isOm ? 'EN' : 'OM'}</span>
            </button>
            
            {!user && (
              <Link to="/login"
                className="hidden sm:inline-flex px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all"
                style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
                {t('auth.login')}
              </Link>
            )}
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div 
          className={`${
            mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          } md:hidden overflow-hidden transition-all duration-300 ease-in-out`}
          style={{ background: 'rgba(6, 14, 51, 0.95)' }}
        >
          <nav className="px-4 py-3 space-y-1 border-t border-white/10">
            {[
              { to: '/', label: isOm ? 'Fuula Jalqabaa' : 'Home' },
              { to: '/about', label: isOm ? 'Waa\'ee Keenya' : 'About' },
              { to: '/login', label: t('auth.login') },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'text-white bg-white/15'
                    : 'text-blue-100 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
            
            {/* Language toggle in mobile menu */}
            <button
              onClick={() => {
                toggleLanguage();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:text-white hover:bg-white/10 transition-all"
            >
              <Globe size={16} />
              {isOm ? 'Change to English' : 'Gara Afaan Oromootti'}
            </button>
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: 'linear-gradient(160deg, #060e33 0%, #0d1e5e 50%, #060e33 100%)' }}
        className="text-white mt-16">

        {/* Main footer grid */}
        <div className="max-w-6xl mx-auto px-4 py-10 sm:py-12 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">

            {/* Col 1 — Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl shadow"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
                  A
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Afosha</p>
                  <p className="text-xs" style={{ color: '#93c5fd' }}>AMS</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#bfdbfe' }}>
                {isOm
                  ? 'Gamtaa Dargaggoota Melka Jabdu — hawaasa cimsuu fi deeggaruu.'
                  : 'Gamtaa Dargaggoota Melka Jabdu — strengthening and supporting our community.'}
              </p>
              {/* Social icons */}
              <div className="flex gap-2">
                {[
                  { icon: Share2, href: '#', label: 'Share' },
                  { icon: MessageCircle, href: '#', label: 'Message' },
                  { icon: Users, href: '#', label: 'Community' },
                ].map(({ icon: Icon, href, label }) => (
                  <a key={label} href={href}
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:scale-110"
                    style={{ background: 'rgba(255,255,255,0.1)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.4)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}>
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Col 2 — Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-4 pb-2 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {isOm ? 'Liinki Hatattamaa' : 'Quick Links'}
              </h3>
              <ul className="space-y-2">
                {[
                  { to: '/', label: isOm ? 'Fuula Jalqabaa' : 'Home' },
                  { to: '/about', label: isOm ? 'Waa\'ee Keenya' : 'About Us' },
                  { to: '/about#mission-vision', label: isOm ? 'Ergaa fi Mul\'ata' : 'Mission & Vision' },
                  { to: '/about#heera-danbii', label: isOm ? 'Heera fi Danbii' : 'Rules & Regulations' },
                  { to: '/login', label: isOm ? 'Portal Seeni' : 'Member Portal' },
                ].map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to}
                      className="text-sm flex items-center gap-2 transition-all hover:translate-x-1"
                      style={{ color: '#bfdbfe' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#bfdbfe')}>
                      <span style={{ color: '#d97706' }}>›</span> {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 3 — About */}
            <div>
              <h3 className="font-semibold text-white mb-4 pb-2 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {isOm ? 'Waa\'ee Gamtaa' : 'About Gamtaa'}
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    {isOm ? 'Bu\'uura Seeraa' : 'Legal Foundation'}
                  </p>
                  <p className="text-xs" style={{ color: '#bfdbfe' }}>
                    {isOm ? 'Heera RDFI Aritikilii 31' : 'FDRE Constitution Article 31'}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    {isOm ? 'Moto' : 'Motto'}
                  </p>
                  <p className="text-xs italic" style={{ color: '#bfdbfe' }}>
                    "Tokkummaan Ciminaa fi Milkaayina"
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    {isOm ? 'Maqaa Guutuu' : 'Full Name'}
                  </p>
                  <p className="text-xs" style={{ color: '#bfdbfe' }}>
                    Gamtaa Dargaggoota Melka Jabdu
                  </p>
                </div>
              </div>
            </div>

            {/* Col 4 — Contact */}
            <div>
              <h3 className="font-semibold text-white mb-4 pb-2 border-b"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                {isOm ? 'Quunnamtii' : 'Contact Us'}
              </h3>
              <ul className="space-y-3">
                {[
                  { icon: MapPin, text: isOm ? 'Finfinnee, Itoophiyaa' : 'Addis Ababa, Ethiopia' },
                  { icon: Phone, text: '+251 900 000 000' },
                  { icon: Mail, text: 'info@afosha.org' },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: 'rgba(217,119,6,0.25)' }}>
                      <Icon size={13} style={{ color: '#fbbf24' }} />
                    </div>
                    <span className="text-sm" style={{ color: '#bfdbfe' }}>{text}</span>
                  </li>
                ))}
              </ul>

              {/* Newsletter / portal CTA */}
              <div className="mt-5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <p className="text-xs font-semibold text-white mb-2">
                  {isOm ? 'Miseensa Taatee?' : 'Are you a member?'}
                </p>
                <Link to="/login"
                  className="block text-center py-2 px-4 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
                  {isOm ? 'Gara Portaalichaatti Seeni' : 'Access Member Portal'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="max-w-6xl mx-auto px-4 py-4 sm:py-5 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
            <p className="text-xs text-center sm:text-left flex items-center gap-1.5" style={{ color: '#93c5fd' }}>
              © {new Date().getFullYear()} Afosha Management System. {isOm ? 'Mirgi Keenya Eegame.' : 'All rights reserved.'}
            </p>
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#93c5fd' }}>
              {isOm ? 'Jaalalaaan Hojjetame' : 'Made with'} <Heart size={12} style={{ color: '#d97706' }} fill="#d97706" /> {isOm ? 'Itoophiyaaf' : 'for Ethiopia'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
