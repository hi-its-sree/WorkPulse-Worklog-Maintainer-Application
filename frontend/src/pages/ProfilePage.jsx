import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext.jsx';
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { updateUserProfile } from '../lib/auth.js';

const ProfilePage = () => {
  const { user, signIn } = useContext(AuthContext);
  const { activeTheme } = useTheme();
  const { strings, locale } = useLanguage();
  const location = useLocation();
  const onboarding = new URLSearchParams(location.search).get('onboarding') === '1';

  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState({ fullName: '', email: '', employeeId: '', department: '', jobTitle: '', phone: '', location: '', manager: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormState({
        fullName: user.fullName || user.name || '',
        email: user.email || '',
        employeeId: user.employeeId || '',
        department: user.department || '',
        jobTitle: user.jobTitle || '',
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
  const lastLogin = user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString(locale) : strings.profile.noRecentActivity;

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formState.fullName.trim()) {
      setErrorMessage(strings.profile.blankName);
      return;
    }
    setSaving(true);
    setErrorMessage('');
    setStatusMessage('');

    try {
      const response = await updateUserProfile({
        fullName: formState.fullName,
        email: formState.email,
        employeeId: formState.employeeId,
        department: formState.department,
        jobTitle: formState.jobTitle,
        phone: formState.phone,
        location: formState.location,
        manager: formState.manager,
      });
      signIn(response.user);
      setStatusMessage(strings.profile.success);
      setEditMode(false);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || strings.profile.saveError);
    } finally {
      setSaving(false);
    }
  };

  const primaryFields = [
    { key: 'jobTitle', label: strings.profile.jobTitle, value: user?.jobTitle || strings.profile.notAssigned },
    { key: 'department', label: strings.profile.department, value: user?.department || strings.profile.notAssigned },
    { key: 'employeeId', label: strings.profile.employeeId, value: user?.employeeId || strings.profile.placeholder },
    { key: 'accountStatus', label: strings.profile.accountStatus, value: accountStatus },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        {profileIncomplete && (
          <div className="mb-6 rounded-[28px] border px-6 py-5" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surface, color: activeTheme.textPrimary }}>
            <p className="font-semibold">{onboarding ? strings.profile.welcome : strings.profile.completeTitle}</p>
            <p className="mt-2 text-sm" style={{ color: activeTheme.textSecondary }}>
              {onboarding ? strings.profile.onboardingDescription : strings.profile.completeDescription}
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
                <p className="text-sm uppercase tracking-[0.4em]" style={{ color: activeTheme.accent }}>{strings.profile.title}</p>
                <h1 className="mt-2 text-3xl font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || 'Guest User'}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: activeTheme.textSecondary }}>
                  {strings.profile.heading}
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
                {editMode ? strings.profile.saveButton : strings.profile.editButton}
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
                        email: user.email || '',
                        employeeId: user.employeeId || '',
                        department: user.department || '',
                        jobTitle: user.jobTitle || '',
                        phone: user.phone || '',
                        location: user.location || '',
                        manager: user.manager || '',
                      });
                    }
                  }}
                >
                  {strings.profile.cancelButton}
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
                <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.profile.personalInfoTitle}</h2>
                <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.profile.personalInfoDescription}</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.fullName}</p>
                {editMode ? (
                  <input
                    name="fullName"
                    value={formState.fullName}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.fullName}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.fullName || user?.name || strings.profile.placeholder}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.email}</p>
                {editMode ? (
                  <input
                    name="email"
                    type="email"
                    value={formState.email}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.email}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.email || strings.profile.placeholder}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.employeeId}</p>
                {editMode ? (
                  <input
                    name="employeeId"
                    value={formState.employeeId}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.employeeId}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.employeeId || strings.profile.placeholder}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.phone}</p>
                {editMode ? (
                  <input
                    name="phone"
                    value={formState.phone}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.phone}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.phone || 'Not provided'}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.location}</p>
                {editMode ? (
                  <input
                    name="location"
                    value={formState.location}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.location}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.location || 'Not provided'}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.department}</p>
                {editMode ? (
                  <input
                    name="department"
                    value={formState.department}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.department}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.department || 'Not assigned'}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.manager}</p>
                {editMode ? (
                  <input
                    name="manager"
                    value={formState.manager}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.manager}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.manager || 'Not assigned'}</p>
                )}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
            <div className="mb-5">
              <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.profile.employmentTitle}</h2>
              <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.profile.employmentDescription}</p>
            </div>
            <div className="grid gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.jobTitle}</p>
                {editMode ? (
                  <input
                    name="jobTitle"
                    value={formState.jobTitle}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.jobTitle}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.jobTitle || 'Not assigned'}</p>
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.department}</p>
                {editMode ? (
                  <input
                    name="department"
                    value={formState.department}
                    onChange={handleFieldChange}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                    placeholder={strings.profile.placeholders.department}
                  />
                ) : (
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.department || 'Not assigned'}</p>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.employeeId}</p>
                  {editMode ? (
                    <input
                      name="employeeId"
                      value={formState.employeeId}
                      onChange={handleFieldChange}
                      className="mt-2 w-full rounded-3xl border border-slate-200 bg-transparent px-4 py-3 text-base text-slate-900 outline-none"
                      placeholder={strings.profile.placeholders.employeeId}
                    />
                  ) : (
                    <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.employeeId || strings.profile.placeholder}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.joiningDate}</p>
                  <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString(locale) : 'Not available'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.role}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.role || strings.profile.defaultRole}</p>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-[28px] border p-6" style={{ borderColor: activeTheme.border, backgroundColor: activeTheme.surfaceAlt }}>
          <div className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-semibold" style={{ color: activeTheme.textPrimary }}>{strings.profile.accountSettingsTitle}</h2>
                <p className="mt-1 text-sm" style={{ color: activeTheme.textSecondary }}>{strings.profile.accountSettingsDescription}</p>
              </div>
              <div className="rounded-2xl border px-4 py-4 text-sm font-semibold min-w-0" style={{ borderColor: activeTheme.border, color: activeTheme.textSecondary }}>
                <p className="whitespace-normal break-words">{strings.profile.editableFields}</p>
                <p className="mt-3 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.email || strings.profile.placeholder}</p>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.accessLevel}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.accessLevel || strings.profile.defaultAccessLevel}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.lastLogin}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{lastLogin}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.3em]" style={{ color: activeTheme.textSecondary }}>{strings.profile.profileVisibility}</p>
                <p className="mt-2 text-base font-semibold" style={{ color: activeTheme.textPrimary }}>{user?.visibility || strings.profile.defaultVisibility}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
