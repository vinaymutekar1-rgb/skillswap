// SPDX-License-Identifier: Apache-2.0
// Copyright (C) 2026 Shogo Technologies, Inc.
/**
 * SkillSwap API
 *
 * Custom backend for the campus skill exchange platform. Mounted under /api/.
 * All reads funnel through /bootstrap so the client has one consistent shape;
 * all writes are explicit, single-purpose endpoints that enforce the domain
 * rules (credits, ratings, notifications) server-side.
 *
 * Write routes live under `/swap/*` to keep the domain-enforcing operations
 * separate from any optional generated CRUD endpoints.
 */

import { Hono } from 'hono'
import { prisma } from './src/lib/db'

const app = new Hono()

// ---------------------------------------------------------------------------
// Domain constants
// ---------------------------------------------------------------------------

const CREDITS_PER_30MIN = 5
const LEVEL_WEIGHT: Record<string, number> = { beginner: 1, intermediate: 2, advanced: 3 }

type SkillRow = { studentId: string; skillName: string; kind: string; level: string }

// ---------------------------------------------------------------------------
// Matching engine
// ---------------------------------------------------------------------------

/**
 * Scores every other student against the given student across six weighted
 * factors and returns them sorted best-first. This is a real calculation, not
 * a shuffle: a candidate only appears if they can teach something the student
 * wants to learn.
 */
function scoreMatches(meId: string, skills: SkillRow[], students: any[]) {
  const me = students.find((s) => s.id === meId)
  if (!me) return []

  const mine = skills.filter((s) => s.studentId === meId)
  const myTeach = mine.filter((s) => s.kind === 'teach')
  const myLearn = mine.filter((s) => s.kind === 'learn')

  const results = students
    .filter((s) => s.id !== meId)
    .map((candidate) => {
      const theirs = skills.filter((s) => s.studentId === candidate.id)
      const theirTeach = theirs.filter((s) => s.kind === 'teach')
      const theirLearn = theirs.filter((s) => s.kind === 'learn')

      // Skills they can teach me (the reason a match can exist at all)
      const canTeachMe = theirTeach.filter((t) =>
        myLearn.some((l) => l.skillName.toLowerCase() === t.skillName.toLowerCase()),
      )
      // Skills I can teach them (turns a one-way into a swap)
      const canLearnFromMe = theirLearn.filter((l) =>
        myTeach.some((t) => t.skillName.toLowerCase() === l.skillName.toLowerCase()),
      )

      if (canTeachMe.length === 0) return null

      let score = 0
      const reasons: string[] = []

      // 1. Mutual exchange (30) — both directions covered
      const isMutual = canLearnFromMe.length > 0
      score += isMutual ? 30 : 14
      if (isMutual) {
        reasons.push(`Two-way swap: you trade ${canLearnFromMe[0].skillName} for ${canTeachMe[0].skillName}`)
      } else {
        reasons.push(`They can teach you ${canTeachMe[0].skillName}`)
      }

      // 2. Skill level fit (20) — closer levels pair better
      const levelDeltas = canTeachMe.map((t) => {
        const mineWanted = myLearn.find((l) => l.skillName.toLowerCase() === t.skillName.toLowerCase())
        return Math.abs((LEVEL_WEIGHT[t.level] ?? 2) - (LEVEL_WEIGHT[mineWanted?.level ?? 'beginner'] ?? 1))
      })
      const avgDelta = levelDeltas.reduce((a, b) => a + b, 0) / levelDeltas.length
      const levelScore = Math.round(Math.max(0, 20 - avgDelta * 8))
      score += levelScore
      if (avgDelta >= 1.5) reasons.push('Their teaching level stretches you')

      // 3. Availability overlap (15)
      const myDays = daySet(me.availability)
      const theirDays = daySet(candidate.availability)
      const sharedDays = [...myDays].filter((d) => theirDays.has(d))
      const availScore = theirDays.size === 0 || myDays.size === 0
        ? 7
        : Math.round((sharedDays.length / Math.max(myDays.size, theirDays.size)) * 15)
      score += availScore
      if (sharedDays.length > 0) reasons.push(`Free on ${sharedDays.slice(0, 2).join(' & ')}`)

      // 4. Mode preference (10)
      const modeScore =
        me.preferredMode === candidate.preferredMode ? 10
        : me.preferredMode === 'flexible' || candidate.preferredMode === 'flexible' ? 7
        : 2
      score += modeScore

      // 5. Rating & activity (15)
      const ratingScore = candidate.reviewCount > 0
        ? Math.round((candidate.rating / 5) * 10) + Math.min(5, candidate.sessionsDone)
        : Math.min(5, candidate.sessionsDone)
      score += Math.min(15, ratingScore)
      if (candidate.rating >= 4.5 && candidate.reviewCount > 0) {
        reasons.push(`Rated ${candidate.rating.toFixed(1)}★ by ${candidate.reviewCount} peers`)
      }

      // 6. Campus relevance (10)
      const campusScore = me.campus === candidate.campus ? 10 : 4
      score += campusScore

      return {
        student: candidate,
        score: Math.min(99, Math.max(0, Math.round(score))),
        reasons: reasons.slice(0, 3),
        teachesYou: canTeachMe.map((t) => ({ skill: t.skillName, level: t.level })),
        learnsFromYou: canLearnFromMe.map((l) => ({ skill: l.skillName, level: l.level })),
        mutual: isMutual,
      }
    })
    .filter(Boolean) as any[]

  return results.sort((a, b) => b.score - a.score)
}

function daySet(availability: string): Set<string> {
  const set = new Set<string>()
  availability
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((slot) => set.add(slot.split(' ')[0]))
  return set
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const SEED_STUDENTS = [
  {
    name: 'Arjun Mehta', email: 'arjun@campus.edu', initials: 'AM',
    campus: 'IIT Bombay', year: '3rd Year',
    bio: 'Backend developer who lives in Python. Trying to get better at design so my side projects stop looking like terminals.',
    availability: 'Mon 18:00-20:00,Wed 17:00-19:00,Sat 10:00-13:00',
    preferredMode: 'flexible', credits: 120, rating: 4.8, reviewCount: 9, sessionsDone: 11,
    teach: [['Python', 'advanced'], ['Data Structures', 'advanced']],
    learn: [['UI/UX Design', 'beginner']],
  },
  {
    name: 'Karan Shah', email: 'karan@campus.edu', initials: 'KS',
    campus: 'IIT Bombay', year: '4th Year',
    bio: 'Ran two campus startups. I can help you pitch, price and position — and I want to finally learn to code.',
    availability: 'Mon 18:00-20:00,Tue 19:00-21:00,Thu 18:00-20:00',
    preferredMode: 'online', credits: 95, rating: 4.6, reviewCount: 7, sessionsDone: 8,
    teach: [['Business Strategy', 'advanced'], ['Marketing', 'intermediate']],
    learn: [['Python', 'beginner']],
  },
  {
    name: 'Sneha Iyer', email: 'sneha@campus.edu', initials: 'SI',
    campus: 'IIT Bombay', year: '3rd Year',
    bio: 'Product designer. I care about spacing, hierarchy and why your landing page feels off. Learning CS fundamentals next.',
    availability: 'Wed 17:00-19:00,Fri 16:00-18:00,Sat 10:00-13:00',
    preferredMode: 'flexible', credits: 150, rating: 4.9, reviewCount: 12, sessionsDone: 14,
    teach: [['UI/UX Design', 'advanced'], ['Figma', 'advanced']],
    learn: [['Data Structures', 'intermediate']],
  },
  {
    name: 'Rajeev Nair', email: 'rajeev@campus.edu', initials: 'RN',
    campus: 'NIT Trichy', year: '2nd Year',
    bio: 'Electronics and embedded systems. I build small robots. I need someone to teach me how to actually sell them.',
    availability: 'Tue 19:00-21:00,Thu 18:00-20:00,Sat 14:00-17:00',
    preferredMode: 'offline', credits: 60, rating: 4.4, reviewCount: 5, sessionsDone: 6,
    teach: [['Electronics', 'advanced'], ['Arduino', 'advanced']],
    learn: [['Marketing', 'beginner']],
  },
  {
    name: 'Priya Kapoor', email: 'priya@campus.edu', initials: 'PK',
    campus: 'NIT Trichy', year: '4th Year',
    bio: 'Freelance photographer. I shoot campus events and edit in Lightroom. Want to understand business before going full-time.',
    availability: 'Mon 18:00-20:00,Fri 16:00-18:00,Sun 11:00-14:00',
    preferredMode: 'offline', credits: 75, rating: 4.7, reviewCount: 8, sessionsDone: 9,
    teach: [['Photography', 'advanced'], ['Lightroom', 'intermediate']],
    learn: [['Business Strategy', 'beginner']],
  },
  {
    name: 'Rohit Verma', email: 'rohit@campus.edu', initials: 'RV',
    campus: 'IIT Bombay', year: '1st Year',
    bio: 'First year, still figuring things out. I am decent at presenting and I want to learn Python from scratch.',
    availability: 'Mon 18:00-20:00,Wed 17:00-19:00,Sun 11:00-14:00',
    preferredMode: 'online', credits: 30, rating: 4.2, reviewCount: 3, sessionsDone: 3,
    teach: [['Public Speaking', 'intermediate']],
    learn: [['Python', 'beginner']],
  },
  {
    name: 'Anjali Desai', email: 'anjali@campus.edu', initials: 'AD',
    campus: 'NIT Trichy', year: '3rd Year',
    bio: 'Finance and spreadsheets. I can make Excel do things that scare people. Want to learn product design.',
    availability: 'Tue 19:00-21:00,Fri 16:00-18:00,Sat 10:00-13:00',
    preferredMode: 'flexible', credits: 105, rating: 4.8, reviewCount: 10, sessionsDone: 12,
    teach: [['Finance', 'advanced'], ['Excel', 'advanced']],
    learn: [['UI/UX Design', 'beginner']],
  },
  {
    name: 'Nikhil Rao', email: 'nikhil@campus.edu', initials: 'NR',
    campus: 'IIT Bombay', year: '4th Year',
    bio: 'Full-stack dev, React all day. Shipping a product taught me I am clueless about money. Fixing that.',
    availability: 'Mon 18:00-20:00,Thu 18:00-20:00,Sat 14:00-17:00',
    preferredMode: 'online', credits: 135, rating: 4.7, reviewCount: 11, sessionsDone: 13,
    teach: [['Full-stack Development', 'advanced'], ['React', 'advanced']],
    learn: [['Finance', 'beginner']],
  },
]

type Score4 = [number, number, number, number]

/**
 * Historical completed sessions used to seed the demo.
 *
 * Declared as groups so the file stays readable; expanded into individual
 * sessions below. Credits, ratings and progress are all derived from these —
 * nothing is hand-written, so the leaderboard can never contradict the data.
 */
const HISTORY_GROUPS: Array<{
  teacher: string
  learner: string
  skill: string
  count: number
  minutes: number
  scores: Score4
  comment: string
}> = [
  { teacher: 'Sneha Iyer', learner: 'Anjali Desai', skill: 'UI/UX Design', count: 2, minutes: 60, scores: [5, 5, 5, 5], comment: 'Sneha made spacing and hierarchy finally click for me.' },
  { teacher: 'Sneha Iyer', learner: 'Arjun Mehta', skill: 'UI/UX Design', count: 2, minutes: 90, scores: [5, 4, 5, 5], comment: 'Turned my terminal-looking app into something presentable.' },
  { teacher: 'Sneha Iyer', learner: 'Nikhil Rao', skill: 'UI/UX Design', count: 1, minutes: 60, scores: [5, 5, 4, 5], comment: 'Great critique of my dashboard layout.' },
  { teacher: 'Sneha Iyer', learner: 'Karan Shah', skill: 'UI/UX Design', count: 1, minutes: 60, scores: [4, 5, 5, 4], comment: 'Helped me mock up a pitch deck fast.' },
  { teacher: 'Sneha Iyer', learner: 'Rohit Verma', skill: 'Figma', count: 1, minutes: 60, scores: [5, 4, 4, 5], comment: 'Very patient with a total beginner.' },
  { teacher: 'Sneha Iyer', learner: 'Rajeev Nair', skill: 'Figma', count: 1, minutes: 30, scores: [4, 4, 5, 4], comment: 'Useful intro to component libraries.' },
  { teacher: 'Sneha Iyer', learner: 'Priya Kapoor', skill: 'UI/UX Design', count: 1, minutes: 60, scores: [5, 5, 5, 4], comment: 'Loved the photography portfolio feedback.' },

  { teacher: 'Nikhil Rao', learner: 'Rohit Verma', skill: 'React', count: 2, minutes: 60, scores: [5, 4, 5, 4], comment: 'Explained hooks without jargon.' },
  { teacher: 'Nikhil Rao', learner: 'Karan Shah', skill: 'React', count: 1, minutes: 90, scores: [4, 5, 4, 5], comment: 'Helped me ship a landing page in one sitting.' },
  { teacher: 'Nikhil Rao', learner: 'Anjali Desai', skill: 'React', count: 1, minutes: 60, scores: [5, 4, 4, 4], comment: 'Good pace, very practical.' },
  { teacher: 'Nikhil Rao', learner: 'Priya Kapoor', skill: 'Full-stack Development', count: 1, minutes: 60, scores: [4, 4, 5, 4], comment: 'Clear walkthrough of a real deploy.' },
  { teacher: 'Nikhil Rao', learner: 'Rajeev Nair', skill: 'Full-stack Development', count: 1, minutes: 60, scores: [4, 5, 4, 4], comment: 'Connected my Arduino data to a web page.' },
  { teacher: 'Nikhil Rao', learner: 'Sneha Iyer', skill: 'React', count: 1, minutes: 60, scores: [5, 5, 5, 4], comment: 'Now I can build my own design prototypes.' },

  { teacher: 'Arjun Mehta', learner: 'Rohit Verma', skill: 'Python', count: 3, minutes: 60, scores: [5, 5, 4, 5], comment: 'Started from zero and finally understand loops.' },
  { teacher: 'Arjun Mehta', learner: 'Karan Shah', skill: 'Python', count: 2, minutes: 60, scores: [4, 5, 5, 4], comment: 'Practical, no fluff, straight to code.' },
  { teacher: 'Arjun Mehta', learner: 'Sneha Iyer', skill: 'Data Structures', count: 2, minutes: 60, scores: [5, 4, 4, 5], comment: 'Made linked lists feel obvious.' },

  { teacher: 'Anjali Desai', learner: 'Nikhil Rao', skill: 'Finance', count: 3, minutes: 60, scores: [5, 4, 5, 4], comment: 'Finally understand runway and burn.' },
  { teacher: 'Anjali Desai', learner: 'Priya Kapoor', skill: 'Excel', count: 2, minutes: 60, scores: [4, 4, 4, 5], comment: 'Pricing my shoots is so much easier now.' },

  { teacher: 'Karan Shah', learner: 'Priya Kapoor', skill: 'Business Strategy', count: 2, minutes: 60, scores: [4, 4, 5, 4], comment: 'Blunt and useful feedback on my pricing.' },
  { teacher: 'Karan Shah', learner: 'Rajeev Nair', skill: 'Marketing', count: 2, minutes: 60, scores: [5, 4, 4, 4], comment: 'Gave me a plan I could actually execute.' },

  { teacher: 'Priya Kapoor', learner: 'Rohit Verma', skill: 'Photography', count: 1, minutes: 60, scores: [5, 5, 5, 5], comment: 'Composition tips changed how I shoot.' },
  { teacher: 'Priya Kapoor', learner: 'Sneha Iyer', skill: 'Lightroom', count: 1, minutes: 30, scores: [4, 4, 4, 4], comment: 'Quick and effective editing workflow.' },

  { teacher: 'Rajeev Nair', learner: 'Rohit Verma', skill: 'Electronics', count: 1, minutes: 60, scores: [4, 5, 4, 4], comment: 'Soldered my first circuit, great guidance.' },

  { teacher: 'Rohit Verma', learner: 'Anjali Desai', skill: 'Public Speaking', count: 1, minutes: 30, scores: [4, 3, 5, 4], comment: 'Nervous but genuinely helpful practice.' },
]

const HISTORY = HISTORY_GROUPS.flatMap((group, groupIndex) =>
  Array.from({ length: group.count }, (_, i) => ({
    teacher: group.teacher,
    learner: group.learner,
    skill: group.skill,
    minutes: group.minutes,
    scores: group.scores,
    comment: group.comment,
    mode: 'online',
    matchScore: 80,
    daysAgo: 6 + groupIndex * 3 + i * 2,
  })),
)

/** Live demo threads so messaging and incoming requests aren't empty. */
const SEED_THREADS: Array<{
  from: string
  to: string
  teach: string
  learn: string
  status: string
  score: number
  opener?: string
  messages: Array<[string, string]>
}> = [
  {
    from: 'Arjun Mehta',
    to: 'Sneha Iyer',
    teach: 'Data Structures',
    learn: 'UI/UX Design',
    status: 'accepted',
    score: 87,
    opener: 'Hi Sneha — I can help with data structures if you can help me with design.',
    messages: [
      ['Sneha Iyer', 'Hey! Yes, that trade works perfectly for me.'],
      ['Arjun Mehta', 'Great. Are you free Thursday evening?'],
      ['Sneha Iyer', 'Thursday after 6 works. I have availability then too.'],
    ],
  },
  {
    from: 'Rohit Verma',
    to: 'Anjali Desai',
    teach: 'Public Speaking',
    learn: 'Excel',
    status: 'pending',
    score: 62,
    opener: 'I can help you get comfortable presenting if you can show me Excel shortcuts.',
    messages: [],
  },
  {
    from: 'Priya Kapoor',
    to: 'Karan Shah',
    teach: 'Photography',
    learn: 'Business Strategy',
    status: 'pending',
    score: 58,
    opener: 'I shoot all the campus events — would love help pricing my work.',
    messages: [],
  },
]

const SKILL_CATEGORIES: Record<string, string> = {
  Python: 'Programming', 'Data Structures': 'Computer Science',
  'UI/UX Design': 'Design', Figma: 'Design',
  'Business Strategy': 'Business', Marketing: 'Business',
  Electronics: 'Engineering', Arduino: 'Engineering',
  Photography: 'Creative', Lightroom: 'Creative',
  'Public Speaking': 'Communication', Finance: 'Business', Excel: 'Business',
  'Full-stack Development': 'Programming', React: 'Programming',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function notify(studentId: string, type: string, title: string, body = '') {
  await prisma.notification.create({ data: { studentId, type, title, body } })
}

/** Recomputes a student's average rating from their reviews. */
async function recomputeRating(studentId: string) {
  const reviews = await prisma.review.findMany({ where: { revieweeId: studentId } })
  if (reviews.length === 0) return
  const total = reviews.reduce(
    (sum, r) => sum + (r.communication + r.knowledge + r.reliability + r.quality) / 4,
    0,
  )
  await prisma.student.update({
    where: { id: studentId },
    data: { rating: Number((total / reviews.length).toFixed(2)), reviewCount: reviews.length },
  })
}

/** Upserts a progress entry, advancing the level as sessions accumulate. */
async function bumpProgress(studentId: string, skill: string, hours: number) {
  const existing = await prisma.progressEntry.findUnique({
    where: { studentId_skill: { studentId, skill } },
  })
  const sessions = (existing?.sessions ?? 0) + 1
  const totalHours = Number(((existing?.hours ?? 0) + hours).toFixed(1))
  const level = sessions >= 8 ? 'advanced' : sessions >= 3 ? 'intermediate' : 'beginner'

  await prisma.progressEntry.upsert({
    where: { studentId_skill: { studentId, skill } },
    create: { studentId, skill, level, hours: totalHours, sessions },
    update: { level, hours: totalHours, sessions },
  })
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

/** Idempotent seed — safe to call repeatedly. */
app.post('/seed', async (c) => {
  const existing = await prisma.student.count()
  if (existing > 0) {
    return c.json({ ok: true, seeded: false, message: 'Data already present', students: existing })
  }

  const byName = new Map<string, { id: string }>()

  for (const s of SEED_STUDENTS) {
    const student = await prisma.student.create({
      data: {
        name: s.name, email: s.email, initials: s.initials, campus: s.campus,
        year: s.year, bio: s.bio, availability: s.availability,
        preferredMode: s.preferredMode,
        // Stats start at zero and are derived from seeded history below, so the
        // leaderboard and ratings can never disagree with the session records.
        credits: 0, rating: 0, reviewCount: 0, sessionsDone: 0,
      },
    })
    byName.set(s.name, student)

    for (const [skillName, level] of s.teach) {
      await ensureSkill(skillName)
      await prisma.studentSkill.create({
        data: { studentId: student.id, skillName, kind: 'teach', level, verified: true },
      })
    }
    for (const [skillName, level] of s.learn) {
      await ensureSkill(skillName)
      await prisma.studentSkill.create({
        data: { studentId: student.id, skillName, kind: 'learn', level },
      })
      await prisma.progressEntry.upsert({
        where: { studentId_skill: { studentId: student.id, skill: skillName } },
        create: { studentId: student.id, skill: skillName, level: 'beginner', hours: 0, sessions: 0 },
        update: {},
      })
    }
  }

  // Historical completed sessions. Everything else (credits, sessionsDone,
  // ratings, progress) is computed from these records.
  for (const h of HISTORY) {
    const teacher = byName.get(h.teacher)
    const learner = byName.get(h.learner)
    if (!teacher || !learner) continue

    const scheduledAt = new Date(Date.now() - h.daysAgo * 24 * 60 * 60 * 1000)
    const credits = Math.round((h.minutes / 30) * CREDITS_PER_30MIN)

    const request = await prisma.swapRequest.create({
      data: {
        fromId: learner.id, toId: teacher.id,
        teachSkill: '—', learnSkill: h.skill,
        matchScore: h.matchScore ?? 75, status: 'completed', message: 'Completed exchange.',
        createdAt: scheduledAt,
      },
    })

    const session = await prisma.session.create({
      data: {
        requestId: request.id, teacherId: teacher.id, learnerId: learner.id,
        skill: h.skill, scheduledAt: scheduledAt.toISOString(),
        durationMin: h.minutes, mode: h.mode ?? 'online',
        status: 'completed', creditsAwarded: credits,
      },
    })

    const [comm, know, reli, qual] = h.scores
    await prisma.review.create({
      data: {
        sessionId: session.id, reviewerId: learner.id, revieweeId: teacher.id,
        communication: comm, knowledge: know, reliability: reli, quality: qual,
        comment: h.comment ?? '', createdAt: new Date(scheduledAt.getTime() + 3600_000),
      },
    })

    await bumpProgress(learner.id, h.skill, Number((h.minutes / 60).toFixed(1)))
  }

  // A live conversation and two pending requests so the messaging and
  // "needs your reply" surfaces have content on a fresh install.
  for (const thread of SEED_THREADS) {
    const from = byName.get(thread.from)
    const to = byName.get(thread.to)
    if (!from || !to) continue

    const request = await prisma.swapRequest.create({
      data: {
        fromId: from.id, toId: to.id,
        teachSkill: thread.teach, learnSkill: thread.learn,
        matchScore: thread.score, status: thread.status,
        message: thread.opener ?? '',
      },
    })

    for (const [index, [speaker, body]] of thread.messages.entries()) {
      const sender = speaker === thread.from ? from : to
      // Stagger timestamps into the past so the thread doesn't read as "just now".
      const sentAt = new Date(Date.now() - (thread.messages.length - index) * 7 * 60 * 1000)
      await prisma.message.create({
        data: { requestId: request.id, senderId: sender.id, body, createdAt: sentAt },
      })
    }

    if (thread.status === 'pending') {
      await notify(
        to.id, 'request', 'New swap request',
        `${thread.from} wants to exchange ${thread.teach} for ${thread.learn}.`,
      )
    }
  }

  // Derive every aggregate from the records we just wrote.
  for (const s of byName.values()) {
    const taught = await prisma.session.findMany({ where: { teacherId: s.id, status: 'completed' } })
    const attended = await prisma.session.count({ where: { learnerId: s.id, status: 'completed' } })
    const reviews = await prisma.review.findMany({ where: { revieweeId: s.id } })

    const credits = taught.reduce((sum, t) => sum + t.creditsAwarded, 0)
    const rating =
      reviews.length > 0
        ? Number(
            (
              reviews.reduce(
                (sum, r) => sum + (r.communication + r.knowledge + r.reliability + r.quality) / 4,
                0,
              ) / reviews.length
            ).toFixed(2),
          )
        : 0

    await prisma.student.update({
      where: { id: s.id },
      data: {
        credits,
        rating,
        reviewCount: reviews.length,
        sessionsDone: taught.length + attended,
      },
    })
  }

  return c.json({ ok: true, seeded: true, students: await prisma.student.count() })
})

async function ensureSkill(name: string) {
  await prisma.skill.upsert({
    where: { name },
    create: { name, category: SKILL_CATEGORIES[name] ?? 'General' },
    update: {},
  })
}

/** Everything the client needs for one signed-in student, in one round trip. */
app.get('/bootstrap', async (c) => {
  const studentId = c.req.query('studentId') ?? ''

  const students = await prisma.student.findMany({ orderBy: { name: 'asc' } })
  if (students.length === 0) {
    return c.json({ error: 'No students seeded. POST /api/seed first.', students: [] }, 412)
  }

  const activeId = students.some((s) => s.id === studentId) ? studentId : students[0].id

  const [skills, requests, messages, sessions, reviews, notifications, progress, allSkills] =
    await Promise.all([
      prisma.studentSkill.findMany(),
      prisma.swapRequest.findMany({
        where: { OR: [{ fromId: activeId }, { toId: activeId }] },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.findMany({ orderBy: { createdAt: 'asc' } }),
      prisma.session.findMany({
        where: { OR: [{ teacherId: activeId }, { learnerId: activeId }] },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.review.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.notification.findMany({
        where: { studentId: activeId },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
      prisma.progressEntry.findMany({ where: { studentId: activeId } }),
      prisma.skill.findMany({ orderBy: { name: 'asc' } }),
    ])

  const requestIds = new Set(requests.map((r) => r.id))
  const scopedMessages = messages.filter((m) => requestIds.has(m.requestId))

  const leaderboard = [...students]
    .sort((a, b) => b.credits - a.credits)
    .slice(0, 10)
    .map((s, i) => ({ rank: i + 1, ...s }))

  const matches = scoreMatches(
    activeId,
    skills.map((s) => ({
      studentId: s.studentId, skillName: s.skillName, kind: s.kind, level: s.level,
    })),
    students,
  )

  return c.json({
    activeId,
    me: students.find((s) => s.id === activeId),
    students,
    skills,
    skillsCatalog: allSkills,
    requests,
    messages: scopedMessages,
    sessions,
    reviews,
    notifications,
    progress,
    matches,
    leaderboard,
  })
})

app.get('/matches', async (c) => {
  const studentId = c.req.query('studentId')
  if (!studentId) return c.json({ error: 'studentId is required' }, 400)

  const [students, skills] = await Promise.all([
    prisma.student.findMany(),
    prisma.studentSkill.findMany(),
  ])
  const rows = skills.map((s) => ({
    studentId: s.studentId, skillName: s.skillName, kind: s.kind, level: s.level,
  }))
  return c.json({ matches: scoreMatches(studentId, rows, students) })
})

/** Send an exchange request. Score is computed server-side, never trusted from the client. */
app.post('/swap/requests', async (c) => {
  const body = await c.req.json<{
    fromId: string; toId: string; teachSkill: string; learnSkill: string; message?: string
  }>()

  if (!body.fromId || !body.toId || !body.teachSkill || !body.learnSkill) {
    return c.json({ error: 'fromId, toId, teachSkill and learnSkill are required' }, 400)
  }
  if (body.fromId === body.toId) {
    return c.json({ error: 'You cannot request a swap with yourself' }, 400)
  }

  const duplicate = await prisma.swapRequest.findFirst({
    where: { fromId: body.fromId, toId: body.toId, status: { in: ['pending', 'accepted'] } },
  })
  if (duplicate) {
    return c.json({ error: 'You already have an open request with this student' }, 409)
  }

  const [students, skills] = await Promise.all([
    prisma.student.findMany(),
    prisma.studentSkill.findMany(),
  ])
  const ranked = scoreMatches(
    body.fromId,
    skills.map((s) => ({ studentId: s.studentId, skillName: s.skillName, kind: s.kind, level: s.level })),
    students,
  )
  const matchScore = ranked.find((m) => m.student.id === body.toId)?.score ?? 50

  const request = await prisma.swapRequest.create({
    data: {
      fromId: body.fromId, toId: body.toId,
      teachSkill: body.teachSkill, learnSkill: body.learnSkill,
      message: body.message ?? '', matchScore, status: 'pending',
    },
  })

  const sender = students.find((s) => s.id === body.fromId)
  await notify(
    body.toId, 'request', 'New swap request',
    `${sender?.name ?? 'A student'} wants to exchange ${body.teachSkill} for ${body.learnSkill}.`,
  )

  return c.json({ ok: true, request })
})

/** Accept / reject / cancel a request. */
app.patch('/swap/requests/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{ status: string }>()
  const allowed = ['pending', 'accepted', 'rejected', 'cancelled', 'completed']

  if (!allowed.includes(body.status)) {
    return c.json({ error: `status must be one of ${allowed.join(', ')}` }, 400)
  }

  const existing = await prisma.swapRequest.findUnique({ where: { id } })
  if (!existing) return c.json({ error: 'Request not found' }, 404)

  const request = await prisma.swapRequest.update({ where: { id }, data: { status: body.status } })

  if (body.status === 'accepted') {
    const students = await prisma.student.findMany()
    const accepter = students.find((s) => s.id === existing.toId)
    await notify(
      existing.fromId, 'request', 'Request accepted',
      `${accepter?.name ?? 'Your match'} accepted your swap. Say hello and pick a time.`,
    )
    await prisma.message.create({
      data: {
        requestId: id, senderId: existing.toId,
        body: `Hey! Happy to swap ${existing.teachSkill} for ${existing.learnSkill}. When are you free?`,
      },
    })
  } else if (body.status === 'rejected') {
    await notify(existing.fromId, 'request', 'Request declined', 'This match was not available right now.')
  }

  return c.json({ ok: true, request })
})

app.post('/swap/messages', async (c) => {
  const body = await c.req.json<{ requestId: string; senderId: string; body: string }>()
  if (!body.requestId || !body.senderId || !body.body?.trim()) {
    return c.json({ error: 'requestId, senderId and body are required' }, 400)
  }

  const request = await prisma.swapRequest.findUnique({ where: { id: body.requestId } })
  if (!request) return c.json({ error: 'Request not found' }, 404)

  const message = await prisma.message.create({
    data: { requestId: body.requestId, senderId: body.senderId, body: body.body.trim() },
  })

  const recipientId = request.fromId === body.senderId ? request.toId : request.fromId
  const sender = await prisma.student.findUnique({ where: { id: body.senderId } })
  await notify(recipientId, 'message', 'New message', `${sender?.name ?? 'Someone'}: ${body.body.slice(0, 60)}`)

  return c.json({ ok: true, message })
})

app.post('/swap/sessions', async (c) => {
  const body = await c.req.json<{
    requestId: string; teacherId: string; learnerId: string; skill: string;
    scheduledAt: string; durationMin?: number; mode?: string
  }>()

  if (!body.requestId || !body.teacherId || !body.learnerId || !body.skill || !body.scheduledAt) {
    return c.json(
      { error: 'requestId, teacherId, learnerId, skill and scheduledAt are required' },
      400,
    )
  }

  // Normalize to a full ISO-8601 instant. A naive local string (the shape
  // <input type="datetime-local"> produces) is ambiguous, so we parse it here
  // and reject anything unparseable rather than letting Prisma fail opaquely.
  const scheduledAt = new Date(body.scheduledAt)
  if (Number.isNaN(scheduledAt.getTime())) {
    return c.json({ error: `Invalid scheduledAt: "${body.scheduledAt}"` }, 400)
  }

  const session = await prisma.session.create({
    data: {
      requestId: body.requestId, teacherId: body.teacherId, learnerId: body.learnerId,
      skill: body.skill, scheduledAt: scheduledAt.toISOString(),
      durationMin: body.durationMin ?? 60, mode: body.mode ?? 'online', status: 'scheduled',
    },
  })

  const readable = scheduledAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  await notify(
    body.teacherId, 'session', 'Session scheduled',
    `${body.skill} on ${readable}`,
  )
  await notify(
    body.learnerId, 'session', 'Session scheduled',
    `${body.skill} on ${readable}`,
  )

  return c.json({ ok: true, session })
})

/** Complete a session: award credits, bump counters and progress. */
app.patch('/swap/sessions/:id/complete', async (c) => {
  const id = c.req.param('id')
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.status === 'completed') return c.json({ error: 'Session already completed' }, 409)

  const credits = Math.round((session.durationMin / 30) * CREDITS_PER_30MIN)

  const updated = await prisma.session.update({
    where: { id },
    data: { status: 'completed', creditsAwarded: credits },
  })

  await prisma.student.update({
    where: { id: session.teacherId },
    data: { credits: { increment: credits }, sessionsDone: { increment: 1 } },
  })
  await prisma.student.update({
    where: { id: session.learnerId },
    data: { sessionsDone: { increment: 1 } },
  })

  await bumpProgress(session.learnerId, session.skill, Number((session.durationMin / 60).toFixed(1)))
  await bumpProgress(session.teacherId, session.skill, 0)

  await notify(
    session.teacherId, 'credit', `+${credits} credits earned`,
    `${session.skill} session complete.`,
  )
  await notify(
    session.learnerId, 'session', 'Session complete',
    `You finished ${session.skill}. Leave a review for your mentor.`,
  )

  return c.json({ ok: true, session: updated, creditsAwarded: credits })
})

app.patch('/swap/sessions/:id/cancel', async (c) => {
  const id = c.req.param('id')
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) return c.json({ error: 'Session not found' }, 404)

  const updated = await prisma.session.update({ where: { id }, data: { status: 'cancelled' } })
  return c.json({ ok: true, session: updated })
})

app.post('/swap/reviews', async (c) => {
  const body = await c.req.json<{
    sessionId: string; reviewerId: string; communication: number; knowledge: number;
    reliability: number; quality: number; comment?: string
  }>()

  if (!body.sessionId || !body.reviewerId) {
    return c.json({ error: 'sessionId and reviewerId are required' }, 400)
  }

  const session = await prisma.session.findUnique({ where: { id: body.sessionId } })
  if (!session) return c.json({ error: 'Session not found' }, 404)
  if (session.status !== 'completed') {
    return c.json({ error: 'You can only review completed sessions' }, 409)
  }

  const duplicate = await prisma.review.findUnique({ where: { sessionId: body.sessionId } })
  if (duplicate) return c.json({ error: 'This session has already been reviewed' }, 409)

  const revieweeId = session.teacherId === body.reviewerId ? session.learnerId : session.teacherId

  const review = await prisma.review.create({
    data: {
      sessionId: body.sessionId, reviewerId: body.reviewerId, revieweeId,
      communication: body.communication ?? 5, knowledge: body.knowledge ?? 5,
      reliability: body.reliability ?? 5, quality: body.quality ?? 5,
      comment: body.comment ?? '',
    },
  })

  await recomputeRating(revieweeId)
  await notify(revieweeId, 'info', 'New review received', body.comment?.slice(0, 80) ?? '')

  return c.json({ ok: true, review })
})

app.patch('/swap/students/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<{
    bio?: string; year?: string; availability?: string; preferredMode?: string
  }>()

  const student = await prisma.student.update({
    where: { id },
    data: {
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.availability !== undefined && { availability: body.availability }),
      ...(body.preferredMode !== undefined && { preferredMode: body.preferredMode }),
    },
  })

  return c.json({ ok: true, student })
})

app.post('/swap/skills', async (c) => {
  const body = await c.req.json<{
    studentId: string; skillName: string; kind: string; level?: string
  }>()

  if (!body.studentId || !body.skillName?.trim() || !body.kind) {
    return c.json({ error: 'studentId, skillName and kind are required' }, 400)
  }
  if (!['teach', 'learn'].includes(body.kind)) {
    return c.json({ error: 'kind must be "teach" or "learn"' }, 400)
  }

  const name = body.skillName.trim()
  await ensureSkill(name)

  const existing = await prisma.studentSkill.findUnique({
    where: { studentId_skillName_kind: { studentId: body.studentId, skillName: name, kind: body.kind } },
  })
  if (existing) return c.json({ error: 'You already listed this skill' }, 409)

  const skill = await prisma.studentSkill.create({
    data: {
      studentId: body.studentId, skillName: name, kind: body.kind,
      level: body.level ?? 'intermediate',
    },
  })

  if (body.kind === 'learn') {
    await prisma.progressEntry.upsert({
      where: { studentId_skill: { studentId: body.studentId, skill: name } },
      create: { studentId: body.studentId, skill: name, level: 'beginner', hours: 0, sessions: 0 },
      update: {},
    })
  }

  return c.json({ ok: true, skill })
})

app.delete('/swap/skills/:id', async (c) => {
  const id = c.req.param('id')
  await prisma.studentSkill.delete({ where: { id } })
  return c.json({ ok: true })
})

app.post('/swap/notifications/read', async (c) => {
  const body = await c.req.json<{ studentId: string }>()
  if (!body.studentId) return c.json({ error: 'studentId is required' }, 400)

  await prisma.notification.updateMany({
    where: { studentId: body.studentId, read: false },
    data: { read: true },
  })
  return c.json({ ok: true })
})

/** Wipes every SkillSwap table and reseeds. Prototype-only escape hatch. */
app.post('/reset', async (c) => {
  await prisma.message.deleteMany()
  await prisma.review.deleteMany()
  await prisma.session.deleteMany()
  await prisma.swapRequest.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.progressEntry.deleteMany()
  await prisma.studentSkill.deleteMany()
  await prisma.student.deleteMany()
  await prisma.skill.deleteMany()

  const res = await app.request('/seed', { method: 'POST' })
  const payload = await res.json()

  return c.json({ ok: true, ...payload })
})

export default app
