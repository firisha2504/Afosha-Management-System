import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, UserCheck, CreditCard, AlertTriangle, Wallet, HeartHandshake, Home } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
        <div className="flex items-center justify-between mb-1">
          <PageHeader title={t('dashboard.title')} />
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-green-700 transition-colors mb-8">
            <Home size={14} /> Public Website
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title={t('dashboard.totalMembers')} value={adminData.totalMembers} icon={<Users size={24} />} />
          <StatCard title={t('dashboard.activeMembers')} value={adminData.activeMembers} icon={<UserCheck size={24} />} color="bg-green-500" />
          <StatCard title="Total Financial Summary" value={`${(Number(adminData.weeklyContributions) + Number(adminData.totalSpecialContributions || 0)).toLocaleString()} ETB`} icon={<Wallet size={24} />} color="bg-blue-600" />
          <StatCard title={t('dashboard.weeklyContributions')} value={`${Number(adminData.weeklyContributions).toLocaleString()} ETB`} icon={<CreditCard size={24} />} />
          <StatCard title="Unpaid Penalties" value={`${Number(adminData.unpaidPenalties || 0).toLocaleString()} ETB`} icon={<AlertTriangle size={24} />} color="bg-red-500" />
          <StatCard title="Paid Penalties" value={`${Number(adminData.paidPenalties || 0).toLocaleString()} ETB`} icon={<AlertTriangle size={24} />} color="bg-green-500" />
          <StatCard title={t('dashboard.outstandingBalance')} value={`${Number(adminData.totalOutstandingBalance).toLocaleString()} ETB`} icon={<Wallet size={24} />} color="bg-orange-500" />
          <StatCard title={t('dashboard.specialContributions')} value={`${Number(adminData.totalSpecialContributions || 0).toLocaleString()} ETB`} icon={<HeartHandshake size={24} />} color="bg-teal-500" />
        </div>
        {chartData && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Contribution & Penalty Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="contributions" fill="#16a34a" name="Contributions" />
                <Bar dataKey="penalties" fill="#ef4444" name="Penalties" />
              </BarChart>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Weekly Collections" value={`${Number(auditorData.weeklyCollections).toLocaleString()} ETB`} icon={<CreditCard size={24} />} />
          <StatCard title="Outstanding Payments" value={auditorData.outstandingPayments} icon={<AlertTriangle size={24} />} color="bg-red-500" />
        </div>
      </div>
    );
  }

  return null;
}
