import { useTheme } from '../../contexts/ThemeContext.jsx';

const FilterButton = ({ label, active, onClick }) => {
  const { activeTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderColor: active ? activeTheme.accent : activeTheme.border,
        backgroundColor: active ? activeTheme.accentSoft : activeTheme.surfaceAlt,
        color: active ? activeTheme.accent : activeTheme.textSecondary,
        boxShadow: active ? activeTheme.shadowGlow : 'none',
      }}
    >
      {label}
    </button>
  );
};

export default FilterButton;
