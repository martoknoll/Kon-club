(()=>{
"use strict";
const config=window.KON_SUPABASE;
const authLib=window.supabase;
const $=(id)=>document.getElementById(id);
if(!config||!authLib){
 $("loginMessage").textContent="No pudimos cargar la conexión de Supabase. Recargá la página.";
 return;
}
const client=authLib.createClient(config.url,config.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
let session=null;
let orders=[];
$("environmentFilter").value=new URL(window.location.href).searchParams.get("environment")==="test"?"test":"real";
let selection=null;
let busy=false;
const currency=(n)=>"$"+Number(n||0).toLocaleString("es-AR");
const date=(s)=>s?new Intl.DateTimeFormat("es-AR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(new Date(s)):"—";
const label=(status)=>({pending:"PENDIENTE",verified:"VERIFICADO",rejected:"RECHAZADO",courtesy:"CORTESÍA",cancelled:"CANCELADO"})[status]||status;
function notice(message){
 $("notification").textContent=message;
 $("notification").hidden=false;
 window.setTimeout(()=>$("notification").hidden=true,4700);
}
function el(name,text,cls){
 const e=document.createElement(name);
 if(text!==undefined&&text!==null)e.textContent=String(text);
 if(cls)e.className=cls;
 return e;
}
async function call(path,options={}){
 if(!session?.access_token)throw new Error("Sesión no iniciada.");
 const response=await fetch(config.functionUrl+"/"+path,{
  ...options,
  headers:{apikey:config.publishableKey,Authorization:"Bearer "+session.access_token,...(options.headers||{})}
 });
 let data;
 try{data=await response.json()}catch(_err){throw new Error("Respuesta inválida del servidor.");}
 if(!response.ok||!data.ok){
  if(response.status===401)throw new Error("Tu cuenta todavía no tiene permiso para administrar Kon Club.");
  throw new Error(data.error||"No se pudo completar la operación.");
 }
 return data;
}
function konLocalDate(iso){
 if(!iso)return null;
 const date=new Date(iso);
 if(!Number.isFinite(date.getTime()))return null;
 const parts=new Intl.DateTimeFormat("en-GB",{
  timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit"
 }).formatToParts(date);
 const get=t=>parts.find(p=>p.type===t)?.value||"";
 return get("year")+"-"+get("month")+"-"+get("day");
}
function plannedDateText(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
 const d=new Date(value+"T12:00:00Z");
 return new Intl.DateTimeFormat("es-AR",{
  timeZone:"UTC",weekday:"long",day:"numeric",month:"long",year:"numeric"
 }).format(d);
}
async function loadPlannedDates(){
 const list=$("plannedDates");
 if(!list)return;
 try{
  const response=await call("planned-dates");
  list.replaceChildren();
  const dates=Array.isArray(response.planned_dates)?response.planned_dates:[];
  if(!dates.length){
   list.appendChild(el("p","Todavía no hay fechas registradas.","empty"));
  }
  dates.forEach(item=>{
   const card=el("article",null,"planned-card");
   block(card,"small","FECHA RESERVADA · SIN PUBLICAR");
   block(card,"h3",plannedDateText(item.event_date));
   block(card,"p",item.film_title||"PELÍCULA POR DEFINIR");
   block(card,"p",item.starts_at?
     "Horario: "+new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",minute:"2-digit"}).format(new Date(item.starts_at)):
     "HORARIO PENDIENTE");
   block(card,"p",item.flyer_url?"FLYER ASIGNADO":"FLYER PENDIENTE");
   list.appendChild(card);
  });
  const active=response.current_event;
  const realDate=konLocalDate(active?.starts_at);
  const note=$("plannedConflict");
  if(note){
   note.hidden=!realDate;
   if(realDate){
    note.textContent="EDICIÓN EN CURSO · "+
      plannedDateText(realDate)+
      ": las entradas se venden mediante el formulario anterior de Kon Club. "+
      "Esta función se gestiona por separado de las fechas tentativas que aparecen arriba. "+
      "El checkout nuevo sigue cerrado y no se enviarán recordatorios desde este sistema a los compradores del formulario anterior.";
   }
  }
 }catch(err){
  list.replaceChildren(el("p",
   "No se pudieron consultar las próximas fechas. "+
   (err instanceof Error?err.message:"Reintentá más tarde."),"empty"));
 }
}
async function loadOrders(){
 $("orders").replaceChildren(el("p","Cargando pedidos...","empty"));
 try{
  const data=await call("orders?environment="+encodeURIComponent($("environmentFilter").value));
  orders=Array.isArray(data.orders)?data.orders:[];
  $("signin").hidden=true;
  $("dashboard").hidden=false;
  draw();
  void loadPlannedDates();
 }catch(err){
  $("dashboard").hidden=true;
  $("signin").hidden=false;
  $("loginMessage").textContent=err instanceof Error?err.message:"No se pudo ingresar.";
  notice("No se pudo cargar el panel.");
 }
}
async function updateSession(){
 const result=await client.auth.getSession();
 session=result.data.session;
 if(session){await loadOrders()}
 else{$("signin").hidden=false;$("dashboard").hidden=true}
}
let magicLinkLocked=false;
$("loginForm").addEventListener("submit",async(event)=>{
 event.preventDefault();
 if(magicLinkLocked)return;
 const button=$("loginForm").querySelector("button");
 const email=String(new FormData(event.currentTarget).get("email")||"").trim();
 if(!email)return;
 button.disabled=true;
 $("loginMessage").textContent="Enviando enlace de acceso...";
 try{
  // Reuse an existing authenticated session instead of consuming another OTP.
  const {data:{session:existing}}=await client.auth.getSession();
  if(existing?.access_token){
   session=existing;
   await loadOrders();
   return;
  }
  const redirectTo=new URL("admin.html",window.location.href).href;
  const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo,shouldCreateUser:true}});
  if(error)throw error;
  $("loginMessage").textContent="Revisá tu email: ya enviamos el enlace. No hace falta pedir otro.";
  magicLinkLocked=true;
  button.textContent="ENLACE SOLICITADO ✓";
 }catch(err){
  const message=err instanceof Error?err.message:"No pudimos enviar el email.";
  const limited=String(message).toLowerCase().includes("rate limit")||
    String(err?.status)==="429"||String(err?.code).includes("over_email_send_rate_limit");
  if(limited){
   $("loginMessage").textContent="Supabase alcanzó el límite de correos. No solicites más enlaces por ahora; intentá nuevamente en aproximadamente una hora. Si ya ingresaste, usá el mismo navegador donde tenés la sesión abierta.";
   magicLinkLocked=true;
   button.textContent="LÍMITE DE CORREOS ALCANZADO";
  }else{
   $("loginMessage").textContent=message;
  }
 }finally{button.disabled=magicLinkLocked}
});
$("signout").addEventListener("click",async()=>{
 await client.auth.signOut();
 session=null;
 $("dashboard").hidden=true;
 $("signin").hidden=false;
 $("loginMessage").textContent="Sesión cerrada.";
});
$("refresh").addEventListener("click",()=>loadOrders());
$("openTestCheckout").addEventListener("click",()=>window.location.assign("./checkout-test.html"));
$("statusFilter").addEventListener("change",draw);
$("environmentFilter").addEventListener("change",()=>{ $("statusFilter").value="all"; loadOrders(); });
function block(parent,tag,text,cls){
 const e=el(tag,text,cls);parent.append(e);return e;
}
function draw(){
 const isTest=$("environmentFilter").value==="test";
 $("adminContext").textContent=isTest?"MODO PRUEBA · PEDIDOS FICTICIOS":"PEDIDOS REALES · HALLOWEEN";
 $("syncHint").textContent=isTest?"Sincronización aislada: solo la copia de prueba":"Sincronización con Kon Club: FECHAS";
 const shown=orders.filter(o=>$("statusFilter").value==="all"||o.status===$("statusFilter").value);
 $("statTotal").textContent=String(orders.length);
 $("statPending").textContent=String(orders.filter(o=>o.status==="pending").length);
 $("statVerified").textContent=String(orders.filter(o=>o.status==="verified").length);
 $("statRevenue").textContent=currency(orders.filter(o=>o.status==="verified").reduce((sum,o)=>sum+Number(o.amount_received_ars||0),0));
 const list=$("orders");list.replaceChildren();
 if(!shown.length){
  list.appendChild(el("p",orders.length?"No hay pedidos con este estado.":"Todavía no hay pedidos registrados.","empty"));
  return;
 }
 shown.forEach(order=>{
  const card=el("article",null,"order");
  const buyer=el("div");
  block(buyer,"small",order.order_code+" · "+date(order.created_at));
  block(buyer,"h3",order.full_name);
  block(buyer,"p",order.email);
  block(buyer,"p",order.instagram||"");
  const types=el("div");
  block(types,"small","TU PEDIDO");
  const details=Array.isArray(order.kon_order_lines)?order.kon_order_lines:[];
  details.forEach(line=>{
   block(types,"p",String(line.quantity)+" × "+(line.kon_products?.label||"Producto"));
  });
  const cost=el("div");
  block(cost,"small","IMPORTE");
  block(cost,"strong",currency(order.amount_expected_ars));
  cost.appendChild(el("div",label(order.status),"status "+order.status));
  if(order.amount_received_ars!==null)block(cost,"p","Acreditado: "+currency(order.amount_received_ars));
  const actions=el("div");
  if(order.proof_received_at){
   const proof=el("button","VER COMPROBANTE ↗");
   proof.type="button";
   proof.addEventListener("click",()=>openProof(order.id));
   actions.appendChild(proof);
  }else block(actions,"small","SIN COMPROBANTE");
  if(order.status==="pending"){
   const review=el("button","REVISAR PAGO →");
   review.type="button";
   review.addEventListener("click",()=>openReview(order));
   actions.appendChild(review);
  }
  card.append(buyer,types,cost,actions);
  list.appendChild(card);
 });
}
async function openProof(id){
 try{
  const response=await call("proof-link?order_id="+encodeURIComponent(id)+"&environment="+encodeURIComponent($("environmentFilter").value));
  const parsed=new URL(response.url);
  if(parsed.protocol!=="https:"||parsed.hostname!==new URL(config.url).hostname)throw new Error("URL del comprobante no válida.");
  window.open(response.url,"_blank","noopener,noreferrer");
 }catch(err){notice(err instanceof Error?err.message:"No se pudo abrir el comprobante.")}
}
function reviewText(label,value){
 const p=el("p");
 p.append(el("strong",label+": "),document.createTextNode(String(value)));
 return p;
}
function openReview(order){
 selection=order;
 $("reviewTitle").textContent=($("environmentFilter").value==="test"?"PRUEBA · ":"PEDIDO ")+order.order_code;
 const isTest=$("environmentFilter").value==="test";
 $("reviewAction").querySelector('[value="verified"]').disabled=isTest;
 $("reviewAction").value=isTest?"courtesy":"verified";
 $("receivedAmount").value=String(order.amount_expected_ars);
 $("reviewNote").value="";
 $("bankChecked").checked=false;
 const box=$("reviewDetails");box.replaceChildren();
 box.append(reviewText("Comprador",order.full_name));
 box.append(reviewText("Esperado",currency(order.amount_expected_ars)));
 box.append(reviewText("Comprobante",order.proof_received_at?"Subido; verificalo y revisá el banco":"No recibido"));
 box.append(reviewText("Estado actual",label(order.status)));
 updateReviewForm();
 $("reviewDialog").showModal();
}
function updateReviewForm(){
 const verified=$("reviewAction").value==="verified" && $("environmentFilter").value!=="test";
 $("receivedLabel").hidden=!verified;
 $("receivedAmount").required=verified;
 $("bankChecked").required=verified;
 $("bankChecked").parentElement.hidden=!verified;
}
$("reviewAction").addEventListener("change",updateReviewForm);
function closeReview(){$("reviewDialog").close();selection=null}
$("closeDialog").addEventListener("click",closeReview);
$("cancelReview").addEventListener("click",closeReview);
$("reviewForm").addEventListener("submit",async(event)=>{
 event.preventDefault();
 if(busy||!selection)return;
 if(!$("reviewForm").reportValidity())return;
 const action=$("reviewAction").value;
 if(action==="verified"&&$("environmentFilter").value==="test"){
  notice("Los pedidos ficticios no se marcan como pagados. Elegí CORTESÍA.");
  return;
 }
 if(action==="verified"&&!$("bankChecked").checked){notice("Tenés que verificar la acreditación antes de aprobar.");return;}
 const amount=Number($("receivedAmount").value);
 const payload={order_id:selection.id,status:action,note:$("reviewNote").value,environment:$("environmentFilter").value};
 if(action==="verified"){payload.amount_received_ars=amount;payload.bank_checked=$("bankChecked").checked;}
 busy=true;$("saveReview").disabled=true;
 try{
  const result=await call("review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  closeReview();
  notice(result.email_dispatched?"Pedido actualizado y correo enviado.":"Pedido actualizado. No se envió correo automático.");
  await loadOrders();
 }catch(err){notice(err instanceof Error?err.message:"No se pudo actualizar el pedido.");}
 finally{busy=false;$("saveReview").disabled=false;}
});

let pairingMode="real";
function openPairDialog(mode){
 pairingMode=mode;
 const test=mode==="test";
 $("pairTitle").textContent=test?"PRUEBA DE GOOGLE SHEETS":"CONECTAR GOOGLE SHEETS";
 $("pairDescription").textContent=test
  ?"Este token SOLO conecta la copia de prueba: nunca modifica Kon Club: FECHAS. Guardalo como KON_TEST_SYNC_TOKEN en las Propiedades de secuencia de comandos del Apps Script de la COPIA."
  :"Este token conecta la planilla real Kon Club: FECHAS. Guardalo como KON_SYNC_TOKEN en el Apps Script de la planilla original.";
 $("pairScriptLink").href=test
  ?"https://github.com/martoknoll/Kon-club/blob/feature/checkout-transferencias/scripts/kon-sheets-test.gs"
  :"https://github.com/martoknoll/Kon-club/blob/feature/checkout-transferencias/scripts/kon-sheets-sync.gs";
 $("pairScriptLink").textContent=test?"script AISLADO de prueba":"script de Google Sheets";
 $("pairToken").value="";
 $("copyPair").disabled=true;
 $("pairDialog").showModal();
}
$("pairSheets").addEventListener("click",()=>openPairDialog("real"));
$("pairTestSheets").addEventListener("click",()=>openPairDialog("test"));
$("closePair").addEventListener("click",()=>$("pairDialog").close());
$("generatePair").addEventListener("click",async()=>{
 const b=$("generatePair");
 const target=pairingMode==="test"?"la copia de prueba":"la planilla REAL";
 if(!window.confirm("¿Generar una nueva clave para "+target+"? Si había una clave anterior para este entorno, dejará de funcionar. La otra planilla no se afecta."))return;
 b.disabled=true;
 try{
  const r=await call("sync-pair",{
   method:"POST",headers:{"Content-Type":"application/json"},
   body:JSON.stringify({environment:pairingMode})
  });
  $("pairToken").value=r.sync_token;
  $("copyPair").disabled=false;
  notice("Nueva clave de "+(pairingMode==="test"?"prueba":"producción")+" generada. Guardala solo en el Apps Script correspondiente.");
 }catch(error){
  notice(error instanceof Error?error.message:"No se pudo generar el token.");
 }finally{b.disabled=false;}
});
$("copyPair").addEventListener("click",async()=>{
 const token=$("pairToken").value;
 if(!token)return;
 try{await navigator.clipboard.writeText(token);notice("Clave copiada.");}
 catch(_err){$("pairToken").focus();$("pairToken").select();notice("Copiá el texto seleccionado.");}
});

$("pairMail").addEventListener("click",()=>{
 $("mailToken").value="";
 $("copyMailToken").disabled=true;
 $("mailDialog").showModal();
});
$("closeMail").addEventListener("click",()=>$("mailDialog").close());
$("generateMailToken").addEventListener("click",async()=>{
 if(!window.confirm("¿Generar una clave NUEVA para los emails de Kon Club? No modifica Google Sheets ni activa envíos. Si ya había una clave de email, la anterior se invalida."))return;
 const button=$("generateMailToken");
 button.disabled=true;
 try{
  const response=await call("mail-pair",{method:"POST"});
  $("mailToken").value=response.sync_token;
  $("copyMailToken").disabled=false;
  notice("Conexión preparada. Los correos reales siguen DESACTIVADOS.");
 }catch(error){
  notice(error instanceof Error?error.message:"No se pudo configurar el correo.");
 }finally{button.disabled=false;}
});
$("copyMailToken").addEventListener("click",async()=>{
 const token=$("mailToken").value;
 if(!token)return;
 try{
  await navigator.clipboard.writeText(token);
  notice("Clave de correo copiada. Guardala solo en las propiedades del script.");
 }catch(_err){
  $("mailToken").focus();$("mailToken").select();
  notice("Seleccioná y copiá la clave.");
 }
});

client.auth.onAuthStateChange((_event,newSession)=>{
 if(newSession?.access_token!==session?.access_token){
  session=newSession;
  if(newSession)window.setTimeout(loadOrders,0);
  else{$("signin").hidden=false;$("dashboard").hidden=true}
 }
});
updateSession();
})();