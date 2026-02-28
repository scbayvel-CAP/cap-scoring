# CAP 55 Scoring System - Project Status

> **Last Updated:** 2026-02-28
> **Project Location:** `/Users/scottbayvel/Documents/CAP Race/cap-scoring`
> **Live URL:** https://cap-scoring.vercel.app
> **GitHub:** https://github.com/scbayvel-CAP/cap-scoring

---

## NEXT SESSION: Start Here

**Current Status:** App is LIVE and PWA-enabled. Photo verification scoring is simplified and ready. Needs Supabase Storage bucket setup before testing photos.

### Immediate Next: Photo Verification — Infrastructure Setup
Photo verification code is complete (simplified from AI scoring). Before testing, complete these infrastructure steps:

1. **Create Supabase Storage Bucket** — In Supabase Dashboard → Storage → New Bucket:
   - Name: `score-photos`
   - Private bucket (not public)
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`
   - RLS: Authenticated users can upload and read; admins can delete
2. **Run Database Migration** — Execute `supabase/migrations/006_score_photos.sql` against your Supabase database (via Dashboard SQL editor or CLI)
3. **Deploy** — Push to GitHub and verify Vercel deployment succeeds
4. **Test** — Open scoring page on phone, photograph a display, verify photo saves, then enter score manually

### After Infrastructure: Ready For
- **Phase 10** - cap-race.com leaderboard integration
- **Phase 5** - Real event testing (when event data is available)

### Phase 11: Photo Verification Scoring (Simplified) - 2026-02-28
- ✅ **Database migration** - `score_photos` table with RLS policies (migration 006)
- ✅ **API endpoint** - Upload photo to Supabase Storage, insert DB row (`/api/photos/capture`)
- ✅ **PhotoCapture component** - Camera button with states: idle → uploading → done/error
- ✅ **ScoreEntry** - Photo required before score input unlocks (when online). Judge enters score manually.
- ✅ **Scoring page wiring** - Photo state management, photo-to-score linking on submit
- ✅ **Admin photo review** - Filterable grid page (`/events/[eventId]/photos`)
- ✅ **PhotoLightbox** - Full-screen photo viewer with athlete info, pinch-to-zoom
- ✅ **Client-side compression** - Canvas API resize (1200px, JPEG 85%) before upload
- ✅ **Offline fallback** - Photo requirement skipped offline, manual entry works as before
- ✅ **Event page link** - "Score Photos" card added to admin event overview
- ✅ **Removed OpenAI/sharp** - No AI reading; photos are proof/verification backup only
- ✅ **Build passes** - No TypeScript errors

### Scoring Workflow Improvements (Complete) - 2026-02-27
- ✅ **Removed undo toast** - Scores can be edited directly, no need for undo popup
- ✅ **All scores required** - Judges must enter scores for ALL athletes in a heat before submitting
- ✅ **Auto-advance to next heat** - After submit, automatically moves to next heat (Singles 1→12, then Doubles 1→12)
- ✅ **Smart submit button** - Shows contextual labels: missing count, "Submit & Continue to Heat X", or "All Heats Complete"

### Phase 9 Summary (Complete) - Leaderboard Refinements
- ✅ **Show actual distances** - Leaderboard now displays actual distances (e.g., "2,450m") instead of checkmarks
- ✅ **Full station names** - Column headers show Run, Row, Bike, Ski instead of R, R, B, S
- ✅ **Clickable rows** - Click any athlete row to view detailed breakdown
- ✅ **Athlete detail page** - Shows name, bib, ranking, total distance, station breakdown, QR code
- ✅ **Works for both** - Admin and public leaderboards both link to athlete detail

### Phase 8 Summary (Complete) - Scoring UI/UX Redesign
- ✅ **Admin station tabs** - Admins can switch between stations via tab bar
- ✅ **Judge station badge** - Judges see locked station indicator (night-green)
- ✅ **Scoring progress bar** - Shows "X of Y scored" with progress fill
- ✅ **Heat selector buttons** - Replaced dropdowns with segmented button controls
- ✅ **Score card states** - Visual states for empty/editing/saved/pending
- ✅ **Sticky submit button** - Submit footer sticks to bottom while scrolling
- ✅ **Simplified design** - Removed sticky header for more screen space, consistent night-green colors

### Phase 7 Summary (Complete)
- ✅ **Touch targets** - All buttons and inputs now meet 44px+ minimum for mobile
- ✅ **Score entry redesign** - Stacked layout with prominent bib numbers and larger inputs
- ✅ **Visual feedback** - Green border and badge for saved scores, "Changed" indicator for pending
- ✅ **Auto-advance** - Press Enter after score to automatically focus next athlete input
- ✅ **Submit button** - Shows score count, spinner during submit, sticky gradient background
- ✅ **Typography** - Larger text sizes optimized for outdoor/bright light visibility
- ✅ **Range modal** - Stacked buttons on mobile for better touch targets
- ✅ **Simplified judge flow** - Login → Select Event → Scoring (judges only see active events, go direct to scoring)

### Phase 6 Summary (Complete)
- ✅ **CSV/PDF Export** - Admin exports leaderboard results with filters
- ❌ **Undo Score** - REMOVED (scores can be edited directly, undo was unnecessary)
- ✅ **Range Warnings** - Flag unusually high/low distances before save
- ✅ **Audit Log** - Track all score changes (who, when, original/edited values)
- ❌ **Verification Workflow** - REMOVED (over-engineered, slows down live updates)
- ✅ **Loading/Error UX** - Skeleton loaders and React error boundaries

### What's Working Now
- Live at https://cap-scoring.vercel.app
- **PWA installable** - Add to home screen on iOS/Android for native app experience
- 9 user accounts configured (1 admin + 8 judges, 2 per station)
- Role-based access (admin can manage events/athletes, judges can only score)
- **Station locking** - Judges are locked to their assigned station (prevents wrong-station errors)
- **Simplified judge flow** - Login → Select Event → Scoring (no other pages visible)
- Offline score entry with background sync
- Real-time leaderboard updates
- Public leaderboard for athletes (no login required)
- QR codes for individual athlete results
- **CSV bulk import** for athletes (singles + doubles, with validation)
- **CSV templates** available at `templates/singles_template.csv` and `templates/doubles_template.csv`
- **CSV/PDF export** for leaderboard results (admin only, with filters)
- **Range warnings** - Flags unusually high/low distances before saving
- **All scores required** - Judges must score ALL athletes before submitting
- **Auto-advance** - After submit, automatically advances to next heat
- **Audit log** - Complete history of all score changes (admin only)
- **Skeleton loaders** - Loading states show content placeholders instead of blank screens
- **Error boundaries** - Graceful error handling prevents full-page crashes
- **Mobile-optimized scoring** - 44px+ touch targets, auto-advance between inputs, outdoor-friendly typography
- **Scoring progress** - Visual progress bar showing scored/total athletes per heat
- **Sticky submit button** - Submit button stays visible while scrolling through athletes
- **Leaderboard with distances** - Shows actual Run/Row/Bike/Ski distances, not just checkmarks
- **Clickable athlete rows** - Click any row to view detailed station breakdown
- **Photo-first AI scoring** - Judges photograph machine displays, OpenAI Vision reads distances automatically (requires infrastructure setup — see "Start Here")
- **Admin photo review** - Browse all score photos, filter by station/heat, see AI vs judge discrepancies
- **Photo lightbox** - Full-screen photo viewer with zoom, metadata, and value comparison

### Roadmap
1. ~~**Phase 6** - Enhancements (export, validation, audit log, loading/error UX)~~ ✅ COMPLETE
2. ~~**Phase 7** - Scoring UI/UX polish for mobile judges~~ ✅ COMPLETE
3. ~~**Phase 8** - Scoring UI/UX Redesign (station tabs, progress bar, sticky submit)~~ ✅ COMPLETE
4. ~~**Phase 9** - Leaderboard refinements (show distances, clickable rows)~~ ✅ COMPLETE
5. ~~**Scoring Workflow** - All scores required, auto-advance to next heat~~ ✅ COMPLETE
6. ~~**Phase 11** - Photo-First AI Scoring (camera → AI reads distance → auto-fill)~~ ✅ CODE COMPLETE (needs infra setup)
7. **Phase 10** - cap-race.com leaderboard integration ← **NEXT**
8. **Phase 5** - Real event testing (when event data is available)

### Account Credentials

| Role | Email | Password | Station |
|------|-------|----------|---------|
| **Admin** | admin@cap-race.com | CAP55race! | All |
| Judges 1-2 | judge1@cap-race.com, judge2@cap-race.com | CAP55race! | Station 1 (Run) |
| Judges 3-4 | judge3@cap-race.com, judge4@cap-race.com | CAP55race! | Station 2 (Row) |
| Judges 5-6 | judge5@cap-race.com, judge6@cap-race.com | CAP55race! | Station 3 (Bike) |
| Judges 7-8 | judge7@cap-race.com, judge8@cap-race.com | CAP55race! | Station 4 (Ski) |

**To reset/change passwords or stations:** Edit `scripts/setup-accounts.ts` and run `npm run setup-accounts`

---

## Development Phases

### Phase 1: Core Infrastructure ✅ COMPLETE
- [x] Next.js 14 + TypeScript + Tailwind CSS
- [x] Supabase database with real-time subscriptions
- [x] Authentication with protected routes
- [x] Events, Athletes, Scores tables with RLS policies

### Phase 2: Judge & Public Features ✅ COMPLETE
- [x] Score entry interface (select heat + station)
- [x] Real-time leaderboard with filters
- [x] Public leaderboard at `/live/[eventId]`
- [x] Individual athlete result pages
- [x] QR code generation for athletes

### Phase 3: Production Readiness ✅ COMPLETE
- [x] Deployed to Vercel
- [x] CAP brand styling applied
- [x] Offline-first with IndexedDB + background sync
- [x] Role-based access control (admin vs judge)
- [x] Pre-configured judge accounts

### Phase 4: CSV Import ✅ COMPLETE
- [x] Create CSV upload interface on athletes page
- [x] Parse CSV and validate data (with quoted value handling)
- [x] Bulk create athletes in database (batched inserts)
- [x] Support both singles and doubles formats (auto-detected from headers)
- [x] Provide CSV template download (singles_template.csv, doubles_template.csv)
- [x] Validation: required fields, heat range (1-12), gender, age category, duplicate bibs

### Phase 4.5: PWA Conversion ✅ COMPLETE
- [x] Installed and configured @ducanh2912/next-pwa for Next.js 14
- [x] Created manifest.json with CAP branding (dark theme, night-green colors)
- [x] Generated PWA icons (192x192, 512x512, maskable variants, apple-touch-icon)
- [x] Added PWA meta tags to layout.tsx (apple-mobile-web-app-capable, theme-color, etc.)
- [x] Configured service worker with runtime caching (fonts, static assets, images, Supabase API)
- [x] Created offline fallback page at `/offline`
- [x] PWA complements existing Dexie.js offline scoring (no conflicts)
- [x] App installable on iOS Safari ("Add to Home Screen") and Android Chrome

### Phase 5: Real Event Testing ⏸️ ON HOLD
*Waiting for real event data to become available*
- [ ] Create a test event with real athlete data
- [ ] Have judges test score entry on phones
- [ ] Verify leaderboard updates in real-time
- [ ] Test offline mode (airplane mode → enter scores → reconnect)
- [ ] Gather feedback and fix issues

### Phase 6: Enhancements ✅ COMPLETE
- [x] CSV/PDF export for results
- [x] Undo last score submission (60-second window)
- [x] Input validation with range warnings (flag unusually high/low scores)
- [x] Score history/audit log
- [x] Loading skeletons and React error boundaries

### Phase 11: Photo-First AI Scoring ✅ CODE COMPLETE
*Judges photograph machine displays → AI reads distance → auto-fills score*
- [x] `score_photos` database table with RLS (migration 006)
- [x] Photo capture API endpoint (upload + compress + OpenAI Vision)
- [x] PhotoCapture component (camera button, upload, preview, states)
- [x] ScoreEntry redesign (photo integration, AI auto-fill, confidence indicators)
- [x] Scoring page wiring (photo state, photo-score linking on submit)
- [x] Admin photo review page with filters and discrepancy highlighting
- [x] PhotoLightbox for full-screen viewing with AI vs judge comparison
- [x] Client-side and server-side image compression
- [x] Offline fallback (camera disabled, manual entry works)
- [ ] **Infrastructure setup needed:** OpenAI API key, Supabase storage bucket, run migration

### Phase 7: Scoring UI/UX Polish ✅ COMPLETE
*Mobile-first scoring interface optimizations*
- [x] Redesigned score entry cards with stacked layout and prominent bib badges
- [x] All touch targets meet 44px minimum (buttons, inputs, selects)
- [x] Visual feedback: green border + badge for saved, "Changed" indicator for pending
- [x] Auto-advance: Enter key moves focus to next athlete input
- [x] Submit button: shows score count, loading spinner, gradient sticky background
- [x] Undo toast: larger buttons, progress bar at top, better positioning
- [x] Typography optimized for outdoor/bright light visibility (larger text, better contrast)
- [x] Range warning modal: stacked buttons on mobile for better accessibility

---

## Quick Start

### Resume Development
```bash
cd "/Users/scottbayvel/Documents/CAP Race/cap-scoring"
npm run dev
```
Open http://localhost:3000

### Test the App
1. Login as admin: `admin@cap-race.com` / `CAP55race!`
2. Create an event
3. Add athletes to heats
4. Open another browser, login as `judge1@cap-race.com`
5. Enter scores and watch leaderboard update

### Useful Commands
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run setup-accounts   # Reset/recreate judge accounts
```

---

## Technical Reference

### Supabase Project
- **URL:** `https://epfjmbnvtvsnpuaramjj.supabase.co`
- **Dashboard:** https://supabase.com/dashboard
- **Credentials:** Stored in `.env.local`

### Key File Locations

| Purpose | File Path |
|---------|-----------|
| Database migrations | `supabase/migrations/*.sql` |
| TypeScript types | `src/lib/supabase/types.ts` |
| Supabase clients | `src/lib/supabase/client.ts`, `server.ts`, `admin.ts` |
| Auth middleware | `src/middleware.ts` |
| Auth role helpers | `src/lib/auth/role.ts` |
| Offline DB | `src/lib/offline/db.ts` |
| Offline sync | `src/lib/offline/sync.ts` |
| Account setup script | `scripts/setup-accounts.ts` |
| CSV templates | `templates/singles_template.csv`, `templates/doubles_template.csv` |
| CSV import logic | `src/lib/csv/parser.ts`, `validator.ts`, `types.ts` |
| CSV/PDF export | `src/lib/csv/exporter.ts` |
| Undo toast component | `src/components/UndoToast.tsx` |
| Range validation | `src/lib/validation/ranges.ts` |
| Range warning modal | `src/components/RangeWarningModal.tsx` |
| Audit log page | `src/app/events/[eventId]/audit-log/page.tsx` |
| Audit log queries | `src/lib/supabase/queries.ts` (getAuditLog, logScoreChanges) |
| Skeleton components | `src/components/Skeleton.tsx` |
| Error boundaries | `src/components/ErrorBoundary.tsx` |
| PWA manifest | `public/manifest.json` |
| PWA icons | `public/icons/` |
| PWA icon generator | `scripts/generate-icons.js` |
| Offline page | `src/app/offline/page.tsx` |
| Judge navigation | `src/components/JudgeNavigation.tsx` |
| Station tabs (admin) | `src/components/StationTabs.tsx` |
| Scoring progress bar | `src/components/ScoringProgress.tsx` |
| Photo capture component | `src/components/PhotoCapture.tsx` |
| Photo lightbox (admin) | `src/components/PhotoLightbox.tsx` |
| Photo review page | `src/app/events/[eventId]/photos/page.tsx` |
| Photo capture API route | `src/app/api/photos/capture/route.ts` |
| Photo queries | `src/lib/supabase/queries.ts` (insertScorePhoto, linkPhotosToScores, getScorePhotos) |

### Database Tables
- `events` - Event management (name, date, location, status)
- `athletes` - Singles and doubles with all fields
- `scores` - Per-athlete, per-station distance tracking
- `profiles` - User roles (admin/judge)
- `score_audit_log` - Immutable audit trail of all score changes
- `score_photos` - Photos of machine displays with AI readings and judge final values

### Business Rules
- **Heats:** 12 per race type (singles and doubles)
- **Athletes per heat:** Up to 10
- **Stations:** Run (1), Row (2), Bike (3), Ski (4)
- **Scoring:** Distance in meters per station
- **Age categories:** 18-24, 25-29, 30-34, 35-39, 40-44, 45-49, 50-54, 55-59, 60-64, 65+
- **Doubles categories:** Men, Women, Mixed
- **Event statuses:** Draft, Active, Completed

---

## Session Log

### 2026-02-28: Photo Verification Scoring (Phase 11 — Simplified)
- Implemented photo verification scoring workflow (simplified from AI-based approach)
- **Approach:** Judges photograph machine display as proof/verification, then enter score manually. No AI reading.
- **Database:** `score_photos` table (migration 006) — AI fields exist in schema but are no longer populated.
- **API Route:** `/api/photos/capture` — receives photo, uploads to Supabase Storage, inserts DB row, returns `{ photoId, thumbnailUrl }`.
- **PhotoCapture Component:** Camera button using `<input type="file" capture="environment">`. States: idle → uploading → done/error. Client-side compression via Canvas API (1200px, JPEG 85%).
- **ScoreEntry:** Photo required before score input unlocks (when online). No AI auto-fill — judge types score manually.
- **Scoring Page:** Photo state management per athlete. Photos linked to scores on submit. Photo requirement skipped when offline.
- **Admin Photo Review:** Filterable grid at `/events/[eventId]/photos` — thumbnails, athlete info, station, heat, timestamp. Click to open lightbox.
- **PhotoLightbox:** Full-screen overlay with photo, athlete info, pinch-to-zoom. No AI/judge comparison.
- **Removed:** `openai` and `sharp` npm packages, `OPENAI_API_KEY` from env files and Vercel.
- Build verified successful — no TypeScript errors.
- **Status:** Code complete. Needs Supabase Storage bucket + migration before testing.

### 2026-02-27: Scoring Workflow Improvements
- **Removed undo toast** - Undo popup after score submission removed (scores can be edited directly)
- **Required all scores** - Judges must enter scores for ALL athletes in a heat before submitting
  - Button shows "X Athletes Missing Scores" when incomplete
  - Error message lists which athletes are missing scores
- **Auto-advance to next heat** - After submitting scores, automatically moves to the next heat
  - Singles Heat 1-11 → next heat
  - Singles Heat 12 → Doubles Heat 1
  - Doubles Heat 12 → stays (all heats complete)
- **Smart submit button** - Shows contextual labels:
  - "X Athletes Missing Scores" (disabled) when incomplete
  - "Submit & Continue to Heat X" when ready to submit
  - "Continue to Heat X" when all scores already saved
  - "All Heats Complete" at final heat
- Removed UndoToast component and related undo functionality
- Build verified successful

### 2026-02-25: Leaderboard Refinements (Phase 9)
- Updated Leaderboard component to show actual distances instead of checkmarks
- Station columns now show full names (Run, Row, Bike, Ski) instead of single letters
- Made entire athlete row clickable - navigates to detailed athlete breakdown page
- Athlete detail page shows: name, bib, ranking in category, total distance, station breakdown, QR code
- Simplified Leaderboard component props (removed `showAthleteLinks`, uses `eventId` for navigation)
- Both admin (`/events/.../leaderboard`) and public (`/live/...`) leaderboards now have clickable rows
- Build verified successful

### 2026-02-25: Scoring UI Simplification
- Reverted station colors to consistent night-green (removed per-station colors as overkill)
- Removed sticky header - selectors now scroll naturally with content
- Kept only sticky submit button at bottom (most useful element to keep visible)
- Gives judges more screen space for athlete score cards
- Cleaner, simpler interface

### 2026-02-25: Scoring UI/UX Redesign (Phase 8)
- Implemented new color-coded station system
  - Run: Burnt orange (#E85D04)
  - Row: Ocean blue (#0077B6)
  - Bike: Deep purple (#7B2CBF)
  - Ski: Forest green (#2D6A4F)
- **Admin vs Judge UI split:**
  - Admins: See `StationTabs` component with colored station buttons to switch between stations
  - Judges: See locked station badge with their assigned station color (no switching)
- **New Components:**
  - `StationTabs.tsx` - Horizontal colored tab bar for admin station selection
  - `ScoringProgress.tsx` - Progress bar showing "X of Y scored" with station color
- **HeatSelector redesign:**
  - Replaced dropdowns with segmented button controls
  - Race type: Singles/Doubles toggle buttons
  - Heat: Horizontally scrollable button list (1-12)
- **ScoreEntry card state-based styling:**
  - Empty: Dashed border
  - Editing: Solid border in station color
  - Saved: Green border with "Saved" badge
  - Changed: Amber border with "Pending" badge
- **Sticky layout structure:**
  - Header with station indicator/tabs (sticky top)
  - Heat selector (sticky top)
  - Progress bar (sticky top)
  - Scrollable athlete cards
  - Submit button footer (sticky bottom)
- **Submit button improvements:**
  - Full width with 56px min height
  - Shows "All Scores Submitted" when no pending changes
  - Offline warning integrated into submit footer
- **Online/Offline indicator:**
  - Compact pill badge in header showing offline status or sync progress
- Added CSS utility classes for station tabs, heat buttons, score cards, progress bar, scrollbar-hide
- Build verified successful

### 2026-02-23: Simplified Judge Flow
- Created dedicated `JudgeNavigation` component with minimal UI
- Judges now see streamlined event selection (only active events shown)
- Tapping event goes directly to scoring page (not event overview)
- Judge navigation shows: back arrow, event name, station badge, sign out
- No access to Overview, Athletes, Leaderboard pages for judges
- Admin experience unchanged
- Fixed station assignment in database (ran SQL to correct judge profiles)

### 2026-02-23: Phase 7 - Scoring UI/UX Polish
- Complete mobile UX overhaul of the judge scoring interface
- **Touch targets:** Increased all buttons/inputs to 44px+ minimum height
  - Updated `.btn` base class from `py-2` to `py-3` with `min-height: 44px`
  - Updated `.btn-lg` to `py-4` with `min-height: 52px`
  - Updated `.input` from `py-2` to `py-3` with `min-height: 48px`
  - Added `.input-lg` class with `py-4` and `min-height: 56px`
  - Updated `.select` to match input sizing
- **ScoreEntry component redesign:**
  - Stacked layout with bib number in circular badge
  - Large input field (full width) with unit suffix inside
  - Green left border and "Saved" badge when score exists
  - "Changed" indicator when pending changes exist
  - Card click focuses the input
  - Focus state shows olive ring
- **Auto-advance feature:** Enter key advances to next athlete's input
- **Submit button improvements:**
  - Shows count of scores to submit ("Submit 5 Scores")
  - Spinning loader during submission
  - Sticky gradient background for visibility while scrolling
- **UndoToast redesign:**
  - Larger buttons meeting touch target minimums
  - Progress bar moved to top for visibility
  - Better visual hierarchy with icon in circular background
- **RangeWarningModal:** Stacked full-width buttons on mobile
- **Select component:** Now uses global `.select` class for consistent sizing
- **Typography:** Increased text sizes throughout for outdoor visibility
- Added new utility classes: `.card-prominent`, `.station-badge`, `.saved-indicator`
- Build verified successful

### 2026-02-20: Loading/Error UX Implementation
- Created `Skeleton.tsx` component with reusable loading patterns:
  - Generic Skeleton, SkeletonText, SkeletonCard, SkeletonTableRow
  - Specialized: SkeletonAthleteRow, SkeletonStatsGrid, SkeletonLeaderboard, SkeletonScoreEntry
- Created `ErrorBoundary.tsx` with React class components:
  - `ErrorBoundary` - base class with retry functionality
  - `PageErrorBoundary` - full-page error fallback with navigation
  - `InlineErrorBoundary` - component-level error fallback
- Added server-side loading/error handlers:
  - `/dashboard/loading.tsx` and `/dashboard/error.tsx`
  - `/events/[eventId]/loading.tsx` and `/events/[eventId]/error.tsx`
- Updated client pages with skeletons and error boundaries:
  - Athletes page - skeleton list, PageErrorBoundary
  - Leaderboard page - skeleton table, PageErrorBoundary
  - Scoring page - skeleton entries, PageErrorBoundary
  - Audit Log page - skeleton table, PageErrorBoundary
- Phase 6 is now COMPLETE
- Build verified successful

### 2026-02-20: Verification Workflow - Implemented then Reverted
- Initially implemented verification workflow (draft → verified scores)
- **Reverted** after discussion - feature was over-engineered for the use case
- Reasoning: Live scoring needs immediate updates, not approval bottlenecks
- Existing safeguards are sufficient:
  - Range warnings catch typos before submission
  - 60-second undo window for quick fixes
  - Audit log provides full accountability
  - Station locking prevents wrong-station errors
- Score flow remains simple: Judge enters → Score goes live immediately

### 2026-02-19: Audit Log Feature
- Implemented complete audit log system for score tracking
  - Created `score_audit_log` table (migration 005)
  - Tracks all score creates, updates, and deletes
  - Records: athlete, station, old value, new value, who changed it, when
  - Immutable entries (no updates/deletes allowed via RLS)
- Created admin UI at `/events/[eventId]/audit-log`
  - Paginated table view of all score changes
  - Filter by station
  - Color-coded action badges (Created/Updated/Deleted)
  - Shows changer email and timestamp
- Integrated audit logging into scoring page
  - Logs when scores are submitted (created/updated)
  - Logs when scores are undone (deleted with reason: "undo")
- Added "Audit Log" link to event management page (admin only)
- Build verified successful

### 2026-02-19: CSV/PDF Export + Undo Score + Range Warnings
- Implemented CSV export for leaderboard results
  - Exports filtered data (race type, gender, age category, doubles category)
  - Includes header metadata (event name, date, filters applied)
  - Proper CSV escaping for special characters
- Implemented PDF export for leaderboard results
  - Added jsPDF and jspdf-autotable dependencies
  - Landscape A4 format with CAP branding colors
  - Auto-generated table with all athlete data
  - Page numbers and export timestamp in footer
- Export buttons visible only to admins on leaderboard page
- Created `src/lib/csv/exporter.ts` with export utilities
- Implemented Undo Score feature (60-second window)
  - Added `deleteScores` function to queries.ts
  - Added `deleteScores` method to useScores hook
  - Created `UndoToast` component with countdown timer and progress bar
  - Shows toast after score submission with Undo button
  - Undo deletes the just-submitted scores
  - Auto-dismisses after 60 seconds
  - Only available when online (offline scores can't be undone reliably)
- Implemented Range Warnings feature
  - Created `src/lib/validation/ranges.ts` with station-specific distance ranges
  - Created `RangeWarningModal` component for flagged score review
  - Validates before submission: flags very low/high distances
  - Per-station ranges: Run (500-15000m), Row (500-12000m), Bike (1000-30000m), Ski (500-12000m)
  - Suggests corrections (e.g., "Did you mean 5000m instead of 50000m?")
  - Judge can "Submit Anyway" or "Go Back & Edit"
- Updated judge accounts to 2 per station (8 total)
- Build verified successful

### 2026-02-13: PWA Conversion
- Installed @ducanh2912/next-pwa package for Next.js 14 compatibility
- Created manifest.json with CAP branding:
  - App name: "CAP 55 Scoring", short name: "CAP 55"
  - Theme color and background color: #303029 (night-green)
  - Display: standalone, start URL: /dashboard
- Generated PWA icons using sharp:
  - 192x192 and 512x512 standard icons
  - 192x192 and 512x512 maskable icons
  - Apple touch icon (180x180)
  - Favicons (16x16, 32x32)
- Updated layout.tsx with PWA meta tags:
  - apple-mobile-web-app-capable, theme-color, viewport settings
  - Manifest link, icon references
- Configured service worker with runtime caching strategies:
  - CacheFirst for fonts and images
  - StaleWhileRevalidate for static JS/CSS
  - NetworkFirst for Supabase API calls
- Created offline fallback page at /offline
- PWA works alongside existing Dexie.js offline scoring
- Build verified successful
- Added generated PWA files to .gitignore

### 2026-02-11: Station Locking for Judges
- Added `assigned_station` column to profiles table (migration 004)
- Judges are now locked to their assigned station in the scoring UI
- Station dropdown removed for judges - only Race Type and Heat selectors shown
- Visual indicator shows which station the judge is assigned to
- Admin retains full access to all stations
- Updated `setup-accounts.ts` to assign stations when creating/updating accounts
- Created `scripts/run-migration-004.ts` for applying station assignments

### 2026-02-08: CSV Import Verified + Templates Created
- Verified CSV import feature fully implemented (was built previously)
- CSVImportModal component with upload, preview, and import workflow
- CSV parsing library with quote handling and auto-detection of singles/doubles format
- Validation: required fields, heat range, gender values, age categories, duplicate bibs
- Template downloads for both singles and doubles formats
- Bulk insert with batching (50 athletes per batch)
- Build verified successful
- **Created CSV template files** at `templates/singles_template.csv` and `templates/doubles_template.csv`
- Updated roadmap: Phase 5 on hold, Phase 6 next, added Phase 7 for UI/UX polish

### 2026-02-06: Judge Account Setup
- Created 12 judge accounts + 1 admin account
- Set up role-based access control
- Fixed database trigger for profile creation
- Added `scripts/setup-accounts.ts` provisioning script
- Added `supabase/migrations/003_fix_profile_trigger.sql`

### 2026-02-02: Vercel Deployment + Branding
- Pushed code to GitHub (scbayvel-CAP/cap-scoring)
- Deployed to Vercel at https://cap-scoring.vercel.app
- Applied CAP brand guidelines (colors, typography, logo)
- Updated landing page, login page, navigation

### 2026-02-01: Offline Support + Stabilization
- Implemented offline-first with Dexie.js/IndexedDB
- Local score caching with background sync
- Visual offline/sync status indicator
- Codebase cleanup and standardization

### 2026-02-01: Supabase Setup
- Created Supabase project
- Ran database migrations
- Verified all core features working

### 2026-01-28: Public Leaderboard
- Public leaderboard at `/live/[eventId]`
- Individual athlete result pages
- QR code generation for athletes

---

## Known Issues / Technical Debt

1. **No test coverage** - Unit and integration tests not written
2. **npm audit warnings** - 4 vulnerabilities (run `npm audit` for details)
