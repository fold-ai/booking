-- ============================================================
-- v0.8 — Worker hours tracking & payroll
-- ============================================================
-- Adds pay rates to workers, a per-business timezone, and two new
-- tables:
--   time_entries — hours worked, auto-generated from completed
--                  bookings + manual entries a manager adds.
--   payouts      — money actually paid to a worker.
--
-- Pay data is sensitive. RLS lets only the business OWNER and
-- MANAGERS (workers.is_manager = true) read/write payroll for their
-- own business. A worker may SELECT only their OWN rows and can
-- never write — so no one ever sees another worker's pay.
--
-- Money is stored as numeric (never float). Auto entries are
-- idempotent: re-running a booking status change never duplicates
-- hours.
--
-- Idempotent — safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. workers: pay rate + pay type
--    pay_type is 'hourly' today; 'flat' (per-job) and 'salary'
--    are allowed by the constraint so they can be added later
--    without a schema change.
-- ------------------------------------------------------------
alter table public.workers
  add column if not exists hourly_rate numeric,
  add column if not exists pay_type    text not null default 'hourly';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'workers_pay_type_check') then
    alter table public.workers
      add constraint workers_pay_type_check check (pay_type in ('hourly', 'flat', 'salary'));
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. businesses: local timezone
--    Used to turn a booking's start_at (stored UTC) into the
--    correct local calendar date for a time entry.
-- ------------------------------------------------------------
alter table public.businesses
  add column if not exists timezone text not null default 'America/New_York';

-- ------------------------------------------------------------
-- 3. time_entries — hours worked (auto from bookings + manual)
-- ------------------------------------------------------------
create table if not exists public.time_entries (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  worker_id   uuid not null references public.workers(id)    on delete cascade,
  booking_id  uuid references public.bookings(id) on delete set null,
  entry_date  date not null,
  hours       numeric not null default 0 check (hours >= 0),
  notes       text,
  source      text not null default 'manual' check (source in ('booking', 'manual')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists time_entries_biz_worker_date_idx
  on public.time_entries(business_id, worker_id, entry_date);
create index if not exists time_entries_booking_idx
  on public.time_entries(booking_id);

-- At most one AUTO row per (booking, worker). Manual entries are exempt
-- (partial index), so a manager can still log extra time against the
-- same booking. This is what makes the booking trigger idempotent.
create unique index if not exists time_entries_booking_worker_uniq
  on public.time_entries(booking_id, worker_id)
  where source = 'booking';

-- ------------------------------------------------------------
-- 4. payouts — money actually paid to a worker
-- ------------------------------------------------------------
create table if not exists public.payouts (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses(id) on delete cascade,
  worker_id    uuid not null references public.workers(id)    on delete cascade,
  amount       numeric not null default 0 check (amount >= 0),
  paid_on      date not null default current_date,
  method       text not null default 'other' check (method in ('cash', 'check', 'venmo', 'zelle', 'other')),
  notes        text,
  period_start date,
  period_end   date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid references auth.users(id) on delete set null default auth.uid()
);

create index if not exists payouts_biz_worker_paid_idx
  on public.payouts(business_id, worker_id, paid_on);

-- ------------------------------------------------------------
-- 5. updated_at triggers (set_updated_at() first added in v04;
--    re-created here so v08 is self-contained).
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_time_entries_updated_at on public.time_entries;
create trigger set_time_entries_updated_at
  before update on public.time_entries
  for each row execute function public.set_updated_at();

drop trigger if exists set_payouts_updated_at on public.payouts;
create trigger set_payouts_updated_at
  before update on public.payouts
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 6. RLS — managers/owner full CRUD; worker reads only their own.
--    Mirrors the owner-or-manager subquery pattern used elsewhere.
-- ------------------------------------------------------------
alter table public.time_entries enable row level security;
alter table public.payouts      enable row level security;

do $$ begin
  drop policy if exists "time_entries_manager_all"       on public.time_entries;
  drop policy if exists "time_entries_worker_select_own" on public.time_entries;
  drop policy if exists "payouts_manager_all"            on public.payouts;
  drop policy if exists "payouts_worker_select_own"      on public.payouts;
end $$;

-- time_entries: owner or manager of the business can do everything
create policy "time_entries_manager_all" on public.time_entries for all
using (
  business_id in (select id from public.businesses where owner_id = auth.uid())
  or business_id in (
    select business_id from public.workers
    where user_id = auth.uid() and is_manager = true
  )
)
with check (
  business_id in (select id from public.businesses where owner_id = auth.uid())
  or business_id in (
    select business_id from public.workers
    where user_id = auth.uid() and is_manager = true
  )
);

-- time_entries: a worker may READ only their own entries (never others')
create policy "time_entries_worker_select_own" on public.time_entries for select
using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);

-- payouts: owner or manager of the business can do everything
create policy "payouts_manager_all" on public.payouts for all
using (
  business_id in (select id from public.businesses where owner_id = auth.uid())
  or business_id in (
    select business_id from public.workers
    where user_id = auth.uid() and is_manager = true
  )
)
with check (
  business_id in (select id from public.businesses where owner_id = auth.uid())
  or business_id in (
    select business_id from public.workers
    where user_id = auth.uid() and is_manager = true
  )
);

-- payouts: a worker may READ only their own payouts (never others')
create policy "payouts_worker_select_own" on public.payouts for select
using (
  worker_id in (select id from public.workers where user_id = auth.uid())
);

-- ------------------------------------------------------------
-- 7. Auto-generate time entries from completed bookings
--    Fires on insert and on changes to status / worker_ids / times.
--    - status = 'completed'  → upsert one row per assigned worker,
--      hours = (end_at - start_at), entry_date in business-local tz.
--      Removes auto rows for workers no longer assigned.
--    - status left 'completed' → delete this booking's auto rows.
--    Idempotent via the partial unique index (on conflict do update).
-- ------------------------------------------------------------
create or replace function public.sync_booking_time_entries()
returns trigger
language plpgsql
security definer
as $$
declare
  biz_tz    text;
  dur_hours numeric;
  ent_date  date;
  wid       uuid;
begin
  if new.status = 'completed' then
    select coalesce(timezone, 'UTC') into biz_tz
      from public.businesses where id = new.business_id;
    if biz_tz is null then biz_tz := 'UTC'; end if;

    dur_hours := greatest(0, round(extract(epoch from (new.end_at - new.start_at)) / 3600.0, 2));
    ent_date  := (new.start_at at time zone biz_tz)::date;

    foreach wid in array coalesce(new.worker_ids, '{}'::uuid[])
    loop
      insert into public.time_entries
        (business_id, worker_id, booking_id, entry_date, hours, source, created_by)
      values
        (new.business_id, wid, new.id, ent_date, dur_hours, 'booking', null)
      on conflict (booking_id, worker_id) where source = 'booking'
      do update set
        hours       = excluded.hours,
        entry_date  = excluded.entry_date,
        business_id = excluded.business_id,
        updated_at  = now();
    end loop;

    -- drop auto rows for workers removed from the booking
    delete from public.time_entries
    where booking_id = new.id
      and source = 'booking'
      and worker_id <> all (coalesce(new.worker_ids, '{}'::uuid[]));
  else
    -- booking is no longer completed → remove its auto rows
    delete from public.time_entries
    where booking_id = new.id and source = 'booking';
  end if;

  return new;
end;
$$;

drop trigger if exists trigger_sync_booking_time_entries on public.bookings;
create trigger trigger_sync_booking_time_entries
  after insert or update of status, worker_ids, start_at, end_at on public.bookings
  for each row
  execute function public.sync_booking_time_entries();

-- ------------------------------------------------------------
-- 8. One-time backfill: existing completed bookings → time entries.
--    Safe / idempotent (on conflict do nothing).
-- ------------------------------------------------------------
insert into public.time_entries
  (business_id, worker_id, booking_id, entry_date, hours, source, created_by)
select
  b.business_id,
  wid,
  b.id,
  (b.start_at at time zone coalesce(biz.timezone, 'UTC'))::date,
  greatest(0, round(extract(epoch from (b.end_at - b.start_at)) / 3600.0, 2)),
  'booking',
  null
from public.bookings b
join public.businesses biz on biz.id = b.business_id
cross join lateral unnest(coalesce(b.worker_ids, '{}'::uuid[])) as wid
where b.status = 'completed'
on conflict (booking_id, worker_id) where source = 'booking' do nothing;
