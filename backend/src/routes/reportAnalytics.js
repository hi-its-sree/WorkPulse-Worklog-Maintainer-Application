const DEFAULT_EXPECTED_HOURS = 8;

const toHours = (minutes) => Number((minutes / 60).toFixed(2));

// Everything recorded against the day, including work filed under "Other".
const loggedMinutesOf = (worklog) => Number(worklog.taskMinutes || 0)
  + Number(worklog.meetingMinutes || 0)
  + Number(worklog.documentationMinutes || 0)
  + Number(worklog.otherMinutes || 0);

const formatHours = (value) => `${value.toFixed(1)}h`;

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getDateKey = (value) => {
  const date = normalizeDate(value);
  if (!date) return null;
  return date.toISOString().slice(0, 10);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const buildAnalyticsPayload = ({ projects = [], tasks = [], worklogs = [], users = [], filters = {} }) => {
  const dateFrom = filters.dateFrom ? normalizeDate(filters.dateFrom) : null;
  const dateTo = filters.dateTo ? normalizeDate(filters.dateTo) : null;

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

  const totalLoggedMinutes = filteredWorklogs.reduce((sum, worklog) => sum + loggedMinutesOf(worklog), 0);
  const totalLoggedHours = toHours(totalLoggedMinutes);

  // Work is planned and recorded as worklog sessions in this app, not as Task rows,
  // so the sessions are what the task figures are built from. Task rows still count
  // when something creates them.
  const sessionStatusToTaskStatus = (status) => {
    if (status === 'COMPLETED') return 'COMPLETED';
    if (status === 'ONGOING') return 'IN_PROGRESS';
    return 'PLANNED';
  };

  const sessionTasks = filteredWorklogs.flatMap((worklog) => (Array.isArray(worklog.details) ? worklog.details : [])
    .filter((detail) => Number(detail?.actualMinutes || 0) > 0 || Number(detail?.plannedMinutes || 0) > 0)
    .map((detail) => ({
      id: `${worklog.id}:${detail.id}`,
      title: detail.title || 'Untitled',
      status: sessionStatusToTaskStatus(detail.status),
      actualMinutes: Number(detail.actualMinutes || 0),
      plannedMinutes: Number(detail.plannedMinutes || 0),
      projectId: detail.projectId ? Number(detail.projectId) : null,
      logDate: worklog.logDate,
      fromSession: true,
    }))
    .filter((task) => (filters.projectId && filters.projectId !== 'all'
      ? Number(task.projectId) === Number(filters.projectId)
      : true)));

  const workItems = [...filteredTasks, ...sessionTasks];

  // Work carrying the same name in the same project is one piece of work, however
  // many days it was logged over. The same task is logged again every day it is
  // worked on, so the days disagree: Monday says ONGOING and Tuesday says COMPLETED.
  // The day a status was recorded settles it — the newest entry says where the work
  // stands now. That also lets work reopened after being finished go back to open
  // instead of staying done forever. Rows with no date (standalone Task rows) never
  // displace a dated status.
  const groupWorkItems = (items) => Object.values(items.reduce((acc, task) => {
    const key = `${task.projectId || 'none'}::${String(task.title || '').trim().toLowerCase()}`;
    const dateKey = getDateKey(task.logDate || task.startTime);
    if (!acc[key]) {
      acc[key] = {
        id: task.id,
        name: task.title,
        projectId: task.projectId || null,
        minutes: 0,
        plannedMinutes: 0,
        status: task.status,
        statusDate: dateKey,
        lastDate: null,
        projectName: projects.find((candidate) => Number(candidate.id) === Number(task.projectId))?.name || 'Unassigned',
      };
    }
    acc[key].minutes += Number(task.actualMinutes || 0);
    acc[key].plannedMinutes += Number(task.plannedMinutes || 0);
    if (dateKey && (!acc[key].lastDate || dateKey > acc[key].lastDate)) acc[key].lastDate = dateKey;
    if (!acc[key].statusDate || (dateKey && dateKey >= acc[key].statusDate)) {
      acc[key].status = task.status;
      acc[key].statusDate = dateKey || acc[key].statusDate;
    }
    return acc;
  }, {})).map((task) => ({ ...task, hours: toHours(task.minutes), plannedHours: toHours(task.plannedMinutes) }));

  // Every task figure below counts grouped work, never the per-day rows, so a task
  // carried across days is one task with one status instead of one entry per day.
  const groupedWork = groupWorkItems(workItems);

  const completedTasks = groupedWork.filter((task) => task.status === 'COMPLETED').length;
  const completedTasksPercentage = groupedWork.length ? Number(((completedTasks / groupedWork.length) * 100).toFixed(2)) : 0;

  const activeProjects = projects.filter((project) => ['ACTIVE', 'AT_RISK', 'COMPLETED'].includes(project.status)).length;

  const taskMinutesByProject = filteredTasks.reduce((acc, task) => {
    if (!task.projectId) return acc;
    acc[Number(task.projectId)] = (acc[Number(task.projectId)] || 0) + Number(task.actualMinutes || 0);
    return acc;
  }, {});

  const totalTaskMinutes = Object.values(taskMinutesByProject).reduce((sum, value) => sum + value, 0);

  // Hours are held against the project id, so renaming a project keeps its history
  // in one place. UNASSIGNED collects work that was logged without a project.
  const UNASSIGNED = 'unassigned';
  const minutesByProject = Object.entries(taskMinutesByProject).reduce((acc, [projectId, minutes]) => {
    acc[projectId] = (acc[projectId] || 0) + minutes;
    return acc;
  }, {});

  const addMinutes = (projectId, minutes) => {
    const key = projectId ? String(Number(projectId)) : UNASSIGNED;
    minutesByProject[key] = (minutesByProject[key] || 0) + minutes;
  };

  filteredWorklogs.forEach((worklog) => {
    const details = Array.isArray(worklog.details) ? worklog.details : [];

    // Each session says which project it belongs to, so the time lands exactly there.
    if (details.length > 0) {
      details.forEach((detail) => {
        const minutes = Number(detail?.actualMinutes || 0);
        if (minutes > 0) addMinutes(detail?.projectId, minutes);
      });
      return;
    }

    // Older rows only kept the daily rollup. With no project on them the time is
    // shared out over the projects that have task effort, as it was before.
    const minutes = loggedMinutesOf(worklog);
    if (!minutes) return;
    if (!totalTaskMinutes) {
      addMinutes(null, minutes);
      return;
    }
    Object.entries(taskMinutesByProject).forEach(([projectId, projectMinutes]) => {
      addMinutes(projectId, minutes * (projectMinutes / totalTaskMinutes));
    });
  });

  const projectBreakdown = Object.entries(minutesByProject)
    .map(([projectKey, minutes]) => {
      const project = projectKey === UNASSIGNED ? null : projects.find((candidate) => Number(candidate.id) === Number(projectKey));
      const name = project?.name || 'Unassigned';
      const projectTasks = project
        ? groupedWork.filter((task) => Number(task.projectId) === Number(project.id))
        : groupedWork.filter((task) => !task.projectId);
      const completedProjectTasks = projectTasks.filter((task) => task.status === 'COMPLETED').length;
      const progress = projectTasks.length ? Number(((completedProjectTasks / projectTasks.length) * 100).toFixed(0)) : 0;
      const averageCompletionTime = projectTasks.length
        ? Number((projectTasks.reduce((sum, task) => sum + Number(task.minutes || 0), 0) / projectTasks.length / 60).toFixed(1))
        : 0;
      return {
        id: project?.id || null,
        projectNumber: project?.projectNumber || null,
        name,
        hours: toHours(minutes),
        taskCount: projectTasks.length,
        completedTasks: completedProjectTasks,
        progress,
        averageCompletionTime,
      };
    })
    .sort((a, b) => b.hours - a.hours);

  const taskBreakdown = [...groupedWork].sort((a, b) => b.hours - a.hours).slice(0, 6);

  // What is still open, newest activity first, for the dashboard's task list.
  const openTasks = groupedWork
    .filter((task) => task.status !== 'COMPLETED')
    .sort((left, right) => String(right.lastDate || '').localeCompare(String(left.lastDate || '')))
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

  // A single year's worth of months, so last year's March is not added to this one.
  const trendYear = (dateTo || new Date()).getFullYear();
  filteredWorklogs.forEach((worklog) => {
    const date = normalizeDate(worklog.logDate);
    if (!date || date.getFullYear() !== trendYear) return;
    monthlyTrend[date.getMonth()].hours += toHours(loggedMinutesOf(worklog));
  });

  // The last seven calendar days, ending on the last day in range (today when the
  // range is open). Matching on the weekday name alone piled every past Tuesday
  // onto this Tuesday.
  const trendEnd = dateTo || new Date();
  const weeklyTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(trendEnd);
    date.setDate(date.getDate() - (6 - index));
    return { name: date.toLocaleDateString('en', { weekday: 'short' }), dateKey: getDateKey(date), hours: 0 };
  });

  filteredWorklogs.forEach((worklog) => {
    const entry = weeklyTrend.find((candidate) => candidate.dateKey === getDateKey(worklog.logDate));
    if (entry) entry.hours += toHours(loggedMinutesOf(worklog));
  });

  const timeDistribution = [
    { name: 'Task work', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.taskMinutes || 0), 0) },
    { name: 'Meetings', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.meetingMinutes || 0), 0) },
    { name: 'Documentation', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.documentationMinutes || 0), 0) },
    { name: 'Other', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.otherMinutes || 0), 0) },
    { name: 'Idle', minutes: filteredWorklogs.reduce((sum, worklog) => sum + Number(worklog.idleMinutes || 0), 0) },
  ];

  const totalDistributionMinutes = Math.max(1, timeDistribution.reduce((sum, item) => sum + item.minutes, 0));
  const distribution = timeDistribution.map((item) => ({
    ...item,
    hours: toHours(item.minutes),
    percentage: Number(((item.minutes / totalDistributionMinutes) * 100).toFixed(1)),
  }));

  const expectedHours = Math.max(1, new Set(filteredWorklogs.map((worklog) => getDateKey(worklog.logDate)).filter(Boolean)).size * DEFAULT_EXPECTED_HOURS);
  const overtimeMinutes = Math.max(0, totalLoggedMinutes - expectedHours * 60);
  const overtimeHours = toHours(overtimeMinutes);
  const normalHours = totalLoggedHours - overtimeHours;

  return {
    summary: {
      totalLoggedHours: Number(totalLoggedHours.toFixed(2)),
      completedTasksPercentage: Number(completedTasksPercentage.toFixed(2)),
      activeProjects,
      overtimeHours: Number(overtimeHours.toFixed(2)),
      formattedTotalHours: formatHours(totalLoggedHours),
      formattedOvertimeHours: formatHours(overtimeHours),
    },
    projectBreakdown,
    taskBreakdown,
    weeklyTrend,
    monthlyTrend,
    timeDistribution: distribution,
    openTasks,
    taskCompletionSummary: {
      completed: completedTasks,
      inProgress: groupedWork.filter((task) => task.status === 'IN_PROGRESS').length,
      overdue: groupedWork.filter((task) => task.status === 'BLOCKED').length,
      pending: groupedWork.length - completedTasks,
      averageTimePerTask: groupedWork.length ? Number((groupedWork.reduce((sum, task) => sum + Number(task.minutes || 0), 0) / groupedWork.length / 60).toFixed(1)) : 0,
    },
    overtime: {
      normalHours: Number(clamp(normalHours, 0, Number.MAX_SAFE_INTEGER).toFixed(2)),
      overtimeHours: Number(overtimeHours.toFixed(2)),
      expectedHours: Number(expectedHours.toFixed(2)),
    },
    filtersApplied: {
      projects,
      users,
      filters,
    },
    meta: {
      totalProjects: projects.length,
      totalTasks: groupedWork.length,
      totalWorklogs: worklogs.length,
      totalUsers: users.length,
    },
  };
};
