import { describe, expect, it } from 'vitest';
import { buildExecutionDetails } from './WorklogPage.jsx';

const strings = {
  worklog: {
    detailTypes: { task: 'Task', meeting: 'Meeting', documentation: 'Documentation', other: 'Other' },
    taskFallback: 'Task {index}',
    meetingFallback: 'Meeting {index}',
    othersTitle: 'Others',
  },
};

const plan = {
  tasks: [
    { title: 'Morning assembly', planned: '', isMorningAssembly: true },
    { title: 'BBox mode debugging', projectId: 2, project: 'EyeNaviGO', projectNumber: 'PRJ-001', planned: '300' },
  ],
  meetings: [{ title: 'Standup', from: '09:00', to: '09:30' }],
  documentation: { planned: '30', description: 'Notes' },
  others: { planned: '', description: '' },
};

describe('buildExecutionDetails', () => {
  it('lists the planned sessions on a day that has no saved worklog yet', () => {
    const details = buildExecutionDetails(plan, null, strings);

    expect(details.map((detail) => detail.id)).toEqual(['task-0', 'task-1', 'meeting-0', 'documentation', 'others']);
    expect(details[1]).toMatchObject({ title: 'BBox mode debugging', plannedMinutes: 300, projectNumber: 'PRJ-001' });
    expect(details[2].plannedMinutes).toBe(30);
    expect(details.every((detail) => detail.status === 'PENDING_TO_START')).toBe(true);
  });

  it('keeps actuals and statuses already recorded against the plan', () => {
    const existing = { details: [{ id: 'task-1', actualMinutes: '320', status: 'COMPLETED', remarks: 'done' }] };
    const details = buildExecutionDetails(plan, existing, strings);

    expect(details.find((detail) => detail.id === 'task-1')).toMatchObject({
      actualMinutes: 320,
      status: 'COMPLETED',
      remarks: 'done',
    });
  });

  it('keeps sessions that no longer exist in the plan', () => {
    const existing = { details: [{ id: 'task-9', title: 'Removed from plan', actualMinutes: 45 }] };
    const details = buildExecutionDetails(plan, existing, strings);

    expect(details.some((detail) => detail.id === 'task-9')).toBe(true);
  });
});
