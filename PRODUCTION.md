# Meridian Production Readiness

## Free Deployment Target

For a free deployment, use one Vercel project plus a Supabase Free Postgres database.

Vercel hosts:

- the Vite frontend from `frontend/dist`
- the Express API through `api/[...path].js`

Supabase provides:

- `DATABASE_URL` for Prisma/Postgres

## Render Deployment Target

The included `render.yaml` provisions:

- `meridian-backend`: Node/Express API
- `meridian-frontend`: Vite static site
- `meridian-db`: managed PostgreSQL database

## Required Environment

Backend:

- `DATABASE_URL`: PostgreSQL connection string
- `FRONTEND_URL`: deployed frontend origin
- `JWT_SECRET`: long random access-token signing secret
- `JWT_REFRESH_SECRET`: long random refresh-token signing secret
- `NODE_ENV=production`

Frontend:

- `VITE_API_URL`: use `/api` on Vercel, or a full backend URL if frontend/backend are deployed separately

## Vercel + Supabase Setup

1. Create a free Supabase project.
2. Copy the Supabase pooled Postgres connection string into Vercel as `DATABASE_URL`.
3. Add `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`, and `NODE_ENV=production` in Vercel.
4. Set `VITE_API_URL=/api` in Vercel.
5. Run Prisma migrations against Supabase once from a trusted local machine or CI:

```sh
npm run migrate:deploy --workspace backend
```

6. Deploy the GitHub repo to Vercel.

## Release Checks

Run from the repository root:

```sh
npm run check
```

That command runs frontend lint, frontend production build, and backend production build.

For a fresh production database, Render runs:

```sh
npm run build && npm run migrate:deploy
```

from the backend service root.

## Notes

- Production uses PostgreSQL through Prisma. Local SQLite database files are ignored and should not be deployed.
- The backend fails fast in production if JWT secrets are missing.
- Seed data is intended only for demo/staging environments. Do not seed production with the bundled demo credentials.
