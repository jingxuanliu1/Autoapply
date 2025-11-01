# Supabase Edge Functions

## Setup

### 1. Install Supabase CLI

```powershell
# Windows (PowerShell)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# OR download from: https://github.com/supabase/cli/releases
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Your Project

```bash
supabase link --project-ref cpqtcjrxvqzelagryfmv
```

## Deploy the GitHub Ingestion Function

```bash
supabase functions deploy ingest_github
```

## Set Environment Variables

The function needs your Supabase service role key (NOT the anon key):

1. Go to: https://supabase.com/dashboard/project/cpqtcjrxvqzelagryfmv/settings/api
2. Copy the **service_role** key (this is sensitive!)
3. Set it in Supabase:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Test the Function

Call it with a GitHub raw URL:

```bash
curl "https://cpqtcjrxvqzelagryfmv.supabase.co/functions/v1/ingest_github?readme=https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
```

## Set Up Automatic Updates (Cron Job)

### Option A: Using Supabase Cron (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Create a cron job to run daily at 2 AM
SELECT cron.schedule(
  'ingest-github-jobs',
  '0 2 * * *',  -- Daily at 2 AM
  $$
  SELECT
    net.http_post(
      url := 'https://cpqtcjrxvqzelagryfmv.supabase.co/functions/v1/ingest_github?readme=https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    );
  $$
);
```

### Option B: Using GitHub Actions

Create `.github/workflows/ingest-jobs.yml` in your website repo:

```yaml
name: Ingest Job Postings
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:  # Allow manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Call Supabase Function
        run: |
          curl "https://cpqtcjrxvqzelagryfmv.supabase.co/functions/v1/ingest_github?readme=https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
```

### Option C: Manual Execution

Just call the URL whenever you want to update:

```bash
curl "https://cpqtcjrxvqzelagryfmv.supabase.co/functions/v1/ingest_github?readme=https://raw.githubusercontent.com/SimplifyJobs/Summer2026-Internships/dev/README.md"
```

## Add More Sources

To add more job boards, call the function with different URLs:

```bash
# Add another GitHub repo
curl "https://cpqtcjrxvqzelagryfmv.supabase.co/functions/v1/ingest_github?readme=https://raw.githubusercontent.com/another-repo/jobs/main/README.md"

# Add RSS feeds (requires a separate function)
# Add JSON APIs (requires a separate function)
```

## Create the `sources` table

If you haven't created it yet, run this SQL:

```sql
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL,  -- 'github', 'rss', 'api', etc.
  url TEXT NOT NULL UNIQUE,
  last_fetched TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sources" ON sources
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Service role can manage sources" ON sources
  FOR ALL TO SERVICE_ROLE USING (true);
```

## Create the `postings` table (if needed)

```sql
CREATE TABLE postings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID REFERENCES sources(id),
  site TEXT NOT NULL,  -- 'greenhouse', 'lever', 'workday', 'other'
  company TEXT,
  title TEXT,
  url TEXT NOT NULL UNIQUE,
  apply_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read postings" ON postings
  FOR SELECT TO PUBLIC USING (true);

CREATE POLICY "Service role can manage postings" ON postings
  FOR ALL TO SERVICE_ROLE USING (true);
```

## Monitoring

Check function logs:

```bash
supabase functions logs ingest_github
```

Or in the Supabase Dashboard:
https://supabase.com/dashboard/project/cpqtcjrxvqzelagryfmv/functions/ingest_github/logs
