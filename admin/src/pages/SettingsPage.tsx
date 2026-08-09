import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Card, ErrorState, PageHeader, Spinner } from '../components/ui'

const MAX_SIZE_MB = 4

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const { data, isLoading, error } = useQuery<{ loginBackground: string | null }>({
    queryKey: ['public-branding'],
    queryFn: () => api.get('/public/branding').then((r) => r.data),
  })

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('image', file)
      return api.post('/admin/settings/login-background', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-branding'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => api.delete('/admin/settings/login-background'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-branding'] })
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setLocalError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLocalError('Please choose an image file.')
      return
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setLocalError(`Image must be under ${MAX_SIZE_MB}MB.`)
      return
    }
    uploadMutation.mutate(file)
    e.target.value = ''
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader title="Settings" subtitle="Customize how the staff login page looks" />

      <Card className="p-6 max-w-2xl">
        <div className="font-semibold text-text mb-1">Login Page Background</div>
        <p className="text-sm text-text-muted mb-5">
          Shown on the left side of the Admin/Trainer login page. Recommended: a landscape photo, at least
          1600×1200px, under {MAX_SIZE_MB}MB. If none is set, a default gradient is used instead.
        </p>

        <div className="rounded-xl border border-border overflow-hidden mb-4 aspect-video bg-surface-hover flex items-center justify-center">
          {data?.loginBackground ? (
            <img src={data.loginBackground} alt="Login background preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm text-text-faint">No custom background set</span>
          )}
        </div>

        {(localError || uploadMutation.isError) && (
          <p className="text-sm text-red mb-4">{localError ?? apiErrorMessage(uploadMutation.error)}</p>
        )}

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="primary"
            disabled={uploadMutation.isPending}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadMutation.isPending ? 'Uploading…' : data?.loginBackground ? 'Replace Image' : 'Upload Image'}
          </Button>
          {data?.loginBackground && (
            <Button variant="danger" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
              {removeMutation.isPending ? 'Removing…' : 'Remove'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
