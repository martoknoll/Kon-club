-- Kon Club: inventario agregado del formulario anterior, sin exponer
-- nombres, correos ni pagos de asistentes.
-- No habilita ventas ni modifica pedidos existentes.
create table if not exists public.kon_legacy_inventory(
 event_id uuid primary key references public.kon_events(id) on delete cascade,
 general_qty integer not null default 0 check(general_qty between 0 and 10000),
 post_qty integer not null default 0 check(post_qty between 0 and 10000),
 fanzine_qty integer not null default 0 check(fanzine_qty between 0 and 10000),
 legacy_rows integer not null default 0 check(legacy_rows between 0 and 10000),
 last_synced_at timestamptz,
 sync_source text not null default 'initial_snapshot',
 updated_at timestamptz not null default now()
);
alter table public.kon_legacy_inventory enable row level security;
revoke all on public.kon_legacy_inventory from anon,authenticated;
grant select,insert,update on public.kon_legacy_inventory to service_role;

-- Foto inicial solo para que el panel muestre lo ya registrado.
-- last_synced_at=null impide ventas hasta que el Apps Script real esté conectado.
insert into public.kon_legacy_inventory(
 event_id,general_qty,post_qty,fanzine_qty,legacy_rows,last_synced_at,sync_source
)
select id,22,2,3,12,null,'read_only_baseline_2026_10_20'
from public.kon_events where slug='halloween'
on conflict(event_id) do nothing;

-- La verificación se hace dentro del RPC de compra y bajo un lock sobre
-- la fila de inventario: pedidos simultáneos del checkout NO omiten capacidad.
-- Una nueva inscripción del formulario antiguo aún puede llegar durante
-- el intervalo de sincronización: reservar un margen operativo y cerrar
-- el canal web al acercarse a agotar cupos.
do $migration$
declare fn text; check_from text; check_to text; reserved_from text; reserved_to text;
begin
 select pg_get_functiondef(
  'public.kon_submit_order(text,text,text,text,boolean,text,jsonb,text)'::regprocedure
 ) into fn;
 check_from:='  if (select count(*) from public.kon_orders where lower(email)=lower(btrim(p_email))';
 check_to:='  if p_event_slug=''halloween'' then
    select * into v_inventory from public.kon_legacy_inventory
      where event_id=v_event.id for share;
    if not found or v_inventory.last_synced_at is null
       or v_inventory.last_synced_at < now()-interval ''12 minutes'' then
       raise exception ''inventory_sync_required'' using errcode=''P0001'';
    end if;
    if exists(select 1 from public.kon_products
       where event_id=v_event.id and enabled
       and (capacity is null or capacity<=0)) then
       raise exception ''capacity_not_configured'' using errcode=''P0001'';
    end if;
  end if;
'||check_from;
 if position(check_from in fn)=0 then raise exception 'unexpected submit order function: order limiter missing';end if;
 fn:=replace(fn,check_from,check_to);

 reserved_from:='    if v_product.capacity is not null and v_reserved+v_qty>v_product.capacity then';
 reserved_to:='    if p_event_slug=''halloween'' then
       v_reserved:=v_reserved + case v_product.slug
         when ''general'' then v_inventory.general_qty
         when ''post'' then v_inventory.post_qty
         when ''fanzine'' then v_inventory.fanzine_qty
         else 0
       end;
    end if;
'||reserved_from;
 if position(reserved_from in fn)=0 then raise exception 'unexpected submit order function: inventory check missing';end if;
 fn:=replace(fn,reserved_from,reserved_to);
 if position('  v_reserved bigint; v_order public.kon_orders%rowtype;' in fn)=0
 then raise exception 'unexpected submit order function: declarations missing';end if;
 fn:=replace(fn,'  v_reserved bigint; v_order public.kon_orders%rowtype;',
   '  v_reserved bigint; v_inventory public.kon_legacy_inventory%rowtype; v_order public.kon_orders%rowtype;');
 execute fn;
end $migration$;
