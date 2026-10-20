# Diseño de emails Kon Club · Halloween

## Entrega

**Vista previa interactiva (sin envío):**
\`/mail-preview.html\` en el preview de Vercel de la rama
\`feature/checkout-transferencias\`.

**Vista previa exacta del recordatorio:**
\`/emails/recordatorio-24h-preview.html\`

Otros diseños:
- \`/emails/pedido-recibido-preview.html\`
- \`/emails/entrada-confirmada-preview.html\`
- \`/emails/invitacion-cortesia-preview.html\`

## Arte y estilo

- Flyer existente **La Casa Lobo × The Rocky Horror Picture Show**, publicado para **25/10**, el mismo usado por la web:
  \`public/media/df27d971f6912f.webp\` (referenciado desde el dominio público de Kon Club, no desde un enlace privado de Drive).
- Paleta: bordó \`#230519\`, naranja \`#F26C37\`, crema \`#FFF4E6\`.
- Layout de entrada de cine y fanzine: cabecera, flyer original visible, fecha, horario local AR, dirección y mapa, código grande, detalle de entradas, pie.
- Código y datos importantes como texto legible incluso con imágenes bloqueadas.
- HTML con tablas y estilos en línea, diseñado para Gmail y móviles. El recurso WEBP puede tener compatibilidad limitada con clientes de correo antiguos, por lo que el texto del evento no depende de la imagen.
- Documento HTML previsualizable estático marcado inequívocamente como prueba, con datos inventados y alias de prueba.

## Plantilla única compartida

\`supabase/functions/kon-tickets/mail-template.js\`

La API de Supabase importa este archivo al generar correos.
\`mail-preview.html\` usa el mismo archivo para la representación visual interactiva.

## Cuatro estados

1. \`received\`: pedido recibido **pendiente**; total esperado y alias.
2. \`verified\`: entrada confirmada y pago acreditado.
3. \`courtesy\`: cortesía confirmada, **sin pagos ni alias**.
4. \`reminder\`: **MAÑANA NOS VEMOS EN EL KON**, con flyer oficial, fecha, hora, dirección, código y entradas. **Sin precios ni transferencias.**

La vista previa de \`reminder\` también está habilitada en el endpoint privado \`mail-preview?kind=reminder\`.

## NO habilitar todavía

- \`kon_mail_settings.enabled=false\`: los emails transaccionales reales siguen apagados.
- \`kon_events.sales_open=false\`: ventas reales cerradas.
- El flyer de 25/10 ya no se muestra en recordatorios con fecha 25/11: el backend comprueba que coincida la fecha asociada al asset. Se requiere un flyer actualizado para el 25/11.
- La cola automática contempla también \`reminder\`, y el backend lo programa mediante \`kon_queue_due_reminders()\`. Lo procesa **el mismo trigger de Gmail** cada cinco minutos, sin crear un cron nuevo.
- El recordatorio comienza a programarse cuando faltan **24 horas**, con ventana de seguridad hasta que faltan 22 horas para recuperar un ciclo atrasado. La entrega exacta depende de Apps Script, cuota y Gmail.
- Solo entra en la cola si **ambos interruptores** \`kon_mail_settings.enabled\` y \`reminders_enabled\` están activos y el horario aprobado en \`reminder_approved_starts_at\` coincide exactamente con \`kon_events.starts_at\`.
- Ambos interruptores siguen **en false** y la fecha aprobada sigue **null**: el recordatorio está implementado, pero NO ACTIVADO.
- El envío verifica de nuevo el estado al reclamarlo. Si alguien cancela la entrada, mueve la fecha o deshabilita recordatorios, el pedido pendiente se marca \`skipped\` (no enviado).
- Solo se envía a pedidos reales con entrada general o post película, estado \`verified\` o \`courtesy\`. Quedan fuera staging y los pedidos solo de fanzine. \`UNIQUE(order_id,kind)\` evita duplicar un recordatorio.
- **Se comprobó el scheduler con transacciones sintéticas revertidas**: horario, deduplicación, cortesías, exclusión de pendientes/staging/fanzine y cancelación. Ninguna prueba mandó mensajes.
- Falta probar la visualización real del flyer remoto dentro de Gmail y otros clientes; el deploy y las vistas previas no sustituyen ese test.

Para empezar la prueba visual sin notificar asistentes, abrí \`/mail-preview.html\` y elegí **04 · RECORDATORIO 24 H**.
