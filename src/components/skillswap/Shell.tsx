import { useMemo, useState, type ReactNode } from 'react'
import {
  Bell,
  CalendarDays,
  Coins,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  MessageSquare,
  Menu,
  Sparkles,
  TrendingUp,
  Trophy,
  UserRound,
  Zap,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useSkillSwap } from '@/lib/store'
import type { TabId } from '@/lib/nav'
import { Avatar, timeAgo } from './shared'

const NAV: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'matches', label: 'Matches', icon: Sparkles },
  { id: 'skills', label: 'Skill board', icon: LayoutGrid },
  { id: 'requests', label: 'Requests', icon: Inbox },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'sessions', label: 'Sessions', icon: CalendarDays },
  { id: 'credits', label: 'Credits', icon: Coins },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'leaderboard', label: 'Contributors', icon: Trophy },
  { id: 'profile', label: 'Profile', icon: UserRound },
]

const MOBILE_NAV: TabId[] = ['dashboard', 'matches', 'messages', 'sessions']

export function Shell({
  tab,
  onNavigate,
  children,
}: {
  tab: TabId
  onNavigate: (tab: TabId) => void
  children: ReactNode
}) {
  const { data, setActiveId, refresh, toast } = useSkillSwap()
  const [notifOpen, setNotifOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const unread = useMemo(
    () => data?.notifications.filter((n) => !n.read).length ?? 0,
    [data],
  )

  async function markAllRead() {
    if (!data || unread === 0) return
    try {
      await api.markNotificationsRead(data.me.id)
      await refresh()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not mark read', 'error')
    }
  }

  const badgeFor = (id: TabId): number => {
    if (!data) return 0
    if (id === 'requests') return data.requests.filter((r) => r.toId === data.me.id && r.status === 'pending').length
    if (id === 'sessions') return data.sessions.filter((s) => s.status === 'scheduled').length
    return 0
  }

  return (
    <div className="relative min-h-screen">
      <div className="ss-aurora" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col md:flex-row">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-[var(--ss-border)] px-3 py-4 md:flex">
          <div className="flex items-center gap-2 px-2 pb-5">
            <div
              className="grid h-8 w-8 place-items-center rounded-xl"
              style={{ background: 'linear-gradient(135deg,#8b6cff,#56d9ff)', boxShadow: '0 0 22px rgba(139,108,255,0.6)' }}
            >
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div>
              <p className="text-sm font-extrabold leading-none">
                Skill<span className="ss-gradient-text">Swap</span>
              </p>
              <p className="mt-0.5 text-[0.6rem] uppercase tracking-[0.12em] text-[var(--ss-text-mute)]">
                campus exchange
              </p>
            </div>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto">
            {NAV.map(({ id, label, icon: Icon }) => {
              const badge = badgeFor(id)
              return (
                <button key={id} className="ss-nav-item" data-active={tab === id} onClick={() => onNavigate(id)}>
                  <Icon size={16} />
                  <span className="flex-1">{label}</span>
                  {badge > 0 ? (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold"
                      style={{ background: 'var(--ss-pink)', color: '#1a0d16' }}
                    >
                      {badge}
                    </span>
                  ) : null}
                </button>
              )
            })}
          </nav>

          {data ? (
            <div className="mt-3 rounded-xl border border-[var(--ss-border)] bg-[rgba(7,11,24,0.5)] p-2.5">
              <p className="mb-1.5 px-1 text-[0.6rem] uppercase tracking-[0.1em] text-[var(--ss-text-mute)]">
                Signed in as
              </p>
              <div className="flex items-center gap-2 px-1 pb-2">
                <Avatar initials={data.me.initials} name={data.me.name} size={28} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{data.me.name}</p>
                  <p className="truncate text-[0.62rem] text-[var(--ss-text-mute)]">{data.me.credits} credits</p>
                </div>
              </div>
              <select
                className="ss-select !py-1.5 !text-xs"
                value={data.activeId}
                onChange={(e) => setActiveId(e.target.value)}
                aria-label="Switch demo student"
              >
                {data.students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 border-b border-[var(--ss-border)] bg-[rgba(7,11,24,0.82)] px-3 py-2.5 backdrop-blur-xl sm:px-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 md:hidden">
                <div
                  className="grid h-7 w-7 place-items-center rounded-lg"
                  style={{ background: 'linear-gradient(135deg,#8b6cff,#56d9ff)' }}
                >
                  <Zap size={13} color="#fff" fill="#fff" />
                </div>
                <p className="text-sm font-extrabold">
                  Skill<span className="ss-gradient-text">Swap</span>
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                  <button
                    className="ss-btn ss-btn-ghost relative !p-2"
                    onClick={() => {
                      setNotifOpen((v) => !v)
                      void markAllRead()
                    }}
                    aria-label="Notifications"
                  >
                    <Bell size={16} />
                    {unread > 0 ? (
                      <span
                        className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.58rem] font-bold"
                        style={{ background: 'var(--ss-pink)', color: '#1a0d16' }}
                      >
                        {unread}
                      </span>
                    ) : null}
                  </button>

                  {notifOpen && data ? (
                    <div className="ss-card ss-anim-in absolute right-0 top-11 z-50 max-h-80 w-72 overflow-y-auto p-2">
                      <p className="px-2 py-1 text-[0.62rem] uppercase tracking-[0.1em] text-[var(--ss-text-mute)]">
                        Notifications
                      </p>
                      {data.notifications.length === 0 ? (
                        <p className="px-2 py-4 text-center text-xs text-[var(--ss-text-dim)]">
                          Nothing yet
                        </p>
                      ) : (
                        data.notifications.slice(0, 8).map((n) => (
                          <div key={n.id} className="rounded-lg px-2 py-2 hover:bg-[rgba(139,108,255,0.08)]">
                            <p className="text-xs font-medium">{n.title}</p>
                            {n.body ? (
                              <p className="truncate text-[0.68rem] text-[var(--ss-text-mute)]">{n.body}</p>
                            ) : null}
                            <p className="mt-0.5 text-[0.6rem] text-[var(--ss-text-mute)]">{timeAgo(n.createdAt)}</p>
                          </div>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>

                {data ? (
                  <div className="flex items-center gap-2">
                    <select
                      className="ss-select !w-auto max-w-[9.5rem] !py-1.5 !text-xs md:hidden"
                      value={data.activeId}
                      onChange={(e) => setActiveId(e.target.value)}
                      aria-label="Switch demo student"
                    >
                      {data.students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name.split(' ')[0]}
                        </option>
                      ))}
                    </select>
                    <div className="hidden items-center gap-2 sm:flex">
                      <Avatar initials={data.me.initials} name={data.me.name} size={28} />
                      <span className="text-xs font-medium">{data.me.name}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          <main className="flex-1 px-3 pb-24 pt-4 sm:px-5 sm:pb-10 sm:pt-5">{children}</main>
        </div>
      </div>

      {/* Mobile bottom nav + overflow sheet */}
      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(4,6,14,0.7)' }}
            onClick={() => setMoreOpen(false)}
          />
          <div className="ss-card absolute bottom-0 left-0 right-0 rounded-b-none p-3 pb-20">
            <p className="px-2 pb-2 text-[0.6rem] uppercase tracking-[0.1em] text-[var(--ss-text-mute)]">
              All sections
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {NAV.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className="ss-nav-item"
                  data-active={tab === id}
                  onClick={() => {
                    onNavigate(id)
                    setMoreOpen(false)
                  }}
                >
                  <Icon size={15} />
                  <span className="truncate">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--ss-border)] bg-[rgba(7,11,24,0.94)] backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5">
          {MOBILE_NAV.map((id) => {
            const item = NAV.find((n) => n.id === id)
            if (!item) return null
            const Icon = item.icon
            const active = tab === id
            const badge = badgeFor(id)
            return (
              <button
                key={id}
                onClick={() => onNavigate(id)}
                className="relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5"
                style={{ color: active ? 'var(--ss-violet)' : 'var(--ss-text-mute)' }}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} />
                <span className="text-[0.58rem] font-medium">{item.label.split(' ')[0]}</span>
                {badge > 0 ? (
                  <span
                    className="absolute right-2 top-0 grid h-3.5 min-w-3.5 place-items-center rounded-full px-0.5 text-[0.5rem] font-bold"
                    style={{ background: 'var(--ss-pink)', color: '#1a0d16' }}
                  >
                    {badge}
                  </span>
                ) : null}
              </button>
            )
          })}

          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5"
            style={{
              color: moreOpen || !MOBILE_NAV.includes(tab) ? 'var(--ss-violet)' : 'var(--ss-text-mute)',
            }}
            aria-label="More sections"
            aria-expanded={moreOpen}
          >
            <Menu size={18} />
            <span className="text-[0.58rem] font-medium">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
