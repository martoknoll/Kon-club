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

- Flyer oficial **La Casa Lobo × The Rocky Horror Picture Show**, el mismo usado por la web:
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
- La cola automática actualmente solo contempla \`received\`, \`verified\` y \`courtesy\`.
- El **recordatorio se diseñó para 24 h antes**, pero aún no hay trabajo programado que lo encole. Hace falta implementar el envío programado después de aprobar el diseño, con selección exclusiva de \`verified\` y \`courtesy\`, deduplicación y control de cuotas.
- Falta probar la visualización real del flyer remoto dentro de Gmail y otros clientes; el deploy y las vistas previas no sustituyen ese test.

Para empezar la prueba visual sin notificar asistentes, abrí \`/mail-preview.html\` y elegí **04 · RECORDATORIO 24 H**.
