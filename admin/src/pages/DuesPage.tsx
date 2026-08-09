import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Card, ErrorState, PageHeader, Spinner } from '../components/ui'

interface DueEntry {
  membershipId: string
  member: { name: string; email: string; phone: string | null }
  planName: string
  amountDue: string
  endDate: string
  autoRenew: boolean
}

interface DuesReport {
  dueSoon: DueEntry[]
  overdue: DueEntry[]
}

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / 86_400_000)
}

function DuesTable({ entries, kind }: { entries: DueEntry[]; kind: 'dueSoon' | 'overdue' }) {
  if (entries.length === 0) {
    return <p className="text-slate-400 text-sm py-6 text-center">Nothing here — all caught up.</p>
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-slate-500">
          <th className="px-4 py-3 font-medium">Member</th>
          <th className="px-4 py-3 font-medium">Plan</th>
          <th className="px-4 py-3 font-medium">Amount due</th>
          <th className="px-4 py-3 font-medium">{kind === 'dueSoon' ? 'Renews' : 'Expired'}</th>
          <th className="px-4 py-3 font-medium">Auto-renew</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const end = new Date(e.endDate)
          const days = Math.abs(daysBetween(end, new Date()))
          return (
            <tr key={e.membershipId} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{e.member.name}</div>
                <div className="text-slate-500 text-xs">{e.member.email}</div>
                {e.member.phone && <div className="text-slate-400 text-xs">{e.member.phone}</div>}
              </td>
              <td className="px-4 py-3 text-slate-600">{e.planName}</td>
              <td className="px-4 py-3 font-medium text-slate-900">₹{Number(e.amountDue).toLocaleString()}</td>
              <td className="px-4 py-3">
                <Badge color={kind === 'dueSoon' ? 'amber' : 'red'}>
                  {kind === 'dueSoon'
                    ? days === 0
                      ? 'Today'
                      : `in ${days}d (${end.toLocaleDateString()})`
                    : `${days}d ago (${end.toLocaleDateString()})`}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">{e.autoRenew ? 'Yes' : 'No'}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export default function DuesPage() {
  const { data, isLoading, error } = useQuery<DuesReport>({
    queryKey: ['admin-dues'],
    queryFn: () => api.get('/admin/reports/dues').then((r) => r.data),
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader
        title="Dues & Renewals"
        subtitle="Members whose membership payment is due soon or overdue"
      />

      <Card className="mb-6">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Renewing in the next 7 days</span>
          <Badge color="amber">{data.dueSoon.length}</Badge>
        </div>
        <DuesTable entries={data.dueSoon} kind="dueSoon" />
      </Card>

      <Card>
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">Overdue (expired, not renewed)</span>
          <Badge color="red">{data.overdue.length}</Badge>
        </div>
        <DuesTable entries={data.overdue} kind="overdue" />
      </Card>
    </div>
  )
}
