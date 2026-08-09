import { Field, inputClass } from '../ui'

export interface ProfessionalFieldsState {
  specialties: string
  qualification: string
  certifications: string
  experienceYears: string
  ratePerHour: string
  salary: string
  joiningDate: string
  bio: string
  isActive: boolean
}

export const emptyProfessionalFields: ProfessionalFieldsState = {
  specialties: '',
  qualification: '',
  certifications: '',
  experienceYears: '',
  ratePerHour: '',
  salary: '',
  joiningDate: '',
  bio: '',
  isActive: true,
}

export function professionalFieldsToPayload(state: ProfessionalFieldsState) {
  return {
    specialties: state.specialties.split(',').map((s) => s.trim()).filter(Boolean),
    qualification: state.qualification || undefined,
    certifications: state.certifications.split(',').map((s) => s.trim()).filter(Boolean),
    experienceYears: state.experienceYears ? Number(state.experienceYears) : undefined,
    ratePerHour: state.ratePerHour ? Number(state.ratePerHour) : undefined,
    salary: state.salary ? Number(state.salary) : undefined,
    joiningDate: state.joiningDate || undefined,
    bio: state.bio || undefined,
    isActive: state.isActive,
  }
}

export default function ProfessionalFieldsForm({
  state,
  onChange,
}: {
  state: ProfessionalFieldsState
  onChange: (next: ProfessionalFieldsState) => void
}) {
  const set = <K extends keyof ProfessionalFieldsState>(key: K, value: ProfessionalFieldsState[K]) =>
    onChange({ ...state, [key]: value })

  return (
    <>
      <Field label="Specialization (comma-separated)">
        <input
          className={inputClass}
          value={state.specialties}
          onChange={(e) => set('specialties', e.target.value)}
          placeholder="Weight Loss, Yoga, CrossFit"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Qualification">
          <input className={inputClass} value={state.qualification} onChange={(e) => set('qualification', e.target.value)} />
        </Field>
        <Field label="Experience (years)">
          <input
            className={inputClass}
            type="number"
            value={state.experienceYears}
            onChange={(e) => set('experienceYears', e.target.value)}
          />
        </Field>
      </div>
      <Field label="Certifications (comma-separated)">
        <input
          className={inputClass}
          value={state.certifications}
          onChange={(e) => set('certifications', e.target.value)}
          placeholder="ACE-CPT, Nutrition Specialist"
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Salary (₹/month)">
          <input className={inputClass} type="number" value={state.salary} onChange={(e) => set('salary', e.target.value)} />
        </Field>
        <Field label="Rate per PT session (₹/hr)">
          <input
            className={inputClass}
            type="number"
            value={state.ratePerHour}
            onChange={(e) => set('ratePerHour', e.target.value)}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4 items-end">
        <Field label="Joining Date">
          <input className={inputClass} type="date" value={state.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 mb-4 text-sm text-slate-700">
          <input type="checkbox" checked={state.isActive} onChange={(e) => set('isActive', e.target.checked)} />
          Active
        </label>
      </div>
      <Field label="Bio (optional)">
        <textarea className={inputClass} rows={2} value={state.bio} onChange={(e) => set('bio', e.target.value)} />
      </Field>
    </>
  )
}
