import { useQuery } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Card, ErrorState, PageHeader, Spinner } from '../../components/ui'
import type { Alert } from '../../types/trainerSelf'
import { ALERT_ICONS } from '../../types/trainerSelf'

export default function TrainerAlertsPage() {
  const { data, isLoading, error } = useQuery<Alert[]>({
    queryKey: ['trainer-alerts'],
    queryFn: () => api.get('/trainer/alerts').then((r) => r.data),
    refetchInterval: 60_000,
  })

  return (
    <div>
      <PageHeader title="Notifications" subtitle="New assignments, upcoming sessions, expiring memberships, and birthdays" />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <Card>
          <div className="divide-y divide-border">
            {data.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <span className="text-xl">{ALERT_ICONS[a.type] ?? '🔔'}</span>
                <div>
                  <div className="text-sm text-text">{a.message}</div>
                  <div className="text-xs text-text-faint mt-0.5">{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
            {data.length === 0 && <div className="px-5 py-16 text-center text-text-faint">You're all caught up.</div>}
          </div>
        </Card>
      )}

      <p className="text-xs text-text-faint mt-4">
        This is a live activity feed computed from current data, not a persisted/pushed notification system —
        there's no background job scheduler or push infrastructure behind it yet.
      </p>
    </div>
  )
}
