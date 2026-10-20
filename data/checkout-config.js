// Configuración editable de la compra de entradas.
// NO almacenar claves, datos de clientes ni credenciales en este archivo.
// Precios actuales de referencia; antes del lanzamiento confirmar con equipo.
 // El checkout real SOLO se habilita cuando también haya sincronización
 // reciente y cupos definidos en Supabase para cada producto.
window.KON_CHECKOUT = {
  eventKey: "halloween",
  currency: "ARS",
  allowLive: false, // Cambiar solo después de probar el backend, Sheets y los permisos
  legacyFormPublic: false, // No mostrar el enlace al Form mientras preparamos el lanzamiento
  legacyFormUrl: "https://forms.gle/gJzzsfNnDLNY2eok6", // Google Form anterior: sigue vendiendo en paralelo
  alias: "KON.CLUB.GL",
  proofMaxBytes: 10 * 1024 * 1024,
  products: [
    { id:"general", title:"ENTRADA GENERAL", subtitle:"Horario de ingreso por confirmar", price:9000, max:8, unit:"entrada" },
    { id:"post", title:"POST-PELÍCULA", subtitle:"Acceso post-película · horario a confirmar", price:7000, max:6, unit:"entrada" },
    { id:"fanzine", title:"FANZINE FÍSICO", subtitle:"Para retirar el día del evento", price:4000, max:5, unit:"ejemplar" }
  ]
};
