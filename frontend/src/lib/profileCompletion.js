// Mirrors the server's definition of a complete profile, so the indicator, the
// percentage and the reminder notification always agree.
export const PROFILE_FIELDS = ['fullName', 'email', 'department', 'jobTitle', 'phone', 'location'];

const isFilled = (value) => (typeof value === 'string' ? value.trim().length > 0 : value != null && value !== '');

export const missingProfileFields = (user) => PROFILE_FIELDS.filter((field) => !isFilled(user?.[field]));

export const isProfileComplete = (user) => Boolean(user) && missingProfileFields(user).length === 0;

export const profileCompletionPercent = (user) => {
  if (!user) return 0;
  const filled = PROFILE_FIELDS.length - missingProfileFields(user).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
};
