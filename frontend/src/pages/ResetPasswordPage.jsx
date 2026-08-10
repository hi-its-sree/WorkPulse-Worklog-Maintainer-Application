import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { resetPassword } from '../lib/auth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const useQuery = () => new URLSearchParams(useLocation().search);

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = query.get('token') || '';
    setResetToken(token);
  }, [query]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!newPassword || !confirmPassword) {
      setError(strings.resetPassword.emptyFields);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(strings.resetPassword.passwordsMustMatch);
      return;
    }

    if (newPassword.length < 8) {
      setError(strings.resetPassword.passwordMinLength);
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ resetToken, newPassword });
      setStatus(strings.resetPassword.success);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="app-card w-full max-w-md p-10"
        style={{ backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
      >
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.resetPassword.title}</p>
          <h1 className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.resetPassword.heading}</h1>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.resetPassword.subtitle}</p>
        </div>

        {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
        {status && <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium" style={{ color: activeTheme.textPrimary }}>{strings.resetPassword.newPassword}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
              style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ color: activeTheme.textPrimary }}>{strings.resetPassword.confirmPassword}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
              style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="app-action-btn w-full" disabled={loading}>{strings.resetPassword.resetButton}</button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <Link to="/" className="text-blue-600 hover:text-blue-700">{strings.resetPassword.backToLogin}</Link>
          <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">{strings.resetPassword.tryRecoveryAgain}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
