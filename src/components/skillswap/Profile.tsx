import { useState } from 'react'
import { Pencil, Plus, Trash2, UserRound } from 'lucide-react'
import { api } from '@/lib/api'
import { useMutation, useSkillSwap } from '@/lib/store'
import { Avatar, Modal, SectionHeader, SkillChip, Stars, formatDate } from './shared'

const LEVELS = ['beginner', 'intermediate', 'advanced']

export function Profile() {
  const { data } = useSkillSwap()
  const run = useMutation()

  const [editOpen, setEditOpen] = useState(false)
  const [bio, setBio] = useState('')
  const [year, setYear] = useState('')
  const [availability, setAvailability] = useState('')
  const [mode, setMode] = useState('flexible')

  const [addOpen, setAddOpen] = useState(false)
  const [newSkill, setNewSkill] = useState('')
  const [newKind, setNewKind] = useState<'teach' | 'learn'>('teach')
  const [newLevel, setNewLevel] = useState('intermediate')

  if (!data) return null
  const { me, skills, reviews, students, skillsCatalog } = data

  const mine = skills.filter((s) => s.studentId === me.id)
  const teaching = mine.filter((s) => s.kind === 'teach')
  const learning = mine.filter((s) => s.kind === 'learn')
  const received = reviews.filter((r) => r.revieweeId === me.id)

  function openEdit() {
    setBio(me.bio)
    setYear(me.year)
    setAvailability(me.availability)
    setMode(me.preferredMode)
    setEditOpen(true)
  }

  async function saveProfile() {
    const ok = await run(
      () => api.updateProfile(me.id, { bio, year, availability, preferredMode: mode }),
      'Profile updated',
    )
    if (ok) setEditOpen(false)
  }

  async function addSkill() {
    if (!newSkill.trim()) return
    const ok = await run(
      () =>
        api.addSkill({
          studentId: me.id,
          skillName: newSkill.trim(),
          kind: newKind,
          level: newLevel,
        }),
      'Skill added',
    )
    if (ok) {
      setAddOpen(false)
      setNewSkill('')
    }
  }

  return (
    <div>
      <SectionHeader title="Your profile" subtitle="Your student profile and learning journey" />

      <div
        className="ss-card ss-anim-in mb-5 overflow-hidden p-5 sm:p-6"
        style={{ background: 'linear-gradient(135deg, rgba(139,108,255,0.16), rgba(86,217,255,0.05) 60%, transparent)' }}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar initials={me.initials} name={me.name} size={64} />
            <div className="min-w-0">
              <h3 className="text-xl font-bold">{me.name}</h3>
              <p className="text-sm text-[var(--ss-text-dim)]">
                {me.campus} · {me.year}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <Stars value={me.rating} size={12} />
                <span className="text-xs text-[var(--ss-text-mute)]">
                  {me.reviewCount > 0 ? `${me.rating.toFixed(1)} · ${me.reviewCount} reviews` : 'No reviews yet'}
                </span>
              </div>
            </div>
          </div>
          <button className="ss-btn ss-btn-sm shrink-0" onClick={openEdit}>
            <Pencil size={13} /> Edit profile
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[var(--ss-text-dim)]">
          {me.bio || 'No bio yet — add one so matches know who they are swapping with.'}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Credits', me.credits],
            ['Sessions', me.sessionsDone],
            ['Skills taught', teaching.length],
            ['Skills learning', learning.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl border border-[var(--ss-border)] bg-[rgba(7,11,24,0.45)] px-3 py-2">
              <p className="text-[0.62rem] uppercase tracking-wide text-[var(--ss-text-mute)]">{label}</p>
              <p className="text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 text-xs text-[var(--ss-text-mute)]">
          <span>Availability: {me.availability || 'not set'}</span>
          <span>Mode: {me.preferredMode}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="ss-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
              I can teach
            </p>
            <button
              className="ss-btn ss-btn-sm ss-btn-ghost"
              onClick={() => {
                setNewKind('teach')
                setNewLevel('advanced')
                setAddOpen(true)
              }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {teaching.length === 0 ? (
              <p className="text-sm text-[var(--ss-text-dim)]">Nothing listed yet.</p>
            ) : (
              teaching.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <SkillChip skill={s.skillName} level={s.level} kind="teach" />
                  <button
                    className="ss-btn ss-btn-sm ss-btn-ghost !px-1.5"
                    onClick={() => run(() => api.removeSkill(s.id), 'Skill removed')}
                    aria-label={`Remove ${s.skillName}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="ss-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
              I want to learn
            </p>
            <button
              className="ss-btn ss-btn-sm ss-btn-ghost"
              onClick={() => {
                setNewKind('learn')
                setNewLevel('beginner')
                setAddOpen(true)
              }}
            >
              <Plus size={12} /> Add
            </button>
          </div>
          <div className="mt-3 space-y-2">
            {learning.length === 0 ? (
              <p className="text-sm text-[var(--ss-text-dim)]">Nothing listed yet.</p>
            ) : (
              learning.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-2">
                  <SkillChip skill={s.skillName} level={s.level} kind="learn" />
                  <button
                    className="ss-btn ss-btn-sm ss-btn-ghost !px-1.5"
                    onClick={() => run(() => api.removeSkill(s.id), 'Skill removed')}
                    aria-label={`Remove ${s.skillName}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="ss-card mt-4 p-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
          Reviews received
        </p>
        {received.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ss-text-dim)]">
            No reviews yet. Teach a session and ask your partner for feedback.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {received.map((r) => {
              const reviewer = students.find((s) => s.id === r.reviewerId)
              const avg = (r.communication + r.knowledge + r.reliability + r.quality) / 4
              return (
                <div key={r.id} className="border-b border-[var(--ss-border)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Avatar initials={reviewer?.initials ?? '??'} name={reviewer?.name} size={26} />
                    <p className="text-sm font-medium">{reviewer?.name ?? 'Student'}</p>
                    <Stars value={avg} size={11} />
                    <span className="ml-auto text-[0.68rem] text-[var(--ss-text-mute)]">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  {r.comment ? (
                    <p className="mt-1.5 text-sm text-[var(--ss-text-dim)]">“{r.comment}”</p>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit profile"
        footer={
          <>
            <button className="ss-btn ss-btn-ghost" onClick={() => setEditOpen(false)}>
              ✕ Cancel
            </button>
            <button className="ss-btn ss-btn-primary" onClick={saveProfile}>
              ✓ Save
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="ss-label" htmlFor="bio">
              Bio
            </label>
            <textarea id="bio" className="ss-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="ss-label" htmlFor="year">
                Year
              </label>
              <input id="year" className="ss-input" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div>
              <label className="ss-label" htmlFor="pref-mode">
                Preferred mode
              </label>
              <select
                id="pref-mode"
                className="ss-select"
                value={mode}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="online">Online</option>
                <option value="offline">On campus</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>
          <div>
            <label className="ss-label" htmlFor="avail">
              Availability
            </label>
            <input
              id="avail"
              className="ss-input"
              placeholder="Mon 18:00-20:00, Sat 10:00-13:00"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            />
            <p className="mt-1.5 text-xs text-[var(--ss-text-mute)]">
              Comma-separated. Format: <code>Day HH:MM-HH:MM</code>
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={newKind === 'teach' ? 'Add a skill you teach' : 'Add a skill to learn'}
        footer={
          <>
            <button className="ss-btn ss-btn-ghost" onClick={() => setAddOpen(false)}>
              ✕ Cancel
            </button>
            <button className="ss-btn ss-btn-primary" onClick={addSkill} disabled={!newSkill.trim()}>
              ✓ Add skill
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="ss-label" htmlFor="skill-name">
              Skill name
            </label>
            <input
              id="skill-name"
              className="ss-input"
              list="skill-catalog"
              placeholder="e.g. Python, Photography, Finance…"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <datalist id="skill-catalog">
              {skillsCatalog.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="ss-label" htmlFor="skill-level">
              Level
            </label>
            <select
              id="skill-level"
              className="ss-select"
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[var(--ss-text-mute)]">
            <UserRound size={11} /> Adding a skill to learn starts tracking your progress automatically.
          </p>
        </div>
      </Modal>
    </div>
  )
}
