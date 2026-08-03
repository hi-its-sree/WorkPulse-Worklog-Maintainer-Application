import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6 lg:px-8">
      <div className="app-card">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.4em] text-blue-600">Profile</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">User details</h1>
          <p className="mt-2 text-slate-500">View and confirm your employee information.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[28px] bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Personal info</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Full name</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user?.fullName || user?.name || 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Department</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user?.department || 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Email</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user?.email || 'Not available'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">About this account</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-700">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Role</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user?.role || 'Employee'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Member since</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Not available'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                <p className="mt-2 text-base font-semibold text-slate-900">{user ? 'Active' : 'Guest'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
