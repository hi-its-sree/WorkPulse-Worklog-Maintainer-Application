import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { registerUser } from '../lib/auth.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  const { strings } = useLanguage();
  const [formState, setFormState] = useState({
    fullName: '',
    email: '',
    employeeId: '',
    department: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const getErrorMessage = (err) => {
    const data = err?.response?.data;

    if (typeof data?.message === 'string' && data.message) {
      return data.message;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.map((item) => item?.msg || item?.message || 'Invalid field').join(' ');
    }

    if (typeof data?.error === 'string' && data.error) {
      return data.error;
    }

    return strings.auth.registrationFailed;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formState.password.length < 8) {
      setError(strings.auth.passwordMinLength);
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError(strings.auth.passwordsMustMatch);
      return;
    }

    try {
      const createdUser = await registerUser({
        fullName: formState.fullName,
        employeeId: formState.employeeId,
        email: formState.email,
        department: formState.department,
        password: formState.password,
        role: formState.role,
      });
      signIn(createdUser);
      navigate('/security-setup');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="app-card w-full max-w-2xl p-10"
      >
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">{strings.appName}</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">{strings.auth.registerTitle}</h1>
          <p className="mt-2 text-sm text-slate-500">{strings.auth.registerSubtitle}</p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {error && <div className="md:col-span-2 rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.fullName}</label>
            <input
              name="fullName"
              type="text"
              value={formState.fullName}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={strings.auth.placeholders.fullName}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.companyEmail}</label>
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={strings.auth.placeholders.email}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.employeeId}</label>
            <input
              name="employeeId"
              type="text"
              value={formState.employeeId}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={strings.auth.placeholders.employeeId}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.department}</label>
            <input
              name="department"
              type="text"
              value={formState.department}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder={strings.auth.placeholders.department}
            />
          </div>
          
          {/* role is assigned later in profile; removed from signup */}
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.password}</label>
            <input
              name="password"
              type="password"
              value={formState.password}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">{strings.auth.confirmPassword}</label>
            <input
              name="confirmPassword"
              type="password"
              value={formState.confirmPassword}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="md:col-span-2 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">{strings.auth.alreadyHaveAccount} <a href="/" className="text-blue-600 hover:text-blue-700">{strings.auth.loginLink}</a></p>
            <button className="app-action-btn">{strings.auth.createAccountButton}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
