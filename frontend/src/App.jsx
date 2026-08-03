import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PlannerPage from './pages/PlannerPage.jsx';
import ProjectPage from './pages/ProjectPage.jsx';
import MeetingPage from './pages/MeetingPage.jsx';
import TimesheetPage from './pages/TimesheetPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import WorklogPage from './pages/WorklogPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <div className="min-h-screen bg-[var(--app-bg)] text-[var(--text-primary)] transition-colors duration-200">
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="planner" element={<PlannerPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="timesheet" element={<TimesheetPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="projects" element={<ProjectPage />} />
          <Route path="meetings" element={<MeetingPage />} />
          <Route path="worklog" element={<WorklogPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
