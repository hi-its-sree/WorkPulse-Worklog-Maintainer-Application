import { describe, expect, it } from 'vitest';
import { groupRecordsByTask, normalizeTaskKey, taskSimilarity, tokenizeTask } from './timesheetGrouping.js';

const row = (overrides) => ({
  dateKey: '2026-08-06',
  dateLabel: 'Aug 6, 2026',
  task: 'BBox mode debugging',
  project: 'EyeNaviGO',
  description: '',
  loggedHours: 1,
  status: 'Ongoing',
  category: 'Task',
  completed: false,
  ...overrides,
});

// The titles as they were actually logged.
const REAL_TITLES = [
  'BBox and debug screen Implementation',
  'Bug fixing',
  'BBox overlay and debug screen',
  'BBox mode debugging',
  'OpenCV debug screen Implementation',
];

const realRows = REAL_TITLES.map((task, index) => row({
  task,
  dateKey: `2026-08-0${index + 3}`,
  dateLabel: `Aug ${index + 3}, 2026`,
  loggedHours: index + 1,
}));

describe('task matching', () => {
  it('reduces words to a comparable stem', () => {
    expect(Array.from(tokenizeTask('BBox and debug screen Implementation'))).toEqual(['bbox', 'debug', 'screen', 'implement']);
    expect(Array.from(tokenizeTask('Bug fixing'))).toEqual(['bug', 'fix']);
    expect(Array.from(tokenizeTask('BBox mode debugging'))).toEqual(['bbox', 'mode', 'debug']);
  });

  it('scores rewordings of the same work above unrelated work', () => {
    const related = taskSimilarity('BBox overlay and debug screen', 'BBox and debug screen Implementation');
    const unrelated = taskSimilarity('BBox mode debugging', 'Bug fixing');

    expect(related).toBeGreaterThan(0.7);
    expect(unrelated).toBe(0);
  });

  it('treats casing and stray spacing as identical', () => {
    expect(taskSimilarity('BBox mode debugging', '  bbox   mode  Debugging ')).toBe(1);
  });
});

describe('grouping the real timesheet titles', () => {
  it('exact mode keeps every wording on its own row', () => {
    const grouped = groupRecordsByTask(realRows, { matchMode: 'exact' });
    expect(grouped).toHaveLength(5);
  });

  it('similar mode merges the debug-screen wordings and leaves bug fixing alone', () => {
    const grouped = groupRecordsByTask(realRows, { matchMode: 'similar' });
    const bugFixing = grouped.find((group) => group.aliases.includes('Bug fixing'));

    expect(grouped.length).toBeLessThan(5);
    expect(bugFixing.aliases).toEqual(['Bug fixing']);
  });

  it('loose mode collapses all the BBox and debug screen work into one task', () => {
    const grouped = groupRecordsByTask(realRows, { matchMode: 'loose' });
    const bugFixing = grouped.find((group) => group.aliases.includes('Bug fixing'));
    const biggest = grouped.find((group) => group.aliases.length > 1);

    expect(grouped).toHaveLength(2);
    expect(biggest.aliases).toHaveLength(4);
    expect(biggest.loggedHours).toBe(1 + 3 + 4 + 5);
    // Unrelated work is never swept in, whatever the strictness.
    expect(bugFixing.aliases).toEqual(['Bug fixing']);
  });

  it('names a merged task after the wording with the most time behind it', () => {
    const grouped = groupRecordsByTask(realRows, { matchMode: 'loose' });
    const biggest = grouped.find((group) => group.aliases.length > 1);

    expect(biggest.task).toBe('OpenCV debug screen Implementation');
  });
});

describe('timesheet grouping', () => {
  it('folds the same task logged on several days into one row', () => {
    const grouped = groupRecordsByTask([
      row({ dateKey: '2026-08-06', dateLabel: 'Aug 6, 2026', loggedHours: 5 }),
      row({ dateKey: '2026-08-07', dateLabel: 'Aug 7, 2026', loggedHours: 3, status: 'Completed', completed: true }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].loggedHours).toBe(8);
    expect(grouped[0].dayCount).toBe(2);
    expect(grouped[0].firstDateKey).toBe('2026-08-06');
    expect(grouped[0].lastDateKey).toBe('2026-08-07');
    expect(grouped[0].status).toBe('Completed');
  });

  it('keeps the same task name apart when it belongs to different projects', () => {
    const grouped = groupRecordsByTask([
      row({ projectId: 2, project: 'EyeNaviGO' }),
      row({ projectId: 3, project: 'Other project' }),
    ]);

    expect(grouped).toHaveLength(2);
  });

  it('follows the project id, so a renamed project keeps one history', () => {
    const grouped = groupRecordsByTask([
      row({ projectId: 2, project: 'EyeNaviGO', projectNumber: 'PRJ-001' }),
      row({ dateKey: '2026-08-07', projectId: 2, project: 'EyeNavi GO', projectNumber: 'PRJ-001' }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].dayCount).toBe(2);
    expect(grouped[0].projectLabel).toBe('PRJ-001 — EyeNaviGO');
  });

  it('separates two projects that happen to share a name', () => {
    const grouped = groupRecordsByTask([
      row({ projectId: 2, project: 'Migration' }),
      row({ projectId: 9, project: 'Migration' }),
    ]);

    expect(grouped).toHaveLength(2);
  });

  it('reads a carried-over task from its most recent day, not from both', () => {
    const grouped = groupRecordsByTask([
      row({ dateKey: '2026-08-06', status: 'Ongoing', completed: false }),
      row({ dateKey: '2026-08-07', status: 'Completed', completed: true }),
    ]);

    expect(grouped).toHaveLength(1);
    expect(grouped[0].status).toBe('Completed');
    expect(grouped[0].completed).toBe(true);
  });

  it('reopens a task that was logged again after being completed', () => {
    const grouped = groupRecordsByTask([
      row({ dateKey: '2026-08-06', status: 'Completed', completed: true }),
      row({ dateKey: '2026-08-07', status: 'Ongoing', completed: false }),
    ]);

    expect(grouped[0].status).toBe('Ongoing');
    expect(grouped[0].completed).toBe(false);
  });

  it('settles the status by date, whatever order the days arrive in', () => {
    const grouped = groupRecordsByTask([
      row({ dateKey: '2026-08-07', status: 'Completed', completed: true }),
      row({ dateKey: '2026-08-06', status: 'Ongoing', completed: false }),
    ]);

    expect(grouped[0].status).toBe('Completed');
    expect(grouped[0].completed).toBe(true);
  });

  it('sorts the heaviest task first', () => {
    const grouped = groupRecordsByTask([
      row({ task: 'Small', loggedHours: 1 }),
      row({ task: 'Big report writing', loggedHours: 6 }),
    ]);

    expect(grouped.map((group) => group.task)).toEqual(['Big report writing', 'Small']);
  });

  it('normalizes blank and missing titles without throwing', () => {
    expect(normalizeTaskKey(undefined)).toBe('');
    expect(normalizeTaskKey('  A   B ')).toBe('a b');
    expect(taskSimilarity('', 'anything')).toBe(0);
  });
});
