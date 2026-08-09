import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../components/ui'

const CLASS_TYPES = ['YOGA', 'ZUMBA', 'HIIT', 'CROSSFIT', 'PILATES', 'SPIN']

interface GymClass {
  id: string
  name: string
  type: string
  capacity: number
  durationMin: number
  trainer: { user: { name: string } } | null
  schedules: { id: string; startsAt: string; endsAt: string; _count: { bookings: number } }[]
}

interface Trainer {
  id: string
  user: { name: string }
}

export default function ClassesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [scheduleFor, setScheduleFor] = useState<GymClass | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<GymClass[]>({
    queryKey: ['admin-classes'],
    queryFn: () => api.get('/admin/classes').then((r) => r.data),
  })

  const deleteClass = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/classes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-classes'] }),
  })

  const deleteSchedule = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/schedules/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-classes'] }),
  })

  return (
    <div>
      <PageHeader
        title="Class Scheduling"
        subtitle={data ? `${data.length} classes` : undefined}
        actions={<Button onClick={() => setShowCreate(true)}>+ New class</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <div className="space-y-4">
          {data.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{c.name}</span>
                    <Badge>{c.type}</Badge>
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {c.durationMin} min · capacity {c.capacity}
                    {c.trainer && ` · ${c.trainer.user.name}`}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setScheduleFor(c)}>
                    + Schedule
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => confirm(`Delete "${c.name}"? This removes all its schedules too.`) && deleteClass.mutate(c.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              {c.schedules.length === 0 && (
                <p className="text-xs text-amber-600 mt-3">
                  No schedule yet — members can't see or book this class until you add one.
                </p>
              )}
              {c.schedules.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                  {c.schedules.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">
                        {new Date(s.startsAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                        {' · '}
                        {s._count.bookings}/{c.capacity} booked
                      </span>
                      <button className="text-red-500 text-xs hover:underline" onClick={() => deleteSchedule.mutate(s.id)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateClassModal
          onClose={() => setShowCreate(false)}
          onCreated={(gymClass) => {
            setShowCreate(false)
            setScheduleFor(gymClass)
          }}
        />
      )}
      {scheduleFor && <ScheduleModal gymClass={scheduleFor} onClose={() => setScheduleFor(null)} />}
    </div>
  )
}

function CreateClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: (gymClass: GymClass) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState(CLASS_TYPES[0])
  const [trainerId, setTrainerId] = useState('')
  const [capacity, setCapacity] = useState('20')
  const [durationMin, setDurationMin] = useState('60')
  const queryClient = useQueryClient()

  const trainersQuery = useQuery<Trainer[]>({
    queryKey: ['admin-trainers'],
    queryFn: () => api.get('/admin/trainers').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post<GymClass>('/admin/classes', {
        name,
        type,
        trainerId: trainerId || undefined,
        capacity: Number(capacity),
        durationMin: Number(durationMin),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      onCreated({ ...res.data, schedules: [] })
    },
  })

  return (
    <Modal title="New class" onClose={onClose}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Field>
      <Field label="Type">
        <select className={inputClass} value={type} onChange={(e) => setType(e.target.value)}>
          {CLASS_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Trainer (optional)">
        <select className={inputClass} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
          <option value="">Unassigned</option>
          {trainersQuery.data?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.user.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Capacity">
          <input className={inputClass} type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <Field label="Duration (min)">
          <input
            className={inputClass}
            type="number"
            value={durationMin}
            onChange={(e) => setDurationMin(e.target.value)}
          />
        </Field>
      </div>
      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !name}>
        {create.isPending ? 'Saving...' : 'Create class'}
      </Button>
    </Modal>
  )
}

function ScheduleModal({ gymClass, onClose }: { gymClass: GymClass; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () => {
      const startsAt = new Date(`${date}T${startTime}`).toISOString()
      const endsAt = new Date(`${date}T${endTime}`).toISOString()
      return api.post(`/admin/classes/${gymClass.id}/schedules`, { startsAt, endsAt })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-classes'] })
      onClose()
    },
  })

  return (
    <Modal title={`Schedule: ${gymClass.name}`} onClose={onClose}>
      <Field label="Date">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="End time">
          <input className={inputClass} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !date}>
        {create.isPending ? 'Saving...' : 'Add schedule'}
      </Button>
    </Modal>
  )
}
