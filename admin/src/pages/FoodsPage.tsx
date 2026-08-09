import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../components/ui'

interface FoodItem {
  id: string
  name: string
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK'
  calories: number
  carbsG: number
  proteinG: number
  fatsG: number
  servingLabel: string
}

const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const
const MEAL_TYPE_COLORS: Record<string, 'slate' | 'green' | 'red' | 'amber'> = {
  BREAKFAST: 'amber',
  LUNCH: 'green',
  DINNER: 'slate',
  SNACK: 'red',
}

export default function FoodsPage() {
  const [filter, setFilter] = useState<'ALL' | (typeof MEAL_TYPES)[number]>('ALL')
  const [editing, setEditing] = useState<FoodItem | 'new' | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<FoodItem[]>({
    queryKey: ['admin-foods'],
    queryFn: () => api.get('/admin/foods').then((r) => r.data),
  })

  const deleteFood = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/foods/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-foods'] }),
    onError: (err) => alert(apiErrorMessage(err)),
  })

  const filtered = data?.filter((f) => filter === 'ALL' || f.mealType === filter) ?? []

  return (
    <div>
      <PageHeader
        title="Food Library"
        subtitle={data ? `${data.length} foods · used by diet plans and meal logging` : undefined}
        actions={<Button onClick={() => setEditing('new')}>+ Add Food</Button>}
      />

      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-4 w-fit">
        {(['ALL', ...MEAL_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              filter === t ? 'bg-white text-primary shadow-sm' : 'text-slate-500'
            }`}
          >
            {t === 'ALL' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Meal</th>
                <th className="px-4 py-3 font-medium">Serving</th>
                <th className="px-4 py-3 font-medium">Calories</th>
                <th className="px-4 py-3 font-medium">Carbs / Protein / Fats</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                  <td className="px-4 py-3">
                    <Badge color={MEAL_TYPE_COLORS[f.mealType]}>{f.mealType}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.servingLabel}</td>
                  <td className="px-4 py-3 text-slate-600">{f.calories} kcal</td>
                  <td className="px-4 py-3 text-slate-600">
                    {f.carbsG}g / {f.proteinG}g / {f.fatsG}g
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <button className="text-primary font-medium" onClick={() => setEditing(f)}>
                        Edit
                      </button>
                      <button
                        className="text-red-600 font-medium"
                        onClick={() => confirm(`Delete "${f.name}"?`) && deleteFood.mutate(f.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No foods in this category yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {editing && <FoodFormModal food={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function FoodFormModal({ food, onClose }: { food: FoodItem | null; onClose: () => void }) {
  const [name, setName] = useState(food?.name ?? '')
  const [mealType, setMealType] = useState<(typeof MEAL_TYPES)[number]>(food?.mealType ?? 'BREAKFAST')
  const [calories, setCalories] = useState(String(food?.calories ?? ''))
  const [carbsG, setCarbsG] = useState(String(food?.carbsG ?? ''))
  const [proteinG, setProteinG] = useState(String(food?.proteinG ?? ''))
  const [fatsG, setFatsG] = useState(String(food?.fatsG ?? ''))
  const [servingLabel, setServingLabel] = useState(food?.servingLabel ?? '')
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        mealType,
        calories: Number(calories),
        carbsG: Number(carbsG),
        proteinG: Number(proteinG),
        fatsG: Number(fatsG),
        servingLabel,
      }
      return food ? api.patch(`/admin/foods/${food.id}`, payload) : api.post('/admin/foods', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-foods'] })
      onClose()
    },
  })

  const canSave = name.trim().length > 1 && calories !== '' && carbsG !== '' && proteinG !== '' && fatsG !== '' && servingLabel.trim().length > 0

  return (
    <Modal title={food ? 'Edit food' : 'Add food'} onClose={onClose}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Grilled Chicken Salad" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Meal type">
          <select className={inputClass} value={mealType} onChange={(e) => setMealType(e.target.value as typeof mealType)}>
            {MEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Serving size">
          <input className={inputClass} value={servingLabel} onChange={(e) => setServingLabel(e.target.value)} placeholder="1 plate" />
        </Field>
      </div>
      <Field label="Calories (kcal)">
        <input className={inputClass} type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
      </Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Carbs (g)">
          <input className={inputClass} type="number" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} />
        </Field>
        <Field label="Protein (g)">
          <input className={inputClass} type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} />
        </Field>
        <Field label="Fats (g)">
          <input className={inputClass} type="number" value={fatsG} onChange={(e) => setFatsG(e.target.value)} />
        </Field>
      </div>
      {save.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(save.error)}</p>}
      <Button onClick={() => save.mutate()} disabled={save.isPending || !canSave}>
        {save.isPending ? 'Saving...' : food ? 'Save changes' : 'Add food'}
      </Button>
    </Modal>
  )
}
