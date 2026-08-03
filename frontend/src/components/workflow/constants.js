export const WORKFLOW_STATUSES = {
  PLANNED: 'PLANNED',
  IN_PROGRESS: 'IN_PROGRESS',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
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
