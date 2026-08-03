import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { formatDateKey } from '../components/workflow/constants.js';

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Planner', to: '/planner' },
  { label: 'Worklog', to: '/worklog' },
  { label: 'Calendar', to: '/calendar' },
  { label: 'Timesheet', to: '/timesheet' },
  { label: 'Reports', to: '/reports' },
  { label: 'Notifications', to: '/notifications' },
  { label: 'Projects', to: '/projects' },
  { label: 'Meetings', to: '/meetings' },
];

const nthWeekday = (year, month, weekday, n) => {
  const date = new Date(year, month, 1);
  let count = 0;
  while (date.getMonth() === month) {
    if (date.getDay() === weekday) {
      count += 1;
      if (count === n) return new Date(date);
    }
    date.setDate(date.getDate() + 1);
  }
  return null;
};

const getJapaneseHolidays = (year) => {
  const holidays = {};
  const add = (date, label) => {
    holidays[formatDateKey(date)] = label;
  };

  add(new Date(year, 0, 1), 'New Year’s Day');
  const comingOfAge = nthWeekday(year, 0, 1, 2);
  if (comingOfAge) add(comingOfAge, 'Coming of Age Day');
  add(new Date(year, 1, 11), 'National Foundation Day');
  add(new Date(year, 1, 23), 'Emperor’s Birthday');
  add(new Date(year, 3, 29), 'Showa Day');
  add(new Date(year, 4, 3), 'Constitution Memorial Day');
  add(new Date(year, 4, 4), 'Greenery Day');
  add(new Date(year, 4, 5), 'Children’s Day');
  const marineDay = nthWeekday(year, 6, 1, 3);
  if (marineDay) add(marineDay, 'Marine Day');
  add(new Date(year, 7, 11), 'Mountain Day');
  const respectAged = nthWeekday(year, 8, 1, 3);
  if (respectAged) add(respectAged, 'Respect for the Aged Day');
  add(new Date(year, 10, 3), 'Culture Day');
  add(new Date(year, 10, 23), 'Labor Thanksgiving Day');
  const sportsDay = nthWeekday(year, 9, 1, 2);
  if (sportsDay) add(sportsDay, 'Sports Day');

  const equinoxDates = {
    spring: new Date(year, 2, 20),
    autumn: new Date(year, 8, 23),
  };
  add(equinoxDates.spring, 'Vernal Equinox Day');
  add(equinoxDates.autumn, 'Autumnal Equinox Day');

  return holidays;
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
  const { mode, setThemeMode, activeTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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

  const holidayMap = useMemo(() => getJapaneseHolidays(currentYear), [currentYear]);
  const calendarWeeks = useMemo(() => buildMonthCalendar(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedKey = selectedCalendarDate ? formatDateKey(selectedCalendarDate) : formatDateKey(new Date());
  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-200" style={{ background: activeTheme.background }}>
      <div className="fixed inset-x-0 top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--surface-primary)]/90 backdrop-blur-xl" style={{ backgroundColor: `${activeTheme.surface}e6`, borderColor: activeTheme.border }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.48em]" style={{ color: activeTheme.accent }}>WorkPulse</p>
            <p className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Enterprise work orchestration</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setThemeMode(mode === 'dark' ? 'light' : 'dark')}
              className="rounded-full border px-4 py-2 shadow-sm transition"
              style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
            >
              {mode === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-full px-4 py-2 text-white shadow-glow transition"
              style={{ backgroundColor: activeTheme.accent, color: activeTheme.accentContrast }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="pt-[92px]">
        <aside className="fixed left-0 top-[92px] z-10 hidden h-[calc(100vh-92px)] w-full rounded-tr-[32px] rounded-br-[32px] border-r p-6 shadow-soft backdrop-blur-xl lg:block lg:w-[320px] lg:overflow-y-auto" style={{ borderColor: activeTheme.border, backgroundColor: `${activeTheme.surfaceAlt}f2`, boxShadow: activeTheme.shadow }}>
          <div className="flex h-full flex-col justify-between">
            <div className="space-y-6">
              <div>
                <p className="text-xs uppercase tracking-[0.4em]" style={{ color: activeTheme.textSecondary }}>Navigation</p>
                <div className="mt-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="block rounded-3xl px-4 py-3 text-sm font-medium transition"
                      style={{ color: activeTheme.textPrimary }}
                      onMouseEnter={(event) => { event.currentTarget.style.backgroundColor = activeTheme.surface; }}
                      onMouseLeave={(event) => { event.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="relative rounded-[32px] border p-4 shadow-sm" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadowSoft }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((current) => !current)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <div className="grid h-12 w-12 place-items-center rounded-2xl text-lg font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>
                    {user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || 'Guest User'}</p>
                    <p className="truncate text-xs" style={{ color: activeTheme.textSecondary }}>{user?.department || 'Department not set'}</p>
                  </div>
                  <span className="ml-auto" style={{ color: activeTheme.textSecondary }}>{userMenuOpen ? '▲' : '▼'}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 bottom-full mb-3 w-[260px] rounded-[28px] border p-4 shadow-soft backdrop-blur-xl" style={{ borderColor: activeTheme.border, backgroundColor: `${activeTheme.surface}f2`, boxShadow: activeTheme.shadow }}>
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Account</p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: activeTheme.textPrimary }}>Quick actions</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserMenuOpen(false)}
                        className="rounded-full border px-2 py-1 text-xs transition"
                        style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}
                      >
                        Close
                      </button>
                    </div>

                    <div className="space-y-2">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-3xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block rounded-3xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                      >
                        Settings
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          signOut();
                        }}
                        className="w-full rounded-3xl border px-4 py-3 text-sm font-semibold transition"
                        style={{ borderColor: '#fda4af', backgroundColor: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="min-h-[calc(100vh-72px)] overflow-y-auto px-6 py-8 lg:ml-[320px]" style={{ backgroundColor: activeTheme.background, color: activeTheme.textPrimary }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
