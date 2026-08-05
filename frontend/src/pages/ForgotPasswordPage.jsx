import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recoverPassword, verifyRecoveryAnswers } from '../lib/auth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setQuestions([]);

    if (!email.trim()) {
      setError('Please enter your company email address.');
      return;
    }

    setLoading(true);
    try {
      const response = await recoverPassword({ email: email.trim().toLowerCase() });
      setQuestions(response.questions);
      setRecoveryToken(response.recoveryToken);
      setAnswers(response.questions.map((question) => ({ key: question.key, answer: '' })));
      setStatus('Answer the security questions to continue.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    setAnswers((prev) => prev.map((item, idx) => (idx === index ? { ...item, answer: value } : item)));
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (!answers.every((item) => item.answer.trim())) {
      setError('Please answer all security questions.');
      return;
    }

    setLoading(true);
    try {
      const response = await verifyRecoveryAnswers({ recoveryToken, answers });
      navigate(`/reset-password?token=${encodeURIComponent(response.resetToken)}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed.');
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
        className="app-card w-full max-w-2xl p-10"
        style={{ backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
      >
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Forgot password</p>
          <h1 className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Recover your account</h1>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Answer security questions to reset your password without email verification.</p>
        </div>

        {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
        {status && <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}

        <form className="space-y-6" onSubmit={questions.length ? handleVerify : handleStart}>
          {!questions.length && (
            <div>
              <label className="block text-sm font-medium" style={{ color: activeTheme.textPrimary }}>Company Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                placeholder="name@company.com"
                required
              />
            </div>
          )}

          {questions.length > 0 && questions.map((question, index) => (
            <div key={question.key}>
              <label className="block text-sm font-medium" style={{ color: activeTheme.textPrimary }}>{question.question}</label>
              <input
                type="text"
                value={answers[index]?.answer || ''}
                onChange={(event) => handleAnswerChange(index, event.target.value)}
                className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
                style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                placeholder="Your answer"
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="app-action-btn w-full"
          >
            {questions.length ? 'Verify answers' : 'Start recovery'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <Link to="/" className="text-blue-600 hover:text-blue-700">Back to login</Link>
          <Link to="/register" className="text-blue-600 hover:text-blue-700">Create account</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
