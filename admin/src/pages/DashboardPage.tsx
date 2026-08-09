import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Area, AreaChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Card, ErrorState, PageHeader, Spinner, StatCard } from '../components/ui'

interface DashboardStats {
  totalMembers: number
  activeMemberships: number
  totalTrainers: number
  newMembersThisMonth: number
  monthlyRevenue: string
  totalRevenue: string
  upcomingClassesCount: number
  duesExpiringSoonCount: number
  pendingPaymentsCount: number
  membershipStatusBreakdown: { status: string; count: number }[]
  signupsTrend: { date: string; count: number }[]
  recentMembers: { id: string; name: string; email: string; createdAt: string; planName: string | null }[]
  recentPayments: { id: string; userName: string; amount: string; status: string; createdAt: string }[]
  todaysSchedule: { id: string; className: string; trainerName: string | null; startsAt: string; endsAt: string }[]
  topTrainers: { id: string; name: string; memberCount: number }[]
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#22c55e',
  EXPIRED: '#f59e0b',
  PENDING: '#8b5cf6',
  CANCELLED: '#ef4444',
}

const PAYMENT_BADGE: Record<string, 'green' | 'amber' | 'red' | 'slate'> = {
  SUCCESS: 'green',
  PENDING: 'amber',
  FAILED: 'red',
  REFUNDED: 'slate',
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then((res) => res.data),
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  const totalMembershipStatuses = data.membershipStatusBreakdown.reduce((sum, s) => sum + s.count, 0)

  return (
    <div>
      <PageHeader
        title="Welcome back! 👋"
        subtitle="Here's what's happening in your gym today."
        actions={
          <Link
            to="/members"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            + Add New
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Members" value={data.totalMembers.toLocaleString()} icon="👥" color="pink" />
        <StatCard label="Active Memberships" value={data.activeMemberships.toLocaleString()} icon="🎫" color="purple" />
        <StatCard label="Upcoming Classes" value={data.upcomingClassesCount.toLocaleString()} icon="🗓️" color="blue" />
        <StatCard
          label="Monthly Revenue"
          value={`₹${Number(data.monthlyRevenue).toLocaleString()}`}
          icon="💰"
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="font-semibold text-text">New Signups</div>
              <div className="text-xs text-text-muted">Last 14 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.signupsTrend} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="signupsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ee2a5c" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#ee2a5c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: '#171b28', border: '1px solid #232838', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#8b93a7' }}
                labelFormatter={(v) => new Date(String(v)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#ee2a5c"
                strokeWidth={2}
                fill="url(#signupsFill)"
                name="Signups"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <div className="font-semibold text-text mb-4">Membership Status</div>
          {totalMembershipStatuses === 0 ? (
            <div className="text-sm text-text-muted py-10 text-center">No memberships yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={data.membershipStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {data.membershipStatusBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLOR[entry.status] ?? '#8b93a7'} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#171b28', border: '1px solid #232838', borderRadius: 8, fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {data.membershipStatusBreakdown.map((s) => (
                  <div key={s.status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: STATUS_COLOR[s.status] ?? '#8b93a7' }}
                      />
                      <span className="text-text-muted capitalize">{s.status.toLowerCase()}</span>
                    </div>
                    <span className="text-text font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="font-semibold text-text">Recent Payments</div>
            <Link to="/payments" className="text-xs text-primary font-medium">
              View All
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-faint">
                <th className="px-5 py-2.5 font-medium">Member</th>
                <th className="px-5 py-2.5 font-medium">Amount</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
                <th className="px-5 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentPayments.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-5 py-3 text-text font-medium">{p.userName}</td>
                  <td className="px-5 py-3 text-text-muted">₹{Number(p.amount).toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <Badge color={PAYMENT_BADGE[p.status] ?? 'slate'}>{p.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-text-faint">
                    {new Date(p.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                  </td>
                </tr>
              ))}
              {data.recentPayments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-text-faint">
                    No payments yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-text mb-4">Today's Schedule</div>
          <div className="space-y-3">
            {data.todaysSchedule.map((s) => (
              <div key={s.id} className="flex items-start gap-3">
                <div className="w-14 shrink-0 text-xs font-semibold text-primary pt-0.5">
                  {new Date(s.startsAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex-1 border-l-2 border-primary/40 pl-3 pb-1">
                  <div className="text-sm font-medium text-text">{s.className}</div>
                  <div className="text-xs text-text-faint">{s.trainerName ?? 'Unassigned'}</div>
                </div>
              </div>
            ))}
            {data.todaysSchedule.length === 0 && (
              <div className="text-sm text-text-faint text-center py-8">Nothing scheduled today</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-text">Recent Members</div>
            <Link to="/members" className="text-xs text-primary font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {data.recentMembers.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple/15 text-purple flex items-center justify-center text-xs font-semibold shrink-0">
                  {m.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text truncate">{m.name}</div>
                  <div className="text-xs text-text-faint truncate">{m.planName ?? 'No active plan'}</div>
                </div>
              </div>
            ))}
            {data.recentMembers.length === 0 && <div className="text-sm text-text-faint text-center py-8">No members yet</div>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-text mb-4">Top Trainers</div>
          <div className="space-y-3">
            {data.topTrainers.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3">
                <div className="w-6 text-xs font-semibold text-text-faint">{i + 1}</div>
                <div className="w-8 h-8 rounded-full bg-blue/15 text-blue flex items-center justify-center text-xs font-semibold shrink-0">
                  {t.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-text truncate">{t.name}</div>
                  <div className="text-xs text-text-faint">{t.memberCount} members</div>
                </div>
              </div>
            ))}
            {data.topTrainers.length === 0 && <div className="text-sm text-text-faint text-center py-8">No trainers yet</div>}
          </div>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-text mb-4">Needs Attention</div>
          <div className="space-y-3">
            <Link
              to="/dues"
              className="flex items-center justify-between p-3 rounded-xl bg-orange/10 hover:bg-orange/15 transition-colors"
            >
              <span className="text-sm text-text">Memberships expiring soon</span>
              <span className="text-sm font-bold text-orange">{data.duesExpiringSoonCount}</span>
            </Link>
            <Link
              to="/payments"
              className="flex items-center justify-between p-3 rounded-xl bg-red/10 hover:bg-red/15 transition-colors"
            >
              <span className="text-sm text-text">Pending payments</span>
              <span className="text-sm font-bold text-red">{data.pendingPaymentsCount}</span>
            </Link>
            <Link
              to="/trainers"
              className="flex items-center justify-between p-3 rounded-xl bg-purple/10 hover:bg-purple/15 transition-colors"
            >
              <span className="text-sm text-text">Total trainers</span>
              <span className="text-sm font-bold text-purple">{data.totalTrainers}</span>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
