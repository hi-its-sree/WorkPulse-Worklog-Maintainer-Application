import { useTheme } from '../../contexts/ThemeContext.jsx';

const SectionCard = ({ title, description, action, children, className = '' }) => {
  const { activeTheme } = useTheme();

  return (
    <div
      className={`rounded-[32px] border p-6 shadow-sm ${className}`}
      style={{
        backgroundColor: activeTheme.surface,
        borderColor: activeTheme.border,
        boxShadow: activeTheme.shadowSoft,
      }}
    >
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{title}</h2>
          {description ? <p className="mt-2 text-sm leading-6" style={{ color: activeTheme.textSecondary }}>{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
};

export default SectionCard;
