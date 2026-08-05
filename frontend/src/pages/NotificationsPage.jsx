const notifications = [
  {
    title: 'Task deadline reminder',
    description: 'Frontend redesign task is due tomorrow at 5:00 PM.',
    type: 'Task',
    due: 'Tomorrow',
    status: 'Pending',
  },
  {
    title: 'Timesheet submission reminder',
    description: 'Your weekly timesheet is due today by 6:00 PM.',
    type: 'Timesheet',
    due: 'Today',
    status: 'Action required',
  },
  {
    title: 'Approval notification',
    description: 'Your project budget request needs approval review.',
    type: 'Approval',
    due: 'In 2 days',
    status: 'Awaiting approval',
  },
  {
    title: 'Meeting notification',
    description: 'Client alignment meeting starts in 30 minutes.',
    type: 'Meeting',
    due: '30 minutes',
    status: 'Upcoming',
  },
];

const NotificationsPage = () => {
  const { activeTheme } = useTheme();

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Notifications</p>
            <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>Alerts and reminders</h1>
            <p className="mt-2" style={{ color: activeTheme.textSecondary }}>Keep track of task deadlines, timesheet reminders, approvals, and meeting alerts.</p>
          </div>
          <div className="rounded-3xl px-4 py-3 text-sm font-semibold shadow-sm" style={{ backgroundColor: activeTheme.surfaceAlt, color: activeTheme.textPrimary }}>{notifications.length} alerts</div>
        </div>

        <div className="space-y-4">
          {notifications.map((item) => (
            <div key={item.title} className="app-panel p-6">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em]" style={{ color: activeTheme.textSecondary }}>{item.type}</p>
                  <h2 className="mt-2 text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{item.title}</h2>
                </div>
                <span className="rounded-full px-3 py-1 text-sm font-semibold" style={{ backgroundColor: activeTheme.accentSoft, color: activeTheme.accent }}>{item.status}</span>
              </div>
              <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{item.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm" style={{ color: activeTheme.textSecondary }}>
                <span className="rounded-full px-3 py-2 shadow-sm" style={{ backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}>Due: {item.due}</span>
                <button type="button" className="app-action-btn">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
