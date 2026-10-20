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


## Prelanzamiento checkout paralelo · rama `prep/checkout-integrado-sin-ventas-20261020`

La web usa el checkout por transferencia y panel existentes en `feature/checkout-transferencias`.
En esta rama ambos botones de salida a venta están **cerrados**:
- `data/checkout-config.js`: `allowLive=false` y `legacyFormPublic=false`.
- El Google Form anterior queda registrado como referencia interna, sin enlace visible en la home.
- El checkout real exige además `kon_events.sales_open=true` en Supabase y disponibilidad fresca.
- `checkout-test.html` permite probar pedidos *ficticios* mediante autenticación de administradores, separados de la edición real.

**No se ha modificado ni cerrado el formulario externo**. Si éste acepta respuestas desde un enlace que ya circula, puede seguir recibiéndolas por fuera de la web. El riesgo de simultaneidad de Google Forms no desaparece al sincronizar cada cinco minutos: se debe acordar un cupo reservado por canal, un límite de Forms o dejar las respuestas sin confirmación hasta validarlas contra el inventario central.

Cupos globales confirmados del evento real: **100 entradas generales, 50 post-película y 10 fanzines**. La base de datos es la única fuente de disponibilidad real. El horario del 25/11 debe ratificarse; no publicar el flyer fechado en octubre.

Pasos de QA (sin ventas ni datos reales): ver `docs/QA-CHECKOUT-PRELANZAMIENTO.md`.
