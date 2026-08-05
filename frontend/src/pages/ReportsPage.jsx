import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import api from '../lib/api.js';
import ReportCard from '../components/reports/ReportCard.jsx';
import ProjectTimeChart from '../components/reports/ProjectTimeChart.jsx';
import TaskAnalyticsCard from '../components/reports/TaskAnalyticsCard.jsx';
import OvertimeChart from '../components/reports/OvertimeChart.jsx';
import ReportFilters from '../components/reports/ReportFilters.jsx';

const initialFilters = {
  dateFrom: '',
  dateTo: '',
  projectId: 'all',
  taskStatus: 'all',
  userId: 'all',
};

const ReportsPage = () => {
  const { activeTheme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [projectsResponse, usersResponse, analyticsResponse] = await Promise.all([
          api.get('/projects'),
          api.get('/users').catch(() => ({ data: [] })),
          api.get('/reports/analytics', {
            params: {
              dateFrom: filters.dateFrom || undefined,
              dateTo: filters.dateTo || undefined,
              projectId: filters.projectId !== 'all' ? filters.projectId : undefined,
              taskStatus: filters.taskStatus !== 'all' ? filters.taskStatus : undefined,
              userId: filters.userId !== 'all' ? filters.userId : undefined,
            },
          }),
        ]);

        setProjects(projectsResponse.data || []);
        setUsers(usersResponse.data || []);
        setAnalytics(analyticsResponse.data || null);
      } catch (error) {
        console.error('Failed to load analytics data', error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [filters.dateFrom, filters.dateTo, filters.projectId, filters.taskStatus, filters.userId]);

  const handleFilterChange = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleExport = async (type) => {
    if (!analytics) return;

    const rows = [
      ['Type', 'Value'],
      ['Total logged hours', analytics.summary.totalLoggedHours],
      ['Completed tasks %', analytics.summary.completedTasksPercentage],
      ['Active projects', analytics.summary.activeProjects],
      ['Overtime hours', analytics.summary.overtimeHours],
    ];

    const blob = new Blob([rows.map((row) => row.join(',')).join('\n')], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `worklog-report.${type === 'csv' ? 'csv' : 'pdf'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = analytics ? [
    { label: 'Total logged hours', value: `${analytics.summary.totalLoggedHours.toFixed(1)}h`, detail: 'Across filtered worklogs' },
    { label: 'Completed tasks %', value: `${analytics.summary.completedTasksPercentage.toFixed(1)}%`, detail: 'Completion rate' },
    { label: 'Active projects', value: analytics.summary.activeProjects.toString(), detail: 'Projects in scope' },
    { label: 'Overtime hours', value: `${analytics.summary.overtimeHours.toFixed(1)}h`, detail: 'Against expected workload' },
  ] : [];

  const projectChartData = analytics?.projectBreakdown?.map((project) => ({ name: project.name, hours: project.hours })) || [];
  const overtimeTrend = analytics?.monthlyTrend?.map((item) => ({ name: item.name, hours: item.hours })) || [];

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="app-card p-12 text-center" style={{ color: activeTheme.textSecondary }}>
          Loading analytics…
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Reporting & analytics</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Worklog analytics</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>Insights generated from the live worklog and task records in the workspace.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" className="app-secondary-btn" onClick={() => handleExport('csv')}>Export CSV</button>
            <button type="button" className="app-action-btn" onClick={() => handleExport('pdf')}>Export PDF</button>
          </div>
        </div>

        <ReportFilters filters={filters} onChange={handleFilterChange} projects={projects} users={users} loading={loading} />

        <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <ReportCard key={card.label} label={card.label} value={card.value} detail={card.detail} />
          ))}
        </div>

        {!analytics?.meta?.totalWorklogs && !analytics?.meta?.totalTasks ? (
          <div className="mt-8 rounded-[28px] border border-dashed p-10 text-center" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
            No worklog or task data is available for the selected range yet.
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-[32px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Hours by project</p>
                    <h2 className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>Project time breakdown</h2>
                  </div>
                </div>
                {projectChartData.length ? <ProjectTimeChart data={projectChartData} /> : <p style={{ color: activeTheme.textSecondary }}>No project hours to show yet.</p>}
              </div>

              <div className="rounded-[32px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Overtime</p>
                    <h2 className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>Normal vs overtime</h2>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border p-4" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
                    <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Normal hours</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{analytics?.overtime?.normalHours?.toFixed(1) || '0.0'}h</p>
                  </div>
                  <div className="rounded-[24px] border p-4" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
                    <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Overtime hours</p>
                    <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{analytics?.overtime?.overtimeHours?.toFixed(1) || '0.0'}h</p>
                  </div>
                </div>
                <div className="mt-6">
                  <OvertimeChart data={overtimeTrend} />
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>Project reports</p>
                    <h2 className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>Project delivery overview</h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {analytics?.projectBreakdown?.length ? analytics.projectBreakdown.map((project) => (
                    <div key={project.id || project.name} className="rounded-[24px] border p-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold" style={{ color: activeTheme.textPrimary }}>{project.name}</p>
                          <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{project.hours.toFixed(1)}h logged • {project.taskCount} tasks</p>
                        </div>
                        <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{project.progress}%</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-sm" style={{ color: activeTheme.textSecondary }}>
                        <span>Completed: {project.completedTasks}</span>
                        <span>Avg. time: {project.averageCompletionTime.toFixed(1)}h</span>
                      </div>
                    </div>
                  )) : <p style={{ color: activeTheme.textSecondary }}>No project data available.</p>}
                </div>
              </div>

              <div className="space-y-6">
                <TaskAnalyticsCard title="Task analytics" items={analytics?.taskBreakdown?.map((task) => ({ id: task.id, name: task.name, detail: `${task.projectName} • ${task.status}`, value: `${task.hours.toFixed(1)}h` })) || []} emptyMessage="No task activity found for this view." />
                <TaskAnalyticsCard title="Task completion" items={[
                  { id: 'completed', name: 'Completed tasks', detail: 'Tasks in completed state', value: analytics?.taskCompletionSummary?.completed ?? 0 },
                  { id: 'pending', name: 'Pending tasks', detail: 'Tasks still active or planned', value: analytics?.taskCompletionSummary?.pending ?? 0 },
                  { id: 'avg', name: 'Average time per task', detail: 'Based on actual task minutes', value: `${analytics?.taskCompletionSummary?.averageTimePerTask?.toFixed(1) ?? '0.0'}h` },
                ]} emptyMessage="No task completion data available." />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
