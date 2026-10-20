# KON CLUB · Lanzamiento en paralelo: Google Form anterior + checkout web

**Estado actual: PREPARADO, NO PUBLICADO.** No activar ventas hasta completar la lista de verificación.

## Dos canales de entrada

**Canal A — Google Form anterior (sigue activo):**
- Continúa funcionando sin modificaciones y conserva todas las inscripciones.
- La planilla central es [Kon Club: FECHAS](https://docs.google.com/spreadsheets/d/1DZ_yhLnzOVMHhBhsI_3x2QlLzcKcceDddyCjDDbGC7o/edit), pestaña
  `KON CLUB: (Alimme) - Casa Lobo & Rocky Horror`.
- Las filas anteriores no tienen `ID_PEDIDO` en columna L.
- Relevamiento inicial de la planilla: **22 generales, 2 post-película y 3 fanzines (12 registros)**.
  Estas cantidades pueden cambiar y **NO** representan cupos disponibles.
- No se migran sus datos personales a Supabase. Solo los totales por producto.

**Canal B — Nuevo checkout web (todavía cerrado):**
- Cada compra se guarda en `kon_orders` y `kon_order_lines` en Supabase.
- Los comprobantes se guardan privados, y el equipo los revisa en el panel.
- El Apps Script de FECHAS agrega una fila por cada pedido web, marcada en
  columna L con UUID, O=`WEB` y Q con el código de pedido.
- El mismo script actualiza estado y pago de los pedidos web aprobados.
- No cambia las filas históricas A:F ni fórmulas de recaudación H:J, salvo los
  nuevos pedidos añadidos.
- Si falla temporalmente el email automático, el panel sigue permitiendo validar
  pagos manualmente; el equipo debe comunicarse directamente con la persona.

## Una sola lectura de cupos para el checkout nuevo

El checkout real solo puede aceptar pedidos cuando:
1. `kon_events.sales_open=true` (por ahora **false**);
2. `data/checkout-config.js` tiene `allowLive=true` (por ahora **false**);
3. Las tres capacidades totales están definidas en `kon_products.capacity`
   (por ahora todas `null`);
4. El resumen del formulario anterior llega a Supabase con menos de 12 minutos
   de antigüedad (por ahora `last_synced_at=null`: pendiente instalar script).

Fórmula del cupo publicable para cada producto:
`MAX(0, capacidad_total - cupos_formulario_anterior - reservas_checkout_web - margen_preventivo)`.

Margen provisional para cubrir el tiempo entre sincronizaciones:
- General: 2.
- Post-película: 2.
- Fanzine: 1.

Estos valores se pueden revisar antes de abrir ventas. **No constituyen una garantía absoluta contra la sobreventa** si el Google Form antiguo sigue vendiendo por su cuenta sin límite. Hay que confirmar su cupo y coordinar el cierre manual del antiguo cuando se alcance el máximo disponible. El formulario antiguo no recibe una validación atómica directa de Supabase.

En Supabase se implementó un guard en la función `kon_submit_order`. Incluso si alguien intenta llamar a la API sin pasar por la interfaz, el pedido real se rechaza si los datos de capacidad faltan o están desactualizados. Los pedidos de pruebas permanecen aislados en `halloween-staging`.

## Actualizar el Apps Script de la planilla REAL (pendiente)

1. Abrir la planilla FECHAS real y **Extensiones → Apps Script**.
2. Sustituir el contenido de `Código.gs` por el archivo actualizado
   [scripts/kon-sheets-sync.gs](../scripts/kon-sheets-sync.gs).
3. Conservar la propiedad privada de proyecto `KON_SYNC_TOKEN`; **no volver a generar un token**.
4. Guardar y ejecutar `setupKonSync`. No modifica filas históricas con ID vacío;
   instala, si faltan, activadores de edición, cambio de hoja, envío del Form
   y ejecución cada cinco minutos.
5. Ejecutar manualmente `syncLegacyInventoryKon` o `syncKonToSheet`.
6. En el [panel de administración](../admin.html) comprobar **CONTROL DE CUPOS**.
   Debe mostrar los totales del Google Form y «SINCRONIZACIÓN ACTIVA».
7. Verificar que las columnas A:F y las fórmulas H:J siguen intactas.

El reporte contiene solo sumas, NO nombres, correos, respuestas personales ni pagos bancarios. Las hojas de prueba se mantienen aisladas y no necesitan este cambio.

## Pantalla web y fecha

- Edición activa: *La Casa Lobo × The Rocky Horror Picture Show*, miércoles 25 de noviembre de 2026.
- En la base figura **17:00** como hora heredada de la configuración anterior,
  **pendiente de confirmar** con el equipo.
- La dirección configurada es Virrey Olaguer y Feliú 3121.
- Los precios de referencia son General $9.000, Post $7.000, Fanzine $4.000.
- Alias configurado: KON.CLUB.GL.
- El flyer anterior dice 25/10. La portada de la rama muestra una gráfica tipográfica
  provisional para el 25/11 hasta contar con flyer correcto. El mail nunca enviará
  el póster de octubre para una fecha de noviembre.
- Para mostrar ambos enlaces en la home, ingresar la URL real del Google Form en
  `data/checkout-config.js`, campo `legacyFormUrl` (solo URLs HTTPS de
  `forms.gle` o `docs.google.com`). **El campo está vacío hasta recibirla**.
  El botón del checkout nuevo va a `checkout.html`.

## Gmail y hosting

- Remitente: konclub.entradas@gmail.com; respuestas: kon.club@proton.me.
- `kon_mail_settings.enabled=false` y `reminders_enabled=false`.
- No prometer emails automáticos hasta revisar el nuevo diseño, instalar el trigger
  y activar los envíos explícitamente. Las inscripciones anteriores no generan
  emails desde Supabase, porque no se importan allí.
- Según la política oficial de Vercel, **Hobby es personal/no comercial**.
  El sitio que recibe pagos requiere Pro/Enterprise o un hosting que permita
  actividad comercial. Confirmar el plan del proyecto ANTES de publicar venta.
- Revisión recomendable: permisos de editores, prueba de comprobante real seguro,
  condiciones de privacidad, antiabuso/inscripciones falsas y políticas de
  cancelación/reembolso.

## Activación definitiva (a realizar solo después de las confirmaciones)

1. Confirmar cupos totales y la coordinación con el Google Form anterior;
   precios, alias, lugar y horario.
2. Obtener URL del Form y confirmar el plan de hosting comercial.
3. Actualizar script en FECHAS y verificar sincronización de los totales.
4. Configurar capacidad de productos en Supabase; revisar
   **CONTROL DE CUPOS** en el panel, incluyendo margen.
5. Finalizar la QA en móvil y escritorio, y el envío y visualización del comprobante
   (NO usar datos reales en el entorno de staging).
6. Confirmar cómo se comunicará la aprobación si los emails automáticos siguen
   desactivados.
7. Solo entonces: permitir checkout en `data/checkout-config.js`,
   abrir `kon_events.sales_open`, fusionar PR 1 y verificar Vercel comercial.
8. Hacer **una compra controlada** en la URL pública y verificar que aparezca en
   Supabase, el panel y FECHAS sin modificar ninguna inscripción anterior.
9. Comprobar que el Google Form viejo sigue funcionando y monitorizar la
   primera hora de compras para evitar duplicados y exceso de reservas.

**No activar ahora:** faltan los cupos definitivos y la actualización del Apps Script.
