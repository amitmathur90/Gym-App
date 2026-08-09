import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, ErrorState, PageHeader, Spinner, StatCard } from '../../components/ui'
import type { DashboardData, Session } from '../../types/trainerSelf'

const RANGES = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'week', label: 'This Week' },
] as const

const STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  PENDING: 'bg-slate-100 text-slate-600',
  CANCELLED: 'bg-red-100 text-red-700',
}

export default function TrainerDashboardPage() {
  const navigate = useNavigate()
  const [range, setRange] = useState<(typeof RANGES)[number]['value']>('today')

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['trainer-dashboard'],
    queryFn: () => api.get('/trainer/dashboard').then((r) => r.data),
  })

  const scheduleQuery = useQuery<Session[]>({
    queryKey: ['trainer-schedule', range],
    queryFn: () => api.get('/trainer/schedule', { params: { range } }).then((r) => r.data),
  })

  async function downloadReport() {
    const res = await api.get('/trainer/reports/members.csv', { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data]))
    const a = document.createElement('a')
    a.href = url
    a.download = 'assigned-members.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Everything you need to manage your members, in one place" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Assigned Members" value={String(data.totalAssignedMembers)} icon="👥" />
        <StatCard label="Today's Training Sessions" value={String(data.todaysSessions)} icon="🏋️" />
        <StatCard label="Upcoming Sessions (7d)" value={String(data.upcomingSessions)} icon="📅" />
        <StatCard label="Pending Workout Plans" value={String(data.pendingWorkoutPlans)} icon="⏳" />
        <StatCard label="Completed Sessions Today" value={String(data.completedSessionsToday)} icon="✅" />
        <StatCard label="Unread Messages" value={String(data.unreadMessages)} icon="💬" />
        <StatCard label="Average Rating" value={data.averageRating != null ? data.averageRating.toFixed(1) : 'N/A'} icon="⭐" />
        <StatCard label="New Members This Month" value={String(data.newAssignmentsThisMonth)} icon="📈" />
      </div>

      <Card className="p-5 mb-6">
        <div className="font-semibold text-slate-900 mb-3">Quick Actions</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <QuickAction icon="➕" label="Add Workout Plan" onClick={() => navigate('/trainer/workout-plans')} />
          <QuickAction icon="🥗" label="Add Diet Plan" onClick={() => navigate('/trainer/diet-plans')} />
          <QuickAction icon="📅" label="Schedule PT Session" onClick={() => navigate('/trainer/sessions')} />
          <QuickAction
            icon="📲"
            label="Mark Attendance"
            onClick={() =>
              alert(
                "Attendance check-in isn't built yet. In the meantime, mark a session Completed from the Sessions page."
              )
            }
          />
          <QuickAction icon="📊" label="Update Measurements" onClick={() => navigate('/trainer/members')} />
          <QuickAction icon="💬" label="Chat with Members" onClick={() => navigate('/trainer/messages')} />
          <QuickAction icon="📷" label="Upload Progress Photos" onClick={() => navigate('/trainer/members')} />
          <QuickAction icon="📥" label="Download Reports" onClick={downloadReport} />
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="font-semibold text-slate-900">Schedule</div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1 text-sm rounded-md font-medium ${
                  range === r.value ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        {scheduleQuery.isLoading ? (
          <Spinner />
        ) : scheduleQuery.error || !scheduleQuery.data ? (
          <ErrorState message={apiErrorMessage(scheduleQuery.error)} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Session Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {scheduleQuery.data.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 text-slate-900">
                    {new Date(s.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <Link to="/trainer/members" className="text-primary font-medium">
                      {s.member.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.sessionType ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[s.status]}`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
              {scheduleQuery.data.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Nothing scheduled.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5 text-center transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium text-slate-700">{label}</span>
    </button>
  )
}
