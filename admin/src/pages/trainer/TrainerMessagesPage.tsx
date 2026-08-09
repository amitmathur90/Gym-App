import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { api, apiErrorMessage } from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { Card, ErrorState, PageHeader, Spinner, inputClass } from '../../components/ui'
import type { AssignedMemberCard, Message } from '../../types/trainerSelf'

export default function TrainerMessagesPage() {
  const { memberId } = useParams<{ memberId: string }>()
  const navigate = useNavigate()
  const { trainer } = useAuth()

  const membersQuery = useQuery<AssignedMemberCard[]>({
    queryKey: ['trainer-members'],
    queryFn: () => api.get('/trainer/members').then((r) => r.data),
  })

  return (
    <div>
      <PageHeader title="Messages" subtitle="Chat with your assigned members" />
      <div className="grid md:grid-cols-3 gap-4" style={{ height: '70vh' }}>
        <Card className="p-0 overflow-y-auto">
          {membersQuery.data?.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/trainer/messages/${m.id}`)}
              className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                memberId === m.id ? 'bg-primary/5' : ''
              }`}
            >
              <div className="font-medium text-slate-900 text-sm">{m.name}</div>
              <div className="text-xs text-slate-500">{m.email}</div>
            </button>
          ))}
          {membersQuery.data?.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-400">No assigned members yet.</div>
          )}
        </Card>

        <div className="md:col-span-2">
          {memberId && trainer ? (
            <ChatPanel memberId={memberId} myUserId={trainer.userId} />
          ) : (
            <Card className="h-full flex items-center justify-center text-slate-400 text-sm">
              Select a member to start chatting
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatPanel({ memberId, myUserId }: { memberId: string; myUserId: string }) {
  const [body, setBody] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [showAttachment, setShowAttachment] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<Message[]>({
    queryKey: ['trainer-messages', memberId],
    queryFn: () => api.get(`/trainer/messages/${memberId}`).then((r) => r.data),
    refetchInterval: 5_000,
  })

  const send = useMutation({
    mutationFn: () =>
      api.post('/trainer/messages', {
        receiverId: memberId,
        body: body || undefined,
        attachmentUrl: attachmentUrl || undefined,
        attachmentType: attachmentUrl ? 'IMAGE' : undefined,
      }),
    onSuccess: () => {
      setBody('')
      setAttachmentUrl('')
      setShowAttachment(false)
      queryClient.invalidateQueries({ queryKey: ['trainer-messages', memberId] })
    },
  })

  if (isLoading) return <Spinner />
  if (error || !data) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <Card className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {data.map((m) => {
          const isMine = m.senderId === myUserId
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${
                  isMine ? 'bg-primary text-white' : 'bg-slate-100 text-slate-900'
                }`}
              >
                {m.attachmentUrl && (
                  <img src={m.attachmentUrl} alt="attachment" className="rounded mb-1 max-h-40 object-cover" />
                )}
                {m.body && <div>{m.body}</div>}
                <div className={`text-[10px] mt-1 ${isMine ? 'text-white/70' : 'text-slate-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          )
        })}
        {data.length === 0 && <div className="text-center text-slate-400 text-sm py-8">No messages yet — say hello!</div>}
      </div>

      {showAttachment && (
        <div className="px-4 pb-2">
          <input
            className={inputClass}
            value={attachmentUrl}
            onChange={(e) => setAttachmentUrl(e.target.value)}
            placeholder="Image/document URL (no file upload infra yet — paste a link)"
          />
        </div>
      )}

      <div className="border-t border-slate-200 p-3 flex gap-2">
        <button
          className="px-3 rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50"
          onClick={() => setShowAttachment((v) => !v)}
          title="Attach image/document link"
        >
          📎
        </button>
        <input
          className={`${inputClass} flex-1`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          onKeyDown={(e) => e.key === 'Enter' && (body || attachmentUrl) && send.mutate()}
        />
        <button
          className="px-4 rounded-lg bg-primary text-white text-sm font-medium disabled:opacity-50"
          onClick={() => send.mutate()}
          disabled={send.isPending || (!body && !attachmentUrl)}
        >
          Send
        </button>
      </div>
    </Card>
  )
}
