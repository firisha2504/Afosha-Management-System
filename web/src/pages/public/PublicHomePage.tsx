import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, ArrowRight, Shield, Heart, BookOpen } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

interface HomeData {
  welcomeMessage: string;
  statistics: { totalMembers: number; activeMembers: number };
  upcomingMeetings: Array<{ id: string; title: string; location?: string; meetingDate: string; meetingTime?: string }>;
}

export default function PublicHomePage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const isOm = i18n.language === 'om';

  useEffect(() => {
    api.get('/public/home')
      .then((res: { data: { data: HomeData } }) => setData(res.data.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #060e33 0%, #091540 40%, #0d1e5e 70%, #091540 100%)',
        minHeight: '88vh',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.15) 1px,transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
        {/* Glow orbs */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d97706, transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8"
            style={{ background: 'rgba(217,119,6,0.2)', color: '#fbbf24', border: '1px solid rgba(217,119,6,0.3)' }}>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Gamtaa Dargaggoota Melka Jabdu
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            {isOm ? 'Baga nagaan gara' : 'Welcome to'}{' '}
            <span style={{
              background: 'linear-gradient(90deg, #fbbf24, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Afosha
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed px-4" style={{ color: '#bfdbfe' }}>
            {isOm
              ? 'Miseensota bulchuuf, kaffaltii hordoofuuf, fi hawaasa cimsuuf sirna guutuu.'
              : 'A complete system for managing members, tracking contributions, and strengthening our community.'}
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3 sm:gap-4 px-4">
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
              {isOm ? 'Gara Portaalitti Seeni' : 'Access Portal'} <ArrowRight size={18} />
            </Link>
            <Link to="/about"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base border transition-all hover:bg-white/10 w-full sm:w-auto"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              {isOm ? 'Waa\'ee Keenya' : 'Learn More'}
            </Link>
          </div>

          {/* Stats row */}
          {!loading && data && (
            <div className="flex justify-center gap-6 sm:gap-8 md:gap-12 mt-12 sm:mt-16 px-4">
              <div className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#fbbf24' }}>{data.statistics.totalMembers}</p>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#93c5fd' }}>{t('dashboard.totalMembers')}</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="text-center">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold" style={{ color: '#fbbf24' }}>{data.statistics.activeMembers}</p>
                <p className="text-xs sm:text-sm mt-1" style={{ color: '#93c5fd' }}>{t('dashboard.activeMembers')}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 py-12 sm:py-16 md:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: '#e2e8f0' }}>
            {isOm ? 'Maal Kennina?' : 'What We Offer'}
          </h2>
          <div className="w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {[
            {
              icon: Users,
              title: isOm ? 'Bulchiinsa Miseensaa' : 'Member Management',
              desc: isOm ? 'Miseensota galmaahuu, mirkanneessuu fi bulchuuf sirna salphaa.' : 'Easy member registration, approval and lifecycle management.',
              color: '#166534',
            },
            {
              icon: Shield,
              title: isOm ? 'Kaffaltii & Qusannoo' : 'Contributions & Savings',
              desc: isOm ? 'Kaffaltii torbanii, adabbii fi qusannoo hordofi.' : 'Track weekly contributions, penalties and member savings.',
              color: '#d97706',
            },
            {
              icon: BookOpen,
              title: isOm ? 'Gabaasa & Qo\'annoo' : 'Reports & Analytics',
              desc: isOm ? 'Gabaasota PDF fi Excel baasuuf, daashboordii odeeffannoo.' : 'Export PDF/Excel reports and view live analytics dashboards.',
              color: '#166534',
            },
            {
              icon: Heart,
              title: isOm ? 'Waa\'ee Keenya' : 'About Us',
              desc: isOm ? 'Seenaa, kaayyoo fi heera keenya hubadhu.' : 'Learn about our history, mission and values.',
              color: '#d97706',
              link: '/about',
            },
          ].map(({ icon: Icon, title, desc, color, link }) => (
            <Link 
              key={title} 
              to={link || '#'}
              onClick={(e) => !link && e.preventDefault()}
              className={`rounded-2xl p-6 sm:p-8 shadow-sm border transition-all group ${
                link ? 'hover:shadow-lg hover:-translate-y-2 cursor-pointer' : 'hover:shadow-md hover:-translate-y-1'
              }`}
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ background: color === '#d97706' ? 'rgba(217,119,6,0.15)' : 'rgba(13,30,94,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Icon size={26} style={{ color: color === '#d97706' ? '#f59e0b' : '#93c5fd' }} />
              </div>
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
                {title}
                {link && <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#f59e0b' }} />}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: '#bfdbfe' }}>{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Upcoming Meetings ── */}
      <section style={{ background: 'rgba(9, 21, 64, 0.6)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: '#e2e8f0' }}>
                <Calendar size={24} style={{ color: '#93c5fd' }} />
                {t('public.upcomingMeetings')}
              </h2>
              <div className="w-12 h-1 rounded-full mt-2" style={{ background: '#d97706' }} />
            </div>
          </div>

          {loading ? <LoadingSpinner /> : (
            data?.upcomingMeetings?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.upcomingMeetings.map((m) => (
                  <div key={m.id} className="rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: 'rgba(13,30,94,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <span className="text-xs font-bold" style={{ color: '#93c5fd' }}>
                          {new Date(m.meetingDate).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none" style={{ color: '#e2e8f0' }}>
                          {new Date(m.meetingDate).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm" style={{ color: '#e2e8f0' }}>{m.title}</h3>
                        {m.meetingTime && <p className="text-xs mt-0.5" style={{ color: '#bfdbfe' }}>{m.meetingTime}</p>}
                        {m.location && (
                          <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#93c5fd' }}>
                            📍 {m.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Calendar size={40} className="mx-auto mb-3" style={{ color: '#93c5fd' }} />
                <p style={{ color: '#bfdbfe' }}>{t('common.noData')}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #060e33, #0d1e5e)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', transform: 'translate(30%,-30%)' }} />
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              {isOm ? 'Miseensa Taataa?' : 'Already a Member?'}
            </h2>
            <p className="mb-6 sm:mb-8 text-sm sm:text-base" style={{ color: '#bfdbfe' }}>
              {isOm
                ? 'Gara portaalitti seenaa kaffaltii, qusannoo fi beeksisa kee ilaaluu.'
                : 'Sign in to view your contributions, savings and notifications.'}
            </p>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#1e1b4b' }}>
              <Heart size={16} fill="currentColor" />
              {isOm ? 'Amma Seeni' : 'Sign In Now'}
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
