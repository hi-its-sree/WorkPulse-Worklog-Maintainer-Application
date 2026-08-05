import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { loginUser } from '../lib/auth.js';

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const user = await loginUser({ email, password });
      signIn(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
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
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">WorkPulse</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Secure login</h1>
          <p className="mt-2 text-sm text-slate-500">Access your daily work planner and analytics dashboard.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">Company Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400"
              placeholder="name@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
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
              Remember me
            </label>
            <Link to="/forgot-password" className="text-blue-600 hover:text-blue-700">Forgot password?</Link>
          </div>

          <button type="submit" className="app-action-btn w-full">Login</button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          <p>Don’t have an account? <a href="/register" className="text-blue-600 hover:text-blue-700">Register</a></p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
