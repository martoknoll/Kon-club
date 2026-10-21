# Candidato de lanzamiento — Kon Club (21/10/2026)

Código integrado a partir de la rama `main` (archivo, sinopsis y demo), sin fusionar la PR histórica divergente. Incluye checkout real, administración, prueba aislada y fuentes de backend/Apps Script.

## Rutas
- `/`: portada original + archivo desde Paprika (#17) + sinopsis
- `/checkout.html`: checkout real **todavía bloqueado** por `allowLive:false` y `kon_events.sales_open:false`; muestra vista previa mientras está cerrado
- `/checkout-demo.html`: demo local sin API, preservada para probar el diseño
- `/checkout-test.html`: pruebas con acceso autenticado, datos ficticios en staging
- `/admin.html`: panel administrativo autenticado

## Bloqueos P0
1. Confirmar alojamiento apto para ventas comerciales. En Vercel Hobby no corresponde recibir pagos.
2. Completar QA autenticado extremo a extremo, concurrencia y sincronización con Form; definir cupos compartidos o separación segura.
3. Comprobar cuentas de editor y permisos de subida/lectura de comprobantes; confirmar recuperación de código, atención y privacidad.
4. El equipo autoriza expresamente el paso de `allowLive` y `sales_open` de falso a verdadero solo cuando se complete el QA.
5. Si la página pasa a Cloudflare, agregar **el origen exacto** `https://...pages.dev` a la lista `acceptedOrigins` de la Edge Function, desplegarla con revisión y validar CORS. No aceptar comodines.

## Controles inmutables
- Fecha 25/10/2026; general 9.000, post 7.000, fanzine 4.000, alias KON.CLUB.GL.
- Inventario histórico reservado por Google Forms; no borrar ni hacer pruebas en Sheets real.
- Emails y recordatorios desactivados hasta permiso separado.
- No fusionar la PR #1 original, que diverge de `main`.
