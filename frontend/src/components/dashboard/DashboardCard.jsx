import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext.jsx';

const DashboardCard = ({ children, className = '', hover = true, initial = false, animate = false, transition = undefined }) => {
  const { activeTheme } = useTheme();

  return (
    <motion.div
      initial={initial ? { opacity: 0, y: 24 } : false}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={transition || { duration: 0.35, ease: 'easeOut' }}
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      className={`rounded-[28px] border p-6 shadow-sm backdrop-blur-xl transition ${className}`}
      style={{
        backgroundColor: activeTheme.surface,
        borderColor: activeTheme.border,
        boxShadow: activeTheme.shadowSoft,
      }}
    >
      {children}
    </motion.div>
  );
};

export default DashboardCard;
