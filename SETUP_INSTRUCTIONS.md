# Apply Assistant Web App - Setup Instructions

## ✅ Project Created Successfully!

Location: `C:\Users\jingx\Projects\apply-assistant-web`

## Next Steps

### 1. Configure Environment Variables

Edit the `.env.local` file and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://cpqtcjrxvqzelagryfmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**To get your credentials:**
1. Go to https://supabase.com/dashboard/project/cpqtcjrxvqzelagryfmv/settings/api
2. Copy "Project URL" → paste as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy "anon public" key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Run the Development Server

```powershell
cd C:\Users\jingx\Projects\apply-assistant-web
npm run dev
```

Then open http://localhost:3000 in your browser.

### 3. Test the App

1. **Sign Up**: Create an account on the login page
2. **Profile**: Go to `/profile` and fill in your information
3. **Templates**: Go to `/templates` and create Q/A templates
4. **Jobs**: Go to `/jobs` and add job application URLs

## Project Structure

```
apply-assistant-web/
├── app/
│   ├── layout.tsx          # Root layout with navigation and auth
│   ├── page.tsx            # Home page
│   ├── profile/
│   │   └── page.tsx        # Profile editor
│   ├── templates/
│   │   └── page.tsx        # Q/A templates CRUD
│   └── jobs/
│       └── page.tsx        # Jobs queue management
├── components/
│   └── AuthGate.tsx        # Authentication wrapper
├── lib/
│   └── supabase.ts         # Supabase client
└── .env.local              # Environment variables (edit this!)
```

## Features

### 🔐 Authentication
- Sign up / Sign in with email/password
- Session management with Supabase Auth
- Protected routes via AuthGate component

### 👤 Profile Page (`/profile`)
- Edit name, email, phone, location
- Add social links (GitHub, Website, LinkedIn)
- Data synced with Supabase

### 📝 Templates Page (`/templates`)
- Create private Q/A templates
- View public templates (shared)
- Auto-generates question keys from text

### 💼 Jobs Page (`/jobs`)
- Add job application URLs
- Track status: queued, opened, filled, needs-info, submitted, failed
- Browser extension can fetch "queued" jobs

## How It Works with the Extension

1. **Website**: Manage your data
   - Create profile and Q/A templates
   - Add job URLs to queue

2. **Extension**: Auto-fill forms
   - Sign in with same credentials
   - Opens queued jobs
   - Auto-fills using your templates
   - You review and submit manually

## Deployment (Optional)

### Deploy to Vercel:

1. Push to GitHub:
   ```powershell
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. Import to Vercel:
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repo
   - Add environment variables
   - Deploy!

## Troubleshooting

### "Cannot find module '@/lib/supabase'"
- Make sure you're in the correct directory
- Run `npm install` again

### Authentication not working
- Check your `.env.local` file has correct Supabase credentials
- Make sure Supabase email auth is enabled in your project

### Database errors
- Verify your Supabase tables exist (profiles, qa_templates, applications)
- Check RLS policies are configured correctly

## Support

Created on: 2025-11-01
Next.js Version: 16.0.1
Supabase JS Version: Latest
