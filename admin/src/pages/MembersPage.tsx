import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, PageHeader, Spinner, inputClass } from '../components/ui'

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

const ROLE_OPTIONS = ['MEMBER', 'TRAINER', 'ADMIN'] as const
const MEMBERSHIP_STATUS_OPTIONS = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING', 'NONE'] as const

export default function MembersPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [membershipStatus, setMembershipStatus] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<{ members: Member[]; total: number }>({
    queryKey: ['admin-members', search, role, membershipStatus],
    queryFn: () =>
      api
        .get('/admin/members', {
          params: {
            search: search || undefined,
            role: role || undefined,
            membershipStatus: membershipStatus || undefined,
            pageSize: 50,
          },
        })
        .then((r) => r.data),
  })

  const bulkDelete = useMutation({
    mutationFn: (ids: string[]) => api.post('/admin/members/bulk-delete', { ids }),
    onSuccess: () => {
      setSelected(new Set())
      setConfirmingDelete(false)
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
    },
  })

  const members = data?.members ?? []
  const allSelected = members.length > 0 && members.every((m) => selected.has(m.id))

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(members.map((m) => m.id)))
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <PageHeader
        title="Members"
        subtitle={data ? `${data.total} total` : undefined}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <input
              className={`${inputClass} w-56`}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className={`${inputClass} w-auto`} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <select
              className={`${inputClass} w-auto`}
              value={membershipStatus}
              onChange={(e) => setMembershipStatus(e.target.value)}
            >
              <option value="">Any membership status</option>
              {MEMBERSHIP_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 'NONE' ? 'No membership' : s}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {selected.size > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm text-text font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2">
            {confirmingDelete ? (
              <>
                <span className="text-sm text-text-muted">Delete permanently?</span>
                <Button variant="secondary" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  disabled={bulkDelete.isPending}
                  onClick={() => bulkDelete.mutate([...selected])}
                >
                  {bulkDelete.isPending ? 'Deleting…' : 'Confirm Delete'}
                </Button>
              </>
            ) : (
              <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
                Delete Selected
              </Button>
            )}
          </div>
        </div>
      )}
      {bulkDelete.isError && <p className="text-sm text-red mb-4">{apiErrorMessage(bulkDelete.error)}</p>}

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <Card>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-text-muted">
                <th className="px-4 py-3 font-medium w-10">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-primary" />
                </th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Membership</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-bg">
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleOne(m.id)}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <Link to={`/members/${m.id}`} className="text-text hover:text-primary">
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{m.email}</td>
                  <td className="px-4 py-3">
                    <Badge color={m.role === 'ADMIN' ? 'amber' : m.role === 'TRAINER' ? 'green' : 'slate'}>
                      {m.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{m.memberships[0]?.plan.name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{new Date(m.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-faint">
                    No members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
