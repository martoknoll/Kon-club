# KON CLUB — Auditoría técnica del checkout (21/10/2026)

**Estado:** PREPARADO PARA QA FINAL, NO APTO AÚN PARA ACTIVAR VENTAS. Esta revisión es de código y consultas de solo lectura. **No activó pagos, no fusionó ramas ni creó pedidos.**

## Alcance verificado

- **Producción:** `main`, <https://kon-club.vercel.app/>. Contiene `checkout.html` como **demo local** sin llamadas `fetch` a Supabase ni carga de comprobantes, con los botones de la home conectados. El usuario ya comprobó que abre.
- **Implementación real:** rama `feature/checkout-transferencias`, [PR #1](https://github.com/martoknoll/Kon-club/pull/1) todavía **draft**, no fusionado. `data/checkout-config.js`: `allowLive:false`; `legacyFormPublic:false`.
- **Backend:** Supabase `ogrzuiwlyfobhtknjuzu`, Edge Function `kon-tickets` versión 18 activa; su archivo `index.ts` **coincide exactamente** con el del repositorio en la rama de checkout.
- **Edición real:** `halloween`, **domingo 25/10/2026, 17:00–23:00**. `sales_open:false`, cero pedidos web reales.
- **Tarifas y alias confirmados:** general ARS 9.000, post-película ARS 7.000, fanzine ARS 4.000; `KON.CLUB.GL`. Coinciden entre frontend y `kon_products`.
- **Cupos globales:** general 100, post 50, fanzines 10. Buffer preventivo 2/2/1. Última consulta: Google Forms reserva 29 generales, 2 post y 3 fanzines. Sin pedidos web reales, **remanente teórico web:** 69/46/6. Es una foto temporal: volver a consultar antes de activar.
- **Inventario compartido:** Google Sheets informa a Supabase cada ~5 minutos; el último reporte observado tenía ~2 minutos. El servidor exige sincronización menor a 12 minutos. El RPC `kon_submit_order` bloquea productos ordenados mediante `FOR UPDATE`, calcula reservas y evita cupos duplicados entre pedidos web concurrentes.
- **Pruebas previas:** 4 pedidos ficticios en `halloween-staging`, todos en estado cortesía; 2 comprobantes ficticios. No se crearon pedidos nuevos en esta auditoría.
- **Seguridad y pagos:** RLS activo en tablas relevantes; no se detectaron políticas públicas en `kon_*` ni en `storage.objects`. Funciones RPC críticas otorgadas a `service_role`, no a `anon`. Bucket `kon-payment-proofs` privado, límite 10 MB, PNG/JPEG/PDF; enlaces firmados solo para editor autenticado. Validación por firma de archivo y token para adjuntar comprobante. La aprobación exige `bank_checked` e importe recibido.
- **Emails:** `kon_mail_settings.enabled:false` y `reminders_enabled:false`; no hay envío automático al público.

## Pendientes y riesgos, por prioridad

### P0 — Antes de habilitar cobros

1. **Hosting comercial:** Vercel restringe **Hobby** a proyectos personales no comerciales. El historial indica que el proyecto utilizó Hobby, pero el estado actual del plan del equipo NO se pudo consultar por permiso 403. Comprobar el plan en Vercel y usar uno apto para cobrar entradas (Pro/Enterprise o alternativa permitida). Fuentes oficiales: https://vercel.com/docs/limits/fair-use-guidelines y https://vercel.com/legal/terms.
2. **Actualización entre rama pública y checkout:** la versión pública `main` avanzó con demo de entradas, sinopsis y cambios editoriales. PR #1 figura con `mergeable:false`; **no fusionarlo a ciegas** ni sustituir la home. Reconciliar ramas/archivos y verificar que sobreviven flyer, archivo desde Paprika #17, sinopsis y modo de venta cerrado mientras se prueba.
3. **Dos canales de reservas no atómicos entre sí:** aunque Google Forms reserva al enviar y el reporte es cada ~5 minutos, el checkout web no comparte la misma transacción con Forms. Buffer 2/2/1 reduce el riesgo, no lo elimina. Antes de abrir ambos canales, establecer un tope/cupo por canal, supervisión o mecanismo equivalente y validar que cada envío del Form aparece en FECHAS sin demora indebida.
4. **QA end-to-end de la versión candidata:** desde un navegador con editor autenticado, probar `checkout-test.html`, pedido ficticio y archivo de prueba, revisión en panel, Sheets aislada y comparación; luego ejecutar prueba de simultaneidad con dos sesiones y límites de staging configurados. Las pruebas anteriores acreditan funcionalidad básica pero no sustituyen esta aprobación final.
5. **Autorización explícita para la apertura:** cuando lo anterior esté resuelto, pedir autorización para cada cambio: desplegar el checkout real, `allowLive:true`, `kon_events.sales_open:true`. No activar correos ni recordatorios sin decisión separada.

### P1 — Calidad y experiencia

6. **CORS de previews:** la Edge Function permite `https://kon-club.vercel.app` y un alias de prueba fijo. Los despliegues de preview con URL aleatoria pueden ser rechazados por `origin_not_allowed`. Probar con una URL de preview autorizada o configurar la lista permitida de forma controlada, sin abrir orígenes arbitrarios.
7. **Comunicación al comprador:** sin email, el pedido queda identificado solo en la pantalla. Antes de vender, definir cómo conserva/recupera su código y cómo recibirá confirmación (operación manual o email autorizado por separado).
8. **Microcopy del checkout real:** `data/checkout-config.js` aún dice «Horario de ingreso por confirmar» en general y «horario a confirmar» para post-película. Se conoce la franja global 17:00–23:00, pero no inventar el horario de ingreso post-película.
9. **Administración:** validar permisos reales de usuarios, acceso a comprobantes firmados, errores, límites antiabuso, privacidad y política de cancelación/reembolso antes del primer pago.
10. **Publicación:** comprobar en incógnito y en móvil la versión candidata y sus botones; confirmar dominio de producción, assets y que la demo no se mezcle con checkout real.

## Secuencia recomendada

Confirmar alojamiento comercial → reconciliar `main` y la rama real sin pérdida de cambios → probar la versión candidata en preview autorizado → QA de concurrencia + plan de cupos compartidos → decidir canal de confirmaciones → aprobación explícita → habilitar frontend y backend → comprobar primera compra real y su asiento en la planilla.

**Regla permanente:** El archivo web empieza en Paprika (#17). Mantener la fecha 25/10, alias y precios confirmados. No tocar la planilla real ni el formulario anterior durante las pruebas. No usar dinero/comprobantes reales en staging.
