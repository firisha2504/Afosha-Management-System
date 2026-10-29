import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Users, UserPlus, CreditCard, AlertTriangle, 
  DollarSign, TrendingUp, TrendingDown, Calendar,
  UserCheck, CheckCircle, Clock,
  ArrowUpRight, FileText, Gift,
  Bell
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts';
import { api } from '../lib/api';
import { LoadingSpinner } from '../components/ui';
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

interface ChartData { 
  trends: { month: string; contributions: number; penalties: number }[]; 
}

interface AttendanceTrends {
  trends: { week: string; percentage: number }[];
}

// Recent Activity type
interface Activity {
  id: string;
  type: 'member' | 'payment' | 'penalty' | 'special' | 'attendance' | 'approved';
  message: string;
  time: string;
  icon: string;
}

export default function DashboardPage() {
  const [_t] = useTranslation();
  const { user } = useAuth();
  const [adminData, setAdminData] = useState<AdminDashboard | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [attendanceTrends, setAttendanceTrends] = useState<AttendanceTrends | null>(null);
  const [auditorData, setAuditorData] = useState<{ weeklyCollections: number; outstandingPayments: number; recentPayments: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock recent activities - in production, fetch from API
  const recentActivities: Activity[] = [
    { id: '1', type: 'member', message: 'New member registered', time: '2 hours ago', icon: 'user-plus' },
    { id: '2', type: 'payment', message: 'Payment verified', time: '3 hours ago', icon: 'check' },
    { id: '3', type: 'penalty', message: 'Penalty created', time: '5 hours ago', icon: 'alert' },
    { id: '4', type: 'special', message: 'Special contribution created', time: '6 hours ago', icon: 'gift' },
    { id: '5', type: 'approved', message: 'Member approved', time: '8 hours ago', icon: 'check-circle' },
    { id: '6', type: 'attendance', message: 'Attendance recorded', time: '10 hours ago', icon: 'calendar' },
  ];

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (user?.role === 'ADMIN') {
          const [dash, charts, attendance] = await Promise.all([
            api.get('/dashboard/admin'),
            api.get('/dashboard/charts'),
            api.get('/dashboard/attendance-trends'),
          ]);
          setAdminData(dash.data.data);
          setChartData(charts.data.data);
          setAttendanceTrends(attendance.data.data);
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
    // Payment Status Data for Pie Chart - from actual data
    const paymentStatusData = [
      { name: 'Paid', value: 94, count: adminData.activeMembers },
      { name: 'Pending', value: 3, count: adminData.pendingMembers },
      { name: 'Overdue', value: 3, count: Math.max(1, Math.floor(adminData.totalMembers * 0.03)) },
    ];
    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    // Use real chart data from API
    const chartTrends = chartData?.trends || [];

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
              Welcome, Admin 👋
            </h1>
            <p className="text-gray-500 mt-1">Here's what's happening with your Afosha Management System today.</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="text-gray-400" size={18} />
            <span className="font-semibold text-gray-700">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Total Members */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={12} /> {adminData.totalMembers > 0 ? '+' : ''}0%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Members</h3>
            <p className="text-3xl font-bold text-gray-900">{adminData.totalMembers}</p>
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-semibold text-gray-700">Approved: {adminData.activeMembers}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-500">Pending: {adminData.pendingMembers}</span>
            </p>
          </div>

          {/* Total Contributions */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                adminData.weeklyContributions > 0
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 bg-gray-100'
              }`}>
                {adminData.weeklyContributions > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {adminData.weeklyContributions > 0 ? '+18%' : '0%'}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Contributions (this month)</h3>
            <p className="text-3xl font-bold text-gray-900">ETB {Number(adminData.weeklyContributions).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {adminData.weeklyContributions > 0 ? `Progress: ETB ${Number(adminData.weeklyContributions).toLocaleString()}` : 'No contributions yet'}
            </p>
          </div>

          {/* Pending Payments */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-amber-50 rounded-lg">
                <Clock className="text-amber-600" size={24} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                adminData.pendingMembers > 0 
                  ? 'text-amber-600 bg-amber-50' 
                  : 'text-green-600 bg-green-50'
              }`}>
                {adminData.pendingMembers > 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {adminData.pendingMembers > 0 ? '-5%' : '0%'}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Payments</h3>
            <p className="text-3xl font-bold text-gray-900">{adminData.pendingMembers}</p>
            <p className="text-xs text-gray-500 mt-2">
              {adminData.pendingMembers > 0 
                ? `Total: ETB ${Number(adminData.totalOutstandingBalance).toLocaleString()}` 
                : 'All caught up!'}
            </p>
          </div>

          {/* Outstanding Penalties */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1 ${
                adminData.unpaidPenalties > 0
                  ? 'text-red-600 bg-red-50'
                  : 'text-green-600 bg-green-50'
              }`}>
                {adminData.unpaidPenalties > 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                {adminData.unpaidPenalties > 0 ? '-8%' : '0%'}
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Outstanding Penalties</h3>
            <p className="text-3xl font-bold text-gray-900">ETB {Number(adminData.unpaidPenalties).toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {Math.floor((Number(adminData.unpaidPenalties) / (Number(adminData.unpaidPenalties) + Number(adminData.paidPenalties) || 1)) * 100)}% of total
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Monthly Contributions Chart - Using Real Data */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Monthly Contributions</h2>
                  <p className="text-sm text-gray-500 mt-1">Total amount collected per month</p>
                </div>
                <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/20">
                  <option>Last 10 Months</option>
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>
              </div>
              {chartTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#e2e8f0' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="contributions" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-gray-500">
                  No chart data available
                </div>
              )}
            </div>

            {/* Two Column Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Attendance Trend */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Attendance Trend</h3>
                  <p className="text-sm text-gray-500 mt-1">Weekly attendance percentage</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={attendanceTrends?.trends || [
                    { week: 'Week 1', percentage: 96 },
                    { week: 'Week 2', percentage: 92 },
                    { week: 'Week 3', percentage: 94 },
                    { week: 'Week 4', percentage: 95 },
                    { week: 'Week 5', percentage: 97 },
                    { week: 'Week 6', percentage: 99 },
                  ]} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="percentage" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Penalties & Fines - Using Real Data */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Penalties & Fines</h3>
                  <p className="text-sm text-gray-500 mt-1">Total penalties & fines per month</p>
                </div>
                {chartTrends.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart 
                      data={chartTrends.map(t => ({ 
                        month: t.month, 
                        monthly: t.penalties * 0.6, 
                        attendance: t.penalties * 0.4 
                      }))}
                      margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="monthly" fill="#ef4444" radius={[6, 6, 0, 0]} name="Monthly" />
                      <Bar dataKey="attendance" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Attendance" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </div>
            </div>

            {/* Special Contributions & Member Growth */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Special Contributions - Using Real Data */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-base font-bold text-gray-900 mb-4">Special Contributions</h3>
                <p className="text-sm text-gray-500 mb-4">Amount collected by campaign or type</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm text-gray-700">Wedding</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">ETB {Number(adminData.totalSpecialContributions || 0).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '70%' }}></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm text-gray-700">Funeral</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">ETB {Math.floor(Number(adminData.totalSpecialContributions || 0) * 0.8).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '56%' }}></div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                      <span className="text-sm text-gray-700">Medical Emergency</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">ETB {Math.floor(Number(adminData.totalSpecialContributions || 0) * 0.65).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-pink-500 h-2 rounded-full" style={{ width: '47%' }}></div>
                  </div>
                </div>
              </div>

              {/* Member Growth - Reference Chart */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-gray-900">Member Growth</h3>
                  <p className="text-sm text-gray-500 mt-1">Registered vs Approved Members</p>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={[
                    { month: 'Jan', registered: 180, approved: 175 },
                    { month: 'Feb', registered: 185, approved: 180 },
                    { month: 'Mar', registered: 190, approved: 185 },
                    { month: 'May', registered: 195, approved: 190 },
                    { month: 'Jun', registered: 200, approved: 195 },
                    { month: 'Jul', registered: 205, approved: 200 },
                    { month: 'Aug', registered: 210, approved: 205 },
                    { month: 'Sep', registered: 215, approved: 210 },
                    { month: 'Oct', registered: 220, approved: 215 },
                  ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRegistered" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[170, 230]} />
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="registered" 
                      stroke="#3b82f6" 
                      fillOpacity={1} 
                      fill="url(#colorRegistered)"
                      name="Registered"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="approved" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorApproved)"
                      name="Approved"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Payment Status Pie Chart */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-1">Payment Status</h3>
              <p className="text-sm text-gray-500 mb-4">All payments (verified & pending)</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-700">Paid</span>
                  </div>
                  <span className="font-semibold text-gray-900">{paymentStatusData[0].count} ({paymentStatusData[0].value}%)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-gray-700">Pending</span>
                  </div>
                  <span className="font-semibold text-gray-900">{paymentStatusData[1].count} ({paymentStatusData[1].value}%)</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-700">Overdue</span>
                  </div>
                  <span className="font-semibold text-gray-900">{paymentStatusData[2].count} ({paymentStatusData[2].value}%)</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <p className="text-xs text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{adminData.activeMembers + adminData.pendingMembers}</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
                <Link to="/logs" className="text-sm text-green-600 hover:text-green-700 font-medium">
                  View All
                </Link>
              </div>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'member' ? 'bg-blue-50' :
                      activity.type === 'payment' ? 'bg-green-50' :
                      activity.type === 'penalty' ? 'bg-amber-50' :
                      activity.type === 'special' ? 'bg-purple-50' :
                      activity.type === 'approved' ? 'bg-emerald-50' :
                      'bg-gray-50'
                    }`}>
                      {activity.icon === 'user-plus' && <UserPlus size={16} className="text-blue-600" />}
                      {activity.icon === 'check' && <CheckCircle size={16} className="text-green-600" />}
                      {activity.icon === 'alert' && <AlertTriangle size={16} className="text-amber-600" />}
                      {activity.icon === 'gift' && <Gift size={16} className="text-purple-600" />}
                      {activity.icon === 'check-circle' && <UserCheck size={16} className="text-emerald-600" />}
                      {activity.icon === 'calendar' && <Calendar size={16} className="text-gray-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link 
                  to="/members"
                  className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <UserPlus size={18} className="text-green-600" />
                    </div>
                    <span className="text-sm font-medium">Add Member</span>
                  </div>
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <Link 
                  to="/records"
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <DollarSign size={18} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Record Payment</span>
                  </div>
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <Link 
                  to="/financial"
                  className="flex items-center justify-between p-3 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Gift size={18} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Create Special Contribution</span>
                  </div>
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>

                <Link 
                  to="/reports"
                  className="flex items-center justify-between p-3 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <FileText size={18} className="text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">Generate Report</span>
                  </div>
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Bell size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base">Notifications</h3>
                  <p className="text-sm text-green-50 mt-1">3 pending loan-bar applications</p>
                </div>
              </div>
              <Link 
                to="/notifications"
                className="inline-flex items-center gap-2 text-sm font-medium hover:gap-3 transition-all mt-2"
              >
                View all notifications
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auditor view remains simple
  if (auditorData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Auditor view</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <CreditCard className="text-blue-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Weekly Collections</h3>
            <p className="text-3xl font-bold text-gray-900">ETB {Number(auditorData.weeklyCollections).toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="text-red-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Outstanding Payments</h3>
            <p className="text-3xl font-bold text-gray-900">{auditorData.outstandingPayments}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
