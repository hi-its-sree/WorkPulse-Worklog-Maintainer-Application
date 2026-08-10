// Mirrors the Project.status enum in the backend model. The UI works in these
// values, so anything read from or written to the API round-trips unchanged.
export const PROJECT_STATUSES = ['PLANNED', 'ACTIVE', 'AT_RISK', 'ON_HOLD', 'COMPLETED'];

const STATUS_KEYS = {
  PLANNED: 'planning',
  ACTIVE: 'active',
  AT_RISK: 'atRisk',
  ON_HOLD: 'onHold',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Older records (and the previous UI) used title-case labels; fold those onto
// the enum so filtering and the summary counts see one vocabulary.
const LEGACY_ALIASES = {
  Planning: 'PLANNED',
  Active: 'ACTIVE',
  'At Risk': 'AT_RISK',
  'On Hold': 'ON_HOLD',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
};

export const normalizeProjectStatus = (status) => {
  if (!status) return 'PLANNED';
  if (LEGACY_ALIASES[status]) return LEGACY_ALIASES[status];
  const upper = String(status).toUpperCase().replace(/\s+/g, '_');
  return STATUS_KEYS[upper] ? upper : status;
};

export const getProjectStatusLabel = (status, strings) => {
  const key = STATUS_KEYS[normalizeProjectStatus(status)];
  return strings?.projects?.statuses?.[key] || status;
};
