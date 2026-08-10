export const WORKFLOW_STATUSES = {
  DRAFT: 'DRAFT',
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

// How far along an individual session (task, meeting, documentation, other) is on
// the day it was executed.
export const SESSION_STATUSES = ['PENDING_TO_START', 'ONGOING', 'COMPLETED'];

export const DEFAULT_SESSION_STATUS = 'PENDING_TO_START';

export const getSessionStatusLabel = (status, strings) => {
  const labels = strings?.worklog?.sessionStatuses || {};
  switch (status) {
    case 'ONGOING':
      return labels.ongoing;
    case 'COMPLETED':
      return labels.completed;
    case 'PENDING_TO_START':
      return labels.pendingToStart;
    default:
      return labels.pendingToStart;
  }
};

export const getSessionStatusTone = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'ONGOING':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateKey = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const isSameDate = (left, right) => {
  return left.getFullYear() === right.getFullYear()
    && left.getMonth() === right.getMonth()
    && left.getDate() === right.getDate();
};

// Maps a raw stored status (PLANNED, IN_PROGRESS, ON_TRACK, ...) onto the
// translated label. Unknown values fall through to the raw string.
export const getStatusLabel = (status, strings) => {
  const labels = strings?.common?.statuses || {};
  switch (status) {
    case WORKFLOW_STATUSES.PLANNED:
      return labels.planned;
    case WORKFLOW_STATUSES.IN_PROGRESS:
      return labels.inProgress;
    case WORKFLOW_STATUSES.SUBMITTED:
      return labels.submitted;
    case WORKFLOW_STATUSES.APPROVED:
      return labels.approved;
    case WORKFLOW_STATUSES.REJECTED:
      return labels.rejected;
    case 'COMPLETED':
      return labels.completed;
    case 'CANCELLED':
      return labels.cancelled;
    case 'ON_TRACK':
      return labels.onTrack;
    case 'PENDING_TO_START':
    case 'ONGOING':
      return getSessionStatusLabel(status, strings);
    default:
      return status;
  }
};

export const getStatusTone = (status) => {
  switch (status) {
    case WORKFLOW_STATUSES.APPROVED:
      return 'bg-emerald-100 text-emerald-700';
    case WORKFLOW_STATUSES.REJECTED:
      return 'bg-rose-100 text-rose-700';
    case WORKFLOW_STATUSES.SUBMITTED:
      return 'bg-sky-100 text-sky-700';
    case WORKFLOW_STATUSES.IN_PROGRESS:
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};
