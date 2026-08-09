import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../components/ui'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

interface DietPlan {
  id: string
  name: string
  notes: string | null
  createdAt: string
  member: { id: string; name: string; email: string }
  trainer: { user: { name: string } } | null
  meals: {
    id: string
    mealType: string
    dayOfWeek: number
    foodItem: { name: string; calories: number }
  }[]
}

interface MemberOption {
  id: string
  name: string
  email: string
}

interface TrainerOption {
  id: string
  user: { name: string }
}

interface FoodItem {
  id: string
  name: string
  mealType: string
  calories: number
}

export default function DietPlansPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<DietPlan[]>({
    queryKey: ['admin-diet-plans'],
    queryFn: () => api.get('/admin/diet-plans').then((r) => r.data),
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/diet-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-diet-plans'] }),
  })

  return (
    <div>
      <PageHeader
        title="Diet Plans"
        subtitle={data ? `${data.length} plans assigned` : undefined}
        actions={<Button onClick={() => setShowCreate(true)}>+ Assign diet plan</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <div className="space-y-4">
          {data.map((plan) => (
            <Card key={plan.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{plan.name}</div>
                  <div className="text-sm text-slate-500">
                    {plan.member.name} ({plan.member.email})
                    {plan.trainer && ` · assigned by ${plan.trainer.user.name}`}
                  </div>
                  {plan.notes && <p className="text-sm text-slate-600 mt-1">{plan.notes}</p>}
                </div>
                <Button variant="danger" onClick={() => confirm('Delete this diet plan?') && deletePlan.mutate(plan.id)}>
                  Delete
                </Button>
              </div>

              <button
                className="mt-3 text-sm text-primary font-medium"
                onClick={() => setExpanded((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))}
              >
                {plan.meals.length} meal{plan.meals.length === 1 ? '' : 's'} {expanded[plan.id] ? '▲' : '▼'}
              </button>

              {expanded[plan.id] && (
                <div className="mt-2 border border-slate-100 rounded-lg divide-y divide-slate-100">
                  {DAYS.map((dayName, dayIdx) => {
                    const dayMeals = plan.meals.filter((m) => m.dayOfWeek === dayIdx)
                    if (dayMeals.length === 0) return null
                    return (
                      <div key={dayIdx} className="px-3 py-2">
                        <div className="text-xs font-semibold text-slate-500 mb-1">{dayName}</div>
                        {dayMeals.map((m) => (
                          <div key={m.id} className="flex justify-between text-sm py-0.5">
                            <span>
                              <Badge>{m.mealType}</Badge> <span className="ml-1">{m.foodItem.name}</span>
                            </span>
                            <span className="text-slate-500">{m.foodItem.calories} kcal</span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          ))}
          {data.length === 0 && <p className="text-slate-400 text-center py-10">No diet plans assigned yet.</p>}
        </div>
      )}

      {showCreate && <CreatePlanModal onClose={() => setShowCreate(false)} />}
    </div>
  )
}

interface MealRow {
  key: number
  dayOfWeek: number
  mealType: string
  foodItemId: string
  notes: string
}

function CreatePlanModal({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null)
  const [trainerId, setTrainerId] = useState('')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [rows, setRows] = useState<MealRow[]>([
    { key: 0, dayOfWeek: 1, mealType: 'BREAKFAST', foodItemId: '', notes: '' },
  ])
  const queryClient = useQueryClient()

  const searchQuery = useQuery<{ members: MemberOption[] }>({
    queryKey: ['admin-member-search', search],
    queryFn: () => api.get('/admin/members', { params: { search, pageSize: 5 } }).then((r) => r.data),
    enabled: search.length > 1 && !selectedMember,
  })

  const trainersQuery = useQuery<TrainerOption[]>({
    queryKey: ['admin-trainers'],
    queryFn: () => api.get('/admin/trainers').then((r) => r.data),
  })

  const foodsQuery = useQuery<FoodItem[]>({
    queryKey: ['nutrition-foods-all'],
    queryFn: () => api.get('/nutrition/foods').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/diet-plans', {
        memberId: selectedMember!.id,
        trainerId: trainerId || undefined,
        name,
        notes: notes || undefined,
        meals: rows
          .filter((r) => r.foodItemId)
          .map((r) => ({
            dayOfWeek: r.dayOfWeek,
            mealType: r.mealType,
            foodItemId: r.foodItemId,
            notes: r.notes || undefined,
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-diet-plans'] })
      onClose()
    },
  })

  function updateRow(key: number, patch: Partial<MealRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: prev.length ? Math.max(...prev.map((r) => r.key)) + 1 : 0, dayOfWeek: 1, mealType: 'BREAKFAST', foodItemId: '', notes: '' },
    ])
  }

  const validMealCount = rows.filter((r) => r.foodItemId).length

  return (
    <Modal title="Assign diet plan" onClose={onClose}>
      {!selectedMember ? (
        <div>
          <Field label="Find a member by name or email">
            <input
              className={inputClass}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Start typing..."
              autoFocus
            />
          </Field>
          {searchQuery.data && (
            <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {searchQuery.data.members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMember(m)}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm"
                >
                  <div className="font-medium text-slate-900">{m.name}</div>
                  <div className="text-slate-500">{m.email}</div>
                </button>
              ))}
              {searchQuery.data.members.length === 0 && (
                <div className="px-3 py-3 text-sm text-slate-400">No matches.</div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{selectedMember.name}</div>
              <div className="text-sm text-slate-500">{selectedMember.email}</div>
            </div>
            <button className="text-sm text-primary" onClick={() => setSelectedMember(null)}>
              Change
            </button>
          </div>

          <Field label="Plan name">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cutting Plan" />
          </Field>
          <Field label="Assigned by trainer (optional)">
            <select className={inputClass} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
              <option value="">— Admin only —</option>
              {trainersQuery.data?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes (optional)">
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>

          <div className="text-sm font-medium text-slate-700 mb-2">Meals</div>
          <div className="space-y-3 mb-3">
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-12 gap-2 items-center">
                <select
                  className={`${inputClass} col-span-3`}
                  value={row.dayOfWeek}
                  onChange={(e) => updateRow(row.key, { dayOfWeek: Number(e.target.value) })}
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d.slice(0, 3)}
                    </option>
                  ))}
                </select>
                <select
                  className={`${inputClass} col-span-3`}
                  value={row.mealType}
                  onChange={(e) => updateRow(row.key, { mealType: e.target.value, foodItemId: '' })}
                >
                  {MEAL_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  className={`${inputClass} col-span-5`}
                  value={row.foodItemId}
                  onChange={(e) => updateRow(row.key, { foodItemId: e.target.value })}
                >
                  <option value="">Select food...</option>
                  {foodsQuery.data
                    ?.filter((f) => f.mealType === row.mealType)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.calories} kcal)
                      </option>
                    ))}
                </select>
                <button
                  className="col-span-1 text-red-500 text-sm"
                  onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button className="text-sm text-primary font-medium mb-4" onClick={addRow}>
            + Add another meal
          </button>

          {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
          <Button onClick={() => create.mutate()} disabled={create.isPending || !name || validMealCount === 0}>
            {create.isPending ? 'Saving...' : `Assign plan (${validMealCount} meal${validMealCount === 1 ? '' : 's'})`}
          </Button>
        </div>
      )}
    </Modal>
  )
}
