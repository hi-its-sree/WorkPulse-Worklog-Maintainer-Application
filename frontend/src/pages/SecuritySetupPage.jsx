import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { getSecurityQuestions, setupSecurityQuestions } from '../lib/auth.js';

const SecuritySetupPage = () => {
  const navigate = useNavigate();
  const { user, signIn } = useContext(AuthContext);
  const [questions, setQuestions] = useState([]);
  const [setupToken, setSetupToken] = useState('');
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadQuestions = async () => {
      try {
        const data = await getSecurityQuestions();
        setQuestions(data.questions);
        setSetupToken(data.setupToken);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load security questions.');
      }
    };

    loadQuestions();
  }, [user]);

  useEffect(() => {
    if (user?.securityQuestionsConfigured) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setAnswers((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setStatusMessage('');

    if (questions.some((question) => !answers[question.key]?.trim())) {
      setError('Please answer all security questions.');
      return;
    }

    setSaving(true);

    try {
      const response = await setupSecurityQuestions({
        setupToken,
        answers: questions.map((question) => ({
          key: question.key,
          answer: answers[question.key] || '',
        })),
      });

      signIn(response.user);
      setStatusMessage('Your security questions have been saved.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save your answers.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="app-card w-full max-w-3xl p-10"
      >
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">WorkPulse</p>
          <h1 className="mt-4 text-3xl font-semibold text-slate-900">Set up your security questions</h1>
          <p className="mt-2 text-sm text-slate-500">
            Answer these questions now so you can recover your account later without email verification.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
          {statusMessage && <div className="rounded-3xl bg-emerald-100 px-4 py-3 text-sm text-emerald-700">{statusMessage}</div>}

          {questions.length === 0 && !error && (
            <p className="text-sm text-slate-500">Loading your security questions...</p>
          )}

          {questions.map((question) => (
            <div key={question.key}>
              <label className="block text-sm font-medium text-slate-700">{question.question}</label>
              <input
                name={question.key}
                type="text"
                value={answers[question.key] || ''}
                onChange={handleChange}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-blue-400"
                placeholder="Type your answer"
                required
              />
            </div>
          ))}

          <button type="submit" className="app-action-btn w-full" disabled={saving || questions.length === 0}>
            {saving ? 'Saving...' : 'Save my answers'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default SecuritySetupPage;
