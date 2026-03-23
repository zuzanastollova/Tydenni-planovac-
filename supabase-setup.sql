-- Spusť tento SQL v Supabase SQL Editoru
-- (Supabase Dashboard → SQL Editor → New query)

-- Tabulka úkolů
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  hours numeric default 1,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  deadline date,
  completed boolean default false,
  created_at timestamp with time zone default now()
);

-- Tabulka plánů
create table plans (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  plan_data jsonb not null,
  tip text,
  share_id text default gen_random_uuid()::text,
  created_at timestamp with time zone default now()
);

-- Zabezpečení: každý vidí jen svá data (RLS)
alter table tasks enable row level security;
alter table plans enable row level security;

create policy "Users see own tasks" on tasks for all using (auth.uid() = user_id);
create policy "Users see own plans" on plans for all using (auth.uid() = user_id);
