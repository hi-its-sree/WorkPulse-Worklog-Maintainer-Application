import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const tabs = ['Overview', 'Worklogs', 'Team', 'Reports', 'Settings'];

const ProjectDetailView = ({ project, activeTab, onTabChange, onEdit, onStatusChange }) => {
  const { activeTheme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[32px] border p-6 shadow-sm"
      style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.28em]" style={{ color: activeTheme.accent }}>{project.client}</p>
          <h3 className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.name}</h3>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{project.description}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="app-secondary-btn" onClick={() => onEdit(project)}>Edit project</button>
          <button type="button" className="app-action-btn" onClick={() => onStatusChange(project)}>Update status</button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button key={tab} type="button" className={`rounded-full px-4 py-2 text-sm font-medium ${activeTab === tab ? 'text-white' : ''}`} style={{ backgroundColor: activeTab === tab ? activeTheme.accent : activeTheme.surfaceAlt, color: activeTab === tab ? activeTheme.accentContrast : activeTheme.textSecondary }} onClick={() => onTabChange(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
          {activeTab === 'Overview' ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Manager</p>
                  <p className="mt-1 font-semibold" style={{ color: activeTheme.textPrimary }}>{project.manager}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Timeline</p>
                  <p className="mt-1 font-semibold" style={{ color: activeTheme.textPrimary }}>{project.startDate} → {project.endDate}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Budget</p>
                  <p className="mt-1 font-semibold" style={{ color: activeTheme.textPrimary }}>{project.budgetHours}h</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Logged</p>
                  <p className="mt-1 font-semibold" style={{ color: activeTheme.textPrimary }}>{project.loggedHours}h</p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm" style={{ color: activeTheme.textSecondary }}>
                  <span>Delivery progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full" style={{ backgroundColor: activeTheme.surface }}>
                  <div className="h-full rounded-full" style={{ width: `${project.progress}%`, backgroundColor: activeTheme.accent }} />
                </div>
              </div>
            </div>
          ) : null}

          {activeTab === 'Worklogs' ? (
            <div className="overflow-hidden rounded-[24px] border" style={{ borderColor: activeTheme.border }}>
              <table className="min-w-full text-left text-sm">
                <thead style={{ backgroundColor: activeTheme.surface }}>
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {project.worklogs.map((entry) => (
                    <tr key={entry.id} className="border-t" style={{ borderColor: activeTheme.border }}>
                      <td className="px-4 py-3" style={{ color: activeTheme.textPrimary }}>{entry.date}</td>
                      <td className="px-4 py-3" style={{ color: activeTheme.textSecondary }}>{entry.user}</td>
                      <td className="px-4 py-3" style={{ color: activeTheme.textSecondary }}>{entry.task}</td>
                      <td className="px-4 py-3" style={{ color: activeTheme.textPrimary }}>{entry.hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === 'Team' ? (
            <div className="flex flex-wrap gap-3">
              {project.teamMembers.map((member) => (
                <div key={member} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, color: activeTheme.textPrimary }}>
                  {member}
                </div>
              ))}
            </div>
          ) : null}

          {activeTab === 'Reports' ? (
            <div className="space-y-3">
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme.border }}>
                <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Utilization</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{Math.round((project.loggedHours / project.budgetHours) * 100)}%</p>
              </div>
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme.border }}>
                <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Delivery confidence</p>
                <p className="mt-2 text-2xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.progress >= 80 ? 'Stable' : 'Needs attention'}</p>
              </div>
            </div>
          ) : null}

          {activeTab === 'Settings' ? (
            <div className="space-y-3 text-sm" style={{ color: activeTheme.textSecondary }}>
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme.border }}>Status: {project.status}</div>
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme.border }}>Notifications enabled for the project team.</div>
              <div className="rounded-2xl border p-4" style={{ borderColor: activeTheme.border }}>Default review cadence: weekly.</div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
            <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Current status</p>
            <p className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.status}</p>
          </div>
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
            <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Team health</p>
            <p className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.teamMembers.length} active contributors</p>
          </div>
          <div className="rounded-[28px] border p-5" style={{ backgroundColor: activeTheme.surfaceAlt, borderColor: activeTheme.border }}>
            <p className="text-sm" style={{ color: activeTheme.textSecondary }}>Worklog focus</p>
            <p className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.worklogs.length} entries this cycle</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectDetailView;
