import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatDateKey } from '../components/workflow/constants.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { getJapaneseHolidays } from '../lib/holidays.js';
import { fetchPlans, fetchWorklogs } from '../lib/workflowStore.js';
const formatDateKeyLocal = (date) => formatDateKey(date);


const buildMonthCalendar = (year, month) => {
  const start = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks = [];
  let week = Array(start.getDay()).fill(null);

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

const CalendarPage = () => {
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [savedPlanners, setSavedPlanners] = useState({});
  const [savedWorklogs, setSavedWorklogs] = useState({});

  // Plans and worklogs are read back from the database for the month on screen.
  useEffect(() => {
    let active = true;
    const dateFrom = formatDateKey(new Date(currentYear, currentMonth, 1));
    const dateTo = formatDateKey(new Date(currentYear, currentMonth + 1, 0));

    const loadMonth = async () => {
      const [plans, worklogs] = await Promise.all([fetchPlans(dateFrom, dateTo), fetchWorklogs(dateFrom, dateTo)]);
      if (!active) return;
      setSavedPlanners(plans);
      setSavedWorklogs(worklogs);
    };

    loadMonth();
    return () => { active = false; };
  }, [currentYear, currentMonth]);

  const holidays = useMemo(() => getJapaneseHolidays(currentYear, strings), [currentYear, strings]);
  const calendarWeeks = useMemo(() => buildMonthCalendar(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedKey = formatDateKey(selectedDate);
  const selectedHoliday = holidays[selectedKey] || (selectedDate.getDay() === 0 ? strings.calendar.sunday : selectedDate.getDay() === 6 ? strings.calendar.saturday : null);
  const savedEntry = savedPlanners[selectedKey];
  const savedWorklog = savedWorklogs[selectedKey];
  const monthName = selectedDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const formattedSelectedDate = selectedDate.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  useEffect(() => {
    setCurrentYear(selectedDate.getFullYear());
    setCurrentMonth(selectedDate.getMonth());
  }, [selectedDate]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.calendar.pageTitle}</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>{strings.calendar.pageDescription}</p>
          </div>
          <div className="rounded-3xl px-4 py-3 text-sm font-semibold shadow-sm" style={{ backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
            {monthName}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="app-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{strings.calendar.japaneseCalendar}</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(currentYear, currentMonth - 1, 1);
                    setCurrentYear(prev.getFullYear());
                    setCurrentMonth(prev.getMonth());
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(currentYear, currentMonth + 1, 1);
                    setCurrentYear(next.getFullYear());
                    setCurrentMonth(next.getMonth());
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:bg-slate-100"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs uppercase tracking-[0.24em] text-slate-500">
              {Array.from({ length: 7 }).map((_, dayIndex) => {
                const label = new Date(1970, 0, 4 + dayIndex).toLocaleDateString(locale, { weekday: 'short' });
                return (
                  <div key={dayIndex} className="py-2">
                    {label}
                  </div>
                );
              })}
            </div>

            <div className="mt-3 space-y-1">
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((date, idx) => {
                    if (!date) return <div key={idx} className="h-10 rounded-2xl bg-white" />;
                    const key = formatDateKey(date);
                    const todayKey = formatDateKey(new Date());
                    const isToday = key === todayKey;
                    const holiday = holidays[key] || (date.getDay() === 0 ? strings.calendar.sunday : date.getDay() === 6 ? strings.calendar.saturday : null);
                    const selected = key === selectedKey;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedDate(date)}
                        className={`flex h-10 items-center justify-center rounded-2xl text-sm font-semibold transition ${
                          selected
                            ? 'bg-blue-600 text-white'
                            : isToday
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : holiday
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-white text-slate-900 hover:bg-slate-100'
                        }`}
                        title={holiday || (isToday ? strings.calendar.today : strings.calendar.workday)}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">{strings.calendar.legend}</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-blue-600" />
                  <span>{strings.calendar.selectedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
                  <span>{strings.calendar.holiday}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-amber-300" />
                  <span>{strings.calendar.currentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="app-panel">
            <h2 className="text-xl font-semibold text-slate-900">{strings.calendar.dayDetails}</h2>
<p className="mt-2 text-sm text-slate-500">{strings.calendar.selectedDateLabel} {formattedSelectedDate}</p>

            {selectedHoliday && !savedWorklog && !savedEntry && (
              <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">
                <p>{strings.calendar.holidayMessage} <strong>{selectedHoliday}</strong>.</p>
              </div>
            )}

            {!selectedHoliday && !savedWorklog && !savedEntry && (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p>{strings.calendar.noSavedWorklog}</p>
                <Link to={`/planner?date=${selectedKey}`} className="app-action-btn mt-4">
                  {strings.calendar.createWorklog}
                </Link>
              </div>
            )}

            {(savedWorklog || savedEntry) && (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                  <p className="font-semibold text-slate-900">{strings.calendar.savedWorklog}</p>
                  <p className="mt-2">{strings.calendar.savedAt} {savedWorklog?.updatedAt ? new Date(savedWorklog.updatedAt).toLocaleString(locale) : savedEntry?.savedAt ? new Date(savedEntry.savedAt).toLocaleString(locale) : strings.calendar.notAvailable}</p>
                  <p className="mt-2 text-sm text-slate-600">{strings.calendar.status}: {savedWorklog?.status || savedEntry?.status || strings.calendar.planned}</p>
                </div>

                {savedWorklog?.details?.length > 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{strings.calendar.executionDetails}</p>
                    <div className="mt-3 space-y-3">
                      {savedWorklog.details.map((detail, index) => (
                        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{detail.title || strings.calendar.untitledItem}</p>
                              <p className="text-sm text-slate-500">{detail.type || strings.calendar.item}</p>
                            </div>
                            <span className="text-sm text-slate-500">{detail.actualMinutes || 0} min actual</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{detail.remarks || strings.calendar.noNotes}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">{strings.calendar.plannedItems}</p>
                    <div className="mt-3 space-y-3">
                      {savedEntry?.tasks?.map((task, index) => (
                        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{task.title || strings.calendar.untitledTask}</p>
                              <p className="text-sm text-slate-500">{task.project || strings.calendar.noProject}</p>
                            </div>
                            <span className="text-sm text-slate-500">{task.planned || 0} min</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{task.description || strings.calendar.noDescription}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">{strings.calendar.summary}</p>
                  <p className="mt-2 text-sm text-slate-600">{strings.calendar.plannedMinutes}: {savedWorklog?.plannedMinutes || savedEntry?.tasks?.reduce((sum, task) => sum + Number(task.planned || 0), 0) || 0}</p>
                  <p className="mt-1 text-sm text-slate-600">{strings.calendar.actualMinutes}: {savedWorklog?.actualMinutes || 0}</p>
                  <p className="mt-1 text-sm text-slate-600">{strings.calendar.meetingTime}: {savedWorklog?.meetingTime || strings.calendar.notRecorded}</p>
                  <p className="mt-1 text-sm text-slate-600">{strings.calendar.completion}: {savedWorklog?.completionStatus || strings.calendar.notRecorded}</p>
                </div>

                <Link to={`/worklog?date=${selectedKey}`} className="app-action-btn">
                  {strings.calendar.openWorklogPage}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
