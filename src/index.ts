// Shared Hono application for Vercel and local development.
// Vercel recognizes src/index.ts as a Hono entry point and routes requests here.
import { Hono } from 'hono'
import customRoutes from '../custom-routes'
import { createToolsHandlers } from '@shogo-ai/sdk/tools/server'

const app = new Hono()

app.use('*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*')
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (c.req.method === 'OPTIONS') return c.body(null, 204)
  await next()
})

// Keep the health endpoint independent of the database so deployment routing
// can be tested before a remote database has been connected.
app.get('/api/health', (c) => c.json({
  ok: true,
  service: 'skillswap',
  databaseConfigured: Boolean(process.env.DATABASE_URL && process.env.DATABASE_AUTH_TOKEN),
}))

// A serverless deployment must use a remote database. Return an actionable
// setup error instead of an opaque Prisma failure when those variables are absent.
app.use('/api/*', async (c, next) => {
  if (c.req.path === '/api/health') return next()
  if (process.env.VERCEL && (!process.env.DATABASE_URL || !process.env.DATABASE_AUTH_TOKEN)) {
    return c.json({
      error: 'Database is not configured. Add DATABASE_URL and DATABASE_AUTH_TOKEN in Vercel Project Settings → Environment Variables, then redeploy.',
    }, 503)
  }
  await next()
})

app.route('/api', customRoutes)

const tools = createToolsHandlers({})
app.post('/api/tools/execute', (c) => tools.execute(c.req.raw))
app.get('/api/tools/schemas', (c) => tools.list(c.req.raw))

app.notFound((c) => c.json({ error: `Not found: ${c.req.method} ${c.req.path}` }, 404))
app.onError((error, c) => {
  console.error('SkillSwap API error:', error)
  return c.json({ error: 'Internal server error' }, 500)
})

export default app
