// One definition of "a complete profile", shared by the API and mirrored on the
// client, so the reminder, the indicator and the percentage never disagree.
export const PROFILE_FIELDS = ['fullName', 'email', 'department', 'jobTitle', 'phone', 'location'];

export const PROFILE_INCOMPLETE_KEY = 'PROFILE_INCOMPLETE';

const isFilled = (value) => typeof value === 'string' ? value.trim().length > 0 : value != null && value !== '';

export const missingProfileFields = (user) => PROFILE_FIELDS.filter((field) => !isFilled(user?.[field]));

export const isProfileComplete = (user) => missingProfileFields(user).length === 0;

export const profileCompletionPercent = (user) => {
  const filled = PROFILE_FIELDS.length - missingProfileFields(user).length;
  return Math.round((filled / PROFILE_FIELDS.length) * 100);
};
