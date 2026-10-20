# Kon Club · Lanzamiento paralelo (configurado, NO ACTIVADO)

Actualización: 20/10/2026

## Dos canales en paralelo

- **Formulario anterior:** https://forms.gle/gJzzsfNnDLNY2eok6
- **Checkout nuevo:** `checkout.html`, en la rama de pruebas
  `feature/checkout-transferencias`; seguirá apagado hasta habilitar el
  interruptor frontend `data/checkout-config.js → allowLive` y
  `public.kon_events.sales_open`.
- **Edición:** `halloween`, La Casa Lobo × The Rocky Horror Picture Show,
  miércoles 25/11/2026. El **horario definitivo y flyer actualizado deben
  confirmarse**: el registro de Supabase todavía tiene 17:00 como horario
  heredado; el afiche anterior decía 25/10 y está oculto en la portada
  de pruebas.
- La cuenta de Gmail `konclub.entradas@gmail.com` está conectada para
  pruebas. Los mensajes reales siguen desactivados.

## Cupos TOTALES COMPARTIDOS confirmados

| Producto | Cupo total | Formulario anterior (foto inicial) | Margen conservador |
|---|---:|---:|---:|
| Entrada general | 100 | 22 | 2 |
| Post-película | 50 | 2 | 2 |
| Fanzine | 10 | 3 | 1 |

Los valores de `kon_products.capacity` se configuraron solamente
para la edición real `halloween`; staging no se modificó. Los anteriores
provienen de FECHAS, no de pedidos importados a Supabase. La foto todavía
NO está sincronizándose automáticamente, de modo que `last_synced_at=NULL`.

**Stock web disponible:** cupo total MENOS unidades del formulario anterior
MENOS reservas válidas de pedidos web MENOS margen preventivo. La web
**no habilita** pedidos sin el reporte actualizado de la planilla real
(máximo 12 min) o sin cupos para las tres categorías.

**Riesgo restante:** Google Forms y Supabase no comparten una operación
transaccional. Aunque el trigger de Sheets reporte cantidades cada cinco
minutos, la venta paralela puede cambiar antes de su siguiente reporte.
Por eso mantenemos buffers (2, 2 y 1) y recomendamos supervisión de
cupos y cierre anticipado al acercarse al límite.

## Conservación de inscripciones

La planilla oficial `Kon Club: FECHAS`, pestaña
`KON CLUB: (Alimme) - Casa Lobo & Rocky Horror`,
sigue siendo la lista unificada. Las filas que provienen del
formulario anterior no se reescriben ni importan como nuevos pedidos.
En la columna L esas filas no tienen `ID_PEDIDO`.

Las nuevas compras tienen un ID de Supabase en la columna L y se
anexan a la planilla automáticamente por `syncKonToSheet`. El
inventario que se reporta al backend suma solo filas SIN ID web para
evitar el doble conteo. No envía PII del formulario anterior; informa
solo cantidades agregadas de GENERAL, POST y FANZINE.

## Pasos para activar (AÚN NO REALIZADOS)

1. Desde Extensiones → Apps Script **de la planilla oficial**, reemplazar
   el contenido de Código.gs con
   [scripts/kon-sheets-sync.gs](../scripts/kon-sheets-sync.gs).
   **No cambiar `KON_SYNC_TOKEN`** ni usar el script de la copia de prueba.
2. Ejecutar `checkKonSync`. Debe mostrar conexión OK sin modificar filas.
3. Ejecutar `setupKonSync` para instalar o comprobar activadores:
   `syncKonToSheet` (5 min), `konOnEdit` (ediciones),
   `konOnSheetChange` (filas) y `konOnFormSubmit` (respuestas vinculadas).
   Si el formulario anterior envía sus respuestas a otra pestaña y se
   copian posteriormente a FECHAS, la actualización periódica seguirá
   tomando el conteo, pero se debe verificar el retraso real.
4. Ejecutar `syncLegacyInventoryKon` y comprobar en el panel
   **Control de cupos** que los números coincidan con la planilla y
   `SINCRONIZACIÓN ACTIVA`.
5. Completar revisión del horario, capacidad, alias real
   `KON.CLUB.GL`, precios actuales ($9.000, $7.000, $4.000),
   flyer del 25/11 y prueba con el checkout.
6. Verificar que la cuenta/proyecto Vercel permita uso comercial.
   La conexión de Vercel no otorgó permisos suficientes para consultar
   el plan del equipo, por lo que **no está confirmado**.
7. Probar otra compra sintética end-to-end en staging y la sincronización
   del script real sin afectar pedidos de compradores.
8. Recién con la aprobación expresa: fusionar la rama de pruebas a
   `main`, habilitar `sales_open=true` en el evento real y
   `allowLive:true` en la versión pública. Controlar la primera compra
   real y verificar la consolidación en la planilla.
9. Los mails de compradores requieren una autorización separada
   (`kon_mail_settings.enabled`), y los recordatorios requieren otra
   (`reminders_enabled` y fecha aprobada). **No se activaron**.

## Estado de seguridad

- Real event `sales_open=false`.
- Frontend `allowLive:false`.
- Email real `kon_mail_settings.enabled=false`.
- Recordatorios `reminders_enabled=false`.
- No se fusionó la rama ni se hizo ninguna compra real desde el checkout nuevo.
- El formulario anterior continúa independiente y no se debe modificar.
