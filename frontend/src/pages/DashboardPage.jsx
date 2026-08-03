import { motion, useReducedMotion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, CheckCircle2, CircleDashed, Clock3, ClipboardCheck, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardCard from '../components/dashboard/DashboardCard.jsx';
import FilterButton from '../components/dashboard/FilterButton.jsx';
import InsightCard from '../components/dashboard/InsightCard.jsx';
import PendingTaskCard from '../components/dashboard/PendingTaskCard.jsx';
import SectionCard from '../components/dashboard/SectionCard.jsx';
import StatCard from '../components/dashboard/StatCard.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';

const filters = ['Daily', 'Weekly', 'Monthly'];
const productivitySeries = [
  { day: 'Mon', value: 62 },
  { day: 'Tue', value: 74 },
  { day: 'Wed', value: 81 },
  { day: 'Thu', value: 77 },
  { day: 'Fri', value: 88 },
  { day: 'Sat', value: 69 },
  { day: 'Sun', value: 91 },
];
const workHoursSeries = [
  { label: 'Focus', value: 7 },
  { label: 'Review', value: 1.2 },
  { label: 'Meetings', value: 1.1 },
];
const statusSeries = [
  { name: 'Completed', value: 18, color: 'var(--success)' },
  { name: 'In progress', value: 5, color: 'var(--accent)' },
  { name: 'Pending', value: 7, color: 'var(--warning)' },
  { name: 'Overdue', value: 3, color: 'var(--destructive)' },
];

const DashboardPage = () => {
  const { activeTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [selectedFilter, setSelectedFilter] = useState('Weekly');
  const [loading, setLoading] = useState(true);

  useMemo(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const overview = useMemo(() => [
    { title: 'Total work hours', value: '9h 20m', icon: Clock3, description: 'Steady focus today', accent: true },
    { title: 'Completed tasks', value: '18', icon: CheckCircle2, description: 'Across active workstreams', accent: false },
    { title: 'Pending tasks', value: '7', icon: ClipboardCheck, description: 'Needs follow-up', accent: false },
    { title: 'In progress', value: '5', icon: Activity, description: 'Moving forward', accent: false },
    { title: 'Overdue', value: '3', icon: AlertTriangle, description: 'Requires attention', accent: false },
  ], []);

  const pendingTasks = useMemo(() => [
    { title: 'Audit Q3 budget', priority: 'High', due: 'Today', status: 'Pending' },
    { title: 'Update user story board', priority: 'Medium', due: 'Tomorrow', status: 'In Progress' },
    { title: 'Review deployment notes', priority: 'Low', due: 'Apr 6', status: 'Pending' },
    { title: 'Submit timesheet', priority: 'High', due: 'Apr 7', status: 'Overdue' },
  ], []);

  const insights = useMemo(() => [
    { label: 'Completion trend', value: '80% this week', description: 'Higher completion than last week.', icon: TrendingUp },
    { label: 'Task history', value: '24 tasks', description: 'Most tasks were completed on Wednesdays.', icon: BarChart3 },
    { label: 'Estimated time', value: '2h 15m', description: 'Similar tasks typically finish within 2.5 hours.', icon: Sparkles },
  ], []);

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
                WorkPulse Command Center
              </div>
              <h1 className="mt-4 text-3xl font-semibold sm:text-4xl" style={{ color: activeTheme.textPrimary }}>Worklog dashboard</h1>
              <p className="mt-3 text-base leading-7" style={{ color: activeTheme.textSecondary }}>Track average output, task health, and workload balance at a glance with live, theme-aware analytics.</p>
            </div>
            <div className="flex flex-wrap gap-3 rounded-[24px] border p-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              {filters.map((label) => (
                <FilterButton key={label} label={label} active={selectedFilter === label} onClick={() => setSelectedFilter(label)} />
              ))}
            </div>
          </div>
        </motion.header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {overview.map((item, index) => (
            <motion.div key={item.title} initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.3 }}>
              <StatCard {...item} />
            </motion.div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
          <SectionCard title="Work hours & productivity" description="A clearer view of delivery velocity over the selected period." action={<span className="rounded-full px-3 py-1 text-sm font-medium" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>+12% vs last week</span>}>
            <div className="space-y-6">
              <DashboardCard className="p-5" hover={false} initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
                <div className="mb-4 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Weekly productivity</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>87% peak efficiency</p>
                  </div>
                  <div className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>Updated 5 mins ago</div>
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
                      <XAxis dataKey="day" tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: activeTheme.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: activeTheme.surface, border: `1px solid ${activeTheme.border}`, borderRadius: 16, color: activeTheme.textPrimary }} />
                      <Area type="monotone" dataKey="value" stroke={activeTheme.accent} fill="url(#productivityGradient)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>

              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardCard className="p-5" hover={false} initial={!shouldReduceMotion} animate={!shouldReduceMotion}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Work hours</p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>9h 20m</p>
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
                      <p className="text-sm font-medium uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Task completion</p>
                      <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>72% complete</p>
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
                            <Cell key={entry.name} fill={entry.color.replace('var(--success)', activeTheme.success).replace('var(--accent)', activeTheme.accent).replace('var(--warning)', activeTheme.warning).replace('var(--destructive)', activeTheme.destructive)} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: activeTheme.surface, border: `1px solid ${activeTheme.border}`, borderRadius: 16 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 space-y-3">
                    {statusSeries.map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm" style={{ color: activeTheme.textSecondary }}>
                        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color.replace('var(--success)', activeTheme.success).replace('var(--accent)', activeTheme.accent).replace('var(--warning)', activeTheme.warning).replace('var(--destructive)', activeTheme.destructive) }} />{item.name}</span>
                        <span style={{ color: activeTheme.textPrimary }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </DashboardCard>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Pending tasks" description="The next actions that need attention this period." action={<span className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>4 active</span>}>
            <div className="space-y-3">
              {pendingTasks.length > 0 ? pendingTasks.map((task, index) => (
                <motion.div key={task.title} initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <PendingTaskCard task={task} />
                </motion.div>
              )) : (
                <div className="rounded-[24px] border border-dashed p-8 text-center" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
                  <CircleDashed size={36} className="mx-auto" color={activeTheme.textSecondary} />
                  <p className="mt-4 font-semibold" style={{ color: activeTheme.textPrimary }}>No pending tasks</p>
                  <p className="mt-2 text-sm">You have a clear runway today.</p>
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Insights & recommendations" description="A digest of trends and what to focus on next." action={<span className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>Auto-synced</span>}>
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
