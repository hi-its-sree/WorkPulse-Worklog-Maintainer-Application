import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, FileText, MessageSquareQuote, Pencil, Save, Send } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useLanguage, format } from '../contexts/LanguageContext.jsx';
import { DEFAULT_SESSION_STATUS, formatDateKey, getSessionStatusLabel, getSessionStatusTone, SESSION_STATUSES, WORKFLOW_STATUSES, getStatusLabel } from '../components/workflow/constants.js';
import { getJapaneseHolidays } from '../lib/holidays.js';
import WeeklyCalendar from '../components/workflow/WeeklyCalendar.jsx';
import { fetchPlan, fetchWorklog, saveWorklog } from '../lib/workflowStore.js';
import { formatProjectLabel } from '../lib/useProjects.js';

const emptyWorklog = {
  plannedMinutes: 0,
  actualMinutes: 0,
  remarks: '',
  status: WORKFLOW_STATUSES.DRAFT,
  meetingTime: '',
  completionStatus: DEFAULT_SESSION_STATUS,
  details: [],
};

// The day rolls up from its sessions: finished once every session is finished, not
// started while they are all still waiting.
const rollUpCompletion = (details = []) => {
  if (!details.length) return DEFAULT_SESSION_STATUS;
  if (details.every((detail) => detail.status === 'COMPLETED')) return 'COMPLETED';
  if (details.every((detail) => (detail.status || DEFAULT_SESSION_STATUS) === 'PENDING_TO_START')) return 'PENDING_TO_START';
  return 'ONGOING';
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

// `existingEntry` is null on days with no saved worklog yet, so it must be read
// defensively — a default parameter only covers undefined.
export const buildExecutionDetails = (plannerEntry, existingEntry, strings) => {
  const existingDetails = Array.isArray(existingEntry?.details) ? existingEntry.details : [];
  const detailMap = new Map(existingDetails.map((detail) => [detail.id, detail]));
  const types = strings.worklog.detailTypes;
  const details = [];

  (plannerEntry?.tasks || []).forEach((task, index) => {
    const id = `task-${index}`;
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      kind: 'TASK',
      type: types.task,
      title: task.title || format(strings.worklog.taskFallback, { index: index + 1 }),
      projectId: task.projectId || '',
      project: task.project || '',
      projectNumber: task.projectNumber || '',
      plannedMinutes: Number(task.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      status: existing.status || DEFAULT_SESSION_STATUS,
      remarks: existing.remarks || '',
    });
  });

  (plannerEntry?.meetings || []).forEach((meeting, index) => {
    const id = `meeting-${index}`;
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      kind: 'MEETING',
      type: types.meeting,
      title: meeting.title || format(strings.worklog.meetingFallback, { index: index + 1 }),
      plannedMinutes: calculateMeetingDuration(meeting),
      actualMinutes: Number(existing.actualMinutes || 0),
      status: existing.status || DEFAULT_SESSION_STATUS,
      remarks: existing.remarks || '',
    });
  });

  if (plannerEntry?.documentation) {
    const id = 'documentation';
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      kind: 'DOCUMENTATION',
      type: types.documentation,
      title: types.documentation,
      plannedMinutes: Number(plannerEntry.documentation.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      status: existing.status || DEFAULT_SESSION_STATUS,
      remarks: existing.remarks || plannerEntry.documentation.description || '',
    });
  }

  if (plannerEntry?.others) {
    const id = 'others';
    const existing = detailMap.get(id) || {};
    details.push({
      id,
      kind: 'OTHER',
      type: types.other,
      title: strings.worklog.othersTitle,
      plannedMinutes: Number(plannerEntry.others.planned || 0),
      actualMinutes: Number(existing.actualMinutes || 0),
      status: existing.status || DEFAULT_SESSION_STATUS,
      remarks: existing.remarks || plannerEntry.others.description || '',
    });
  }

  // Sessions recorded without a plan (or after the plan changed) must not disappear.
  existingDetails.forEach((detail) => {
    if (!details.some((row) => row.id === detail.id)) {
      details.push({ ...detail, status: detail.status || DEFAULT_SESSION_STATUS });
    }
  });

  return details;
};

const WorklogPage = () => {
  const { user } = useContext(AuthContext);
  const { strings, locale } = useLanguage();
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
  const holidays = useMemo(() => holidayYears.reduce((acc, year) => ({ ...acc, ...getJapaneseHolidays(year, strings) }), {}), [holidayYears, strings]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const dateValue = params.get('date');
    const parsed = dateValue ? new Date(dateValue) : today;
    if (!Number.isNaN(parsed.getTime())) {
      setSelectedDate(parsed);
    }
  }, [location.search, today]);

  useEffect(() => {
    let active = true;
    const dateKey = formatDateKey(selectedDate);

    const loadDay = async () => {
      let planner = null;
      let existing = null;
      try {
        [planner, existing] = await Promise.all([fetchPlan(dateKey), fetchWorklog(dateKey)]);
      } catch (loadError) {
        if (active) setError(strings.worklog.loadFailed);
      }
      if (!active) return;

      setPlannerEntry(planner);

      const plannedMinutes = (planner?.tasks || []).reduce((sum, task) => sum + Number(task.planned || 0), 0)
        + (planner?.meetings || []).reduce((sum, meeting) => sum + calculateMeetingDuration(meeting), 0)
        + Number(planner?.documentation?.planned || 0)
        + Number(planner?.others?.planned || 0);

      const details = buildExecutionDetails(planner, existing, strings);
      setWorklogEntry(existing
        ? { ...existing, plannedMinutes: plannedMinutes || Number(existing.plannedMinutes || 0), details }
        : { ...emptyWorklog, plannedMinutes, actualMinutes: 0, details });
      setIsEditing(false);
    };

    loadDay();
    return () => { active = false; };
  }, [selectedDate, strings]);

  const plannedMinutes = useMemo(() => Number(worklogEntry?.plannedMinutes || 0), [worklogEntry]);
  const actualMinutes = useMemo(() => {
    return (worklogEntry?.details || []).reduce((sum, detail) => sum + Number(detail.actualMinutes || 0), 0);
  }, [worklogEntry]);
  const actualDifference = actualMinutes - plannedMinutes;

  const handleDateSelect = (nextDate) => {
    setSelectedDate(nextDate);
    navigate({ search: `?date=${formatDateKey(nextDate)}` });
  };

  const shiftWeek = (offset) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    handleDateSelect(nextDate);
  };

  // Minutes are typed freely; only the digits are kept so the totals stay numeric.
  const updateDetail = (id, field, value) => {
    const nextValue = field === 'actualMinutes' ? String(value).replace(/[^0-9]/g, '') : value;
    setWorklogEntry((current) => ({
      ...current,
      details: (current?.details || []).map((detail) => (detail.id === id ? { ...detail, [field]: nextValue } : detail)),
    }));
  };

  const handleSave = async () => {
    if (!worklogEntry) return;
    const nextEntry = {
      ...worklogEntry,
      plannedMinutes,
      actualMinutes,
      status: WORKFLOW_STATUSES.DRAFT,
      completionStatus: rollUpCompletion(worklogEntry.details || []),
      updatedBy: user?.fullName || 'Employee',
      updatedAt: new Date().toISOString(),
    };

    try {
      const saved = await saveWorklog(formatDateKey(selectedDate), nextEntry);
      setWorklogEntry({ ...nextEntry, ...saved, details: nextEntry.details });
      setMessage(strings.worklog.saveSuccess);
      setError('');
      setIsEditing(false);
    } catch (saveError) {
      setMessage('');
      setError(strings.worklog.saveFailed);
    }
  };

  const dateLabel = selectedDate.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-[var(--accent)]">{strings.worklog.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">{strings.worklog.pageTitle}</h1>
            <p className="mt-2 text-[var(--text-secondary)]">{strings.worklog.pageDescription}</p>
          </div>
          <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
            {dateLabel}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-[0.34em] text-[var(--text-secondary)]">{strings.worklog.weeklyCalendar}</p>
            <p className="text-sm text-[var(--text-secondary)]">{strings.worklog.chooseAnyDay}</p>
          </div>
          <WeeklyCalendar weekDates={weekDates} selectedDate={selectedDate} onSelectDate={handleDateSelect} holidays={holidays} today={today} onShiftWeek={shiftWeek} />
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.worklog.plannedDay}</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{strings.worklog.plannedDayDescription}</p>
          </div>
          <button type="button" onClick={() => setIsEditing((current) => !current)} className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
            {isEditing ? <Save size={16} /> : <Pencil size={16} />}
            {isEditing ? strings.worklog.cancelEdit : strings.worklog.editExecution}
          </button>
        </div>

        {!plannerEntry && (
          <div className="mb-6 rounded-[24px] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-sm text-[var(--text-secondary)]">
            {strings.worklog.noPlanner}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.worklog.plannedVsActual}</p>
                  <h2 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">{strings.worklog.overview}</h2>
                </div>
                <div className={`rounded-full px-3 py-1 text-sm font-semibold ${actualDifference > 0 ? 'bg-rose-100 text-rose-700' : actualDifference < 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {actualDifference > 0 ? strings.worklog.extraTime : actualDifference < 0 ? strings.worklog.lessTime : strings.worklog.onTarget}
                </div>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><Clock3 size={16} /> {strings.worklog.planned}</div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{plannedMinutes} {strings.worklog.minutes}</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle2 size={16} /> {strings.worklog.actual}</div>
                  <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{actualMinutes} {strings.worklog.minutes}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><FileText size={16} /> {strings.worklog.plannedItems}</div>
              <div className="space-y-4">
                {(worklogEntry?.details || []).map((detail) => (
                  <div key={detail.id} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--text-primary)]">{detail.title}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                          {detail.project ? `${detail.type} · ${formatProjectLabel({ projectNumber: detail.projectNumber, name: detail.project })}` : detail.type}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getSessionStatusTone(detail.status || DEFAULT_SESSION_STATUS)}`}>
                          {getSessionStatusLabel(detail.status || DEFAULT_SESSION_STATUS, strings)}
                        </span>
                        <span className="rounded-full bg-[var(--surface-primary)] px-3 py-1 text-sm font-semibold text-[var(--text-secondary)]">
                          {format(strings.worklog.plannedMinutesBadge, { minutes: detail.plannedMinutes })}
                        </span>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <label className="block text-sm text-[var(--text-secondary)]">
                          <span>{strings.worklog.sessionStatus}</span>
                          <select value={detail.status || DEFAULT_SESSION_STATUS} onChange={(event) => updateDetail(detail.id, 'status', event.target.value)} className="app-input mt-2">
                            {SESSION_STATUSES.map((option) => (
                              <option key={option} value={option}>{getSessionStatusLabel(option, strings)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm text-[var(--text-secondary)]">
                          <span>{strings.worklog.actualMinutes}</span>
                          <input type="text" inputMode="numeric" value={detail.actualMinutes ?? ''} onChange={(event) => updateDetail(detail.id, 'actualMinutes', event.target.value)} className="app-input mt-2" />
                        </label>
                        <label className="block text-sm text-[var(--text-secondary)]">
                          <span>{strings.worklog.notes}</span>
                          <textarea value={detail.remarks || ''} onChange={(event) => updateDetail(detail.id, 'remarks', event.target.value)} className="app-input mt-2 h-24" />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">{strings.worklog.sessionStatus}</p>
                          <p className="mt-1">{getSessionStatusLabel(detail.status || DEFAULT_SESSION_STATUS, strings)}</p>
                        </div>
                        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">{strings.worklog.actualMinutes}</p>
                          <p className="mt-1">{detail.actualMinutes || 0} {strings.worklog.minutes}</p>
                        </div>
                        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)]">
                          <p className="font-semibold text-[var(--text-primary)]">{strings.worklog.notes}</p>
                          <p className="mt-1">{detail.remarks || strings.worklog.noNotesYet}</p>
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
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><MessageSquareQuote size={16} /> {strings.worklog.statusSummary}</div>
              <div className="mt-4 space-y-3">
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">{strings.worklog.currentState}</p>
                  <p className="mt-1">{getStatusLabel(worklogEntry?.status || WORKFLOW_STATUSES.IN_PROGRESS, strings)}</p>
                </div>
                <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 text-sm text-[var(--text-secondary)]">
                  <p className="font-semibold text-[var(--text-primary)]">{strings.worklog.difference}</p>
                  <p className={`mt-1 font-semibold ${actualDifference > 0 ? 'text-rose-700' : actualDifference < 0 ? 'text-emerald-700' : 'text-[var(--text-primary)]'}`}>{actualDifference > 0 ? `+${actualDifference} ${strings.worklog.minutes}` : `${actualDifference} ${strings.worklog.minutes}`}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]"><AlertTriangle size={16} /> {strings.worklog.review}</div>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{strings.worklog.reviewDescription}</p>
              <button type="button" onClick={handleSave} className="app-action-btn mt-4 w-full justify-center gap-2">
                <Send size={16} /> {strings.worklog.saveWorklog}
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
