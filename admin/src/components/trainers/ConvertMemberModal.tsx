import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Button, Modal } from '../ui'
import MemberSearchPicker from './MemberSearchPicker'
import ProfessionalFieldsForm, {
  emptyProfessionalFields,
  professionalFieldsToPayload,
  type ProfessionalFieldsState,
} from './ProfessionalFieldsForm'
import type { MemberOption } from '../../types/trainer'

export default function ConvertMemberModal({ onClose }: { onClose: () => void }) {
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null)
  const [professional, setProfessional] = useState<ProfessionalFieldsState>(emptyProfessionalFields)
  const [keepActiveMembership, setKeepActiveMembership] = useState(true)
  const queryClient = useQueryClient()

  const convert = useMutation({
    mutationFn: () =>
      api.post('/admin/trainers', {
        userId: selectedMember!.id,
        keepActiveMembership,
        ...professionalFieldsToPayload(professional),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-members'] })
      onClose()
    },
  })

  return (
    <Modal title="Convert Member to Trainer" onClose={onClose}>
      {!selectedMember ? (
        <MemberSearchPicker roleFilter="MEMBER" onSelect={setSelectedMember} />
      ) : (
        <div>
          <div className="mb-4 p-3 bg-slate-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-900">{selectedMember.name}</div>
              <div className="text-sm text-slate-500">
                {selectedMember.email}
                {selectedMember.phone && ` · ${selectedMember.phone}`}
              </div>
              {selectedMember.memberships?.[0] && (
                <div className="text-xs text-slate-400 mt-1">
                  Membership: {selectedMember.memberships[0].plan.name} · valid until{' '}
                  {new Date(selectedMember.memberships[0].endDate).toLocaleDateString()}
                </div>
              )}
            </div>
            <button className="text-sm text-primary" onClick={() => setSelectedMember(null)}>
              Change
            </button>
          </div>

          <div className="text-sm font-semibold text-slate-700 mb-2">Trainer Details</div>
          <ProfessionalFieldsForm state={professional} onChange={setProfessional} />

          <div className="space-y-2 mb-4 border-t border-slate-100 pt-3">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={keepActiveMembership}
                onChange={(e) => setKeepActiveMembership(e.target.checked)}
              />
              Keep active membership
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 opacity-60">
              <input type="checkbox" checked disabled />
              Assign trainer role
            </label>
            <p className="text-xs text-slate-400 pl-6">
              A person has exactly one role in this system, so assigning the trainer role automatically replaces
              their member role — there's nothing extra to toggle there.
            </p>
          </div>

          {convert.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(convert.error)}</p>}
          <Button onClick={() => convert.mutate()} disabled={convert.isPending}>
            {convert.isPending ? 'Converting...' : 'Convert to Trainer'}
          </Button>
        </div>
      )}
    </Modal>
  )
}
