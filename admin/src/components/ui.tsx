import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-surface rounded-2xl border border-border ${className}`}>{children}</div>
  )
}

const ICON_BG: Record<string, string> = {
  pink: 'bg-pink/15 text-pink',
  purple: 'bg-purple/15 text-purple',
  blue: 'bg-blue/15 text-blue',
  green: 'bg-green/15 text-green',
  orange: 'bg-orange/15 text-orange',
  red: 'bg-red/15 text-red',
}

export function StatCard({
  label,
  value,
  icon,
  color = 'pink',
  trend,
}: {
  label: string
  value: string
  icon: string
  color?: 'pink' | 'purple' | 'blue' | 'green' | 'orange' | 'red'
  trend?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0 ${ICON_BG[color]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-text leading-tight truncate">{value}</div>
          <div className="text-sm text-text-muted truncate">{label}</div>
        </div>
      </div>
      {trend && <div className="text-xs text-green mt-3 font-medium">{trend}</div>}
    </Card>
  )
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return <div className="text-center py-16 text-red">{message}</div>
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-surface-raised text-text border border-border hover:bg-surface-hover',
    danger: 'bg-surface-raised text-red border border-red/30 hover:bg-red/10',
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {children}
    </button>
  )
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: ReactNode
  color?: 'slate' | 'green' | 'red' | 'amber' | 'blue' | 'purple'
}) {
  const styles = {
    slate: 'bg-white/10 text-text-muted',
    green: 'bg-green/15 text-green',
    red: 'bg-red/15 text-red',
    amber: 'bg-orange/15 text-orange',
    blue: 'bg-blue/15 text-blue',
    purple: 'bg-purple/15 text-purple',
  }
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles[color]}`}>{children}</span>
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-surface-raised border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text">{title}</h2>
          <button onClick={onClose} className="text-text-faint hover:text-text text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-text-muted mb-1">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  'w-full rounded-lg border border-border bg-surface-raised text-text placeholder:text-text-faint px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary'
