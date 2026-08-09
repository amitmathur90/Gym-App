import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../../lib/api'
import { Button, Field, Modal, inputClass } from '../ui'
import ProfessionalFieldsForm, { professionalFieldsToPayload, type ProfessionalFieldsState } from './ProfessionalFieldsForm'
import type { TrainerDetail } from '../../types/trainer'

export default function EditTrainerModal({ trainer, onClose }: { trainer: TrainerDetail; onClose: () => void }) {
  const [name, setName] = useState(trainer.user.name)
  const [phone, setPhone] = useState(trainer.user.phone ?? '')
  const [gender, setGender] = useState(trainer.user.gender ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(trainer.user.dateOfBirth?.slice(0, 10) ?? '')
  const [address, setAddress] = useState(trainer.user.address ?? '')
  const [emergencyContactName, setEmergencyContactName] = useState(trainer.user.emergencyContactName ?? '')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(trainer.user.emergencyContactPhone ?? '')
  const [professional, setProfessional] = useState<ProfessionalFieldsState>({
    specialties: trainer.specialties.join(', '),
    qualification: trainer.qualification ?? '',
    certifications: trainer.certifications.join(', '),
    experienceYears: trainer.experienceYears?.toString() ?? '',
    ratePerHour: trainer.ratePerHour ?? '',
    salary: trainer.salary ?? '',
    joiningDate: trainer.joiningDate?.slice(0, 10) ?? '',
    bio: trainer.bio ?? '',
    isActive: trainer.isActive,
  })
  const queryClient = useQueryClient()

  const save = useMutation({
    mutationFn: () =>
      api.patch(`/admin/trainers/${trainer.id}`, {
        name,
        phone: phone || undefined,
        gender: gender || undefined,
        dateOfBirth: dateOfBirth || undefined,
        address: address || undefined,
        emergencyContactName: emergencyContactName || undefined,
        emergencyContactPhone: emergencyContactPhone || undefined,
        ...professionalFieldsToPayload(professional),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainers'] })
      queryClient.invalidateQueries({ queryKey: ['admin-trainer', trainer.id] })
      onClose()
    },
  })

  return (
    <Modal title={`Edit ${trainer.user.name}`} onClose={onClose}>
      <div className="text-sm font-semibold text-slate-700 mb-2">Personal Information</div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Full Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Mobile Number">
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
      </div>
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

      <div className="text-sm font-semibold text-slate-700 mb-2 mt-2">Professional Information</div>
      <ProfessionalFieldsForm state={professional} onChange={setProfessional} />

      {save.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(save.error)}</p>}
      <Button onClick={() => save.mutate()} disabled={save.isPending || !name}>
        {save.isPending ? 'Saving...' : 'Save Changes'}
      </Button>
    </Modal>
  )
}
