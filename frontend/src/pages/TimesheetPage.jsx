import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, CalendarDays, CheckCircle2, Clock3, Filter, FolderKanban, Sparkles, TrendingUp } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import TimeSummaryCard from '../components/workflow/TimeSummaryCard.jsx';
import TaskTimeCard from '../components/workflow/TaskTimeCard.jsx';
import OvertimeCard from '../components/workflow/OvertimeCard.jsx';
import WorklogTable from '../components/workflow/WorklogTable.jsx';
import ProjectTimeChart from '../components/workflow/ProjectTimeChart.jsx';
import { formatDateKey } from '../components/workflow/constants.js';

const WEEKLY_TARGET_HOURS = 40;
const DAILY_TARGET_HOURS = 8;
const DEFAULT_CATEGORY = 'Task';

const formatHours = (hours) => `${hours.toFixed(1)}h`;
const formatDateLabel = (value) => {
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

const normalizeStatus = (status) => {
  const label = String(status || 'IN_PROGRESS').toUpperCase();
  const map = {
    IN_PROGRESS: 'In progress',
    PLANNED: 'Planned',
    SUBMITTED: 'Submitted',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    COMPLETED: 'Completed',
    DONE: 'Completed',
    ON_TRACK: 'On track',
  };
  return map[label] || label.replace(/_/g, ' ');
};

const buildWorklogRecords = (worklogMap = {}, plannerMap = {}) => {
  return Object.entries(worklogMap)
    .flatMap(([dateKey, entry]) => {
      if (!entry) return [];
      const plannerEntry = plannerMap[dateKey] || null;
      const plannerTasks = Array.isArray(plannerEntry?.tasks) ? plannerEntry.tasks : [];
      const taskLookup = new Map(plannerTasks.map((task, index) => [task.title || `Task ${index + 1}`, task]));
      const details = Array.isArray(entry.details) ? entry.details : [];

      if (details.length === 0) {
        const actualMinutes = Number(entry.actualMinutes || 0);
        if (actualMinutes <= 0) return [];
        return [{
          dateKey,
          dateLabel: formatDateLabel(dateKey),
          task: 'Daily worklog',
          project: plannerEntry?.project || 'General',
          description: entry.remarks || 'Daily worklog entry',
          loggedHours: actualMinutes / 60,
          status: normalizeStatus(entry.completionStatus || entry.status || 'IN_PROGRESS'),
          category: 'Daily',
          completed: false,
        }];
      }

      return details.flatMap((detail, index) => {
        const actualMinutes = Number(detail.actualMinutes || 0);
        if (actualMinutes <= 0) return [];
        const taskMeta = taskLookup.get(detail.title) || plannerTasks[index] || {};
        const projectName = taskMeta.project || detail.project || plannerEntry?.project || 'General';
        return [{
          dateKey,
          dateLabel: formatDateLabel(dateKey),
          task: detail.title || `Task ${index + 1}`,
          project: projectName,
          description: detail.remarks || '',
          loggedHours: actualMinutes / 60,
          status: normalizeStatus(entry.completionStatus || entry.status || 'IN_PROGRESS'),
          category: detail.type || DEFAULT_CATEGORY,
          completed: ['approved', 'completed', 'done', 'submitted'].includes(String(entry.completionStatus || entry.status || '').toLowerCase()),
        }];
      });
    })
    .sort((left, right) => right.dateKey.localeCompare(left.dateKey));
};

const TimesheetPage = () => {
  const { activeTheme } = useTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [worklogRecords, setWorklogRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const loadWorklogData = () => {
    setIsLoading(true);
    try {
      const storedWorklogs = JSON.parse(localStorage.getItem('worklogEntries') || '{}');
      const storedPlanners = JSON.parse(localStorage.getItem('plannerEntries') || '{}');
      const records = buildWorklogRecords(storedWorklogs, storedPlanners);
      setWorklogRecords(records);
    } catch {
      setWorklogRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorklogData();

    const handleRefresh = () => loadWorklogData();
    window.addEventListener('worklog-updated', handleRefresh);
    window.addEventListener('storage', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleRefresh);

    return () => {
      window.removeEventListener('worklog-updated', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleRefresh);
    };
  }, []);

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
      const matchesProject = projectFilter === 'all' || row.project === projectFilter;
      const matchesTask = taskFilter === 'all' || row.task === taskFilter;
      const matchesStatus = statusFilter === 'all' || row.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesRange && matchesProject && matchesTask && matchesStatus;
    });
  }, [dateRangeEnd, dateRangeStart, projectFilter, statusFilter, taskFilter, worklogRecords]);

  const projectOptions = useMemo(() => ['all', ...Array.from(new Set(worklogRecords.map((row) => row.project)))], [worklogRecords]);
  const taskOptions = useMemo(() => ['all', ...Array.from(new Set(worklogRecords.map((row) => row.task)))], [worklogRecords]);
  const statusOptions = useMemo(() => ['all', ...Array.from(new Set(worklogRecords.map((row) => row.status)))], [worklogRecords]);

  const taskBreakdown = useMemo(() => {
    const aggregates = worklogRecords.reduce((acc, row) => {
      const key = `${row.project}::${row.task}`;
      if (!acc[key]) {
        acc[key] = { task: row.task, project: row.project, hours: 0, status: row.status, category: row.category };
      }
      acc[key].hours += row.loggedHours;
      return acc;
    }, {});

    return Object.values(aggregates)
      .sort((left, right) => right.hours - left.hours)
      .slice(0, 6);
  }, [worklogRecords]);

  const projectBreakdown = useMemo(() => {
    const aggregates = worklogRecords.reduce((acc, row) => {
      if (!acc[row.project]) acc[row.project] = { name: row.project, hours: 0 };
      acc[row.project].hours += row.loggedHours;
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
      buckets.push({ label: day.toLocaleDateString('en-US', { weekday: 'short' }), hours: value });
    }
    return buckets;
  }, [selectedDate, worklogRecords]);

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
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: 'var(--accent)' }}>Worklog analytics</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>Worklog time summary & task hours</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Review worklog-driven productivity, task-level hours, and overtime without creating separate time-tracking records.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-[28px] border px-4 py-3" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <button type="button" onClick={() => setDate(-1)} className="rounded-full px-3 py-2 text-sm font-semibold transition" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>←</button>
            <div className="min-w-[180px] text-center">
              <p className="text-xs uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Anchor date</p>
              <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            </div>
            <button type="button" onClick={() => setDate(1)} className="rounded-full px-3 py-2 text-sm font-semibold transition" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-subtle)' }}>→</button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-[28px] border p-8 text-center" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Loading your worklog analytics…</p>
          </div>
        ) : worklogRecords.length === 0 ? (
          <div className="rounded-[28px] border p-8 text-center" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--accent-soft)' }}>
              <AlertCircle size={20} style={{ color: 'var(--accent)' }} />
            </div>
            <p className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>No worklog data has been saved yet.</p>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Save a worklog from the daily worklog experience to populate this analytics module.</p>
          </div>
        ) : (
          <>
            <div className="mb-8 grid gap-4 xl:grid-cols-4">
              <TimeSummaryCard title="Total logged" value={formatHours(totalHours)} subtitle="Across all saved worklog records" icon={Clock3} accent="var(--accent)" />
              <TimeSummaryCard title="Daily hours" value={formatHours(dailyHours)} subtitle={`For ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} icon={CalendarDays} accent="var(--success)" />
              <TimeSummaryCard title="Weekly hours" value={formatHours(weeklyHours)} subtitle={`Week of ${selectedWeek.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`} icon={BarChart3} accent="var(--warning)" />
              <TimeSummaryCard title="Monthly hours" value={formatHours(monthlyHours)} subtitle={selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} icon={FolderKanban} accent="var(--destructive)" />
            </div>

            <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <OvertimeCard regularHours={regularHours} overtimeHours={overtimeHours} totalHours={weeklyHours} targetHours={WEEKLY_TARGET_HOURS} remainingHours={remainingHours} />
              <div className="space-y-4">
                <TimeSummaryCard title="Remaining required" value={formatHours(remainingHours)} subtitle={`Target ${WEEKLY_TARGET_HOURS}h / week`} icon={CheckCircle2} accent="var(--accent)" />
                <TimeSummaryCard title="Completed tasks" value={`${completedCount}`} subtitle={`${Math.round((completedCount / Math.max(1, worklogRecords.length)) * 100)}% of logged items completed`} icon={TrendingUp} accent="var(--success)" />
              </div>
            </div>

            <div className="mb-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)' }}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Task-level hours</p>
                    <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Task and project breakdown</h2>
                  </div>
                  <div className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-primary)', color: 'var(--accent)' }}>
                    {taskBreakdown.length} entries
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
                      date={item.date || 'Recent work'}
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
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Time distribution</p>
                    <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Project hours</h2>
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
                  <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Worklog history</p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Filter and review worklog entries</h2>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: 'var(--surface-secondary)', color: 'var(--text-secondary)' }}>
                  <Filter size={16} /> Filters enabled
                </div>
              </div>

              <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">Start date</span>
                  <input type="date" value={dateRangeStart} onChange={(event) => setDateRangeStart(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">End date</span>
                  <input type="date" value={dateRangeEnd} onChange={(event) => setDateRangeEnd(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }} />
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">Project</span>
                  <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {projectOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All projects' : option}</option>)}
                  </select>
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">Task</span>
                  <select value={taskFilter} onChange={(event) => setTaskFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {taskOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All tasks' : option}</option>)}
                  </select>
                </label>
                <label className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <span className="mb-2 block font-medium">Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm" style={{ backgroundColor: 'var(--surface-secondary)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
                    {statusOptions.map((option) => <option key={option} value={option}>{option === 'all' ? 'All statuses' : option}</option>)}
                  </select>
                </label>
              </div>

              <WorklogTable rows={filteredRows.map((row) => ({ ...row, loggedHours: row.loggedHours }))} emptyMessage="No worklog entries match the selected filters." />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[32px] border p-6" style={{ backgroundColor: 'var(--surface-primary)', borderColor: 'var(--border-subtle)' }}>
              <div className="mb-4">
                <p className="text-sm uppercase tracking-[0.24em]" style={{ color: 'var(--text-secondary)' }}>Productivity trend</p>
                <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Weekly productivity</h2>
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
