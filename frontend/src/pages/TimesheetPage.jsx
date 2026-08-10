import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, Clock3, Filter, FolderKanban, Sparkles, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage, format } from '../contexts/LanguageContext.jsx';
import TimeSummaryCard from '../components/workflow/TimeSummaryCard.jsx';
import TaskTimeCard from '../components/workflow/TaskTimeCard.jsx';
import OvertimeCard from '../components/workflow/OvertimeCard.jsx';
import WorklogTable from '../components/workflow/WorklogTable.jsx';
import ProjectTimeChart from '../components/workflow/ProjectTimeChart.jsx';
import { formatDateKey } from '../components/workflow/constants.js';
import { fetchPlans, fetchWorklogs, WORKLOG_UPDATED_EVENT } from '../lib/workflowStore.js';
import { groupRecordsByTask, MATCH_MODES, normalizeTaskKey, projectKeyOf, projectLabelOf } from './timesheetGrouping.js';

const WEEKLY_TARGET_HOURS = 40;
const DAILY_TARGET_HOURS = 8;

const formatHours = (hours) => `${hours.toFixed(1)}h`;
const formatDateLabel = (value, locale) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
};

const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getWeekRange = (date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
};

const getMonthRange = (date) => ({ start: new Date(date.getFullYear(), date.getMonth(), 1), end: new Date(date.getFullYear(), date.getMonth() + 1, 0) });

const normalizeStatus = (status, strings) => {
  const label = String(status || 'IN_PROGRESS').toUpperCase();
  const statuses = strings.common.statuses;
  const map = {
    IN_PROGRESS: statuses.inProgress,
    PLANNED: statuses.planned,
    SUBMITTED: statuses.submitted,
    APPROVED: statuses.approved,
    REJECTED: statuses.rejected,
    COMPLETED: statuses.completed,
    DONE: statuses.completed,
    ON_TRACK: statuses.onTrack,
    PENDING_TO_START: strings.worklog.sessionStatuses.pendingToStart,
    ONGOING: strings.worklog.sessionStatuses.ongoing,
  };
  return map[label] || label.replace(/_/g, ' ');
};

const buildWorklogRecords = (worklogMap = {}, plannerMap = {}, strings, locale) => {
  const labels = strings.timesheet.records;
  return Object.entries(worklogMap)
    .flatMap(([dateKey, entry]) => {
      if (!entry) return [];
      const plannerEntry = plannerMap[dateKey] || null;
      const plannerTasks = Array.isArray(plannerEntry?.tasks) ? plannerEntry.tasks : [];
      const taskLookup = new Map(plannerTasks.map((task, index) => [task.title || format(labels.taskFallback, { index: index + 1 }), task]));
      const details = Array.isArray(entry.details) ? entry.details : [];

      if (details.length === 0) {
        const actualMinutes = Number(entry.actualMinutes || 0);
        if (actualMinutes <= 0) return [];
        return [{
          dateKey,
          dateLabel: formatDateLabel(dateKey, locale),
          task: labels.dailyWorklog,
          projectId: '',
          projectNumber: '',
          project: labels.generalProject,
          description: entry.remarks || labels.dailyWorklogEntry,
          loggedHours: actualMinutes / 60,
          status: normalizeStatus(entry.completionStatus || entry.status || 'IN_PROGRESS', strings),
          category: labels.categoryDaily,
          completed: false,
        }];
      }

      return details.flatMap((detail, index) => {
        const actualMinutes = Number(detail.actualMinutes || 0);
        if (actualMinutes <= 0) return [];
        const taskMeta = taskLookup.get(detail.title) || plannerTasks[index] || {};
        // The session records its own project; the plan is only a fallback for
        // sessions saved before the project picker existed.
        const projectId = detail.projectId || taskMeta.projectId || '';
        const projectName = detail.project || taskMeta.project || labels.generalProject;
        return [{
          dateKey,
          dateLabel: formatDateLabel(dateKey, locale),
          task: detail.title || format(labels.taskFallback, { index: index + 1 }),
          projectId,
          projectNumber: detail.projectNumber || taskMeta.projectNumber || '',
          project: projectName,
          description: detail.remarks || '',
          loggedHours: actualMinutes / 60,
          status: normalizeStatus(detail.status || entry.completionStatus || entry.status || 'IN_PROGRESS', strings),
          category: detail.type || labels.categoryTask,
          completed: ['approved', 'completed', 'done', 'submitted'].includes(String(detail.status || entry.completionStatus || entry.status || '').toLowerCase()),
        }];
      });
    })
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
};

const TimesheetPage = () => {
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [worklogRecords, setWorklogRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  // A task worked over several days reads as one line by default, and rewordings
  // of the same task are merged unless the strictness is turned up.
  const [grouping, setGrouping] = useState('task');
  const [matchMode, setMatchMode] = useState('similar');

  // Records carry translated labels, so they are rebuilt when the language changes.
  const loadWorklogData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedWorklogs, storedPlanners] = await Promise.all([fetchWorklogs(), fetchPlans()]);
      const records = buildWorklogRecords(storedWorklogs, storedPlanners, strings, locale);
      setWorklogRecords(records);
    } catch {
      setWorklogRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [strings, locale]);

  useEffect(() => {
    loadWorklogData();

    const handleRefresh = () => loadWorklogData();
    window.addEventListener(WORKLOG_UPDATED_EVENT, handleRefresh);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      window.removeEventListener(WORKLOG_UPDATED_EVENT, handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, [loadWorklogData]);

  const selectedKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const selectedWeek = useMemo(() => getWeekRange(selectedDate), [selectedDate]);
  const selectedMonth = useMemo(() => getMonthRange(selectedDate), [selectedDate]);

  const dailyRows = useMemo(() => worklogRecords.filter((row) => row.dateKey === selectedKey), [selectedKey, worklogRecords]);
  const weeklyRows = useMemo(() => worklogRecords.filter((row) => {
    const rowDate = parseDateKey(row.dateKey);
    return rowDate >= selectedWeek.start && rowDate <= selectedWeek.end;
  }), [selectedWeek.end, selectedWeek.start, worklogRecords]);
  const monthlyRows = useMemo(() => worklogRecords.filter((row) => {
    const rowDate = parseDateKey(row.dateKey);
    return rowDate >= selectedMonth.start && rowDate <= selectedMonth.end;
  }), [selectedMonth.end, selectedMonth.start, worklogRecords]);

  const totalHours = useMemo(() => worklogRecords.reduce((sum, row) => sum + row.loggedHours, 0), [worklogRecords]);
  const dailyHours = useMemo(() => dailyRows.reduce((sum, row) => sum + row.loggedHours, 0), [dailyRows]);
  const weeklyHours = useMemo(() => weeklyRows.reduce((sum, row) => sum + row.loggedHours, 0), [weeklyRows]);
  const monthlyHours = useMemo(() => monthlyRows.reduce((sum, row) => sum + row.loggedHours, 0), [monthlyRows]);
  const regularHours = Math.min(weeklyHours, WEEKLY_TARGET_HOURS);
  const overtimeHours = Math.max(0, weeklyHours - WEEKLY_TARGET_HOURS);
  const remainingHours = Math.max(0, WEEKLY_TARGET_HOURS - weeklyHours);
  const completedCount = useMemo(() => worklogRecords.filter((row) => row.completed).length, [worklogRecords]);

  const filteredRows = useMemo(() => {
    const normalizedStart = dateRangeStart ? new Date(`${dateRangeStart}T00:00:00`) : null;
    const normalizedEnd = dateRangeEnd ? new Date(`${dateRangeEnd}T23:59:59`) : null;

    return worklogRecords.filter((row) => {
      const rowDate = parseDateKey(row.dateKey);
      const matchesRange = (!normalizedStart || rowDate >= normalizedStart) && (!normalizedEnd || rowDate <= normalizedEnd);
      const matchesProject = projectFilter === 'all' || projectKeyOf(row) === projectFilter;
      const matchesTask = taskFilter === 'all' || normalizeTaskKey(row.task) === normalizeTaskKey(taskFilter);
      const matchesStatus = statusFilter === 'all' || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesRange && matchesProject && matchesTask && matchesStatus;
    });
  }, [dateRangeEnd, dateRangeStart, projectFilter, statusFilter, taskFilter, worklogRecords]);

  const groupedRows = useMemo(() => groupRecordsByTask(filteredRows, { matchMode }), [filteredRows, matchMode]);

  // Keyed by project so two projects that share a name stay distinct.
  const projectOptions = useMemo(() => {
    const byKey = new Map();
    worklogRecords.forEach((row) => {
      const key = projectKeyOf(row);
      if (!byKey.has(key)) byKey.set(key, projectLabelOf(row));
    });
    return [{ value: 'all', label: strings.timesheet.allProjects }, ...Array.from(byKey, ([value, label]) => ({ value, label }))];
  }, [worklogRecords, strings]);
  // One entry per task, even when the title was typed with different casing or spacing.
  const taskOptions = useMemo(() => {
    const byKey = new Map();
    worklogRecords.forEach((row) => {
      const key = normalizeTaskKey(row.task);
      if (key && !byKey.has(key)) byKey.set(key, row.task);
    });
    return ['all', ...byKey.values()];
  }, [worklogRecords]);
  const statusOptions = useMemo(() => ['all', ...Array.from(new Set(worklogRecords.map((row) => row.status)))], [worklogRecords]);

  const taskBreakdown = useMemo(() => groupRecordsByTask(worklogRecords, { matchMode })
    .slice(0, 6)
    .map((group) => ({
      task: group.task,
      project: group.projectLabel,
      hours: group.loggedHours,
      status: group.status,
      category: group.category,
      dayCount: group.dayCount,
    })), [worklogRecords]);

  const projectBreakdown = useMemo(() => {
    const aggregates = worklogRecords.reduce((acc, row) => {
      const key = projectKeyOf(row);
      if (!acc[key]) acc[key] = { name: projectLabelOf(row), hours: 0 };
      acc[key].hours += row.loggedHours;
      return acc;
    }, {});

    return Object.values(aggregates).sort((left, right) => right.hours - left.hours).slice(0, 6);
  }, [worklogRecords]);

  const categoryBreakdown = useMemo(() => {
    const aggregates = worklogRecords.reduce((acc, row) => {
      if (!acc[row.category]) acc[row.category] = { name: row.category, hours: 0 };
      acc[row.category].hours += row.loggedHours;
      return acc;
    }, {});

    return Object.values(aggregates).sort((left, right) => right.hours - left.hours);
  }, [worklogRecords]);

  const weeklyTrend = useMemo(() => {
    const buckets = [];
    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date(selectedDate);
      day.setDate(day.getDate() - index);
      const key = formatDateKey(day);
      const value = worklogRecords.filter((row) => row.dateKey === key).reduce((sum, row) => sum + row.loggedHours, 0);
      buckets.push({ label: day.toLocaleDateString(locale, { weekday: 'short' }), hours: value });
    }
    return buckets;
  }, [selectedDate, worklogRecords, locale]);

  const setDate = (amount) => {
    const nextDate = new Date(selectedDate);
    nextDate.setDate(nextDate.getDate() + amount);
    setSelectedDate(nextDate);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[36px] border p-8" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)', boxShadow: 'var(--shadow-soft)' }}>
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: 'var(--accent)' }}>{strings.reports.pageTitle}</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.pageTitle}</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.pageDescription}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[28px] border px-4 py-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <button type="button" onClick={() => setDate(-1)} className="rounded-full px-3 py-2 text-sm font-semibold transition" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>{strings.timesheet.arrows.prev}</button>
            <div className="min-w-[180px] text-center">
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.anchorDate}</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedDate.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <button type="button" onClick={() => setDate(1)} className="rounded-full px-3 py-2 text-sm font-semibold transition" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>{strings.timesheet.arrows.next}</button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border p-8 text-center" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.loading}</p>
          </div>
        ) : worklogRecords.length === 0 ? (
          <div className="rounded-[28px] border p-8 text-center" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <AlertCircle size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.emptyTitle}</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.emptyDescription}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 xl:grid-cols-4">
              <TimeSummaryCard title={strings.timesheet.totalLogged} value={formatHours(totalHours)} subtitle={strings.timesheet.totalLoggedSubtitle} icon={Clock3} accent="var(--accent)" />
              <TimeSummaryCard title={strings.timesheet.dailyHours} value={formatHours(dailyHours)} subtitle={format(strings.timesheet.subtitles.forDate, { date: selectedDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) })} icon={CalendarDays} accent="var(--success)" />
              <TimeSummaryCard title={strings.timesheet.weeklyHours} value={formatHours(weeklyHours)} subtitle={format(strings.timesheet.subtitles.weekOf, { date: selectedWeek.start.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) })} icon={BarChart3} accent="var(--warning)" />
              <TimeSummaryCard title={strings.timesheet.monthlyHours} value={formatHours(monthlyHours)} subtitle={selectedDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })} icon={FolderKanban} accent="var(--destructive)" />
            </div>

            <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <OvertimeCard regularHours={regularHours} overtimeHours={overtimeHours} totalHours={weeklyHours} targetHours={WEEKLY_TARGET_HOURS} remainingHours={remainingHours} />
              <div className="space-y-4">
                <TimeSummaryCard title={strings.timesheet.remainingRequired} value={formatHours(remainingHours)} subtitle={format(strings.timesheet.subtitles.target, { hours: WEEKLY_TARGET_HOURS })} icon={CheckCircle2} accent="var(--accent)" />
                <TimeSummaryCard title={strings.timesheet.completedTasks} value={`${completedCount}`} subtitle={format(strings.timesheet.subtitles.completedPercent, { percent: Math.round((completedCount / Math.max(1, worklogRecords.length)) * 100) })} icon={TrendingUp} accent="var(--success)" />
              </div>
            </div>

            <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.taskLevelHours}</p>
                    <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.breakdownTitle}</h2>
                  </div>
                  <div className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--accent)' }}>
                    {format(strings.timesheet.entries, { count: taskBreakdown.length })}
                  </div>
                </div>

                <div className="grid gap-3">
                  {taskBreakdown.map((item) => (
                    <TaskTimeCard
                      key={`${item.project}-${item.task}`}
                      task={item.task}
                      project={item.project}
                      hours={item.hours}
                      category={item.category}
                      date={format(strings.timesheet.table.days, { count: item.dayCount })}
                      status={item.status}
                      completionPercent={Math.min(100, (item.hours / Math.max(1, DAILY_TARGET_HOURS)) * 100)}
                      accent="var(--accent)"
                    />
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.timeDistribution}</p>
                    <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.projectHours}</h2>
                  </div>
                  <div className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                    <BarChart3 size={16} className="inline" />
                  </div>
                </div>
                <ProjectTimeChart data={projectBreakdown} accent="var(--accent)" />
                <div className="mt-4 space-y-2">
                  {categoryBreakdown.map((item) => (
                    <div key={item.name} className="flex items-center justify-between rounded-[20px] border px-3 py-2" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatHours(item.hours)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8 rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}>
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.worklogHistory}</p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.filterAndReview}</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                  <Filter size={16} /> {strings.timesheet.filtersEnabled}
                </div>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">{strings.timesheet.startDate}</span>
                  <input type="date" value={dateRangeStart} onChange={(event) => setDateRangeStart(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">{strings.timesheet.endDate}</span>
                  <input type="date" value={dateRangeEnd} onChange={(event) => setDateRangeEnd(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">{strings.timesheet.project}</span>
                  <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {projectOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">{strings.timesheet.task}</span>
                  <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {taskOptions.map((option) => <option key={option} value={option}>{option === 'all' ? strings.timesheet.allTasks : option}</option>)}
                  </select>
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">{strings.timesheet.status}</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {statusOptions.map((option) => <option key={option} value={option}>{option === 'all' ? strings.timesheet.allStatuses : option}</option>)}
                  </select>
                </label>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.groupingLabel}</span>
                {[
                  { value: 'task', label: strings.timesheet.groupByTask },
                  { value: 'date', label: strings.timesheet.groupByDate },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGrouping(option.value)}
                    className="rounded-full border px-4 py-2 text-sm font-semibold transition"
                    style={grouping === option.value
                      ? { backgroundColor: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                      : { backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)' }}
                  >
                    {option.label}
                  </button>
                ))}

                {grouping === 'task' && (
                  <label className="ml-auto flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>{strings.timesheet.matchLabel}</span>
                    <select
                      value={matchMode}
                      onChange={(event) => setMatchMode(event.target.value)}
                      className="rounded-2xl border px-3 py-2 text-sm"
                      style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
                    >
                      {MATCH_MODES.map((mode) => (
                        <option key={mode} value={mode}>{strings.timesheet.matchModes[mode]}</option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {grouping === 'task' && (
                <p className="mb-4 text-xs" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.matchHint[matchMode]}</p>
              )}

              <WorklogTable
                rows={grouping === 'task' ? groupedRows : filteredRows}
                grouped={grouping === 'task'}
                emptyMessage={strings.timesheet.emptyFilters}
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}>
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{strings.timesheet.productivityTrend}</p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{strings.timesheet.weeklyProductivity}</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-7">
                {weeklyTrend.map((item) => (
                  <div key={item.label} className="rounded-[24px] border p-3 text-center" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                    <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>{item.label}</p>
                    <p className="mt-3 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{formatHours(item.hours)}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default TimesheetPage;
