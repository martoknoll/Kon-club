// Configuración editable de la compra de entradas.
// NO almacenar claves, datos de clientes ni credenciales en este archivo.
// Precios y alias definitivos confirmados por la organización el 20/10/2026.
// PRIMETIME $9.000 · TONY + PRIMETIME $12.500 · FANZINE $4.000 · Alias KON.CLUB.GL.
 // El checkout real SOLO se habilita cuando también haya sincronización
 // reciente y cupos definidos en Supabase para cada producto.
window.KON_CHECKOUT = {
  eventKey: "primetime",
  currency: "ARS",
  allowLive: true, // Registro de pedidos por transferencia externa; la API exige sales_open y stock sincronizado
  legacyFormPublic: false, // El formulario anterior sigue funcionando por separado, sin enlace público duplicado
  legacyFormUrl: "", // Google Form anterior: sigue vendiendo en paralelo
  alias: "KON.CLUB.GL",
  proofMaxBytes: 10 * 1024 * 1024,
  products: [
    { id:"general", title:"PRIMETIME", subtitle:"Entrada individual · Primetime", price:9000, max:8, unit:"entrada" },
    { id:"post", title:"TONY + PRIMETIME", subtitle:"Doble función · ambas películas", price:12500, max:6, unit:"entrada" },
    { id:"fanzine", title:"FANZINE FÍSICO", subtitle:"Para retirar el día del evento", price:4000, max:5, unit:"ejemplar" }
  ]
};

