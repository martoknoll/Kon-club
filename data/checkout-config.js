// Configuración editable de la compra de entradas.
// NO almacenar claves, datos de clientes ni credenciales en este archivo.
// Los precios son los vistos en el formulario anterior; confirmar para cada nueva edición.
window.KON_CHECKOUT = {
  eventKey: "halloween",
  currency: "ARS",
  allowLive: false, // Cambiar solo después de probar el backend, Sheets y los permisos
  alias: "KON.CLUB.GL",
  proofMaxBytes: 10 * 1024 * 1024,
  products: [
    { id:"general", title:"ENTRADA GENERAL", subtitle:"Ingresás desde las 17:00", price:9000, max:8, unit:"entrada" },
    { id:"post", title:"POST-PELÍCULA", subtitle:"Ingresás desde las 21:00", price:7000, max:6, unit:"entrada" },
    { id:"fanzine", title:"FANZINE FÍSICO", subtitle:"Para retirar el día del evento", price:4000, max:5, unit:"ejemplar" }
  ]
};
