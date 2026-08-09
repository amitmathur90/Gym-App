import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { api, apiErrorMessage } from '../lib/api'
import { Badge, Button, Card, ErrorState, Modal, PageHeader, Spinner } from '../components/ui'
import CreateNewTrainerModal from '../components/trainers/CreateNewTrainerModal'
import ConvertMemberModal from '../components/trainers/ConvertMemberModal'
import EditTrainerModal from '../components/trainers/EditTrainerModal'
import type { TrainerDetail } from '../types/trainer'

export default function TrainersPage() {
  const [showAddChoice, setShowAddChoice] = useState(false)
  const [showCreateNew, setShowCreateNew] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [editing, setEditing] = useState<TrainerDetail | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<TrainerDetail[]>({
    queryKey: ['admin-trainers'],
    queryFn: () => api.get('/admin/trainers').then((r) => r.data),
  })

  const deleteTrainer = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/trainers/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-trainers'] }),
    onError: (err) => alert(apiErrorMessage(err)),
  })

  return (
    <div>
      <PageHeader
        title="Trainers"
        subtitle={data ? `${data.length} total` : undefined}
        actions={<Button onClick={() => setShowAddChoice(true)}>+ Add Trainer</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : error || !data ? (
        <ErrorState message={apiErrorMessage(error)} />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Mobile</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Specialization</th>
                  <th className="px-4 py-3 font-medium">Experience</th>
                  <th className="px-4 py-3 font-medium">Assigned Members</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Join Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {t.user.avatarUrl ? (
                        <img src={t.user.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                          {t.user.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link to={`/trainers/${t.id}`} className="hover:text-primary">
                        {t.user.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.user.phone ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{t.user.email}</td>
                    <td className="px-4 py-3 text-slate-600">{t.specialties.join(', ') || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {t.experienceYears != null ? `${t.experienceYears} yrs` : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t._count.members}</td>
                    <td className="px-4 py-3">
                      <Badge color={t.isActive ? 'green' : 'slate'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-sm">
                        <Link to={`/trainers/${t.id}`} className="text-primary font-medium">
                          View
                        </Link>
                        <button className="text-primary font-medium" onClick={() => setEditing(t)}>
                          Edit
                        </button>
                        <button
                          className="text-red-600 font-medium"
                          onClick={() =>
                            confirm(`Remove ${t.user.name} as a trainer?`) && deleteTrainer.mutate(t.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-slate-400">
                      No trainers yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {showAddChoice && (
        <Modal title="Add Trainer" onClose={() => setShowAddChoice(false)}>
          <div className="space-y-3">
            <button
              className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setShowAddChoice(false)
                setShowCreateNew(true)
              }}
            >
              <div className="font-semibold text-slate-900">Create New Trainer</div>
              <div className="text-sm text-slate-500">Set up a brand-new trainer account from scratch.</div>
            </button>
            <button
              className="w-full text-left p-4 rounded-lg border border-slate-200 hover:border-primary hover:bg-primary/5"
              onClick={() => {
                setShowAddChoice(false)
                setShowConvert(true)
              }}
            >
              <div className="font-semibold text-slate-900">Convert Member to Trainer</div>
              <div className="text-sm text-slate-500">
                Promote an existing member — no duplicate account, their data stays intact.
              </div>
            </button>
          </div>
        </Modal>
      )}

      {showCreateNew && <CreateNewTrainerModal onClose={() => setShowCreateNew(false)} />}
      {showConvert && <ConvertMemberModal onClose={() => setShowConvert(false)} />}
      {editing && <EditTrainerModal trainer={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
