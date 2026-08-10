import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { BarChart3, BellRing, LogOut, NotebookPen, Settings, UserCircle2 } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { formatDateKey } from '../components/workflow/constants.js';
import { getJapaneseHolidays } from '../lib/holidays.js';
import { buildDateRange } from '../lib/dateRange.js';
import { syncLocalEntries } from '../lib/workflowStore.js';
import { isProfileComplete, profileCompletionPercent } from '../lib/profileCompletion.js';
import api from '../lib/api.js';

const headerHeightPx = 84;

const navItems = [
  { key: 'dashboard', to: '/dashboard' },
  { key: 'planner', to: '/planner' },
  { key: 'worklog', to: '/worklog' },
  { key: 'calendar', to: '/calendar' },
  { key: 'timesheet', to: '/timesheet' },
  { key: 'reports', to: '/reports' },
  { key: 'notifications', to: '/notifications' },
  { key: 'projects', to: '/projects' },
  { key: 'meetings', to: '/meetings' },
];

const isNavActive = (pathname, target) => {
  if (target === '/dashboard') return pathname === '/dashboard';
  return pathname === target || pathname.startsWith(`${target}/`);
};


const buildMonthCalendar = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let week = Array(firstDay.getDay()).fill(null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    week.push(new Date(year, month, day));
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  return weeks;
};

const MainLayout = () => {
  const { user, signOut } = useContext(AuthContext);
  const location = useLocation();
  const { language, strings, locale } = useLanguage();
  const { mode, setThemeMode, activeTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const menuRef = useRef(null);

  const selectedCalendarDate = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const value = params.get('date');
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, [location.search]);

  const [currentYear, setCurrentYear] = useState(() => (selectedCalendarDate ?? new Date()).getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => (selectedCalendarDate ?? new Date()).getMonth());

  useEffect(() => {
    if (selectedCalendarDate) {
      setCurrentYear(selectedCalendarDate.getFullYear());
      setCurrentMonth(selectedCalendarDate.getMonth());
    }
  }, [selectedCalendarDate]);

  const holidayMap = useMemo(() => getJapaneseHolidays(currentYear, strings), [currentYear, strings]);
  const calendarWeeks = useMemo(() => buildMonthCalendar(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedKey = selectedCalendarDate ? formatDateKey(selectedCalendarDate) : formatDateKey(new Date());
  const monthName = new Date(currentYear, currentMonth).toLocaleString(locale, { month: 'long', year: 'numeric' });
  const profileCompletion = useMemo(() => profileCompletionPercent(user), [user]);

  // Push up any plan or worklog that only made it as far as this browser — data
  // entered before the database migration, or saved while the session had expired.
  useEffect(() => {
    syncLocalEntries();
  }, []);

  // This week's figures, derived from stored worklogs / meetings / tasks.
  const [weeklySnapshot, setWeeklySnapshot] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSnapshot = async () => {
      const { dateFrom, dateTo } = buildDateRange('Weekly');

      try {
        const [analyticsResponse, meetingsResponse, tasksResponse] = await Promise.all([
          api.get('/reports/analytics', { params: { dateFrom, dateTo } }),
          api.get('/meetings').catch(() => ({ data: [] })),
          api.get('/tasks').catch(() => ({ data: [] })),
        ]);

        if (!isMounted) return;

        const meetingsThisWeek = (meetingsResponse.data || []).filter((meeting) => {
          const key = meeting.date ? String(meeting.date).slice(0, 10) : null;
          return key && key >= dateFrom && key <= dateTo;
        }).length;

        const openTasks = (tasksResponse.data || []).filter(
          (task) => String(task.status || '').toUpperCase() !== 'COMPLETED',
        ).length;

        setWeeklySnapshot({
          hours: analyticsResponse.data?.summary?.formattedTotalHours || '0.0h',
          meetings: meetingsThisWeek,
          tasks: openTasks,
        });
      } catch {
        if (isMounted) setWeeklySnapshot(null);
      }
    };

    if (user) loadSnapshot();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const quickStats = useMemo(() => [
    { label: strings.header.quickStats.hours, value: weeklySnapshot?.hours ?? '—' },
    { label: strings.header.quickStats.meetings, value: weeklySnapshot ? String(weeklySnapshot.meetings) : '—' },
    { label: strings.header.quickStats.tasks, value: weeklySnapshot ? String(weeklySnapshot.tasks) : '—' },
  ], [strings, weeklySnapshot]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [userMenuOpen]);

  // The indicator is a statement of fact, not a dismissible message: it stays for
  // as long as the profile is unfinished and disappears the moment it is complete.
  useEffect(() => {
    setShowProfilePrompt(Boolean(user) && !isProfileComplete(user));
    localStorage.removeItem('workpulse_show_profile_prompt');
  }, [user]);

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-200" style={{ background: activeTheme.background }}>
      <div className="fixed inset-x-0 top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)]/90 backdrop-blur-xl" style={{ height: `${headerHeightPx}px`, backgroundColor: `${activeTheme.surface}e6`, borderColor: activeTheme.border }}>
        <div className="mx-auto relative flex h-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 overflow-hidden rounded-2xl" style={{ backgroundColor: activeTheme.accentSoft }}>
              <img src="/createimg-ai.svg" alt={strings.appName} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.48em]" style={{ color: activeTheme.accent }}>{strings.appName}</p>
              <p className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.appTagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
              className="rounded-full border px-4 py-2 shadow-sm transition"
              style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
            >
              {mode === 'dark' ? strings.settings.lightMode : strings.settings.darkMode}
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((current) => !current)}
                className={`h-9 w-9 rounded-full border shadow-sm transition flex items-center justify-center ${showProfilePrompt ? 'ring-2 ring-blue-400/60 animate-pulse' : ''}`}
                style={{ borderColor: activeTheme.accent, backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}
                aria-label={strings.menu.profile}
              >
                <span className="text-sm font-semibold leading-none" style={{ color: activeTheme.accent }}>
                  {user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'}
                </span>
              </button>

              {/* Profile prompt badge */}
              {showProfilePrompt && !userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.9 }}
                  animate={{ opacity: 1, y: 6, scale: 1 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="absolute right-0 top-full z-40 flex max-w-[190px] items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-2 shadow-sm"
                  style={{ top: 'calc(100% + 10px)', borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}
                >
                  <div className="relative flex h-3 w-3">
                    <div className="absolute inset-0 animate-ping rounded-full bg-blue-400/50" />
                    <div className="relative h-3 w-3 rounded-full" style={{ backgroundColor: activeTheme.accent }} />
                  </div>
                  <span className="truncate text-xs font-semibold">{strings.common.completeProfile}</span>
                  <div
                    className="absolute right-[-6px] top-2 h-0 w-0"
                    style={{
                      borderTop: '6px solid transparent',
                      borderBottom: '6px solid transparent',
                      borderLeft: `8px solid ${activeTheme.surface}`,
                    }}
                  />
                </motion.div>
              )}

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    ref={menuRef}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="absolute right-0 top-full z-50 mt-3 w-[min(84vw,380px)] max-h-[80vh] overflow-hidden rounded-[32px] border shadow-2xl backdrop-blur-xl"
                    style={{ borderColor: activeTheme.border, backgroundColor: `${activeTheme.surface}f2`, boxShadow: activeTheme.shadow }}
                  >
                    <div className="h-[80vh] overflow-y-auto p-4">
                      <div className="rounded-[28px] border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
                        <div className="flex items-start gap-3">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>
                            {user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || 'Guest User'}</p>
                            <p className="truncate text-xs" style={{ color: activeTheme.textSecondary }}>{user?.email || 'user@workpulse.com'}</p>
                          </div>
                        </div>

                        <div className="mt-4 rounded-3xl bg-[rgba(255,255,255,0.08)] p-4" style={{ backgroundColor: activeTheme.surface }}>
                          <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.account.profileCompletion}</p>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{profileCompletion}% complete</p>
                            <div className="w-full max-w-[120px] overflow-hidden rounded-full bg-[rgba(0,0,0,0.05)]">
                              <div className="h-2 rounded-full" style={{ width: `${profileCompletion}%`, backgroundColor: activeTheme.accent }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        {quickStats.map((stat) => (
                          <div key={stat.label} className="rounded-3xl border px-3 py-3 text-center" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
                            <p className="text-lg font-semibold" style={{ color: activeTheme.textPrimary }}>{stat.value}</p>
                            <p className="text-[11px] uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{stat.label}</p>
                          </div>
                        ))}
                      </div>

                    <div className="mt-4 space-y-2">
<p className="px-2 text-[10px] uppercase tracking-[0.28em]" style={{ color: activeTheme.textSecondary }}>{strings.header.workspace}</p>
                    <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition" style={{ color: activeTheme.textPrimary, backgroundColor: activeTheme.surfaceAlt }}>
                      <UserCircle2 size={16} style={{ color: activeTheme.accent }} />
                      {strings.menu.profile}
                    </Link>
                    <Link to="/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition" style={{ color: activeTheme.textPrimary, backgroundColor: activeTheme.surfaceAlt }}>
                      <Settings size={16} style={{ color: activeTheme.accent }} />
                      {strings.menu.settings}
                    </Link>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="px-2 text-[10px] uppercase tracking-[0.28em]" style={{ color: activeTheme.textSecondary }}>{strings.header.workspace}</p>
                    <Link to="/worklog" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition" style={{ color: activeTheme.textPrimary, backgroundColor: activeTheme.surfaceAlt }}>
                      <NotebookPen size={16} style={{ color: activeTheme.accent }} />
                      {strings.menu.worklogs}
                    </Link>
                    <Link to="/reports" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition" style={{ color: activeTheme.textPrimary, backgroundColor: activeTheme.surfaceAlt }}>
                      <BarChart3 size={16} style={{ color: activeTheme.accent }} />
                      {strings.menu.reports}
                    </Link>
                    <Link to="/notifications" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 rounded-3xl px-3 py-3 text-sm font-medium transition" style={{ color: activeTheme.textPrimary, backgroundColor: activeTheme.surfaceAlt }}>
                      <BellRing size={16} style={{ color: activeTheme.accent }} />
                      {strings.menu.notifications}
                      </Link>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition"
                      style={{ backgroundColor: 'rgba(244, 63, 94, 0.12)', color: '#fb7185' }}
                    >
                      <LogOut size={16} />
                      {strings.common.signOut}
                    </button>
                  </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div style={{ paddingTop: `${headerHeightPx}px` }}>
        <aside className="fixed left-0 z-10 hidden w-[240px] border-r p-4 shadow-soft backdrop-blur-xl lg:block lg:overflow-y-auto xl:w-[280px]" style={{ top: `${headerHeightPx}px`, height: `calc(100vh - ${headerHeightPx}px)`, borderColor: activeTheme.border, backgroundColor: `${activeTheme.surfaceAlt}f2`, boxShadow: activeTheme.shadow }}>
          <div className="flex h-full flex-col">
            <div className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
              <p className="text-[10px] uppercase tracking-[0.34em]" style={{ color: activeTheme.textSecondary }}>{strings.header.workspace}</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.header.navigationHub}</p>
            </div>

            <div className="mt-6 space-y-1">
              {navItems.map((item) => {
                const active = isNavActive(location.pathname, item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition"
                    style={{
                      color: active ? activeTheme.accent : activeTheme.textPrimary,
                      backgroundColor: active ? activeTheme.accentSoft : 'transparent',
                    }}
                    onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = active ? activeTheme.accentSoft : activeTheme.surface; }}
                    onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = active ? activeTheme.accentSoft : 'transparent'; }}
                  >
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: active ? activeTheme.accent : activeTheme.border }} />
                    {strings.nav[item.key]}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="min-h-[calc(100vh-84px)] overflow-y-auto px-4 py-8 sm:px-6 lg:ml-[240px] xl:ml-[280px]" style={{ backgroundColor: activeTheme.background, color: activeTheme.textPrimary }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
