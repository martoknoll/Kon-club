# Álbum fotográfico de Kon Club · Carrusel automático

Se reemplazó la antigua cuadrícula fija de cuatro fotos de Fear and Loathing por un **carrusel de 13 fotografías originales** de cuatro ediciones elegibles (#28, #29, #32, #33). Fotos encontradas en el Drive oficial. **Nunca se consultan ni publican fotos de carpetas anteriores a Paprika #17**.

## Origen de las imágenes

- **#28 WHIPLASH**: https://drive.google.com/drive/folders/1hyNpi3Z2V_liq3shlgGXRFvExVwC8mRw
  - Kon_Club_31.jpg, Kon_Club_22.jpg, Kon_Club_55.jpg, Kon_Club_42.jpg
- **#29 FEAR AND LOATHING**: https://drive.google.com/drive/folders/1OVj4b_8I3PNsMz-m59izp-Z3FZUTK8ty
  - 4 fotografías originales ya optimizadas en /public/media/
- **#32 CHUNGKING EXPRESS**: https://drive.google.com/drive/folders/1qPgxv9s2bUHAbp0J6NyaVnWEPx4VCcEc
  - IMG_20260808_212021_169.jpg, IMG_20260808_181420_159.jpg, IMG_20260808_211850_163.jpg, IMG_20260808_212000_166.jpg
- **#33 FLCL**: https://drive.google.com/drive/folders/1Fyg-2U-Ki2oZyijoo4jcc8nrnRPYeWM5
  - Proyeccion.jpg

## Implementación

- Los archivos están servidos directamente por Vercel desde `/public/media/` y no requieren permisos de Drive del visitante.
- La lista ordenada está en `data/site-config.js` → `photoAlbum`, con edición y descripción. Para añadir más imágenes, subir el JPG/WEBP original optimizado a `/public/media/fotos/` y añadir entrada allí con número de edición válido. Evitar flyers, capturas de películas, documentos personales o reseñas manuscritas.
- `js/photos-carousel.js`: rotación automática cada 5,3 segundos, botón pausa/reanudar, flechas, desplazamiento táctil, teclado, pausa al perder visibilidad y modal de foto ampliada.
- Accesibilidad: sin autoplay con `prefers-reduced-motion`, los botones tienen nombre accesible y la foto ampliada se puede cerrar con Escape.
- No se modifica nada de reservas, pagos, tickets, emails, editor CMS ni el archivo de películas.
