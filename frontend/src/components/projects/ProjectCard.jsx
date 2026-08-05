import { motion } from 'framer-motion';
import { MoreHorizontal, ArrowRight, Users, Clock3 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const statusStyles = {
  Planning: 'bg-slate-100 text-slate-700',
  Active: 'bg-emerald-100 text-emerald-700',
  'At Risk': 'bg-amber-100 text-amber-700',
  'On Hold': 'bg-sky-100 text-sky-700',
  Completed: 'bg-violet-100 text-violet-700',
  Cancelled: 'bg-rose-100 text-rose-700',
};

const ProjectCard = ({ project, onOpenDetails, onEdit, onStatusChange, onAddMember, onArchive, onDelete, menuOpen, onToggleMenu }) => {
  const { activeTheme } = useTheme();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border p-6 shadow-sm"
      style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{project.name}</h3>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[project.status] || 'bg-slate-100 text-slate-700'}`}>
              {project.status}
            </span>
          </div>
          <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>Client: {project.client}</p>
          <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Manager: {project.manager}</p>
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => onToggleMenu(project.id)}
            className="rounded-full border p-2"
            style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}
          >
            <MoreHorizontal size={18} />
          </button>
          {menuOpen === project.id ? (
            <div className="absolute right-0 z-10 mt-2 w-48 rounded-2xl border p-2 shadow-lg" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border }}>
              <button type="button" className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]" onClick={() => onEdit(project)}>Edit</button>
              <button type="button" className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]" onClick={() => onStatusChange(project)}>Change status</button>
              <button type="button" className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]" onClick={() => onAddMember(project)}>Add members</button>
              <button type="button" className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm hover:bg-[var(--accent-soft)]" onClick={() => onArchive(project)}>Archive</button>
              <button type="button" className="flex w-full items-center rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50" onClick={() => onDelete(project)}>Delete</button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="mt-4 text-sm leading-6" style={{ color: activeTheme.textSecondary }}>{project.description}</p>

      <div className="mt-5 h-2 overflow-hidden rounded-full" style={{ backgroundColor: activeTheme.surfaceAlt }}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, project.progress || 0)}%`, backgroundColor: activeTheme.accent }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm" style={{ color: activeTheme.textSecondary }}>
        <span>Progress {project.progress}%</span>
        <span>{project.loggedHours}h / {project.budgetHours}h</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 text-sm" style={{ color: activeTheme.textSecondary }}>
        <span className="inline-flex items-center gap-2"><Clock3 size={16} /> {project.loggedHours}h logged</span>
        <span className="inline-flex items-center gap-2"><Users size={16} /> {project.teamMembers.length} members</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {project.teamMembers.slice(0, 3).map((member) => (
          <span key={member} className="rounded-full border px-3 py-1 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
            {member}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button type="button" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }} onClick={() => onOpenDetails(project.id)}>
          Open details <ArrowRight size={16} />
        </button>
        <span className="text-sm" style={{ color: activeTheme.textSecondary }}>
          {project.startDate} → {project.endDate}
        </span>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
