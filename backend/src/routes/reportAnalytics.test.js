import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAnalyticsPayload } from './reportAnalytics.js';

const projects = [{ id: 1, name: 'Portal', status: 'ACTIVE' }];

// A day's worklog holding one session against the Portal project.
const worklog = (id, logDate, details) => ({
  id,
  logDate,
  taskMinutes: details.reduce((sum, detail) => sum + Number(detail.actualMinutes || 0), 0),
  details,
});

const session = (status, actualMinutes, plannedMinutes = 0, title = 'Build UI') => ({
  id: 'task-0',
  title,
  projectId: 1,
  status,
  actualMinutes,
  plannedMinutes,
});

test('a task carried across days is counted once, with its latest status', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    worklogs: [
      worklog(1, '2026-08-10', [session('ONGOING', 120, 180)]),
      worklog(2, '2026-08-11', [session('COMPLETED', 60, 60)]),
    ],
    filters: {},
  });

  assert.equal(analytics.taskCompletionSummary.completed, 1);
  assert.equal(analytics.taskCompletionSummary.pending, 0);
  assert.equal(analytics.taskCompletionSummary.inProgress, 0);
  assert.equal(analytics.summary.completedTasksPercentage, 100);
  assert.equal(analytics.meta.totalTasks, 1);
  assert.equal(analytics.openTasks.length, 0);
  // The hours still come from both days.
  assert.equal(analytics.taskBreakdown[0].hours, 3);
});

test('a project rolls up distinct tasks, not one entry per logged day', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    worklogs: [
      worklog(1, '2026-08-10', [session('ONGOING', 120)]),
      worklog(2, '2026-08-11', [session('COMPLETED', 60)]),
    ],
    filters: {},
  });

  const portal = analytics.projectBreakdown.find((entry) => entry.name === 'Portal');
  assert.equal(portal.taskCount, 1);
  assert.equal(portal.completedTasks, 1);
  assert.equal(portal.progress, 100);
  assert.equal(portal.hours, 3);
});

test('work logged again after it was completed goes back to open', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    worklogs: [
      worklog(1, '2026-08-10', [session('COMPLETED', 120)]),
      worklog(2, '2026-08-11', [session('ONGOING', 60)]),
    ],
    filters: {},
  });

  assert.equal(analytics.taskCompletionSummary.completed, 0);
  assert.equal(analytics.taskCompletionSummary.inProgress, 1);
  assert.equal(analytics.openTasks.length, 1);
  assert.equal(analytics.openTasks[0].lastDate, '2026-08-11');
});

test('the newest day wins whatever order the worklogs arrive in', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    worklogs: [
      worklog(2, '2026-08-11', [session('COMPLETED', 60)]),
      worklog(1, '2026-08-10', [session('ONGOING', 120)]),
    ],
    filters: {},
  });

  assert.equal(analytics.taskCompletionSummary.completed, 1);
  assert.equal(analytics.taskCompletionSummary.pending, 0);
});

test('an undated Task row never displaces a dated session status', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    tasks: [{ id: 7, title: 'Build UI', projectId: 1, status: 'PLANNED', actualMinutes: 0 }],
    worklogs: [worklog(1, '2026-08-11', [session('COMPLETED', 60)])],
    filters: {},
  });

  assert.equal(analytics.meta.totalTasks, 1);
  assert.equal(analytics.taskCompletionSummary.completed, 1);
});

test('two different tasks are still counted apart', () => {
  const analytics = buildAnalyticsPayload({
    projects,
    worklogs: [
      worklog(1, '2026-08-10', [
        session('COMPLETED', 60),
        { ...session('ONGOING', 60, 0, 'Write docs'), id: 'task-1' },
      ]),
    ],
    filters: {},
  });

  assert.equal(analytics.meta.totalTasks, 2);
  assert.equal(analytics.taskCompletionSummary.completed, 1);
  assert.equal(analytics.taskCompletionSummary.inProgress, 1);
  assert.equal(analytics.taskCompletionSummary.pending, 1);
});
