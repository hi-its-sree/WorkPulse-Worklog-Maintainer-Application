import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatProjectLabel, useProjects } from '../../lib/useProjects.js';

const statusOptions = ['Planned', 'In Progress', 'Completed', 'Cancelled'];
const recurrenceOptions = ['daily', 'weekly', 'monthly', 'none'];

const MeetingModal = ({ isOpen, mode, formData, setFormData, onClose, onSubmit }) => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();
  const { projects, loading: projectsLoading } = useProjects();

  const legacyProject = formData?.project && !projects.some((project) => String(project.id) === String(formData?.projectId));

  const selectProject = (value) => {
    if (value === 'legacy') return;
    const project = projects.find((candidate) => String(candidate.id) === value);
    setFormData((current) => ({
      ...current,
      projectId: project ? project.id : '',
      project: project ? project.name : '',
      projectNumber: project ? project.projectNumber || '' : '',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border p-6 shadow-2xl" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{mode === 'create' ? strings.modal.meeting.createTitle : strings.modal.meeting.editTitle}</h3>
            <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.modal.meeting.description}</p>
          </div>
          <button type="button" className="rounded-full border px-3 py-2 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }} onClick={onClose}>{strings.modal.meeting.close}</button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.title}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.title} onChange={(event) => setFormData((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.project}</span>
            <select
              className="rounded-2xl border px-4 py-3"
              style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }}
              value={formData.projectId != null && formData.projectId !== '' ? String(formData.projectId) : (legacyProject ? 'legacy' : '')}
              onChange={(event) => selectProject(event.target.value)}
              disabled={projectsLoading}
            >
              <option value="">{projectsLoading ? strings.planner.loadingProjects : strings.planner.noProject}</option>
              {projects.map((project) => (
                <option key={project.id} value={String(project.id)}>{formatProjectLabel(project)}</option>
              ))}
              {legacyProject && <option value="legacy">{formData.project}</option>}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.date}</span>
            <input type="date" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.date} onChange={(event) => setFormData((current) => ({ ...current, date: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.startTime}</span>
            <input type="time" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.startTime} onChange={(event) => setFormData((current) => ({ ...current, startTime: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.duration}</span>
            <input type="number" className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.duration} onChange={(event) => setFormData((current) => ({ ...current, duration: Number(event.target.value) }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.status}</span>
            <select className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.status} onChange={(event) => setFormData((current) => ({ ...current, status: event.target.value }))}>
              {statusOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.participants}</span>
            <input className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.participants} onChange={(event) => setFormData((current) => ({ ...current, participants: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.recurrence}</span>
            <select className="rounded-2xl border px-4 py-3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.recurrence} onChange={(event) => setFormData((current) => ({ ...current, recurrence: event.target.value }))}>
              {recurrenceOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.descriptionLabel}</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.description} onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.agenda}</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.agenda} onChange={(event) => setFormData((current) => ({ ...current, agenda: event.target.value }))} />
          </label>
          <label className="flex flex-col gap-2 text-sm md:col-span-2" style={{ color: activeTheme.textSecondary }}>
            <span>{strings.modal.meeting.notes}</span>
            <textarea className="rounded-2xl border px-4 py-3" rows="3" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border, color: activeTheme.textPrimary }} value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} />
          </label>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" className="app-secondary-btn" onClick={onClose}>{strings.modal.meeting.cancel}</button>
          <button type="button" className="app-action-btn" onClick={onSubmit}>{strings.modal.meeting.save}</button>
        </div>
      </div>
    </div>
  );
};

export default MeetingModal;
