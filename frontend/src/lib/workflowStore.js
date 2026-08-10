import api from './api.js';

// Plans and worklogs live in the database. The browser copy is only a mirror that
// keeps the screens usable when the API is unreachable; every read refreshes it and
// every write pushes to the server, so the two never drift on purpose.
const PLAN_CACHE_KEY = 'plannerEntries';
const WORKLOG_CACHE_KEY = 'worklogEntries';

export const WORKLOG_UPDATED_EVENT = 'worklog-updated';

const readCache = (key) => {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

const writeCache = (key, entries) => {
  try {
    localStorage.setItem(key, JSON.stringify(entries));
  } catch (error) {
    // A full or disabled storage must not break saving to the server.
  }
};

const cacheEntry = (key, dateKey, entry) => {
  const entries = readCache(key);
  if (entry === null) {
    delete entries[dateKey];
  } else {
    entries[dateKey] = entry;
  }
  writeCache(key, entries);
};

const isMissing = (error) => error?.response?.status === 404;

export const toPlanEntry = (row) => ({
  tasks: Array.isArray(row?.tasks) ? row.tasks : [],
  meetings: Array.isArray(row?.meetings) ? row.meetings : [],
  documentation: row?.documentation && typeof row.documentation === 'object' ? row.documentation : {},
  others: row?.others && typeof row.others === 'object' ? row.others : {},
  status: row?.status || 'DRAFT',
  totalPlannedMinutes: Number(row?.totalPlannedMinutes || 0),
  savedAt: row?.updatedAt || row?.savedAt || null,
});

export const toWorklogEntry = (row) => ({
  details: Array.isArray(row?.details) ? row.details : [],
  plannedMinutes: Number(row?.plannedMinutes || 0),
  actualMinutes: Number(row?.actualMinutes || 0),
  remarks: row?.remarks || '',
  completionStatus: row?.completionStatus || 'ONGOING',
  status: row?.status || 'DRAFT',
  updatedAt: row?.updatedAt || null,
});

const keyOf = (row, field) => String(row?.[field] || '').slice(0, 10);

export const fetchPlan = async (dateKey) => {
  try {
    const { data } = await api.get(`/daily-plans/${dateKey}`);
    const entry = toPlanEntry(data);
    cacheEntry(PLAN_CACHE_KEY, dateKey, entry);
    return entry;
  } catch (error) {
    if (isMissing(error)) {
      cacheEntry(PLAN_CACHE_KEY, dateKey, null);
      return null;
    }
    return readCache(PLAN_CACHE_KEY)[dateKey] || null;
  }
};

const planPayload = (entry) => ({
  tasks: entry.tasks || [],
  meetings: entry.meetings || [],
  documentation: entry.documentation || {},
  others: entry.others || {},
  status: entry.status || 'DRAFT',
  totalPlannedMinutes: Number(entry.totalPlannedMinutes || 0),
});

export const savePlan = async (dateKey, entry) => {
  cacheEntry(PLAN_CACHE_KEY, dateKey, entry);
  try {
    const { data } = await api.put(`/daily-plans/${dateKey}`, planPayload(entry));
    const saved = toPlanEntry(data);
    cacheEntry(PLAN_CACHE_KEY, dateKey, saved);
    return saved;
  } catch (error) {
    // Keep the work and mark it so the next successful session pushes it up.
    cacheEntry(PLAN_CACHE_KEY, dateKey, { ...entry, pendingSync: true });
    throw error;
  }
};

export const fetchPlans = async (dateFrom, dateTo) => {
  try {
    const { data } = await api.get('/daily-plans', { params: { dateFrom, dateTo } });
    const entries = (data || []).reduce((acc, row) => ({ ...acc, [keyOf(row, 'planDate')]: toPlanEntry(row) }), {});
    writeCache(PLAN_CACHE_KEY, { ...readCache(PLAN_CACHE_KEY), ...entries });
    return entries;
  } catch (error) {
    return readCache(PLAN_CACHE_KEY);
  }
};

export const fetchWorklog = async (dateKey) => {
  try {
    const { data } = await api.get(`/worklogs/${dateKey}`);
    const entry = toWorklogEntry(data);
    cacheEntry(WORKLOG_CACHE_KEY, dateKey, entry);
    return entry;
  } catch (error) {
    if (isMissing(error)) {
      cacheEntry(WORKLOG_CACHE_KEY, dateKey, null);
      return null;
    }
    return readCache(WORKLOG_CACHE_KEY)[dateKey] || null;
  }
};

const worklogPayload = (entry) => ({
  details: entry.details || [],
  remarks: entry.remarks || '',
  completionStatus: entry.completionStatus || 'ONGOING',
  status: entry.status || 'DRAFT',
});

export const saveWorklog = async (dateKey, entry) => {
  cacheEntry(WORKLOG_CACHE_KEY, dateKey, entry);
  try {
    const { data } = await api.put(`/worklogs/${dateKey}`, worklogPayload(entry));
    const saved = toWorklogEntry(data);
    cacheEntry(WORKLOG_CACHE_KEY, dateKey, saved);
    window.dispatchEvent(new Event(WORKLOG_UPDATED_EVENT));
    return saved;
  } catch (error) {
    // Keep the work and mark it so the next successful session pushes it up.
    cacheEntry(WORKLOG_CACHE_KEY, dateKey, { ...entry, pendingSync: true });
    throw error;
  }
};

const hasContent = (entry, fields) => fields.some((field) => {
  const value = entry?.[field];
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.values(value).some((inner) => inner !== '' && inner != null);
  return false;
});

// Recovery pass. Plans and worklogs used to live only in the browser, and a save
// made against an expired session also stays there. On every sign-in we push
// anything the database does not already have for that date, so nothing is lost.
let syncRun = null;

export const syncLocalEntries = async () => {
  if (syncRun) return syncRun;
  syncRun = runLocalSync();
  return syncRun;
};

const runLocalSync = async () => {
  const results = { plans: 0, worklogs: 0 };

  try {
    const [serverPlans, serverWorklogs] = await Promise.all([
      api.get('/daily-plans').then(({ data }) => new Set((data || []).map((row) => keyOf(row, 'planDate')))),
      api.get('/worklogs').then(({ data }) => new Set((data || []).map((row) => keyOf(row, 'logDate')))),
    ]);

    const localPlans = readCache(PLAN_CACHE_KEY);
    for (const [dateKey, entry] of Object.entries(localPlans)) {
      const worthKeeping = entry?.pendingSync || hasContent(entry, ['tasks', 'meetings', 'documentation', 'others']);
      if (serverPlans.has(dateKey) && !entry?.pendingSync) continue;
      if (!worthKeeping) continue;
      try {
        const { data } = await api.put(`/daily-plans/${dateKey}`, planPayload(entry));
        cacheEntry(PLAN_CACHE_KEY, dateKey, toPlanEntry(data));
        results.plans += 1;
      } catch (error) {
        // Leave it cached; the next sign-in retries it.
      }
    }

    const localWorklogs = readCache(WORKLOG_CACHE_KEY);
    for (const [dateKey, entry] of Object.entries(localWorklogs)) {
      const worthKeeping = entry?.pendingSync || hasContent(entry, ['details']);
      if (serverWorklogs.has(dateKey) && !entry?.pendingSync) continue;
      if (!worthKeeping) continue;
      try {
        const { data } = await api.put(`/worklogs/${dateKey}`, worklogPayload(entry));
        cacheEntry(WORKLOG_CACHE_KEY, dateKey, toWorklogEntry(data));
        results.worklogs += 1;
      } catch (error) {
        // Leave it cached; the next sign-in retries it.
      }
    }

    if (results.worklogs > 0) window.dispatchEvent(new Event(WORKLOG_UPDATED_EVENT));
  } catch (error) {
    // Offline or signed out: nothing to reconcile right now.
  }

  return results;
};

export const fetchWorklogs = async (dateFrom, dateTo) => {
  try {
    const { data } = await api.get('/worklogs', { params: { dateFrom, dateTo } });
    const entries = (data || []).reduce((acc, row) => ({ ...acc, [keyOf(row, 'logDate')]: toWorklogEntry(row) }), {});
    writeCache(WORKLOG_CACHE_KEY, { ...readCache(WORKLOG_CACHE_KEY), ...entries });
    return entries;
  } catch (error) {
    return readCache(WORKLOG_CACHE_KEY);
  }
};
