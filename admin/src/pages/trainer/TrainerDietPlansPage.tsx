import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../../components/ui'
import type { AssignedMemberCard, DietPlan, FoodItem } from '../../types/trainerSelf'
import { DAY_NAMES } from '../../types/trainerSelf'

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']

export default function TrainerDietPlansPage() {
  const [searchParams] = useSearchParams()
  const [showCreate, setShowCreate] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<DietPlan[]>({
    queryKey: ['trainer-diet-plans'],
    queryFn: () => api.get('/trainer/diet-plans').then((r) => r.data),
  })

  const deletePlan = useMutation({
    mutationFn: (id: string) => api.delete(`/trainer/diet-plans/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trainer-diet-plans'] }),
  })

  return (
    <div>
      <PageHeader
        title="Diet Plans"
        subtitle={data ? `${data.length} assigned` : undefined}
        actions={<Button onClick={() => setShowCreate(true)}>+ New Diet Plan</Button>}
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
                  <div className="font-semibold text-text">{plan.name}</div>
                  <div className="text-sm text-text-muted">{plan.member.name}</div>
                  <div className="flex gap-2 mt-1">
                    {plan.targetWaterMl && <Badge>💧 {(plan.targetWaterMl / 1000).toFixed(1)}L/day</Badge>}
                    {plan.supplements && <Badge color="amber">💊 {plan.supplements}</Badge>}
                  </div>
                  {plan.notes && <p className="text-sm text-text-muted mt-2">{plan.notes}</p>}
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
                <div className="mt-2 border border-border rounded-lg divide-y divide-border">
                  {DAY_NAMES.map((dayName, dayIdx) => {
                    const dayMeals = plan.meals.filter((m) => m.dayOfWeek === dayIdx)
                    if (dayMeals.length === 0) return null
                    return (
                      <div key={dayIdx} className="px-3 py-2">
                        <div className="text-xs font-semibold text-text-muted mb-1">{dayName}</div>
                        {dayMeals.map((m) => (
                          <div key={m.id} className="flex justify-between text-sm py-0.5">
                            <span>
                              <Badge>{m.mealType}</Badge> <span className="ml-1">{m.foodItem.name}</span>
                            </span>
                            <span className="text-text-muted">
                              {m.foodItem.calories} kcal · {m.foodItem.proteinG}g P / {m.foodItem.carbsG}g C /{' '}
                              {m.foodItem.fatsG}g F
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          ))}
          {data.length === 0 && <p className="text-text-faint text-center py-16">No diet plans assigned yet.</p>}
        </div>
      )}

      {showCreate && (
        <CreateDietPlanModal onClose={() => setShowCreate(false)} initialMemberId={searchParams.get('memberId')} />
      )}
    </div>
  )
}

interface MealRow {
  key: number
  dayOfWeek: number
  mealType: string
  foodItemId: string
}

function CreateDietPlanModal({ onClose, initialMemberId }: { onClose: () => void; initialMemberId: string | null }) {
  const [memberId, setMemberId] = useState(initialMemberId ?? '')
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [targetWaterMl, setTargetWaterMl] = useState('3000')
  const [supplements, setSupplements] = useState('')
  const [rows, setRows] = useState<MealRow[]>([{ key: 0, dayOfWeek: 1, mealType: 'BREAKFAST', foodItemId: '' }])
  const queryClient = useQueryClient()

  const membersQuery = useQuery<AssignedMemberCard[]>({
    queryKey: ['trainer-members'],
    queryFn: () => api.get('/trainer/members').then((r) => r.data),
  })

  const foodsQuery = useQuery<FoodItem[]>({
    queryKey: ['nutrition-foods-all'],
    queryFn: () => api.get('/nutrition/foods').then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () =>
      api.post('/trainer/diet-plans', {
        memberId,
        name,
        notes: notes || undefined,
        targetWaterMl: targetWaterMl ? Number(targetWaterMl) : undefined,
        supplements: supplements || undefined,
        meals: rows
          .filter((r) => r.foodItemId)
          .map((r) => ({ dayOfWeek: r.dayOfWeek, mealType: r.mealType, foodItemId: r.foodItemId })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-diet-plans'] })
      onClose()
    },
  })

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: prev.length ? Math.max(...prev.map((r) => r.key)) + 1 : 0, dayOfWeek: 1, mealType: 'BREAKFAST', foodItemId: '' },
    ])
  }
  function updateRow(key: number, patch: Partial<MealRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  const validMealCount = rows.filter((r) => r.foodItemId).length
  const canSave = memberId && name.trim().length > 1 && validMealCount > 0

  return (
    <Modal title="Create Diet Plan" onClose={onClose}>
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
      <Field label="Plan Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Cutting Diet" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Water Intake Target (ml)">
          <input className={inputClass} type="number" value={targetWaterMl} onChange={(e) => setTargetWaterMl(e.target.value)} />
        </Field>
        <Field label="Supplements">
          <input className={inputClass} value={supplements} onChange={(e) => setSupplements(e.target.value)} placeholder="Whey, Creatine" />
        </Field>
      </div>
      <Field label="Notes (optional)">
        <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      <div className="text-sm font-medium text-text mb-2">Meals</div>
      <div className="space-y-3 mb-3">
        {rows.map((row) => (
          <div key={row.key} className="grid grid-cols-12 gap-2 items-center">
            <select className={`${inputClass} col-span-3`} value={row.dayOfWeek} onChange={(e) => updateRow(row.key, { dayOfWeek: Number(e.target.value) })}>
              {DAY_NAMES.map((d, i) => (
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
            <select className={`${inputClass} col-span-5`} value={row.foodItemId} onChange={(e) => updateRow(row.key, { foodItemId: e.target.value })}>
              <option value="">Select food...</option>
              {foodsQuery.data?.filter((f) => f.mealType === row.mealType).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.calories} kcal)
                </option>
              ))}
            </select>
            <button className="col-span-1 text-red-500 text-sm" onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button className="text-sm text-primary font-medium mb-4" onClick={addRow}>
        + Add another meal
      </button>

      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !canSave}>
        {create.isPending ? 'Saving...' : `Assign plan (${validMealCount} meal${validMealCount === 1 ? '' : 's'})`}
      </Button>
    </Modal>
  )
}
