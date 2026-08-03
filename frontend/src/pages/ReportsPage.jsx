const reportData = [
  { label: 'Time spent per employee', value: '172h', change: '+8%' },
  { label: 'Time spent per project', value: '248h', change: '+12%' },
  { label: 'Task completion', value: '89%', change: '+6%' },
  { label: 'Overtime', value: '26h', change: '+18%' },
];

const chartData = [
  { name: 'Client Portal', hours: 86 },
  { name: 'ERP Modernization', hours: 112 },
  { name: 'Support', hours: 50 },
];

const ReportsPage = () => {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Reporting & analytics</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Worklog reports</h1>
            <p className="mt-2 text-slate-500">Get detailed insights across employees, projects, tasks, and overtime.</p>
          </div>
          <div className="rounded-3xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">Latest 7 days</div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {reportData.map((item) => (
            <div key={item.label} className="app-panel p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{item.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-emerald-700">{item.change}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-[32px] bg-slate-50 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Project hours</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Time by project</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">Bar report</span>
            </div>
            <div className="space-y-4">
              {chartData.map((item) => (
                <div key={item.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-700">
                    <span>{item.name}</span>
                    <span>{item.hours}h</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200">
                    <div className="h-3 rounded-full bg-blue-600" style={{ width: `${Math.min(100, item.hours)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] bg-slate-50 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Overtime summary</h2>
            <p className="mt-2 text-sm text-slate-500">Track excess hours and compare them across the team.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total overtime</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">26h</p>
              </div>
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Average overtime</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">3h 15m</p>
              </div>
              <div className="rounded-[28px] bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Top overtime team</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">Engineering</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
