import { useMemo } from 'react'
import { Coins, TrendingUp, Award, Clock } from 'lucide-react'
import { useSkillSwap } from '@/lib/store'
import { EmptyState, SectionHeader, StatCard, formatDate } from './shared'

const CREDITS_PER_30MIN = 5

export function Credits() {
  const { data } = useSkillSwap()

  const earned = useMemo(
    () => data?.sessions.filter((s) => s.status === 'completed' && s.teacherId === data.me.id) ?? [],
    [data],
  )
  const spent = useMemo(
    () => data?.sessions.filter((s) => s.status === 'completed' && s.learnerId === data.me.id) ?? [],
    [data],
  )
  const scheduled = useMemo(
    () => data?.sessions.filter((s) => s.status === 'scheduled' && s.teacherId === data.me.id) ?? [],
    [data],
  )

  if (!data) return null
  const { me, students } = data

  const totalEarned = earned.reduce((sum, s) => sum + s.creditsAwarded, 0)
  const pending = scheduled.reduce(
    (sum, s) => sum + Math.round((s.durationMin / 30) * CREDITS_PER_30MIN),
    0,
  )
  const hoursTaught = earned.reduce((sum, s) => sum + s.durationMin, 0) / 60

  return (
    <div>
      <SectionHeader
        title="Learning energy"
        subtitle="Credits you earn by teaching — spend them on sessions you attend"
      />

      <div className="ss-card ss-anim-in mb-4 overflow-hidden p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(139,108,255,0.18), rgba(86,217,255,0.06) 60%, transparent)', borderColor: 'var(--ss-border-strong)' }}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
              Current balance
            </p>
            <p className="ss-gradient-text mt-1 text-5xl font-extrabold leading-none">{me.credits}</p>
            <p className="mt-2 text-sm text-[var(--ss-text-dim)]">
              {pending > 0 ? `+${pending} more once upcoming sessions complete` : 'No pending credits'}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="rounded-xl border border-[var(--ss-border)] bg-[rgba(7,11,24,0.5)] px-3.5 py-2.5">
              <p className="text-[0.65rem] uppercase tracking-wide text-[var(--ss-text-mute)]">Earned</p>
              <p className="text-lg font-bold text-[var(--ss-mint)]">{totalEarned}</p>
            </div>
            <div className="rounded-xl border border-[var(--ss-border)] bg-[rgba(7,11,24,0.5)] px-3.5 py-2.5">
              <p className="text-[0.65rem] uppercase tracking-wide text-[var(--ss-text-mute)]">Hours taught</p>
              <p className="text-lg font-bold text-[var(--ss-cyan)]">{hoursTaught.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Sessions taught" value={earned.length} accent="var(--ss-violet)" icon={<Award size={16} />} />
        <StatCard label="Sessions attended" value={spent.length} accent="var(--ss-cyan)" icon={<TrendingUp size={16} />} />
        <StatCard label="Scheduled" value={scheduled.length} accent="var(--ss-amber)" icon={<Clock size={16} />} />
        <StatCard
          label="Per 30 min"
          value={CREDITS_PER_30MIN}
          hint="awarded on completion"
          accent="var(--ss-mint)"
          icon={<Coins size={16} />}
        />
      </div>

      <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--ss-text-mute)]">
        Credit history
      </h3>

      {earned.length === 0 ? (
        <EmptyState
          icon={<Coins size={20} />}
          title="No credits earned yet"
          body="Complete a session as the teacher and the credits land here automatically."
        />
      ) : (
        <div className="ss-card divide-y divide-[var(--ss-border)]">
          {earned
            .slice()
            .reverse()
            .map((s) => {
              const learner = students.find((st) => st.id === s.learnerId)
              return (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.skill}</p>
                    <p className="truncate text-xs text-[var(--ss-text-dim)]">
                      taught {learner?.name ?? 'a student'} · {formatDate(s.scheduledAt)}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-[var(--ss-mint)]">
                    +{s.creditsAwarded}
                  </span>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
