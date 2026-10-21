# Gestor de ediciones de Kon Club (21/10/2026)

### Enlaces
- Entrada desde **Admin → ✳ GESTIONAR FUNCIONES**, o `/ediciones.html`.
- Vista previa privada abre `/index.html?edition_preview=UUID` en el mismo navegador con sesión de administrador.
- Web en vivo: `https://kon-club.vercel.app/`. La edición actual se obtiene mediante GET público a `kon-editions?view=public` y conserva la home estática como respaldo.
- Fuente de verdad: tabla `public.kon_editions`, Edge Function independiente `kon-editions`, bucket público de imágenes `kon-edition-media`.
- `halloween` está **PUBLICADA** con la gráfica del 25/10; no cambia entradas, correo, recordatorios ni Google Sheets.
- `hundreds-of-beavers-20261108` está como **BORRADOR**, 08/11 18–23h, $9000, gris/negro/blanco y detalles marrones. **Flyer y logo pendientes de subir desde el panel.** El PNG del usuario es de ~11MB; el panel lo comprime automáticamente a WEBP si supera 8MB. No publicar el borrador sin el flyer y aprobación del equipo.

### Flujo
1. Ingresá al panel de entradas con una cuenta permitida, y abrí **GESTIONAR FUNCIONES**.
2. Elegí borrador o creá uno nuevo. Completá textos, fechas, dirección, sinopsis, precio de referencia y paleta.
3. Guardá. Subí flyer y logo (opcional), los archivos se almacenan en Supabase. Si cambian detalles, guardá nuevamente.
4. **◉ VER HOME EN PRIVADO** carga el diseño real con colores/flyer en la misma estructura pública, SIN abrir ventas.
5. **PUBLICAR EDICIÓN** exige confirmar el slug y archiva de manera atómica la anterior. **La edición anterior queda en el archivo desde Paprika; no se incluye ninguna edición pre-#17.**
6. Un nuevo evento sin URL de entradas tiene botones de compra desactivados para **NO** abrir el checkout de Halloween. El CMS **NO** crea eventos, inventario o pedidos del backend de ticketing. Configurar eso como una etapa aparte cuando se habilite otra función.

### Seguridad
- RLS bloquea lecturas/escrituras directas de la tabla a usuarios anónimos y autenticados.
- La Edge Function verifica JWT con Supabase Auth y `kon_allowed_editors` para listar, guardar, subir y publicar.
- Imágenes públicas solo en bucket exclusivo, permitiendo PNG/JPEG/WEBP validado por firma, tamaño <=10MB.
- Publicación es transaccional mediante RPC autorizada exclusivamente a `service_role`; la URL de preview requiere iniciar sesión y no expone borradores en el GET público.
- Las ediciones publicadas/archivadas quedan inmutables en el editor. El CMS es independiente de `kon-tickets` y del circuito de Gmail.
- Vercel despliega la **funcionalidad del CMS una vez**; los cambios posteriores de cada función se guardan en Supabase sin deploy adicional.

### QA
- Revisar `/ediciones.html` con cuenta autorizada y sin sesión, comprobar acceso, guardar cambios, upload, previsualizar y cerrar sin publicar.
- Confirmar en incógnito que la home actual sigue mostrando Halloween.
- Antes de publicar Beavers, comprobar con el equipo flyer original, datos, enlace de entradas para la nueva función y la transición del evento `halloween`.
