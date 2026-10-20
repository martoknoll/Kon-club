-- Shared capacity confirmed by Kon Club for parallel sales (2026-10-20).
-- Existing Google Form: https://forms.gle/gJzzsfNnDLNY2eok6
-- This migration ONLY sets real event product capacities. Sales remain OFF.
do $confirmed_capacity$
declare v_count integer;
begin
 update public.kon_products p
 set capacity=case p.slug
   when 'general' then 100
   when 'post' then 50
   when 'fanzine' then 10 end
 from public.kon_events e
 where e.id=p.event_id
   and e.slug='halloween'
   and e.sales_open=false
   and p.slug in ('general','post','fanzine');
 get diagnostics v_count=row_count;
 if v_count<>3 then raise exception 'exactly_three_halloween_products_required';end if;
end $confirmed_capacity$;
