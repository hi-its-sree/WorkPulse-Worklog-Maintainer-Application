import { useContext, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { loginUser } from '../lib/auth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  const { strings } = useLanguage();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('sessionExpired') === '1';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user = await loginUser({ employeeId, password });
      signIn(user);
      navigate(user.securityQuestionsConfigured ? '/dashboard' : '/security-setup');
    } catch (err) {
      setError(err.response?.data?.message || strings.auth.loginFailed);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="app-card w-full max-w-md p-10"
      >
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">{strings.appName}</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{strings.auth.loginTitle}</h1>
          <p className="mt-2 text-sm text-slate-500">{strings.auth.loginSubtitle}</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {sessionExpired && !error && <div className="rounded-3xl bg-amber-100 px-4 py-3 text-sm text-amber-800">{strings.auth.sessionExpired}</div>}
          {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.employeeId}</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder={strings.auth.placeholders.employeeId}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              {strings.auth.rememberMe}
            </label>
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">{strings.auth.forgotPassword}</Link>
          </div>

          <button type="submit" className="app-action-btn w-full">{strings.auth.loginButton}</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>{strings.auth.noAccount} <a href="/register" className="text-blue-600 hover:text-blue-700">{strings.auth.registerLink}</a></p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
