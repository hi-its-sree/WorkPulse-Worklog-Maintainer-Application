import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { recoverPassword, verifyRecoveryAnswers } from '../lib/auth.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [recoveryToken, setRecoveryToken] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');
    setQuestions([]);
    setAnswers({});
    setSelectedQuestions([]);

    if (!employeeId.trim() || !email.trim()) {
      setError(strings.recovery.errors.missingIdentity);
      return;
    }

    setLoading(true);
    try {
      const response = await recoverPassword({ employeeId: employeeId.trim(), email: email.trim().toLowerCase() });
      setQuestions(response.questions);
      setRecoveryToken(response.recoveryToken);
      setAnswers(response.questions.reduce((acc, question) => ({ ...acc, [question.key]: '' }), {}));
      setStatus(strings.recovery.errors.selectThree);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to start password recovery.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleQuestionSelection = (key) => {
    setSelectedQuestions((prev) => {
      if (prev.includes(key)) {
        return prev.filter((selectedKey) => selectedKey !== key);
      }
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (selectedQuestions.length !== 3) {
      setError(strings.recovery.errors.exactlyThree);
      return;
    }

    const selectedAnswers = selectedQuestions.map((key) => ({ key, answer: answers[key]?.trim() || '' }));
    if (!selectedAnswers.every((item) => item.answer)) {
      setError(strings.recovery.errors.answerAll);
      return;
    }

    setLoading(true);
    try {
      const response = await verifyRecoveryAnswers({ recoveryToken, answers: selectedAnswers });
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
          <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.recovery.title}</p>
          <h1 className="mt-4 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.recovery.recoverTitle}</h1>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.recovery.recoverSubtitle}</p>
        </div>

        {error && <div className="rounded-3xl bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}
        {status && <div className="rounded-3xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{status}</div>}

        <form className="space-y-6" onSubmit={questions.length ? handleVerify : handleStart}>
          {!questions.length && (
              <div>
                <label className="block text-sm font-medium" style={{ color: activeTheme.textPrimary }}>{strings.recovery.companyEmail}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                  placeholder={strings.auth.placeholders.email}
                  required
                />
                <label className="block mt-3 text-sm font-medium" style={{ color: activeTheme.textPrimary }}>{strings.recovery.employeeId}</label>
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-2 w-full rounded-3xl border px-4 py-3 outline-none"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                  placeholder={strings.auth.placeholders.employeeId}
                  required
                />
              </div>
          )}

          {questions.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">{strings.recovery.selectQuestions}</p>
              {questions.map((question) => (
                <div key={question.key} className="rounded-3xl border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
                  <label className="flex items-center gap-3 text-sm font-medium" style={{ color: activeTheme.textPrimary }}>
                    <input
                      type="checkbox"
                      checked={selectedQuestions.includes(question.key)}
                      onChange={() => toggleQuestionSelection(question.key)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {question.question}
                  </label>
                  {selectedQuestions.includes(question.key) && (
                    <input
                      type="text"
                      value={answers[question.key] || ''}
                      onChange={(event) => handleAnswerChange(question.key, event.target.value)}
                      className="mt-3 w-full rounded-3xl border px-4 py-3 outline-none"
                      style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
                      placeholder={strings.recovery.answerPlaceholder}
                      required
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="app-action-btn w-full"
          >
            {questions.length ? strings.recovery.verifyAnswers : strings.recovery.startRecovery}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <Link to="/" className="text-blue-600 hover:text-blue-700">{strings.recovery.backToLogin}</Link>
          <Link to="/register" className="text-blue-600 hover:text-blue-700">{strings.recovery.createAccount}</Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPasswordPage;
