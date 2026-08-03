import { useTheme } from '../../contexts/ThemeContext.jsx';

const MeetingCard = ({ title, time, agenda }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="rounded-3xl border p-5 shadow-sm" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, boxShadow: activeTheme.shadowSoft }}>
      <p className="text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{title}</p>
      <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>{time}</p>
      <p className="mt-3 text-sm" style={{ color: activeTheme.textSecondary }}>{agenda}</p>
    </div>
  );
};

export default MeetingCard;
