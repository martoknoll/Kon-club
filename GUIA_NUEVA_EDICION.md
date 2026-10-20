# Cómo sumar una edición del Kon

1. Adjuntar el flyer final (y el PNG del logo) y la información **confirmada**: película(s), fecha, horario, dirección, precio, cupo y estado de las entradas.
2. Guardar los nuevos assets optimizados en `public/media/` con nombres reconocibles. No insertar imágenes base64 en HTML.
3. En `data/site-config.js`, agregar las rutas a `assets`, sumar una entrada con la paleta `bg/on/paper/ink/accent/secondary` a `editionDefaults`, establecer `activeEdition` con su clave y dar de alta la fecha en `archiveCatalog` cuando sea pública.
4. Comprobar contraste y que el logo/flyer no se recorten en desktop, móvil y landscape.
5. Si hay fanzine, separar páginas **portada primero y contratapa última** para `readerIssues`, y ofrecer también el JPG pliego original para imprimir. La home solo muestra los 2 números más recientes.
6. NO publicar fechas a puertas cerradas (18/20/32B/35.B) ni las que no sean del ciclo público (23/27). Son números de carpeta, no números de edición públicos.
7. Crear un pull request en GitHub para revisión. Solo hacer merge una vez aprobada la nueva edición.

## Puntos a confirmar siempre

Precio, lugar, fecha, horario, enlace de compra y si la fecha es pública. No se debe inferir un precio de una edición anterior. El botón de entradas actual es **demo**, no un checkout real.

## Despliegue

Un repositorio conectado a Vercel publica el sitio automáticamente cuando se integra el cambio a la rama principal. Nunca guardar credenciales de pagos en GitHub ni en `public/media`.
