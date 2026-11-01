# SkillSwap — Campus Skill Exchange

> **Learn anything. Teach anything. No money required.**

SkillSwap is a student-to-student skill exchange platform. Students list what they can teach and what they want to learn, get matched by a real scoring algorithm, and swap knowledge directly — no fees, no middleman.

This is a **full-stack application**: React 19 front end, a Hono API, and a Prisma/SQLite database. Every feature is wired end to end — matches are computed server-side, credits are awarded on completion, ratings are recomputed from actual reviews.

---

## Quick start

```bash
bun install
bun run db:push        # create the SQLite database from prisma/schema.prisma
bun run generate       # generate the typed CRUD routes + API client
bun run dev:full       # API on :3001, Vite dev server on :3000
```

Then seed the demo data:

```bash
curl -X POST http://localhost:3001/api/seed
```

Open **http://localhost:3000**.

> The database starts empty. If you load the app before seeding, the client seeds automatically on first request — the `curl` above just does it eagerly.

**Requires** [Bun](https://bun.sh) ≥ 1.1 (the API server runs on `Bun.serve`). Node alone will not run `server.tsx`.

---

## What actually works

| Feature | Behaviour |
|---|---|
| **Skill listing** | Add/remove skills you teach or want to learn, with level |
| **Smart matching** | Six-factor weighted score computed on the server |
| **Swap requests** | Send → accept/decline → chat → schedule. Duplicates and self-requests rejected |
| **Chat** | Per-swap threads, persisted, one thread per active swap |
| **Sessions** | Book with date, duration, mode. Duration determines the credit payout |
| **Credits** | `5 credits per 30 minutes`, awarded to the teacher on completion |
| **Reviews** | 4-category star ratings, one per session, enforced unique |
| **Ratings** | Recomputed from real review rows — never hardcoded |
| **Progress** | Learner's skill advances beginner → intermediate → advanced by session count |
| **Leaderboard** | Ranked by derived credits, not stored counters |
| **Notifications** | Created server-side on request, accept, message, session, credit events |

### The matching algorithm

`custom-routes.ts` → `scoreMatches()`. A candidate only appears if they can teach something you want to learn. Scores are weighted:

| Factor | Max | Logic |
|---|---|---|
| Mutual exchange | 30 | Both directions covered (one-way scores 14) |
| Skill level fit | 20 | Closer level pairing scores higher |
| Availability overlap | 15 | Shared days in the availability string |
| Mode preference | 10 | Matching or flexible mode |
| Rating & activity | 15 | Peer rating plus completed sessions |
| Campus relevance | 10 | Same institution |

Scores are clamped to 0–99 and sorted. The client never sends a score — `POST /api/swap/requests` recomputes it so a tampered request can't inflate its own match.

---

## Demo accounts

Eight seeded students. Switch between them from the account selector at the bottom of the sidebar (desktop) or in the top bar (mobile) — the whole dashboard changes.

| Student | Teaches | Wants to learn |
|---|---|---|
| **Arjun Mehta** | Python, Data Structures | UI/UX Design |
| **Karan Shah** | Business Strategy, Marketing | Python |
| **Sneha Iyer** | UI/UX Design, Figma | Data Structures |
| **Rajeev Nair** | Electronics, Arduino | Marketing |
| **Priya Kapoor** | Photography, Lightroom | Business Strategy |
| **Rohit Verma** | Public Speaking | Python |
| **Anjali Desai** | Finance, Excel | UI/UX Design |
| **Nikhil Rao** | Full-stack Development, React | Finance |

Seeded history includes 36 completed sessions with reviews, so credits, ratings and the leaderboard are all derived from real records rather than invented numbers.

### Suggested walkthrough

1. Sign in as **Arjun Mehta**
2. **Matches** → Sneha Iyer appears as a two-way match
3. **Request swap** → send it
4. Switch to **Sneha Iyer** → **Requests** → **Accept**
5. **Messages** → the thread is live
6. **Sessions** → schedule a 60-minute session
7. **Complete** it → 10 credits land on the teacher's balance
8. **Review** it → the mentor's rating recomputes
9. Check **Progress** and **Contributors** — both reflect the new record

---

## Project structure

```
├── index.html                  Vite entry
├── package.json
├── prisma/
│   └── schema.prisma           10 models: Student, Skill, StudentSkill,
│                               SwapRequest, Message, Session, Review,
│                               ProgressEntry, Notification, User
├── prisma.config.ts            Datasource URL (SQLite)
├── custom-routes.ts            ALL domain logic + the matching engine
├── server.tsx                  Hono server (generated — see note below)
├── shogo.config.json           Codegen config for routes/types/API client
└── src/
    ├── App.tsx                 Tab router + loading/error states
    ├── index.css               Design system (.ss-* classes)
    ├── lib/
    │   ├── api.ts              Typed fetch wrapper, surfaces server errors
    │   ├── store.tsx           Context store: bootstrap + mutation helper
    │   ├── types.ts            Domain types
    │   ├── nav.ts              Tab ids
    │   └── db.ts               Prisma client singleton
    └── components/skillswap/
        ├── Shell.tsx           Sidebar, top bar, mobile nav + overflow sheet
        ├── Dashboard.tsx       Greeting, stats, hero match, activity
        ├── Matches.tsx         Scored match cards + request composer
        ├── SkillBoard.tsx      Browse everyone who teaches
        ├── Requests.tsx        Incoming / sent / active
        ├── Messages.tsx        Thread list + conversation
        ├── Sessions.tsx        Book, complete, cancel, review
        ├── Credits.tsx         Balance + credit history
        ├── Progress.tsx        Per-skill milestones
        ├── Leaderboard.tsx     Campus contributors
        ├── Profile.tsx         Editable profile + skill management
        └── shared.tsx          Avatar, StatCard, Modal, SkillChip, Toasts
```

---

## API

All routes are mounted under `/api`.

### Reads

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/bootstrap?studentId=` | Everything the UI needs for one student in one round trip |
| `GET` | `/matches?studentId=` | Ranked matches with score and reasons |
| `GET` | `/health` | Health check |

### Writes

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/seed` | Idempotent demo seed |
| `POST` | `/reset` | Wipe and reseed |
| `POST` | `/swap/requests` | Send a request (score computed server-side) |
| `PATCH` | `/swap/requests/:id` | accept / reject / cancel |
| `POST` | `/swap/messages` | Send a message |
| `POST` | `/swap/sessions` | Schedule a session |
| `PATCH` | `/swap/sessions/:id/complete` | Complete + award credits |
| `PATCH` | `/swap/sessions/:id/cancel` | Cancel |
| `POST` | `/swap/reviews` | Review a completed session |
| `PATCH` | `/swap/students/:id` | Update profile |
| `POST` | `/swap/skills` | Add a teach/learn skill |
| `DELETE` | `/swap/skills/:id` | Remove a skill |
| `POST` | `/swap/notifications/read` | Mark all read |

**Why `/swap/*`?** `server.tsx` mounts generic CRUD routes for every Prisma model *before* the custom routes, and Hono matches in registration order. `/api/sessions`, `/api/messages` and `/api/reviews` are therefore already taken by generic handlers — the namespace keeps the domain-enforcing versions from being silently shadowed. This was a real bug caught during testing: `POST /api/sessions` was hitting the generic handler and returning a raw Prisma error instead of a validated 400.

---

## Design

Midnight anime-campus aesthetic: deep navy base, aurora neon accents, glass surfaces.

- Violet `#8b6cff` · Cyan `#56d9ff` · Pink `#ff79be` · Mint `#5be0af`
- Inter, 400–800
- Utility classes live in `src/index.css` under `.ss-*`
- Mobile-first: bottom navigation plus an overflow sheet, verified at 390px with zero horizontal overflow

---

## Regenerating the API surface

`server.tsx` and everything in `src/generated/` are produced by the Shogo SDK codegen from `prisma/schema.prisma`:

```bash
bun run generate
```

Run it after any schema change. Don't hand-edit those files — they are overwritten. Put business logic in `custom-routes.ts`, which is never regenerated.

---

## Known limitations

This is a prototype, and it says so honestly:

- **No authentication.** The account switcher is a demo device; there are no sessions, passwords, or identity checks. Any client can claim to be any student.
- **No authorization.** The API trusts the `studentId` in the payload. Production needs server-verified identity per request.
- **SQLite.** Fine for a prototype; swap the datasource for Postgres before multi-user deployment.
- **No real-time.** Chat refreshes on mutation rather than over a socket.
- **No pagination.** `/bootstrap` returns the full dataset — fine for 8 students, not for 8,000.
- TypeScript reports errors inside `src/generated/*` (SDK generics vs. Prisma 7 types). Application code is clean.

`standalone/` holds the original single-file HTML prototypes, kept for reference only — they have no backend and store data in `localStorage`.

---

## License

MIT — see [LICENSE](LICENSE).

---

<p align="center"><strong>SkillSwap</strong> — your next skill is already on campus.</p>
