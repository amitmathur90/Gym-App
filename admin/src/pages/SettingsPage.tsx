import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, apiErrorMessage } from '../lib/api'
import { Button, Card, ErrorState, Field, PageHeader, Spinner, inputClass } from '../components/ui'

const MAX_SIZE_MB = 4

interface Branding {
  loginBackground: string | null
  logo: string | null
  siteTitle: string | null
  siteDescription: string | null
}

export default function SettingsPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery<Branding>({
    queryKey: ['public-branding'],
    queryFn: () => api.get('/public/branding').then((r) => r.data),
  })

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['public-branding'] })
  }

  if (isLoading) return <Spinner />
  if (error) return <ErrorState message={apiErrorMessage(error)} />

  return (
    <div>
      <PageHeader title="Settings" subtitle="Customize how the staff login page looks" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
        <ImageSettingCard
          title="Logo"
          description={`Shown on the login page and in the sidebar. Square images work best, under ${MAX_SIZE_MB}MB.`}
          previewClassName="aspect-square max-w-[160px] mx-auto rounded-2xl"
          currentImage={data?.logo ?? null}
          uploadUrl="/admin/settings/logo"
          onChanged={invalidate}
        />
        <ImageSettingCard
          title="Login Page Background"
          description={`Shown on the left side of the login page. A landscape photo, at least 1600×1200px, under ${MAX_SIZE_MB}MB.`}
          previewClassName="aspect-video"
          currentImage={data?.loginBackground ?? null}
          uploadUrl="/admin/settings/login-background"
          onChanged={invalidate}
        />
      </div>

      <BrandingTextCard
        siteTitle={data?.siteTitle ?? ''}
        siteDescription={data?.siteDescription ?? ''}
        onSaved={invalidate}
      />
    </div>
  )
}

function ImageSettingCard({
  title,
  description,
  previewClassName,
  currentImage,
  uploadUrl,
  onChanged,
}: {
  title: string
  description: string
  previewClassName: string
  currentImage: string | null
  uploadUrl: string
  onChanged: () => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('image', file)
      return api.post(uploadUrl, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: onChanged,
  })

  const removeMutation = useMutation({
    mutationFn: () => api.delete(uploadUrl),
    onSuccess: onChanged,
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

  return (
    <Card className="p-6">
      <div className="font-semibold text-text mb-1">{title}</div>
      <p className="text-sm text-text-muted mb-5">{description}</p>

      <div
        className={`rounded-xl border border-border overflow-hidden mb-4 bg-surface-hover flex items-center justify-center ${previewClassName}`}
      >
        {currentImage ? (
          <img src={currentImage} alt={`${title} preview`} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm text-text-faint px-4 text-center">No image set</span>
        )}
      </div>

      {(localError || uploadMutation.isError) && (
        <p className="text-sm text-red mb-4">{localError ?? apiErrorMessage(uploadMutation.error)}</p>
      )}

      <div className="flex items-center gap-3">
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        <Button variant="primary" disabled={uploadMutation.isPending} onClick={() => fileInputRef.current?.click()}>
          {uploadMutation.isPending ? 'Uploading…' : currentImage ? 'Replace Image' : 'Upload Image'}
        </Button>
        {currentImage && (
          <Button variant="danger" disabled={removeMutation.isPending} onClick={() => removeMutation.mutate()}>
            {removeMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        )}
      </div>
    </Card>
  )
}

function BrandingTextCard({
  siteTitle,
  siteDescription,
  onSaved,
}: {
  siteTitle: string
  siteDescription: string
  onSaved: () => void
}) {
  const [title, setTitle] = useState(siteTitle)
  const [description, setDescription] = useState(siteDescription)

  useEffect(() => {
    setTitle(siteTitle)
    setDescription(siteDescription)
  }, [siteTitle, siteDescription])

  const saveMutation = useMutation({
    mutationFn: () => api.put('/admin/settings/branding-text', { siteTitle: title, siteDescription: description }),
    onSuccess: onSaved,
  })

  const dirty = title !== siteTitle || description !== siteDescription

  return (
    <Card className="p-6 max-w-4xl mt-6">
      <div className="font-semibold text-text mb-1">Title &amp; Description</div>
      <p className="text-sm text-text-muted mb-5">
        The headline and tagline shown on the login page (defaults to "Gym Fit" and a generic tagline if left blank).
      </p>

      <Field label="Title">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gym Fit"
          maxLength={80}
        />
      </Field>
      <Field label="Description">
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Members, trainers, classes, payments and progress — everything your team needs, in one place."
          maxLength={300}
        />
      </Field>

      {saveMutation.isError && <p className="text-sm text-red mb-4">{apiErrorMessage(saveMutation.error)}</p>}

      <Button variant="primary" disabled={!dirty || saveMutation.isPending} onClick={() => saveMutation.mutate()}>
        {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
      </Button>
    </Card>
  )
}
