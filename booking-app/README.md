# Fieldbase

The operating system for field service businesses — landscaping, window cleaning, pool service, pest control, detailing, and any other trade that runs on a calendar.

Built with **Vite + React (JS) + Tailwind + Firebase**, with **Vercel serverless functions** powering the AI features (Anthropic Claude).

## Features

- **Today / dashboard** — control-center view with stats, today's route, and crew workload
- **Shared calendar** — week view, multi-worker filter, color-coded by lead
- **Bookings** — searchable list with status pills, detail modal, full CRUD
- **Clients CRM** — contacts, tags, notes, full job history, revenue total
- **Workers** — add/remove crew, skills, colors, availability surfaces on the shared calendar
- **Services** — per-trade menu with duration, price, and active toggle
- **Public booking page** at `/book/<slug>` — quick-book flow OR AI chat that proposes service + time
- **AI dispatcher (`/api/ai-schedule`)** — reorder and assign today's stops to minimize driving
- **AI chat assistant (`/api/ai-chat`)** — natural-language booking for customers
- **Demo mode** — runs out of the box without any keys; data persists to `localStorage`

## Industries shipped with templates

Landscaping · Window cleaning · House cleaning · Pool service · Pest control · Pressure washing · Handyman · Mobile auto detailing

## Quick start

```bash
cd ~/Projects/booking-app
npm install
npm run dev
```

Open http://localhost:5173. Sign up with anything — without Firebase keys, the app runs in demo mode and stores data locally.

## Configure Firebase (optional but recommended for production)

1. Create a project at https://console.firebase.google.com
2. Enable **Authentication → Email/Password**
3. Enable **Firestore Database**
4. Project settings → Web app → copy config values into `.env`:

```bash
cp .env.example .env
# Fill in VITE_FIREBASE_* values
```

## Configure AI features

1. Get an Anthropic API key from https://console.anthropic.com
2. Add to `.env`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Note: this variable has no `VITE_` prefix on purpose. It is only ever read by the serverless functions in `/api`, so it never ships to the browser.

## Deploy to Vercel

```bash
# from the project root
npx vercel
# follow prompts; add env vars in the Vercel dashboard
```

Or push to GitHub and import the repo in the Vercel dashboard. In **Project Settings → Environment Variables** add:
- `VITE_FIREBASE_*` values (all six)
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (optional, defaults to `claude-haiku-4-5-20251001`)

Vercel will detect the Vite app automatically. The `/api` folder ships as serverless functions.

## Project structure

```
booking-app/
├─ api/                      # Vercel serverless functions (AI)
│  ├─ ai-chat.js             # public booking chat assistant
│  └─ ai-schedule.js         # dispatcher / route optimizer
├─ public/
│  └─ favicon.svg
├─ src/
│  ├─ App.jsx                # router
│  ├─ main.jsx
│  ├─ firebase.js
│  ├─ context/               # AuthContext, BusinessContext
│  ├─ data/                  # mock seed data, business-type templates
│  ├─ lib/                   # format helpers, routing heuristics
│  ├─ components/            # Sidebar, TopBar, Modal, CalendarGrid, etc.
│  └─ pages/                 # Landing, Login, Signup, Dashboard, Calendar,
│                            #   Bookings, Workers, Clients, ClientDetail,
│                            #   Services, Settings, PublicBooking, NotFound
├─ ios/                      # SwiftUI crew companion app (open in Xcode)
├─ vercel.json
├─ vite.config.js
├─ tailwind.config.js
└─ package.json
```

## How the design is "unique"

Most competitors (Jobber, Housecall Pro, Service Fusion) lean into the typical corporate SaaS aesthetic — blue + white, dense tables, lots of nested menus. Fieldbase goes the other direction:

- **Editorial display serif** (Instrument Serif) for headers paired with Inter for body — magazine, not spreadsheet
- **Warm amber accent** against deep ink slate, not stock blue
- **Generous spacing**, large numbers in stat cards, single-purpose pages
- **Control-center "Today" view** as the homepage — not a generic calendar dump
- **Conversational AI booking page** for customers, alongside the standard quick-book flow

## What's missing for full production (intentionally)

This is a strong foundation. Real-world rollout would still need:

- Server-side Firestore security rules (currently relies on Firebase Auth + sensible defaults)
- Payment integration (Stripe Connect — deposits, invoicing, tips)
- SMS notifications (Twilio — 30-min-out heads-up to customers)
- Email reminders + receipts (Resend or SendGrid)
- Google Maps Distance Matrix for true route optimization (currently a heuristic)
- Multi-tenant isolation: scoping all Firestore writes by businessId
- The iOS crew app (`ios/`) is a scaffold — needs your Firebase config and Apple Developer account to ship

These are intentionally not built — they each involve real money (Stripe accounts, Twilio numbers, Apple Developer fees) and should be set up with your specific credentials.

## License

MIT — yours to take and run with.
