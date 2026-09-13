# Faculty Academic Management System — Frontend

React + **TypeScript** + Vite SPA with **MUI** (Material UI) components and
**Recharts** dashboards. Talks to the backend REST API.

## Prerequisites

- Node.js 18+ (tested on 24)
- The backend running (default `http://localhost:5000`)

## Setup

```bash
cd client
npm install
cp .env.example .env      # adjust if your API runs elsewhere
```

`.env`:

```
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=            # optional; set to enable the Google login button
```

## Run

```bash
npm run dev        # Vite dev server at http://localhost:5173
npm run build      # type-check + production build to dist/
npm run preview    # preview the production build
npm run typecheck  # tsc --noEmit
```

## Structure

```
src/
├── api/          axios client (token refresh interceptor) + per-domain API modules
├── context/      AuthContext (session bootstrap via refresh cookie, login/logout)
├── components/   AppLayout, ProtectedRoute, AuthShell, StatCard, ChartCard, Loading
├── pages/        Login, Signup, Dashboard, Classrooms, ClassroomDetail, SubjectMarks, Profile
├── types/        DTO types mirroring the API
├── theme.ts      MUI theme
├── main.tsx      providers (theme, router, Google OAuth, auth)
└── App.tsx       routes + guards
```

## Features

- **Auth:** email+password, email OTP, and Google login (all three); self sign-up;
  silent access-token refresh via the httpOnly refresh cookie.
- **Dashboard:** KPI cards + Recharts (section performance, exam trend, pass/fail
  donut, grade distribution) + paginated score-change log.
- **Classrooms → subjects → marks:** editable marks grid with live grade/percentage
  preview, absent handling, bulk save, and **Excel export**.
- **Profile:** edit details, set/change password, view linked login methods.

## Notes

- The API base URL and Google client ID come from `VITE_*` env vars.
- Auth uses a Bearer access token (kept in `localStorage`) plus an httpOnly refresh
  cookie; `withCredentials` is enabled so the cookie flows to `/api/auth/*`.
