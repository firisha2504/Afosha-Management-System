import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, ArrowRight, Shield, Heart, BookOpen, Crown } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';
import { api } from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';

interface HomeData {
  welcomeMessage: string;
  statistics: { totalMembers: number; activeMembers: number };
  upcomingMeetings: Array<{ id: string; title: string; location?: string; meetingDate: string; meetingTime?: string }>;
}

interface TeamMember {
  id: string;
  name: string;
  nameOm?: string;
  role: string;
  roleOm?: string;
  image?: string;
  type: 'member' | 'leader';
}

export default function PublicHomePage() {
  const { t, i18n } = useTranslation();
  const [data, setData] = useState<HomeData | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const isOm = i18n.language === 'om';

  useEffect(() => {
    Promise.all([
      api.get('/public/home')
        .then((res: { data: { data: HomeData } }) => setData(res.data.data))
        .catch(() => setData(null)),
      api.get('/team')
        .then((res: { data: { data: TeamMember[] } }) => setTeam(res.data.data || []))
        .catch(() => setTeam([])),
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <PublicLayout>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #060e33 0%, #091540 40%, #0d1e5e 70%, #091540 100%)',
        minHeight: '88vh',
        display: 'flex', alignItems: 'center',
      }}>
        {/* Community members network pattern - VISIBLE */}
        <div className="absolute inset-0 opacity-25" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2322c55e;stop-opacity:0.8' /%3E%3Cstop offset='100%25' style='stop-color:%23d97706;stop-opacity:0.8' /%3E%3C/linearGradient%3E%3C/defs%3E%3C!-- Savings/members circles --%3E%3Cg fill='url(%23grad)'%3E%3Ccircle cx='100' cy='100' r='20'/%3E%3Ccircle cx='300' cy='150' r='18'/%3E%3Ccircle cx='200' cy='250' r='22'/%3E%3Ccircle cx='350' cy='300' r='19'/%3E%3Ccircle cx='50' cy='300' r='16'/%3E%3Ccircle cx='150' cy='50' r='17'/%3E%3C/g%3E%3C!-- Connection lines between members --%3E%3Cg stroke='%2322c55e' stroke-width='2' stroke-opacity='0.4'%3E%3Cline x1='100' y1='100' x2='200' y2='250'/%3E%3Cline x1='100' y1='100' x2='300' y2='150'/%3E%3Cline x1='300' y1='150' x2='350' y2='300'/%3E%3Cline x1='200' y1='250' x2='50' y2='300'/%3E%3Cline x1='150' y1='50' x2='100' y2='100'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
          backgroundRepeat: 'repeat',
        }} />
        
        {/* Grid pattern - more visible */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: 'linear-gradient(rgba(100,200,100,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(100,200,100,0.3) 1px,transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        
        {/* Floating decorative cards - Member profiles - MORE VISIBLE */}
        <div className="absolute top-20 left-8 w-28 h-20 rounded-xl opacity-30 pointer-events-none shadow-xl border-2 border-green-400"
          style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(16,185,129,0.3))', transform: 'rotate(-15deg)' }} />
        <div className="absolute top-40 right-16 w-32 h-24 rounded-xl opacity-30 pointer-events-none shadow-xl border-2 border-orange-400"
          style={{ background: 'linear-gradient(135deg, rgba(217,119,6,0.3), rgba(245,158,11,0.3))', transform: 'rotate(20deg)' }} />
        <div className="absolute bottom-32 left-12 w-24 h-16 rounded-xl opacity-25 pointer-events-none shadow-lg border-2 border-blue-400"
          style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(29,78,216,0.3))', transform: 'rotate(-25deg)' }} />
        <div className="absolute bottom-20 right-20 w-30 h-22 rounded-xl opacity-25 pointer-events-none shadow-lg border-2 border-pink-400"
          style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.3), rgba(219,39,119,0.3))', transform: 'rotate(15deg)' }} />
        
        {/* Glow orbs - MORE VISIBLE */}
        <div className="absolute top-1/4 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #d97706, transparent)' }} />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center z-10">
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

      {/* ── Our Community Section with Photo ── */}
      <section style={{ background: 'rgba(9, 21, 64, 0.4)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} className="py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            
            {/* Left - Image */}
            <div className="relative rounded-2xl overflow-hidden shadow-2xl h-72 md:h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-orange-400/20" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Cdefs%3E%3ClinearGradient id='communityGrad'%3E%3Cstop offset='0%25' stop-color='%2322c55e' stop-opacity='0.1'/%3E%3Cstop offset='100%25' stop-color='%23d97706' stop-opacity='0.1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='400' fill='url(%23communityGrad)'/%3E%3C!-- Stylized people in circle --%3E%3Ccircle cx='200' cy='100' r='25' fill='%2322c55e' opacity='0.3'/%3E%3Ccircle cx='300' cy='180' r='25' fill='%23d97706' opacity='0.3'/%3E%3Ccircle cx='250' cy='280' r='25' fill='%233b82f6' opacity='0.3'/%3E%3Ccircle cx='150' cy='280' r='25' fill='%23ec4899' opacity='0.3'/%3E%3Ccircle cx='100' cy='180' r='25' fill='%2306b6d4' opacity='0.3'/%3E%3C!-- Connection lines --%3E%3Cg stroke='%2322c55e' stroke-width='2' stroke-opacity='0.2'%3E%3Cline x1='200' y1='100' x2='300' y2='180'/%3E%3Cline x1='300' y1='180' x2='250' y2='280'/%3E%3Cline x1='250' y1='280' x2='150' y2='280'/%3E%3Cline x1='150' y1='280' x2='100' y2='180'/%3E%3Cline x1='100' y1='180' x2='200' y2='100'/%3E%3C/g%3E%3C!-- Center text --%3E%3Ctext x='200' y='200' text-anchor='middle' font-size='40' font-weight='bold' fill='%2322c55e' opacity='0.15'%3E👥%3C/text%3E%3C/svg%3E")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center text-center p-6">
                <div>
                  <div className="text-6xl md:text-7xl mb-4">👥</div>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-2">{isOm ? 'Hawaasa Nukeenyaa' : 'Our Community'}</p>
                  <p className="text-sm sm:text-base" style={{ color: '#bfdbfe' }}>
                    {isOm 
                      ? 'Miseensota 3+ tokkummaa fi waan addaa hordofuu.' 
                      : '3+ members working together for our community'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right - Description */}
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6" style={{ color: '#e2e8f0' }}>
                {isOm ? 'Hawaasa Ciminaa Keenyaa' : 'Strengthening Our Community'}
              </h2>
              
              <p className="text-base sm:text-lg mb-5 leading-relaxed" style={{ color: '#bfdbfe' }}>
                {isOm
                  ? 'Gamtaa Dargaggoota Melka Jabdu hawaasa miseensa guutaa fi sirna bulchiinsaa gaaruu kanaaf dhaabamee jira. Tokkummaa, midhaa waliin, fi gumiin hedduu, nu milka\'aa godhuuf kan gargaara.'
                  : 'Gamtaa Dargaggoota Melka Jabdu (Community of Melka Jabdu Youth) is dedicated to strengthening our community through cooperation, trust, and collective responsibility.'}
              </p>

              <div className="space-y-4">
                {[
                  {
                    icon: '✓',
                    title: isOm ? 'Tokkummaa' : 'Unity',
                    desc: isOm ? 'Miseensota guutaa waliin dhaabbaa hojjechaa.' : 'All members work together towards common goals',
                  },
                  {
                    icon: '✓',
                    title: isOm ? 'Midhaa Addaa' : 'Mutual Support',
                    desc: isOm ? 'Nama jirtu hundaa midhaa kennuu fi walitti qabaachuu.' : 'We support each other through thick and thin',
                  },
                  {
                    icon: '✓',
                    title: isOm ? 'Adeemsa Addaa' : 'Transparent Process',
                    desc: isOm ? 'Kaffaltii fi qusannoo sirriitti hordofama.' : 'Clear tracking of contributions and savings for all',
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex-shrink-0 text-xl font-bold" style={{ color: '#22c55e' }}>{icon}</div>
                    <div>
                      <h3 className="font-semibold mb-1" style={{ color: '#e2e8f0' }}>{title}</h3>
                      <p className="text-sm" style={{ color: '#bfdbfe' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <Link to="/about" 
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)', color: 'white' }}>
                {isOm ? 'Waa\'ee Keenya Hedduu Baruu' : 'Learn More About Us'}
                <ArrowRight size={18} />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Team & Leadership Section ── */}
      {team.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4">
            {/* Leaders Section - FIRST */}
            {team.filter(m => m.type === 'leader').length > 0 && (
              <div className="mb-16">
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#e2e8f0' }}>
                    <Crown size={28} style={{ color: '#d97706' }} />
                    {isOm ? 'Dareessota' : 'Leadership'}
                  </h2>
                  <div className="w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, #d97706, #f59e0b)' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {team.filter(m => m.type === 'leader').map((leader) => (
                    <div key={leader.id} className="rounded-xl p-6 text-center transition-all hover:shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {leader.image ? (
                        <img src={leader.image} alt={leader.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                          style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)' }}>
                          👔
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#e2e8f0' }}>
                        {isOm && leader.nameOm ? leader.nameOm : leader.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#22c55e' }}>
                        {isOm && leader.roleOm ? leader.roleOm : leader.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members Section - SECOND */}
            {team.filter(m => m.type === 'member').length > 0 && (
              <div>
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#e2e8f0' }}>
                    <Users size={28} style={{ color: '#22c55e' }} />
                    {isOm ? 'Miseensota Koree' : 'Team Members'}
                  </h2>
                  <div className="w-16 h-1 rounded-full mx-auto" style={{ background: 'linear-gradient(90deg, #22c55e, #16a34a)' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {team.filter(m => m.type === 'member').map((member) => (
                    <div key={member.id} className="rounded-xl p-6 text-center transition-all hover:shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-4 object-cover" />
                      ) : (
                        <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #10b981)' }}>
                          👤
                        </div>
                      )}
                      <h3 className="font-bold text-lg mb-1" style={{ color: '#e2e8f0' }}>
                        {isOm && member.nameOm ? member.nameOm : member.name}
                      </h3>
                      <p className="text-sm" style={{ color: '#f59e0b' }}>
                        {isOm && member.roleOm ? member.roleOm : member.role}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

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
