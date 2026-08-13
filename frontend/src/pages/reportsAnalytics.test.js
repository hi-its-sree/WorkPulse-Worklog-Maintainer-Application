import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReportAnalytics } from './reportsAnalytics.js';

test('buildReportAnalytics aggregates totals and overtime from worklogs and tasks', () => {
  const analytics = buildReportAnalytics({
    projects: [
      { id: 1, name: 'Portal', status: 'ACTIVE' },
      { id: 2, name: 'ERP', status: 'ACTIVE' },
    ],
    tasks: [
      { id: 1, title: 'Design API', actualMinutes: 180, status: 'COMPLETED', projectId: 1, startTime: '2026-08-01T09:00:00.000Z', endTime: '2026-08-01T10:00:00.000Z' },
      { id: 2, title: 'Build UI', actualMinutes: 240, status: 'IN_PROGRESS', projectId: 1, startTime: '2026-08-02T09:00:00.000Z', endTime: '2026-08-02T13:00:00.000Z' },
      { id: 3, title: 'Sync data', actualMinutes: 300, status: 'COMPLETED', projectId: 2, startTime: '2026-08-03T09:00:00.000Z', endTime: '2026-08-03T14:00:00.000Z' },
    ],
    worklogs: [
      { logDate: '2026-08-01', taskMinutes: 180, meetingMinutes: 30, documentationMinutes: 0, idleMinutes: 0 },
      { logDate: '2026-08-02', taskMinutes: 240, meetingMinutes: 0, documentationMinutes: 15, idleMinutes: 5 },
      { logDate: '2026-08-03', taskMinutes: 300, meetingMinutes: 60, documentationMinutes: 30, idleMinutes: 0 },
    ],
    users: [{ id: 1, fullName: 'Ava' }],
    filters: {
      dateFrom: '2026-08-01',
      dateTo: '2026-08-03',
      projectId: 'all',
      taskStatus: 'all',
      userId: 'all',
    },
  });

  assert.equal(analytics.summary.totalLoggedHours, 14.25);
  assert.equal(analytics.summary.completedTasksPercentage, 50);
  assert.equal(analytics.summary.activeProjects, 2);
  assert.equal(analytics.summary.overtimeHours, 0);
  assert.equal(analytics.projectBreakdown[0].name, 'Portal');
  assert.equal(analytics.taskBreakdown[0].name, 'Build UI');
  assert.equal(analytics.overtime.normalHours, 14.25);
  assert.equal(analytics.overtime.overtimeHours, 0);
});
