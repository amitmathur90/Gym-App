import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, ErrorState, PageHeader, Spinner } from '../../components/ui'
import type { AssignedMemberCard } from '../../types/trainerSelf'

export default function TrainerMembersPage() {
  const { data, isLoading, error } = useQuery<AssignedMemberCard[]>({
    queryKey: ['trainer-members'],
    queryFn: () => api.get('/trainer/members').then((r) => r.data),
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader title="My Members" subtitle={`${data.length} assigned to you`} />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((m) => (
          <Card key={m.id} className="p-5">
            <div className="flex items-center gap-3 mb-3">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {m.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold text-text truncate">{m.name}</div>
                <div className="text-xs text-text-muted truncate">{m.membershipPlan ?? 'No active membership'}</div>
              </div>
            </div>

            <dl className="text-sm space-y-1 mb-3">
              <div className="flex justify-between">
                <dt className="text-text-muted">Goal</dt>
                <dd className="text-text font-medium">{m.goal ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Last visit</dt>
                <dd className="text-text font-medium">
                  {m.lastVisit ? new Date(m.lastVisit).toLocaleDateString() : '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Weekly consistency</dt>
                <dd className="text-text font-medium">{m.weeklyConsistencyPct}%</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Next session</dt>
                <dd className="text-text font-medium">
                  {m.nextSession ? new Date(m.nextSession).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                </dd>
              </div>
            </dl>

            <div className="w-full bg-surface-hover rounded-full h-1.5 mb-4">
              <div
                className="bg-primary h-1.5 rounded-full"
                style={{ width: `${m.weeklyConsistencyPct}%` }}
              />
            </div>

            <Link
              to={`/trainer/members/${m.id}`}
              className="block text-center w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:bg-primary-dark transition-colors mb-2"
            >
              View Profile
            </Link>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <Link to={`/trainer/workout-plans?memberId=${m.id}`} className="text-center py-1.5 rounded border border-border hover:border-primary text-text-muted hover:text-primary">
                Workout
              </Link>
              <Link to={`/trainer/diet-plans?memberId=${m.id}`} className="text-center py-1.5 rounded border border-border hover:border-primary text-text-muted hover:text-primary">
                Diet
              </Link>
              <Link to={`/trainer/messages/${m.id}`} className="text-center py-1.5 rounded border border-border hover:border-primary text-text-muted hover:text-primary">
                Chat
              </Link>
            </div>
          </Card>
        ))}
        {data.length === 0 && (
          <p className="text-text-faint col-span-full text-center py-16">
            No members assigned yet — the admin panel assigns members to trainers.
          </p>
        )}
      </div>
    </div>
  )
}
