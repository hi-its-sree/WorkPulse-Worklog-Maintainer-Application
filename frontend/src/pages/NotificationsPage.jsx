import { useEffect, useState } from 'react';
import { BellOff, Check, Clock3 } from 'lucide-react';
import api from '../lib/api.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage, format } from '../contexts/LanguageContext.jsx';

// How long "remind me later" pushes a notification out for.
const SNOOZE_CHOICES = [
  { key: 'oneHour', minutes: 60 },
  { key: 'fourHours', minutes: 240 },
  { key: 'tomorrow', minutes: 60 * 24 },
  { key: 'nextWeek', minutes: 60 * 24 * 7 },
];

const NotificationsPage = () => {
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [snoozeOpen, setSnoozeOpen] = useState(null);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data || []);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, []);

  // Both actions take the notification off the list; a snoozed one returns by itself
  // once its delay has passed.
  const applyAction = async (id, request) => {
    setBusyId(id);
    setActionError('');
    const previous = notifications;
    setNotifications((current) => current.filter((item) => item.id !== id));
    setSnoozeOpen(null);

    try {
      await request();
    } catch (err) {
      setNotifications(previous);
      setActionError(strings.notifications.actionFailed);
    } finally {
      setBusyId(null);
    }
  };

  const markSeen = (id) => applyAction(id, () => api.patch(`/notifications/${id}/seen`));
  const remindLater = (id, minutes) => applyAction(id, () => api.patch(`/notifications/${id}/snooze`, { minutes }));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.notifications.title}</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.notifications.pageTitle}</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>{strings.notifications.pageDescription}</p>
          </div>
          <div className="rounded-3xl px-4 py-3 text-sm font-semibold shadow-sm" style={{ backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>{format(strings.notifications.countLabel, { count: notifications.length })}</div>
        </div>

        {actionError && (
          <div className="mb-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{actionError}</div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.notifications.loading}</div>
          ) : error ? (
            <div className="rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.notifications.error}</div>
          ) : notifications.length === 0 ? (
            <div className="flex items-center gap-3 rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
              <BellOff size={18} />
              {strings.notifications.emptyState}
            </div>
          ) : notifications.map((item) => (
            <div key={item.id || item.title} className="app-panel p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{item.category || strings.notifications.categoryDefault}</p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{item.title}</h2>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{item.status ? item.status : item.category || strings.notifications.statusDefault}</span>
              </div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{item.body || item.description || strings.notifications.noDetails}</p>
              {item.createdAt && (
                <div className="mt-4 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.notifications.received} {new Date(item.createdAt).toLocaleString(locale)}</div>
              )}

              <div className="relative mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => markSeen(item.id)}
                  disabled={busyId === item.id}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                  style={{ backgroundColor: activeTheme.accent, color: '#fff' }}
                >
                  <Check size={16} /> {strings.notifications.markSeen}
                </button>

                <button
                  type="button"
                  onClick={() => setSnoozeOpen((current) => (current === item.id ? null : item.id))}
                  disabled={busyId === item.id}
                  className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-60"
                  style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                >
                  <Clock3 size={16} /> {strings.notifications.remindLater}
                </button>

                {snoozeOpen === item.id && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border p-2 shadow-lg" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
                    {SNOOZE_CHOICES.map((choice) => (
                      <button
                        key={choice.key}
                        type="button"
                        onClick={() => remindLater(item.id, choice.minutes)}
                        className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]"
                        style={{ color: activeTheme.textPrimary }}
                      >
                        {strings.notifications.snoozeOptions[choice.key]}
                      </button>
                    ))}
                  </div>
                )}

                {item.snoozedUntil && (
                  <span className="text-xs" style={{ color: activeTheme.textSecondary }}>
                    {strings.notifications.snoozedUntil} {new Date(item.snoozedUntil).toLocaleString(locale)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
