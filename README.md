# Meridian — Goal Setting & Tracking Portal

A polished, role-based goal management platform for planning, tracking, and reviewing employee performance across the appraisal cycle.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success?style=for-the-badge)](https://meridian-atom-quest-frontend.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-96%25-blue?style=for-the-badge)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-Fast%20Frontend-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-API-black?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)

## Overview

Meridian is a modern goal-setting and performance tracking portal designed for structured appraisal workflows. It supports employees, managers, and administrators with a shared system for creating goals, submitting check-ins, reviewing progress, and managing appraisal cycles.

The application pairs a highly visual React frontend with a TypeScript Express backend and Prisma-powered PostgreSQL persistence. The UI is intentionally crafted with a refined, editorial style to make performance tracking feel more intuitive and less transactional.

## Key Features

### Employee Workspace
- Create and manage individual goals
- Track quarterly progress in a spatial goal field view
- View goals in list or timeline mode
- Submit goal sheets once weightage totals are valid
- Inspect progress scores, comments, and check-in history

### Manager Review Console
- Review submitted employee goal sheets
- Approve or return sheets with feedback
- Add comments to individual check-ins
- Update goal target values inline
- Push shared goals across team members
- Export achievement data for reporting
- Monitor compliance logs and review activity

### Admin Operations Panel
- Create and manage appraisal cycles
- Switch active appraisal phases
- Adjust cycle windows and activation state
- Explore department-level performance analytics
- Review goal and sheet status distributions

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Framer Motion
- Recharts
- Tailwind CSS
- Lucide Icons

### Backend
- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- CORS, Helmet, cookie parsing, and rate limiting

## Repository Structure

```text
.
├── frontend/        # React + Vite client
├── backend/         # Express + Prisma API
├── api/             # Serverless/API integration assets
├── FULL_PRD.md      # Product requirements and workflow design
├── PRODUCTION.md    # Deployment and environment guide
├── render.yaml      # Render deployment definition
├── vercel.json      # Vercel deployment definition
└── package.json     # Workspace scripts
```

## Application Areas

### 1. Goal Setting
Employees can create goals with defined weightage, thrust area, and unit-of-measurement tracking. The system ensures allocation totals are valid before submission.

### 2. Check-ins and Progress
Each goal can include check-in updates with computed progress scores, manager comments, and status signals such as on track, at risk, complete, or not started.

### 3. Review Workflow
Managers can review submitted sheets, return them with remarks, approve them, and maintain an audit-friendly change history.

### 4. Cycle Administration
Admins can manage the appraisal calendar, activate cycles, and move through phases such as goal setting and quarterly reviews.

## Getting Started

### Prerequisites
- Node.js 22+
- npm
- PostgreSQL database

### Install Dependencies

```sh
npm install
```

### Run the Frontend

```sh
npm run dev --workspace frontend
```

### Run the Backend

```sh
npm run dev --workspace backend
```

### Build for Production

```sh
npm run check
```

This runs:
- frontend lint
- frontend production build
- backend production build

## Environment Variables

### Backend
- `DATABASE_URL` — PostgreSQL connection string
- `DIRECT_URL` — direct PostgreSQL connection string for Prisma migrations
- `FRONTEND_URL` — deployed frontend origin
- `JWT_SECRET` — access token secret
- `JWT_REFRESH_SECRET` — refresh token secret
- `NODE_ENV=production`

### Frontend
- `VITE_API_URL` — API base URL

## Deployment

Meridian is ready for modern hosting workflows:

- **Vercel + Supabase** for a free deployment path
- **Render** for a full stack deployment with managed PostgreSQL

See `PRODUCTION.md` for detailed setup instructions.

## Documentation

- `FULL_PRD.md` — complete product plan and workflow vision
- `PRODUCTION.md` — production and deployment notes

## Live Demo

The application is currently hosted at:

**https://meridian-atom-quest-frontend.vercel.app**

## Description

Meridian is a goal setting and performance tracking portal for employee appraisal workflows, built with a TypeScript React frontend and an Express/Prisma backend.

## License

ISC
