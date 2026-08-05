import { ResponsiveContainer, AreaChart, Area, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const OvertimeChart = ({ data }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.border} />
          <XAxis dataKey="name" stroke={activeTheme.textSecondary} />
          <YAxis stroke={activeTheme.textSecondary} />
          <Tooltip />
          <Area type="monotone" dataKey="hours" stroke={activeTheme.accent} fill={activeTheme.accent} fillOpacity={0.2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default OvertimeChart;
