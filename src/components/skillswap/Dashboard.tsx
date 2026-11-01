import {
  Sparkles,
  CalendarDays,
  Coins,
  Star,
  ArrowRight,
  Inbox,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useSkillSwap } from '@/lib/store'
import type { TabId } from '@/lib/nav'
import {
  Avatar,
  SectionHeader,
  StatCard,
  StatusBadge,
  SkillChip,
  formatDateTime,
  timeAgo,
} from './shared'

export function Dashboard({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data } = useSkillSwap()
  if (!data) return null

  const { me, matches, requests, sessions, notifications, progress } = data

  const top = matches[0]
  const pendingIncoming = requests.filter((r) => r.toId === me.id && r.status === 'pending')
  const accepted = requests.filter((r) => r.status === 'accepted')
  const upcoming = sessions
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))

  const mySkills = data.skills.filter((s) => s.studentId === me.id)
  const teaching = mySkills.filter((s) => s.kind === 'teach')
  const learning = mySkills.filter((s) => s.kind === 'learn')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="space-y-6">
      <div className="ss-anim-in">
        <p className="text-sm text-[var(--ss-text-dim)]">{greeting},</p>
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span className="ss-gradient-text">{me.name.split(' ')[0]}</span>
          <span className="text-[var(--ss-text)]"> — ready to swap?</span>
        </h1>
        <p className="mt-1.5 text-sm text-[var(--ss-text-dim)]">
          {matches.length > 0
            ? `${matches.length} ${matches.length === 1 ? 'student matches' : 'students match'} what you want to learn.`
            : 'Add a skill you want to learn to start matching.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Learning credits"
          value={me.credits}
          hint="Earned by teaching"
          accent="var(--ss-violet)"
          icon={<Coins size={17} />}
        />
        <StatCard
          label="Sessions done"
          value={me.sessionsDone}
          hint={`${upcoming.length} upcoming`}
          accent="var(--ss-cyan)"
          icon={<CalendarDays size={17} />}
        />
        <StatCard
          label="Peer rating"
          value={me.reviewCount > 0 ? me.rating.toFixed(1) : '—'}
          hint={`${me.reviewCount} reviews`}
          accent="var(--ss-amber)"
          icon={<Star size={17} />}
        />
        <StatCard
          label="Open requests"
          value={requests.filter((r) => r.status === 'pending').length}
          hint={`${accepted.length} active swaps`}
          accent="var(--ss-mint)"
          icon={<Inbox size={17} />}
        />
      </div>

      {top ? (
        <div
          className="ss-card ss-anim-in overflow-hidden p-5 sm:p-6"
          style={{
            background:
              'linear-gradient(135deg, rgba(139,108,255,0.16), rgba(86,217,255,0.06) 55%, transparent)',
            borderColor: 'var(--ss-border-strong)',
          }}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <span className="ss-chip ss-chip-mint">
                <Sparkles size={11} /> {top.mutual ? 'Two-way match' : 'Best match today'}
              </span>
              <div className="mt-3 flex items-center gap-3">
                <Avatar initials={top.student.initials} name={top.student.name} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold">{top.student.name}</p>
                  <p className="text-xs text-[var(--ss-text-dim)]">
                    {top.student.campus} · {top.student.year}
                  </p>
                </div>
              </div>
              <p className="mt-3 max-w-md text-sm text-[var(--ss-text-dim)]">{top.reasons[0]}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {top.teachesYou.map((t) => (
                  <SkillChip key={t.skill} skill={t.skill} level={t.level} kind="teach" />
                ))}
                {top.learnsFromYou.map((t) => (
                  <SkillChip key={t.skill} skill={t.skill} level={t.level} kind="learn" />
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
              <div className="text-right">
                <p className="text-4xl font-extrabold leading-none ss-gradient-text">{top.score}%</p>
                <p className="mt-1 text-xs text-[var(--ss-text-mute)]">match score</p>
              </div>
              <button className="ss-btn ss-btn-primary" onClick={() => onNavigate('matches')}>
                View all matches <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <section>
          <SectionHeader
            title="Needs your reply"
            subtitle={
              pendingIncoming.length > 0
                ? `${pendingIncoming.length} request${pendingIncoming.length === 1 ? '' : 's'} waiting`
                : 'Nothing waiting on you'
            }
            action={
              <button className="ss-btn ss-btn-sm ss-btn-ghost" onClick={() => onNavigate('requests')}>
                Open
              </button>
            }
          />
          {pendingIncoming.length === 0 ? (
            <div className="ss-card px-5 py-8 text-center text-sm text-[var(--ss-text-dim)]">
              You're all caught up. Browse matches to send a request.
            </div>
          ) : (
            <div className="space-y-2.5">
              {pendingIncoming.slice(0, 3).map((r) => {
                const from = data.students.find((s) => s.id === r.fromId)
                return (
                  <div key={r.id} className="ss-card ss-card-hover flex items-center gap-3 p-3.5">
                    <Avatar initials={from?.initials ?? '??'} name={from?.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{from?.name ?? 'Student'}</p>
                      <p className="truncate text-xs text-[var(--ss-text-dim)]">
                        {r.teachSkill} <span className="opacity-50">for</span> {r.learnSkill}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <SectionHeader
            title="Upcoming sessions"
            subtitle={upcoming.length > 0 ? `${upcoming.length} scheduled` : 'Nothing booked yet'}
            action={
              <button className="ss-btn ss-btn-sm ss-btn-ghost" onClick={() => onNavigate('sessions')}>
                View
              </button>
            }
          />
          {upcoming.length === 0 ? (
            <div className="ss-card px-5 py-8 text-center text-sm text-[var(--ss-text-dim)]">
              Accept a request, then schedule your first session.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcoming.slice(0, 3).map((s) => {
                const other = data.students.find(
                  (st) => st.id === (s.teacherId === me.id ? s.learnerId : s.teacherId),
                )
                return (
                  <div key={s.id} className="ss-card ss-card-hover flex items-center gap-3 p-3.5">
                    <div
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                      style={{ background: 'rgba(86,217,255,0.12)', color: 'var(--ss-cyan)' }}
                    >
                      <CalendarDays size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{s.skill}</p>
                      <p className="truncate text-xs text-[var(--ss-text-dim)]">
                        {other?.name ?? 'Student'} · {formatDateTime(s.scheduledAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="ss-card p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            You teach
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {teaching.length === 0 ? (
              <p className="text-sm text-[var(--ss-text-dim)]">No skills listed yet.</p>
            ) : (
              teaching.map((s) => (
                <SkillChip key={s.id} skill={s.skillName} level={s.level} kind="teach" />
              ))
            )}
          </div>
        </div>

        <div className="ss-card p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            You want to learn
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {learning.length === 0 ? (
              <p className="text-sm text-[var(--ss-text-dim)]">Nothing on your list yet.</p>
            ) : (
              learning.map((s) => (
                <SkillChip key={s.id} skill={s.skillName} level={s.level} kind="learn" />
              ))
            )}
          </div>
          {progress.length > 0 ? (
            <div className="mt-4 space-y-2 border-t border-[var(--ss-border)] pt-3">
              {progress.slice(0, 2).map((p) => (
                <div key={p.id}>
                  <div className="flex justify-between text-[0.72rem] text-[var(--ss-text-dim)]">
                    <span>{p.skill}</span>
                    <span>{p.sessions} sessions</span>
                  </div>
                  <div className="ss-progress-track mt-1">
                    <div
                      className="ss-progress-fill"
                      style={{ width: `${Math.min(100, p.sessions * 12)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="ss-card p-5">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
            Recent activity
          </p>
          <div className="mt-3 space-y-2.5">
            {notifications.length === 0 ? (
              <p className="text-sm text-[var(--ss-text-dim)]">Nothing yet.</p>
            ) : (
              notifications.slice(0, 4).map((n) => (
                <div key={n.id} className="flex gap-2.5">
                  <span
                    className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg"
                    style={{ background: 'rgba(139,108,255,0.12)', color: 'var(--ss-violet)' }}
                  >
                    {n.type === 'message' ? <MessageSquare size={12} /> : n.type === 'credit' ? <Coins size={12} /> : <Inbox size={12} />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.8rem] font-medium">{n.title}</p>
                    <p className="truncate text-[0.7rem] text-[var(--ss-text-mute)]">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="ss-btn" onClick={() => onNavigate('skills')}>
          <Users size={15} /> Browse skill board
        </button>
        <button className="ss-btn" onClick={() => onNavigate('progress')}>
          <TrendingUp size={15} /> Track progress
        </button>
        <button className="ss-btn" onClick={() => onNavigate('leaderboard')}>
          <Star size={15} /> Campus contributors
        </button>
      </div>
    </div>
  )
}
