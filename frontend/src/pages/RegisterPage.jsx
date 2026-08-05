import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { registerUser } from '../lib/auth.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { signIn } = useContext(AuthContext);
  const [formState, setFormState] = useState({
    fullName: '',
    employeeId: '',
    email: '',
    department: '',
    jobTitle: '',
    phone: '',
    location: '',
    manager: '',
    securityAnswerPetName: '',
    securityAnswerChildhoodNickname: '',
    securityAnswerBirthplace: '',
    securityAnswerFavoritePlace: '',
    securityAnswerFavoriteMovie: '',
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
      const createdUser = await registerUser({
        fullName: formState.fullName,
        employeeId: formState.employeeId,
        email: formState.email,
        department: formState.department,
        jobTitle: formState.jobTitle,
        phone: formState.phone,
        location: formState.location,
        manager: formState.manager,
        securityAnswerPetName: formState.securityAnswerPetName,
        securityAnswerChildhoodNickname: formState.securityAnswerChildhoodNickname,
        securityAnswerBirthplace: formState.securityAnswerBirthplace,
        securityAnswerFavoritePlace: formState.securityAnswerFavoritePlace,
        securityAnswerFavoriteMovie: formState.securityAnswerFavoriteMovie,
        password: formState.password,
        role: formState.role,
      });
      signIn(createdUser);
      navigate('/profile?onboarding=1');
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
            <label className="block text-sm font-medium text-slate-700">Job Title</label>
            <input
              name="jobTitle"
              type="text"
              value={formState.jobTitle}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Software Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Phone</label>
            <input
              name="phone"
              type="text"
              value={formState.phone}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Location</label>
            <input
              name="location"
              type="text"
              value={formState.location}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="New York, NY"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Manager</label>
            <input
              name="manager"
              type="text"
              value={formState.manager}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Jordan Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Your pet's name</label>
            <input
              name="securityAnswerPetName"
              type="text"
              value={formState.securityAnswerPetName}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Fluffy"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Childhood nickname</label>
            <input
              name="securityAnswerChildhoodNickname"
              type="text"
              value={formState.securityAnswerChildhoodNickname}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Bear"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Birthplace</label>
            <input
              name="securityAnswerBirthplace"
              type="text"
              value={formState.securityAnswerBirthplace}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Austin"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Favorite place</label>
            <input
              name="securityAnswerFavoritePlace"
              type="text"
              value={formState.securityAnswerFavoritePlace}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="Lake Tahoe"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Favorite movie</label>
            <input
              name="securityAnswerFavoriteMovie"
              type="text"
              value={formState.securityAnswerFavoriteMovie}
              onChange={handleChange}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-400"
              placeholder="The Matrix"
              required
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
