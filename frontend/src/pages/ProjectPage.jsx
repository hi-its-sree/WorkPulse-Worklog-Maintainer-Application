import { motion } from 'framer-motion';

const projects = [
  { name: 'ERP Modernization', status: 'ACTIVE', client: 'Global Retailer', hours: 320 },
  { name: 'Client Portal', status: 'AT_RISK', client: 'Finance Group', hours: 180 },
];

const ProjectPage = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <h2 className="text-2xl font-semibold text-slate-900">Project portfolio</h2>
        <p className="mt-2 text-slate-500">Overview of active initiatives, utilization and delivery status.</p>
      </div>

      <motion.div className="grid gap-6 lg:grid-cols-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {projects.map((project) => (
          <div key={project.name} className="app-panel p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">{project.name}</h3>
                <p className="mt-1 text-sm text-slate-500">Client: {project.client}</p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">{project.status}</span>
            </div>
            <p className="mt-4 text-sm text-slate-500">Allocated hours: {project.hours}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ProjectPage;
