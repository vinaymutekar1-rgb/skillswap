// Local development API server. Vercel uses src/index.ts directly.
import app from './src/index'

const port = Number(process.env.PORT) || 3001
console.log(`SkillSwap API running on http://localhost:${port}`)

Bun.serve({ port, fetch: app.fetch })
