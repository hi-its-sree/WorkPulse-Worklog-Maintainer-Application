const DEFAULT_EXPECTED_HOURS = 8;

const toHours = (minutes) => Number((minutes / 60).toFixed(2));

const getDateKey = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const formatHours = (value) => `${value.toFixed(1)}h`;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const buildReportAnalytics = ({ projects = [], tasks = [], worklogs = [], users = [], filters = {} }) => {
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

  const normalizeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const activeProjects = projects.filter((project) => project.status === 'ACTIVE' || project.status === 'COMPLETED' || project.status === 'AT_RISK');

  const filteredTasks = tasks.filter((task) => {
    const taskDate = normalizeDate(task.startTime || task.endTime);
    const matchesDate = (!dateFrom || !taskDate || taskDate >= dateFrom) && (!dateTo || !taskDate || taskDate <= dateTo);
    const matchesProject = filters.projectId && filters.projectId !== 'all' ? Number(task.projectId) === Number(filters.projectId) : true;
    const matchesStatus = filters.taskStatus && filters.taskStatus !== 'all' ? task.status === filters.taskStatus : true;
    const matchesUser = filters.userId && filters.userId !== 'all' ? Number(task.assigneeId) === Number(filters.userId) : true;
    return matchesDate && matchesProject && matchesStatus && matchesUser;
  });

  const filteredWorklogs = worklogs.filter((worklog) => {
    const workDate = normalizeDate(worklog.logDate);
    const matchesDate = (!dateFrom || !workDate || workDate >= dateFrom) && (!dateTo || !workDate || workDate <= dateTo);
    const matchesUser = filters.userId && filters.userId !== 'all' ? Number(worklog.userId) === Number(filters.userId) : true;
    return matchesDate && matchesUser;
  });

  const totalLoggedMinutes = filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.taskMinutes || 0) + Number(worklog.meetingMinutes || 0) + Number(worklog.documentationMinutes || 0), 0);
  const totalLoggedHours = toHours(totalLoggedMinutes);

  const completedTasks = filteredTasks.filter((task) => task.status === 'COMPLETED').length;
  const completedTasksPercentage = filteredTasks.length ? Number(((completedTasks / filteredTasks.length) * 100).toFixed(2)) : 0;

  const projectHourMap = filteredTasks.reduce((acc, task) => {
    const projectId = task.projectId;
    if (!projectId) return acc;
    const projectName = projects.find((candidate) => Number(candidate.id) === Number(projectId))?.name || 'Unassigned';
    acc[projectName] = (acc[projectName] || 0) + Number(task.actualMinutes || 0);
    return acc;
  }, {});

  filteredWorklogs.forEach((worklog) => {
    const task = filteredTasks.find((candidate) => Number(candidate.id) === Number(worklog.taskId));
    const projectId = task?.projectId ?? worklog.projectId;
    if (!projectId) return;
    const projectName = projects.find((candidate) => Number(candidate.id) === Number(projectId))?.name || 'Unassigned';
    const minutes = Number(worklog.taskMinutes || 0) + Number(worklog.meetingMinutes || 0) + Number(worklog.documentationMinutes || 0);
    projectHourMap[projectName] = (projectHourMap[projectName] || 0) + minutes;
  });

  const projectBreakdown = Object.entries(projectHourMap)
    .map(([name, minutes]) => {
      const project = projects.find((candidate) => candidate.name === name);
      const projectTasks = filteredTasks.filter((task) => Number(task.projectId) === Number(project?.id));
      const completedProjectTasks = projectTasks.filter((task) => task.status === 'COMPLETED').length;
      const progress = projectTasks.length ? Number(((completedProjectTasks / projectTasks.length) * 100).toFixed(0)) : 0;
      const averageCompletionTime = projectTasks.length
        ? Number((projectTasks.reduce((sum, task) => sum + Number(task.actualMinutes || 0), 0) / projectTasks.length / 60).toFixed(1))
        : 0;
      return {
        id: project?.id || null,
        name,
        hours: toHours(minutes),
        taskCount: projectTasks.length,
        completedTasks: completedProjectTasks,
        progress,
        averageCompletionTime,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const taskBreakdown = filteredTasks
    .map((task) => ({
      id: task.id,
      name: task.title,
      hours: toHours(Number(task.actualMinutes || 0)),
      status: task.status,
      projectId: task.projectId,
      projectName: projects.find((candidate) => Number(candidate.id) === Number(task.projectId))?.name || 'Unassigned',
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  const monthlyTrend = [
    { name: 'Jan', hours: 0 },
    { name: 'Feb', hours: 0 },
    { name: 'Mar', hours: 0 },
    { name: 'Apr', hours: 0 },
    { name: 'May', hours: 0 },
    { name: 'Jun', hours: 0 },
    { name: 'Jul', hours: 0 },
    { name: 'Aug', hours: 0 },
    { name: 'Sep', hours: 0 },
    { name: 'Oct', hours: 0 },
    { name: 'Nov', hours: 0 },
    { name: 'Dec', hours: 0 },
  ];

  filteredWorklogs.forEach((worklog) => {
    const date = normalizeDate(worklog.logDate);
    if (!date) return;
    const month = date.getMonth();
    const minutes = Number(worklog.taskMinutes || 0) + Number(worklog.meetingMinutes || 0) + Number(worklog.documentationMinutes || 0);
    monthlyTrend[month].hours += toHours(minutes);
  });

  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return { name: date.toLocaleDateString('en', { weekday: 'short' }), hours: 0 };
  });

  filteredWorklogs.forEach((worklog) => {
    const date = normalizeDate(worklog.logDate);
    if (!date) return;
    const idx = weeklyTrend.findIndex((entry) => entry.name === date.toLocaleDateString('en', { weekday: 'short' }));
    if (idx >= 0) {
      const minutes = Number(worklog.taskMinutes || 0) + Number(worklog.meetingMinutes || 0) + Number(worklog.documentationMinutes || 0);
      weeklyTrend[idx].hours += toHours(minutes);
    }
  });

  const totalMinutesInRange = filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.taskMinutes || 0) + Number(worklog.meetingMinutes || 0) + Number(worklog.documentationMinutes || 0), 0);
  const expectedHours = Math.max(1, new Set(filteredWorklogs.map((worklog) => getDateKey(worklog.logDate)).filter(Boolean)).size * DEFAULT_EXPECTED_HOURS);
  const overtimeMinutes = Math.max(0, totalMinutesInRange - expectedHours * 60);
  const overtimeHours = toHours(overtimeMinutes);
  const normalHours = totalLoggedHours - overtimeHours;

  const timeDistribution = [
    { name: 'Task work', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.taskMinutes || 0), 0) },
    { name: 'Meetings', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.meetingMinutes || 0), 0) },
    { name: 'Documentation', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.documentationMinutes || 0), 0) },
    { name: 'Idle', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.idleMinutes || 0), 0) },
  ];
  const totalDistributionMinutes = Math.max(1, timeDistribution.reduce((sum, item) => sum + item.minutes, 0));
  const distribution = timeDistribution.map((item) => ({
    ...item,
    hours: toHours(item.minutes),
    percentage: Number(((item.minutes / totalDistributionMinutes) * 100).toFixed(1)),
  }));

  const taskCompletionSummary = {
    completed: completedTasks,
    pending: filteredTasks.length - completedTasks,
    averageTimePerTask: filteredTasks.length ? Number((filteredTasks.reduce((sum, task) => sum + Number(task.actualMinutes || 0), 0) / filteredTasks.length / 60).toFixed(1)) : 0,
  };

  return {
    summary: {
      totalLoggedHours: Number(totalLoggedHours.toFixed(2)),
      completedTasksPercentage: Number(completedTasksPercentage.toFixed(2)),
      activeProjects: activeProjects.length,
      overtimeHours: Number(overtimeHours.toFixed(2)),
      totalLoggedMinutes,
      formattedTotalHours: formatHours(totalLoggedHours),
      formattedOvertimeHours: formatHours(overtimeHours),
    },
    projectBreakdown,
    taskBreakdown,
    weeklyTrend,
    monthlyTrend,
    timeDistribution: distribution,
    taskCompletionSummary,
    overtime: {
      normalHours: Number(clamp(normalHours, 0, Number.MAX_SAFE_INTEGER).toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      expectedHours: Number(expectedHours.toFixed(2)),
    },
    filtersApplied: {
      users,
      projects,
    },
  };
};
