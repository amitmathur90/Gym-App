import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Card, ErrorState, Modal, PageHeader, Spinner, inputClass } from '../components/ui'

interface Member {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  emailVerified: boolean
  createdAt: string
  memberships: { plan: { name: string }; endDate: string }[]
}

interface MemberDetail extends Member {
  memberships: { id: string; plan: { name: string }; status: string; startDate: string; endDate: string }[]
  payments: { id: string; amount: string; status: string; method: string; createdAt: string }[]
  assignedTrainerId: string | null
  assignedTrainer: { id: string; user: { name: string; email: string } } | null
}

interface TrainerOption {
  id: string
  user: { name: string }
}

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<{ members: Member[]; total: number }>({
    queryKey: ['admin-members', search],
    queryFn: () => api.get('/admin/members', { params: { search: search || undefined, pageSize: 50 } }).then((r) => r.data),
  })

  const detailQuery = useQuery<MemberDetail>({
    queryKey: ['admin-member', selectedId],
    queryFn: () => api.get(`/admin/members/${selectedId}`).then((r) => r.data),
    enabled: !!selectedId,
  })

  const trainersQuery = useQuery<TrainerOption[]>({
    queryKey: ['admin-trainers'],
    queryFn: () => api.get('/admin/trainers').then((r) => r.data),
  })

  const updateRole = useMutation({
    mutationFn: (role: string) => api.patch(`/admin/members/${selectedId}`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      queryClient.invalidateQueries({ queryKey: ['admin-member', selectedId] })
    },
  })

  const updateTrainer = useMutation({
    mutationFn: (assignedTrainerId: string | null) => api.patch(`/admin/members/${selectedId}`, { assignedTrainerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-member', selectedId] })
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
    },
  })

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle={data ? `${data.total} total` : undefined}
        actions={
          <input
            className={`${inputClass} w-64`}
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Membership</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {data.members.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelectedId(m.id)}
                >
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={m.role === 'ADMIN' ? 'amber' : m.role === 'TRAINER' ? 'green' : 'slate'}>
                      {m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.memberships[0]?.plan.name ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {data.members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {selectedId && (
        <Modal title="Member details" onClose={() => setSelectedId(null)}>
          {detailQuery.isLoading || !detailQuery.data ? (
            <Spinner />
          ) : (
            <div>
              <div className="mb-4">
                <div className="font-semibold text-slate-900">{detailQuery.data.name}</div>
                <div className="text-sm text-slate-500">{detailQuery.data.email}</div>
                {detailQuery.data.phone && <div className="text-sm text-slate-500">{detailQuery.data.phone}</div>}
              </div>

              <label className="block mb-5">
                <span className="block text-sm font-medium text-slate-700 mb-1">Role</span>
                <select
                  className={inputClass}
                  value={detailQuery.data.role}
                  onChange={(e) => updateRole.mutate(e.target.value)}
                  disabled={updateRole.isPending}
                >
                  <option value="MEMBER">MEMBER</option>
                  <option value="TRAINER">TRAINER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>

              <label className="block mb-5">
                <span className="block text-sm font-medium text-slate-700 mb-1">Assigned trainer</span>
                <select
                  className={inputClass}
                  value={detailQuery.data.assignedTrainerId ?? ''}
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

              <div className="mb-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">Memberships</div>
                {detailQuery.data.memberships.length === 0 && (
                  <div className="text-sm text-slate-400">No memberships yet.</div>
                )}
                {detailQuery.data.memberships.map((m) => (
                  <div key={m.id} className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <span>{m.plan.name}</span>
                    <Badge color={m.status === 'ACTIVE' ? 'green' : 'slate'}>{m.status}</Badge>
                  </div>
                ))}
              </div>

              <div>
                <div className="text-sm font-semibold text-slate-700 mb-2">Recent payments</div>
                {detailQuery.data.payments.length === 0 && (
                  <div className="text-sm text-slate-400">No payments yet.</div>
                )}
                {detailQuery.data.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-sm py-1.5 border-b border-slate-100 last:border-0">
                    <span>
                      ₹{Number(p.amount).toLocaleString()} · {p.method}
                    </span>
                    <Badge color={p.status === 'SUCCESS' ? 'green' : p.status === 'FAILED' ? 'red' : 'slate'}>
                      {p.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
