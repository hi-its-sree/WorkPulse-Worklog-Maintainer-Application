import { useTheme } from '../../contexts/ThemeContext.jsx';

const TaskAnalyticsCard = ({ title, items, emptyMessage }) => {
  const { activeTheme } = useTheme();

  return (
    <div
      className="rounded-[28px] border p-6 shadow-sm"
      style={{ backgroundColor: activeTheme.surface, borderColor: activeTheme.border, boxShadow: activeTheme.shadowSoft }}
    >
      <h3 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>
        {title}
      </h3>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={item.id || item.name} className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
              <div>
                <p className="font-medium" style={{ color: activeTheme.textPrimary }}>{item.name}</p>
                <p className="text-sm" style={{ color: activeTheme.textSecondary }}>{item.detail}</p>
              </div>
              <span className="text-sm font-semibold" style={{ color: activeTheme.accent }}>{item.value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm" style={{ color: activeTheme.textSecondary }}>{emptyMessage}</p>
      )}
    </div>
  );
};

export default TaskAnalyticsCard;
