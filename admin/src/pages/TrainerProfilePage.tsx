import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Field, Modal, PageHeader, Spinner, inputClass } from '../components/ui'
import EditTrainerModal from '../components/trainers/EditTrainerModal'
import MemberSearchPicker from '../components/trainers/MemberSearchPicker'
import type { MemberOption, TrainerProfile, TrainerSchedule } from '../types/trainer'
import { DAY_NAMES } from '../types/trainer'

export default function TrainerProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [showEdit, setShowEdit] = useState(false)

  const { data, isLoading, error } = useQuery<TrainerProfile>({
    queryKey: ['admin-trainer', id],
    queryFn: () => api.get(`/admin/trainers/${id}`).then((r) => r.data),
    enabled: !!id,
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <Link to="/trainers" className="text-sm text-primary mb-4 inline-block">
        &larr; Back to Trainers
      </Link>
      <PageHeader
        title={data.user.name}
        subtitle={data.user.email}
        actions={
          <div className="flex items-center gap-3">
            <Badge color={data.isActive ? 'green' : 'slate'}>{data.isActive ? 'Active' : 'Inactive'}</Badge>
            <Button variant="secondary" onClick={() => setShowEdit(true)}>
              Edit
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <PersonalInfoCard trainer={data} />
        <ProfessionalInfoCard trainer={data} />
      </div>

      <PerformanceCard trainer={data} />

      <div className="mt-4">
        <AssignMembersSection trainerId={data.id} assignments={data.assignments} />
      </div>

      <div className="mt-4">
        <TrainerScheduleSection trainerId={data.id} />
      </div>

      {showEdit && <EditTrainerModal trainer={data} onClose={() => setShowEdit(false)} />}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 text-sm border-b border-border last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className="text-text font-medium text-right">{value}</span>
    </div>
  )
}

function PersonalInfoCard({ trainer }: { trainer: TrainerProfile }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-3">
        {trainer.user.avatarUrl ? (
          <img src={trainer.user.avatarUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            {trainer.user.name[0]?.toUpperCase()}
          </div>
        )}
        <div className="font-semibold text-text">Personal Information</div>
      </div>
      <InfoRow label="Mobile" value={trainer.user.phone ?? '—'} />
      <InfoRow label="Email" value={trainer.user.email} />
      <InfoRow label="Gender" value={trainer.user.gender ?? '—'} />
      <InfoRow label="Date of Birth" value={trainer.user.dateOfBirth ? new Date(trainer.user.dateOfBirth).toLocaleDateString() : '—'} />
      <InfoRow label="Address" value={trainer.user.address ?? '—'} />
      <InfoRow label="Emergency Contact" value={trainer.user.emergencyContactName ? `${trainer.user.emergencyContactName} (${trainer.user.emergencyContactPhone ?? '—'})` : '—'} />
    </Card>
  )
}

function ProfessionalInfoCard({ trainer }: { trainer: TrainerProfile }) {
  return (
    <Card className="p-5">
      <div className="font-semibold text-text mb-3">Professional Information</div>
      <InfoRow label="Trainer ID" value={trainer.id.slice(0, 8)} />
      <InfoRow label="Specialization" value={trainer.specialties.join(', ') || '—'} />
      <InfoRow label="Experience" value={trainer.experienceYears != null ? `${trainer.experienceYears} years` : '—'} />
      <InfoRow label="Qualification" value={trainer.qualification ?? '—'} />
      <InfoRow label="Certifications" value={trainer.certifications.join(', ') || '—'} />
      <InfoRow label="Salary" value={trainer.salary ? `₹${Number(trainer.salary).toLocaleString()}/month` : '—'} />
      <InfoRow label="PT Session Rate" value={trainer.ratePerHour ? `₹${Number(trainer.ratePerHour)}/hr` : '—'} />
      <InfoRow label="Joining Date" value={trainer.joiningDate ? new Date(trainer.joiningDate).toLocaleDateString() : '—'} />
      {trainer.bio && <p className="text-sm text-text-muted mt-3">{trainer.bio}</p>}
    </Card>
  )
}

function PerformanceCard({ trainer }: { trainer: TrainerProfile }) {
  const p = trainer.performance
  return (
    <Card className="p-5">
      <div className="font-semibold text-text mb-3">Performance</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <Stat label="Total Members Assigned" value={String(p.totalMembersAssigned)} />
        <Stat label="Active Members" value={String(p.activeMembers)} />
        <Stat label="Diet Plans Created" value={String(p.dietPlansCreated)} />
        <Stat label="Average Rating" value={p.averageRating != null ? p.averageRating.toFixed(1) : 'Not tracked yet'} muted={p.averageRating == null} />
      </div>
      <div className="text-sm font-medium text-text mb-2">Monthly assignments (last 6 months)</div>
      {p.monthlyAssignments.length === 0 ? (
        <p className="text-sm text-text-faint">No assignments yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={p.monthlyAssignments}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#2f6f4f" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
      <p className="text-xs text-text-faint mt-3">
        Attendance tracking and member ratings aren't implemented yet, so those metrics aren't shown here.
      </p>
    </Card>
  )
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div>
      <div className={`text-2xl font-bold ${muted ? 'text-text-faint text-base' : 'text-text'}`}>{value}</div>
      <div className="text-xs text-text-muted">{label}</div>
    </div>
  )
}

const TRAINING_TYPES = ['Personal Training', 'Weight Loss Program', 'Strength Building', 'Group Class Coaching', 'Rehabilitation']

function AssignMembersSection({
  trainerId,
  assignments,
}: {
  trainerId: string
  assignments: TrainerProfile['assignments']
}) {
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null)
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0])
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [schedule, setSchedule] = useState('')
  const [notes, setNotes] = useState('')
  const queryClient = useQueryClient()

  const assign = useMutation({
    mutationFn: () =>
      api.post(`/admin/trainers/${trainerId}/assignments`, {
        memberId: selectedMember!.id,
        trainingType,
        startDate,
        endDate: endDate || undefined,
        schedule: schedule || undefined,
        notes: notes || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainer', trainerId] })
      setSelectedMember(null)
      setSchedule('')
      setNotes('')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ assignmentId, status }: { assignmentId: string; status: string }) =>
      api.patch(`/admin/trainers/assignments/${assignmentId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trainer', trainerId] }),
  })

  return (
    <Card className="p-5">
      <div className="font-semibold text-text mb-3">Assign Members</div>

      {!selectedMember ? (
        <MemberSearchPicker onSelect={setSelectedMember} />
      ) : (
        <div className="mb-4 p-3 bg-bg rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-text">{selectedMember.name}</div>
              <div className="text-sm text-text-muted">{selectedMember.email}</div>
            </div>
            <button className="text-sm text-primary" onClick={() => setSelectedMember(null)}>
              Change
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Training Type">
              <select className={inputClass} value={trainingType} onChange={(e) => setTrainingType(e.target.value)}>
                {TRAINING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Schedule (optional)">
              <input
                className={inputClass}
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder="Mon/Wed/Fri 6-7AM"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date">
              <input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End Date (optional)">
              <input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Notes (optional)">
            <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
          {assign.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(assign.error)}</p>}
          <Button onClick={() => assign.mutate()} disabled={assign.isPending}>
            {assign.isPending ? 'Assigning...' : 'Assign Member'}
          </Button>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-3">
        <div className="text-sm font-medium text-text mb-2">Assignment history ({assignments.length})</div>
        {assignments.length === 0 ? (
          <p className="text-sm text-text-faint">No members assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <div>
                  <div className="font-medium text-text">{a.member.name}</div>
                  <div className="text-text-muted text-xs">
                    {a.trainingType} · since {new Date(a.startDate).toLocaleDateString()}
                    {a.schedule && ` · ${a.schedule}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color={a.status === 'ACTIVE' ? 'green' : a.status === 'CANCELLED' ? 'red' : 'slate'}>
                    {a.status}
                  </Badge>
                  {a.status === 'ACTIVE' && (
                    <select
                      className="text-xs border border-border rounded px-1 py-0.5"
                      value=""
                      onChange={(e) => e.target.value && updateStatus.mutate({ assignmentId: a.id, status: e.target.value })}
                    >
                      <option value="">Update...</option>
                      <option value="COMPLETED">Mark Completed</option>
                      <option value="CANCELLED">Cancel</option>
                    </select>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}

function TrainerScheduleSection({ trainerId }: { trainerId: string }) {
  const [showAddAvailability, setShowAddAvailability] = useState(false)
  const [showAddHoliday, setShowAddHoliday] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<TrainerSchedule>({
    queryKey: ['admin-trainer-schedule', trainerId],
    queryFn: () => api.get(`/admin/trainers/${trainerId}/schedule`).then((r) => r.data),
  })

  const deleteAvailability = useMutation({
    mutationFn: (availabilityId: string) => api.delete(`/admin/trainers/availability/${availabilityId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trainer-schedule', trainerId] }),
  })

  const deleteHoliday = useMutation({
    mutationFn: (holidayId: string) => api.delete(`/admin/trainers/holidays/${holidayId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trainer-schedule', trainerId] }),
  })

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-text">Trainer Schedule</div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddAvailability(true)}>
            + Availability Block
          </Button>
          <Button variant="secondary" onClick={() => setShowAddHoliday(true)}>
            + Holiday
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-medium text-text mb-2">Weekly availability</div>
            {DAY_NAMES.map((dayName, dayIdx) => {
              const blocks = data.availability.filter((a) => a.dayOfWeek === dayIdx)
              return (
                <div key={dayIdx} className="mb-2">
                  <div className="text-xs font-semibold text-text-muted">{dayName}</div>
                  {blocks.length === 0 ? (
                    <div className="text-xs text-text-faint pl-2">Off</div>
                  ) : (
                    blocks.map((b) => (
                      <div key={b.id} className="flex items-center justify-between text-sm pl-2">
                        <span>
                          {b.label ? `${b.label}: ` : ''}
                          {b.startTime}–{b.endTime}
                        </span>
                        <button className="text-red-500 text-xs" onClick={() => deleteAvailability.mutate(b.id)}>
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )
            })}

            <div className="text-sm font-medium text-text mb-2 mt-4">Upcoming PT sessions</div>
            {data.upcomingBookings.length === 0 ? (
              <p className="text-xs text-text-faint">None scheduled.</p>
            ) : (
              data.upcomingBookings.map((b) => (
                <div key={b.id} className="text-sm">
                  {new Date(b.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              ))
            )}

            <div className="text-sm font-medium text-text mb-2 mt-4">Upcoming group classes</div>
            {data.upcomingClasses.length === 0 ? (
              <p className="text-xs text-text-faint">None scheduled.</p>
            ) : (
              data.upcomingClasses.map((c) => (
                <div key={c.id} className="text-sm">
                  {c.gymClass.name} —{' '}
                  {new Date(c.startsAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              ))
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-text mb-2">Upcoming holidays</div>
            {data.holidays.length === 0 ? (
              <p className="text-xs text-text-faint mb-4">None scheduled.</p>
            ) : (
              <div className="space-y-1 mb-4">
                {data.holidays.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-sm">
                    <span>
                      {new Date(h.date).toLocaleDateString()}
                      {h.reason && ` — ${h.reason}`}
                    </span>
                    <button className="text-red-500 text-xs" onClick={() => deleteHoliday.mutate(h.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="text-sm font-medium text-text mb-2">Weekly off</div>
            <div className="text-sm text-text-muted">
              {data.weeklyOffDays.length === 0 ? 'None' : data.weeklyOffDays.map((d) => DAY_NAMES[d]).join(', ')}
            </div>
          </div>
        </div>
      )}

      {showAddAvailability && (
        <AddAvailabilityModal trainerId={trainerId} onClose={() => setShowAddAvailability(false)} />
      )}
      {showAddHoliday && <AddHolidayModal trainerId={trainerId} onClose={() => setShowAddHoliday(false)} />}
    </Card>
  )
}

function AddAvailabilityModal({ trainerId, onClose }: { trainerId: string; onClose: () => void }) {
  const [dayOfWeek, setDayOfWeek] = useState(1)
  const [startTime, setStartTime] = useState('06:00')
  const [endTime, setEndTime] = useState('09:00')
  const [label, setLabel] = useState('Morning Batch')
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () =>
      api.post(`/admin/trainers/${trainerId}/availability`, { dayOfWeek, startTime, endTime, label: label || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainer-schedule', trainerId] })
      onClose()
    },
  })

  return (
    <Modal title="Add availability block" onClose={onClose}>
      <Field label="Day">
        <select className={inputClass} value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
          {DAY_NAMES.map((d, i) => (
            <option key={i} value={i}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Start time">
          <input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="End time">
          <input className={inputClass} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>
      <Field label="Label (optional)">
        <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Morning Batch" />
      </Field>
      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending}>
        {create.isPending ? 'Saving...' : 'Add block'}
      </Button>
    </Modal>
  )
}

function AddHolidayModal({ trainerId, onClose }: { trainerId: string; onClose: () => void }) {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const queryClient = useQueryClient()

  const create = useMutation({
    mutationFn: () => api.post(`/admin/trainers/${trainerId}/holidays`, { date, reason: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trainer-schedule', trainerId] })
      onClose()
    },
  })

  return (
    <Modal title="Add holiday" onClose={onClose}>
      <Field label="Date">
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </Field>
      <Field label="Reason (optional)">
        <input className={inputClass} value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      {create.isError && <p className="text-sm text-red-600 mb-3">{apiErrorMessage(create.error)}</p>}
      <Button onClick={() => create.mutate()} disabled={create.isPending || !date}>
        {create.isPending ? 'Saving...' : 'Add holiday'}
      </Button>
    </Modal>
  )
}

