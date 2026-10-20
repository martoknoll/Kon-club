# Recordatorio automático · 24 horas antes (KON CLUB)

## Estado actual

**IMPLEMENTADO PERO DESACTIVADO.**

- Remitente: konclub.entradas@gmail.com.
- Respuestas: kon.club@proton.me.
- Diseño: flyer **oficial** de Halloween (La Casa Lobo × The Rocky Horror Picture Show).
- La edición registrada en Supabase comienza **25/10/2026 a las 17:00 de Buenos Aires**.
  **Esperar confirmación definitiva de fecha**: en otras comunicaciones surgió 25 de noviembre.
- Ventas reales: cerradas. Emails reales: desactivados. Recordatorios: desactivados.

## Funcionamiento

El trigger de Apps Script procesarColaKon corre cada cinco minutos.
La API, cuando los emails y los recordatorios estén habilitados y la fecha
haya sido aprobada expresamente, agrega un mensaje de tipo reminder
a la cola por cada pedido confirmado en la franja de las 24 horas anteriores
y con margen de seguridad hasta 22 horas antes.

Condiciones:
- Solo edición halloween y comprador con entrada general o post-película.
- Solo estados verified o courtesy. Nunca pending, rejected ni cancelled.
- No se usa staging ni se envían recordatorios de productos solo de fanzine.
- La fecha aprobada tiene que coincidir exactamente con la fecha del evento
  registrada en Supabase; si cambia, el sistema se bloquea.
- Un recordatorio por pedido; hay restricción única en la cola.
- Antes de reclamar el envío, el servidor vuelve a comprobar el estado y la fecha.
- El email muestra el flyer real, nombre del evento, fecha, hora local,
  dirección, enlace a Google Maps, entradas y código. No menciona pagos.
- Cada envío se registra en la cola privada con su fecha de despacho.
  No se reintentan automáticamente los fallos inciertos.

## Actualizar el Apps Script del Gmail de Kon Club

1. Abrir [el archivo actualizado](../scripts/kon-gmail-mailer.gs).
2. Copiarlo completo en Código.gs del proyecto existente
   **Kon Club · Correos**, con la cuenta konclub.entradas@gmail.com.
3. Mantener intacta la propiedad de script KON_MAIL_TOKEN.
   No modificar ninguno de los scripts de Sheets.
4. Ejecutar verificarKonMail: debe indicar conexión OK y emails desactivados.
5. Ejecutar enviarPruebaRecordatorioKon para enviar **UN solo correo a la
   misma casilla** con el flyer oficial de Halloween, marcado como PRUEBA.
6. Ver en Gmail si llega, si carga la imagen y si la respuesta apunta a Proton.
7. Una vez validado, ejecutar instalarKonMail. Crea o reutiliza el trigger
   de cinco minutos; sigue sin enviar mensajes a compradores mientras el
   interruptor del servidor permanezca apagado.

## Activación final, solo con autorización expresa

Hay dos interruptores independientes en la tabla privada kon_mail_settings:
- enabled: habilita correos de compras.
- reminders_enabled: habilita recordatorios.

También se debe establecer reminder_approved_starts_at igual a la fecha
correcta de kon_events.starts_at para el evento halloween.

En este momento ambos interruptores son false y
reminder_approved_starts_at es null. No se deben cambiar hasta que el equipo
apruebe el contenido, la fecha y el lanzamiento.

## Pruebas SQL completadas sin envíos

Una transacción sintética íntegramente revertida verificó:
- Enviar solo dentro de la franja de 24h a 22h antes.
- Filtrar confirmados y cortesías.
- Excluir pendientes, staging y fanzines sin entrada.
- Deduplicar aunque el cron se ejecute varias veces.
- Descartar un pedido cancelado antes de ser enviado.
- Impedir encolar si el evento cambia de fecha.

Ni la publicación de la API ni estas pruebas demuestran la puntualidad
de un envío real de Gmail, que depende de las cuotas y del trigger.
