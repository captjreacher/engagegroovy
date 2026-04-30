# cPanel Live Site Import Instructions

## Download the Real Live Site from cPanel

Follow these steps to download the current production site:

### Step 1: Access cPanel File Manager
1. Log into your cPanel account
2. Navigate to **File Manager**
3. Browse to: `/home/engaemyx/public_html`

### Step 2: Select Production Files
Select these files and folders:
- ✓ `index.html`
- ✓ `about.html`
- ✓ `contact.html`
- ✓ `404.html`
- ✓ `assets/` (entire directory)
- ✓ `.htaccess`

**Important:** Make sure to show hidden files (gear icon → Show Hidden Files) to see `.htaccess`

### Step 3: Download as Archive
1. Click **Compress** in the toolbar
2. Choose **Zip Archive**
3. Name it: `cpanel-live-export.zip`
4. Click **Compress File(s)**
5. Once compressed, **Download** the zip file
6. Click **Close** after compression completes

### Step 4: Extract to Import Folder
1. Download the `cpanel-live-export.zip` file to your computer
2. Extract the contents directly into this folder:
   ```
   scratch/cpanel-live-import/
   ```

After extraction, this folder should contain:
```
scratch/cpanel-live-import/
├── index.html
├── about.html
├── contact.html
├── 404.html
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
└── .htaccess
```

### Step 5: Run Import Command
Once files are extracted here, run:

```bash
npm run import:cpanel-live
```

This will:
- Copy all files from `scratch/cpanel-live-import/` to `site/`
- Set `site/` as the new source of truth
- Enable local preview from `site/`

### Step 6: Preview Locally
After import, preview the real site:

```bash
npm run preview
```

Visit: http://localhost:8080

### Step 7: Verify Contact Form
Check that the contact form uses the correct FormSubmit endpoint:

```bash
npm run verify:contact-form
```

This confirms the form is configured with:
```
https://formsubmit.co/b3b8fa08e07860d7b35ea92e3681b10b
```

### Step 8: Activate FormSubmit
1. Check your email for FormSubmit activation
2. Click **"Activate Form"** button
3. Test the contact form

### Step 9: Commit and Deploy
When ready to deploy changes:

```bash
git add site/
git commit -m "Import production cPanel site as source of truth"
git push origin main
```

GitHub Actions will automatically deploy to cPanel.

---

## Troubleshooting

**Q: I don't see .htaccess**
- In cPanel File Manager, click the gear icon (Settings)
- Check "Show Hidden Files (dotfiles)"
- Click Save

**Q: The zip contains a parent folder**
- Extract the zip
- Move contents from `public_html/` up one level into `scratch/cpanel-live-import/`
- Files should be directly in the import folder, not nested

**Q: Some files are missing**
- Make sure you selected all files before compressing
- Include the entire `assets/` directory
- Don't forget `.htaccess`
