# Kon Club — sincronización con Google Sheets

## Archivos revisados (copias adjuntas; originales sin modificar)

**Forms — Wag the Dog:** hoja `Form Responses 1`, columnas A:I:
`Timestamp`, `Nombre y Apellido`, `Instagram`, `¿Es la primera vez que venis?`, `Si venis por primera vez, ¿por donde nos conociste?`, `Entradas Generales`, `Entradas Post-Pelicula`, `Cantidad de Fanzines`, `Adjuntar comprobante`. No tiene ID único de pedido ni estado verificable de acreditación.

**FECHAS:** una pestaña por edición. En fechas recientes, el equipo trabaja con A `NOMBRE`, B `GENERAL`, C `POST`, D `FANZINE`, E `PAGO` y F (observaciones/torneo/promociones), además de H:I `ASISTENCIA` y J `RECAUDACION`. Algunas hojas más antiguas llegan a la columna M.

Se observaron **22 respuestas de Forms contra 26 registros con nombre en FECHAS para Wag the Dog**: no debe suponerse correspondencia uno a uno ni tratar los datos manuales como errores. También existen 2x1, cortesías, entradas de fechas anteriores y pagos pendientes. `PAGO` es un importe que anota el equipo, NO una aprobación automática ni necesariamente el precio de lista.

## Diseño de la integración

```
checkout en web → API segura → base de datos + comprobantes privados
                              ↕
                      panel Kon Club
                              ↕
                    Google Sheets: FECHAS
```

**La base de datos será la fuente de verdad** de pedidos, estados, cupos y auditoría. Sheets y el panel serán dos interfaces para trabajar sobre esos mismos pedidos.

### Conservamos la operatoria del equipo

- Crear una pestaña nueva por fecha, respetando las columnas visibles A:F y los resúmenes H:J.
- Cuando llega un pedido web: añadir A nombre, B cantidad general, C post, D fanzine; **E pago permanece vacío** mientras no se verifique la transferencia.
- F sigue disponible para promoción, torneo u observaciones configuradas para la fecha.
- En las **pestañas futuras**, reservar L ID_PEDIDO, M EMAIL, N ESTADO, O ORIGEN, P ACTUALIZADO y Q REFERENCIA, o alojar estos campos en una hoja técnica protegida.
- **No reorganizar hojas históricas** ni sobrescribir sus sumarios, fórmulas, nombres, pagos o estadísticas.
- Si un integrante inscribe a alguien a mano, el sincronizador asigna también ID_PEDIDO y ORIGEN=MANUAL. Nunca usar nombre como clave de conciliación.

### Estados

`PENDIENTE`, `VERIFICADO`, `RECHAZADO`, `CANCELADO`, `CORTESIA`.

**Verificación desde Sheets:** el integrante mira su cuenta bancaria, escribe el monto realmente acreditado en E y marca `VERIFICADO` en N. Un trigger instalable Apps Script detecta modificaciones humanas de columnas autorizadas y comunica el cambio a una API autenticada. No se infiere aprobación solo por adjuntar comprobante o rellenar E.

**Verificación desde el panel:** la API valida permiso, actualiza la base y después refleja el estado y el importe en Sheets. Un ID inmutable, versión por fila, transiciones idempotentes y auditoría evitan duplicaciones o conflictos. Los cambios hechos por API en Sheets no disparan el trigger humano `onEdit`.

La confirmación por email se manda **solo tras acreditación verificada o cortesía autorizada**; no se generan tickets válidos al completar la demo.

### Compatibilidad con el Forms

Preservar en el checkout nombre, Instagram, primera visita, pregunta condicional de cómo conoció Kon, tipo y cantidad de entradas, fanzines y comprobante. Añadir email explícito para enviar la entrada. Preguntas como TORNEO deben ser configurables por fecha. Precios, horarios y cupos son específicos de cada edición; no deducirlos de respuestas antiguas.

### Seguridad

- No subir nombres, emails, usuarios de Instagram ni comprobantes históricos a GitHub.
- El almacenamiento de comprobantes debe ser privado; no poner links públicos o firmados permanentes en Sheets.
- Recalcular el total en servidor, nunca confiar en un total enviado por el cliente.
- Administración por roles, permisos de hoja, secretos en backend/Script Properties, registro de cada aprobación, revisión real de transferencia bancaria, control de cupos y política de retención.
- Mantener las hojas originales intactas. La planilla de respuestas antigua es historial, NO destino de los nuevos pedidos.

### Implementación y estado actual

1. Confirmar quiénes tienen autorización para aprobar pagos.
2. Crear backend (p.ej., Supabase), storage privado y tablas: ediciones, ítems, pedidos, pagos, usuarios y auditoría.
3. Conectar el formulario web con el backend y un flujo seguro de adjuntos.
4. Crear panel de administración y Apps Script sincronizado con **la pestaña de la edición activa**.
5. Probar con pedidos ficticios en una **copia de prueba**, incluida una promoción y un registro manual.
6. Solo al terminar las pruebas, publicar el flujo en `main` y desactivar Forms como mecanismo de compra.

La rama `feature/checkout-transferencias` es todavía una **demo** sin almacenamiento ni recepción de pagos. No fusionar a producción.
