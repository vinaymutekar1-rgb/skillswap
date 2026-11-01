import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, Clock, Inbox, X } from 'lucide-react'
import { api } from '@/lib/api'
import { useMutation, useSkillSwap } from '@/lib/store'
import type { TabId } from '@/lib/nav'
import { Avatar, EmptyState, SectionHeader, StatusBadge, timeAgo } from './shared'

type Filter = 'incoming' | 'outgoing' | 'active'

export function Requests({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { data } = useSkillSwap()
  const run = useMutation()
  const [filter, setFilter] = useState<Filter>('incoming')
  const [busyId, setBusyId] = useState<string | null>(null)

  if (!data) return null
  const { me, requests, students } = data

  const incoming = requests.filter((r) => r.toId === me.id)
  const outgoing = requests.filter((r) => r.fromId === me.id)
  const active = requests.filter((r) => r.status === 'accepted')

  const list = filter === 'incoming' ? incoming : filter === 'outgoing' ? outgoing : active

  const pendingCount = incoming.filter((r) => r.status === 'pending').length

  async function update(id: string, status: string, message: string) {
    setBusyId(id)
    await run(() => api.updateRequest(id, status), message)
    setBusyId(null)
  }

  return (
    <div>
      <SectionHeader
        title="Exchange requests"
        subtitle="Accept a swap to unlock chat and scheduling"
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {(
          [
            ['incoming', `Incoming${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
            ['outgoing', 'Sent'],
            ['active', `Active${active.length > 0 ? ` (${active.length})` : ''}`],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={filter === key ? 'ss-btn ss-btn-primary ss-btn-sm' : 'ss-btn ss-btn-sm'}
            onClick={() => setFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Inbox size={20} />}
          title={filter === 'incoming' ? 'No incoming requests' : filter === 'outgoing' ? 'You haven’t sent any' : 'No active swaps'}
          body={
            filter === 'outgoing'
              ? 'Head to Matches and send your first swap request.'
              : filter === 'active'
                ? 'Accepted requests show up here so you can chat and book sessions.'
                : 'When someone wants to swap skills with you, it lands here.'
          }
          action={
            filter === 'outgoing' ? (
              <button className="ss-btn ss-btn-sm" onClick={() => onNavigate('matches')}>
                Browse matches
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-2.5">
          {list.map((r) => {
            const isIncoming = r.toId === me.id
            const other = students.find((s) => s.id === (isIncoming ? r.fromId : r.toId))
            const busy = busyId === r.id

            return (
              <div key={r.id} className="ss-card ss-card-hover ss-anim-in p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar initials={other?.initials ?? '??'} name={other?.name} size={42} />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{other?.name ?? 'Student'}</p>
                        <StatusBadge status={r.status} />
                        <span className="ss-chip !px-1.5 !py-0 !text-[0.62rem]">
                          {isIncoming ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                          {isIncoming ? 'incoming' : 'sent'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[var(--ss-text-dim)]">
                        <span className="font-medium text-[var(--ss-cyan)]">{r.teachSkill}</span>
                        <span className="mx-1.5 opacity-50">⇄</span>
                        <span className="font-medium text-[var(--ss-pink)]">{r.learnSkill}</span>
                      </p>
                      {r.message ? (
                        <p className="mt-1.5 line-clamp-2 text-xs italic text-[var(--ss-text-mute)]">
                          “{r.message}”
                        </p>
                      ) : null}
                      <p className="mt-1.5 flex items-center gap-1 text-[0.7rem] text-[var(--ss-text-mute)]">
                        <Clock size={10} /> {timeAgo(r.createdAt)} · {r.matchScore}% match
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {isIncoming && r.status === 'pending' ? (
                      <>
                        <button
                          className="ss-btn ss-btn-success ss-btn-sm"
                          disabled={busy}
                          onClick={() => update(r.id, 'accepted', 'Request accepted')}
                        >
                          <Check size={13} /> Accept
                        </button>
                        <button
                          className="ss-btn ss-btn-danger ss-btn-sm"
                          disabled={busy}
                          onClick={() => update(r.id, 'rejected', 'Request declined')}
                        >
                          <X size={13} /> Decline
                        </button>
                      </>
                    ) : null}

                    {!isIncoming && r.status === 'pending' ? (
                      <button
                        className="ss-btn ss-btn-sm"
                        disabled={busy}
                        onClick={() => update(r.id, 'cancelled', 'Request withdrawn')}
                      >
                        <X size={13} /> Withdraw
                      </button>
                    ) : null}

                    {r.status === 'accepted' ? (
                      <>
                        <button className="ss-btn ss-btn-primary ss-btn-sm" onClick={() => onNavigate('messages')}>
                          💬 Chat
                        </button>
                        <button className="ss-btn ss-btn-sm" onClick={() => onNavigate('sessions')}>
                          📅 Schedule
                        </button>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
