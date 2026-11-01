import { useMemo, useState } from 'react'
import { CalendarDays, CheckCircle2, Clock, Star, Video, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useMutation, useSkillSwap } from '@/lib/store'
import { Avatar, EmptyState, Modal, SectionHeader, StatusBadge, formatDateTime } from './shared'

export function Sessions() {
  const { data } = useSkillSwap()
  const run = useMutation()

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [requestId, setRequestId] = useState('')
  const [when, setWhen] = useState('')
  const [duration, setDuration] = useState(60)
  const [mode, setMode] = useState('online')
  const [busy, setBusy] = useState<string | null>(null)

  const [reviewFor, setReviewFor] = useState<string | null>(null)
  const [scores, setScores] = useState({ communication: 5, knowledge: 5, reliability: 5, quality: 5 })
  const [comment, setComment] = useState('')

  const openRequests = useMemo(
    () => data?.requests.filter((r) => r.status === 'accepted') ?? [],
    [data],
  )

  const reviewedSessionIds = useMemo(
    () => new Set(data?.reviews.map((r) => r.sessionId) ?? []),
    [data],
  )

  if (!data) return null
  const { me, students, sessions } = data

  const upcoming = sessions
    .filter((s) => s.status === 'scheduled')
    .sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt))
  const past = sessions
    .filter((s) => s.status !== 'scheduled')
    .sort((a, b) => +new Date(b.scheduledAt) - +new Date(a.scheduledAt))

  function peerName(session: { teacherId: string; learnerId: string }) {
    const otherId = session.teacherId === me.id ? session.learnerId : session.teacherId
    return students.find((s) => s.id === otherId)
  }

  function roleOf(session: { teacherId: string }) {
    return session.teacherId === me.id ? 'Teaching' : 'Learning'
  }

  async function schedule() {
    const req = openRequests.find((r) => r.id === requestId)
    if (!req || !when) return
    const iAmFrom = req.fromId === me.id
    const teacherId = iAmFrom ? me.id : req.toId
    const learnerId = iAmFrom ? req.toId : me.id

    const ok = await run(
      () =>
        api.createSession({
          requestId: req.id,
          teacherId,
          learnerId,
          skill: req.teachSkill,
          scheduledAt: new Date(when).toISOString(),
          durationMin: duration,
          mode,
        }),
      'Session scheduled',
    )
    if (ok) {
      setScheduleOpen(false)
      setWhen('')
      setRequestId('')
    }
  }

  async function complete(id: string) {
    setBusy(id)
    await run(() => api.completeSession(id), 'Session completed — credits awarded')
    setBusy(null)
  }

  async function cancel(id: string) {
    setBusy(id)
    await run(() => api.cancelSession(id), 'Session cancelled')
    setBusy(null)
  }

  async function submitReview() {
    if (!reviewFor) return
    const ok = await run(
      () => api.createReview({ sessionId: reviewFor, reviewerId: me.id, ...scores, comment }),
      'Review submitted',
    )
    if (ok) {
      setReviewFor(null)
      setComment('')
      setScores({ communication: 5, knowledge: 5, reliability: 5, quality: 5 })
    }
  }

  function SessionCard({ session }: { session: (typeof sessions)[number] }) {
    const peer = peerName(session)
    const reviewed = reviewedSessionIds.has(session.id)
    return (
      <div className="ss-card ss-card-hover ss-anim-in p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Avatar initials={peer?.initials ?? '??'} name={peer?.name} size={42} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{session.skill}</p>
                <StatusBadge status={session.status} />
                <span className="ss-chip !px-1.5 !py-0 !text-[0.62rem]">{roleOf(session)}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-[var(--ss-text-dim)]">
                with {peer?.name ?? 'Student'} · {formatDateTime(session.scheduledAt)}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-[0.7rem] text-[var(--ss-text-mute)]">
                <span className="inline-flex items-center gap-1">
                  <Clock size={10} /> {session.durationMin} min
                </span>
                <span className="inline-flex items-center gap-1">
                  <Video size={10} /> {session.mode}
                </span>
                {session.creditsAwarded > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[var(--ss-mint)]">
                    +{session.creditsAwarded} credits
                  </span>
                ) : null}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-1.5">
            {session.status === 'scheduled' ? (
              <>
                <button
                  className="ss-btn ss-btn-success ss-btn-sm"
                  disabled={busy === session.id}
                  onClick={() => complete(session.id)}
                >
                  <CheckCircle2 size={13} /> Complete
                </button>
                <button
                  className="ss-btn ss-btn-danger ss-btn-sm"
                  disabled={busy === session.id}
                  onClick={() => cancel(session.id)}
                >
                  <X size={13} /> Cancel
                </button>
              </>
            ) : null}
            {session.status === 'completed' && !reviewed ? (
              <button className="ss-btn ss-btn-primary ss-btn-sm" onClick={() => setReviewFor(session.id)}>
                <Star size={13} /> Review
              </button>
            ) : null}
            {session.status === 'completed' && reviewed ? (
              <span className="ss-chip ss-chip-mint">★ reviewed</span>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SectionHeader
        title="Training sessions"
        subtitle="Book time with your matches, then earn credits on completion"
        action={
          <button
            className="ss-btn ss-btn-primary"
            onClick={() => setScheduleOpen(true)}
            disabled={openRequests.length === 0}
          >
            📅 Schedule session
          </button>
        }
      />

      {openRequests.length === 0 ? (
        <div className="mb-4 rounded-xl border border-[var(--ss-border)] bg-[rgba(139,108,255,0.06)] px-4 py-3 text-sm text-[var(--ss-text-dim)]">
          You need an accepted request before booking a session.
        </div>
      ) : null}

      <h3 className="mb-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--ss-text-mute)]">
        Upcoming ({upcoming.length})
      </h3>
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<CalendarDays size={20} />}
          title="No upcoming sessions"
          body="Schedule one with an accepted match to get on the calendar."
        />
      ) : (
        <div className="space-y-2.5">
          {upcoming.map((s) => (
            <SessionCard key={s.id} session={s} />
          ))}
        </div>
      )}

      {past.length > 0 ? (
        <>
          <h3 className="mb-2.5 mt-6 text-sm font-semibold uppercase tracking-[0.08em] text-[var(--ss-text-mute)]">
            History ({past.length})
          </h3>
          <div className="space-y-2.5">
            {past.map((s) => (
              <SessionCard key={s.id} session={s} />
            ))}
          </div>
        </>
      ) : null}

      <Modal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        title="Schedule a session"
        footer={
          <>
            <button className="ss-btn ss-btn-ghost" onClick={() => setScheduleOpen(false)}>
              ✕ Cancel
            </button>
            <button className="ss-btn ss-btn-primary" onClick={schedule} disabled={!requestId || !when}>
              📅 Confirm
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="ss-label" htmlFor="swap-select">
              Which swap?
            </label>
            <select
              id="swap-select"
              className="ss-select"
              value={requestId}
              onChange={(e) => setRequestId(e.target.value)}
            >
              <option value="">— pick an accepted swap —</option>
              {openRequests.map((r) => {
                const other = students.find((s) => s.id === (r.fromId === me.id ? r.toId : r.fromId))
                return (
                  <option key={r.id} value={r.id}>
                    {other?.name} · {r.teachSkill}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="ss-label" htmlFor="when">
                Date & time
              </label>
              <input
                id="when"
                type="datetime-local"
                className="ss-input"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
            <div>
              <label className="ss-label" htmlFor="duration">
                Duration
              </label>
              <select
                id="duration"
                className="ss-select"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={30}>30 min · 5 credits</option>
                <option value={60}>60 min · 10 credits</option>
                <option value={90}>90 min · 15 credits</option>
                <option value={120}>120 min · 20 credits</option>
              </select>
            </div>
          </div>

          <div>
            <label className="ss-label" htmlFor="mode">
              Mode
            </label>
            <select id="mode" className="ss-select" value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="online">Online</option>
              <option value="offline">On campus</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal
        open={reviewFor !== null}
        onClose={() => setReviewFor(null)}
        title="Rate this session"
        footer={
          <>
            <button className="ss-btn ss-btn-ghost" onClick={() => setReviewFor(null)}>
              ✕ Cancel
            </button>
            <button className="ss-btn ss-btn-primary" onClick={submitReview}>
              ⭐ Submit review
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          {(
            [
              ['communication', 'Communication'],
              ['knowledge', 'Knowledge'],
              ['reliability', 'Reliability'],
              ['quality', 'Session quality'],
            ] as [keyof typeof scores, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <div className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setScores((s) => ({ ...s, [key]: n }))}
                      aria-label={`${label} ${n}`}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        size={18}
                        style={{ color: n <= scores[key] ? 'var(--ss-amber)' : 'rgba(255,255,255,0.18)' }}
                        fill={n <= scores[key] ? 'var(--ss-amber)' : 'transparent'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div>
            <label className="ss-label" htmlFor="review-comment">
              Comment (optional)
            </label>
            <textarea
              id="review-comment"
              className="ss-textarea"
              placeholder="What went well?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
