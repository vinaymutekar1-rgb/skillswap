import { useMemo } from 'react'
import { Award, Target, TrendingUp } from 'lucide-react'
import { useSkillSwap } from '@/lib/store'
import { EmptyState, SectionHeader, SkillChip } from './shared'

const MILESTONES = [1, 3, 5, 8, 12]

export function Progress() {
  const { data } = useSkillSwap()

  const entries = useMemo(() => {
    if (!data) return []
    return [...data.progress].sort((a, b) => b.sessions - a.sessions)
  }, [data])

  if (!data) return null
  const { me } = data
  const totalSessions = entries.reduce((sum, p) => sum + p.sessions, 0)
  const totalHours = entries.reduce((sum, p) => sum + p.hours, 0)
  const advanced = entries.filter((p) => p.level === 'advanced').length

  return (
    <div>
      <SectionHeader
        title="Learning progress"
        subtitle="Every completed session moves a skill forward"
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="ss-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            Skills tracked
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--ss-violet)]">{entries.length}</p>
        </div>
        <div className="ss-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            Sessions logged
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--ss-cyan)]">{totalSessions}</p>
        </div>
        <div className="ss-card p-4">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            Hours invested
          </p>
          <p className="mt-1 text-2xl font-bold text-[var(--ss-mint)]">{totalHours.toFixed(1)}</p>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={<Target size={20} />}
          title="No progress yet"
          body="Add a skill you want to learn, then complete a session with a mentor — progress starts tracking automatically."
        />
      ) : (
        <div className="space-y-3">
          {entries.map((p) => {
            const nextMilestone = MILESTONES.find((m) => m > p.sessions) ?? MILESTONES[MILESTONES.length - 1]
            const pct = Math.min(100, Math.round((p.sessions / nextMilestone) * 100))
            return (
              <div key={p.id} className="ss-card ss-anim-in p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{p.skill}</p>
                    <SkillChip skill={p.level} kind={p.level === 'advanced' ? 'teach' : 'learn'} />
                  </div>
                  <p className="text-xs text-[var(--ss-text-dim)]">
                    {p.sessions} {p.sessions === 1 ? 'session' : 'sessions'} · {p.hours.toFixed(1)}h
                  </p>
                </div>

                <div className="ss-progress-track mt-3">
                  <div className="ss-progress-fill" style={{ width: `${pct}%` }} />
                </div>

                <div className="mt-2 flex items-center justify-between text-[0.68rem] text-[var(--ss-text-mute)]">
                  <span>
                    {p.level === 'advanced'
                      ? 'Advanced — you can teach this'
                      : p.sessions >= nextMilestone - p.sessions
                        ? `${nextMilestone - p.sessions} more to next level`
                        : `${pct}% to ${nextMilestone} sessions`}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {p.level === 'advanced' ? <Award size={11} /> : <TrendingUp size={11} />}
                    {p.level}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {MILESTONES.map((m) => (
                    <span
                      key={m}
                      className={p.sessions >= m ? 'ss-chip ss-chip-mint' : 'ss-chip'}
                      style={p.sessions >= m ? undefined : { opacity: 0.45 }}
                    >
                      {p.sessions >= m ? '✓' : '○'} {m}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="ss-card mt-5 p-5">
        <p className="text-sm font-semibold">How levels work</p>
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--ss-text-dim)]">
          <li>• 1–2 sessions → <span className="text-[var(--ss-text)]">Beginner</span></li>
          <li>• 3–7 sessions → <span className="text-[var(--ss-text)]">Intermediate</span></li>
          <li>• 8+ sessions → <span className="text-[var(--ss-text)]">Advanced — eligible to teach</span></li>
        </ul>
      </div>
    </div>
  )
}
