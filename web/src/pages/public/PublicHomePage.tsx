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
        background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 70%, #14532d 100%)',
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

          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {isOm ? 'Baga nagaan gara' : 'Welcome to'}{' '}
            <span style={{
              background: 'linear-gradient(90deg, #fbbf24, #d97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Afosha
            </span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: '#bbf7d0' }}>
            {isOm
              ? 'Miseensota bulchuuf, kaffaltii hordoofuuf, fi hawaasa cimsuuf sirna guutuu.'
              : 'A complete system for managing members, tracking contributions, and strengthening our community.'}
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/login"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              {isOm ? 'Gara Portaalitti Seeni' : 'Access Portal'} <ArrowRight size={18} />
            </Link>
            <Link to="/about"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-base border transition-all hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>
              {isOm ? 'Waa\'ee Keenya' : 'Learn More'}
            </Link>
          </div>

          {/* Stats row */}
          {!loading && data && (
            <div className="flex justify-center gap-12 mt-16">
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: '#fbbf24' }}>{data.statistics.totalMembers}</p>
                <p className="text-sm mt-1" style={{ color: '#86efac' }}>{t('dashboard.totalMembers')}</p>
              </div>
              <div className="w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: '#fbbf24' }}>{data.statistics.activeMembers}</p>
                <p className="text-sm mt-1" style={{ color: '#86efac' }}>{t('dashboard.activeMembers')}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#14532d' }}>
            {isOm ? 'Maal Kennina?' : 'What We Offer'}
          </h2>
          <div className="w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
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
          ].map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                style={{ background: color === '#d97706' ? 'rgba(217,119,6,0.1)' : 'rgba(22,101,52,0.1)' }}>
                <Icon size={26} style={{ color }} />
              </div>
              <h3 className="font-bold text-lg mb-2" style={{ color: '#14532d' }}>{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Upcoming Meetings ── */}
      <section style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }} className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#14532d' }}>
                <Calendar size={24} style={{ color: '#16a34a' }} />
                {t('public.upcomingMeetings')}
              </h2>
              <div className="w-12 h-1 rounded-full mt-2" style={{ background: '#d97706' }} />
            </div>
          </div>

          {loading ? <LoadingSpinner /> : (
            data?.upcomingMeetings?.length ? (
              <div className="grid md:grid-cols-3 gap-4">
                {data.upcomingMeetings.map((m) => (
                  <div key={m.id} className="bg-white rounded-2xl p-6 shadow-sm border border-green-100 hover:shadow-md transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
                        style={{ background: 'rgba(22,101,52,0.08)' }}>
                        <span className="text-xs font-bold" style={{ color: '#16a34a' }}>
                          {new Date(m.meetingDate).toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-bold leading-none" style={{ color: '#14532d' }}>
                          {new Date(m.meetingDate).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm" style={{ color: '#14532d' }}>{m.title}</h3>
                        {m.meetingTime && <p className="text-xs text-gray-500 mt-0.5">{m.meetingTime}</p>}
                        {m.location && (
                          <p className="text-xs mt-1 flex items-center gap-1 text-gray-400">
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
                <Calendar size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">{t('common.noData')}</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* ── CTA banner ── */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl p-12 text-center"
            style={{ background: 'linear-gradient(135deg, #14532d, #166534)' }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
              style={{ background: 'radial-gradient(circle, #fbbf24, transparent)', transform: 'translate(30%,-30%)' }} />
            <h2 className="text-3xl font-bold text-white mb-3">
              {isOm ? 'Miseensa Taataa?' : 'Already a Member?'}
            </h2>
            <p className="mb-8" style={{ color: '#bbf7d0' }}>
              {isOm
                ? 'Gara portaalitti seenaa kaffaltii, qusannoo fi beeksisa kee ilaaluu.'
                : 'Sign in to view your contributions, savings and notifications.'}
            </p>
            <Link to="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              <Heart size={16} fill="currentColor" />
              {isOm ? 'Amma Seeni' : 'Sign In Now'}
            </Link>
          </div>
        </div>
      </section>

    </PublicLayout>
  );
}
