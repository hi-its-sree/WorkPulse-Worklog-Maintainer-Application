import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const ProjectTimeChart = ({ data }) => {
  const { activeTheme } = useTheme();

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={activeTheme.border} />
          <XAxis dataKey="name" stroke={activeTheme.textSecondary} />
          <YAxis stroke={activeTheme.textSecondary} />
          <Tooltip />
          <Bar dataKey="hours" fill={activeTheme.accent} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectTimeChart;
