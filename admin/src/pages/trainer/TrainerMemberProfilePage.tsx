import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, apiErrorMessage } from '../../lib/api'
import { Badge, Button, Card, ErrorState, Field, PageHeader, Spinner, inputClass } from '../../components/ui'
import type { BodyMeasurement, ProgressPhoto } from '../../types/trainerSelf'

interface MemberDetail {
  id: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  gender: string | null
  dateOfBirth: string | null
  address: string | null
  memberships: { plan: { name: string }; status: string; endDate: string }[]
  trainerAssignments: { trainingType: string; startDate: string; schedule: string | null; status: string }[]
}

const MEASUREMENT_FIELDS = [
  { key: 'weightKg', label: 'Weight (kg)' },
  { key: 'bodyFatPct', label: 'Body Fat %' },
  { key: 'chestCm', label: 'Chest (cm)' },
  { key: 'waistCm', label: 'Waist (cm)' },
  { key: 'armsCm', label: 'Arms (cm)' },
  { key: 'thighsCm', label: 'Thighs (cm)' },
  { key: 'shouldersCm', label: 'Shoulders (cm)' },
] as const

export default function TrainerMemberProfilePage() {
  const { id } = useParams<{ id: string }>()

  const { data: member, isLoading, error } = useQuery<MemberDetail>({
    queryKey: ['trainer-member', id],
    queryFn: () => api.get(`/trainer/members/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <Spinner />
  if (error || !member || !id) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <Link to="/trainer/members" className="text-sm text-primary mb-4 inline-block">
        &larr; Back to Members
      </Link>
      <PageHeader
        title={member.name}
        subtitle={member.email}
        actions={
          <div className="flex gap-2">
            <Link to={`/trainer/workout-plans?memberId=${id}`} className="text-sm px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
              Workout Plan
            </Link>
            <Link to={`/trainer/diet-plans?memberId=${id}`} className="text-sm px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50">
              Diet Plan
            </Link>
            <Link to={`/trainer/messages/${id}`} className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark">
              Chat
            </Link>
          </div>
        }
      />

      <Card className="p-5 mb-4">
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Phone:</span> <span className="font-medium">{member.phone ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Membership:</span>{' '}
            <span className="font-medium">{member.memberships[0]?.plan.name ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Gender:</span> <span className="font-medium">{member.gender ?? '—'}</span>
          </div>
          <div>
            <span className="text-slate-500">Goal:</span>{' '}
            <span className="font-medium">{member.trainerAssignments[0]?.trainingType ?? '—'}</span>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <MeasurementsSection memberId={id} />
        <PhotosSection memberId={id} />
      </div>
    </div>
  )
}

function MeasurementsSection({ memberId }: { memberId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<BodyMeasurement[]>({
    queryKey: ['trainer-measurements', memberId],
    queryFn: () => api.get(`/trainer/members/${memberId}/measurements`).then((r) => r.data),
  })

  const create = useMutation({
    mutationFn: () => {
      const payload: Record<string, number> = {}
      for (const f of MEASUREMENT_FIELDS) {
        if (form[f.key]) payload[f.key] = Number(form[f.key])
      }
      return api.post(`/trainer/members/${memberId}/measurements`, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-measurements', memberId] })
      setForm({})
      setShowForm(false)
    },
  })

  const chartData = data?.map((m) => ({
    date: new Date(m.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    weight: m.weightKg,
    bodyFat: m.bodyFatPct,
  }))

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-slate-900">Body Measurements</div>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          + Log
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="grid grid-cols-2 gap-3">
            {MEASUREMENT_FIELDS.map((f) => (
              <label key={f.key} className="text-xs">
                <span className="block text-slate-600 mb-1">{f.label}</span>
                <input
                  className={inputClass}
                  type="number"
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
                />
              </label>
            ))}
          </div>
          {create.isError && <p className="text-sm text-red-600 mt-3">{apiErrorMessage(create.error)}</p>}
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending ? 'Saving...' : 'Save measurement'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-400">No measurements logged yet.</p>
      ) : (
        <>
          <div className="text-xs font-medium text-slate-600 mb-2">Weight & Body Fat Progress</div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="weight" stroke="#2f6f4f" strokeWidth={2} dot={false} name="Weight (kg)" />
              <Line type="monotone" dataKey="bodyFat" stroke="#e0b84c" strokeWidth={2} dot={false} name="Body Fat %" />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-3 max-h-40 overflow-y-auto space-y-1">
            {[...data].reverse().map((m) => (
              <div key={m.id} className="text-xs text-slate-600 flex justify-between border-b border-slate-100 py-1">
                <span>{new Date(m.recordedAt).toLocaleDateString()}</span>
                <span>
                  {m.weightKg != null && `${m.weightKg}kg `}
                  {m.bodyFatPct != null && `· ${m.bodyFatPct}% BF`}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Muscle-gain and calories-burned tracking aren't implemented yet.
          </p>
        </>
      )}
    </Card>
  )
}

function PhotosSection({ memberId }: { memberId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [type, setType] = useState<'BEFORE' | 'AFTER' | 'PROGRESS'>('BEFORE')
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<ProgressPhoto[]>({
    queryKey: ['trainer-photos', memberId],
    queryFn: () => api.get(`/trainer/members/${memberId}/photos`).then((r) => r.data),
  })

  const upload = useMutation({
    mutationFn: () => api.post(`/trainer/members/${memberId}/photos`, { photoUrl, type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trainer-photos', memberId] })
      setPhotoUrl('')
      setShowForm(false)
    },
  })

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-slate-900">Progress Photos</div>
        <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
          + Add
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <Field label="Photo URL">
            <input className={inputClass} value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Type">
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="BEFORE">Before</option>
              <option value="AFTER">After</option>
              <option value="PROGRESS">Progress</option>
            </select>
          </Field>
          <p className="text-xs text-slate-400 mb-3">
            Paste an image URL — direct file upload isn't wired up yet, this needs image storage infra.
          </p>
          {upload.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(upload.error)}</p>}
          <Button onClick={() => upload.mutate()} disabled={upload.isPending || !photoUrl}>
            {upload.isPending ? 'Saving...' : 'Add photo'}
          </Button>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : data.length === 0 ? (
        <p className="text-sm text-slate-400">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.map((p) => (
            <div key={p.id} className="relative">
              <img src={p.photoUrl} alt={p.type} className="w-full h-24 object-cover rounded-lg border border-slate-200" />
              <div className="absolute bottom-1 left-1">
                <Badge color={p.type === 'BEFORE' ? 'slate' : p.type === 'AFTER' ? 'green' : 'amber'}>{p.type}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
