-- Fechas de Kon Club visibles en las capturas de Google Calendar.
-- Son BORRADORES: sin horario, película, flyer, venta ni recordatorio.
-- El 25/11/2026 es la edición real existente, pendiente de reconciliar con
-- las capturas (en ellas aparecen 08/11 y 22/11, NO aparece 25/11).
create table if not exists public.kon_planned_dates (
  id uuid primary key default gen_random_uuid(),
  event_date date not null unique,
  label text not null default 'Kon Club',
  film_title text,
  flyer_url text,
  starts_at timestamptz,
  notes text,
  planning_status text not null default 'tentative'
    check (planning_status in ('tentative','confirmed','cancelled')),
  source text not null default 'calendar_screenshot',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint kon_planned_no_automatic_mail_or_sale
    check (starts_at is null or starts_at::date is not null)
);
alter table public.kon_planned_dates enable row level security;
revoke all on public.kon_planned_dates from anon,authenticated;
grant select on public.kon_planned_dates to service_role;
grant insert,update,delete on public.kon_planned_dates to service_role;
comment on table public.kon_planned_dates is
 'Internally planned Kon Club dates; not ticket events, no automatic reminders, no public sales.';

insert into public.kon_planned_dates(event_date,label,notes,source)
values
 ('2026-11-08','Kon Club','Horario, película y flyer pendientes; visible en calendario noviembre 2026','calendar_screenshot_2026_10_20'),
 ('2026-11-22','Kon Club','Horario, película y flyer pendientes; visible en calendario noviembre 2026','calendar_screenshot_2026_10_20'),
 ('2026-12-06','Kon Club','Horario, película y flyer pendientes; visible en calendario diciembre 2026','calendar_screenshot_2026_10_20'),
 ('2026-12-20','Kon Club','Horario, película y flyer pendientes; visible en calendario diciembre 2026','calendar_screenshot_2026_10_20'),
 ('2027-01-03','Kon Club','Horario, película y flyer pendientes; visible en calendario diciembre 2026 (semana de enero)','calendar_screenshot_2026_10_20')
on conflict (event_date) do nothing;
