# Correo transaccional Kon Club — Gmail + Supabase (pruebas)

## Identidades

- Remitente real al autorizar el script: **konclub.entradas@gmail.com** (nombre mostrado: **Kon Club**).
- Respuestas: **kon.club@proton.me** (`replyTo`).
- Script independiente: [scripts/kon-gmail-mailer.gs](../scripts/kon-gmail-mailer.gs).
- Proveedor: Google Apps Script + `MailApp`, ejecutado como la cuenta que instaló el trigger.
- **No usa el proyecto de Apps Script de FECHAS.** No compartir el token con los scripts de Sheets ni usar `KON_SYNC_TOKEN`.
- Envíos reales a compradores **DESACTIVADOS** en Supabase (`public.kon_mail_settings.enabled=false`).
- Las ventas reales también permanecen cerradas.

## Mensajes preparados

1. **Pedido recibido (pendiente):** se genera al crear un pedido real. Incluye detalle, importe, alias, código y aclaración de que el pago *no* está confirmado.
2. **Entrada confirmada:** se genera *después de verificar el pago* en el panel o desde Sheets. Incluye código, productos, fecha/lugar y monto acreditado.
3. **Cortesía confirmada:** se genera al aprobar una cortesía; no menciona transferencia ni pago.

**Las pruebas de checkout ficticio no generan emails**, aunque se habilite el correo real. Cada pedido tiene como máximo un mensaje de cada tipo gracias a la restricción `unique(order_id,kind)` del outbox.

## Configuración inicial: ejecutar como la CUENTA NUEVA

1. Iniciar sesión en Google con **konclub.entradas@gmail.com**. Usar perfil de Chrome separado si el navegador abre otra cuenta.
2. Ir a [script.google.com/home/projects/create](https://script.google.com/home/projects/create). Crear un proyecto independiente llamado **Kon Club · Correos**.
3. Abrir [scripts/kon-gmail-mailer.gs](../scripts/kon-gmail-mailer.gs) desde GitHub, copiar el código completo y pegarlo en `Código.gs` del proyecto nuevo. Guardar.
4. Entrar al [panel Kon Club](../admin.html), desde la cuenta admin habitual autorizada, y pulsar **✉ CONFIGURAR EMAIL → GENERAR CLAVE DE EMAIL**. Esto crea un token exclusivo para correos y *pausa* cualquier envío real anterior. **No afecta ni reemplaza los tokens de Sheets.**
5. Copiar el token y volver al Apps Script del Gmail nuevo. En **Configuración del proyecto → Propiedades de secuencia de comandos**, agregar:
   - **Propiedad:** `KON_MAIL_TOKEN`
   - **Valor:** el token generado en el panel.
   No compartir el valor, ni subirlo a GitHub o al chat.
6. En el editor, elegir **`verificarKonMail` → Ejecutar**. Aceptar el consentimiento que Google solicite, comprobando que el usuario activo sea `konclub.entradas@gmail.com`. En **Registro de ejecución** debe aparecer: **Conexión OK ... Correos a compradores reales: DESACTIVADOS**.
7. Si la conexión funciona, ejecutar **`enviarPruebaKon`**. Se envía **un solo email** a `konclub.entradas@gmail.com` con asunto marcado **[PRUEBA · NO REAL]**, comprobando nombre del remitente y `replyTo`. Abrir Recibidos y Spam; nunca se envía a compradores.
8. Confirmar que la prueba llegó y que las respuestas apuntan a `kon.club@proton.me`.
9. Solo después de pasar la prueba, ejecutar **`instalarKonMail`**. Crea el trigger cada cinco minutos; mientras el envío real esté desactivado no manda nada.
10. Verificar en Apps Script → **Activadores** que figura **`procesarColaKon`**. Los disparadores nuevos de este proyecto serán propiedad del usuario de Gmail que los crea.

### Activación real (requiere permiso explícito del equipo)

Antes de activar:
- Confirmar fecha, horario, lugar, cupos, alias bancario y precios reales.
- Revisar anti-abuso, consentimiento, seguridad, contenido, cuotas de Gmail y gestión de la lista.
- Probar mails de tipo recibido, verificado y cortesía con destinatario exclusivo de pruebas.
- Revisar permiso de respuestas en Proton y sugerir al menos dos miembros con acceso seguro a ambas cuentas, preferentemente con 2FA.

**NO cambiar `enabled` automáticamente durante la vinculación.** La activación se efectuará explícitamente mediante modificación controlada de `kon_mail_settings.enabled` y revisión previa del estado de la web y de los compradores.

## Entrega y duplicados

- Supabase es la fuente de verdad. La tabla privada `kon_mail_outbox` registra el estado `queued → sending → sent` o `failed`.
- El proceso reclama mensajes con bloqueo transaccional (un reclamo a la vez). Solo confirma `sent` después de que Google acepta el envío.
- Si Gmail acepta el email pero falla la confirmación a Supabase, la tarea queda **`sending` para revisión manual**, evitando el reenvío automático de un mensaje potencialmente entregado.
- Ante fallo del propio Gmail, queda **`failed`** y no se reintenta automáticamente; se requiere revisar y reactivar explícitamente.
- El emisor revisa la cuota diaria con `MailApp.getRemainingDailyQuota()` y envía como máximo diez mensajes por ejecución. La cuota efectiva depende de la cuenta y de los límites vigentes de Google.
- La clave privada solo se guarda en **Apps Script Properties**, y Supabase almacena un hash SHA-256.
- La cuenta nueva no necesita acceso a la planilla FECHAS; los datos se reciben por un endpoint protegido del backend.
- **Nunca activar correos para pedidos `halloween-staging`**, ni enviar mails de prueba a emails de asistentes.
