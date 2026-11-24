// Configuración editable de la compra de entradas.
// NO almacenar claves, datos de clientes ni credenciales en este archivo.
// Edición 06/12/2026: Trainspotting, doble función, post-película y fanzine.
// Mantener las ventas deshabilitadas hasta configurar el catálogo y los cupos en Supabase.
 // El checkout real SOLO se habilita cuando también haya sincronización
 // reciente y cupos definidos en Supabase para cada producto.
window.KON_CHECKOUT = {
  eventKey: "snatch-trainspotting",
  currency: "ARS",
  allowLive: true, // Registro de pedidos por transferencia externa; la API exige sales_open y stock sincronizado
  legacyFormPublic: false, // El formulario anterior sigue funcionando por separado, sin enlace público duplicado
  legacyFormUrl: "", // Google Form anterior: sigue vendiendo en paralelo
  alias: "KON.CLUB.GL",
  proofMaxBytes: 10 * 1024 * 1024,
  products: [
    { id:"double", title:"SNATCH + TRAINSPOTTING", subtitle:"17:00 a 00:00 · Incluye el Post-Película", price:12500, max:6, unit:"entrada" },
    { id:"trainspotting", title:"TRAINSPOTTING", subtitle:"20:00 · Incluye el Post-Película", price:9000, max:6, unit:"entrada" },
    { id:"post", title:"POST-PELÍCULA", subtitle:"22:00 - Vení después de la función", price:7000, max:30, unit:"entrada" },
    { id:"fanzine", title:"FANZINE FÍSICO", subtitle:"Una copia de nuestra revista original", price:4000, max:5, unit:"ejemplar" }
  ]
};

