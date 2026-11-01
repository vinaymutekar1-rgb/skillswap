import { useMemo, useState } from 'react'
import { LayoutGrid, Search, UserPlus } from 'lucide-react'
import { useSkillSwap } from '@/lib/store'
import { Avatar, EmptyState, SectionHeader, SkillChip } from './shared'

export function SkillBoard({ onRequest }: { onRequest: (studentId: string) => void }) {
  const { data } = useSkillSwap()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(() => {
    if (!data) return ['All']
    return ['All', ...Array.from(new Set(data.skillsCatalog.map((s) => s.category))).sort()]
  }, [data])

  const categoryOf = useMemo(() => {
    const map = new Map<string, string>()
    data?.skillsCatalog.forEach((s) => map.set(s.name, s.category))
    return map
  }, [data])

  const listings = useMemo(() => {
    if (!data) return []
    return data.students
      .filter((s) => s.id !== data.me.id)
      .map((student) => {
        const teaches = data.skills.filter((sk) => sk.studentId === student.id && sk.kind === 'teach')
        const learns = data.skills.filter((sk) => sk.studentId === student.id && sk.kind === 'learn')
        return { student, teaches, learns }
      })
      .filter((row) => {
        if (row.teaches.length === 0) return false
        if (category !== 'All') {
          const hasCategory = row.teaches.some((t) => categoryOf.get(t.skillName) === category)
          if (!hasCategory) return false
        }
        if (!query.trim()) return true
        const q = query.toLowerCase()
        return (
          row.student.name.toLowerCase().includes(q) ||
          row.student.campus.toLowerCase().includes(q) ||
          row.teaches.some((t) => t.skillName.toLowerCase().includes(q))
        )
      })
      .sort((a, b) => b.teaches.length - a.teaches.length)
  }, [data, query, category, categoryOf])

  return (
    <div>
      <SectionHeader
        title="Skill board"
        subtitle="Everyone on campus who is teaching right now"
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ss-text-mute)]"
          />
          <input
            className="ss-input pl-9"
            placeholder="Find a skill or a person…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="ss-select sm:w-52" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          icon={<LayoutGrid size={20} />}
          title="Nothing here yet"
          body="No students match that filter. Try a different skill or clear your search."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {listings.map(({ student, teaches, learns }) => (
            <div key={student.id} className="ss-card ss-card-hover ss-anim-in flex flex-col p-4">
              <div className="flex items-center gap-3">
                <Avatar initials={student.initials} name={student.name} size={42} />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{student.name}</p>
                  <p className="truncate text-xs text-[var(--ss-text-dim)]">
                    {student.campus} · {student.year}
                  </p>
                </div>
              </div>

              <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-[var(--ss-text-dim)]">
                {student.bio || 'No bio yet.'}
              </p>

              <div className="mt-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
                  Teaches
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {teaches.map((t) => (
                    <SkillChip key={t.id} skill={t.skillName} level={t.level} kind="teach" />
                  ))}
                </div>
              </div>

              {learns.length > 0 ? (
                <div className="mt-2.5">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.09em] text-[var(--ss-text-mute)]">
                    Wants
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {learns.map((t) => (
                      <SkillChip key={t.id} skill={t.skillName} kind="learn" />
                    ))}
                  </div>
                </div>
              ) : null}

              <button
                className="ss-btn ss-btn-primary ss-btn-sm mt-3.5 w-full"
                onClick={() => onRequest(student.id)}
              >
                <UserPlus size={13} /> Request
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
