# Timbrelio starter — milestone 1

This starter creates the first working foundation for Timbrelio:
- Responsive dashboard
- Email/password sign-up and sign-in with Supabase
- Create and list private user projects
- Upload original audio into a private Supabase Storage bucket
- Netlify build and single-page-app routing configuration

**This is not the complete music platform yet.** It does not yet implement stem separation, voice conversion, a full DAW, Auto-Tune/pitch correction, mixing or mastering engines. Those require later development and, for AI audio processing, a separate processing service.

## 1. Prepare Supabase

1. Open your Timbrelio project in Supabase.
2. Open SQL Editor and create a new query.
3. Open `supabase/schema.sql` from this project, copy all its contents, paste into the SQL Editor and run it.
4. In Project Settings > API Keys, copy the Project URL and Publishable key.

The SQL creates `projects` and `audio_assets`, enables Row Level Security, and creates a private `audio-originals` bucket with a 50 MB starter upload limit.

## 2. GitHub and Netlify

Upload the extracted contents of this folder to a new GitHub repository. Do not upload only the ZIP file.

In Netlify:
1. Add a new site by importing an existing project from GitHub.
2. Select the Timbrelio repository.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add these environment variables:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase Publishable key
6. Deploy the site.

After changing environment variables, trigger a new deploy.

## Security

- Never put a Supabase secret key or service-role key in frontend environment variables.
- Never share your database password.
- Keep Row Level Security enabled.
- The publishable key is intended for browser use only when database access is protected by RLS.
- Use only audio and voices you own or are authorised to process.

## Upload limitations

The starter limits audio uploads to 50 MB. Before accepting large WAV sessions in production, increase storage limits and implement resumable uploads (for example, TUS). Do not treat this starter as a production-ready DAW.
