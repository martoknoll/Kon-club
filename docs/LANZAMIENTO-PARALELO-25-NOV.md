# Lanzamiento en paralelo · Kon Club · 25 de noviembre 2026

ESTADO: PREPARADO EN RAMA DE PRUEBA, NO PUBLICADO PARA COBRAR.

## Consolidación
El formulario anterior continúa sin cambios. Google Sheets conserva sus filas históricas (A:F y cálculos H:J).
Los pedidos nuevos se guardan en Supabase y se anexan a la misma hoja usando columnas L:Q con UUID y origen WEB; cada sincronización posterior actualiza su fila, sin duplicarla.
El Apps Script real ahora cuenta SOLO las filas sin ID_PEDIDO y comunica únicamente números agregados, jamás nombres o correos de asistentes antiguos.

## Foto inicial de la hoja REAL FECHAS · 20/10/2026
- 12 filas históricas
- 22 entradas generales
- 2 entradas post-película
- 3 fanzines
Son registros de entradas, NO necesariamente transferencias bancarias verificadas.
La tabla Supabase kon_legacy_inventory contiene la foto inicial, pero last_synced_at=NULL para impedir venta hasta instalar la nueva sincronización.

## Inventario compartido
El servidor exige en cada pedido web: ventas abiertas, reporte del formulario anterior de menos de 12 minutos, cupo total definido para todas las categorías y stock disponible.
Descuenta: compradores del formulario anterior + reservas web activas + margen de seguridad (general 2, post 2, fanzine 1).
La reserva y comprobación de pedidos simultáneos desde el checkout web son atómicas en la base de datos.
Google Forms, al ser externo, NO participa en esa transacción; las respuestas del viejo canal pueden llegar después de la última lectura. El margen mitiga pero no elimina el riesgo.
Si hay pocos lugares, limitar cupos por canal o cerrar temporalmente uno.

## Actualizar Apps Script de la planilla REAL sin habilitar compras
1. Abrir https://docs.google.com/spreadsheets/d/1DZ_yhLnzOVMHhBhsI_3x2QlLzcKcceDddyCjDDbGC7o/edit
2. Extensiones -> Apps Script. Hacer copia de seguridad del contenido anterior.
3. Reemplazar Código.gs por el archivo scripts/kon-sheets-sync.gs del branch feature/checkout-transferencias.
4. Conservar la Script Property KON_SYNC_TOKEN, sin cambiar su valor.
5. Ejecutar setupKonSync para instalar trigger periódico, onEdit, onChange y onFormSubmit.
6. Ejecutar syncLegacyInventoryKon. Comparar las cantidades informadas con la planilla ACTUAL (pueden haber cambiado desde la foto inicial).
7. Abrir /admin.html en el preview de Vercel y comprobar CONTROL DE CUPOS, último reporte y disponibilidad.
8. Si el Google Form escribe primero en otra hoja, el trigger cada cinco minutos sigue siendo obligatorio; el onFormSubmit local solo ve respuestas en la pestaña FECHAS.

## Datos y autorizaciones pendientes
- Cupo TOTAL de ENTRADA GENERAL, POST y FANZINE (Supabase actualmente capacity=NULL en todos).
- Confirmar precios 9000/7000/4000 ARS, alias KON.CLUB.GL y dirección.
- Confirmar el horario del 25/11; 17:00 en Supabase procede de una configuración vieja y NO quedó ratificado.
- Link exacto del Google Form anterior para enlazarlo desde la home: data/checkout-config.js legacyFormUrl (vacío hasta recibirlo).
- Flyer actualizado para 25/11: el flyer existente dice 25/10 y queda oculto por un placeholder editorial en el preview.
- Confirmar que el hosting Vercel contratado admite actividad comercial; el conector no pudo leer el plan del equipo (403, falta autorización).
- Prueba adicional de los endpoints desde navegador ya instalado el inventario.
- Revisión final de privacidad, retención de comprobantes y atención a los compradores.

## Activación: mantener apagada hasta la verificación final
- Rama main y dominio oficial siguen sin cambios; todo lo preparado está en feature/checkout-transferencias.
- Supabase kon_events.sales_open=false, checkout allowLive=false.
- Gmail kon_mail_settings.enabled=false y reminders_enabled=false.
- Tras QA, autorizar despliegue/merge, activar servidor y checkout conjuntamente y observar primeras órdenes y sincronización.
- Los asistentes históricos NO recibirán recordatorios automáticos por el nuevo sistema sin una integración separada.

## Pruebas SQL reversibles completadas (sin clientes reales)
- Reporte viejo ausente/vencido bloquea registro.
- Capacidad sin configurar bloquea registro.
- Inventario considera compras anteriores y pedidos web.
- GENERAL=22 previo, margen=2, cupo total=24 bloquea entrada adicional.
- Cupo total=25 admite solo una entrada web adicional.
- Todas las simulaciones fueron revertidas; ninguna nueva venta real se grabó.