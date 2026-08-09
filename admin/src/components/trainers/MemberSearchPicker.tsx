import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { Field, inputClass } from '../ui'
import type { MemberOption } from '../../types/trainer'

export default function MemberSearchPicker({
  onSelect,
  roleFilter,
}: {
  onSelect: (member: MemberOption) => void
  /** Only show members with this role (e.g. 'MEMBER' to exclude existing trainers/admins). */
  roleFilter?: string
}) {
  const [search, setSearch] = useState('')

  const searchQuery = useQuery<{ members: MemberOption[] }>({
    queryKey: ['admin-member-search', search],
    queryFn: () => api.get('/admin/members', { params: { search, pageSize: 8 } }).then((r) => r.data),
    enabled: search.length > 1,
  })

  const results = roleFilter
    ? searchQuery.data?.members.filter((m) => m.role === roleFilter)
    : searchQuery.data?.members

  return (
    <div>
      <Field label="Search by name, mobile number, or email">
        <input
          className={inputClass}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Start typing..."
          autoFocus
        />
      </Field>
      {search.length > 1 && (
        <div className="border border-border rounded-lg divide-y divide-border max-h-56 overflow-y-auto">
          {results?.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="w-full text-left px-3 py-2 hover:bg-bg text-sm"
            >
              <div className="font-medium text-text">{m.name}</div>
              <div className="text-text-muted">
                {m.email}
                {m.phone && ` · ${m.phone}`}
              </div>
            </button>
          ))}
          {results?.length === 0 && <div className="px-3 py-3 text-sm text-text-faint">No matches.</div>}
        </div>
      )}
    </div>
  )
}
