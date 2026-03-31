# CAP Scoring System

## Project Overview
Scoring app for CAP endurance rowing events. Teams of 4 compete over 6 hours — each hour they do a 5km run loop then row for the remaining time. Only rowing distance is scored.

- **Live URL:** https://cap-scoring.vercel.app
- **GitHub:** https://github.com/scbayvel-CAP/cap-scoring
- **Stack:** Next.js 14 (App Router), TypeScript, Supabase (Postgres + Auth + Realtime), Tailwind CSS, Vercel
- **PWA:** Offline-capable with Dexie (IndexedDB) for score caching

## Key Concepts
- **Teams** identified by `bib_number`. Each team has 6 athlete records in the DB (one per hour 1-6, same bib_number)
- **Scoring:** 1 point per 250m rowed (`Math.floor(meters / 250)`)
- **Station:** Always 1 (Row). No other stations exist
- **Hours 1-6:** Judges submit rowing distance per team per hour. Leaderboard shows H1-H6 columns with points
- **Race type:** Always `'singles'` in DB for compatibility. UI shows "Teams"
- **Team name** stored in `first_name` field of athlete record. `getDisplayName()` handles this

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build (must pass with zero errors before pushing)
- `npm run lint` — ESLint
- `npm run setup-accounts` — provision judge/admin accounts

## Database
- **Supabase project** with RLS enabled
- Migrations in `supabase/migrations/` (001-008). Run manually in Supabase SQL Editor
- Key constraint: `UNIQUE(event_id, bib_number, heat_number)` on athletes table
- Scores linked to athlete_id + station (always 1)

## Architecture
```
src/
  app/              # Next.js App Router pages
    events/[eventId]/  # Admin pages (scoring, athletes, leaderboard, audit-log, photos)
    live/[eventId]/    # Public leaderboard + athlete detail
    dashboard/         # Judge/admin dashboard
    login/             # Auth
  components/        # React components (Leaderboard, ScoreEntry, AthleteForm, etc.)
  hooks/             # Custom hooks (useScores, useAthletes, useEvent, useRole, useOffline)
  lib/
    supabase/        # Client, server, types, queries
    csv/             # CSV/PDF import/export (parser, exporter, validator, types)
    validation/      # Score range validation
    auth/            # Role helpers
```

## Roles
- **Admin:** Full access — manage events, teams, scores, view audit log and photos
- **Judge:** Scoring page only — enter distances per hour, take verification photos

## Important Patterns
- When creating a team, insert 6 athlete records (one per hour) with the same bib_number
- When deleting a team, delete all records matching that bib_number in the event
- Scoring page auto-creates missing hour records if a team only has partial records
- Leaderboard groups athletes by bib_number across all hours
- Photos are required before score entry (verification flow)
- Offline scores save to IndexedDB and sync when back online
