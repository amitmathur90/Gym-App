import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import type { AssignedMemberCard } from '../../types/trainerSelf'

export default function MemberMultiPicker({
  selectedIds,
  onChange,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const { data } = useQuery<AssignedMemberCard[]>({
    queryKey: ['trainer-members'],
    queryFn: () => api.get('/trainer/members').then((r) => r.data),
  })

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="border border-border rounded-lg divide-y divide-border max-h-48 overflow-y-auto">
      {data?.map((m) => (
        <label key={m.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg cursor-pointer">
          <input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggle(m.id)} />
          <span className="font-medium text-text">{m.name}</span>
          <span className="text-text-faint">{m.email}</span>
        </label>
      ))}
      {data?.length === 0 && <div className="px-3 py-3 text-sm text-text-faint">No members assigned to you yet.</div>}
    </div>
  )
}
