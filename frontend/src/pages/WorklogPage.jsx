import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, FileText, MessageSquareQuote, Pencil, Save, Send } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { formatDateKey, WORKFLOW_STATUSES } from '../components/workflow/constants.js';
import WeeklyCalendar from '../components/workflow/WeeklyCalendar.jsx';

const emptyWorklog = {
  plannedMinutes: 0,
  actualMinutes: 0,
  remarks: '',
  status: WORKFLOW_STATUSES.IN_PROGRESS,
  meetingTime: '',
  completionStatus: 'ON_TRACK',
  details: [],
};

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
  add(new Date(year, 3, 29), 'Shōwa Day');
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

const parseTimeMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const calculateMeetingDuration = (meeting) => {
  const from = parseTimeMinutes(meeting.from);
  const to = parseTimeMinutes(meeting.to);
  return to > from ? to - from : 0;
};

const buildExecutionDetails = (plannerEntry, existingEntry = {}) => {
  const existingDetails = existingEntry.details || [];
  const detailMap = new Map(existingDetails.map((detail) => [detail.id, detail]));
  const details = [];

  (plannerEntry?.tasks || []).forEach((task, index) => {
    const id = `task-${index}`;
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      type: 'Task',
      title: task.title || `Task ${index + 1}`,
      plannedMinutes: Number(task.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      remarks: existing.remarks || '',
    });
  });

  (plannerEntry?.meetings || []).forEach((meeting, index) => {
    const id = `meeting-${index}`;
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      type: 'Meeting',
      title: meeting.title || `Meeting ${index + 1}`,
      plannedMinutes: calculateMeetingDuration(meeting),
      actualMinutes: Number(existing.actualMinutes || 0),
      remarks: existing.remarks || '',
    });
  });

  if (plannerEntry?.documentation) {
    const id = 'documentation';
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      type: 'Documentation',
      title: 'Documentation',
      plannedMinutes: Number(plannerEntry.documentation.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      remarks: existing.remarks || plannerEntry.documentation.description || '',
    });
  }

  if (plannerEntry?.others) {
    const id = 'others';
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      type: 'Other',
      title: 'Others',
      plannedMinutes: Number(plannerEntry.others.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      remarks: existing.remarks || plannerEntry.others.description || '',
    });
  }

  return details;
};

const WorklogPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [plannerEntry, setPlannerEntry] = useState(null);
  const [worklogEntry, setWorklogEntry] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - selectedDate.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [selectedDate]);

  const holidayYears = useMemo(() => Array.from(new Set(weekDates.map((date) => date.getFullYear()))), [weekDates]);
  const holidays = useMemo(() => holidayYears.reduce((acc, year) => ({ ...acc, ...getJapaneseHolidays(year) }), {}), [holidayYears]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateValue = params.get('date');
    const parsed = dateValue ? new Date(dateValue) : today;
    if (!Number.isNaN(parsed.getTime())) {
      setSelectedDate(parsed);
    }
  }, [location.search, today]);

  useEffect(() => {
    const stored = localStorage.getItem('plannerEntries');
    const entries = stored ? JSON.parse(stored) : {};
    const dateKey = formatDateKey(selectedDate);
    const planner = entries[dateKey] || null;
    setPlannerEntry(planner);

    const worklogs = localStorage.getItem('worklogEntries');
    const worklogMap = worklogs ? JSON.parse(worklogs) : {};
    const existing = worklogMap[dateKey];

    const plannedMinutes = (planner?.tasks || []).reduce((sum, task) => sum + Number(task.planned || 0), 0)
      + (planner?.meetings || []).reduce((sum, meeting) => sum + calculateMeetingDuration(meeting), 0)
      + Number(planner?.documentation?.planned || 0)
      + Number(planner?.others?.planned || 0);

    const details = buildExecutionDetails(planner, existing);
    setWorklogEntry(existing ? { ...existing, plannedMinutes: existing.plannedMinutes ?? plannedMinutes, actualMinutes: existing.actualMinutes ?? details.reduce((sum, detail) => sum + Number(detail.actualMinutes || 0), 0), details } : { ...emptyWorklog, plannedMinutes, actualMinutes: 0, details });
    setIsEditing(false);
  }, [selectedDate]);

  const plannedMinutes = useMemo(() => Number(worklogEntry?.plannedMinutes || 0), [worklogEntry]);
  const actualMinutes = useMemo(() => {
    return (worklogEntry?.details || []).reduce((sum, detail) => sum + Number(detail.actualMinutes || 0), 0);
  }, [worklogEntry]);
  const actualDifference = actualMinutes - plannedMinutes;

  const handleDateSelect = (nextDate) => {
    setSelectedDate(nextDate);
    navigate({ search: `?date=${formatDateKey(nextDate)}` });
  };

  const updateDetail = (id, field, value) => {
    setWorklogEntry((current) => ({
      ...current,
      details: (current?.details || []).map((detail) => (detail.id === id ? { ...detail, [field]: field === 'actualMinutes' ? Number(value) : value } : detail)),
    }));
  };

  const handleSave = () => {
    if (!worklogEntry) return;
    const nextEntry = {
      ...worklogEntry,
      plannedMinutes,
      actualMinutes,
      status: WORKFLOW_STATUSES.IN_PROGRESS,
      updatedBy: user?.fullName || 'Employee',
      updatedAt: new Date().toISOString(),
    };
    const entries = JSON.parse(localStorage.getItem('worklogEntries') || '{}');
    entries[formatDateKey(selectedDate)] = nextEntry;
    localStorage.setItem('worklogEntries', JSON.stringify(entries));
    window.dispatchEvent(new Event('worklog-updated'));
    setWorklogEntry(nextEntry);
    setMessage('Worklog saved successfully.');
    setError('');
    setIsEditing(false);
  };

  const dateLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--accent)]">Daily execution</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">Worklog execution</h1>
            <p className="mt-2 text-[var(--text-secondary)]">Use the calendar to open a planned day, review the planned items, and update the actual execution details when you are ready.</p>
          </div>
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
            {dateLabel}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--text-secondary)]">Weekly calendar</p>
            <p className="text-sm text-[var(--text-secondary)]">Choose any day to edit that worklog</p>
          </div>
          <WeeklyCalendar weekDates={weekDates} selectedDate={selectedDate} onSelectDate={handleDateSelect} holidays={holidays} today={today} />
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Planned day</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">The planner data for this date is shown below. Edit mode unlocks the actual-time fields.</p>
          </div>
          <button type="button" onClick={() => setIsEditing((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
            {isEditing ? <Save size={16} /> : <Pencil size={16} />}
            {isEditing ? 'Cancel edit' : 'Edit execution'}
          </button>
        </div>

        {!plannerEntry && (
          <div className="mb-6 rounded-[24px] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
            No planner exists for this date yet, but you can still record the actual execution details and save them here.
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Planned vs actual</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Daily execution overview</h2>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${actualDifference > 0 ? 'bg-rose-100 text-rose-700' : actualDifference < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {actualDifference > 0 ? 'Extra time' : actualDifference < 0 ? 'Less time' : 'On target'}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Clock3 size={16} /> Planned</div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{plannedMinutes} min</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} /> Actual</div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{actualMinutes} min</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><FileText size={16} /> Planned items and actual effort</div>
              <div className="space-y-4">
                {(worklogEntry?.details || []).map((detail) => (
                  <div key={detail.id} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--text-primary)]">{detail.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">{detail.type}</p>
                      </div>
                      <div className="rounded-full bg-[var(--surface-primary)] px-3 py-1 text-sm font-semibold text-[var(--text-secondary)]">
                        Planned {detail.plannedMinutes} min
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
                        <label className="block text-sm text-[var(--text-secondary)]">
                          <span>Actual minutes spent</span>
                          <input type="number" min="0" max="1440" value={detail.actualMinutes || 0} onChange={(event) => updateDetail(detail.id, 'actualMinutes', event.target.value)} className="app-input mt-2" />
                        </label>
                        <label className="block text-sm text-[var(--text-secondary)]">
                          <span>Notes</span>
                          <textarea value={detail.remarks || ''} onChange={(event) => updateDetail(detail.id, 'remarks', event.target.value)} className="app-input mt-2 h-24" />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">Actual minutes</p>
                          <p className="mt-1">{detail.actualMinutes || 0} min</p>
                        </div>
                        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">Notes</p>
                          <p className="mt-1">{detail.remarks || 'No notes yet.'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><MessageSquareQuote size={16} /> Status summary</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Current state</p>
                  <p className="mt-1">{worklogEntry?.status || WORKFLOW_STATUSES.IN_PROGRESS}</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">Difference</p>
                  <p className={`mt-1 font-semibold ${actualDifference > 0 ? 'text-rose-700' : actualDifference < 0 ? 'text-emerald-700' : 'text-[var(--text-primary)]'}`}>{actualDifference > 0 ? `+${actualDifference} min` : `${actualDifference} min`}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><AlertTriangle size={16} /> Review</div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">The plan stays intact, and only the actual execution details are updated when you choose to edit.</p>
              <button type="button" onClick={handleSave} className="app-action-btn mt-4 w-full justify-center gap-2">
                <Send size={16} /> Save worklog
              </button>
            </div>
          </div>
        </div>

        {message && <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
      </div>
    </div>
  );
};

export default WorklogPage;
