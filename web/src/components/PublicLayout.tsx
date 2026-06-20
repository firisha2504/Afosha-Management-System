import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Mail, Phone, MapPin, Heart, Share2, MessageCircle, Users } from 'lucide-react';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isOm = i18n.language === 'om';

  const toggleLanguage = () => {
    const next = i18n.language === 'om' ? 'en' : 'om';
    i18n.changeLanguage(next);
    localStorage.setItem('language', next);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8faf8' }}>

      {/* ── Main navbar ── */}
      <header className="sticky top-0 z-50 shadow-md"
        style={{ background: 'linear-gradient(135deg, #166534 0%, #15803d 100%)' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-md"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              A
            </div>
            <div>
              <p className="text-white font-bold text-base leading-tight">Afosha</p>
              <p className="text-xs leading-tight" style={{ color: '#86efac' }}>
                {isOm ? 'Sirna Bulchiinsa' : 'Management System'}
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/', label: isOm ? 'Fuula Jalqabaa' : 'Home' },
              { to: '/about', label: isOm ? 'Waa\'ee Keenya' : 'About' },
            ].map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  location.pathname === to
                    ? 'text-white bg-white/15'
                    : 'text-green-100 hover:text-white hover:bg-white/10'
                }`}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-green-100 hover:bg-white/10 transition-all">
              <Globe size={15} />
              {isOm ? 'EN' : 'OM'}
            </button>
            <Link to="/login"
              className="px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              {t('auth.login')}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: 'linear-gradient(160deg, #14532d 0%, #166534 50%, #14532d 100%)' }}
        className="text-white mt-16">

        {/* Main footer grid */}
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

            {/* Col 1 — Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xl shadow"
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
                  A
                </div>
                <div>
                  <p className="font-bold text-white text-lg">Afosha</p>
                  <p className="text-xs" style={{ color: '#86efac' }}>AMS</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-5" style={{ color: '#bbf7d0' }}>
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
                      style={{ color: '#bbf7d0' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fbbf24')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#bbf7d0')}>
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
                  <p className="text-xs" style={{ color: '#bbf7d0' }}>
                    {isOm ? 'Heera RDFI Aritikilii 31' : 'FDRE Constitution Article 31'}
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    {isOm ? 'Moto' : 'Motto'}
                  </p>
                  <p className="text-xs italic" style={{ color: '#bbf7d0' }}>
                    "Tokkummaan Ciminaa fi Milkaayina"
                  </p>
                </div>
                <div className="p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: '#fbbf24' }}>
                    {isOm ? 'Maqaa Guutuu' : 'Full Name'}
                  </p>
                  <p className="text-xs" style={{ color: '#bbf7d0' }}>
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
                    <span className="text-sm" style={{ color: '#bbf7d0' }}>{text}</span>
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
                  style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
                  {isOm ? 'Gara Portaalichaatti Seeni' : 'Access Member Portal'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#86efac' }}>
              © {new Date().getFullYear()} Afosha Management System. {isOm ? 'Mirgi Keenya Eegame.' : 'All rights reserved.'}
            </p>
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#86efac' }}>
              {isOm ? 'Jaalalaaan Hojjetame' : 'Made with'} <Heart size={12} style={{ color: '#d97706' }} fill="#d97706" /> {isOm ? 'Itoophiyaaf' : 'for Ethiopia'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
