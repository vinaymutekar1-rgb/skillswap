import { useEffect, useMemo, useState } from 'react'
import { Sparkles, Search, Send, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { useMutation, useSkillSwap } from '@/lib/store'
import type { Match } from '@/lib/types'
import { Avatar, EmptyState, Modal, SectionHeader, SkillChip, Stars } from './shared'

export function Matches({
  focusId,
  onFocusHandled,
}: {
  focusId?: string | null
  onFocusHandled?: () => void
} = {}) {
  const { data, me } = useActive()
  const run = useMutation()
  const [query, setQuery] = useState('')
  const [mutualOnly, setMutualOnly] = useState(false)
  const [selected, setSelected] = useState<Match | null>(null)
  const [teachSkill, setTeachSkill] = useState('')
  const [learnSkill, setLearnSkill] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)

  const matches = useMemo(() => {
    if (!data) return []
    return data.matches.filter((m) => {
      if (mutualOnly && !m.mutual) return false
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return (
        m.student.name.toLowerCase().includes(q) ||
        m.student.campus.toLowerCase().includes(q) ||
        m.teachesYou.some((t) => t.skill.toLowerCase().includes(q))
      )
    })
  }, [data, query, mutualOnly])

  function openRequest(match: Match) {
    setSelected(match)
    setTeachSkill(match.learnsFromYou[0]?.skill ?? '')
    setLearnSkill(match.teachesYou[0]?.skill ?? '')
    setNote('')
  }

  async function submit() {
    if (!selected || !teachSkill || !learnSkill) return
    setSending(true)
    const ok = await run(
      () =>
        api.createRequest({
          fromId: me.id,
          toId: selected.student.id,
          teachSkill,
          learnSkill,
          message: note,
        }),
      'Request sent',
    )
    setSending(false)
    if (ok) setSelected(null)
  }

  const myTeachSkills = data?.skills.filter((s) => s.studentId === me.id && s.kind === 'teach') ?? []

  // Deep link from the skill board: open the request composer for that student.
  useEffect(() => {
    if (!focusId || !data) return
    const match = data.matches.find((m) => m.student.id === focusId)
    if (match) {
      setSelected(match)
      setTeachSkill(match.learnsFromYou[0]?.skill ?? '')
      setLearnSkill(match.teachesYou[0]?.skill ?? '')
      setNote('')
    }
    onFocusHandled?.()
  }, [focusId, data, onFocusHandled])

  return (
    <div>
      <SectionHeader
        title="Smart matches"
        subtitle="Ranked by mutual exchange, level fit, availability and reputation"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ss-text-mute)]"
          />
          <input
            className="ss-input pl-9"
            placeholder="Search by name, campus or skill…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className={mutualOnly ? 'ss-btn ss-btn-primary' : 'ss-btn'}
          onClick={() => setMutualOnly((v) => !v)}
        >
          <Sparkles size={14} /> Two-way only
        </button>
      </div>

      {matches.length === 0 ? (
        <EmptyState
          icon={<Users size={20} />}
          title="No matches yet"
          body="Add a skill you want to learn on your profile — matches appear as soon as someone on campus can teach it."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {matches.map((m) => (
            <div key={m.student.id} className="ss-card ss-card-hover ss-anim-in p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Avatar initials={m.student.initials} name={m.student.name} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{m.student.name}</p>
                      <p className="truncate text-xs text-[var(--ss-text-dim)]">
                        {m.student.campus} · {m.student.year}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="ss-gradient-text text-xl font-extrabold leading-none">
                        {m.score}%
                      </p>
                      {m.mutual ? (
                        <span className="ss-chip ss-chip-mint mt-1 !px-1.5 !py-0 !text-[0.6rem]">
                          two-way
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <Stars value={m.student.rating} size={11} />
                    <span className="text-[0.7rem] text-[var(--ss-text-mute)]">
                      {m.student.reviewCount > 0 ? m.student.rating.toFixed(1) : 'new'} ·{' '}
                      {m.student.sessionsDone} sessions
                    </span>
                  </div>
                </div>
              </div>

              <p className="mt-3 text-[0.8rem] text-[var(--ss-text-dim)]">{m.reasons[0]}</p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {m.teachesYou.map((t) => (
                  <SkillChip key={t.skill} skill={t.skill} level={t.level} kind="teach" />
                ))}
                {m.learnsFromYou.map((t) => (
                  <SkillChip key={t.skill} skill={t.skill} level={t.level} kind="learn" />
                ))}
              </div>

              <button className="ss-btn ss-btn-primary ss-btn-sm mt-3.5 w-full" onClick={() => openRequest(m)}>
                <Send size={13} /> Request swap
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={`Request a swap with ${selected?.student.name ?? ''}`}
        footer={
          <>
            <button className="ss-btn ss-btn-ghost" onClick={() => setSelected(null)}>
              ✕ Cancel
            </button>
            <button
              className="ss-btn ss-btn-primary"
              onClick={submit}
              disabled={sending || !teachSkill || !learnSkill}
            >
              {sending ? 'Sending…' : '→ Send request'}
            </button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-4">
            <div>
              <label className="ss-label" htmlFor="learn-skill">
                You want to learn
              </label>
              <select
                id="learn-skill"
                className="ss-select"
                value={learnSkill}
                onChange={(e) => setLearnSkill(e.target.value)}
              >
                {selected.teachesYou.map((t) => (
                  <option key={t.skill} value={t.skill}>
                    {t.skill} ({t.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="ss-label" htmlFor="teach-skill">
                You will teach
              </label>
              <select
                id="teach-skill"
                className="ss-select"
                value={teachSkill}
                onChange={(e) => setTeachSkill(e.target.value)}
              >
                <option value="">— pick one of your skills —</option>
                {selected.learnsFromYou.length > 0
                  ? selected.learnsFromYou.map((t) => (
                      <option key={t.skill} value={t.skill}>
                        {t.skill} (they want this)
                      </option>
                    ))
                  : myTeachSkills.map((s) => (
                      <option key={s.id} value={s.skillName}>
                        {s.skillName}
                      </option>
                    ))}
              </select>
              {selected.learnsFromYou.length === 0 ? (
                <p className="mt-1.5 text-xs text-[var(--ss-text-mute)]">
                  They haven't listed anything you teach — this would be a one-way exchange, so
                  pick a skill you're happy to give.
                </p>
              ) : null}
            </div>

            <div>
              <label className="ss-label" htmlFor="note">
                Message (optional)
              </label>
              <textarea
                id="note"
                className="ss-textarea"
                placeholder="Introduce yourself and suggest a time…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}

/** Narrow accessor so the component reads naturally without optional chaining everywhere. */
function useActive() {
  const { data } = useSkillSwap()
  if (!data) throw new Error('Matches rendered before data loaded')
  return { data, me: data.me }
}
