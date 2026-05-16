<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TalentMatch-AI

A Vite + React application with an Express server entrypoint and Supabase-ready frontend configuration.

## Local development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy envs:
   ```bash
   cp .env.example .env.local
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## Build for production

```bash
npm run build
```

## Vercel deployment

This repository is deployable on Vercel. In **Project Settings → Environment Variables**, add:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If using the Express/Gemini backend behavior, also set:

- `GEMINI_API_KEY`
- `APP_URL`

## Supabase SQL setup

Run these SQL files in Supabase SQL editor (in order):

1. `supabase/schema.sql`
2. `supabase/rls.sql`

They provide baseline profile/job/application/message tables and row-level security policies.
