import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, CircleDashed, Clock3, ClipboardCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardCard from '../components/dashboard/DashboardCard.jsx';
import FilterButton from '../components/dashboard/FilterButton.jsx';
import InsightCard from '../components/dashboard/InsightCard.jsx';
import PendingTaskCard from '../components/dashboard/PendingTaskCard.jsx';
import SectionCard from '../components/dashboard/SectionCard.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage, format } from '../contexts/LanguageContext.jsx';
import api from '../lib/api.js';
import { buildDateRange, buildPreviousDateRange } from '../lib/dateRange.js';

const filters = ['Daily', 'Weekly', 'Monthly'];

const DashboardPage = () => {
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const shouldReduceMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState('Weekly');
  const [analytics, setAnalytics] = useState(null);
  const [previousAnalytics, setPreviousAnalytics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const { dateFrom, dateTo } = buildDateRange(selectedFilter);
      const previous = buildPreviousDateRange(selectedFilter);

      setLoading(true);
      setError(null);

      try {
        const [analyticsResponse, previousResponse, tasksResponse] = await Promise.all([
          api.get('/reports/analytics', { params: { dateFrom, dateTo } }),
          api.get('/reports/analytics', { params: { dateFrom: previous.dateFrom, dateTo: previous.dateTo } }).catch(() => ({ data: null })),
          api.get('/tasks'),
        ]);

        if (!isMounted) return;

        setAnalytics(analyticsResponse.data || null);
        setPreviousAnalytics(previousResponse.data || null);
        setTasks(tasksResponse.data || []);
      } catch (err) {
        if (!isMounted) return;
        setError(strings.dashboard.error);
      } finally {
        if (!isMounted) return;
        setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, [selectedFilter]);

  // Counts come from the analytics rollup, which reads the worklog sessions this
  // app actually records; standalone Task rows are added in when they exist.
  const taskStatusCounts = useMemo(() => {
    const summary = analytics?.taskCompletionSummary;
    if (summary) {
      return {
        completed: summary.completed || 0,
        pending: summary.pending || 0,
        inProgress: summary.inProgress || 0,
        overdue: summary.overdue || 0,
      };
    }

    return tasks.reduce(
      (counts, task) => {
        const status = task.status?.toUpperCase();
        if (status === 'COMPLETED') counts.completed += 1;
        else if (status === 'IN_PROGRESS') counts.inProgress += 1;
        else if (status === 'BLOCKED') counts.overdue += 1;
        else counts.pending += 1;
        return counts;
      },
      { completed: 0, pending: 0, inProgress: 0, overdue: 0 }
    );
  }, [analytics, tasks]);

  const overview = useMemo(() => [
    { title: strings.dashboard.overview.totalWorkHours, value: analytics?.summary?.formattedTotalHours || '0.0h', icon: Clock3, description: strings.dashboard.overview.totalWorkHoursDescription, accent: true },
    { title: strings.dashboard.overview.completedTasks, value: analytics?.taskCompletionSummary?.completed?.toString() || '0', icon: CheckCircle2, description: strings.dashboard.overview.completedTasksDescription, accent: false },
    { title: strings.dashboard.overview.pendingTasks, value: analytics?.taskCompletionSummary?.pending?.toString() || '0', icon: ClipboardCheck, description: strings.dashboard.overview.pendingTasksDescription, accent: false },
    { title: strings.dashboard.overview.inProgress, value: taskStatusCounts.inProgress.toString(), icon: Activity, description: strings.dashboard.overview.inProgressDescription, accent: false },
    { title: strings.dashboard.overview.overdue, value: taskStatusCounts.overdue.toString(), icon: AlertTriangle, description: strings.dashboard.overview.overdueDescription, accent: false },
  ], [analytics, taskStatusCounts, strings]);

  const selectedFilterLabel = selectedFilter === 'Daily' ? strings.dashboard.filters.daily : selectedFilter === 'Weekly' ? strings.dashboard.filters.weekly : strings.dashboard.filters.monthly;

  // Logged hours this period against the same-length period before it.
  const workHoursTrend = useMemo(() => {
    const current = analytics?.summary?.totalLoggedHours;
    const previous = previousAnalytics?.summary?.totalLoggedHours;
    if (typeof current !== 'number' || typeof previous !== 'number' || previous <= 0) {
      return strings.dashboard.workHoursTrendNone;
    }

    const changePercent = ((current - previous) / previous) * 100;
    const period = selectedFilter === 'Daily'
      ? strings.dashboard.periods.daily
      : selectedFilter === 'Weekly'
        ? strings.dashboard.periods.weekly
        : strings.dashboard.periods.monthly;

    return format(strings.dashboard.workHoursTrend, {
      delta: `${changePercent >= 0 ? '+' : '−'}${Math.abs(changePercent).toFixed(1)}%`,
      period,
    });
  }, [analytics, previousAnalytics, selectedFilter, strings]);

  const pendingTasks = useMemo(() => {
    // Open work from the recorded sessions, with the standalone Task rows as a
    // fallback for installations that create them.
    const openTasks = analytics?.openTasks || [];
    if (openTasks.length > 0) {
      return openTasks.slice(0, 4).map((task) => ({
        title: task.name || strings.dashboard.pendingTasksNone,
        priority: task.projectName || strings.dashboard.pendingTaskPriorityLabel,
        due: task.lastDate ? new Date(`${task.lastDate}T00:00:00`).toLocaleDateString(locale || 'en-US') : strings.common.tbd,
        estimate: `${task.hours.toFixed(1)}h / ${task.plannedHours.toFixed(1)}h`,
        status: task.status,
        statusLabel: task.status === 'IN_PROGRESS' ? strings.common.statuses.inProgress : strings.dashboard.overview.pendingTasks,
      }));
    }

    return tasks.slice(0, 4).map((task) => {
      const rawStatus = task.status?.toUpperCase();
      const statusLabel = rawStatus === 'COMPLETED'
        ? strings.common.statuses.completed
        : rawStatus === 'IN_PROGRESS'
          ? strings.common.statuses.inProgress
          : rawStatus === 'BLOCKED'
            ? strings.dashboard.overview.overdue
            : strings.dashboard.overview.pendingTasks;

      return {
        title: task.title || strings.dashboard.pendingTasksNone,
        priority: task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1).toLowerCase() || strings.dashboard.pendingTaskPriorityLabel,
        due: task.startTime ? new Date(task.startTime).toLocaleDateString(locale || 'en-US') : strings.common.tbd,
        estimate: task.estimate ? `${task.estimate}` : strings.dashboard.pendingTaskEstimateLabel,
        status: task.status || 'PENDING',
        statusLabel,
      };
    });
  }, [analytics, tasks, strings, locale]);

  const insights = useMemo(() => [
    { label: strings.dashboard.sections.completionTrend, value: `${analytics?.summary?.completedTasksPercentage?.toFixed(1) || 0}%`, description: strings.dashboard.insights.completionRateDescription, icon: TrendingUp },
    { label: strings.dashboard.sections.taskHistory, value: `${analytics?.meta?.totalTasks || 0} ${strings.dashboard.overview.completedTasks.toLowerCase()}`, description: strings.dashboard.insights.taskHistoryDescription, icon: BarChart3 },
    { label: strings.dashboard.sections.estimatedTime, value: `${analytics?.overtime?.expectedHours?.toFixed(1) || 0}h`, description: strings.dashboard.insights.estimatedTimeDescription, icon: Sparkles },
  ], [analytics, strings]);

  const productivitySeries = useMemo(() => {
    if (!analytics) return [];
    if (selectedFilter === 'Monthly') return analytics.monthlyTrend || [];
    return analytics.weeklyTrend || [];
  }, [analytics, selectedFilter]);

  const workHoursSeries = useMemo(() => {
    return analytics?.timeDistribution?.map((item) => ({ label: item.name, value: item.hours })) || [];
  }, [analytics]);

  const statusSeries = useMemo(() => [
    { name: strings.common.statuses.completed, value: taskStatusCounts.completed, color: activeTheme.success },
    { name: strings.common.statuses.inProgress, value: taskStatusCounts.inProgress, color: activeTheme.accent },
    { name: strings.dashboard.overview.pendingTasks, value: taskStatusCounts.pending, color: activeTheme.warning },
    { name: strings.dashboard.overview.overdue, value: taskStatusCounts.overdue, color: activeTheme.destructive },
  ], [taskStatusCounts, activeTheme.success, activeTheme.accent, activeTheme.warning, activeTheme.destructive, strings]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-2 py-6 sm:px-4 lg:px-6">
        {[1, 2, 3].map((item) => (
          <DashboardCard key={item} className="animate-pulse" initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
            <div className="h-8 w-40 rounded-full" style={{ backgroundColor: activeTheme.surfaceAlt }} />
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-28 rounded-[24px]" style={{ backgroundColor: activeTheme.surfaceAlt }} />
              ))}
            </div>
          </DashboardCard>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen px-2 py-6 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.header initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="rounded-[32px] border p-8 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>
                <Sparkles size={16} />
                {strings.dashboard.badge}
              </div>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl" style={{ color: activeTheme.textPrimary }}>{strings.dashboard.title}</h1>
              <p className="mt-3 text-base leading-7" style={{ color: activeTheme.textSecondary }}>{strings.dashboard.description}</p>
            </div>
            <div className="flex flex-wrap gap-3 rounded-[24px] border p-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              {filters.map((label) => {
                const translatedLabel = label === 'Daily' ? strings.dashboard.filters.daily : label === 'Weekly' ? strings.dashboard.filters.weekly : strings.dashboard.filters.monthly;
                return <FilterButton key={label} label={translatedLabel} active={selectedFilter === label} onClick={() => setSelectedFilter(label)} />;
              })}
            </div>
          </div>
        </motion.header>

        {!loading && !error && !Number(analytics?.summary?.totalLoggedHours) && (
          <div className="rounded-[24px] border border-dashed p-5 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
            {format(strings.dashboard.emptyRange, { period: selectedFilterLabel.toLowerCase() })}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overview.map((item, index) => (
            <motion.div key={item.title} initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
              <StatCard {...item} />
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <SectionCard title={strings.dashboard.sections.workHours} description={strings.dashboard.sections.workHoursDescription} action={<span className="rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{workHoursTrend}</span>}>
            <div className="space-y-6">
              <DashboardCard className="p-5" hover={false} initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{selectedFilterLabel} {strings.dashboard.sections.productivity}</p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{analytics?.summary?.completedTasksPercentage?.toFixed(0) ?? '0'}% complete</p>
                </div>
                <div className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{analytics ? strings.dashboard.sections.liveRange : strings.dashboard.sections.loading}</div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={productivitySeries}>
                      <defs>
                        <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={activeTheme.accent} stopOpacity={0.42} />
                          <stop offset="100%" stopColor={activeTheme.accent} stopOpacity={0.03} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke={activeTheme.border} strokeDasharray="4 4" />
                      <XAxis dataKey="name" tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: activeTheme.surface, border: `1px solid ${activeTheme.border}`, borderRadius: 16, color: activeTheme.textPrimary }} />
                      <Area type="monotone" dataKey="hours" stroke={activeTheme.accent} fill="url(#productivityGradient)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardCard className="p-5" hover={false} initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.dashboard.sections.workHoursCard}</p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{analytics?.summary?.formattedTotalHours || '0.0h'}</p>
                    </div>
                    <div className="rounded-full p-2" style={{ backgroundColor: activeTheme.accentSoft }}>
                      <Clock3 size={16} color={activeTheme.accent} />
                    </div>
                  </div>
                  <div className="mt-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workHoursSeries}>
                        <CartesianGrid vertical={false} stroke={activeTheme.border} strokeDasharray="3 3" />
                        <XAxis dataKey="label" tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: activeTheme.surface, border: `1px solid ${activeTheme.border}`, borderRadius: 16 }} />
                        <Bar dataKey="value" radius={[8, 8, 4, 4]} fill={activeTheme.accent} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </DashboardCard>

                <DashboardCard className="p-5" hover={false} initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{strings.dashboard.sections.taskCompletion}</p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{analytics?.summary?.completedTasksPercentage?.toFixed(1) || '0.0'}% complete</p>
                    </div>
                    <div className="rounded-full p-2" style={{ backgroundColor: activeTheme.accentSoft }}>
                      <BarChart3 size={16} color={activeTheme.accent} />
                    </div>
                  </div>
                  <div className="mt-6 h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusSeries} dataKey="value" innerRadius={56} outerRadius={86} paddingAngle={2}>
                          {statusSeries.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: activeTheme.surface, border: `1px solid ${activeTheme.border}`, borderRadius: 16 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {statusSeries.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm" style={{ color: activeTheme.textSecondary }}>
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                        <span style={{ color: activeTheme.textPrimary }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </DashboardCard>
              </div>
            </div>
          </SectionCard>

          <SectionCard title={strings.dashboard.pendingTasksTitle} description={strings.dashboard.pendingTasksDescription} action={<span className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{pendingTasks.length} {strings.dashboard.pendingTasksActive}</span>}>
            <div className="space-y-3">
              {pendingTasks.length > 0 ? pendingTasks.map((task, index) => (
                <motion.div key={`${task.title}-${index}`} initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <PendingTaskCard task={task} />
                </motion.div>
              )) : (
                <div className="rounded-[24px] border border-dashed p-8 text-center" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
                  <CircleDashed size={36} className="mx-auto" color={activeTheme.textSecondary} />
                  <p className="mt-4 font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.dashboard.pendingTasksNone}</p>
                  <p className="mt-2 text-sm">{strings.dashboard.pendingTasksEmptyDescription}</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title={strings.dashboard.insightsTitle} description={strings.dashboard.insightsDescription} action={<span className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.dashboard.insightsAction}</span>}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {insights.map((insight, index) => (
              <motion.div key={insight.label} initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                <InsightCard {...insight} />
              </motion.div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DashboardPage;
