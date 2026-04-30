# EngageGroovy Deployment Guide

## Source of Truth

**Production site files:** `site/`

All files in `site/` are deployed directly to cPanel at `/home/engaemyx/public_html`

## Architecture

```
┌─────────────────────────────────────────────────┐
│  cPanel Production                              │
│  /home/engaemyx/public_html                    │
│  https://engagegroovy.com                       │
└─────────────────────────────────────────────────┘
                    ▲
                    │ FTP Deploy
                    │ (GitHub Actions)
                    │
┌─────────────────────────────────────────────────┐
│  Git Repository (Source of Truth)               │
│  site/                                          │
│  ├── index.html                                 │
│  ├── about.html                                 │
│  ├── contact.html                               │
│  ├── 404.html                                   │
│  ├── .htaccess                                  │
│  └── assets/                                    │
└─────────────────────────────────────────────────┘
                    ▲
                    │ Import from cPanel
                    │
┌─────────────────────────────────────────────────┐
│  Import Staging                                 │
│  scratch/cpanel-live-import/                    │
│  (Download cPanel files here first)             │
└─────────────────────────────────────────────────┘
```

## Initial Setup: Import cPanel Site

### 1. Download from cPanel

Follow instructions in:
```
scratch/cpanel-live-import/README.md
```

Summary:
- Log into cPanel File Manager
- Go to `/home/engaemyx/public_html`
- Select all files (including .htaccess)
- Compress → Download
- Extract into `scratch/cpanel-live-import/`

### 2. Import to Git

```bash
npm run import:cpanel-live
```

This copies files from `scratch/cpanel-live-import/` → `site/`

### 3. Preview Locally

```bash
npm run preview
```

Visit: http://localhost:8080

### 4. Commit as Source of Truth

```bash
git add site/
git commit -m "Import cPanel production site as source of truth"
git push origin main
```

## Daily Workflow

### Make Changes Locally

1. Edit files in `site/`
2. Preview: `npm run preview`
3. Test at: http://localhost:8080

### Deploy to Production

```bash
git add site/
git commit -m "Update homepage copy"
git push origin main
```

GitHub Actions will automatically deploy to cPanel.

## GitHub Actions Deployment

**Workflow:** `.github/workflows/deploy-cpanel.yml`

**Trigger:**
- Push to `main` branch
- Manual dispatch from Actions tab

**What it does:**
1. Verifies `site/` directory exists
2. Deploys via FTP to cPanel
3. Syncs to `/home/engaemyx/public_html`

**Required Secrets:**

In GitHub repo settings → Secrets → Actions:

```
CPANEL_FTP_SERVER       # e.g., ftp.yourdomain.com
CPANEL_FTP_USERNAME     # cPanel FTP username
CPANEL_FTP_PASSWORD     # cPanel FTP password
```

## Archived Components

### archived-localhost-app/

Contains the Express.js app that was built locally before discovering the real cPanel site.

**NOT USED IN PRODUCTION.**

To run (for reference only):
```bash
npm run start:archived-app
```

### scratch/

Working directory for temporary files, imports, and experiments.

**NOT DEPLOYED.**

## Troubleshooting

### "site/ directory not found" error

You haven't imported the cPanel site yet.
```bash
npm run import:cpanel-live
```

### GitHub Actions deployment fails

Check:
1. Secrets are set correctly in GitHub
2. FTP credentials are valid
3. cPanel FTP service is running
4. Server path is `/public_html/` (with trailing slash)

### Changes not visible on live site

1. Check GitHub Actions tab for deployment status
2. Verify files exist in `site/`
3. Clear browser cache
4. Check cPanel File Manager to confirm files uploaded

### Local preview not working

Make sure `site/` has files:
```bash
ls -la site/
```

If empty, run import:
```bash
npm run import:cpanel-live
```

## Contact Form Integration

The static site can integrate with the archived Express app's API endpoints if needed:

1. Deploy the Express app to a Node.js hosting service
2. Update contact form action to point to the API URL
3. Configure CORS to allow requests from engagegroovy.com

Or use a serverless function / form service like:
- Formspree
- FormSubmit
- Netlify Forms
- Supabase Edge Functions
