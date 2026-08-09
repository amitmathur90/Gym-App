import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../components/ui'

interface Payment {
  id: string
  amount: string
  method: string
  status: string
  createdAt: string
  user: { name: string; email: string }
  membership: { plan: { name: string } } | null
}

interface RevenueReport {
  totalRevenue: number
  byMonth: { month: string; total: number }[]
  byPlan: { planName: string; total: number }[]
}

const PIE_COLORS = ['#2f6f4f', '#5fa8d3', '#e0b84c', '#c96f6f', '#8b6fc9', '#4e9a94']

export default function PaymentsPage() {
  const paymentsQuery = useQuery<{ payments: Payment[]; total: number }>({
    queryKey: ['admin-payments'],
    queryFn: () => api.get('/admin/payments', { params: { pageSize: 20 } }).then((r) => r.data),
  })

  const revenueQuery = useQuery<RevenueReport>({
    queryKey: ['admin-revenue'],
    queryFn: () => api.get('/admin/reports/revenue').then((r) => r.data),
  })

  return (
    <div>
      <PageHeader title="Payments & Revenue" subtitle="Track transactions and revenue trends" />

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Revenue by month</div>
          {revenueQuery.isLoading ? (
            <Spinner />
          ) : revenueQuery.error || !revenueQuery.data ? (
            <ErrorState message={apiErrorMessage(revenueQuery.error)} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={revenueQuery.data.byMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
                <Bar dataKey="total" fill="#2f6f4f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold text-slate-700 mb-3">Revenue by plan</div>
          {revenueQuery.isLoading ? (
            <Spinner />
          ) : revenueQuery.error || !revenueQuery.data ? (
            <ErrorState message={apiErrorMessage(revenueQuery.error)} />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={revenueQuery.data.byPlan}
                  dataKey="total"
                  nameKey="planName"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => String(entry.name ?? '')}
                >
                  {revenueQuery.data.byPlan.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card>
        <div className="px-5 py-4 border-b border-slate-200 text-sm font-semibold text-slate-700">
          Recent payments
        </div>
        {paymentsQuery.isLoading ? (
          <Spinner />
        ) : paymentsQuery.error || !paymentsQuery.data ? (
          <ErrorState message={apiErrorMessage(paymentsQuery.error)} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {paymentsQuery.data.payments.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{p.user.name}</div>
                    <div className="text-slate-500 text-xs">{p.user.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.membership?.plan.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">₹{Number(p.amount).toLocaleString()}</td>
                  <td className="px-4 py-3 text-slate-600">{p.method}</td>
                  <td className="px-4 py-3">
                    <Badge color={p.status === 'SUCCESS' ? 'green' : p.status === 'FAILED' ? 'red' : 'slate'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {paymentsQuery.data.payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No payments yet.
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
