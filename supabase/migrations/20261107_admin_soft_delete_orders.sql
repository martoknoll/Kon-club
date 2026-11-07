-- Kon Club / baja administrativa de reservas web.
-- Aplicar ANTES de desplegar kon-tickets y actualizar Apps Script.
-- No elimina pedidos existentes ni modifica el estado de ventas.
alter table public.kon_orders
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by text;
create index if not exists kon_orders_deleted_at_idx
  on public.kon_orders (event_id, deleted_at);
comment on column public.kon_orders.deleted_at is
  'Baja administrativa: no aparece en admin ni sync-export; el export envía su ID para limpiar exclusivamente la fila web';
comment on column public.kon_orders.deleted_by is
  'Correo del editor autorizado que realizó la baja';
