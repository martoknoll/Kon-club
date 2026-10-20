/**
 * KON CLUB — Email editorial / entrada de cine.
 * Plantillas compatibles con Gmail: tablas de presentación y estilos en línea.
 * El flyer de Halloween es el arte original publicado en la web del club.
 * NO se utilizan imágenes creadas ni pósters de las películas por separado.
 */
/** Mantener en sincronía con data/site-config.js, assets.halloween.
 * Debe ser una URL pública y directa a la imagen, NO un enlace privado de Drive.
 */
const KON_EVENT_FLYERS={
 halloween:"https://kon-club.vercel.app/public/media/df27d971f6912f.webp"
};
const BG="#F3E9DA",INK="#230519",ORANGE="#F26C37",CREAM="#FFF4E6",MUTED="#806A70";
function esc(value){
 return String(value??"").replace(/[&<>"']/g,x=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 })[x]||x);
}
function money(value){
 const n=Number(value);
 return "$"+(Number.isFinite(n)?Math.max(0,n):0).toLocaleString("es-AR");
}
function dateParts(value){
 if(!value)return {date:"FECHA POR CONFIRMAR",time:"HORARIO POR CONFIRMAR",full:"Fecha y horario por confirmar"};
 const date=new Date(value);
 if(!Number.isFinite(date.getTime()))return {date:"FECHA POR CONFIRMAR",time:"HORARIO POR CONFIRMAR",full:"Fecha y horario por confirmar"};
 const dateText=new Intl.DateTimeFormat("es-AR",{
  timeZone:"America/Argentina/Buenos_Aires",
  weekday:"long",day:"numeric",month:"long"
 }).format(date).toLocaleUpperCase("es-AR");
 const time=new Intl.DateTimeFormat("es-AR",{
  timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",minute:"2-digit",hourCycle:"h23"
 }).format(date);
 return {date:dateText,time:time+" HS",full:dateText+" · "+time+" HS"};
}
function td(text,style,extra=""){
 return '<td '+extra+' style="'+style+'">'+text+'</td>';
}
function paragraph(text,extraStyle=""){
 return '<p style="margin:0 0 12px;color:'+INK+';font:16px/1.6 Arial,Helvetica,sans-serif;'+extraStyle+'">'+esc(text)+'</p>';
}
function ticketInfo(label,value){
 return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">'+
 '<tr>'+td(esc(label),'font:700 11px/1.5 Arial,sans-serif;letter-spacing:2px;color:'+MUTED+';padding:0 0 5px')+'</tr>'+
 '<tr>'+td(esc(value),'font:700 17px/1.4 Arial,sans-serif;color:'+INK+';padding:0 0 14px')+'</tr></table>';
}
export function formatKonMail(input){
 const dates=dateParts(input.starts_at);
 const firstName=input.name.trim().split(/\s+/)[0]||"";
 const eventTitle=input.event_title||"Kon Club";
 const items=input.items.filter(x=>x.quantity>0);
 const flyer=KON_EVENT_FLYERS[input.event_slug]||"";
 const confirmed=input.kind==="verified"||input.kind==="courtesy"||input.kind==="reminder";
 let subject="",eyebrow="",headline="",intro="",status="",statusColor="",note="";
 if(input.kind==="received"){
  subject="Kon Club · Recibimos tu pedido · "+input.code;
  eyebrow="01 / PEDIDO RECIBIDO";
  headline="¡YA CASI ESTÁS ADENTRO!";
  intro="Recibimos tu pedido. Tu lugar todavía está pendiente hasta que verifiquemos el pago.";
  status="PENDIENTE";statusColor="#E8B93B";
  note="Un comprobante por sí solo no confirma la acreditación. Si necesitás ayuda, respondé este correo.";
 }else if(input.kind==="verified"){
  subject="Kon Club · ¡Nos vemos en el Kon! · "+input.code;
  eyebrow="02 / ENTRADA CONFIRMADA";
  headline="¡NOS VEMOS EN EL KON!";
  intro="Verificamos tu pago. Tu entrada ya está confirmada.";
  status="CONFIRMADA";statusColor="#BFD7A3";
  note="Guardá este correo y mostrá tu código al llegar.";
 }else if(input.kind==="courtesy"){
  subject="Kon Club · Tu invitación está confirmada · "+input.code;
  eyebrow="02 / INVITACIÓN ESPECIAL";
  headline="TENÉS UN LUGAR EN EL KON.";
  intro="Tu invitación de cortesía está confirmada. ¡Nos vemos en la función!";
  status="CORTESÍA";statusColor="#E2BED8";
  note="Guardá este correo y mostrá tu código al llegar.";
 }else{
  subject="Kon Club · Mañana nos vemos en el Kon · "+input.code;
  eyebrow="03 / RECORDATORIO DE FUNCIÓN";
  headline="MAÑANA NOS VEMOS EN EL KON.";
  intro="Ya tenés tu lugar. Preparamos todo para recibirte: acá va la información para que no te pierdas nada.";
  status="NOS VEMOS MAÑANA";statusColor=ORANGE;
  note="Traé ganas de ver cine, conocer gente y quedarte un rato más. Del resto nos encargamos nosotros.";
 }
 const preview= input.kind==="reminder"?"Te esperamos mañana. Fecha, horario, dirección y tu entrada adentro.":intro;
 let productRows="";
 for(const item of items){
  productRows+='<tr>'+
   td(esc(String(item.quantity)+" × "+item.label),'padding:10px 0;border-bottom:1px solid #E6D8CA;color:'+INK+';font:15px/1.4 Arial,sans-serif;')+
   '</tr>';
 }
 const flyerMarkup=flyer
  ?'<tr>'+td('<img src="'+esc(flyer)+'" width="440" alt="Flyer oficial de '+esc(eventTitle)+'" '+
     'style="width:100%;max-width:440px;height:auto;display:block;border:0;border-radius:2px;margin:0 auto" />',
    'padding:0 20px 22px;text-align:center;background:'+CREAM+';', 'align="center"')+'</tr>'
  :'';
 const dateCard=
  '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">'+
  '<tr>'+td('FECHA','padding:0 8px 5px 0;font:700 11px Arial,sans-serif;color:'+MUTED+';letter-spacing:2px;', 'width="64%"')+
       td('HORA','padding:0 0 5px;font:700 11px Arial,sans-serif;color:'+MUTED+';letter-spacing:2px;', 'width="36%"')+'</tr>'+
  '<tr>'+td(esc(dates.date),'padding:0 8px 17px 0;vertical-align:top;font:800 16px/1.3 Arial,sans-serif;color:'+INK+';')+
       td(esc(dates.time),'padding:0 0 17px;vertical-align:top;font:800 16px/1.3 Arial,sans-serif;color:'+INK+';')+'</tr>'+
  '</table>';
 let payMarkup="";
 if(input.kind==="received"){
  payMarkup='<tr>'+td(
    '<p style="margin:0 0 4px;font:700 11px/1.5 Arial,sans-serif;color:'+MUTED+';letter-spacing:2px">TOTAL A TRANSFERIR</p>'+
    '<p style="margin:0 0 16px;font:800 31px/1.1 Arial,sans-serif;color:'+INK+'">'+esc(money(input.total))+'</p>'+
    '<p style="margin:0 0 5px;font:700 11px/1.5 Arial,sans-serif;color:'+MUTED+';letter-spacing:2px">ALIAS PARA TRANSFERIR</p>'+
    '<p style="margin:0;font:800 24px/1.3 Arial,sans-serif;color:'+INK+';overflow-wrap:anywhere">'+esc(input.alias)+'</p>',
    'background:#F4E4C8;padding:21px 22px;border-left:5px solid '+ORANGE+';')+'</tr>';
 }else if(input.kind==="verified"){
  payMarkup='<tr>'+td('<p style="margin:0;font:700 13px/1.6 Arial,sans-serif;color:'+INK+'">PAGO VERIFICADO · '+esc(money(input.received))+'</p>',
    'background:#EAF1E3;padding:14px 20px;border-left:5px solid #4E7A45;')+'</tr>';
 }
 const mapHref=input.address
  ?"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(input.address)
  :"";
 const mapMarkup=mapHref?
  '<a href="'+esc(mapHref)+'" style="display:inline-block;padding:13px 18px;background:'+INK+
  ';color:'+CREAM+';text-decoration:none;font:700 12px/1.4 Arial,sans-serif;letter-spacing:1px">CÓMO LLEGAR ↗</a>':
  '';
 const topTest=input.test?
  '<tr>'+td('VISTA PREVIA · CORREO FICTICIO · NO TRANSFERIR DINERO',
    'background:#F9DE72;color:'+INK+';padding:12px 18px;text-align:center;font:800 12px/1.4 Arial,sans-serif;')+'</tr>':'';
 const safeTitle=esc(eventTitle);
 const safeCode=esc(input.code);
 const bodyContent=
   '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:'+CREAM+'">'+
     '<tr>'+td('<p style="font:700 12px/1.5 Arial,sans-serif;letter-spacing:2px;color:'+ORANGE+';margin:0 0 8px">DOBLE FUNCIÓN · KON CLUB</p>'+
       '<h2 style="font:800 23px/1.15 Arial,sans-serif;margin:0;color:'+INK+';text-transform:uppercase">'+safeTitle+'</h2>',
       'padding:26px 26px 20px;background:'+CREAM+';')+'</tr>'+
     flyerMarkup+
     '<tr>'+td(
       '<p style="margin:0 0 18px;font:15px/1.55 Arial,sans-serif;color:'+INK+'">Hola '+esc(firstName)+', '+esc(intro)+'</p>'+
       '<table width="100%" role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;border-top:2px dashed #CBAB99;border-bottom:2px dashed #CBAB99">'+
       '<tr>'+td(
        '<p style="margin:0 0 9px;font:700 11px Arial,sans-serif;color:'+MUTED+';letter-spacing:2px">TU CÓDIGO DE ENTRADA</p>'+
        '<p style="margin:0;font:800 28px/1.35 Arial,sans-serif;color:'+INK+';letter-spacing:1px;overflow-wrap:anywhere">'+safeCode+'</p>',
        'padding:22px 0 20px;')+'</tr></table>',
       'padding:2px 26px 25px;')+'</tr>'+
     '<tr>'+td(
       dateCard+
       ticketInfo("DÓNDE NOS VEMOS",input.address||"Dirección por confirmar")+
       mapMarkup+
       '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;margin-top:24px">'+
       '<tr>'+td('TU ENTRADA / PEDIDO',
        'font:700 11px Arial,sans-serif;letter-spacing:2px;color:'+MUTED+';padding:0 0 10px')+'</tr>'+
       productRows+'</table>',
       'padding:0 26px 24px;')+'</tr>'+
     (payMarkup?'<tr>'+td('<table width="100%" role="presentation" cellpadding="0" cellspacing="0">'+payMarkup+'</table>',
       'padding:0 26px 24px;')+'</tr>':'')+
     '<tr>'+td(paragraph(note,'font-size:13px;color:'+MUTED+';'),
       'padding:0 26px 16px;')+'</tr>'+
   '</table>';
 const html=
 '<!doctype html><html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"></head>'+
 '<body style="margin:0;padding:0;background:'+BG+';color:'+INK+';-webkit-text-size-adjust:100%;">'+
 '<span style="display:none!important;max-height:0;max-width:0;opacity:0;overflow:hidden">'+esc(preview)+'</span>'+
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background:'+BG+'">'+
 '<tr>'+td(
 '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;margin:0 auto;border-collapse:collapse;">'+
 topTest+
 '<tr>'+td(
  '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tr>'+
  td('<p style="margin:0;font:900 34px/1 Arial,sans-serif;letter-spacing:-1px;color:'+CREAM+'">KON CLUB<span style="color:'+ORANGE+'">.</span></p>',
    'padding:23px 24px 8px;')+'</tr><tr>'+
  td('<p style="margin:0;font:700 11px/1.4 Arial,sans-serif;color:'+ORANGE+';letter-spacing:2px">EL CINE ES LA EXCUSA</p>',
    'padding:0 24px 20px;')+'</tr><tr>'+
  td('<p style="margin:0 0 12px;font:700 11px/1.4 Arial,sans-serif;color:'+ORANGE+';letter-spacing:2px">'+esc(eyebrow)+'</p>'+
  '<h1 style="margin:0 0 16px;color:'+CREAM+';font:900 36px/1.04 Arial,sans-serif;letter-spacing:-1px">'+esc(headline)+'</h1>'+
  '<span style="display:inline-block;background:'+statusColor+';color:'+INK+';padding:7px 11px;font:800 11px/1.2 Arial,sans-serif;letter-spacing:1.3px">'+esc(status)+'</span>',
     'padding:4px 24px 26px;')+'</tr></table>',
  'padding:0;background:'+INK+';border-top:7px solid '+ORANGE+';')+'</tr>'+
 '<tr>'+td(bodyContent,'padding:0;')+'</tr>'+
 '<tr>'+td(
  '<p style="margin:0 0 8px;color:'+CREAM+';font:800 21px/1.2 Arial,sans-serif">NOS VEMOS EN EL KON.</p>'+
  '<p style="margin:0 0 8px;color:#DDC9C5;font:13px/1.5 Arial,sans-serif">¿Tenés alguna duda? Respondé este correo.</p>'+
  '<p style="margin:0;color:'+ORANGE+';font:700 11px/1.5 Arial,sans-serif;letter-spacing:2px">KON CLUB · EL CINE ES LA EXCUSA</p>',
  'background:'+INK+';padding:24px 26px 28px;')+'</tr>'+
 '</table>',
 'padding:22px 12px 32px;')+'</tr></table>'+
 '</body></html>';
 const plain=[
  headline,
  "Hola "+firstName+". "+intro,
  "FUNCIÓN: "+eventTitle,
  "FECHA Y HORA: "+dates.full,
  "DIRECCIÓN: "+(input.address||"Por confirmar"),
  "CÓDIGO: "+input.code,
  "PRODUCTOS: "+items.map(x=>x.quantity+" × "+x.label).join(", "),
  ...(input.kind==="received"?["TOTAL A TRANSFERIR: "+money(input.total),"ALIAS: "+input.alias]:[]),
  ...(input.kind==="verified"?["PAGO ACREDITADO: "+money(input.received)]:[]),
  note,
  "¿Consultas? Respondé este correo.",
  "Kon Club · El cine es la excusa."
 ].join("\n\n");
 return {subject,text:plain,html};
}
