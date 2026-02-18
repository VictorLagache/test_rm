# Resource Manager

## Project Overview
A resource management web application inspired by ResourceGuru. Manages people (resources), their assignment to projects via a visual scheduling timeline, and leave/time-off tracking.

## Architecture
- **Monorepo** using npm workspaces: `client/` and `server/`
- **Server**: Express + TypeScript + better-sqlite3 (port 3001)
- **Client**: Vite + React + TypeScript + Tailwind CSS v4 (port 5173, proxies `/api` to 3001)
- **Database**: SQLite file at `server/data/ressource_manager.db`

## Commands
```bash
# Requires Node.js 22 LTS
export PATH="/opt/homebrew/opt/node@22/bin:$PATH"

npm install          # Install all dependencies
npm run dev          # Start both server + client (concurrently)
npm run dev:server   # Start server only
npm run dev:client   # Start client only
npm run seed         # Seed database with sample data
```

## Key Directories
```
server/src/
  db/           # connection.ts, schema.ts, seed.ts
  routes/       # Express routers (resources, projects, bookings, departments, reports)
  services/     # Business logic (CRUD, clash detection, schedule queries, reports)
  middleware/   # errorHandler.ts, validation.ts (Zod)

client/src/
  api/          # Typed API client functions
  components/
    layout/     # Sidebar, PageLayout, PageHeader
    ui/         # Button, Modal, Input, Select, Toast
    schedule/   # ScheduleTimeline, TimelineHeader, ResourceRow, BookingBlock, BookingModal
    resources/  # ResourceModal
    projects/   # ProjectModal
  hooks/        # useScheduleData (React Query)
  pages/        # DashboardPage, SchedulePage, ResourcesPage, ProjectsPage, ReportsPage
  types/        # Shared TypeScript interfaces
  lib/          # Date utilities
```

## API Endpoints
- `GET/POST /api/resources`, `GET/PUT/DELETE /api/resources/:id`
- `GET/POST /api/projects`, `GET/PUT/DELETE /api/projects/:id`
- `GET/POST /api/bookings`, `GET/PUT/DELETE /api/bookings/:id`
- `GET /api/bookings/schedule?start=&end=` — Powers the timeline view
- `GET/POST /api/departments`
- `GET /api/reports/utilization?start=&end=`
- `GET /api/reports/projects?start=&end=`

## Database Schema
- **departments**: id, name
- **resources**: id, first_name, last_name, email, role, department_id, capacity_hours, color, is_active
- **projects**: id, name, client_name, color, start_date, end_date, budget_hours, is_active
- **bookings**: id, resource_id, project_id (nullable), start_date, end_date, hours_per_day, booking_type (project|leave), leave_type (vacation|sick|personal|other), notes

## Key Design Decisions
- `hours_per_day` per booking simplifies clash detection: sum overlapping bookings per day vs resource capacity
- Single `bookings` table for both project bookings and leave, discriminated by `booking_type` with CHECK constraints
- Tailwind CSS v4: uses `@import "tailwindcss"` and `@theme {}` in CSS, NOT `tailwind.config.js`
- `@dnd-kit/utilities` max version is 3.2.2

## Style Guidelines
- TypeScript strict mode
- Zod for API request validation
- React Query for server state management
- Functional components with hooks
- Tailwind utility classes for styling
