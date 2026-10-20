# Subir Kon Club por primera vez — sin consola

El proyecto está preparado para el repositorio existente **martoknoll/Kon-club**.

## 1. Subirlo con GitHub Desktop

1. Instalá GitHub Desktop desde https://desktop.github.com/ e iniciá sesión con tu usuario `martoknoll`.
2. Elegí **File → Clone repository...** y buscá **Kon-club**. Si el repositorio vacío no aparece, seleccioná la pestaña **URL** y pegá `https://github.com/martoknoll/Kon-club.git`.
3. Elegí una carpeta local de destino y hacé clic en **Clone**.
4. Descomprimí este ZIP. Copiá **todo su contenido** (`index.html`, `css`, `js`, `data`, `public`, `.github`, etc.) y pegalo dentro de la carpeta local que clonaste. **No** pegues otra carpeta contenedora: `index.html` debe quedar directamente en la raíz del repositorio.
5. Volvé a GitHub Desktop. En **Summary** escribí `Sitio inicial de Kon Club` y hacé clic en **Commit to main**.
6. Tocá **Publish branch** o **Push origin**, según el botón que veas.
7. Verificá que `https://github.com/martoknoll/Kon-club` muestre `index.html`, `css`, `js`, `data` y `public`.

## 2. Conectarlo a Vercel

1. Entrá a https://vercel.com/new.
2. Seleccioná **Import Git Repository** y `martoknoll/Kon-club`.
3. Elegí **Framework Preset: Other**, **Root Directory: ./**, **Build Command: vacío** y **Output Directory: .** (la raíz del proyecto).
4. Tocá **Deploy**.
5. Probá home, archivo completo, búsqueda, fanzinoteca, lector y botón de descarga. Si Vercel necesita una configuración distinta para servir `/public/media/`, avisame y la adaptamos.

## 3. Cada nueva edición

Compartí el flyer y datos confirmados conmigo. Preparo imágenes, paleta y cambios a `data/site-config.js`; los revisás, los incorporamos al repositorio y el sitio se vuelve a desplegar automáticamente.

**Precauciones:** el repositorio se encontró en modo **Public**. Si querés mantener privados los archivos de producción, cambialo en GitHub **Settings → General → Danger Zone → Change repository visibility** antes de subir. La venta de entradas **todavía es una demo** y no procesa pagos. No subas planillas de asistentes ni credenciales de pagos.
