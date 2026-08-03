import { useTheme } from '../../contexts/ThemeContext.jsx';

const FormInput = ({ label, type = 'text', value, onChange, placeholder, name }) => {
  const { activeTheme } = useTheme();

  return (
    <label className="block text-sm font-medium" style={{ color: activeTheme.textSecondary }}>
      <span>{label}</span>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-[28px] border px-4 py-3 shadow-sm outline-none transition"
        style={{
          borderColor: activeTheme.border,
          backgroundColor: activeTheme.surface,
          color: activeTheme.textPrimary,
          boxShadow: activeTheme.shadowSoft,
        }}
      />
    </label>
  );
};

export default FormInput;
