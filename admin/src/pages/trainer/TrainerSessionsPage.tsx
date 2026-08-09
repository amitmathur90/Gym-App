import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../../components/ui'
import type { AssignedMemberCard, Session } from '../../types/trainerSelf'

const STATUS_COLORS: Record<string, 'slate' | 'green' | 'red' | 'amber'> = {
  UPCOMING: 'slate',
  IN_PROGRESS: 'amber',
  COMPLETED: 'green',
  PENDING: 'slate',
  CANCELLED: 'red',
}

export default function TrainerSessionsPage() {
  const [showSchedule, setShowSchedule] = useState(false)
  const [rescheduling, setRescheduling] = useState<Session | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<Session[]>({
    queryKey: ['trainer-schedule', 'week'],
    queryFn: () => api.get('/trainer/schedule', { params: { range: 'week' } }).then((r) => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.patch(`/trainer/sessions/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-schedule'] }),
  })

  return (
    <div>
      <PageHeader
        title="Session Management"
        subtitle="Upcoming sessions in the next 7 days"
        actions={<Button onClick={() => setShowSchedule(true)}>+ Schedule PT Session</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Member</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Exercise Type</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => {
                const durationMin = Math.round((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000)
                return (
                  <tr key={s.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900">
                      {new Date(s.startTime).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{s.member.name}</td>
                    <td className="px-4 py-3 text-slate-600">{durationMin} min</td>
                    <td className="px-4 py-3 text-slate-600">{s.sessionType ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[160px] truncate">{s.notes ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge color={STATUS_COLORS[s.status]}>{s.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs flex-wrap">
                        {s.status === 'UPCOMING' && (
                          <button className="text-primary font-medium" onClick={() => updateStatus.mutate({ id: s.id, status: 'IN_PROGRESS' })}>
                            Start
                          </button>
                        )}
                        {s.status === 'IN_PROGRESS' && (
                          <button className="text-primary font-medium" onClick={() => updateStatus.mutate({ id: s.id, status: 'COMPLETED' })}>
                            Complete
                          </button>
                        )}
                        {(s.status === 'UPCOMING' || s.status === 'PENDING') && (
                          <>
                            <button className="text-primary font-medium" onClick={() => setRescheduling(s)}>
                              Reschedule
                            </button>
                            <button
                              className="text-red-600 font-medium"
                              onClick={() => confirm('Cancel this session?') && updateStatus.mutate({ id: s.id, status: 'CANCELLED' })}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No sessions scheduled this week.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {showSchedule && <ScheduleModal onClose={() => setShowSchedule(false)} />}
      {rescheduling && <RescheduleModal session={rescheduling} onClose={() => setRescheduling(null)} />}
    </div>
  )
}

function ScheduleModal({ onClose }: { onClose: () => void }) {
  const [memberId, setMemberId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState('07:00')
  const [durationMin, setDurationMin] = useState('60')
  const [sessionType, setSessionType] = useState('Personal Training')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const membersQuery = useQuery<AssignedMemberCard[]>({
    queryKey: ['trainer-members'],
    queryFn: () => api.get('/trainer/members').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => {
      const start = new Date(`${date}T${startTime}`)
      const end = new Date(start.getTime() + Number(durationMin) * 60000)
      return api.post('/trainer/sessions', {
        memberId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        sessionType,
        notes: notes || undefined,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-schedule'] })
      queryClient.invalidateQueries({ queryKey: ['trainer-dashboard'] })
      onClose()
    },
  })

  return (
    <Modal title="Schedule PT Session" onClose={onClose}>
      <Field label="Member">
        <select className={inputClass} value={memberId} onChange={(e) => setMemberId(e.target.value)}>
          <option value="">— Select member —</option>
          {membersQuery.data?.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start time">
          <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (min)">
          <input className={inputClass} type="number" value={durationMin} onChange={(e) => setDurationMin(e.target.value)} />
        </Field>
        <Field label="Exercise Type">
          <input className={inputClass} value={sessionType} onChange={(e) => setSessionType(e.target.value)} />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !memberId}>
        {create.isPending ? 'Scheduling...' : 'Schedule Session'}
      </Button>
    </Modal>
  )
}

function RescheduleModal({ session, onClose }: { session: Session; onClose: () => void }) {
  const start = new Date(session.startTime)
  const [date, setDate] = useState(start.toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState(start.toTimeString().slice(0, 5))
  const durationMin = Math.round((new Date(session.endTime).getTime() - start.getTime()) / 60000)
  const queryClient = useQueryClient()

  const reschedule = useMutation({
    mutationFn: () => {
      const newStart = new Date(`${date}T${startTime}`)
      const newEnd = new Date(newStart.getTime() + durationMin * 60000)
      return api.patch(`/trainer/sessions/${session.id}`, {
        startTime: newStart.toISOString(),
        endTime: newEnd.toISOString(),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-schedule'] })
      onClose()
    },
  })

  return (
    <Modal title={`Reschedule ${session.member.name}'s session`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Start time">
          <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
      </div>
      {reschedule.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(reschedule.error)}</p>}
      <Button onClick={() => reschedule.mutate()} disabled={reschedule.isPending}>
        {reschedule.isPending ? 'Saving...' : 'Save new time'}
      </Button>
    </Modal>
  )
}
