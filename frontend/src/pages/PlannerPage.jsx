import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Copy, Save, Sparkles, Trash2 } from 'lucide-react';
import WeeklyCalendar from '../components/workflow/WeeklyCalendar.jsx';
import TaskSection from '../components/workflow/TaskSection.jsx';
import MeetingSection from '../components/workflow/MeetingSection.jsx';
import { formatDateKey, isSameDate, WORKFLOW_STATUSES } from '../components/workflow/constants.js';

const defaultAssemblyTask = { title: 'Morning assembly', project: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: true };
const defaultTask = { title: '', project: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: false };
const defaultMeeting = { title: '', from: '', to: '', description: '', type: 'Meeting' };
const defaultSection = { planned: '', description: '' };

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

const normalizeMeeting = (meeting = {}) => ({
  title: meeting.title || '',
  from: meeting.from || meeting.time || '',
  to: meeting.to || '',
  description: meeting.description || '',
  type: meeting.type || 'Meeting',
});

const normalizeTasks = (taskList = []) => {
  const normalized = taskList.map((task) => ({
    ...defaultTask,
    ...task,
    isMorningAssembly: task.isMorningAssembly || task.title === 'Morning assembly',
    title: task.title || '',
    planned: task.planned || '',
  }));

  const assemblyIndex = normalized.findIndex((task) => task.isMorningAssembly || task.title === 'Morning assembly');
  if (assemblyIndex === -1) {
    normalized.unshift(defaultAssemblyTask);
  } else if (assemblyIndex > 0) {
    const [assemblyTask] = normalized.splice(assemblyIndex, 1);
    normalized.unshift(assemblyTask);
  }

  const hasNonAssembly = normalized.some((task, index) => index > 0 && !task.isMorningAssembly);
  if (!hasNonAssembly) {
    normalized.push(defaultTask);
  }

  if (normalized[0].title !== 'Morning assembly') {
    normalized[0] = { ...defaultAssemblyTask, ...normalized[0], title: 'Morning assembly', isMorningAssembly: true };
  }

  return normalized;
};

const PlannerPage = () => {
  const [draftSaved, setDraftSaved] = useState(false);
  const [errors, setErrors] = useState({});
  const location = useLocation();
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
  const [savedPlanners, setSavedPlanners] = useState({});
  const [previewVisible, setPreviewVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
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
    () => holidayYears.reduce((acc, year) => ({ ...acc, ...getJapaneseHolidays(year) }), {}),
    [holidayYears]
  );

  const selectedDateKey = formatDateKey(selectedDate);
  const formattedDate = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const selectedHoliday = holidays[selectedDateKey] || (selectedDate.getDay() === 0 ? 'Sunday' : selectedDate.getDay() === 6 ? 'Saturday' : null);
  const savedEntry = savedPlanners[selectedDateKey];

  useEffect(() => {
    const stored = localStorage.getItem('plannerEntries');
    if (stored) {
      setSavedPlanners(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.has('date')) {
      setSelectedDate(dateFromQuery);
    }
  }, [dateFromQuery]);

  useEffect(() => {
    const entry = savedPlanners[selectedDateKey];
    if (entry) {
      setTasks(normalizeTasks(entry.tasks));
      setMeetings((entry.meetings || []).map(normalizeMeeting));
      setDocumentation(entry.documentation || defaultSection);
      setOthers(entry.others || defaultSection);
      setMessage('Saved worklog loaded for this date.');
      setIsEditing(false);
    } else {
      setTasks([defaultAssemblyTask, defaultTask]);
      setMeetings([defaultMeeting]);
      setDocumentation(defaultSection);
      setOthers(defaultSection);
      setMessage(selectedHoliday ? `This day is a holiday: ${selectedHoliday}` : 'No saved worklog found for this day. Click Create to add one.');
      setIsEditing(false);
    }
    setPreviewVisible(false);
  }, [selectedDateKey, selectedHoliday, savedPlanners]);

  useEffect(() => {
    if (previewVisible && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [previewVisible]);

  const updateTask = (index, field, value) => {
    setTasks((current) => current.map((task, i) => i === index ? { ...task, [field]: value } : task));
    setDraftSaved(false);
  };

  const updateMeeting = (index, field, value) => {
    setMeetings((current) => current.map((meeting, i) => i === index ? { ...meeting, [field]: value } : meeting));
    setDraftSaved(false);
  };

  const updateDocumentation = (field, value) => {
    setDocumentation((current) => ({ ...current, [field]: value }));
  };

  const updateOthers = (field, value) => {
    setOthers((current) => ({ ...current, [field]: value }));
  };

  const addTask = () => { setTasks((current) => [...current, { ...defaultTask }]); setDraftSaved(false); };
  const addMeeting = () => { setMeetings((current) => [...current, { ...defaultMeeting }]); setDraftSaved(false); };
  const deleteTask = (index) => { setTasks((current) => current.filter((_, i) => i !== index)); setDraftSaved(false); };
  const duplicateTask = (index) => { setTasks((current) => [...current, { ...current[index], title: `${current[index].title || 'Task'} copy` }]); setDraftSaved(false); };
  const deleteMeeting = (index) => { setMeetings((current) => current.filter((_, i) => i !== index)); setDraftSaved(false); };
  const duplicateMeeting = (index) => { setMeetings((current) => [...current, { ...current[index], title: `${current[index].title || 'Meeting'} copy` }]); setDraftSaved(false); };

  const totalPlannedMinutes = useMemo(() => {
    const tasksMinutes = tasks.reduce((sum, task) => sum + (Number(task.planned) || 0), 0);
    const meetingsMinutes = meetings.reduce((sum, meeting) => sum + calculateMeetingDuration(meeting), 0);
    const docsMinutes = Number(documentation.planned) || 0;
    const otherMinutes = Number(others.planned) || 0;
    return tasksMinutes + meetingsMinutes + docsMinutes + otherMinutes;
  }, [tasks, meetings, documentation, others]);

  const totalTimeLabel = `${Math.floor(totalPlannedMinutes / 60)}h ${totalPlannedMinutes % 60}m`;
  const remainingMinutes = Math.max(0, 480 - totalPlannedMinutes);
  const remainingLabel = `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m`;
  const canSave = previewVisible && totalPlannedMinutes >= 480;

  const validatePlanner = () => {
    const nextErrors = {};
    if (tasks.some((task, index) => !task.isMorningAssembly && (!task.title || !task.title.trim()) && index > 0)) {
      nextErrors.tasks = 'Each task needs a title.';
    }
    if (tasks.some((task) => Number(task.planned) < 0)) {
      nextErrors.minutes = 'Planned minutes cannot be negative.';
    }
    if (totalPlannedMinutes > 1440) {
      nextErrors.hours = 'Daily plan exceeds 24 hours.';
    }
    if (meetings.some((meeting) => !meeting.title?.trim())) {
      nextErrors.meetings = 'Meeting titles cannot be empty.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const savePlanner = () => {
    if (!validatePlanner()) {
      setMessage('Please resolve the planner validation issues before saving.');
      return;
    }

    if (!previewVisible) {
      setMessage('Please preview your planner before saving.');
      return;
    }

    if (totalPlannedMinutes < 480) {
      setMessage('You need at least 8 hours of planned time before saving.');
      return;
    }

    const plannerEntry = { tasks, meetings, documentation, others, savedAt: new Date().toISOString(), status: WORKFLOW_STATUSES.PLANNED };
    const updated = { ...savedPlanners, [selectedDateKey]: plannerEntry };
    localStorage.setItem('plannerEntries', JSON.stringify(updated));
    setSavedPlanners(updated);
    setDraftSaved(true);
    setMessage('Planning saved successfully. You can edit it again by selecting the date.');
  };

  const previewPlanner = () => {
    if (!validatePlanner()) {
      setMessage('Please resolve the planner validation issues before previewing.');
      return;
    }
    setPreviewVisible(true);
    setMessage('Preview ready. Review the schedule below, then click Save planning to persist it.');
  };

  useEffect(() => {
    if (!draftSaved) {
      const timer = window.setTimeout(() => {
        const plannerEntry = { tasks, meetings, documentation, others, savedAt: new Date().toISOString(), status: WORKFLOW_STATUSES.PLANNED };
        const updated = { ...savedPlanners, [selectedDateKey]: plannerEntry };
        localStorage.setItem('plannerEntries', JSON.stringify(updated));
        setSavedPlanners(updated);
        setDraftSaved(true);
        setMessage('Draft autosaved.');
      }, 900);
      return () => window.clearTimeout(timer);
    }
  }, [tasks, meetings, documentation, others, draftSaved, selectedDateKey]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Daily work planner</h2>
            <p className="mt-2 text-slate-500">Select a date, fill morning tasks and meetings, then save your plan.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            {formattedDate}
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Weekly calendar</p>
          <p className="text-sm text-slate-500">Selected week</p>
        </div>

        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Weekly calendar</p>
          <p className="text-xs text-slate-500">Tap a day to update</p>
        </div>

        <WeeklyCalendar weekDates={weekDates} selectedDate={selectedDate} onSelectDate={(nextDate) => { setSelectedDate(nextDate); setDraftSaved(false); }} holidays={holidays} today={today} />

        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--accent)]" />
            Selected date
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-500" />
            Holiday / weekend
          </div>
          <div className="flex items-center gap-2 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm text-[var(--text-secondary)] shadow-sm">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-300" />
            Current date
          </div>
        </div>

        <div className="grid gap-6">
          <motion.div className="app-panel p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)]">Morning planner</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">Enter your morning tasks and meetings, then preview and save your schedule.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={previewPlanner} type="button" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition">
                  <Sparkles size={16} /> Preview
                </button>
                <button onClick={savePlanner} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-5 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
                  <Save size={16} /> Save plan
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
                  <h4 className="text-lg font-semibold text-[var(--text-primary)]">Documentation</h4>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>Planned minutes</span>
                    <input type="number" min="0" max="480" value={documentation.planned} onChange={(e) => updateDocumentation('planned', e.target.value)} className="app-input mt-2" placeholder="Minutes" />
                  </label>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>Description</span>
                    <textarea value={documentation.description} onChange={(e) => updateDocumentation('description', e.target.value)} className="app-input mt-2 h-24" placeholder="Notes for documentation work" />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <h4 className="text-lg font-semibold text-[var(--text-primary)]">Others</h4>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>Planned minutes</span>
                    <input type="number" min="0" max="480" value={others.planned} onChange={(e) => updateOthers('planned', e.target.value)} className="app-input mt-2" placeholder="Minutes" />
                  </label>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>Description</span>
                    <textarea value={others.description} onChange={(e) => updateOthers('description', e.target.value)} className="app-input mt-2 h-24" placeholder="Notes for other activities" />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-6 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">Total planned time</p>
                    <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">{totalTimeLabel}</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-secondary)] shadow-sm">
                    <p className="font-semibold text-[var(--text-primary)]">Goal: 8h</p>
                    <p className={canSave ? 'text-emerald-700' : 'text-amber-700'}>{canSave ? 'Ready to save' : `Need ${remainingLabel} more`}</p>
                  </div>
                </div>
              </div>
            </div>
            {previewVisible && (
              <div ref={previewRef} className="mt-8 space-y-6 rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-[var(--text-primary)]">Preview</h4>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">Review your task and meeting details before saving.</p>
                  </div>
                  <div className="grid gap-3 text-right">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">Draft</div>
                    <div className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                      <p className="font-semibold text-[var(--text-primary)]">Total planned</p>
                      <p>{totalTimeLabel}</p>
                      <p className={`mt-1 ${canSave ? 'text-emerald-700' : 'text-amber-700'}`}>{canSave ? '8h reached' : `Need ${remainingLabel} more to save`}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Tasks preview</p>
                    <div className="mt-4 space-y-4">
                      {tasks.map((task, index) => (
                        <div key={`preview-task-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-[var(--text-primary)]">{task.title || 'Untitled task'}</p>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{task.project || 'No project selected'}</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{task.status.replace('_', ' ')}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <div className="text-sm text-[var(--text-secondary)]">Planned: {task.planned || '0'} minutes</div>
                            <div className="text-sm text-[var(--text-secondary)]">Description: {task.description || 'No description added.'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Meetings preview</p>
                    <div className="mt-4 space-y-4">
                      {meetings.map((meeting, index) => (
                        <div key={`preview-meeting-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-base font-semibold text-[var(--text-primary)]">{meeting.title || 'Untitled meeting'}</p>
                              <p className="mt-1 text-sm text-[var(--text-secondary)]">{meeting.from && meeting.to ? `${meeting.from} - ${meeting.to}` : 'No time selected'}</p>
                            </div>
                            <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">{meeting.type}</span>
                          </div>
                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <p className="text-sm text-[var(--text-secondary)]">Duration: {calculateMeetingDuration(meeting)} minutes</p>
                            <p className="text-sm text-[var(--text-secondary)]">{meeting.description || 'No description added.'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Documentation preview</p>
                    <div className="mt-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Planned: {documentation.planned || '0'} minutes</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{documentation.description || 'No documentation notes provided.'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Others preview</p>
                    <div className="mt-4 rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Planned: {others.planned || '0'} minutes</p>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">{others.description || 'No other notes provided.'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button onClick={savePlanner} type="button" disabled={!canSave} className={`rounded-full px-5 py-3 text-sm font-semibold text-white shadow-sm transition ${canSave ? 'bg-[var(--accent)] hover:opacity-90' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                    Save planning
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
