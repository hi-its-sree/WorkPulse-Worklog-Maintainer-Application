const defaultAssemblyTask = { title: 'Morning assembly', projectId: '', project: '', projectNumber: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: true };
const defaultTask = { title: '', projectId: '', project: '', projectNumber: '', description: '', planned: '', status: 'PLANNED', isMorningAssembly: false };
const defaultMeeting = { title: '', from: '', to: '', description: '', type: 'Meeting' };
const defaultSection = { planned: '', description: '' };

export const normalizeSection = (section = {}) => ({
  ...defaultSection,
  ...(section && typeof section === 'object' ? section : {}),
  planned: section?.planned ?? '',
  description: section?.description ?? '',
});

export const normalizeMeeting = (meeting = {}) => ({
  ...defaultMeeting,
  ...(meeting && typeof meeting === 'object' ? meeting : {}),
  title: meeting?.title ?? '',
  from: meeting?.from ?? meeting?.time ?? '',
  to: meeting?.to ?? '',
  description: meeting?.description ?? '',
  type: meeting?.type || 'Meeting',
});

export const normalizeTasks = (taskList = []) => {
  const safeTaskList = Array.isArray(taskList) ? taskList.filter((task) => task && typeof task === 'object') : [];
  const normalized = safeTaskList.map((task = {}) => ({
    ...defaultTask,
    ...task,
    title: task?.title ?? '',
    projectId: task?.projectId ?? '',
    project: task?.project ?? '',
    projectNumber: task?.projectNumber ?? '',
    description: task?.description ?? '',
    planned: task?.planned ?? '',
    status: task?.status ?? 'PLANNED',
    isMorningAssembly: Boolean(task?.isMorningAssembly || task?.title === 'Morning assembly'),
  }));

  // Morning assembly is optional — it is kept (and pinned to the top) only when the
  // saved plan actually contains it, never re-inserted for teams that do not hold one.
  const assemblyIndex = normalized.findIndex((task) => task.isMorningAssembly || task.title === 'Morning assembly');
  if (assemblyIndex > 0) {
    const [assemblyTask] = normalized.splice(assemblyIndex, 1);
    normalized.unshift(assemblyTask);
  }

  if (normalized.length === 0) {
    normalized.push({ ...defaultTask });
  }

  return normalized;
};

export const normalizeMeetings = (meetingList = []) => {
  const safeMeetingList = Array.isArray(meetingList) ? meetingList.filter((meeting) => meeting && typeof meeting === 'object') : [];
  return safeMeetingList.map((meeting) => normalizeMeeting(meeting));
};

export { defaultAssemblyTask, defaultTask, defaultMeeting, defaultSection };
