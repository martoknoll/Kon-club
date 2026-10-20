# Activar entradas Kon Club — guía de implementación

## Estado al 20/10/2026

- **Supabase activo:** proyecto "Kon Club" en São Paulo, ref \`ogrzuiwlyfobhtknjuzu\`.
- **API desplegada:** \`kon-tickets\`, sirve catálogo, creación de pedido, subida privada de comprobante, panel, validación y conexión Sheets.
- **Ventas CERRADAS:** \`kon_events.sales_open=false\` y \`data/checkout-config.js\` usa \`allowLive:false\`.
- **Sincronización Sheets INACTIVA:** \`kon_sheet_connectors.enabled=false\`; instalar Apps Script y emparejar desde el panel.
- **Tres correos autorizados:** importados de los permisos actuales de **Kon Club: FECHAS** (dos editores y un propietario). Guardados en la tabla privada \`kon_allowed_editors\`; no se almacenan en GitHub.
- **Correo de confirmación aún no configurado.** Ninguna revisión envía email automáticamente.
- **Producción:** el sitio \`main\` todavía no apunta al checkout.
- **Hosting:** revisar que el plan de Vercel elegido permita uso comercial antes de cobrar.

### Enlaces

- Web de prueba: https://kon-club-git-feature-checkout-1870e9-martoknoll-8366s-projects.vercel.app/checkout.html
- Panel: https://kon-club-git-feature-checkout-1870e9-martoknoll-8366s-projects.vercel.app/admin.html
- Supabase: https://supabase.com/dashboard/project/ogrzuiwlyfobhtknjuzu
- Sheets FECHAS (original): https://docs.google.com/spreadsheets/d/1DZ_yhLnzOVMHhBhsI_3x2QlLzcKcceDddyCjDDbGC7o/edit
- Apps Script: [scripts/kon-sheets-sync.gs](../scripts/kon-sheets-sync.gs)

## Paso 1 — iniciar sesión en el panel

1. En Supabase > Authentication > URL Configuration, configurar el **Site URL** y los **Redirect URLs** para la web que alojará el panel. En pruebas añadir:
   \`https://kon-club-git-feature-checkout-1870e9-martoknoll-8366s-projects.vercel.app/admin.html\`
   y, para publicación, \`https://kon-club.vercel.app/admin.html\`.
2. Abrir el panel de prueba.
3. Ingresar uno de los mismos correos de Google que tienen permiso **Editor/Owner** en FECHAS.
4. Recibir el enlace de acceso por email e ingresar. Supabase Auth valida el correo; el backend además comprueba la tabla privada \`kon_allowed_editors\`. Ser un visitante que recibe un enlace **no** concede acceso administrativo.

La lista inicial de editores es una foto de los permisos actuales. Si se agrega o quita un editor en Google Drive, hay que volver a sincronizar \`kon_allowed_editors\` con los permisos reales; revocar en Google no revoca automáticamente en Supabase.

## Paso 2 — conectar Google Sheets

1. Una vez autenticado, en el panel seleccionar **CONECTAR SHEETS** > **GENERAR TOKEN**.
2. Copiarlo inmediatamente. El código se muestra una única vez. No colocarlo en HTML, GitHub ni mensajes públicos.
3. Abrir el Google Sheets original **Kon Club: FECHAS** con acceso de edición.
4. Ir a **Extensiones > Apps Script** y pegar el contenido de \`scripts/kon-sheets-sync.gs\` en un nuevo proyecto asociado a esa planilla.
5. En la configuración del proyecto Apps Script > **Propiedades de secuencia de comandos** añadir:
   clave \`KON_SYNC_TOKEN\` y valor **token generado en el panel**.
6. Ejecutar \`checkKonSync\` para comprobar conexión. No cambia filas.
7. Ejecutar \`setupKonSync\` y autorizar. Configura las columnas L:Q de la pestaña de la edición activa y crea dos triggers: \`konOnEdit\` cuando alguien cambia el estado, y \`syncKonToSheet\` cada cinco minutos.
8. Comprobar que la hoja original no ha perdido fórmulas ni filas.

**Columnas respetadas:** A \`NOMBRE\`, B \`GENERAL\`, C \`POST\`, D \`FANZINE\`, E \`PAGO\`, F observaciones, H:J resúmenes. L:Q son nuevas columnas técnicas (ID_PEDIDO, EMAIL, ESTADO, ORIGEN, ULTIMO_CAMBIO, CODIGO).

El script no modifica **filas anteriores sin ID**. Solo agrega pedidos web, y actualiza los nuevos pedidos que ya tengan ID. Para verificar una compra desde Sheets, un editor completa el importe bancario en E y escribe \`VERIFICADO\` en N. El trigger avisa al backend y, si falla la actualización, restaura el estado anterior y deja una nota.

**Límite de auditoría:** Google puede no informar el correo del editor en el evento \`onEdit\`. En ese caso se registra «Editor de Sheets (identidad no disponible)» en lugar de atribuirlo incorrectamente a un usuario.

No se envían tickets hasta tener verificación real y sistema de correo probado.

## Paso 3 — pruebas sin compradores reales

- Confirmar con el equipo el precio de las tres opciones para Halloween (actualmente **9.000 / 7.000 / 4.000 ARS**), horario, alias, cantidad máxima y cupos. Estos valores provienen del formulario de una edición anterior y **requieren confirmación antes de habilitar Halloween**.
- Usar datos y comprobantes ficticios en un **ambiente de prueba**. La base de datos actual tiene ventas cerradas; la función SQL \`kon_submit_order\` y revisión \`kon_review_order\` se probaron en transacciones revertidas sin conservar registros.
- Verificar que no se pueda crear pedido si ventas están cerradas, que no se admitan totales manipulados, que los comprobantes sigan privados y que el panel rechace sesiones sin permiso.
- Probar un pedido de punta a punta con la venta habilitada *solo bajo un acceso seguro de staging* o con datos controlados. No abrir ventas públicas mientras el checkout siga en demo.
- Probar la sincronización de una compra nueva, una aprobación desde Sheets, otra desde el panel, y verificar que no hay duplicados.
- Probar una promoción/cortesía y un pedido sin comprobante.
- Conectar un proveedor de correo transaccional y configurar consentimiento, retención y tratamiento de datos personales.
- Revisar límite de tasa y anti-spam antes de habilitar creación pública de pedidos.

## Paso 4 — publicación (NO hacerlo todavía)

1. Confirmar condiciones comerciales de hosting (Vercel Hobby tiene restricciones para fines comerciales).
2. Configurar proveedor de correo y testear envío.
3. Publicar la rama de desarrollo en \`main\` después de pruebas completas.
4. Activar \`kon_events.sales_open=true\` en la edición específica **solo cuando todo lo demás funcione**.
5. Cambiar \`allowLive\` a \`true\` solo en la versión de producción; los botones de entradas llevarán a \`checkout.html\`.
6. Controlar primeras transacciones reales, sincronización y acceso del equipo.

## Proceso seguro y modelo

- La **base de datos** es fuente de verdad, no el monto del navegador o el comprobante.
- El servidor calcula total y bloquea productos mientras consulta cupos.
- Primero se registra el pedido, luego se muestra alias, luego se sube comprobante (máximo 10 MB, PNG/JPG/PDF).
- Los archivos están en bucket privado \`kon-payment-proofs\`, con URL firmada de 60 s solo para admins autenticados.
- Solo los emails previamente identificados como editores de FECHAS y confirmados por Auth pueden entrar al panel. **Una cuenta eliminada de Sheets debe eliminarse también de la tabla permitida hasta automatizar la sincronización de miembros.**
- Los cambios de estado se hacen en una función SQL transaccional junto con auditoría.
- En Apps Script, la clave se guarda en Script Properties; Supabase almacena solo SHA-256. Regenerar token desde el panel invalida el anterior.
