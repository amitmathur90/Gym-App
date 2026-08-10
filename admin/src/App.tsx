import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './lib/auth'
import Layout from './components/Layout'
import { Spinner } from './components/ui'
import LoginPage from './pages/LoginPage'
import UserGuidePage from './pages/UserGuidePage'
import DashboardPage from './pages/DashboardPage'
import MembersPage from './pages/MembersPage'
import MemberProfilePage from './pages/MemberProfilePage'
import TrainersPage from './pages/TrainersPage'
import TrainerProfilePage from './pages/TrainerProfilePage'
import PlansPage from './pages/PlansPage'
import DietPlansPage from './pages/DietPlansPage'
import FoodsPage from './pages/FoodsPage'
import ClassesPage from './pages/ClassesPage'
import PaymentsPage from './pages/PaymentsPage'
import DuesPage from './pages/DuesPage'
import SettingsPage from './pages/SettingsPage'
import TrainerDashboardPage from './pages/trainer/TrainerDashboardPage'
import TrainerMembersPage from './pages/trainer/TrainerMembersPage'
import TrainerMemberProfilePage from './pages/trainer/TrainerMemberProfilePage'
import TrainerWorkoutPlansPage from './pages/trainer/TrainerWorkoutPlansPage'
import TrainerDietPlansPage from './pages/trainer/TrainerDietPlansPage'
import TrainerSessionsPage from './pages/trainer/TrainerSessionsPage'
import TrainerAlertsPage from './pages/trainer/TrainerAlertsPage'
import TrainerMessagesPage from './pages/trainer/TrainerMessagesPage'

function ProtectedLayout() {
  const { status } = useAuth()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />
  return <Layout />
}

function RoleGate({ role, children }: { role: 'ADMIN' | 'TRAINER'; children: ReactNode }) {
  const { user } = useAuth()
  if (user?.role !== role) return <Navigate to={user?.role === 'TRAINER' ? '/trainer' : '/'} replace />
  return <>{children}</>
}

function RoleHome() {
  const { user } = useAuth()
  return user?.role === 'TRAINER' ? <Navigate to="/trainer" replace /> : <DashboardPage />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/guide" element={<UserGuidePage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<RoleHome />} />
        <Route path="/members" element={<RoleGate role="ADMIN"><MembersPage /></RoleGate>} />
        <Route path="/members/:id" element={<RoleGate role="ADMIN"><MemberProfilePage /></RoleGate>} />
        <Route path="/trainers" element={<RoleGate role="ADMIN"><TrainersPage /></RoleGate>} />
        <Route path="/trainers/:id" element={<RoleGate role="ADMIN"><TrainerProfilePage /></RoleGate>} />
        <Route path="/plans" element={<RoleGate role="ADMIN"><PlansPage /></RoleGate>} />
        <Route path="/diet-plans" element={<RoleGate role="ADMIN"><DietPlansPage /></RoleGate>} />
        <Route path="/foods" element={<RoleGate role="ADMIN"><FoodsPage /></RoleGate>} />
        <Route path="/classes" element={<RoleGate role="ADMIN"><ClassesPage /></RoleGate>} />
        <Route path="/payments" element={<RoleGate role="ADMIN"><PaymentsPage /></RoleGate>} />
        <Route path="/dues" element={<RoleGate role="ADMIN"><DuesPage /></RoleGate>} />
        <Route path="/settings" element={<RoleGate role="ADMIN"><SettingsPage /></RoleGate>} />

        <Route path="/trainer" element={<RoleGate role="TRAINER"><TrainerDashboardPage /></RoleGate>} />
        <Route path="/trainer/members" element={<RoleGate role="TRAINER"><TrainerMembersPage /></RoleGate>} />
        <Route path="/trainer/members/:id" element={<RoleGate role="TRAINER"><TrainerMemberProfilePage /></RoleGate>} />
        <Route path="/trainer/workout-plans" element={<RoleGate role="TRAINER"><TrainerWorkoutPlansPage /></RoleGate>} />
        <Route path="/trainer/diet-plans" element={<RoleGate role="TRAINER"><TrainerDietPlansPage /></RoleGate>} />
        <Route path="/trainer/sessions" element={<RoleGate role="TRAINER"><TrainerSessionsPage /></RoleGate>} />
        <Route path="/trainer/alerts" element={<RoleGate role="TRAINER"><TrainerAlertsPage /></RoleGate>} />
        <Route path="/trainer/messages" element={<RoleGate role="TRAINER"><TrainerMessagesPage /></RoleGate>} />
        <Route path="/trainer/messages/:memberId" element={<RoleGate role="TRAINER"><TrainerMessagesPage /></RoleGate>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
