import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CreditCard, AlertTriangle, Wallet, HeartHandshake, Home, TrendingUp } from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { api } from '../lib/api';
import { StatCard, PageHeader, LoadingSpinner } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';

interface AdminDashboard {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  weeklyContributions: number;
  unpaidPenalties: number;
  paidPenalties: number;
  totalOutstandingBalance: number;
  totalSpecialContributions?: number;
}

interface ChartData { trends: { month: string; contributions: number; penalties: number }[]; }

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [auditorData, setAuditorData] = useState<{ weeklyCollections: number; outstandingPayments: number; recentPayments: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const [dash, charts] = await Promise.all([
            api.get('/dashboard/admin'),
            api.get('/dashboard/charts'),
          ]);
          setAdminData(dash.data.data);
          setChartData(charts.data.data);
        } else {
          const { data } = await api.get('/dashboard/auditor');
          setAuditorData(data.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [user?.role]);

  if (loading) return <LoadingSpinner />;

  if (user?.role === 'ADMIN' && adminData) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-1">
          <PageHeader title={t('dashboard.title')} />
          <Link 
            to="/"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-green-700 hover:text-white bg-green-50 hover:bg-green-600 border border-green-200 rounded-lg transition-all duration-200 sm:mb-8 whitespace-nowrap"
          >
            <Home size={15} className="sm:w-4 sm:h-4" /> 
            <span className="hidden xs:inline">Public Website</span>
            <span className="xs:hidden">Website</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard title={t('dashboard.totalMembers')} value={adminData.totalMembers} icon={<Users className="w-full h-full" />} />
          <StatCard title={t('dashboard.activeMembers')} value={adminData.activeMembers} icon={<UserCheck className="w-full h-full" />} color="bg-green-500" />
          <StatCard 
            title="Total Financial Summary" 
            value={`${(
              Number(adminData.weeklyContributions) + 
              Number(adminData.totalSpecialContributions || 0) + 
              Number(adminData.paidPenalties || 0)
            ).toLocaleString()} ETB`} 
            icon={<Wallet className="w-full h-full" />} 
            color="bg-blue-600" 
          />
          <StatCard title={t('dashboard.weeklyContributions')} value={`${Number(adminData.weeklyContributions).toLocaleString()} ETB`} icon={<CreditCard className="w-full h-full" />} />
          <StatCard title="Unpaid Penalties" value={`${Number(adminData.unpaidPenalties || 0).toLocaleString()} ETB`} icon={<AlertTriangle className="w-full h-full" />} color="bg-red-500" />
          <StatCard title="Paid Penalties" value={`${Number(adminData.paidPenalties || 0).toLocaleString()} ETB`} icon={<AlertTriangle className="w-full h-full" />} color="bg-green-500" />
          <StatCard title={t('dashboard.outstandingBalance')} value={`${Number(adminData.totalOutstandingBalance).toLocaleString()} ETB`} icon={<Wallet className="w-full h-full" />} color="bg-orange-500" />
          <StatCard title={t('dashboard.specialContributions')} value={`${Number(adminData.totalSpecialContributions || 0).toLocaleString()} ETB`} icon={<HeartHandshake className="w-full h-full" />} color="bg-teal-500" />
        </div>
        {chartData && (
          <div className="bg-gradient-to-br from-white to-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="text-green-600" size={24} />
                  Financial Trends
                </h2>
                <p className="text-sm text-slate-500 mt-1">Monthly contribution and penalty overview</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={320} className="sm:h-[380px]">
              <AreaChart data={chartData.trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContributions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorPenalties" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '12px', fontWeight: 500 }}
                  tick={{ fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px'
                  }}
                  labelStyle={{ fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}
                  itemStyle={{ padding: '4px 0', fontSize: '13px' }}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: '20px' }}
                  iconType="circle"
                  formatter={(value) => <span style={{ color: '#475569', fontWeight: 500, fontSize: '14px' }}>{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="contributions" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorContributions)" 
                  name="Contributions"
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="penalties" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorPenalties)" 
                  name="Penalties"
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  }

  if (auditorData) {
    return (
      <div>
        <PageHeader title={t('dashboard.title')} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <StatCard title="Weekly Collections" value={`${Number(auditorData.weeklyCollections).toLocaleString()} ETB`} icon={<CreditCard className="w-full h-full" />} />
          <StatCard title="Outstanding Payments" value={auditorData.outstandingPayments} icon={<AlertTriangle className="w-full h-full" />} color="bg-red-500" />
        </div>
      </div>
    );
  }

  return null;
}
