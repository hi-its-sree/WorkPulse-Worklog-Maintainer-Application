import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { AlertCircle, CheckCircle2, Copy, Save, Sparkles, Trash2 } from 'lucide-react';
import WeeklyCalendar from '../components/workflow/WeeklyCalendar.jsx';
import TaskSection from '../components/workflow/TaskSection.jsx';
import MeetingSection from '../components/workflow/MeetingSection.jsx';
import { formatDateKey, isSameDate, WORKFLOW_STATUSES } from '../components/workflow/constants.js';
import { defaultAssemblyTask, defaultMeeting, defaultSection, defaultTask, normalizeMeetings, normalizeSection, normalizeTasks } from '../components/workflow/plannerState.js';
import { getJapaneseHolidays } from '../lib/holidays.js';
import { fetchPlan, savePlan } from '../lib/workflowStore.js';
import { formatProjectLabel } from '../lib/useProjects.js';

const formatDateKeyLocal = (date) => formatDateKey(date);


const parseTimeMinutes = (time) => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return 0;
  return hours * 60 + minutes;
};

const calculateMeetingDuration = (meeting) => {
  const from = parseTimeMinutes(meeting?.from);
  const to = parseTimeMinutes(meeting?.to);
  return to > from ? to - from : 0;
};

const PlannerPage = () => {
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();
  const { strings, locale } = useLanguage();
  const today = useMemo(() => new Date(), []);
  const dateFromQuery = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const dateValue = params.get('date');
    if (!dateValue) return today;
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? today : parsed;
  }, [location.search, today]);

  const [selectedDate, setSelectedDate] = useState(dateFromQuery);
  const [tasks, setTasks] = useState([defaultAssemblyTask, defaultTask]);
  const [meetings, setMeetings] = useState([defaultMeeting]);
  const [documentation, setDocumentation] = useState(defaultSection);
  const [others, setOthers] = useState(defaultSection);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  // Only user edits trigger the autosave, so simply browsing a date never writes an
  // empty plan for it to the database.
  const [dirty, setDirty] = useState(false);
  const previewRef = useRef(null);

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
  const holidays = useMemo(
    () => holidayYears.reduce((acc, year) => ({ ...acc, ...getJapaneseHolidays(year, strings) }), {}),
    [holidayYears, strings]
  );

  const selectedDateKey = formatDateKey(selectedDate);
  const formattedDate = selectedDate.toLocaleDateString(locale || 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const selectedHoliday = holidays[selectedDateKey] || (selectedDate.getDay() === 0 ? strings.calendar.sunday : selectedDate.getDay() === 6 ? strings.calendar.saturday : null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('date')) {
      setSelectedDate(dateFromQuery);
    }
  }, [dateFromQuery]);

  useEffect(() => {
    let active = true;

    const loadPlan = async () => {
      const entry = await fetchPlan(selectedDateKey);
      if (!active) return;

      if (entry && typeof entry === 'object') {
        setTasks(normalizeTasks(Array.isArray(entry.tasks) ? entry.tasks : []));
        setMeetings(normalizeMeetings(Array.isArray(entry.meetings) ? entry.meetings : []));
        setDocumentation(normalizeSection(entry.documentation));
        setOthers(normalizeSection(entry.others));
        setMessage(strings.planner.messages.savedWorklogLoaded);
      } else {
        setTasks([defaultAssemblyTask, defaultTask]);
        setMeetings([defaultMeeting]);
        setDocumentation(defaultSection);
        setOthers(defaultSection);
        setMessage(selectedHoliday ? strings.planner.messages.holidayNotice.replace('{holiday}', selectedHoliday) : strings.planner.messages.noSavedWorklog);
      }
      setIsEditing(false);
      setPreviewVisible(false);
      setDirty(false);
      setDraftSaved(true);
    };

    loadPlan();
    return () => { active = false; };
  }, [selectedDateKey, selectedHoliday]);

  useEffect(() => {
    if (previewVisible && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewVisible]);

  const markEdited = () => {
    setDraftSaved(false);
    setDirty(true);
  };

  // Minutes are typed freely; only the digits are kept so the totals stay numeric.
  const sanitizeMinutes = (field, value) => (field === 'planned' ? String(value).replace(/[^0-9]/g, '') : value);

  // Accepts either a single field or a patch of several (selecting a project sets
  // its id, name and number together).
  const updateTask = (index, field, value) => {
    const patch = typeof field === 'object' && field !== null ? field : { [field]: sanitizeMinutes(field, value) };
    setTasks((current) => current.map((task, i) => i === index ? { ...task, ...patch } : task));
    markEdited();
  };

  const updateMeeting = (index, field, value) => {
    setMeetings((current) => current.map((meeting, i) => i === index ? { ...meeting, [field]: value } : meeting));
    markEdited();
  };

  const updateDocumentation = (field, value) => {
    const nextValue = sanitizeMinutes(field, value);
    setDocumentation((current) => ({ ...current, [field]: nextValue }));
    markEdited();
  };

  const updateOthers = (field, value) => {
    const nextValue = sanitizeMinutes(field, value);
    setOthers((current) => ({ ...current, [field]: nextValue }));
    markEdited();
  };

  const addTask = () => { setTasks((current) => [...current, { ...defaultTask }]); markEdited(); };
  const addMeeting = () => { setMeetings((current) => [...current, { ...defaultMeeting }]); markEdited(); };
  const deleteTask = (index) => { setTasks((current) => current.filter((_, i) => i !== index)); markEdited(); };
  const duplicateTask = (index) => { setTasks((current) => [...current, { ...current[index], title: `${current[index].title || 'Task'} copy` }]); markEdited(); };
  const deleteMeeting = (index) => { setMeetings((current) => current.filter((_, i) => i !== index)); markEdited(); };
  const duplicateMeeting = (index) => { setMeetings((current) => [...current, { ...current[index], title: `${current[index].title || 'Meeting'} copy` }]); markEdited(); };

  const shiftWeek = (offset) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + offset * 7);
    setSelectedDate(nextDate);
  };

  const totalPlannedMinutes = useMemo(() => {
    const tasksMinutes = (Array.isArray(tasks) ? tasks : []).reduce((sum, task) => sum + (Number(task?.planned) || 0), 0);
    const meetingsMinutes = (Array.isArray(meetings) ? meetings : []).reduce((sum, meeting) => sum + calculateMeetingDuration(meeting), 0);
    const docsMinutes = Number(documentation?.planned) || 0;
    const otherMinutes = Number(others?.planned) || 0;
    return tasksMinutes + meetingsMinutes + docsMinutes + otherMinutes;
  }, [tasks, meetings, documentation, others]);

  const totalTimeLabel = `${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m`;
  const remainingMinutes = Math.max(0, 480 - totalPlannedMinutes);
  const remainingLabel = `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`;
  const formatTaskStatus = (status) => {
    const raw = status?.toUpperCase();
    if (raw === 'IN_PROGRESS') return strings.common.statuses.inProgress;
    if (raw === 'COMPLETED') return strings.common.statuses.completed;
    return strings.common.statuses.planned;
  };

  const formatMeetingType = (type) => {
    if (type === 'Call') return strings.planner.meetingTypes.call;
    if (type === 'Review') return strings.planner.meetingTypes.review;
    return strings.planner.meetingTypes.meeting;
  };
  const canSave = previewVisible && totalPlannedMinutes >= 480;

  // No section is mandatory: the daily schedule differs per person and per department.
  // Only the numbers are sanity-checked here; the 8-hour total is enforced on save.
  const validatePlanner = () => {
    const nextErrors = {};
    const plannedValues = [
      ...(Array.isArray(tasks) ? tasks : []).map((task) => task?.planned),
      documentation?.planned,
      others?.planned,
    ];
    if (plannedValues.some((planned) => Number(planned) < 0)) {
      nextErrors.minutes = strings.planner.validation.minutesCannotBeNegative;
    }
    if (totalPlannedMinutes > 1440) {
      nextErrors.hours = strings.planner.validation.exceeds24Hours;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPlanEntry = (status) => ({
    tasks,
    meetings,
    documentation,
    others,
    status,
    totalPlannedMinutes,
    savedAt: new Date().toISOString(),
  });

  const savePlanner = async () => {
    if (!validatePlanner()) {
      setMessage(strings.planner.validation.resolveBeforeSaving);
      return;
    }

    if (!previewVisible) {
      setMessage(strings.planner.validation.previewBeforeSaving);
      return;
    }

    if (totalPlannedMinutes < 480) {
      setMessage(strings.planner.validation.need8Hours);
      return;
    }

    try {
      await savePlan(selectedDateKey, buildPlanEntry(WORKFLOW_STATUSES.PLANNED));
      setDraftSaved(true);
      setDirty(false);
      setMessage(strings.planner.validation.savedSuccess);
    } catch (error) {
      setMessage(strings.planner.validation.saveFailed);
    }
  };

  const previewPlanner = () => {
    if (!validatePlanner()) {
      setMessage(strings.planner.validation.resolveBeforePreview);
      return;
    }
    setPreviewVisible(true);
    setMessage(strings.planner.validation.previewReady);
  };

  useEffect(() => {
    if (draftSaved || !dirty) return undefined;

    const timer = window.setTimeout(async () => {
      try {
        await savePlan(selectedDateKey, buildPlanEntry(WORKFLOW_STATUSES.DRAFT));
        setDraftSaved(true);
        setMessage(strings.planner.validation.autosaved);
      } catch (error) {
        setMessage(strings.planner.validation.autosaveFailed);
      }
    }, 900);

    return () => window.clearTimeout(timer);
  }, [tasks, meetings, documentation, others, draftSaved, dirty, selectedDateKey]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{strings.planner.pageTitle}</h2>
            <p className="mt-2 text-slate-500">{strings.planner.pageDescription}</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {formattedDate}
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.34em] text-slate-500">{strings.planner.weeklyCalendarLabel}</p>
          <p className="text-sm text-slate-500">{strings.planner.selectedWeek}</p>
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.34em] text-slate-500">{strings.planner.weeklyCalendarLabel}</p>
          <p className="text-xs text-slate-500">{strings.planner.tapADay}</p>
        </div>

        <WeeklyCalendar weekDates={weekDates} selectedDate={selectedDate} onSelectDate={(nextDate) => setSelectedDate(nextDate)} holidays={holidays} today={today} onShiftWeek={shiftWeek} />

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
            {strings.planner.selectedDate}
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
            {strings.planner.holidayWeekend}
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-300" />
            {strings.planner.currentDate}
          </div>
        </div>

        <div className="grid gap-6">
          <motion.div className="app-panel p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">{strings.planner.morningPlannerTitle}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{strings.planner.morningPlannerDescription}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={previewPlanner} type="button" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition">
                  <Sparkles size={16} /> {strings.planner.previewButton}
                </button>
                <button onClick={savePlanner} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
                  <Save size={16} /> {strings.planner.saveButton}
                </button>
              </div>
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="mb-4 rounded-[24px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {Object.values(errors).map((error) => <p key={error} className="flex items-center gap-2"><AlertCircle size={14} /> {error}</p>)}
              </div>
            )}

            <div className="space-y-6">
              <TaskSection tasks={tasks} onAddTask={addTask} onUpdateTask={updateTask} onDeleteTask={deleteTask} onDuplicateTask={duplicateTask} errors={errors.tasks ? { 0: errors.tasks } : {}} />
              <MeetingSection meetings={meetings} onAddMeeting={addMeeting} onUpdateMeeting={updateMeeting} onDeleteMeeting={deleteMeeting} onDuplicateMeeting={duplicateMeeting} errors={errors.meetings ? { 0: errors.meetings } : {}} />

              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-[var(--text-primary)]">{strings.planner.documentation}</h4>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.plannedMinutes}</span>
                    <input type="text" inputMode="numeric" value={documentation.planned} onChange={(e) => updateDocumentation('planned', e.target.value)} className="app-input mt-2" placeholder={strings.planner.placeholders.minutes} />
                  </label>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.description}</span>
                    <textarea value={documentation.description} onChange={(e) => updateDocumentation('description', e.target.value)} className="app-input mt-2 h-24" placeholder={strings.planner.placeholders.notesForDocumentation} />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-[var(--text-primary)]">{strings.planner.others}</h4>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.plannedMinutes}</span>
                    <input type="text" inputMode="numeric" value={others.planned} onChange={(e) => updateOthers('planned', e.target.value)} className="app-input mt-2" placeholder={strings.planner.placeholders.minutes} />
                  </label>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.description}</span>
                    <textarea value={others.description} onChange={(e) => updateOthers('description', e.target.value)} className="app-input mt-2 h-24" placeholder={strings.planner.placeholders.notesForOtherActivities} />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">{strings.planner.totalPlannedTime}</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totalTimeLabel}</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-sm">
                    <p className="font-semibold text-[var(--text-primary)]">{strings.planner.goal}</p>
                    <p className={canSave ? 'text-emerald-700' : 'text-amber-700'}>{canSave ? strings.planner.readyToSave : strings.planner.needMore.replace('{remaining}', remainingLabel)}</p>
                  </div>
                </div>
              </div>
            </div>
            {previewVisible && (
              <div ref={previewRef} className="mt-8 space-y-6 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)]">{strings.planner.previewTitle}</h4>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{strings.planner.previewDescription}</p>
                  </div>
                  <div className="grid gap-3 text-right">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{strings.planner.draft}</div>
                    <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <p className="font-semibold text-[var(--text-primary)]">{strings.planner.totalPlanned}</p>
                      <p>{totalTimeLabel}</p>
                      <p className={`mt-1 ${canSave ? 'text-emerald-700' : 'text-amber-700'}`}>{canSave ? strings.planner.eightHoursReached : strings.planner.needMore.replace('{remaining}', remainingLabel)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.planner.tasksPreview}</p>
                    <div className="mt-4 space-y-4">
                      {(Array.isArray(tasks) ? tasks : []).map((task, index) => (
                        <div key={`preview-task-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-[var(--text-primary)]">{task?.title || strings.planner.untitledTask}</p>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{task?.project ? formatProjectLabel({ projectNumber: task.projectNumber, name: task.project }) : strings.planner.noProjectSelected}</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{formatTaskStatus(task.status)}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="text-sm text-[var(--text-secondary)]">{strings.planner.plannedMinutes}: {task?.planned || '0'}</div>
                            <div className="text-sm text-[var(--text-secondary)]">{strings.planner.description}: {task?.description || strings.planner.noDescriptionAdded}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.planner.meetingsPreview}</p>
                    <div className="mt-4 space-y-4">
                      {(Array.isArray(meetings) ? meetings : []).map((meeting, index) => (
                        <div key={`preview-meeting-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-[var(--text-primary)]">{meeting?.title || strings.planner.untitledMeeting}</p>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{meeting?.from && meeting?.to ? `${meeting.from} - ${meeting.to}` : strings.planner.noTimeSelected}</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{formatMeetingType(meeting?.type)}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <p className="text-sm text-[var(--text-secondary)]">{strings.planner.durationLabel}: {calculateMeetingDuration(meeting)} {strings.planner.minutesLabel}</p>
                            <p className="text-sm text-[var(--text-secondary)]">{meeting?.description || strings.planner.noDescriptionAdded}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.planner.documentation} {strings.planner.previewTitle}</p>
                    <div className="mt-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{strings.planner.planned}: {documentation?.planned || '0'} {strings.planner.minutesLabel}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{documentation?.description || strings.planner.noDocumentationNotes}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.planner.others} {strings.planner.previewTitle}</p>
                    <div className="mt-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{strings.planner.planned}: {others?.planned || '0'} {strings.planner.minutesLabel}</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{others?.description || strings.planner.noOtherNotes}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button onClick={savePlanner} type="button" disabled={!canSave} className={`rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${canSave ? 'bg-[var(--accent)] hover:opacity-90' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    {strings.planner.saveButton}
                  </button>
                </div>
              </div>
            )}
            {message && <p className="mt-4 text-sm text-emerald-700">{message}</p>}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PlannerPage;
