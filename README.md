# KON CLUB — Sitio web

Sitio del cineclub Kon Club, con home por edición, archivo público, fanzinoteca interactiva y pliegos descargables para imprimir.

## Primera publicación

Seguí [PRIMERA_PUBLICACION.md](PRIMERA_PUBLICACION.md) para subir la web a GitHub Desktop y desplegarla en Vercel.

## Cómo abrir

Este sitio es estático: abrilo desde un servidor web local (por ejemplo `python -m http.server 8000` en esta carpeta) o publicalo con Vercel/Netlify. En modo `file://` algunas funciones del navegador pueden estar limitadas.

## Estructura

- `index.html`: estructura de la página (home, archivo, lector).
- `css/site.css`: estilos responsive.
- `js/site.js`: interacciones, navegación y lector animado.
- `public/media/`: flyers, logos, fanzines, fotos, y pliegos para descargar. No se descargan de Drive en el navegador.
- `data/site-config.js`: configuración **activa**: paletas, logos, fecha, lugares, flyers, fanzines, archivo público y edición destacada.
- `data/archivo-publico.json`: inventario de referencia de las fechas públicas.

## Próxima etapa: publicación por edición

Los datos de la edición actual están en `data/site-config.js`. Para actualizar la home sin alterar CSS ni el lector, añadí la imagen nueva a `public/media/`, registrala en `assets`, agregá la edición en `editionDefaults` con su paleta y textos, y elegila en `activeEdition`. El archivo `data/archivo-publico.json` es solo documental. Los tickets siguen siendo una demostración; antes de vender se deberá implementar un checkout real. El panel visual solo modifica una vista previa local en el navegador.

## Regla del archivo público

Se publican solamente 15 fechas del ciclo regular desde Paprika (carpeta 17). Se excluyen los especiales fuera del ciclo 23 y 27, así como las fechas privadas 18, 20, 32B y 35.B. La numeración de carpetas no representa el número público de cada función.

## Publicación

Usar el repositorio existente `martoknoll/Kon-club` (actualmente público; cambiarlo a privado si corresponde), subir esta carpeta y conectar a Vercel con **Framework Preset: Other** y **Output Directory: .**. Un sitio puede publicarse desde un repositorio privado; la visibilidad se gestiona en GitHub.

No hay pasarela de pagos activa: los botones de compra del prototipo son demostrativos.

## Prelanzamiento paralelo — Rocky Horror & La Casa Lobo

La edición activa tiene una configuración **de preparación** en `data/site-config.js` (`ticketing`):
- Canales planificados: web y Google Forms.
- Cupos **totales compartidos**: general **100**, post-película **50**, fanzine **10**.
- Formulario anterior (referencia, no enlace de venta): https://forms.gle/gJzzsfNnDLNY2eok6
- `salesEnabled: false` y `centralReservationBackendReady: false`. El modal de entradas es informativo, sin cobros ni reservas.

**No confundir cupos con stock disponible.** Antes de activar cualquier canal hay que:
1. Conciliar pedidos vigentes en Google Forms y los de la web; descartar los registros ficticios de prueba. La planilla real tiene 12 filas con una línea base de 22 generales, 2 post y 3 fanzines al 20/10/2026, pero `kon_legacy_inventory.last_synced_at` es **null**, por lo que el backend debe seguir bloqueando las ventas.
2. **Conectar la web al backend Supabase existente** (`Kon Club`, función `kon-tickets` y RPC `kon_submit_order`, que ya bloquea filas de productos durante la reserva). Validar la seguridad y pruebas de concurrencia antes de usarlo con compradores reales. Google Forms por sí solo no aplica un tope compartido fiable.
3. Habilitar y verificar el Apps Script de la planilla real para sincronizar el inventario con Supabase de forma periódica. La función exige un dato fresco (menos de 12 minutos) para permitir ventas. Validar caducidad, reembolso, idempotencia y conciliación manual.
4. Probar simultaneidad y confirmar cupos restantes reales, horarios, precios y fecha. La rama de prelanzamiento alinea la fecha visual con Supabase: **MIÉ. 25 NOVIEMBRE, 17:00**. El contenido de `main` todavía muestra 25 OCTUBRE, así que no se debe publicar el cambio sin revisión.
5. Habilitar ambos canales únicamente con aprobación explícita, una vez hecha la verificación. Jamás activar pagos solo cambiando `salesEnabled` en el navegador.
