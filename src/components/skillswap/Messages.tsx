import { useEffect, useMemo, useRef, useState } from 'react'
import { MessageSquare, Send } from 'lucide-react'
import { api } from '@/lib/api'
import { useMutation, useSkillSwap } from '@/lib/store'
import { Avatar, EmptyState, SectionHeader, timeAgo } from './shared'

export function Messages() {
  const { data } = useSkillSwap()
  const run = useMutation()
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // One thread per *active* swap. Completed history lives in Sessions — showing
  // it here produced duplicate threads with the same person.
  const threads = useMemo(() => {
    if (!data) return []
    return data.requests
      .filter((r) => r.status === 'accepted')
      .sort((a, b) => {
        const aMsg = data.messages.filter((m) => m.requestId === a.id).at(-1)
        const bMsg = data.messages.filter((m) => m.requestId === b.id).at(-1)
        return +new Date(bMsg?.createdAt ?? b.createdAt) - +new Date(aMsg?.createdAt ?? a.createdAt)
      })
  }, [data])

  const current = threads.find((t) => t.id === activeThread) ?? threads[0] ?? null
  const currentId = current?.id ?? null

  const messages = useMemo(() => {
    if (!data || !currentId) return []
    return data.messages.filter((m) => m.requestId === currentId)
  }, [data, currentId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages.length, currentId])

  if (!data) return null
  const { me, students } = data

  async function send() {
    if (!current || !draft.trim()) return
    setSending(true)
    const body = draft.trim()
    setDraft('')
    await run(
      () => api.sendMessage({ requestId: current.id, senderId: me.id, body }),
      'Message sent',
    )
    setSending(false)
  }

  if (threads.length === 0) {
    return (
      <div>
        <SectionHeader title="Messages" subtitle="Chat with your learning partners" />
        <EmptyState
          icon={<MessageSquare size={20} />}
          title="No conversations yet"
          body="Chat unlocks as soon as a swap request is accepted. Send a request from Match to get started."
        />
      </div>
    )
  }

  const other = current
    ? students.find((s) => s.id === (current.fromId === me.id ? current.toId : current.fromId))
    : null

  return (
    <div>
      <SectionHeader title="Messages" subtitle="Chat with your learning partners" />

      <div className="grid gap-3 lg:grid-cols-[280px_1fr]">
        <div className="ss-card max-h-[420px] overflow-y-auto p-2 lg:max-h-[560px]">
          {threads.map((t) => {
            const peer = students.find((s) => s.id === (t.fromId === me.id ? t.toId : t.fromId))
            const last = data.messages.filter((m) => m.requestId === t.id).at(-1)
            const isActive = t.id === currentId
            return (
              <button
                key={t.id}
                className="ss-nav-item"
                data-active={isActive}
                onClick={() => setActiveThread(t.id)}
              >
                <Avatar initials={peer?.initials ?? '??'} name={peer?.name} size={34} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{peer?.name ?? 'Student'}</span>
                  <span className="block truncate text-[0.7rem] text-[var(--ss-text-mute)]">
                    {last ? last.body : `${t.teachSkill} ⇄ ${t.learnSkill}`}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="ss-card flex min-h-[420px] flex-col lg:min-h-[560px]">
          {other ? (
            <div className="flex items-center gap-3 border-b border-[var(--ss-border)] p-3.5">
              <Avatar initials={other.initials} name={other.name} size={38} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{other.name}</p>
                <p className="truncate text-[0.7rem] text-[var(--ss-text-mute)]">
                  {current?.teachSkill} ⇄ {current?.learnSkill}
                </p>
              </div>
            </div>
          ) : null}

          <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-y-auto p-3.5">
            {messages.length === 0 ? (
              <p className="py-10 text-center text-sm text-[var(--ss-text-mute)]">
                No messages yet — say hello.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderId === me.id
                return (
                  <div key={m.id} className={mine ? 'flex justify-end' : 'flex justify-start'}>
                    <div
                      className="max-w-[85%] rounded-2xl px-3.5 py-2"
                      style={
                        mine
                          ? {
                              background: 'linear-gradient(135deg,#7c5cff,#a855f7)',
                              color: '#fff',
                              borderBottomRightRadius: 6,
                            }
                          : {
                              background: 'var(--ss-card-2)',
                              border: '1px solid var(--ss-border)',
                              borderBottomLeftRadius: 6,
                            }
                      }
                    >
                      <p className="whitespace-pre-wrap break-words text-sm">{m.body}</p>
                      <p
                        className="mt-1 text-right text-[0.62rem]"
                        style={{ opacity: mine ? 0.72 : 0.45 }}
                      >
                        {timeAgo(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="flex items-end gap-2 border-t border-[var(--ss-border)] p-3">
            <textarea
              className="ss-textarea !min-h-[42px] flex-1 resize-none py-2.5"
              rows={1}
              placeholder="Write a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void send()
                }
              }}
            />
            <button
              className="ss-btn ss-btn-primary"
              onClick={send}
              disabled={sending || !draft.trim()}
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
