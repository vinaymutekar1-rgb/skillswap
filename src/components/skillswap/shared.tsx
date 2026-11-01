/**
 * Shared SkillSwap UI primitives.
 *
 * Deliberately small and dependency-free: the app's visual language lives in
 * `index.css` (`.ss-*` classes) so components stay declarative.
 */

import { useEffect, type ReactNode } from 'react'
import { X, Star } from 'lucide-react'
import type { SkillLevel } from '@/lib/types'

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#8b6cff,#56d9ff)',
  'linear-gradient(135deg,#ff79be,#8b6cff)',
  'linear-gradient(135deg,#5be0af,#56d9ff)',
  'linear-gradient(135deg,#ffc46b,#ff79be)',
  'linear-gradient(135deg,#56d9ff,#5be0af)',
  'linear-gradient(135deg,#a855f7,#ff79be)',
]

function hashIndex(seed: string, length: number): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973
  return hash % length
}

export function Avatar({
  initials,
  name,
  size = 40,
}: {
  initials: string
  name?: string
  size?: number
}) {
  return (
    <div
      className="ss-avatar"
      style={{
        width: size,
        height: size,
        fontSize: Math.max(10, size * 0.36),
        background: AVATAR_GRADIENTS[hashIndex(name ?? initials, AVATAR_GRADIENTS.length)],
      }}
      aria-hidden="true"
    >
      {initials}
    </div>
  )
}

export function StatCard({
  label,
  value,
  hint,
  accent = 'var(--ss-violet)',
  icon,
}: {
  label: string
  value: ReactNode
  hint?: string
  accent?: string
  icon?: ReactNode
}) {
  return (
    <div className="ss-card ss-card-hover p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
          {label}
        </p>
        {icon ? <span style={{ color: accent }}>{icon}</span> : null}
      </div>
      <p
        className="mt-2 text-2xl font-bold sm:text-[1.7rem]"
        style={{ color: accent, textShadow: `0 0 26px ${accent}44` }}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--ss-text-mute)]">{hint}</p> : null}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-[var(--ss-text-dim)]">{subtitle}</p>
        ) : null}
        <div
          className="mt-2.5 h-[2px] w-14 rounded-full"
          style={{ background: 'linear-gradient(90deg,var(--ss-violet),var(--ss-cyan))' }}
        />
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  )
}

export function SkillChip({
  skill,
  level,
  kind,
}: {
  skill: string
  level?: SkillLevel
  kind?: 'teach' | 'learn'
}) {
  const cls = kind === 'teach' ? 'ss-chip ss-chip-teach' : kind === 'learn' ? 'ss-chip ss-chip-learn' : 'ss-chip'
  return (
    <span className={cls}>
      {skill}
      {level ? <span className="opacity-60">· {level.slice(0, 3)}</span> : null}
    </span>
  )
}

export function Stars({ value, size = 13 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          style={{ color: i <= Math.round(value) ? 'var(--ss-amber)' : 'rgba(255,255,255,0.18)' }}
          fill={i <= Math.round(value) ? 'var(--ss-amber)' : 'transparent'}
        />
      ))}
    </span>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(4,6,14,0.76)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />
      <div
        className="ss-card ss-anim-in relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl sm:max-w-lg sm:rounded-2xl"
        style={{
          borderColor: 'var(--ss-border-strong)',
          boxShadow: '0 30px 80px -30px rgba(139,108,255,0.7)',
        }}
      >
        <div className="flex items-center justify-between gap-4 border-b border-[var(--ss-border)] p-4 sm:p-5">
          <h3 className="text-base font-bold sm:text-lg">{title}</h3>
          <button className="ss-btn ss-btn-ghost ss-btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
        {footer ? (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--ss-border)] p-4 sm:flex-row sm:justify-end sm:p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="ss-card flex flex-col items-center gap-3 px-6 py-12 text-center">
      <div
        className="grid h-12 w-12 place-items-center rounded-2xl"
        style={{ background: 'rgba(139,108,255,0.12)', color: 'var(--ss-violet)' }}
      >
        {icon}
      </div>
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-sm text-[var(--ss-text-dim)]">{body}</p>
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'ss-chip ss-chip-amber',
    accepted: 'ss-chip ss-chip-mint',
    scheduled: 'ss-chip ss-chip-teach',
    completed: 'ss-chip ss-chip-mint',
    rejected: 'ss-chip ss-chip-learn',
    cancelled: 'ss-chip',
  }
  return <span className={map[status] ?? 'ss-chip'}>{status}</span>
}

export function Toasts({
  toasts,
}: {
  toasts: { id: number; message: string; tone: 'success' | 'error' | 'info' }[]
}) {
  return (
    <div className="fixed bottom-20 right-3 z-[60] flex w-[calc(100%-1.5rem)] max-w-sm flex-col gap-2 sm:bottom-5 sm:right-5">
      {toasts.map((t) => {
        const accent =
          t.tone === 'success' ? 'var(--ss-mint)' : t.tone === 'error' ? 'var(--ss-pink)' : 'var(--ss-cyan)'
        return (
          <div
            key={t.id}
            className="ss-glass ss-anim-in rounded-xl px-4 py-3 text-sm"
            style={{ borderColor: accent, boxShadow: `0 14px 34px -18px ${accent}` }}
            role="status"
          >
            <span style={{ color: accent }} className="mr-2 font-bold">
              {t.tone === 'success' ? '✓' : t.tone === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.message}
          </div>
        )
      })}
    </div>
  )
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
