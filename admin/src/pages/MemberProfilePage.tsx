import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, PageHeader, Spinner, inputClass } from '../components/ui'
import { DAY_NAMES } from '../types/trainer'

interface MemberDetail {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  createdAt: string
  memberships: { id: string; plan: { name: string }; status: string; startDate: string; endDate: string }[]
  payments: { id: string; amount: string; status: string; method: string; createdAt: string }[]
  assignedTrainerId: string | null
  assignedTrainer: { id: string; user: { name: string; email: string } } | null
}

interface TrainerOption {
  id: string
  user: { name: string }
}

interface WaterData {
  todayWaterMl: number
  targetWaterMl: number
  weekly: { date: string; waterLoggedMl: number }[]
}

interface DietPlan {
  id: string
  name: string
  notes: string | null
  targetWaterMl: number | null
  supplements: string | null
  createdAt: string
  trainerName: string | null
  meals: { id: string; dayOfWeek: number; mealType: string; foodName: string; calories: number }[]
}

interface TrainerReport {
  assignedTrainer: { id: string; bio: string | null; specialties: string[]; user: { name: string; email: string; phone: string | null } } | null
  assignments: {
    id: string
    trainerName: string
    trainingType: string
    startDate: string
    endDate: string | null
    schedule: string | null
    notes: string | null
    status: string
  }[]
  sessions: {
    id: string
    trainerName: string
    startTime: string
    endTime: string
    status: string
    sessionType: string | null
    notes: string | null
  }[]
}

export default function MemberProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const detailQuery = useQuery<MemberDetail>({
    queryKey: ['admin-member', id],
    queryFn: () => api.get(`/admin/members/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const waterQuery = useQuery<WaterData>({
    queryKey: ['admin-member-water', id],
    queryFn: () => api.get(`/admin/members/${id}/water`).then((r) => r.data),
    enabled: !!id,
  })

  const dietPlansQuery = useQuery<DietPlan[]>({
    queryKey: ['admin-member-diet-plans', id],
    queryFn: () => api.get(`/admin/members/${id}/diet-plans`).then((r) => r.data),
    enabled: !!id,
  })

  const trainerReportQuery = useQuery<TrainerReport>({
    queryKey: ['admin-member-trainer-report', id],
    queryFn: () => api.get(`/admin/members/${id}/trainer-report`).then((r) => r.data),
    enabled: !!id,
  })

  const trainersQuery = useQuery<TrainerOption[]>({
    queryKey: ['admin-trainers'],
    queryFn: () => api.get('/admin/trainers').then((r) => r.data),
  })

  const updateRole = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/members/${id}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
    },
  })

  const updateTrainer = useMutation({
    mutationFn: (assignedTrainerId: string | null) => api.patch(`/admin/members/${id}`, { assignedTrainerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-member', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-member-trainer-report', id] })
    },
  })

  const deleteMember = useMutation({
    mutationFn: () => api.delete(`/admin/members/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      navigate('/members')
    },
  })

  if (detailQuery.isLoading) return <Spinner />
  if (detailQuery.error || !detailQuery.data) return <ErrorState message={apiErrorMessage(detailQuery.error)} />

  const member = detailQuery.data
  const waterPct = waterQuery.data
    ? Math.min(100, Math.round((waterQuery.data.todayWaterMl / (waterQuery.data.targetWaterMl || 1)) * 100))
    : 0

  return (
    <div>
      <Link to="/members" className="text-sm text-primary mb-4 inline-block">
        &larr; Back to Members
      </Link>

      <PageHeader
        title={member.name}
        subtitle={member.email}
        actions={
          <div className="flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <span className="text-sm text-text-muted self-center">Delete this member permanently?</span>
                <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
                <Button variant="danger" disabled={deleteMember.isPending} onClick={() => deleteMember.mutate()}>
                  {deleteMember.isPending ? 'Deleting…' : 'Confirm Delete'}
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                Delete Member
              </Button>
            )}
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="p-5">
          <div className="font-semibold text-text mb-3">Profile</div>
          <InfoRow label="Phone" value={member.phone ?? '—'} />
          <InfoRow label="Joined" value={new Date(member.createdAt).toLocaleDateString()} />

          <label className="block mt-4 mb-3">
            <span className="block text-sm font-medium text-text mb-1">Role</span>
            <select
              className={inputClass}
              value={member.role}
              onChange={(e) => updateRole.mutate(e.target.value)}
              disabled={updateRole.isPending}
            >
              <option value="MEMBER">MEMBER</option>
              <option value="TRAINER">TRAINER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-text mb-1">Assigned trainer</span>
            <select
              className={inputClass}
              value={member.assignedTrainerId ?? ''}
              onChange={(e) => updateTrainer.mutate(e.target.value || null)}
              disabled={updateTrainer.isPending}
            >
              <option value="">— None —</option>
              {trainersQuery.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </label>
        </Card>

        <Card className="p-5">
          <div className="font-semibold text-text mb-3">Memberships</div>
          {member.memberships.length === 0 && <div className="text-sm text-text-faint">No memberships yet.</div>}
          {member.memberships.map((m) => (
            <div key={m.id} className="flex justify-between items-center text-sm py-2 border-b border-border last:border-0">
              <div>
                <div className="text-text font-medium">{m.plan.name}</div>
                <div className="text-text-faint text-xs">
                  {new Date(m.startDate).toLocaleDateString()} – {new Date(m.endDate).toLocaleDateString()}
                </div>
              </div>
              <Badge color={m.status === 'ACTIVE' ? 'green' : m.status === 'PENDING' ? 'amber' : 'slate'}>
                {m.status}
              </Badge>
            </div>
          ))}

          <div className="font-semibold text-text mb-2 mt-4">Recent Payments</div>
          {member.payments.length === 0 && <div className="text-sm text-text-faint">No payments yet.</div>}
          {member.payments.map((p) => (
            <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
              <span className="text-text-muted">
                ₹{Number(p.amount).toLocaleString()} · {p.method}
              </span>
              <Badge color={p.status === 'SUCCESS' ? 'green' : p.status === 'FAILED' ? 'red' : 'slate'}>
                {p.status}
              </Badge>
            </div>
          ))}
        </Card>
      </div>

      <Card className="p-5 mb-4">
        <div className="font-semibold text-text mb-3">Water Intake</div>
        {waterQuery.isLoading ? (
          <Spinner />
        ) : waterQuery.error || !waterQuery.data ? (
          <ErrorState message={apiErrorMessage(waterQuery.error)} />
        ) : (
          <div className="grid md:grid-cols-[200px_1fr] gap-6 items-center">
            <div>
              <div className="text-2xl font-bold text-text">
                {(waterQuery.data.todayWaterMl / 1000).toFixed(1)}L
                <span className="text-sm text-text-muted font-normal"> / {(waterQuery.data.targetWaterMl / 1000).toFixed(1)}L</span>
              </div>
              <div className="text-xs text-text-faint mb-2">today</div>
              <div className="w-full h-2 rounded-full bg-surface-hover overflow-hidden">
                <div className="h-full bg-blue rounded-full" style={{ width: `${waterPct}%` }} />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={waterQuery.data.weekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#232838" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#8b93a7' }}
                  tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis tick={{ fontSize: 11, fill: '#8b93a7' }} />
                <Tooltip contentStyle={{ background: '#171b28', border: '1px solid #232838', borderRadius: 8 }} />
                <Bar dataKey="waterLoggedMl" fill="#3b82f6" radius={[4, 4, 0, 0]} name="ml" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        <p className="text-xs text-text-faint mt-3">Shows what the member has logged themselves.</p>
      </Card>

      <Card className="p-5 mb-4">
        <div className="font-semibold text-text mb-3">Diet Plans</div>
        {dietPlansQuery.isLoading ? (
          <Spinner />
        ) : dietPlansQuery.error || !dietPlansQuery.data ? (
          <ErrorState message={apiErrorMessage(dietPlansQuery.error)} />
        ) : dietPlansQuery.data.length === 0 ? (
          <p className="text-sm text-text-faint">No diet plans assigned yet.</p>
        ) : (
          <div className="space-y-4">
            {dietPlansQuery.data.map((plan) => (
              <div key={plan.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-text">{plan.name}</div>
                  {plan.trainerName && <span className="text-xs text-text-faint">by {plan.trainerName}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
                  {plan.targetWaterMl && <span>💧 {(plan.targetWaterMl / 1000).toFixed(1)}L/day</span>}
                  {plan.supplements && <span>💊 {plan.supplements}</span>}
                </div>
                <div className="space-y-1">
                  {plan.meals.map((m) => (
                    <div key={m.id} className="text-xs text-text-muted flex gap-2">
                      <span className="w-16 shrink-0 font-medium text-text-faint">{DAY_NAMES[m.dayOfWeek].slice(0, 3)}</span>
                      <span className="w-20 shrink-0">{m.mealType}</span>
                      <span>
                        {m.foodName} ({m.calories} kcal)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="font-semibold text-text mb-3">Trainer Report</div>
        {trainerReportQuery.isLoading ? (
          <Spinner />
        ) : trainerReportQuery.error || !trainerReportQuery.data ? (
          <ErrorState message={apiErrorMessage(trainerReportQuery.error)} />
        ) : (
          <>
            {trainerReportQuery.data.assignedTrainer ? (
              <div className="mb-4 p-3 bg-bg rounded-lg">
                <div className="font-medium text-text">{trainerReportQuery.data.assignedTrainer.user.name}</div>
                <div className="text-xs text-text-muted">{trainerReportQuery.data.assignedTrainer.user.email}</div>
                {trainerReportQuery.data.assignedTrainer.specialties.length > 0 && (
                  <div className="text-xs text-text-faint mt-1">
                    {trainerReportQuery.data.assignedTrainer.specialties.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-text-faint mb-4">No trainer currently assigned.</p>
            )}

            <div className="text-sm font-medium text-text mb-2">Assignment notes</div>
            {trainerReportQuery.data.assignments.length === 0 ? (
              <p className="text-sm text-text-faint mb-4">No assignment history.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {trainerReportQuery.data.assignments.map((a) => (
                  <div key={a.id} className="text-sm border-b border-border pb-2 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text">
                        {a.trainingType} · {a.trainerName}
                      </span>
                      <Badge color={a.status === 'ACTIVE' ? 'green' : a.status === 'CANCELLED' ? 'red' : 'slate'}>
                        {a.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-text-faint">
                      since {new Date(a.startDate).toLocaleDateString()}
                      {a.schedule && ` · ${a.schedule}`}
                    </div>
                    {a.notes && <div className="text-xs text-text-muted mt-1">{a.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm font-medium text-text mb-2">Session history</div>
            {trainerReportQuery.data.sessions.length === 0 ? (
              <p className="text-sm text-text-faint">No PT sessions yet.</p>
            ) : (
              <div className="space-y-2">
                {trainerReportQuery.data.sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">
                      {new Date(s.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} ·{' '}
                      {s.trainerName}
                      {s.sessionType && ` · ${s.sessionType}`}
                    </span>
                    <Badge
                      color={
                        s.status === 'COMPLETED' ? 'green' : s.status === 'CANCELLED' ? 'red' : s.status === 'IN_PROGRESS' ? 'amber' : 'blue'
                      }
                    >
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium text-right">{value}</span>
    </div>
  )
}
