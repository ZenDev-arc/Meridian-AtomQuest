# Meridian Production Readiness

## Deployment Target

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

- `VITE_API_URL`: deployed backend API URL, ending in `/api`

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
