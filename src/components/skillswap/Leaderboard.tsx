import { Crown, Medal, Trophy } from 'lucide-react'
import { useSkillSwap } from '@/lib/store'
import { Avatar, SectionHeader, Stars } from './shared'

export function Leaderboard() {
  const { data } = useSkillSwap()
  if (!data) return null

  const { leaderboard, me } = data
  const top = leaderboard.slice(0, 3)
  const rest = leaderboard.slice(3)

  return (
    <div>
      <SectionHeader
        title="Campus contributors"
        subtitle="Students who have given the most time to teaching"
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {top.map((row) => {
          const isMe = row.id === me.id
          const medals = ['var(--ss-amber)', '#c9d3e6', '#d79a6a']
          const icons = [Crown, Medal, Trophy]
          const Icon = icons[row.rank - 1] ?? Medal
          return (
            <div
              key={row.id}
              className="ss-card ss-card-hover ss-anim-in p-4 text-center"
              style={
                isMe
                  ? { borderColor: 'var(--ss-border-strong)', background: 'linear-gradient(180deg, rgba(139,108,255,0.16), var(--ss-surface))' }
                  : undefined
              }
            >
              <div className="flex justify-center">
                <Icon size={20} style={{ color: medals[row.rank - 1] }} />
              </div>
              <div className="mt-2 flex justify-center">
                <Avatar initials={row.initials} name={row.name} size={52} />
              </div>
              <p className="mt-2 truncate font-bold">{row.name}</p>
              <p className="truncate text-xs text-[var(--ss-text-dim)]">{row.campus}</p>
              <p className="ss-gradient-text mt-2 text-2xl font-extrabold">{row.credits}</p>
              <p className="text-[0.68rem] uppercase tracking-wide text-[var(--ss-text-mute)]">credits</p>
              <div className="mt-2 flex items-center justify-center gap-1.5">
                <Stars value={row.rating} size={11} />
                <span className="text-[0.7rem] text-[var(--ss-text-mute)]">
                  {row.reviewCount > 0 ? row.rating.toFixed(1) : 'new'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="ss-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--ss-border)] px-4 py-2.5 text-[0.68rem] font-semibold uppercase tracking-[0.08em] text-[var(--ss-text-mute)]">
          <span>Rank & student</span>
          <span className="flex gap-6">
            <span className="hidden sm:inline">Sessions</span>
            <span>Credits</span>
          </span>
        </div>
        {[...top, ...rest].map((row) => {
          const isMe = row.id === me.id
          return (
            <div
              key={row.id}
              className="flex items-center justify-between gap-3 border-b border-[var(--ss-border)] px-4 py-3 last:border-0"
              style={isMe ? { background: 'rgba(139,108,255,0.09)' } : undefined}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="w-5 shrink-0 text-center text-sm font-bold text-[var(--ss-text-mute)]">
                  {row.rank}
                </span>
                <Avatar initials={row.initials} name={row.name} size={34} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {row.name}
                    {isMe ? <span className="ml-1.5 text-[0.65rem] text-[var(--ss-violet)]">(you)</span> : null}
                  </p>
                  <p className="truncate text-[0.7rem] text-[var(--ss-text-mute)]">
                    {row.campus} · {row.year}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6 text-sm">
                <span className="hidden w-14 text-right text-[var(--ss-text-dim)] sm:inline">
                  {row.sessionsDone}
                </span>
                <span className="w-14 text-right font-bold text-[var(--ss-cyan)]">{row.credits}</span>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-center text-xs text-[var(--ss-text-mute)]">
        Credits reflect completed teaching sessions across campus.
      </p>
    </div>
  )
}
