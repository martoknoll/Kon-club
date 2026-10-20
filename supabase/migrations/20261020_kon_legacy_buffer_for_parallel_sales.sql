-- Margen preventivo mientras el Google Form anterior sigue aceptando personas.
-- No puede garantizar stock atómico entre Google Forms y Supabase.
alter table public.kon_legacy_inventory
 add column if not exists safety_margin_general integer not null default 2
  check (safety_margin_general between 0 and 100),
 add column if not exists safety_margin_post integer not null default 2
  check (safety_margin_post between 0 and 100),
 add column if not exists safety_margin_fanzine integer not null default 1
  check (safety_margin_fanzine between 0 and 100);

do $migration$
declare fn text; old_sql text; new_sql text;
begin
 select pg_get_functiondef(
  'public.kon_submit_order(text,text,text,text,boolean,text,jsonb,text)'::regprocedure
 ) into fn;
 old_sql:='       v_reserved:=v_reserved + case v_product.slug
         when ''general'' then v_inventory.general_qty
         when ''post'' then v_inventory.post_qty
         when ''fanzine'' then v_inventory.fanzine_qty
         else 0
       end;';
 new_sql:='       v_reserved:=v_reserved + case v_product.slug
         when ''general'' then v_inventory.general_qty + v_inventory.safety_margin_general
         when ''post'' then v_inventory.post_qty + v_inventory.safety_margin_post
         when ''fanzine'' then v_inventory.fanzine_qty + v_inventory.safety_margin_fanzine
         else 0
       end;';
 if position(old_sql in fn)=0 then raise exception 'unexpected_submit_order_guard';end if;
 execute replace(fn,old_sql,new_sql);
end $migration$;
