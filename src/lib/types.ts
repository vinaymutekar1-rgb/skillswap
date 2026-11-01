/**
 * SkillSwap domain types.
 *
 * These mirror the shapes returned by `/api/bootstrap` and the mutation
 * endpoints in `custom-routes.ts`. Kept hand-written (rather than importing
 * Prisma models) so the client bundle never depends on generated server code.
 */

export type SkillKind = 'teach' | 'learn'
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced'
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed'
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled'

export interface Student {
  id: string
  name: string
  email: string
  initials: string
  campus: string
  year: string
  bio: string
  rating: number
  reviewCount: number
  credits: number
  sessionsDone: number
  availability: string
  preferredMode: string
}

export interface LeaderboardRow extends Student {
  rank: number
}

export interface StudentSkill {
  id: string
  studentId: string
  skillName: string
  kind: SkillKind
  level: SkillLevel
  verified: boolean
}

export interface SwapRequest {
  id: string
  fromId: string
  toId: string
  teachSkill: string
  learnSkill: string
  matchScore: number
  message: string
  status: RequestStatus
  createdAt: string
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  body: string
  createdAt: string
}

export interface Session {
  id: string
  requestId: string
  teacherId: string
  learnerId: string
  skill: string
  scheduledAt: string
  durationMin: number
  mode: string
  status: SessionStatus
  creditsAwarded: number
}

export interface Review {
  id: string
  sessionId: string
  reviewerId: string
  revieweeId: string
  communication: number
  knowledge: number
  reliability: number
  quality: number
  comment: string
  createdAt: string
}

export interface Notification {
  id: string
  studentId: string
  type: string
  title: string
  body: string
  read: boolean
  createdAt: string
}

export interface ProgressEntry {
  id: string
  studentId: string
  skill: string
  level: SkillLevel
  hours: number
  sessions: number
}

export interface Match {
  student: Student
  score: number
  reasons: string[]
  teachesYou: { skill: string; level: SkillLevel }[]
  learnsFromYou: { skill: string; level: SkillLevel }[]
  mutual: boolean
}

export interface SkillCatalogItem {
  id: string
  name: string
  category: string
}

export interface BootstrapData {
  activeId: string
  me: Student
  students: Student[]
  skills: StudentSkill[]
  skillsCatalog: SkillCatalogItem[]
  requests: SwapRequest[]
  messages: Message[]
  sessions: Session[]
  reviews: Review[]
  notifications: Notification[]
  progress: ProgressEntry[]
  matches: Match[]
  leaderboard: LeaderboardRow[]
}
