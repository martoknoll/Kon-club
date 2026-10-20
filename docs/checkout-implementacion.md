# Venta integrada por transferencia — Kon Club

## Estado de esta rama

**Prototipo de interfaz, NO sistema de ventas activo.**
- `checkout.html` tiene el flujo de selección de entradas, transferencia y registro.
- `data/checkout-config.js` define precios, límites, alias y edición. Los valores son una base tomada de capturas del formulario anterior: **confirmarlos antes de vender**.
- `js/checkout.js` calcula el total en el navegador y muestra una vista previa local. NO guarda, NO sube archivos y NO envía pedidos.
- El sitio público de `main` permanece con su botón anterior hasta revisión y aprobación.

## Circuito real que implementaremos

1. La persona elige entradas generales (17 h), post-película (21 h) y/o fanzines físicos.
2. El servidor recibe las cantidades, consulta la configuración publicada y **recalcula** el total. Nunca confía en el precio recibido del navegador.
3. Se genera un identificador de pedido y un registro privado con estado `pending_verification`.
4. Se muestra alias y monto; la transferencia ocurre en la aplicación bancaria del comprador.
5. El usuario sube un comprobante en un almacenamiento **privado** (tipo JPG/PNG/PDF, tamaño máximo restringido), usando un permiso temporal ligado al pedido.
6. El equipo revisa la **acreditación bancaria** del dinero, no solo la imagen del comprobante.
7. Una persona autorizada marca `approved` o `rejected` desde el panel privado, y solo al aprobar se emite la confirmación por email (ticket/QR si se implementa).
8. La planilla de Google Sheets, si se desea, será un espejo de pedidos verificados o un export, nunca la única fuente de verdad para permisos.

## Infraestructura sugerida

- Frontend: web existente de GitHub, desplegada en Vercel o un alojamiento compatible con uso comercial.
- API: endpoints seguros para pedidos y comprobantes; no incluir secretos en el navegador ni GitHub.
- Base de datos: Supabase Postgres (pedidos, productos, estado, historial de aprobación).
- Almacenamiento: Supabase Storage **bucket privado**, acceso mediante URLs temporales controladas en backend.
- Administración: cuentas con autenticación y acceso limitado por roles; no exponer nombres, emails, Instagram ni comprobantes.
- Confirmaciones: servicio de correo transaccional configurable (sin enviar tickets antes de validar el pago).

## Antes de activar ventas

- [ ] Confirmar precios, límites, alias y modalidad de retiro de fanzines para la edición actual.
- [ ] Elegir cuenta responsable y destino de notificaciones.
- [ ] Configurar el backend, base de datos, almacenamiento privado y control de acceso.
- [ ] Agregar límites de solicitudes, controles anti-bots, validaciones y registro de auditoría.
- [ ] Probar carga real y borrado seguro de comprobantes de prueba.
- [ ] Probar un pedido completo con transferencia ficticia; no usar datos reales en prototipos.
- [ ] Definir cupos, política de cancelación, privacidad y tiempo de conservación de comprobantes.
- [ ] Asegurar que el hosting permita uso comercial (Vercel Hobby está sujeto a restricciones).
- [ ] Reemplazar la demo, publicar la nueva versión en `main` y verificar la compra end-to-end.

## Restricciones

El cliente nunca debe recibir la clave de servicio de Supabase ni credenciales de correo o Google.
La imagen de un comprobante no verifica por sí sola que el dinero esté acreditado.
No crear tickets válidos, QR ni descontar definitivamente cupos antes de la confirmación de pago.
