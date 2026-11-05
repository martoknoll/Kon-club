-- Kon Club: atribución opcional de compras desde el reel publicitado.
-- Solo metadatos. No cambia precios, cupos, estado de ventas ni RLS.
alter table public.kon_orders
  add column if not exists from_promoted_reel boolean not null default false;

comment on column public.kon_orders.from_promoted_reel is
  'Comprador declara que llegó al checkout por el reel publicitado en Instagram';
