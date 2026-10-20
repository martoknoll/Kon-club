# Prueba de compra completa · Kon Club (sin dinero real)

## Entorno confirmado
- **Checkout aislado:** [checkout-test.html](../checkout-test.html)
- **Panel:** [admin.html](../admin.html) (selector `AMBIENTE → PRUEBA · NO REAL`)
- **Sheets copia:** https://docs.google.com/spreadsheets/d/1VUGuJWp8hz46qlqU-mWc9CpRRU3LDrwbqJyAgT9tuTE/edit
- **Supabase:** edición `halloween-staging`, ventas desactivadas (`sales_open=false`), token y conector propios.
- **Producción:** edición `halloween`, ventas desactivadas y sin pedidos.
- **Autenticación:** solo las cuentas admitidas en `kon_allowed_editors`, con sesión válida y correo confirmado.

## Qué se prueba
1. Entrar al panel con una cuenta autorizada en el navegador habitual. No volver a pedir email si la sesión sigue abierta.
2. Hacer clic en **🧪 CHECKOUT PRUEBA** o abrir la URL de `checkout-test.html` del mismo preview de Vercel.
3. Elegir, por ejemplo, **1 entrada general + 1 fanzine**. El servidor debe calcular **$13.000** a partir del catálogo de prueba.
4. Continuar. El formulario trae **nombre, Instagram y correo ficticios**, inmodificables. No usar datos reales.
5. Hacer clic en **REGISTRAR PEDIDO**. La API exige sesión de administrador y crea el pedido en staging, sin abrir ventas públicas.
6. La sección de pago mostrará **NO.TRANSFERIR**. **No transferir dinero.**
7. Hacer clic en **GENERAR COMPROBANTE FICTICIO**. Se crea en el navegador un PNG con la marca **SIN TRANSFERENCIA REAL** y el código de pedido; no se debe subir ningún archivo personal o bancario.
8. Pulsar **ENVIAR COMPROBANTE**. Se sube al bucket privado y el pedido queda **PENDIENTE**.
9. Volver al panel usando el botón **IR AL PANEL**. Ver el pedido en **PRUEBA · NO REAL** y usar **VER COMPROBANTE**. Solo un administrador puede obtener un enlace firmado que expira a los 60 segundos.
10. Abrir la [planilla copia](https://docs.google.com/spreadsheets/d/1VUGuJWp8hz46qlqU-mWc9CpRRU3LDrwbqJyAgT9tuTE/edit), o ejecutar `syncKonToSheet` desde su Apps Script. Corroborar nueva fila con el código, entradas y estado `PENDIENTE`, pago en blanco.
11. En el panel, elegir **REVISAR PAGO → CORTESÍA → GUARDAR**. **No usar “Aprobar pago” para un pedido ficticio.** La base de datos lo prohíbe expresamente.
12. Esperar al siguiente trigger o ejecutar `syncKonToSheet` de la copia. La fila debe reflejar `CORTESIA` y `PAGO = $0`. No se enviará email.

## Protecciones implementadas
- Solo datos falsos con nombre `PRUEBA ...`, correo bajo `@example.invalid`, Instagram `@konclub_prueba`, primera visita = no.
- Pedido ficticio creado solo en `halloween-staging`, previa sesión autorizada.
- El servidor nunca devuelve un checkout de prueba válido sin autenticar al administrador.
- El comprobante ficticio tiene nombre obligatorio `KON-TEST-comprobante.png` y tipo PNG, y se almacena de forma privada.
- No se puede verificar un **pago real** en la edición de prueba. El estado apropiado es `CORTESÍA`.
- El panel consulta real y test por separado; los conectores y hojas Sheets usan tokens independientes.
- Se preservan los registros y las fórmulas históricas. Ninguna prueba activa ventas reales ni emails.

## Pendiente antes de habilitar entradas reales
- Probar el circuito HTTP real del navegador hasta completar archivo → panel → Sheets. Las pruebas de SQL y el despliegue **no sustituyen** esa prueba manual.
- Confirmar la edición, fecha, alias bancario, precios y cupos definitivos.
- Configurar proveedor de emails transaccionales (p. ej. Resend) y dominios de remitente.
- Revisar seguridad anti-abuso, manejo de errores, permisos y retención de comprobantes.
- Revisar hosting compatible con comercio; no publicar la rama en `main` ni cambiar `allowLive:false` hasta terminar el control de calidad.
