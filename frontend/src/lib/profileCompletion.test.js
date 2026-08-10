import { describe, expect, it } from 'vitest';
import { isProfileComplete, missingProfileFields, profileCompletionPercent } from './profileCompletion.js';

const complete = {
  fullName: 'Sree Rag G S',
  email: 'sree@example.com',
  department: 'Engineering',
  jobTitle: 'Application Engineer',
  phone: '090-0000-0000',
  location: 'Tokyo',
};

describe('profile completion', () => {
  it('is complete only when every field is filled', () => {
    expect(isProfileComplete(complete)).toBe(true);
    expect(profileCompletionPercent(complete)).toBe(100);
  });

  it('is incomplete while any field is missing', () => {
    const withoutPhone = { ...complete, phone: '' };
    expect(isProfileComplete(withoutPhone)).toBe(false);
    expect(missingProfileFields(withoutPhone)).toEqual(['phone']);
    expect(profileCompletionPercent(withoutPhone)).toBe(83);
  });

  it('treats whitespace as missing', () => {
    expect(isProfileComplete({ ...complete, location: '   ' })).toBe(false);
  });

  it('handles a missing user without throwing', () => {
    expect(isProfileComplete(null)).toBe(false);
    expect(profileCompletionPercent(undefined)).toBe(0);
  });
});
