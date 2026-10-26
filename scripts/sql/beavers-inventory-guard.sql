CREATE OR REPLACE FUNCTION public.kon_submit_order(p_event_slug text, p_name text, p_email text, p_instagram text, p_first_time boolean, p_discovery text, p_lines jsonb, p_token_hash text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_event public.kon_events%rowtype;
  v_item jsonb; v_product public.kon_products%rowtype;
  v_seen uuid[] := '{}'::uuid[];
  v_product_id uuid; v_qty integer; v_total integer := 0; v_count integer := 0;
  v_reserved bigint; v_inventory public.kon_legacy_inventory%rowtype; v_order public.kon_orders%rowtype;
begin
  if p_name is null or char_length(btrim(p_name)) not between 2 and 100
    or p_email is null or char_length(btrim(p_email)) not between 5 and 150
    or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    or char_length(coalesce(p_instagram,'')) > 80
    or char_length(coalesce(p_discovery,'')) > 150
    or p_token_hash is null or p_token_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'invalid_input' using errcode = '22023';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) not between 1 and 6 then
    raise exception 'invalid_items' using errcode = '22023';
  end if;
  select * into v_event from public.kon_events where slug=p_event_slug;
  if not found or (not v_event.sales_open and p_event_slug <> 'halloween-staging') then
    raise exception 'sales_closed' using errcode='P0001';
  end if;
  if p_event_slug in ('halloween','beavers') then
    select * into v_inventory from public.kon_legacy_inventory
      where event_id=v_event.id for share;
    if not found or v_inventory.last_synced_at is null
       or v_inventory.last_synced_at < now()-interval '12 minutes' then
       raise exception 'inventory_sync_required' using errcode='P0001';
    end if;
    if exists(select 1 from public.kon_products
       where event_id=v_event.id and enabled
       and (capacity is null or capacity<=0)) then
       raise exception 'capacity_not_configured' using errcode='P0001';
    end if;
  end if;
  if (select count(*) from public.kon_orders where lower(email)=lower(btrim(p_email))
        and created_at > now()-interval '1 hour') >= 3 then
    raise exception 'too_many_orders' using errcode='P0001';
  end if;
  -- Lock all referenced products in stable order for inventory calculations.
  perform id from public.kon_products
    where event_id=v_event.id and id in (select (x->>'id')::uuid from jsonb_array_elements(p_lines) x)
    order by id for update;
  for v_item in select value from jsonb_array_elements(p_lines)
  loop
    begin
      v_product_id := (v_item->>'id')::uuid;
      v_qty := (v_item->>'qty')::integer;
    exception when others then
      raise exception 'invalid_items' using errcode='22023';
    end;
    if v_product_id = any(v_seen) or v_qty is null or v_qty < 1 then
      raise exception 'invalid_items' using errcode='22023';
    end if;
    v_seen := array_append(v_seen,v_product_id);
    select * into v_product from public.kon_products
      where id=v_product_id and event_id=v_event.id and enabled=true;
    if not found or v_qty>v_product.per_order_max then
      raise exception 'invalid_items' using errcode='22023';
    end if;
    select coalesce(sum(l.quantity),0) into v_reserved
      from public.kon_order_lines l join public.kon_orders o on o.id=l.order_id
      where l.product_id=v_product_id and o.status in ('pending','verified','courtesy')
      and (o.status <> 'pending' or o.expires_at>now() or o.proof_received_at is not null);
    if p_event_slug in ('halloween','beavers') then
       v_reserved:=v_reserved + case v_product.slug
         when 'general' then v_inventory.general_qty + v_inventory.safety_margin_general
         when 'post' then v_inventory.post_qty + v_inventory.safety_margin_post
         when 'fanzine' then v_inventory.fanzine_qty + v_inventory.safety_margin_fanzine
         else 0
       end;
    end if;
    if v_product.capacity is not null and v_reserved+v_qty>v_product.capacity then
      raise exception 'not_enough_capacity' using errcode='P0001';
    end if;
    v_total := v_total+v_qty*v_product.price_ars;
    v_count := v_count+v_qty;
  end loop;
  if v_count>30 or v_total>2000000 then
    raise exception 'invalid_items' using errcode='22023';
  end if;
  insert into public.kon_orders(event_id,full_name,email,instagram,first_time,
    discovery_source,amount_expected_ars,proof_token_sha256)
  values(v_event.id,btrim(p_name),lower(btrim(p_email)),btrim(coalesce(p_instagram,'')),
    p_first_time, left(btrim(coalesce(p_discovery,'')),150),v_total,p_token_hash)
  returning * into v_order;
  for v_item in select value from jsonb_array_elements(p_lines)
  loop
    v_product_id := (v_item->>'id')::uuid;
    v_qty := (v_item->>'qty')::integer;
    select * into v_product from public.kon_products where id=v_product_id;
    insert into public.kon_order_lines(order_id,product_id,quantity,unit_price_ars)
    values(v_order.id,v_product_id,v_qty,v_product.price_ars);
  end loop;
  insert into public.kon_order_audit(order_id,action,new_status,actor_source)
    values(v_order.id,'created','pending','system');
  return jsonb_build_object('id',v_order.id,'code',v_order.order_code,
    'total',v_total,'status',v_order.status,'expires_at',v_order.expires_at);
end $function$
