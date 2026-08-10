import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext.jsx';
import { formatProjectLabel, useProjects } from '../../lib/useProjects.js';

const TaskSection = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, onDuplicateTask, errors = {} }) => {
  const { strings } = useLanguage();
  const { projects, loading: projectsLoading } = useProjects();

  // A task saved before its project existed in the register keeps its typed name,
  // shown as an extra option so re-saving the day never silently drops it.
  const legacyValue = (task) => (task?.project && !projects.some((project) => String(project.id) === String(task?.projectId)) ? 'legacy' : '');

  const selectProject = (index, value) => {
    if (value === 'legacy') return;
    const project = projects.find((candidate) => String(candidate.id) === value);
    onUpdateTask(index, {
      projectId: project ? project.id : '',
      project: project ? project.name : '',
      projectNumber: project ? project.projectNumber || '' : '',
    });
  };

  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-[var(--text-primary)]">{strings.planner.taskSectionTitle}</h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{strings.planner.taskSectionDescription}</p>
        </div>
        <button onClick={onAddTask} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
          <Plus size={16} />
          {strings.planner.addTask}
        </button>
      </div>

      <div className="space-y-4">
        {(Array.isArray(tasks) ? tasks : []).map((task, index) => {
          const isAssembly = task?.isMorningAssembly;
          return (
            <div key={`task-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
              {isAssembly ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">{strings.planner.morningPlannerTitle}</p>
                      <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">{strings.planner.morningPlannerDescription}</p>
                    </div>
                    <button type="button" onClick={() => onDeleteTask(index)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.plannedMinutes}</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={task?.planned ?? ''}
                      onChange={(e) => onUpdateTask(index, 'planned', e.target.value)}
                      className="app-input mt-2"
                      placeholder={strings.planner.placeholders.minutes}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{strings.planner.untitledTask} #{index}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">{strings.planner.tasksPreview}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onDuplicateTask(index)} className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-2 text-[var(--text-secondary)]">
                        <Copy size={16} />
                      </button>
                      <button type="button" onClick={() => onDeleteTask(index)} className="rounded-full border border-rose-200 bg-rose-50 p-2 text-rose-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-3">
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span>{strings.planner.taskNameLabel}</span>
                      <input value={task?.title ?? ''} onChange={(e) => onUpdateTask(index, 'title', e.target.value)} className="app-input mt-2" placeholder={strings.planner.placeholders.taskName} />
                    </label>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span>{strings.planner.projectLabel}</span>
                      <select
                        value={task?.projectId != null && task.projectId !== '' ? String(task.projectId) : legacyValue(task)}
                        onChange={(e) => selectProject(index, e.target.value)}
                        className="app-input mt-2"
                        disabled={projectsLoading}
                      >
                        <option value="">{projectsLoading ? strings.planner.loadingProjects : strings.planner.noProject}</option>
                        {projects.map((project) => (
                          <option key={project.id} value={String(project.id)}>{formatProjectLabel(project)}</option>
                        ))}
                        {legacyValue(task) && <option value="legacy">{task.project}</option>}
                      </select>
                      {!projectsLoading && projects.length === 0 && (
                        <span className="mt-2 block text-xs text-[var(--text-secondary)]">{strings.planner.noProjectsYet}</span>
                      )}
                    </label>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span>{strings.planner.plannedMinutes}</span>
                      <input type="text" inputMode="numeric" value={task?.planned ?? ''} onChange={(e) => onUpdateTask(index, 'planned', e.target.value)} className="app-input mt-2" placeholder={strings.planner.placeholders.minutes} />
                    </label>
                  </div>
                  <label className="mt-4 block text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.taskDescriptionLabel}</span>
                    <textarea value={task?.description ?? ''} onChange={(e) => onUpdateTask(index, 'description', e.target.value)} className="app-input mt-2 h-24" placeholder={strings.planner.placeholders.taskDescription} />
                  </label>
                  <label className="mt-4 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>{strings.planner.taskStatusLabel}</span>
                    <select value={task?.status ?? 'PLANNED'} onChange={(e) => onUpdateTask(index, 'status', e.target.value)} className="app-input max-w-xs">
                      <option value="PLANNED">{strings.common.statuses.planned}</option>
                      <option value="IN_PROGRESS">{strings.common.statuses.inProgress}</option>
                      <option value="COMPLETED">{strings.common.statuses.completed}</option>
                    </select>
                  </label>
                </>
              )}
              {errors?.[index] && (
                <div className="mt-3 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  <AlertCircle size={14} />
                  <span>{errors[index]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskSection;
