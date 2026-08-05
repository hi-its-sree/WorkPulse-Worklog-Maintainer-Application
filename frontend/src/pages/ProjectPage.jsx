import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Search, Plus, SlidersHorizontal } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.jsx';
import ProjectSummaryCard from '../components/projects/ProjectSummaryCard.jsx';
import ProjectCard from '../components/projects/ProjectCard.jsx';
import ProjectModal from '../components/projects/ProjectModal.jsx';
import ProjectDetailView from '../components/projects/ProjectDetailView.jsx';

const initialProjects = [
  {
    id: 1,
    name: 'ERP Modernization',
    client: 'Global Retailer',
    manager: 'Mina Chen',
    description: 'Modernizing the ERP platform with new integrations and reporting workflows.',
    startDate: '2026-01-08',
    endDate: '2026-11-30',
    budgetHours: 480,
    loggedHours: 320,
    progress: 72,
    status: 'Active',
    teamMembers: ['Ava', 'Jordan', 'Noah', 'Priya'],
    worklogs: [
      { id: 1, date: '2026-08-01', user: 'Ava', task: 'API integration', hours: 5 },
      { id: 2, date: '2026-08-02', user: 'Jordan', task: 'Reporting module', hours: 4 },
    ],
  },
  {
    id: 2,
    name: 'Client Portal',
    client: 'Finance Group',
    manager: 'Leo Grant',
    description: 'Launch a client-facing portal with secure access and milestone tracking.',
    startDate: '2026-03-12',
    endDate: '2026-09-20',
    budgetHours: 260,
    loggedHours: 148,
    progress: 56,
    status: 'At Risk',
    teamMembers: ['Mina', 'Elena', 'Hugo'],
    worklogs: [
      { id: 3, date: '2026-08-01', user: 'Elena', task: 'Secure auth', hours: 3 },
      { id: 4, date: '2026-08-03', user: 'Hugo', task: 'Dashboard polish', hours: 2 },
    ],
  },
  {
    id: 3,
    name: 'Mobile Field App',
    client: 'Northwind Logistics',
    manager: 'Sara Kim',
    description: 'Field service app to improve dispatch flow and on-site completion.',
    startDate: '2026-05-01',
    endDate: '2026-10-15',
    budgetHours: 360,
    loggedHours: 302,
    progress: 91,
    status: 'Completed',
    teamMembers: ['Noah', 'Priya', 'Mina'],
    worklogs: [
      { id: 5, date: '2026-08-04', user: 'Sara', task: 'Release prep', hours: 6 },
    ],
  },
];

const ProjectPage = () => {
  const { activeTheme } = useTheme();
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('latest');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailProjectId, setDetailProjectId] = useState(null);
  const [activeTab, setActiveTab] = useState('Overview');
  const [menuOpen, setMenuOpen] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    client: '',
    description: '',
    startDate: '',
    endDate: '',
    budgetHours: 0,
    manager: '',
    teamMembers: [],
    status: 'Planning',
  });

  const filteredProjects = useMemo(() => {
    const result = projects.filter((project) => {
      const matchesQuery = `${project.name} ${project.client} ${project.manager}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'All' || project.status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    return result.sort((a, b) => {
      if (sortOrder === 'progress') return b.progress - a.progress;
      if (sortOrder === 'hours') return b.loggedHours - a.loggedHours;
      return b.id - a.id;
    });
  }, [projects, query, statusFilter, sortOrder]);

  const summaryCards = [
    { label: 'Total projects', value: projects.length, detail: 'Across portfolio', accent: activeTheme.accent },
    { label: 'Active projects', value: projects.filter((project) => project.status === 'Active').length, detail: 'In delivery', accent: activeTheme.success },
    { label: 'At-risk projects', value: projects.filter((project) => project.status === 'At Risk').length, detail: 'Need attention', accent: activeTheme.warning },
    { label: 'Total logged hours', value: `${projects.reduce((sum, project) => sum + project.loggedHours, 0)}h`, detail: 'Across active work', accent: activeTheme.accent },
  ];

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({ name: '', client: '', description: '', startDate: '', endDate: '', budgetHours: 0, manager: '', teamMembers: [], status: 'Planning' });
    setModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      client: project.client,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
      budgetHours: project.budgetHours,
      manager: project.manager,
      teamMembers: project.teamMembers,
      status: project.status,
    });
    setModalOpen(true);
  };

  const handleSaveProject = () => {
    if (!formData.name || !formData.client) return;

    if (editingProject) {
      setProjects((current) => current.map((project) => project.id === editingProject.id ? { ...project, ...formData, loggedHours: project.loggedHours, progress: project.progress, worklogs: project.worklogs } : project));
    } else {
      setProjects((current) => [{ id: Date.now(), ...formData, loggedHours: 0, progress: 0, worklogs: [] }, ...current]);
    }

    setModalOpen(false);
    setMenuOpen(null);
  };

  const openProjectDetails = (projectId) => {
    setDetailProjectId(projectId);
    setActiveTab('Overview');
  };

  const updateStatus = (project) => {
    const nextStatus = prompt('Select new status', project.status);
    if (!nextStatus) return;
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, status: nextStatus } : item));
  };

  const addMembers = (project) => {
    const members = prompt('Add comma separated member names', project.teamMembers.join(', '));
    if (!members) return;
    const parsed = members.split(',').map((member) => member.trim()).filter(Boolean);
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, teamMembers: parsed } : item));
  };

  const archiveProject = (project) => {
    setProjects((current) => current.map((item) => item.id === project.id ? { ...item, status: 'Completed' } : item));
  };

  const deleteProject = (project) => {
    setProjects((current) => current.filter((item) => item.id !== project.id));
  };

  const selectedProject = projects.find((project) => project.id === detailProjectId) || null;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Project workspace</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Project management dashboard</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>Coordinate delivery, monitor utilization, and keep worklog activity aligned with project goals.</p>
          </div>
          <button type="button" className="app-action-btn inline-flex items-center gap-2" onClick={openCreateModal}><Plus size={16} /> New Project</button>
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
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search projects" className="w-full border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }} />
            </label>
            <label className="flex items-center gap-2 rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <SlidersHorizontal size={16} style={{ color: activeTheme.textSecondary }} />
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="border-none bg-transparent outline-none" style={{ color: activeTheme.textPrimary }}>
                <option value="All">All statuses</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="At Risk">At Risk</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </label>
            <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} className="rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>
              <option value="latest">Newest</option>
              <option value="progress">Highest progress</option>
              <option value="hours">Most logged hours</option>
            </select>
          </div>
        </div>

        <motion.div className="mt-8 grid gap-6 xl:grid-cols-2" layout>
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onOpenDetails={openProjectDetails} onEdit={openEditModal} onStatusChange={updateStatus} onAddMember={addMembers} onArchive={archiveProject} onDelete={deleteProject} menuOpen={menuOpen} onToggleMenu={setMenuOpen} />
          ))}
        </motion.div>
      </div>

      {selectedProject ? (
        <ProjectDetailView project={selectedProject} activeTab={activeTab} onTabChange={setActiveTab} onEdit={openEditModal} onStatusChange={updateStatus} />
      ) : null}

      <ProjectModal isOpen={modalOpen} mode={editingProject ? 'edit' : 'create'} formData={formData} setFormData={setFormData} onClose={() => setModalOpen(false)} onSubmit={handleSaveProject} />
    </div>
  );
};

export default ProjectPage;
