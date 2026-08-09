import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../components/ui'

interface Plan {
  id: string
  name: string
  description: string | null
  durationDays: number
  price: string
  perks: string[]
  isActive: boolean
}

export default function PlansPage() {
  const [editing, setEditing] = useState<Plan | 'new' | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<Plan[]>({
    queryKey: ['admin-plans'],
    queryFn: () => api.get('/admin/membership-plans').then((r) => r.data),
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/admin/membership-plans/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
  })

  const deletePermanently = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/membership-plans/${id}/permanently`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
    onError: (error) => alert(apiErrorMessage(error)),
  })

  return (
    <div>
      <PageHeader
        title="Membership Plans"
        subtitle={data ? `${data.length} total` : undefined}
        actions={<Button onClick={() => setEditing('new')}>+ New plan</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <div className="grid md:grid-cols-3 gap-4">
          {data.map((plan) => (
            <Card key={plan.id} className="p-5 flex flex-col">
              <div className="flex items-start justify-between mb-1">
                <div className="font-semibold text-slate-900">{plan.name}</div>
                <Badge color={plan.isActive ? 'green' : 'slate'}>{plan.isActive ? 'Active' : 'Archived'}</Badge>
              </div>
              <div className="text-2xl font-bold text-primary mb-1">₹{Number(plan.price).toLocaleString()}</div>
              <div className="text-sm text-slate-500 mb-3">{plan.durationDays} days</div>
              <ul className="text-sm text-slate-600 space-y-1 mb-4 flex-1">
                {plan.perks.map((p) => (
                  <li key={p}>✓ {p}</li>
                ))}
              </ul>
              <div className="flex gap-2 flex-wrap">
                <Button variant="secondary" onClick={() => setEditing(plan)}>
                  Edit
                </Button>
                <Button
                  variant={plan.isActive ? 'danger' : 'secondary'}
                  onClick={() => toggleActive.mutate({ id: plan.id, isActive: !plan.isActive })}
                >
                  {plan.isActive ? 'Archive' : 'Restore'}
                </Button>
                {!plan.isActive && (
                  <Button
                    variant="danger"
                    onClick={() =>
                      confirm(`Permanently delete "${plan.name}"? This cannot be undone.`) &&
                      deletePermanently.mutate(plan.id)
                    }
                  >
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && <PlanFormModal plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  )
}

function PlanFormModal({ plan, onClose }: { plan: Plan | null; onClose: () => void }) {
  const [name, setName] = useState(plan?.name ?? '')
  const [description, setDescription] = useState(plan?.description ?? '')
  const [durationDays, setDurationDays] = useState(String(plan?.durationDays ?? 30))
  const [price, setPrice] = useState(String(plan?.price ?? ''))
  const [perks, setPerks] = useState(plan?.perks.join(', ') ?? '')
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        name,
        description: description || undefined,
        durationDays: Number(durationDays),
        price: Number(price),
        perks: perks.split(',').map((p) => p.trim()).filter(Boolean),
      }
      return plan ? api.patch(`/admin/membership-plans/${plan.id}`, payload) : api.post('/admin/membership-plans', payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
      onClose()
    },
  })

  return (
    <Modal title={plan ? 'Edit plan' : 'New plan'} onClose={onClose}>
      <Field label="Name">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Description">
        <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Duration (days)">
          <input
            className={inputClass}
            type="number"
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
          />
        </Field>
        <Field label="Price (₹)">
          <input className={inputClass} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
      </div>
      <Field label="Perks (comma-separated)">
        <input className={inputClass} value={perks} onChange={(e) => setPerks(e.target.value)} />
      </Field>
      {save.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(save.error)}</p>}
      <Button onClick={() => save.mutate()} disabled={save.isPending || !name || !price}>
        {save.isPending ? 'Saving...' : 'Save plan'}
      </Button>
    </Modal>
  )
}
