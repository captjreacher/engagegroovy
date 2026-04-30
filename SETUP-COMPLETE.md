# ✅ cPanel Import Setup Complete

The repository is now ready to receive the real cPanel production site.

---

## 📋 What Was Changed

### Files Created:
```
✓ scratch/cpanel-live-import/README.md   - Instructions for downloading from cPanel
✓ scripts/import-cpanel-live.js          - Import script
✓ scripts/preview-site.js                - Local preview server
✓ site/.gitkeep                          - Production site directory
✓ .github/workflows/deploy-cpanel.yml    - cPanel deployment workflow
✓ archived-localhost-app/README.md       - Documentation for quarantined app
✓ DEPLOYMENT.md                          - Full deployment guide
✓ SETUP-COMPLETE.md                      - This file
```

### Files Modified:
```
✓ package.json                           - Added import:cpanel-live and preview scripts
✓ .gitignore                            - Updated to track site/ and ignore scratch/*
```

### Files Moved/Quarantined:
```
✓ src/* → archived-localhost-app/       - Bad Express app quarantined
✓ deploy-pages.yml → DISABLED-*.txt     - GitHub Pages workflow disabled
```

---

## 🚀 Next Steps (You Must Do This)

### Step 1: Download cPanel Files

**Read the instructions:**
```
scratch/cpanel-live-import/README.md
```

**Summary:**
1. Log into cPanel File Manager
2. Navigate to: `/home/engaemyx/public_html`
3. Select ALL files: index.html, about.html, contact.html, 404.html, assets/, .htaccess
4. Click **Compress** → Zip Archive → Name it `cpanel-live-export.zip`
5. **Download** the zip file
6. Extract contents into: `scratch/cpanel-live-import/`

⚠️ **CRITICAL:** Files must be directly in `cpanel-live-import/`, not in a subfolder!

Expected structure after extraction:
```
scratch/cpanel-live-import/
├── index.html
├── about.html
├── contact.html
├── 404.html
├── assets/
└── .htaccess
```

### Step 2: Import to Source of Truth

After extracting cPanel files, run:

```bash
npm run import:cpanel-live
```

This will:
- Copy all files from `scratch/cpanel-live-import/` to `site/`
- Make `site/` the production source of truth
- Verify files copied correctly

### Step 3: Preview Locally

```bash
npm run preview
```

Visit: **http://localhost:8080**

This serves the REAL cPanel site locally, not the bad Express app.

### Step 3.5: Verify Contact Form

```bash
npm run verify:contact-form
```

This checks that the contact form uses the correct FormSubmit endpoint:
```
https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b
```

**Important:** Activate FormSubmit via the email link you received.

### Step 4: Commit to Git

```bash
git add site/
git add .github/
git add package.json
git add .gitignore
git add DEPLOYMENT.md
git add scripts/
git commit -m "Import cPanel production site as source of truth"
git push origin main
```

### Step 5: Configure GitHub Secrets

For automatic deployment to work, add these secrets in GitHub:

**Go to:** Repository Settings → Secrets and variables → Actions

**Add three secrets:**
```
CPANEL_FTP_SERVER       # Example: ftp.engagegroovy.com
CPANEL_FTP_USERNAME     # Your cPanel FTP username
CPANEL_FTP_PASSWORD     # Your cPanel FTP password
```

### Step 6: Test Deployment

Push to `main` branch or manually trigger from GitHub Actions tab.

Workflow will deploy `site/` → `/home/engaemyx/public_html`

---

## 📦 Available Commands

| Command | Purpose |
|---------|---------|
| `npm run import:cpanel-live` | Import cPanel files from scratch/cpanel-live-import/ to site/ |
| `npm run preview` | Preview production site locally at http://localhost:8080 |
| `npm run start:archived-app` | Run the archived Express app (NOT PRODUCTION) |
| `npm run dev:archived-app` | Run archived app with auto-reload (NOT PRODUCTION) |

---

## 🔒 Production vs Development

### ✅ PRODUCTION (Real Site)
- **Location:** `site/`
- **Preview:** `npm run preview` → http://localhost:8080
- **Deploy:** Push to GitHub `main` branch
- **Live URL:** https://engagegroovy.com

### ⚠️ ARCHIVED (Not Production)
- **Location:** `archived-localhost-app/`
- **Purpose:** Quarantined Express app built before knowing real site existed
- **Run:** `npm run start:archived-app` → http://localhost:3000
- **Status:** NOT DEPLOYED, for reference only

### 🗑️ SCRATCH (Not Production)
- **Location:** `scratch/`
- **Purpose:** Working files, experiments, import staging
- **Status:** NOT TRACKED, NOT DEPLOYED

---

## 🚨 Blockers

### Before You Can Deploy:

1. ⏳ **Download cPanel files** into `scratch/cpanel-live-import/`
2. ⏳ **Run import command:** `npm run import:cpanel-live`
3. ⏳ **Add GitHub secrets:** FTP server, username, password

Until step 1-2 are done, `site/` will be empty and deployment will fail.

---

## 📖 Full Documentation

- **Deployment Guide:** `DEPLOYMENT.md`
- **Import Instructions:** `scratch/cpanel-live-import/README.md`
- **Archived App Info:** `archived-localhost-app/README.md`

---

## ✅ Verification Checklist

After completing all steps:

- [ ] cPanel files downloaded to `scratch/cpanel-live-import/`
- [ ] Import command run successfully
- [ ] `site/` directory contains index.html, assets/, etc.
- [ ] Local preview works at http://localhost:8080
- [ ] Changes committed to Git
- [ ] GitHub secrets configured
- [ ] GitHub Actions deployment workflow runs successfully
- [ ] Live site updated at https://engagegroovy.com

---

## 🆘 Help

**Import failed?**
- Check files are in `scratch/cpanel-live-import/` (not nested in subfolder)
- Ensure you have index.html, not just empty directories

**Preview not working?**
- Run `npm run import:cpanel-live` first
- Check that `site/index.html` exists

**Deployment failed?**
- Verify GitHub secrets are set correctly
- Check cPanel FTP is enabled
- Review GitHub Actions logs

**Still confused?**
- Read `DEPLOYMENT.md` for full architecture explanation
- Check `scratch/cpanel-live-import/README.md` for download steps
