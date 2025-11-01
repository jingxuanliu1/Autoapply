# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Apply Assistant is a Next.js web application that helps users manage job applications. It works alongside a browser extension to autofill job application forms using stored profile data and Q/A templates. The backend is powered by Supabase for authentication and database.

## Common Commands

### Development
```powershell
npm run dev           # Start development server on http://localhost:3000
npm run build         # Build for production
npm start             # Start production server
npm run lint          # Run ESLint
```

### Supabase Edge Functions
```bash
supabase login                              # Login to Supabase CLI
supabase link --project-ref cpqtcjrxvqzelagryfmv   # Link to project
supabase functions deploy ingest_github     # Deploy the GitHub ingestion function
supabase functions logs ingest_github       # View function logs
supabase secrets set KEY=value              # Set secret for edge functions
```

## Architecture

### Frontend Structure

The app uses Next.js 16 with App Router and React 19. Key architectural points:

- **Authentication**: Global `AuthGate` component wraps all pages in `layout.tsx`, managing session state and rendering sign-in UI when unauthenticated
- **Client-side data**: All pages use `'use client'` directive and fetch data directly from Supabase client-side (no server components for data fetching)
- **Supabase client**: Single shared client instance in `lib/supabase.ts` using public anon key
- **Styling**: Inline styles throughout (no CSS modules or component libraries), with Tailwind v4 configured via PostCSS but not actively used

### Database Schema

Three main tables in Supabase:

1. **profiles**: User profile data (name, email, phone, location, social links)
   - One row per user, keyed by `uid` (Supabase Auth user ID)
   
2. **qa_templates**: Question/answer templates for autofilling forms
   - Can be private (user-owned) or public (shared)
   - Used by browser extension for form autofill
   
3. **applications**: Job application tracking
   - Status flow: `queued` → `opened` → `filled` → `submitted` or `failed`
   - Browser extension fetches `queued` jobs

Additional tables:
- **sources**: Tracks external job board URLs for ingestion
- **postings**: Aggregated job postings from various sources

### Supabase Edge Functions

- **ingest_github**: Deno-based edge function that fetches markdown from GitHub (e.g., SimplifyJobs internship repo), parses job links, and inserts them into the `postings` table
- Uses service role key (set via `supabase secrets set`)
- Can be triggered via HTTP or scheduled with cron jobs

### Key Design Patterns

- **Authentication flow**: `AuthGate` checks session on mount, subscribes to auth state changes, renders login form or children based on session state
- **Data loading**: Each page uses `useEffect(() => { load(); }, [])` to fetch data on mount
- **Form handling**: Local state for forms, async save functions that call Supabase, alerts for errors
- **Path aliasing**: `@/*` resolves to project root via `tsconfig.json`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://cpqtcjrxvqzelagryfmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

For edge functions (set via `supabase secrets set`):
```
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

## Technology Stack

- **Framework**: Next.js 16.0.1 (App Router, React Compiler enabled)
- **React**: v19.2.0
- **Backend**: Supabase (auth + PostgreSQL)
- **Styling**: Tailwind CSS v4 (configured but not actively used), inline styles
- **TypeScript**: Strict mode enabled
- **Linting**: ESLint 9 with Next.js config

## Browser Extension Integration

The web app serves as a data management interface. The companion browser extension (separate codebase):
1. Authenticates with the same Supabase project
2. Fetches user's profile, templates, and queued jobs
3. Autofills job application forms using stored data
4. Updates job status back to the database

## Database Access Patterns

- All database operations use the client-side Supabase client (`lib/supabase.ts`)
- Authentication: `supabase.auth.getSession()`, `supabase.auth.getUser()`
- Queries: `.from(table).select()`, `.insert()`, `.update()`, `.delete()`
- Row-level security (RLS) policies control access on the database side
