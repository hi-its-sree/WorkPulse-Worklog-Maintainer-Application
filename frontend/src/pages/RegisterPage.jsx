import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { registerUser } from '../lib/auth.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    designation: '',
    role: 'EMPLOYEE',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formState.password !== formState.confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    try {
      await registerUser({
        fullName: formState.fullName,
        employeeId: formState.employeeId,
        email: formState.email,
        department: formState.department,
        designation: formState.designation,
        role: formState.role,
        password: formState.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
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
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">WorkPulse</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Create your account</h1>
          <p className="mt-2 text-sm text-slate-500">Set up your employee profile and join the team.</p>
        </div>

        <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSubmit}>
          {error && <div className="md:col-span-2 rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">Full Name</label>
            <input
              name="fullName"
              type="text"
              value={formState.fullName}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Jane Doe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Employee ID</label>
            <input
              name="employeeId"
              type="text"
              value={formState.employeeId}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="EMP-001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Company Email</label>
            <input
              name="email"
              type="email"
              value={formState.email}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Department</label>
            <input
              name="department"
              type="text"
              value={formState.department}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Engineering"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Designation</label>
            <input
              name="designation"
              type="text"
              value={formState.designation}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select
              name="role"
              value={formState.role}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
            >
              <option>EMPLOYEE</option>
              <option>TEAM_LEAD</option>
              <option>PROJECT_MANAGER</option>
              <option>HR</option>
              <option>ADMIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
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
            <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
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
            <p className="text-sm text-slate-500">Already have an account? <a href="/" className="text-blue-600 hover:text-blue-700">Login</a></p>
            <button className="app-action-btn">Create account</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
