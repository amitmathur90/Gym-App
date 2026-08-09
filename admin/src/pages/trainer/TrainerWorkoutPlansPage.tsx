import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../../components/ui'
import MemberMultiPicker from '../../components/trainer/MemberMultiPicker'
import type { Exercise, WorkoutPlan } from '../../types/trainerSelf'
import { DAY_NAMES } from '../../types/trainerSelf'

interface PlanGroup {
  name: string
  status: string
  notes: string | null
  memberNames: string[]
  days: { dayOfWeek: number; exerciseCount: number }[]
  planIds: string[]
  firstPlan: WorkoutPlan
}

function groupPlans(plans: WorkoutPlan[]): PlanGroup[] {
  const groups = new Map<string, PlanGroup>()
  for (const p of plans) {
    const key = `${p.name}__${p.createdAt.slice(0, 16)}`
    let g = groups.get(key)
    if (!g) {
      g = { name: p.name, status: p.status, notes: p.notes, memberNames: [], days: [], planIds: [], firstPlan: p }
      groups.set(key, g)
    }
    if (!g.memberNames.includes(p.member.name)) g.memberNames.push(p.member.name)
    g.days.push({ dayOfWeek: p.dayOfWeek, exerciseCount: p.exercises.length })
    g.planIds.push(p.id)
  }
  return [...groups.values()]
}

export default function TrainerWorkoutPlansPage() {
  const [searchParams] = useSearchParams()
  const [showBuilder, setShowBuilder] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<WorkoutPlan[]>({
    queryKey: ['trainer-workout-plans'],
    queryFn: () => api.get('/trainer/workout-plans').then((r) => r.data),
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/trainer/workout-plans/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-workout-plans'] }),
  })

  const duplicate = useMutation({
    mutationFn: (id: string) => api.post(`/trainer/workout-plans/${id}/duplicate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-workout-plans'] }),
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/trainer/workout-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-workout-plans'] }),
  })

  const groups = data ? groupPlans(data) : []

  return (
    <div>
      <PageHeader
        title="Workout Plans"
        subtitle={data ? `${groups.length} plans` : undefined}
        actions={<Button onClick={() => setShowBuilder(true)}>+ New Plan</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <div className="space-y-4">
          {groups.map((g, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text">{g.name}</span>
                    <Badge color={g.status === 'ACTIVE' ? 'green' : g.status === 'DRAFT' ? 'amber' : 'slate'}>
                      {g.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-text-muted mt-1">
                    Assigned to: {g.memberNames.join(', ')} · {g.days.length} day{g.days.length === 1 ? '' : 's'} ·{' '}
                    {g.days.reduce((s, d) => s + d.exerciseCount, 0)} exercises
                  </div>
                  {g.notes && <div className="text-sm text-text-muted mt-1">{g.notes}</div>}
                </div>
                <div className="flex gap-2">
                  {g.status !== 'ACTIVE' && (
                    <Button variant="secondary" onClick={() => g.planIds.forEach((id) => updateStatus.mutate({ id, status: 'ACTIVE' }))}>
                      Activate
                    </Button>
                  )}
                  {g.status !== 'COMPLETED' && (
                    <Button variant="secondary" onClick={() => g.planIds.forEach((id) => updateStatus.mutate({ id, status: 'COMPLETED' }))}>
                      Mark Completed
                    </Button>
                  )}
                  <Button variant="secondary" onClick={() => duplicate.mutate(g.firstPlan.id)}>
                    Duplicate
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => confirm('Delete this plan for all assigned members?') && g.planIds.forEach((id) => deletePlan.mutate(id))}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {groups.length === 0 && <p className="text-text-faint text-center py-16">No workout plans created yet.</p>}
        </div>
      )}

      {showBuilder && (
        <BuilderModal onClose={() => setShowBuilder(false)} initialMemberId={searchParams.get('memberId')} />
      )}
    </div>
  )
}

interface DayDraft {
  key: number
  dayOfWeek: number
  name: string
  exercises: {
    key: number
    exerciseId: string
    sets: number
    reps: number
    restSeconds: number
    videoUrl: string
    notes: string
  }[]
}

function BuilderModal({ onClose, initialMemberId }: { onClose: () => void; initialMemberId: string | null }) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE'>('ACTIVE')
  const [notes, setNotes] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>(initialMemberId ? [initialMemberId] : [])
  const [days, setDays] = useState<DayDraft[]>([{ key: 0, dayOfWeek: 1, name: 'Day 1', exercises: [] }])
  const queryClient = useQueryClient()

  const exercisesQuery = useQuery<Exercise[]>({
    queryKey: ['exercise-library'],
    queryFn: () => api.get('/workouts/exercises').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post('/trainer/workout-plans/assign', {
        memberIds,
        status,
        notes: notes || undefined,
        days: days.map((d) => ({
          dayOfWeek: d.dayOfWeek,
          name: d.name,
          exercises: d.exercises.map((e, idx) => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
            videoUrl: e.videoUrl || undefined,
            notes: e.notes || undefined,
            order: idx,
          })),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-workout-plans'] })
      onClose()
    },
  })

  function addDay() {
    setDays((prev) => [...prev, { key: prev.length, dayOfWeek: 1, name: `Day ${prev.length + 1}`, exercises: [] }])
  }
  function updateDay(key: number, patch: Partial<DayDraft>) {
    setDays((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)))
  }
  function addExercise(dayKey: number) {
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? {
              ...d,
              exercises: [
                ...d.exercises,
                { key: d.exercises.length, exerciseId: '', sets: 3, reps: 10, restSeconds: 60, videoUrl: '', notes: '' },
              ],
            }
          : d
      )
    )
  }
  function updateExercise(dayKey: number, exKey: number, patch: Partial<DayDraft['exercises'][number]>) {
    setDays((prev) =>
      prev.map((d) =>
        d.key === dayKey
          ? { ...d, exercises: d.exercises.map((e) => (e.key === exKey ? { ...e, ...patch } : e)) }
          : d
      )
    )
  }

  const validDays = days.every((d) => d.exercises.length > 0 && d.exercises.every((e) => e.exerciseId))
  const canSave = name.trim().length > 1 && memberIds.length > 0 && days.length > 0 && validDays

  return (
    <Modal title="Create Workout Plan" onClose={onClose}>
      <Field label="Plan Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Push Pull Legs" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Status">
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'ACTIVE')}>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
          </select>
        </Field>
      </div>
      <Field label="Assign to Members">
        <MemberMultiPicker selectedIds={memberIds} onChange={setMemberIds} />
      </Field>
      <Field label="Notes (optional)">
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="text-sm font-semibold text-text mb-2 mt-4">Weekly Split</div>
      <div className="space-y-4">
        {days.map((day) => (
          <div key={day.key} className="border border-border rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                className={inputClass}
                value={day.name}
                onChange={(e) => updateDay(day.key, { name: e.target.value })}
                placeholder="Day name (e.g. Push Day)"
              />
              <select
                className={inputClass}
                value={day.dayOfWeek}
                onChange={(e) => updateDay(day.key, { dayOfWeek: Number(e.target.value) })}
              >
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {day.exercises.map((ex) => (
              <div key={ex.key} className="grid grid-cols-12 gap-2 mb-2 items-center">
                <select
                  className={`${inputClass} col-span-4`}
                  value={ex.exerciseId}
                  onChange={(e) => updateExercise(day.key, ex.key, { exerciseId: e.target.value })}
                >
                  <option value="">Select exercise...</option>
                  {exercisesQuery.data?.map((ex2) => (
                    <option key={ex2.id} value={ex2.id}>
                      {ex2.name}
                    </option>
                  ))}
                </select>
                <input
                  className={`${inputClass} col-span-1`}
                  type="number"
                  value={ex.sets}
                  onChange={(e) => updateExercise(day.key, ex.key, { sets: Number(e.target.value) })}
                  title="Sets"
                />
                <input
                  className={`${inputClass} col-span-1`}
                  type="number"
                  value={ex.reps}
                  onChange={(e) => updateExercise(day.key, ex.key, { reps: Number(e.target.value) })}
                  title="Reps"
                />
                <input
                  className={`${inputClass} col-span-2`}
                  type="number"
                  value={ex.restSeconds}
                  onChange={(e) => updateExercise(day.key, ex.key, { restSeconds: Number(e.target.value) })}
                  title="Rest (sec)"
                />
                <input
                  className={`${inputClass} col-span-4`}
                  value={ex.videoUrl}
                  onChange={(e) => updateExercise(day.key, ex.key, { videoUrl: e.target.value })}
                  placeholder="Video URL (optional)"
                />
              </div>
            ))}
            <button className="text-sm text-primary font-medium" onClick={() => addExercise(day.key)}>
              + Add exercise
            </button>
          </div>
        ))}
      </div>
      <button className="text-sm text-primary font-medium mt-3 mb-4" onClick={addDay}>
        + Add another day
      </button>

      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !canSave}>
        {create.isPending ? 'Saving...' : `Assign to ${memberIds.length} member${memberIds.length === 1 ? '' : 's'}`}
      </Button>
    </Modal>
  )
}
