import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import api from '../lib/api.js';
import { refreshProjects } from '../lib/useProjects.js';
import { fetchWorklogs } from '../lib/workflowStore.js';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { PROJECT_STATUSES, getProjectStatusLabel, normalizeProjectStatus } from '../components/projects/status.js';
import ProjectSummaryCard from '../components/projects/ProjectSummaryCard.jsx';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import ProjectModal from '../components/projects/ProjectModal.jsx';
import ProjectDetailView from '../components/projects/ProjectDetailView.jsx';

// Projects come from /projects; the delivery metrics below are not columns on the
// project record, so they are derived from the analytics endpoint's per-project
// rollup of stored tasks and worklogs.
// The worklog sessions recorded against each project, so the detail view lists real
// entries instead of an empty table.
const buildWorklogsByProject = (worklogEntries = {}) => {
  const byProject = new Map();

  Object.entries(worklogEntries).forEach(([dateKey, entry]) => {
    (entry?.details || []).forEach((detail, index) => {
      const projectId = Number(detail?.projectId);
      const minutes = Number(detail?.actualMinutes || 0);
      if (!projectId || minutes <= 0) return;
      if (!byProject.has(projectId)) byProject.set(projectId, []);
      byProject.get(projectId).push({
        id: `${dateKey}-${detail.id || index}`,
        date: dateKey,
        user: entry.updatedBy || '',
        task: detail.title || '',
        hours: Number((minutes / 60).toFixed(1)),
      });
    });
  });

  byProject.forEach((entries) => entries.sort((left, right) => right.date.localeCompare(left.date)));
  return byProject;
};

const withDeliveryMetrics = (project, breakdownByName, breakdownById) => {
  const stats = breakdownById.get(Number(project.id)) || breakdownByName.get(project.name) || null;

  return {
    ...project,
    manager: project.manager || '',
    budgetHours: project.budgetHours ?? null,
    teamMembers: project.teamMembers || [],
    worklogs: project.worklogs || [],
    loggedHours: stats?.hours ?? 0,
    progress: stats?.progress ?? 0,
    taskCount: stats?.taskCount ?? 0,
    completedTasks: stats?.completedTasks ?? 0,
    averageCompletionTime: stats?.averageCompletionTime ?? 0,
  };
};

const ProjectPage = () => {
  const { activeTheme } = useTheme();
  const { strings } = useLanguage();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('latest');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailProjectId, setDetailProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [formData, setFormData] = useState({
    projectNumber: '',
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    manager: '',
    teamMembers: [],
  });

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const [projectsResponse, analyticsResponse, worklogEntries] = await Promise.all([
          api.get('/projects'),
          api.get('/reports/analytics').catch(() => ({ data: null })),
          fetchWorklogs().catch(() => ({})),
        ]);

        const breakdown = analyticsResponse.data?.projectBreakdown || [];
        const breakdownByName = new Map(breakdown.map((entry) => [entry.name, entry]));
        const breakdownById = new Map(breakdown.filter((entry) => entry.id != null).map((entry) => [Number(entry.id), entry]));
        const worklogsByProject = buildWorklogsByProject(worklogEntries);

        setProjects((projectsResponse.data || []).map((project) => ({
          ...withDeliveryMetrics(project, breakdownByName, breakdownById),
          worklogs: worklogsByProject.get(Number(project.id)) || [],
        })));
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const result = projects.filter((project) => {
      const matchesQuery = `${project.projectNumber || ''} ${project.name} ${project.manager || ''}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || normalizeProjectStatus(project.status) === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortOrder === 'progress') return (b.progress || 0) - (a.progress || 0);
      if (sortOrder === 'hours') return (b.loggedHours || 0) - (a.loggedHours || 0);
      return (b.id || 0) - (a.id || 0);
    });
  }, [projects, query, statusFilter, sortOrder]);

  const summaryCards = [
    { label: strings.projects.summary.totalProjects, value: projects.length, detail: strings.projects.summaryDetails.portfolio, accent: activeTheme.accent },
    { label: strings.projects.summary.activeProjects, value: projects.filter((project) => normalizeProjectStatus(project.status) === 'ACTIVE').length, detail: strings.projects.summaryDetails.inDelivery, accent: activeTheme.success },
    { label: strings.projects.summary.atRiskProjects, value: projects.filter((project) => normalizeProjectStatus(project.status) === 'AT_RISK').length, detail: strings.projects.summaryDetails.needAttention, accent: activeTheme.warning },
    { label: strings.projects.summary.totalLoggedHours, value: `${projects.reduce((sum, project) => sum + Number(project.loggedHours || 0), 0).toFixed(1)}h`, detail: strings.projects.summaryDetails.activeWork, accent: activeTheme.accent },
  ];

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ projectNumber: '', name: '', description: '', startDate: '', endDate: '', manager: '', teamMembers: [] });
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      projectNumber: project.projectNumber || '',
      name: project.name || '',
      description: project.description || '',
      startDate: project.startDate || '',
      endDate: project.endDate || '',
      manager: project.manager || '',
      teamMembers: project.teamMembers || [],
    });
    setModalOpen(true);
  };

  const handleSaveProject = async () => {
    if (!formData.name) return;

    try {
      if (editingProject) {
        const { data } = await api.put(`/projects/${editingProject.id}`, formData);
        setProjects((current) => current.map((project) => project.id === editingProject.id
          ? { ...project, ...data, loggedHours: project.loggedHours, progress: project.progress, worklogs: project.worklogs }
          : project));
      } else {
        const { data } = await api.post('/projects', formData);
        setProjects((current) => [{ ...data, loggedHours: 0, progress: 0, worklogs: [], teamMembers: data.teamMembers || [] }, ...current]);
      }
      refreshProjects();
      setSaveError('');
      setModalOpen(false);
      setMenuOpen(null);
    } catch (saveError) {
      setSaveError(strings.projects.saveFailed);
    }
  };

  const persistProject = async (project, changes) => {
    const previous = projects;
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, ...changes } : item));
    try {
      await api.put(`/projects/${project.id}`, changes);
      refreshProjects();
      setSaveError('');
    } catch (error) {
      setProjects(previous);
      setSaveError(strings.projects.saveFailed);
    }
  };

  const openProjectDetails = (projectId) => {
    setDetailProjectId(projectId);
    setActiveTab('Overview');
  };

  const updateStatus = (project) => {
    const nextStatus = prompt(`${strings.projects.statusPrompt} (${PROJECT_STATUSES.join(', ')})`, normalizeProjectStatus(project.status));
    if (!nextStatus) return;
    const normalized = normalizeProjectStatus(nextStatus.trim());
    if (!PROJECT_STATUSES.includes(normalized)) return;
    persistProject(project, { status: normalized });
  };

  const addMembers = (project) => {
    const members = prompt(strings.projects.memberPrompt, (project.teamMembers || []).join(', '));
    if (!members) return;
    const parsed = members.split(',').map((member) => member.trim()).filter(Boolean);
    persistProject(project, { teamMembers: parsed });
  };

  const archiveProject = (project) => {
    persistProject(project, { status: 'COMPLETED' });
  };

  const deleteProject = async (project) => {
    const previous = projects;
    setProjects((current) => current.filter((item) => item.id !== project.id));
    try {
      await api.delete(`/projects/${project.id}`);
      refreshProjects();
      setSaveError('');
    } catch (error) {
      setProjects(previous);
      setSaveError(strings.projects.saveFailed);
    }
  };

  const selectedProject = projects.find((project) => project.id === detailProjectId) || null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.projects.eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.projects.pageTitle}</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>{strings.projects.pageDescription}</p>
          </div>
          <button type="button" className="app-action-btn inline-flex items-center gap-2" onClick={openCreateModal}><Plus size={16} /> {strings.projects.newProject}</button>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => <ProjectSummaryCard key={card.label} label={card.label} value={card.value} detail={card.detail} accent={card.accent} />)}
        </div>
      </div>

      <div className="rounded-[32px] border p-6 shadow-sm" style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <Search size={16} style={{ color: activeTheme.textSecondary }} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={strings.projects.searchPlaceholder} className="w-full border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <SlidersHorizontal size={16} style={{ color: activeTheme.textSecondary }} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }}>
                <option value="All">{strings.projects.allStatuses}</option>
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>{getProjectStatusLabel(status, strings)}</option>
                ))}
              </select>
            </label>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="latest">{strings.projects.newest}</option>
              <option value="progress">{strings.projects.highestProgress}</option>
              <option value="hours">{strings.projects.mostLoggedHours}</option>
            </select>
          </div>
        </div>

        {saveError && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{saveError}</div>
        )}

        {loading ? (
          <div className="rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.projects.loading}</div>
        ) : error ? (
          <div className="rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.projects.error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl border p-6 text-sm" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>{strings.projects.emptyState}</div>
        ) : (
          <motion.div className="mt-8 grid gap-6 xl:grid-cols-2" layout>
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} onOpenDetails={openProjectDetails} onEdit={openEditModal} onStatusChange={updateStatus} onAddMember={addMembers} onArchive={archiveProject} onDelete={deleteProject} menuOpen={menuOpen} onToggleMenu={setMenuOpen} />
            ))}
          </motion.div>
        )}
      </div>

      {selectedProject ? (
        <ProjectDetailView project={selectedProject} activeTab={activeTab} onTabChange={setActiveTab} onEdit={openEditModal} onStatusChange={updateStatus} />
      ) : null}

      <ProjectModal isOpen={modalOpen} mode={editingProject ? 'edit' : 'create'} formData={formData} setFormData={setFormData} onClose={() => setModalOpen(false)} onSubmit={handleSaveProject} />
    </div>
  );
};

export default ProjectPage;
