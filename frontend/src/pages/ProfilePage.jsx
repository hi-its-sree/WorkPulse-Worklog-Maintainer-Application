import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { updateUserProfile } from '../lib/auth.js';

const ProfilePage = () => {
  const { user, signIn } = useContext(AuthContext);
  const { activeTheme } = useTheme();
  const location = useLocation();
  const onboarding = new URLSearchParams(location.search).get('onboarding') === '1';

  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({ fullName: '', phone: '', location: '', manager: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormState({
        fullName: user.fullName || user.name || '',
        phone: user.phone || '',
        location: user.location || '',
        manager: user.manager || '',
      });
    }
  }, [user]);

  const profileIncomplete = !user?.jobTitle || !user?.phone || !user?.location || !user?.manager || !user?.department;
  const initials = user?.fullName?.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const accountStatus = user?.status || (user?.isActive ? 'Active' : 'Inactive') || 'Pending';
  const accountBadge = accountStatus.toLowerCase() === 'active';
  const lastLogin = user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'No recent activity';

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formState.fullName.trim()) {
      setErrorMessage('Full name cannot be blank.');
      return;
    }
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await updateUserProfile({
        fullName: formState.fullName,
        phone: formState.phone,
        location: formState.location,
        manager: formState.manager,
      });
      signIn(response.user);
      setStatusMessage('Profile updated successfully.');
      setEditMode(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const primaryFields = [
    { key: 'jobTitle', label: 'Job title', value: user?.jobTitle || 'Not assigned' },
    { key: 'department', label: 'Department', value: user?.department || 'Not assigned' },
    { key: 'employeeId', label: 'Employee ID', value: user?.employeeId || 'Not available' },
    { key: 'accountStatus', label: 'Account status', value: accountStatus },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        {profileIncomplete && (
          <div className="mb-6 rounded-[28px] border px-6 py-5" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}>
            <p className="font-semibold">{onboarding ? 'Welcome aboard!' : 'Complete your profile'}</p>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>
              {onboarding
                ? 'Thanks for signing up — finish your profile details so the team can find you and you receive better notifications.'
                : 'Your profile is missing some details. Add job title, phone, location, or manager to unlock improved collaboration and reminders.'}
            </p>
          </div>
        )}

        <div className="mb-8 flex flex-col gap-6 rounded-[28px] border px-6 py-6 sm:px-8" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[24px]" style={{ backgroundColor: activeTheme.surface, color: activeTheme.accent }}>
                <span className="text-2xl font-semibold">{initials}</span>
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>Profile</p>
                <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || 'Guest User'}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: activeTheme.textSecondary }}>
                  Employee identity and account details for your worklog profile, with editable personal fields and read-only company-managed information.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <button
                type="button"
                className="rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                style={{ backgroundColor: activeTheme.accent, color: activeTheme.accentContrast }}
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
                disabled={saving}
              >
                {editMode ? 'Save profile' : 'Edit profile'}
              </button>
              {editMode && (
                <button
                  type="button"
                  className="rounded-2xl border px-5 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}
                  onClick={() => {
                    setEditMode(false);
                    setErrorMessage('');
                    setStatusMessage('');
                    if (user) {
                      setFormState({
                        fullName: user.fullName || user.name || '',
                        phone: user.phone || '',
                        location: user.location || '',
                        manager: user.manager || '',
                      });
                    }
                  }}
                >
                  Cancel
                </button>
              )}
              <div className="rounded-full px-3 py-2 text-sm font-semibold" style={{ backgroundColor: accountBadge ? '#d1fae5' : '#fce7f3', color: accountBadge ? '#047857' : '#be123c' }}>
                {accountStatus}
              </div>
            </div>
          </div>

          {(statusMessage || errorMessage) && (
            <div className={`rounded-[24px] border px-4 py-3 text-sm ${statusMessage ? 'border-green-200 bg-green-50 text-emerald-700' : 'border-red-200 bg-red-50 text-rose-700'}`}>
              {statusMessage || errorMessage}
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {primaryFields.map((item) => (
              <div key={item.key} className="rounded-[24px] border px-4 py-4" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface }}>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{item.label}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Personal Information</h2>
                <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Editable fields are marked with personal details that help coworkers find you.</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Full name</p>
                {editMode ? (
                  <input
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder="Full name"
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || 'Not available'}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Email</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.email || 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Phone</p>
                {editMode ? (
                  <input
                    name="phone"
                    value={formState.phone}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder="Phone number"
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.phone || 'Not provided'}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Location</p>
                {editMode ? (
                  <input
                    name="location"
                    value={formState.location}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder="Office location"
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.location || 'Not provided'}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Manager</p>
                {editMode ? (
                  <input
                    name="manager"
                    value={formState.manager}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder="Manager name"
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.manager || 'Not assigned'}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Employment Information</h2>
              <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Company-managed details are shown as read-only and can be confirmed with HR.</p>
            </div>
            <div className="grid gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Job title</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.jobTitle || 'Not assigned'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Department</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.department || 'Not assigned'}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Employee ID</p>
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.employeeId || 'Not available'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Joining date</p>
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Role</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.role || 'Employee'}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>Account Settings</h2>
              <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>Manage authentication hints, login details, and company access levels.</p>
            </div>
            <div className="rounded-2xl border px-4 py-2 text-sm font-semibold" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
              Editable: phone, location, manager
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Login email</p>
              <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.email || 'Not available'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Access level</p>
              <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.accessLevel || 'Standard user'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Last login</p>
              <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{lastLogin}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>Profile visibility</p>
              <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.visibility || 'Internal only'}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
