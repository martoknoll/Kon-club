# Prueba aislada de sincronización (NO toca FECHAS original)

## Qué ya está preparado
- Copia limpia de la pestaña Halloween, con encabezados y fórmulas conservados: https://docs.google.com/spreadsheets/d/1VUGuJWp8hz46qlqU-mWc9CpRRU3LDrwbqJyAgT9tuTE/edit
- Pestaña de copia: **TEST - Casa Lobo & Rocky Horror**.
- Fila ficticia cargada manualmente: `PRUEBA KON CLUB (NO REAL)`, como verificación de fórmulas, **no es un pedido en Supabase**.
- Edición privada de prueba `halloween-staging` en Supabase, ventas cerradas.
- Pedido ficticio `KON CLUB SINCRONIZACION - TEST`, una General + un Fanzine, total calculado $13.000, pendiente, sin transferencia.
- Conector exclusivo de prueba en DB (`kon_sheet_connectors.id=2`). Inicialmente sin clave y desactivado.
- Conector de la edición real (`id=1`) sigue intacto, con su token anterior. Las ventas reales siguen cerradas.

## Instrucciones del equipo

1. Entrar a la **copia de prueba**, no a FECHAS original.
2. En la copia: **Extensiones → Apps Script**. Crear un proyecto vinculado nuevo y pegar [scripts/kon-sheets-test.gs](../scripts/kon-sheets-test.gs).
3. En el panel administrativo de prueba, elegir **🧪 PROBAR SHEETS** → **GENERAR TOKEN** → **COPIAR TOKEN**. El botón **CONECTAR SHEETS** es para producción: *no pulsar para esta prueba*.
4. En el Apps Script de la copia, **Configuración del proyecto → Propiedades de secuencia de comandos**: agregar `KON_TEST_SYNC_TOKEN` con el token recién copiado.
5. Ejecutar la función `checkKonSync` en el Apps Script de la **copia**. Debe indicar **Conexión OK. Pedidos visibles: 1. No se modificaron filas.** No copiar el token en mensajes ni en GitHub.
6. Ejecutar `setupKonSync` en el Apps Script de la **copia**. Esto instala triggers solo para la copia y sincroniza el primer pedido.
7. En la pestaña `TEST - Casa Lobo & Rocky Horror`, comprobar que aparece debajo de la fila ficticia inicial una fila `KON CLUB SINCRONIZACION - TEST`, con 1 General, 1 Fanzine, estado `PENDIENTE`, código único y monto de pago vacío. La asistencia subirá a 2 y la recaudación seguirá en $0.
8. En el panel de prueba, cambiar el selector **AMBIENTE** a **PRUEBA · NO REAL** para ver el pedido ficticio. Se puede probar marcar **CORTESÍA** sin transferencia (no marcar `VERIFICADO` sin acreditación bancaria).
9. Esperar a que el trigger de la copia actualice Sheets, o ejecutar manualmente `syncKonToSheet` en la copia. El estado pasará a `CORTESIA` y el pago a $0.
10. Confirmar que la planilla original y el panel en modo real siguen sin pedidos ficticios.

## Límites

- Esta prueba verifica la ruta **Supabase → API → Apps Script → Sheets** y una revisión de cortesía **panel → Supabase → Sheets**, sin simular una transferencia bancaria.
- **No valida todavía un checkout real con subida de comprobante**, ni emails de confirmación, ni la eventual sincronización en ambas direcciones con un cambio manual de estado desde Sheets.
- La clave de prueba es independiente de la clave real. Rotar una no invalida la otra.
- Mantener desactivada la venta real hasta probar el circuito completo y revisar límites/antispam/hosting.
