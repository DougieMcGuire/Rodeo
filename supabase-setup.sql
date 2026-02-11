-- RODEO GAME DATABASE SETUP
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- 1. Create storage bucket for avatars (if not exists)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. Set storage policy to allow anyone to upload/read
create policy "Anyone can upload avatars"
on storage.objects for insert
with check (bucket_id = 'avatars');

create policy "Anyone can read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

-- 3. Create tables
create table if not exists public.rooms (
    id text primary key,
    host_id text not null,
    game_mode text,
    state text default 'lobby',
    created_at timestamp with time zone default now()
);

create table if not exists public.players (
    id bigserial primary key,
    room_id text references public.rooms(id) on delete cascade,
    player_id text not null,
    name text not null,
    avatar_url text,
    join_order integer,
    created_at timestamp with time zone default now(),
    unique(room_id, player_id)
);

create table if not exists public.game_state (
    room_id text primary key references public.rooms(id) on delete cascade,
    game_type text,
    current_data jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default now()
);

-- 4. Enable Row Level Security
alter table public.rooms enable row level security;
alter table public.players enable row level security;
alter table public.game_state enable row level security;

-- 5. Create permissive policies (for party game with friends)
create policy "Allow all operations on rooms"
on public.rooms for all
using (true)
with check (true);

create policy "Allow all operations on players"
on public.players for all
using (true)
with check (true);

create policy "Allow all operations on game_state"
on public.game_state for all
using (true)
with check (true);

-- 6. Enable Realtime
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table game_state;

-- Done! Your database is ready to use.
