-- Recordatorios de Kon Club · 24 horas antes
-- Aplicado en Supabase (proyecto Kon Club) el 20/10/2026.
-- Es una migración reproducible, los envíos quedan DESACTIVADOS.
alter table public.kon_mail_settings
 add column if not exists reminders_enabled boolean not null default false,
 add column if not exists reminder_approved_starts_at timestamptz;
alter table public.kon_mail_outbox drop constraint if exists kon_mail_outbox_kind_check;
alter table public.kon_mail_outbox
 add constraint kon_mail_outbox_kind_check
 check (kind in ('received','verified','courtesy','reminder'));
alter table public.kon_mail_outbox drop constraint if exists kon_mail_outbox_state_check;
alter table public.kon_mail_outbox
 add constraint kon_mail_outbox_state_check
 check (state in ('queued','sending','sent','failed','skipped'));

-- Solo confirmado/cortesía, con entrada (no solo fanzine).
-- Cuenta única por order_id+kind; el slug staging nunca se considera.
create or replace function public.kon_queue_due_reminders(p_at timestamptz default now())
returns integer language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 v_event public.kon_events%rowtype;
 v_settings public.kon_mail_settings%rowtype;
 v_count integer:=0;
begin
 select * into v_settings from public.kon_mail_settings where id=1;
 if not found or not coalesce(v_settings.enabled,false)
   or not coalesce(v_settings.reminders_enabled,false)
   or v_settings.reminder_approved_starts_at is null then return 0;end if;
 select * into v_event from public.kon_events where slug='halloween';
 if not found or v_event.starts_at is null
   or v_event.starts_at is distinct from v_settings.reminder_approved_starts_at
   or btrim(coalesce(v_event.address,''))='' then return 0;end if;
 -- Se empieza a las 24 horas previas, con margen de 2h para cron/colas.
 if p_at < v_event.starts_at-interval '24 hours'
   or p_at >= v_event.starts_at-interval '22 hours'
   or p_at >= v_event.starts_at then return 0;end if;

 insert into public.kon_mail_outbox(order_id,kind,recipient_email)
 select o.id,'reminder',o.email
 from public.kon_orders o
 where o.event_id=v_event.id
   and o.status in ('verified','courtesy')
   and o.email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
   and o.email !~* '@example\.(invalid|test)$'
   and exists (
    select 1 from public.kon_order_lines l join public.kon_products p on p.id=l.product_id
    where l.order_id=o.id and l.quantity>0 and p.slug in ('general','post')
   )
 on conflict(order_id,kind) do nothing;
 get diagnostics v_count=row_count;
 return v_count;
end;
$$;

-- Un reminder ya encolado se descarta si se cancela, reprograma o desautoriza.
create or replace function public.kon_claim_next_email(p_lease_sha256 text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 v public.kon_mail_outbox%rowtype;
 v_order public.kon_orders%rowtype;
 v_event public.kon_events%rowtype;
 v_settings public.kon_mail_settings%rowtype;
begin
 if p_lease_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'invalid_lease';end if;
 select * into v_settings from public.kon_mail_settings where id=1;
 if not found or not v_settings.enabled then return null;end if;
 loop
  select * into v from public.kon_mail_outbox
   where state='queued' order by created_at,id for update skip locked limit 1;
  if not found then return null;end if;
  if v.kind='reminder' then
   select * into v_order from public.kon_orders where id=v.order_id;
   select * into v_event from public.kon_events where id=v_order.event_id;
   if v_order.id is null or v_event.id is null or v_event.slug<>'halloween'
      or v_order.status not in ('verified','courtesy')
      or lower(v_order.email)<>lower(v.recipient_email)
      or not coalesce(v_settings.reminders_enabled,false)
      or v_settings.reminder_approved_starts_at is distinct from v_event.starts_at
      or v_event.starts_at is null
      or now()<v_event.starts_at-interval '24 hours'
      or now()>=v_event.starts_at-interval '22 hours'
      or not exists (
        select 1 from public.kon_order_lines l join public.kon_products p on p.id=l.product_id
        where l.order_id=v_order.id and p.slug in ('general','post') and l.quantity>0
      ) then
    update public.kon_mail_outbox set state='skipped',
       last_error='reminder_not_eligible_at_delivery' where id=v.id;
    continue;
   end if;
  end if;
  update public.kon_mail_outbox
   set state='sending',lease_sha256=p_lease_sha256,
      leased_at=now(),attempts=attempts+1 where id=v.id;
  return jsonb_build_object('id',v.id,'order_id',v.order_id,
   'kind',v.kind,'recipient',v.recipient_email);
 end loop;
end;
$$;

revoke all on function public.kon_queue_due_reminders(timestamptz)
 from public,anon,authenticated;
revoke all on function public.kon_claim_next_email(text)
 from public,anon,authenticated;
grant execute on function public.kon_queue_due_reminders(timestamptz),
 public.kon_claim_next_email(text) to service_role;
