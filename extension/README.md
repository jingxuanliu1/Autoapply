# AutoApply Assistant - Chrome Extension

A browser extension that automates job application form filling using your Supabase-stored profiles and templates.

## Features

- ✅ Auto-fills job applications on Greenhouse, Lever, and Workday
- ✅ Learns from missing questions and remembers your answers
- ✅ Opens multiple jobs from your queue automatically
- ✅ Syncs with your Supabase database
- ✅ Secure - uses browser's password manager, no password storage

## Installation

### Load Unpacked Extension (Development)

1. Open Chrome/Edge and go to `chrome://extensions/` (or `edge://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder from this project
5. The extension icon should appear in your toolbar

### Create Icons (Optional)

The extension needs icon files. You can either:

**Option A:** Use placeholder colored squares (quick):
```powershell
# Run this in PowerShell from the extension directory
Add-Type -AssemblyName System.Drawing
$sizes = @(16, 48, 128)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.Clear([System.Drawing.Color]::DodgerBlue)
    $bmp.Save("icon$size.png")
    $bmp.Dispose()
}
```

**Option B:** Design proper icons and save as `icon16.png`, `icon48.png`, `icon128.png`

## Usage

### 1. Add Jobs to Queue

First, add jobs to your `applications` table with `status='queued'`:

```sql
INSERT INTO applications (owner_uid, url, site, status)
VALUES 
  ('your-user-id', 'https://boards.greenhouse.io/company/jobs/123', 'greenhouse', 'queued'),
  ('your-user-id', 'https://jobs.lever.co/company/position-id', 'lever', 'queued');
```

Or use the web app's "Add to queue" feature in the Catalog page.

### 2. Open Extension Popup

Click the extension icon in your toolbar.

### 3. Start Auto-Applying

1. Enter how many jobs to open (default: 5)
2. Click "Open Next Jobs"
3. The extension will:
   - Open each job in a new tab
   - Auto-fill known fields from your profile
   - Prompt you for any missing information
   - Save your answers for next time
   - Submit the application (or mark for review)

### 4. Answer Missing Questions

If the extension encounters a question it doesn't know:

1. A prompt will appear in the popup
2. Enter your answer
3. Click "Save & Continue"
4. The answer is saved to your `qa_templates` table
5. Next time, it will be filled automatically

## Configuration

### Update Your Profile Data

Currently, the content scripts use hardcoded example data. To use your real data:

1. Add your profile to the `profiles` table in Supabase
2. Update the content scripts to fetch from Supabase instead of using hardcoded data

### Add Field Mappings

To improve accuracy, add site-specific CSS selectors to `field_mappings`:

```sql
INSERT INTO field_mappings (site, question_key, css_selector)
VALUES 
  ('greenhouse', 'work_authorization', 'select[name*="work_authorization"]'),
  ('greenhouse', 'require_sponsorship', 'select[name*="sponsorship"]');
```

## File Structure

```
extension/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (queue management)
├── utils.js               # Shared utilities
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styling
├── sites/
│   ├── greenhouse.js      # Greenhouse.io script
│   ├── lever.js           # Lever.co script
│   ├── workday.js         # Workday script
│   └── generic.js         # Fallback for other sites
└── icon*.png              # Extension icons
```

## Troubleshooting

### Extension won't load
- Check that all files are in the correct locations
- Create the icon files (see Installation)
- Check the Chrome Extensions page for error messages

### Forms not filling
- Open the browser console (F12) and check for errors
- The content script logs what it's doing
- Verify the site is detected correctly

### Database connection issues
- Make sure you're logged in to your web app first
- Check that the Supabase URL and anon key are correct in the scripts
- Verify RLS policies allow reading templates

## Security Notes

- ✅ Uses browser's built-in password manager
- ✅ No passwords stored in Supabase
- ✅ Content scripts only run on job board sites
- ✅ RLS policies protect your data
- ⚠️ Review forms before submitting on generic sites

## Next Steps

1. **Fetch real profile data**: Update content scripts to load from `profiles` table
2. **Add file upload**: Implement resume/cover letter uploads
3. **Better error handling**: Add retry logic and better error messages
4. **Rate limiting**: Add delays between applications
5. **Analytics**: Track success rates per site

## Support

For issues or questions, check the console logs first, then review the database for any `application_issues` entries.
