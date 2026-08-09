import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Card, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui'

interface DashboardStats {
  totalMembers: number
  activeMemberships: number
  totalTrainers: number
  newMembersThisMonth: number
  monthlyRevenue: string
  totalRevenue: string
  upcomingClassesCount: number
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((res) => res.data),
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your gym's activity" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Members" value={String(data.totalMembers)} icon="👥" />
        <StatCard label="Active Memberships" value={String(data.activeMemberships)} icon="🎫" />
        <StatCard label="Trainers" value={String(data.totalTrainers)} icon="🏋️" />
        <StatCard label="New Members This Month" value={String(data.newMembersThisMonth)} icon="✨" />
        <StatCard label="Upcoming Classes" value={String(data.upcomingClassesCount)} icon="🗓️" />
        <StatCard label="Monthly Revenue" value={`₹${Number(data.monthlyRevenue).toLocaleString()}`} icon="💰" />
      </div>
      <Card className="p-6">
        <div className="text-sm text-slate-500">All-time revenue</div>
        <div className="text-3xl font-bold text-slate-900 mt-1">₹{Number(data.totalRevenue).toLocaleString()}</div>
      </Card>
    </div>
  )
}
