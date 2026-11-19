import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import CheckInPage from './features/checkin/CheckInPage'
import ProgressPage from './features/progress/ProgressPage'
import { ErrorState, Loading } from './components/ui'
import { useApp } from './hooks/app'
import CalmPage from './pages/CalmPage'
import ChecklistPage from './pages/ChecklistPage'
import ChecklistsPage from './pages/ChecklistsPage'
import HomePage from './pages/HomePage'
import SafeModePage from './pages/SafeModePage'
import SchedulePage from './pages/SchedulePage'
import SessionPage from './pages/SessionPage'
import SetupPage from './pages/SetupPage'
import TaskEditPage from './pages/TaskEditPage'
import WorkspacePage from './pages/WorkspacePage'

export default function App() {
  const { status, error, reload } = useApp()
  const { pathname } = useLocation()

  // The safe-mode screen must always open, even if the profile or server is unavailable.
  if (pathname === '/safe') return <SafeModePage />
  if (status === 'loading') return <div className="mx-auto max-w-md pt-24"><Loading /></div>
  if (status === 'error') return <div className="mx-auto max-w-md pt-16"><ErrorState message={error} onRetry={reload} /></div>
  if (status === 'needs-setup' && pathname !== '/setup') return <Navigate to="/setup" replace />

  return (
    <Routes>
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/" element={<HomePage />} />
      <Route path="/schedule/:id" element={<SchedulePage />} />
      <Route path="/schedule/:id/task/:taskId" element={<SessionPage />} />
      <Route path="/schedule/:id/task/:taskId/edit" element={<TaskEditPage />} />
      <Route path="/checklists" element={<ChecklistsPage />} />
      <Route path="/checklists/:id" element={<ChecklistPage />} />
      <Route path="/calm" element={<CalmPage />} />
      <Route path="/workspace" element={<WorkspacePage />} />
      <Route path="/checkin" element={<CheckInPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
