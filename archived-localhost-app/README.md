# Archived Localhost App

⚠️ **THIS IS NOT THE PRODUCTION SITE**

This directory contains the Express.js application that was built locally but is **NOT** the real production site.

The real production site is in: `site/`

## What's in here:
- Express server (server.js)
- API routes (api/)
- Event handlers (handlers/)
- Supabase integration (lib/)

## Why it's archived:
- This was built without knowing the real cPanel site already existed
- The real production site serves static HTML from cPanel
- To avoid confusion, this app is quarantined here

## If you need to run it:
```bash
npm run start:archived-app
# or
npm run dev:archived-app
```

**Do not confuse this with production!**
