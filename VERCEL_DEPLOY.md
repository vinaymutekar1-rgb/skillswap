# Deploy SkillSwap to Vercel

This project is a Vite + React frontend with a Hono API and Prisma/libSQL database.

## Vercel routing fix

- `src/index.ts` is the default-exported Hono entry point detected by Vercel.
- The frontend is built into `public/`, which Vercel serves from its CDN.
- API endpoints are available under `/api/*`, including `/api/health`.
- Do not add a separate `api/[...path].ts` catch-all function; the Hono app owns the API routes.

## Vercel project settings

Import the repository and set the Root Directory to the folder containing this `package.json` (usually `./` if the repository contains the contents of the `skillswap` folder). The included `vercel.json` selects the Hono framework, Bun `1.x`, runs `bun install`, and builds with `bun run build`. Leave Output Directory unset: Vercel serves `public/` assets alongside the Hono application.

If Vercel shows a Framework Preset selector, use Hono when available; otherwise leave framework detection on automatic. Do not set the project to Vite-only because the API is served by Hono.

## Database setup (required for app data)

Vercel Functions cannot keep a persistent local SQLite file. Use a remote Turso/libSQL database and configure both environment variables in Vercel for Production, Preview, and Development as needed:

- `DATABASE_URL`: `libsql://<your-database>.turso.io`
- `DATABASE_AUTH_TOKEN`: the database auth token

The Prisma schema is in `prisma/schema.prisma`. Create the tables once before using app data:

1. From the project root, generate the SQL file:

   ```bash
   bunx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/init.sql
   ```

2. Apply it to your Turso database (replace the name with your database name):

   ```bash
   turso db shell YOUR_DATABASE_NAME < prisma/init.sql
   ```

3. Add the database URL and token to Vercel and redeploy. Do not commit the token, `prisma/init.sql` if it contains anything sensitive, or any `.env` file.

The API health route intentionally does not require the database, so it can verify Vercel routing before database setup:

`https://YOUR-DOMAIN/api/health`

Expected response when the API is deployed:

```json
{"ok":true,"service":"skillswap","databaseConfigured":false}
```

After setting both database environment variables and redeploying, `databaseConfigured` should be `true`. If it is `false`, check the exact variable names and redeploy. If `/api/health` still returns Vercel's platform 404 page, Vercel is not building this repository root as the Hono project: confirm Root Directory points to this folder and that `src/index.ts` is committed.

## First deployment checklist

1. Push all files from this folder to the Git repository.
2. Confirm Vercel Root Directory contains `package.json`, `vercel.json`, `src/index.ts`, and `prisma/schema.prisma`.
3. Redeploy and check `/api/health`.
4. Configure the Turso environment variables and create the tables from the Prisma schema.
5. Redeploy and check `/api/bootstrap`.
