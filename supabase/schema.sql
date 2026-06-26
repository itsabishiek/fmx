-- FMX — Supabase schema (Postgres + RLS) for optional cloud sync.
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
-- Stores liked songs, user playlists, saved albums/artists/playlists, preferences,
-- and the Google profile. All access is owner-only via row-level security.
--
-- Re-runnable: uses "if not exists" / "drop policy if exists" so it's safe to apply again.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamptz default now()
);

create table if not exists public.liked_songs (
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id text not null,
  song jsonb not null,            -- full normalized AppSong (display without a re-fetch)
  created_at timestamptz default now(),
  primary key (user_id, song_id)
);

create table if not exists public.saved_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  item jsonb not null,            -- full AppCard (album / artist / playlist)
  created_at timestamptz default now(),
  primary key (user_id, item_id)
);

create table if not exists public.playlists (
  id text primary key,            -- client-generated LocalPlaylist.id (e.g. lp_...)
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at_ms bigint not null,  -- exact local createdAt (ms since epoch)
  created_at timestamptz default now()
);

create table if not exists public.playlist_songs (
  playlist_id text not null references public.playlists(id) on delete cascade,
  song_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  song jsonb not null,
  position int not null default 0,
  primary key (playlist_id, song_id)
);

create table if not exists public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  audio_quality text not null default '320kbps',
  autoplay boolean not null default true,
  updated_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Row-level security — owner-only on every table
-- ---------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.liked_songs    enable row level security;
alter table public.saved_items    enable row level security;
alter table public.playlists       enable row level security;
alter table public.playlist_songs enable row level security;
alter table public.preferences    enable row level security;

drop policy if exists "profiles_owner_all" on public.profiles;
create policy "profiles_owner_all" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "liked_songs_owner_all" on public.liked_songs;
create policy "liked_songs_owner_all" on public.liked_songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "saved_items_owner_all" on public.saved_items;
create policy "saved_items_owner_all" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "playlists_owner_all" on public.playlists;
create policy "playlists_owner_all" on public.playlists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "playlist_songs_owner_all" on public.playlist_songs;
create policy "playlist_songs_owner_all" on public.playlist_songs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "preferences_owner_all" on public.preferences;
create policy "preferences_owner_all" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Seed a profiles row when a new auth user is created (from the Google identity)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
