-- Timbrelio initial database schema.
-- Run this entire file in Supabase Dashboard > SQL Editor > New query.

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.audio_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  storage_path text not null,
  original_filename text not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;
alter table public.audio_assets enable row level security;

drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects" on public.projects for select to authenticated using (user_id = auth.uid());
drop policy if exists "Users can create own projects" on public.projects;
create policy "Users can create own projects" on public.projects for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects" on public.projects for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects" on public.projects for delete to authenticated using (user_id = auth.uid());

drop policy if exists "Users can view audio in own projects" on public.audio_assets;
create policy "Users can view audio in own projects" on public.audio_assets for select to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "Users can add audio to own projects" on public.audio_assets;
create policy "Users can add audio to own projects" on public.audio_assets for insert to authenticated with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));
drop policy if exists "Users can delete audio in own projects" on public.audio_assets;
create policy "Users can delete audio in own projects" on public.audio_assets for delete to authenticated using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('audio-originals', 'audio-originals', false, 52428800, array['audio/mpeg','audio/wav','audio/mp4','audio/aac','audio/ogg','audio/flac','audio/x-wav'])
on conflict (id) do update set public = false;

drop policy if exists "Users can upload own original audio" on storage.objects;
create policy "Users can upload own original audio" on storage.objects for insert to authenticated
with check (bucket_id = 'audio-originals' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can read own original audio" on storage.objects;
create policy "Users can read own original audio" on storage.objects for select to authenticated
using (bucket_id = 'audio-originals' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete own original audio" on storage.objects;
create policy "Users can delete own original audio" on storage.objects for delete to authenticated
using (bucket_id = 'audio-originals' and (storage.foldername(name))[1] = auth.uid()::text);
