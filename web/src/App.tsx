import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import DashboardPage from './pages/DashboardPage';
import MembersPage from './pages/MembersPage';
import PaymentsPage from './pages/PaymentsPage';
import PenaltiesPage from './pages/PenaltiesPage';
import SpecialContributionsPage from './pages/SpecialContributionsPage';
import AttendancePage from './pages/AttendancePage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import ContributionsPage from './pages/ContributionsPage';
import FinesPage from './pages/FinesPage';
import BackupPage from './pages/BackupPage';
import HistoryPage from './pages/HistoryPage';
import PublicHomePage from './pages/public/PublicHomePage';
import AboutPage from './pages/public/AboutPage';
import ProfilePage from './pages/ProfilePage';
import './i18n';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<PublicHomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/penalties" element={<PenaltiesPage />} />
            <Route path="/contributions" element={<ContributionsPage />} />
            <Route path="/special-contributions" element={<SpecialContributionsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/fines" element={<FinesPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/audit-logs" element={<AuditLogsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/backup" element={<BackupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
