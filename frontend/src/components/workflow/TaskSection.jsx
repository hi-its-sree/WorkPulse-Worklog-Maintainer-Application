import { Plus, Trash2, Copy, AlertCircle } from 'lucide-react';

const TaskSection = ({ tasks, onAddTask, onUpdateTask, onDeleteTask, onDuplicateTask, errors = {} }) => {
  return (
    <div className="rounded-[28px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h4 className="text-lg font-semibold text-[var(--text-primary)]">Tasks</h4>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Track planned work and keep the day actionable.</p>
        </div>
        <button onClick={onAddTask} type="button" className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition">
          <Plus size={16} />
          Add task
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task, index) => {
          const isAssembly = task.isMorningAssembly;
          return (
            <div key={`task-${index}`} className="rounded-[24px] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
              {isAssembly ? (
                <div className="space-y-4">
                  <div className="rounded-[20px] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">Morning assembly</p>
                    <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">Only planned minutes are required for this task.</p>
                  </div>
                  <label className="block text-sm text-[var(--text-secondary)]">
                    <span>Planned minutes</span>
                    <input
                      type="number"
                      min="0"
                      max="480"
                      value={task.planned}
                      onChange={(e) => onUpdateTask(index, 'planned', e.target.value)}
                      className="app-input mt-2"
                      placeholder="Minutes"
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">Task #{index}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)]">Manual activity</p>
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
                      <span>Task title</span>
                      <input value={task.title} onChange={(e) => onUpdateTask(index, 'title', e.target.value)} className="app-input mt-2" placeholder="Task name" />
                    </label>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span>Project</span>
                      <input value={task.project} onChange={(e) => onUpdateTask(index, 'project', e.target.value)} className="app-input mt-2" placeholder="Project name" />
                    </label>
                    <label className="block text-sm text-[var(--text-secondary)]">
                      <span>Planned minutes</span>
                      <input type="number" min="0" max="480" value={task.planned} onChange={(e) => onUpdateTask(index, 'planned', e.target.value)} className="app-input mt-2" placeholder="Minutes" />
                    </label>
                  </div>
                  <label className="mt-4 block text-sm text-[var(--text-secondary)]">
                    <span>Task description</span>
                    <textarea value={task.description} onChange={(e) => onUpdateTask(index, 'description', e.target.value)} className="app-input mt-2 h-24" placeholder="Add a short summary for this task" />
                  </label>
                  <label className="mt-4 flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <span>Status</span>
                    <select value={task.status} onChange={(e) => onUpdateTask(index, 'status', e.target.value)} className="app-input max-w-xs">
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In progress</option>
                      <option value="COMPLETED">Completed</option>
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
