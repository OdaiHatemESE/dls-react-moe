# Copilot Instructions for this Repo

These notes help AI agents work productively in this codebase. Keep answers concrete and aligned to the repo's actual patterns.

## Architecture at a glance
- Framework: Next.js App Router (directory `app/`) with server and client components. Styling via TailwindCSS.
- Auth: NextAuth using an OIDC/Auth0 provider plus a Credentials provider for mobile tokens. Config lives in `lib/auth.ts`, wired via API route `app/api/auth/[...nextauth]/route.ts`.
- Data: 
  - OneRoster vendor APIs are accessed server-side through `lib/oneroster.ts` (token exchange + typed fetch wrapper `orFetch`).
  - Redis (ioredis) is used for small secret storage and caching of access tokens (`lib/redis.ts`).
  - Prisma ORM targets Microsoft SQL Server. Schema in `prisma/schema.prisma`. Client is imported from `@prisma/client` via `lib/prisma.ts`.
- Client data fetching: SWR with centralized config in `lib/swr.ts` and provider `app/components/SWRProvider.tsx`.
- UI shell: `app/layout.tsx` composes ThemeProvider, AuthProvider, I18nProvider, SWRProvider, and shared chrome (VerticalHeader, Footer, Mobile nav).

## Key conventions and patterns
- Server-only utilities: `lib/oneroster.ts` enforces server-only usage and never caches via Next.js route cache (`cache: "no-store"`).
- Token handling: Large access tokens are stored in Redis and referenced in JWT via a small key (`atKey`) to avoid oversized cookies. See JWT/session callbacks in `lib/auth.ts`.
- OneRoster helpers: Use `orFetch<T>(path, kind)` for authenticated vendor calls. It retries once on 401/403 by invalidating the in-memory token cache.
- SWR: Import `jsonFetcher` from `lib/swr.ts`. The app disables refetch-on-focus and errors are thrown as parsed JSON when possible.
- API routes are colocated under `app/api/**/route.ts`. Some routes include README docs (e.g., `app/api/oneroster/*/README.md`). Prefer keeping response shapes close to the vendor unless there’s a deliberate normalization layer.
- Prisma: Default generator outputs to `node_modules/@prisma/client`; import with `import { PrismaClient } from "@prisma/client"`. The singleton is created in `lib/prisma.ts` to avoid hot-reload connection storms.

## Environment and secrets
- Auth/OneRoster env variables are defined in `.env.local` and `.env.local.example`. Notable ones:
  - NEXTAUTH_URL, NEXTAUTH_SECRET
  - AUTH0_ISSUER/CLIENT_ID/CLIENT_SECRET (or OIDC_* equivalents)
  - ONEROSTER_AUTH_URL, ONEROSTER_BASE, plus READ/WRITE credentials
  - DATABASE_URL (SQL Server, semicolon-separated kv: `sqlserver://host:1433;database=DB;user=U;password=P;encrypt=true;...`)
- Prisma CLI reads `.env` by default; for local-only values copy `.env.local` to `.env` when running prisma commands or set env in shell.

## Developer workflows
- Start dev server (port 4200): `npm run dev` (Turbopack enabled).
- Build/start: `npm run build` / `npm start`.
- Prisma:
  - Generate client: `npm run prisma:generate`
  - Introspect existing DB: temporarily `cp .env.local .env` then `npm run prisma:pull`
  - Migrations (if creating schema): `npm run prisma:migrate`
- Debug DB connectivity: call `GET /api/db/health` (query `SELECT 1`).
- Lint: `npm run lint`.

## Data flow examples
- Auth flow: User authenticates via OIDC; access_token is stored in Redis (`lib/redis.ts`) and referenced in JWT as `atKey`. Session payload is trimmed to essentials (id, name, email, optional emiratesId). See `lib/auth.ts`.
- OneRoster lookups: Routes under `app/api/oneroster/**` call helpers from `lib/oneroster.ts`. For example, `schoolenrollments` fetches enrollment data for students.
- Client fetching: Components use SWR with `jsonFetcher` and read API JSON directly.

## Coding tips for agents
- Prefer `orFetch` for vendor calls; don’t reimplement token exchange. Respect `cache: "no-store"` for these calls.
- When touching `lib/auth.ts`, maintain the Redis token indirection to keep cookies small. Avoid embedding large tokens in session.
- Keep API routes dynamic unless you have safe caching semantics.
- For Prisma with SQL Server, use Int types with `@default(autoincrement())` and avoid JSON columns. Use string columns for JSON blobs.
- When adding new API routes, colocate a brief README if the route has external consumers; follow the examples in `app/api/oneroster/*/README.md`.

## Important files
- Auth: `lib/auth.ts`, `app/api/auth/[...nextauth]/route.ts`
- OneRoster data layer: `lib/oneroster.ts`
- DB: `prisma/schema.prisma`, `lib/prisma.ts`
- API routes: `app/api/**/route.ts` (see `oneroster/*` for patterns)
- Client data config: `lib/swr.ts`, `app/components/SWRProvider.tsx`
- App chrome and providers: `app/layout.tsx`

## Gotchas
- Prisma CLI uses `.env`, not `.env.local`. Copy or export vars when running Prisma.
- If you see P1000 during `prisma db pull`, credentials or permissions on SQL Server are invalid. The app health route can still confirm basic connectivity.
- Don’t import server-only modules into client components (e.g., `lib/oneroster.ts`). Keep server code in API routes or server components.


