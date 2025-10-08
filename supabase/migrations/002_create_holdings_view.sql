-- Create a view to aggregate holdings per user and symbol
create or replace view public.holdings_per_user as
select
    user_id,
    symbol,
    sum(amount)
::numeric
(24,8) as total
from public.transactions
group by user_id, symbol;

create index
if not exists holdings_user_symbol_idx on public.holdings_per_user
(user_id, symbol);
