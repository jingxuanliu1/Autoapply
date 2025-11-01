# AutoApply Assistant - Batch Processing (v0.2.0)

## ✨ New Features

- 🚀 **Batch processing**: Apply to 100 jobs with one click
- ⚡ **Concurrency control**: Process 5 tabs at a time (configurable)
- 📊 **Progress tracking**: Real-time progress in popup
- 🔗 **Website integration**: Trigger from your web app
- ⏸️ **Smart pausing**: Stops when missing info, resumes after you answer

## 🎯 How It Works

### Zero-Cost Architecture

1. **Website button** → sends start signal via `window.postMessage`
2. **Extension background** → pulls queue from Supabase, processes in batches
3. **Concurrency** → opens 5 tabs at a time (adjustable)
4. **Missing info** → pauses, prompts once, saves to `qa_templates`, resumes
5. **Status tracking** → writes back to `applications.status` and `application_issues`

Everything runs in your browser session (already logged in to job boards).

## 📝 Setup Instructions

### 1. Reload the Extension

The extension has been upgraded to v0.2.0. Reload it:

1. Go to `chrome://extensions/`
2. Find "AutoApply Assistant"
3. Click the 🔄 **Reload** button

### 2. Add Jobs to Your Queue

Run this SQL in Supabase to queue up jobs:

```sql
-- Add your profile
INSERT INTO public.profiles (uid, full_name, email)
VALUES ('330e0455-98c1-43a1-b6ff-596fc366bba1', 'Jingxuan Liu', 'jingxuanliu317@gmail.com')
ON CONFLICT (uid) DO UPDATE
  SET full_name = excluded.full_name,
      email     = excluded.email;

-- Queue 100 jobs from your catalog
INSERT INTO public.applications (owner_uid, site, company, title, url, status, posting_id)
SELECT
  '330e0455-98c1-43a1-b6ff-596fc366bba1'::uuid,
  p.site,
  coalesce(p.company, '?'),
  coalesce(p.title,   '?'),
  p.url,
  'queued',
  p.id
FROM public.postings p
WHERE p.site IN ('greenhouse','lever','workday')
ORDER BY p.created_at DESC
LIMIT 100
ON CONFLICT (owner_uid, url) DO UPDATE
SET site       = excluded.site,
    company    = coalesce(excluded.company, public.applications.company),
    title      = coalesce(excluded.title,   public.applications.title),
    posting_id = coalesce(excluded.posting_id, public.applications.posting_id),
    status     = 'queued',
    updated_at = now();

-- Verify
SELECT id, site, company, title, status, created_at
FROM public.applications
WHERE owner_uid = '330e0455-98c1-43a1-b6ff-596fc366bba1'
  AND status = 'queued'
ORDER BY created_at DESC
LIMIT 20;
```

### 3. Start Batch Processing

**Option A: From Your Website**

1. Go to http://localhost:3000/catalog
2. Click the green **🚀 Auto-Apply 100** button
3. Keep the tab open
4. Watch progress in the extension popup

**Option B: From Extension Popup**

1. Click the extension icon
2. Set number of jobs (default: 100)
3. Click **"Start Batch Apply"**
4. Watch the progress bar

## 🎛️ Configuration

Edit these settings in `extension/background.js`:

```javascript
const DEFAULT_TOTAL = 100;  // Default batch size
const CONCURRENCY = 5;      // Tabs processed simultaneously
```

**Recommendations:**
- **Fast PC**: Set `CONCURRENCY = 8`
- **Slow PC**: Set `CONCURRENCY = 3`
- **Batch size**: Start with 20-50 to test, then increase

## 📊 Progress Tracking

The extension popup shows:
- **Processed**: How many completed
- **Total**: Total in queue
- **Active**: Currently processing

Progress updates in real-time as jobs are processed.

## ❓ Handling Missing Questions

When the extension encounters a question it doesn't know:

1. **Batch pauses** automatically
2. **Popup shows prompt** with the question
3. **You answer once** and click "Save & Continue"
4. **Answer saved** to `qa_templates` (scope='private')
5. **Batch resumes** automatically
6. **Future jobs** auto-fill that question

## 🔒 Security

- ✅ **No password storage**: Uses browser's built-in password manager
- ✅ **Session reuse**: Leverages existing login sessions
- ✅ **RLS protection**: Your data is protected by Row Level Security
- ✅ **Client-side only**: Everything runs in your browser

## 🛠️ Troubleshooting

### Extension won't reload
- Make sure all files are saved
- Remove and re-add the extension if needed

### Jobs not processing
- Check console: `chrome://extensions/` → "Inspect views: service worker"
- Verify jobs exist: Run the "Verify" SQL query above
- Check RLS policies allow reading applications

### Forms not filling
- Open job tab manually (F12 → Console)
- Look for content script logs
- Site might use different selectors (update `field_mappings`)

### Tabs closing too fast
- Edit `background.js`, line 158: Change `8000` to `12000` (12 seconds)

## 📈 Next Steps

1. **Test with 20 jobs** first to verify everything works
2. **Gradually increase** to 50, then 100
3. **Add field mappings** for better accuracy
4. **Update your profile** in the `profiles` table
5. **Monitor `application_issues`** table for errors

## 🎉 Success Metrics

After running, check:

```sql
-- See status breakdown
SELECT status, COUNT(*) 
FROM applications 
WHERE owner_uid = '330e0455-98c1-43a1-b6ff-596fc366bba1'
GROUP BY status;

-- Check for issues
SELECT * FROM application_issues 
WHERE owner_uid = '330e0455-98c1-43a1-b6ff-596fc366bba1'
ORDER BY created_at DESC 
LIMIT 10;
```

## 💡 Tips

- **Keep browser focused**: Some sites detect inactive tabs
- **Don't close tabs manually**: Let the extension manage them
- **Check submitted status**: Verify applications went through
- **Use real job URLs**: Test with actual Greenhouse/Lever/Workday links
- **Answer questions early**: First run will prompt for common questions

---

**Ready to apply to 100 jobs?** Queue them up and hit that button! 🚀
