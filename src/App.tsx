import { useCallback, useState } from 'react'
import { AlertTriangle, RefreshCw, Zap } from 'lucide-react'
import { SkillSwapProvider, useSkillSwap } from '@/lib/store'
import type { TabId } from '@/lib/nav'
import { Shell } from '@/components/skillswap/Shell'
import { Dashboard } from '@/components/skillswap/Dashboard'
import { Matches } from '@/components/skillswap/Matches'
import { SkillBoard } from '@/components/skillswap/SkillBoard'
import { Requests } from '@/components/skillswap/Requests'
import { Messages } from '@/components/skillswap/Messages'
import { Sessions } from '@/components/skillswap/Sessions'
import { Credits } from '@/components/skillswap/Credits'
import { Progress } from '@/components/skillswap/Progress'
import { Leaderboard } from '@/components/skillswap/Leaderboard'
import { Profile } from '@/components/skillswap/Profile'
import { Toasts } from '@/components/skillswap/shared'

function LoadingState() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="flex flex-col items-center gap-3">
        <div
          className="grid h-12 w-12 animate-pulse place-items-center rounded-2xl"
          style={{ background: 'linear-gradient(135deg,#8b6cff,#56d9ff)' }}
        >
          <Zap size={22} color="#fff" fill="#fff" />
        </div>
        <p className="text-sm text-[var(--ss-text-dim)]">Loading your campus…</p>
      </div>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  const { refresh } = useSkillSwap()
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="ss-card w-full max-w-md p-6 text-center">
        <div
          className="mx-auto grid h-11 w-11 place-items-center rounded-xl"
          style={{ background: 'rgba(255,121,190,0.14)', color: 'var(--ss-pink)' }}
        >
          <AlertTriangle size={20} />
        </div>
        <p className="mt-3 font-semibold">Couldn’t load SkillSwap</p>
        <p className="mt-1.5 text-sm text-[var(--ss-text-dim)]">{message}</p>
        <button
          className="ss-btn ss-btn-primary mx-auto mt-4"
          onClick={() => {
            void refresh()
            window.location.reload()
          }}
        >
          <RefreshCw size={14} /> Try again
        </button>
      </div>
    </div>
  )
}

function AppContent() {
  const { data, loading, error, toasts } = useSkillSwap()
  const [tab, setTab] = useState<TabId>('dashboard')
  const [focusStudentId, setFocusStudentId] = useState<string | null>(null)

  const handleFocusHandled = useCallback(() => setFocusStudentId(null), [])

  const requestFromBoard = useCallback((studentId: string) => {
    setFocusStudentId(studentId)
    setTab('matches')
  }, [])

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState message={error ?? 'No data returned'} />

  return (
    <>
      <Shell tab={tab} onNavigate={setTab}>
        <div key={tab} className="ss-anim-in">
          {tab === 'dashboard' && <Dashboard onNavigate={setTab} />}
          {tab === 'matches' && (
            <Matches focusId={focusStudentId} onFocusHandled={handleFocusHandled} />
          )}
          {tab === 'skills' && <SkillBoard onRequest={requestFromBoard} />}
          {tab === 'requests' && <Requests onNavigate={setTab} />}
          {tab === 'messages' && <Messages />}
          {tab === 'sessions' && <Sessions />}
          {tab === 'credits' && <Credits />}
          {tab === 'progress' && <Progress />}
          {tab === 'leaderboard' && <Leaderboard />}
          {tab === 'profile' && <Profile />}
        </div>
      </Shell>
      <Toasts toasts={toasts} />
    </>
  )
}

export default function App() {
  return (
    <SkillSwapProvider>
      <AppContent />
    </SkillSwapProvider>
  )
}
