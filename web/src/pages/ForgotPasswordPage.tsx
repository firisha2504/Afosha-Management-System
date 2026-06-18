import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Lock, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

type Step = 'identifier' | 'otp' | 'newPassword' | 'success';

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const isOm = i18n.language === 'om';
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'EMAIL'>('SMS');
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/request-otp', {
        identifier,
        purpose: 'PASSWORD_RESET',
        channel,
      });
      setUserId(data.data.userId);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Phone/Email not found. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP (no password yet, just verify)
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/auth/verify-otp', {
        userId,
        code: otp,
        purpose: 'PASSWORD_RESET',
      });
      setStep('newPassword');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password with verified OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        userId,
        code: otp,
        newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel (same as login) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 40%, #15803d 100%)' }}>
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.1) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e, transparent)' }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              A
            </div>
            <span className="text-white font-semibold text-lg">Afosha MS</span>
          </div>

          <div>
            <h2 className="text-4xl font-bold text-white leading-tight mb-4">
              {isOm ? 'Jecha Iccitii' : 'Password Recovery'}<br />
              <span style={{
                background: 'linear-gradient(90deg, #fbbf24, #d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {isOm ? 'Irra Deebi\'ii Ijaaruuf' : 'Made Simple'}
              </span>
            </h2>
            <p className="text-base leading-relaxed max-w-sm" style={{ color: '#bbf7d0' }}>
              {isOm
                ? 'Bilbila ykn email keessan fayyadamuun jecha iccitii haaraa uumuu dandeessu.'
                : 'Reset your password securely using your registered phone number or email address.'}
            </p>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{isOm ? 'Nageenyaan' : 'Secure'}</p>
              <p className="text-xs" style={{ color: '#86efac' }}>{isOm ? 'OTP' : 'OTP Verification'}</p>
            </div>
            <div className="text-center">
              <p className="text-white font-semibold text-sm">{isOm ? 'Ariifachiisa' : 'Fast'}</p>
              <p className="text-xs" style={{ color: '#86efac' }}>{isOm ? 'Adeemsaa' : 'Process'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold"
              style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#14532d' }}>
              A
            </div>
            <span className="text-slate-900 font-semibold text-lg">Afosha MS</span>
          </div>

          {/* Back button */}
          <Link to="/login"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 transition-all border"
            style={{ color: '#166534', borderColor: '#bbf7d0', background: '#f0fdf4' }}>
            <ArrowLeft size={13} />
            {isOm ? 'Seensaatti Deebi\'i' : 'Back to Login'}
          </Link>

          {/* Step 1: Enter identifier */}
          {step === 'identifier' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                  {isOm ? 'Jecha Iccitii Dagatte?' : 'Forgot Password?'}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {isOm ? 'Bilbila ykn email galchaa' : 'Enter your phone number or email to receive a verification code'}
                </p>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {/* Channel selector */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      channel === 'SMS' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    <Phone size={16} />
                    {isOm ? 'Bilbila' : 'Phone (SMS)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('EMAIL')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                      channel === 'EMAIL' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'
                    }`}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    {channel === 'SMS' ? (isOm ? 'Lakkoofsa Bilbilaa' : 'Phone Number') : 'Email Address'}
                  </label>
                  <input
                    type={channel === 'SMS' ? 'tel' : 'email'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={channel === 'SMS' ? '+251...' : 'your@email.com'}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-green-500 transition-all shadow-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
                    <span>⚠</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #166534, #15803d)' }}
                >
                  {loading ? (isOm ? 'Ergaa jira...' : 'Sending...') : (isOm ? 'Koodii Ergi' : 'Send Verification Code')}
                </button>
              </form>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'otp' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                  {isOm ? 'Koodii Mirkaneessi' : 'Verify Code'}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {isOm 
                    ? `Koodii gara ${channel === 'SMS' ? 'bilbilaa' : 'email'} keessanii ergame galchaa` 
                    : `Enter the 6-digit code sent to your ${channel === 'SMS' ? 'phone' : 'email'}`}
                </p>
                <p className="text-xs text-slate-400 mt-1 font-mono">{identifier}</p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    {isOm ? 'Koodii Mirkaneessaa' : 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-green-500 transition-all shadow-sm text-center font-mono text-lg tracking-widest"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
                    <span>⚠</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #166534, #15803d)' }}
                >
                  {loading ? (isOm ? 'Mirkaneessaa jira...' : 'Verifying...') : (isOm ? 'Mirkaneessi' : 'Verify Code')}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('identifier')}
                  className="w-full py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  {isOm ? 'Koodii hin arganne? Irra deebi\'ii barbaadi' : 'Didn\'t receive code? Try again'}
                </button>
              </form>
            </>
          )}

          {/* Step 3: Set new password */}
          {step === 'newPassword' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900">
                  {isOm ? 'Jecha Iccitii Haaraa Kaa\'i' : 'Set New Password'}
                </h1>
                <p className="text-slate-500 mt-1 text-sm">
                  {isOm ? 'Jecha iccitii cimaa filadhu' : 'Choose a strong password for your account'}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    {isOm ? 'Jecha Iccitii Haaraa' : 'New Password'}
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-green-500 transition-all shadow-sm"
                    required
                  />
                  <p className="text-xs text-slate-400 mt-1">{isOm ? 'Yoo xiqqaate qubee 8' : 'At least 8 characters'}</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    {isOm ? 'Jecha Iccitii Mirkaneessi' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-green-500 transition-all shadow-sm"
                    required
                  />
                </div>

                {error && (
                  <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">
                    <span>⚠</span> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
                  style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #166534, #15803d)' }}
                >
                  {loading ? (isOm ? 'Jijjiraa jira...' : 'Resetting...') : (isOm ? 'Jecha Iccitii Irra Deebi\'ii Kaa\'i' : 'Reset Password')}
                </button>
              </form>
            </>
          )}

          {/* Step 4: Success */}
          {step === 'success' && (
            <div className="text-center">
              <div className="bg-emerald-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} className="text-emerald-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {isOm ? 'Milkaa\'e!' : 'Password Reset Successfully!'}
              </h1>
              <p className="text-slate-500 text-sm mb-8">
                {isOm 
                  ? 'Jecha iccitii keessan jijjiirameera. Amma seenuu dandeessu.' 
                  : 'Your password has been reset. You can now sign in with your new password.'}
              </p>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all"
                style={{ background: 'linear-gradient(135deg, #166534, #15803d)' }}
              >
                <Lock size={16} className="inline mr-2" />
                {isOm ? 'Amma Seeni' : 'Sign In Now'}
              </button>
            </div>
          )}

          <p className="text-center text-xs text-slate-400 mt-8">
            Afosha Management System © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
}
