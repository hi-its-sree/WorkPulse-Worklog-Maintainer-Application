// The same piece of work is logged again on every day it is worked on, and the
// title is rarely typed identically twice ("BBox mode debugging", "BBox overlay
// and debug screen"). Grouping folds those repeats into one task row carrying the
// days it was worked and the total time.

// Case, surrounding space and doubled spaces are treated as the same task.
export const normalizeTaskKey = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

// Words that carry no meaning of their own when comparing two titles.
const FILLER_WORDS = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'for', 'to', 'in', 'on', 'at', 'with', 'into', 'from', 'by']);

// Light stemming so "debugging"/"debug" and "implementation"/"implement" match.
const stem = (word) => {
  let stemmed = word;
  if (stemmed.length > 6 && stemmed.endsWith('ation')) stemmed = stemmed.slice(0, -5);
  else if (stemmed.length > 5 && stemmed.endsWith('ment')) stemmed = stemmed.slice(0, -4);
  else if (stemmed.length > 4 && stemmed.endsWith('ing')) {
    stemmed = stemmed.slice(0, -3);
    if (stemmed.length > 2 && stemmed[stemmed.length - 1] === stemmed[stemmed.length - 2]) stemmed = stemmed.slice(0, -1);
  } else if (stemmed.length > 4 && stemmed.endsWith('ed')) stemmed = stemmed.slice(0, -2);
  else if (stemmed.length > 3 && stemmed.endsWith('s') && !stemmed.endsWith('ss')) stemmed = stemmed.slice(0, -1);
  return stemmed;
};

export const tokenizeTask = (value) => {
  const tokens = normalizeTaskKey(value)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !FILLER_WORDS.has(token))
    .map(stem);
  return new Set(tokens);
};

// Dice coefficient over the meaningful words of both titles: 1 when they say the
// same thing, 0 when they share nothing.
export const taskSimilarity = (left, right) => {
  if (normalizeTaskKey(left) === normalizeTaskKey(right)) return 1;
  const leftTokens = tokenizeTask(left);
  const rightTokens = tokenizeTask(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

  let shared = 0;
  leftTokens.forEach((token) => { if (rightTokens.has(token)) shared += 1; });
  return (2 * shared) / (leftTokens.size + rightTokens.size);
};

// How willing the grouping is to treat two differently worded titles as one task.
export const MATCH_MODES = ['exact', 'similar', 'loose'];

export const MATCH_THRESHOLDS = {
  exact: 1,
  similar: 0.7,
  loose: 0.55,
};

const uniqueInOrder = (values) => Array.from(new Set(values.filter(Boolean)));

// Rows are tied to a project by its id so a renamed project keeps one history.
// Rows recorded before the project picker only carry a name, so that is the fallback.
export const projectKeyOf = (row) => (row?.projectId ? `id:${row.projectId}` : `name:${normalizeTaskKey(row?.project)}`);

export const projectLabelOf = (row) => {
  const code = row?.projectNumber ? String(row.projectNumber).trim() : '';
  return code ? `${code} — ${row.project}` : row?.project || '';
};

// Titles connected by similarity end up in the same bucket, so a chain of
// rewordings collapses into one task instead of a row per wording.
const clusterTitles = (titles, threshold) => {
  const clusters = [];

  titles.forEach((title) => {
    const matching = clusters.filter((cluster) => cluster.some((member) => taskSimilarity(member, title) >= threshold));
    if (matching.length === 0) {
      clusters.push([title]);
      return;
    }
    const [first, ...rest] = matching;
    first.push(title);
    rest.forEach((cluster) => {
      first.push(...cluster);
      clusters.splice(clusters.indexOf(cluster), 1);
    });
  });

  return clusters;
};

export const groupRecordsByTask = (rows = [], { matchMode = 'similar' } = {}) => {
  const threshold = MATCH_THRESHOLDS[matchMode] ?? MATCH_THRESHOLDS.similar;

  // Tasks are only ever compared inside the same project.
  const byProject = new Map();
  rows.forEach((row) => {
    const projectKey = projectKeyOf(row);
    if (!byProject.has(projectKey)) byProject.set(projectKey, []);
    byProject.get(projectKey).push(row);
  });

  const groups = [];

  byProject.forEach((projectRows) => {
    const titles = uniqueInOrder(projectRows.map((row) => normalizeTaskKey(row.task)));
    const clusters = clusterTitles(titles, threshold);

    clusters.forEach((cluster, index) => {
      const members = new Set(cluster);
      const entries = projectRows
        .filter((row) => members.has(normalizeTaskKey(row.task)))
        .sort((left, right) => left.dateKey.localeCompare(right.dateKey));
      if (entries.length === 0) return;

      const dateKeys = uniqueInOrder(entries.map((entry) => entry.dateKey));
      const latest = entries[entries.length - 1];

      // The wording with the most time behind it names the group.
      const hoursByName = entries.reduce((acc, entry) => {
        acc.set(entry.task, (acc.get(entry.task) || 0) + Number(entry.loggedHours || 0));
        return acc;
      }, new Map());
      const [leadName] = Array.from(hoursByName.entries()).sort((left, right) => right[1] - left[1])[0] || [entries[0].task];

      groups.push({
        key: `${projectKeyOf(entries[0])}::${cluster[0]}::${index}`,
        task: leadName,
        projectId: entries[0].projectId || '',
        projectNumber: entries[0].projectNumber || '',
        project: entries[0].project,
        projectLabel: projectLabelOf(entries[0]),
        category: entries[0].category,
        entries,
        dateKeys,
        // Distinct spellings that were merged, so a reworded title stays visible.
        aliases: uniqueInOrder(entries.map((entry) => entry.task)),
        dayCount: dateKeys.length,
        firstDateKey: dateKeys[0],
        lastDateKey: dateKeys[dateKeys.length - 1],
        firstDateLabel: entries[0]?.dateLabel || '',
        lastDateLabel: latest?.dateLabel || '',
        loggedHours: entries.reduce((sum, entry) => sum + Number(entry.loggedHours || 0), 0),
        descriptions: uniqueInOrder(entries.map((entry) => entry.description)),
        // The newest entry describes where the task stands now.
        status: latest?.status || '',
        completed: entries.every((entry) => entry.completed),
      });
    });
  });

  return groups.sort((left, right) => right.loggedHours - left.loggedHours);
};
