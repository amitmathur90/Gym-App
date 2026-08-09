import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Button, Field, Modal, inputClass } from '../ui'
import ProfessionalFieldsForm, {
  emptyProfessionalFields,
  professionalFieldsToPayload,
  type ProfessionalFieldsState,
} from './ProfessionalFieldsForm'

export default function CreateNewTrainerModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [professional, setProfessional] = useState<ProfessionalFieldsState>(emptyProfessionalFields)
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/trainers/new', {
        name,
        email,
        phone: phone || undefined,
        password,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        ...professionalFieldsToPayload(professional),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
      onClose()
    },
  })

  const valid = name.trim().length > 1 && email.includes('@') && password.length >= 8

  return (
    <Modal title="Create New Trainer" onClose={onClose}>
      <div className="text-sm font-semibold text-text mb-2">Personal Information</div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Mobile Number">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
      <Field label="Email">
        <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gender">
          <select className={inputClass} value={gender} onChange={(e) => setGender(e.target.value)}>
            <option value="">— Select —</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </Field>
        <Field label="Date of Birth">
          <input className={inputClass} type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </Field>
      </div>
      <Field label="Address">
        <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Emergency Contact Name">
          <input
            className={inputClass}
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
          />
        </Field>
        <Field label="Emergency Contact Phone">
          <input
            className={inputClass}
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
          />
        </Field>
      </div>
      <Field label="Password (login credential)">
        <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <p className="text-xs text-text-faint mb-4 -mt-2">Login uses the email above — there's no separate username.</p>

      <div className="text-sm font-semibold text-text mb-2 mt-2">Professional Information</div>
      <ProfessionalFieldsForm state={professional} onChange={setProfessional} />

      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !valid}>
        {create.isPending ? 'Saving...' : 'Save Trainer'}
      </Button>
    </Modal>
  )
}
