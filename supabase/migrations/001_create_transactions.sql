-- enable UUID helper (needed for gen_random_uuid)
create extension
if not exists "pgcrypto";

-- Create transactions table
create table
if not exists public.transactions
(
  id uuid primary key default gen_random_uuid
(),
  user_id uuid not null references auth.users
(id) on
delete cascade,
  symbol text
not null,
  amount numeric
(24,8) not null,
  price_usd numeric
(24,8),
  order_type text not null check
(order_type in
('BUY','SELL')),
  -- transaction/trade date (use DATE if you only need day precision)
  date date not null,
  file_name text,
  inserted_at timestamptz not null default now
()
);

-- Indexes for common queries
create index
if not exists transactions_user_id_idx on public.transactions
(user_id);
create index
if not exists transactions_symbol_idx on public.transactions
(symbol);
create index
if not exists transactions_date_idx on public.transactions
(date);
create index
if not exists transactions_inserted_at_idx on public.transactions
(inserted_at);

-- Enable Row Level Security and add a policy so users only access their own rows
-- Note: creating policies may require running this with a privileged role in the SQL editor
alter table public.transactions enable row level security;

create policy
if not exists "users manage own transactions"
  on public.transactions
  using
(auth.uid
() = user_id)
  with check
(auth.uid
() = user_id);