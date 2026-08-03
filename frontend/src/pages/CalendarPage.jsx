import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatDateKey } from '../components/workflow/constants.js';

const formatDateKeyLocal = (date) => formatDateKey(date);

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
  add(new Date(year, 2, 20), 'Vernal Equinox Day');
  add(new Date(year, 8, 23), 'Autumnal Equinox Day');
  return holidays;
};

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
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [savedPlanners, setSavedPlanners] = useState({});
  const [savedWorklogs, setSavedWorklogs] = useState({});

  useEffect(() => {
    const plannerStored = localStorage.getItem('plannerEntries');
    if (plannerStored) {
      setSavedPlanners(JSON.parse(plannerStored));
    }

    const worklogStored = localStorage.getItem('worklogEntries');
    if (worklogStored) {
      setSavedWorklogs(JSON.parse(worklogStored));
    }
  }, []);

  const holidays = useMemo(() => getJapaneseHolidays(currentYear), [currentYear]);
  const calendarWeeks = useMemo(() => buildMonthCalendar(currentYear, currentMonth), [currentYear, currentMonth]);
  const selectedKey = formatDateKey(selectedDate);
  const selectedHoliday = holidays[selectedKey] || (selectedDate.getDay() === 0 ? 'Sunday' : selectedDate.getDay() === 6 ? 'Saturday' : null);
  const savedEntry = savedPlanners[selectedKey];
  const savedWorklog = savedWorklogs[selectedKey];
  const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  useEffect(() => {
    setCurrentYear(selectedDate.getFullYear());
    setCurrentMonth(selectedDate.getMonth());
  }, [selectedDate]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">Calendar module</h1>
            <p className="mt-2 text-slate-500">Select a date and view saved worklog details or holiday status for that day.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {monthName}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="app-panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Japanese calendar</h2>
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-1">
              {calendarWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 gap-1">
                  {week.map((date, idx) => {
                    if (!date) return <div key={idx} className="h-10 rounded-2xl bg-white" />;
                    const key = formatDateKey(date);
                    const todayKey = formatDateKey(new Date());
                    const isToday = key === todayKey;
                    const holiday = holidays[key] || (date.getDay() === 0 ? 'Sunday' : date.getDay() === 6 ? 'Saturday' : null);
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
                        title={holiday || (isToday ? 'Today' : 'Workday')}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl bg-white p-4 text-sm text-slate-700 shadow-sm">
              <p className="font-semibold text-slate-900">Legend</p>
              <div className="mt-3 grid gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-blue-600" />
                  <span>Selected date</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
                  <span>Holiday</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full bg-amber-300" />
                  <span>Current date</span>
                </div>
              </div>
            </div>
          </div>

          <div className="app-panel">
            <h2 className="text-xl font-semibold text-slate-900">Day details</h2>
            <p className="mt-2 text-sm text-slate-500">Selected date: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</p>

            {selectedHoliday && !savedWorklog && !savedEntry && (
              <div className="mt-6 rounded-3xl bg-rose-50 p-4 text-sm text-rose-700">
                <p>This day is marked as a holiday: <strong>{selectedHoliday}</strong>.</p>
              </div>
            )}

            {!selectedHoliday && !savedWorklog && !savedEntry && (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p>No saved worklog for this date yet.</p>
                <Link to={`/planner?date=${selectedKey}`} className="app-action-btn mt-4">
                  Create worklog
                </Link>
              </div>
            )}

            {(savedWorklog || savedEntry) && (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 shadow-sm">
                  <p className="font-semibold text-slate-900">Saved worklog</p>
                  <p className="mt-2">Saved at: {savedWorklog?.updatedAt ? new Date(savedWorklog.updatedAt).toLocaleString() : savedEntry?.savedAt ? new Date(savedEntry.savedAt).toLocaleString() : 'Not available'}</p>
                  <p className="mt-2 text-sm text-slate-600">Status: {savedWorklog?.status || savedEntry?.status || 'Planned'}</p>
                </div>

                {savedWorklog?.details?.length > 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">Execution details</p>
                    <div className="mt-3 space-y-3">
                      {savedWorklog.details.map((detail, index) => (
                        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{detail.title || 'Untitled item'}</p>
                              <p className="text-sm text-slate-500">{detail.type || 'Item'}</p>
                            </div>
                            <span className="text-sm text-slate-500">{detail.actualMinutes || 0} min actual</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{detail.remarks || 'No notes'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                    <p className="font-semibold text-slate-900">Planned items</p>
                    <div className="mt-3 space-y-3">
                      {savedEntry?.tasks?.map((task, index) => (
                        <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">{task.title || 'Untitled task'}</p>
                              <p className="text-sm text-slate-500">{task.project || 'No project'}</p>
                            </div>
                            <span className="text-sm text-slate-500">{task.planned || 0} min</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600">{task.description || 'No description'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl bg-slate-50 p-4 shadow-sm">
                  <p className="font-semibold text-slate-900">Summary</p>
                  <p className="mt-2 text-sm text-slate-600">Planned minutes: {savedWorklog?.plannedMinutes || savedEntry?.tasks?.reduce((sum, task) => sum + Number(task.planned || 0), 0) || 0}</p>
                  <p className="mt-1 text-sm text-slate-600">Actual minutes: {savedWorklog?.actualMinutes || 0}</p>
                  <p className="mt-1 text-sm text-slate-600">Meeting time: {savedWorklog?.meetingTime || 'Not recorded'}</p>
                  <p className="mt-1 text-sm text-slate-600">Completion: {savedWorklog?.completionStatus || 'Not recorded'}</p>
                </div>

                <Link to={`/worklog?date=${selectedKey}`} className="app-action-btn">
                  Open worklog page
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
