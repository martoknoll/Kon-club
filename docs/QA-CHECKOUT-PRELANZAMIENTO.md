# QA del prelanzamiento paralelo — Kon Club

**Preparación. No publicar ni cobrar.**

## Componentes reutilizados
- Web / checkout por transferencia: `checkout.html` + `js/checkout.js`.
- Checkout ficticio: `checkout-test.html` + `js/checkout-test.js`; exige sesión de administrador.
- Panel: `admin.html` con selector **PRUEBA · NO REAL**.
- Backend: Supabase `Kon Club` / Edge Function `kon-tickets` / RPC `kon_submit_order`.
- Planilla histórica real: `Kon Club: FECHAS`, pestaña `KON CLUB: (Alimme) - Casa Lobo & Rocky Horror`.
- Planilla aislada de pruebas: `Kon Club - FECHAS [PRUEBA - DATOS FICTICIOS]`.

## Interruptores (deben seguir apagados)
- Archivo `data/checkout-config.js`: `allowLive: false`, `legacyFormPublic: false`.
- Tabla `kon_events`, evento `halloween`: `sales_open: false`.
- Email transaccional: `kon_mail_settings.enabled: false`.
- Recordatorios: `kon_mail_settings.reminders_enabled: false`.

## Tarifas y alias confirmados
- **Entrada general:** ARS $9.000.
- **Post-película:** ARS $7.000.
- **Fanzine:** ARS $4.000.
- **Alias:** `KON.CLUB.GL`.
- Confirmación de la organización: 20/10/2026. No se requieren nuevas confirmaciones de esos importes.

## Capacidades y sincronización
- GENERAL: 100 unidades globales.
- POST: 50 unidades globales.
- FANZINE: 10 unidades globales.
- Los 12 registros históricos sumaban inicialmente 22/2/3, pero no son ventas bancarias necesariamente verificadas.
- Si el campo `kon_legacy_inventory.last_synced_at` está vacío o tiene más de 12 minutos, el backend **rechaza pedidos reales**.
- El script `scripts/kon-sheets-sync.gs` quedó instalado y autorizado en Apps Script *de la planilla real*, con los cuatro activadores; reportó exitosamente a Supabase. Continuar verificando ejecuciones automáticas y reportes recientes (no asumir que no puedan fallar). Conservar el token en Script Properties; nunca pegarlo en GitHub o el chat.
- El Form antiguo NO descuenta unidades de manera atómica al mismo tiempo que los pedidos web. La sincronización periódica y el margen 2/2/1 reducen riesgos, pero **no garantizan stock exclusivo**. Antes de abrir ambos canales definir una reserva de stock para Forms o revisión previa con tope de aceptación; de otro modo hay riesgo de sobreventa.

## Prueba segura desde navegador
1. Abrir la vista previa (Preview, NO el dominio público) en `/admin.html`. Iniciar sesión con una cuenta de editor autorizada, con correo confirmado.
2. Elegir **PRUEBA · NO REAL** y abrir `/checkout-test.html`.
3. Elegir 1 entrada general + 1 fanzine. El servidor debe calcular $13.000, sin transferir dinero.
4. Generar el comprobante **ficticio PNG** desde la propia interfaz (no subir recibos personales).
5. Enviar el archivo de prueba y revisar el pedido en el panel de **PRUEBA**. Verificar que la evidencia sólo se abre mediante URL firmada.
6. Sincronizar o esperar el trigger de la **planilla de pruebas**: confirmar nueva fila con UUID, origen WEB y estado PENDIENTE, sin modificar otras filas.
7. En el panel, marcar **CORTESÍA** (prohibido marcar VERIFICADO en staging). Volver a sincronizar y constatar la actualización a CORTESIA.
8. Volver a la edición **REAL** en el panel: no debe haber pedidos de prueba ni ventas abiertas.
9. Probar con dos sesiones ficticias creando solicitudes a la vez; comprobar que no superan capacidades en un entorno de staging con límites propios antes de afirmar control de concurrencia.
10. Revisar en desktop y celular el checkout, los botones de regreso, los estados deshabilitados y que **FORMULARIO ANTERIOR** no sea visible en la home.

## Pendientes antes de publicar
- **Confirmados:** domingo 25/10/2026, 17:00–23:00 y flyer original con 25/10. La versión nueva del checkout y la fecha del evento en Supabase ya fueron corregidas; queda pendiente desplegar el frontend actualizado.
- Verificar que la sincronización de `Kon Club: FECHAS` funciona de forma sostenida sin duplicados.
- Definir límites compartidos de ambos canales con una política segura de reservas del Form.
- El organizador completó una prueba end-to-end del checkout ficticio autenticado; se verificaron cuatro pedidos en Supabase y cuatro en Sheets de prueba (dos tenían comprobantes adjuntos). Pendiente la revisión de aceptación con la versión final publicada, incluida concurrencia.
- Validar permisos de panel, tratamiento y retención de comprobantes, errores, antiabuso y política de reembolsos.
- Confirmar hosting apto para operaciones comerciales. **Vercel Hobby** no está previsto para sitios comerciales.
- Aprobar explícitamente lanzamiento, fusionar los cambios y recién entonces abrir los interruptores de venta. El lanzamiento no forma parte de esta rama.

## Notas
La rama `prep/prelanzamiento-stock-compartido-20261020` era un borrador anterior basado en el sitio demo sin checkout. Esta rama, que parte de `feature/checkout-transferencias`, incorpora la implementación de checkout ya desarrollada y reemplaza ese borrador como base para la QA.


## Regla comercial confirmada: reserva automática en Google Forms

En Google Forms, **cada respuesta enviada reserva sus cantidades de GENERAL, POST y FANZINE en ese momento**, aunque el pago todavía esté pendiente. Por lo tanto:
- El cómputo de `konLegacyCounts_` es correcto al incluir filas sin pago; **nunca restar solamente transferencias verificadas**.
- La cancelación/rechazo explícitos pueden liberar cantidades solamente cuando el equipo decida que esa reserva deja de ser válida.
- En la base de datos, `kon_legacy_inventory` toma sumas desde FECHAS, **no directamente desde Google Forms**. Si FECHAS no se actualiza inmediatamente con cada respuesta, el cómputo puede omitir reservas ya aceptadas por Forms.
- La sincronización de cinco minutos y el buffer no garantizan cupos simultáneos. Hasta comprobar cómo el formulario vuelca las respuestas y establecer control de aceptación o cuotas por canal, **no habilitar el checkout web real**.
- Confirmar antes de cualquier integración: ¿cada envío del Google Form aparece automáticamente en la pestaña `KON CLUB: (Alimme) - Casa Lobo & Rocky Horror` de la planilla FECHAS, o alguien pasa esa información manualmente o por otra automatización?
