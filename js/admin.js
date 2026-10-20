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
async function loadOrders(){
 $("orders").replaceChildren(el("p","Cargando pedidos...","empty"));
 try{
  const data=await call("orders");
  orders=Array.isArray(data.orders)?data.orders:[];
  $("signin").hidden=true;
  $("dashboard").hidden=false;
  draw();
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
$("loginForm").addEventListener("submit",async(event)=>{
 event.preventDefault();
 const button=$("loginForm").querySelector("button");
 const email=String(new FormData(event.currentTarget).get("email")||"").trim();
 if(!email)return;
 button.disabled=true;
 $("loginMessage").textContent="Enviando enlace de acceso...";
 try{
  const redirectTo=new URL("admin.html",window.location.href).href;
  const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo,shouldCreateUser:true}});
  if(error)throw error;
  $("loginMessage").textContent="Revisá tu email. Te enviamos el enlace para iniciar sesión.";
 }catch(err){
  $("loginMessage").textContent=err instanceof Error?err.message:"No pudimos enviar el email.";
 }finally{button.disabled=false}
});
$("signout").addEventListener("click",async()=>{
 await client.auth.signOut();
 session=null;
 $("dashboard").hidden=true;
 $("signin").hidden=false;
 $("loginMessage").textContent="Sesión cerrada.";
});
$("refresh").addEventListener("click",()=>loadOrders());
$("statusFilter").addEventListener("change",draw);
function block(parent,tag,text,cls){
 const e=el(tag,text,cls);parent.append(e);return e;
}
function draw(){
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
  const response=await call("proof-link?order_id="+encodeURIComponent(id));
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
 $("reviewTitle").textContent="PEDIDO "+order.order_code;
 $("reviewAction").value="verified";
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
 const verified=$("reviewAction").value==="verified";
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
 if(action==="verified"&&!$("bankChecked").checked){notice("Tenés que verificar la acreditación antes de aprobar.");return;}
 const amount=Number($("receivedAmount").value);
 const payload={order_id:selection.id,status:action,note:$("reviewNote").value};
 if(action==="verified")payload.amount_received_ars=amount;
 busy=true;$("saveReview").disabled=true;
 try{
  const result=await call("review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
  closeReview();
  notice(result.email_dispatched?"Pedido actualizado y correo enviado.":"Pedido actualizado. No se envió correo automático.");
  await loadOrders();
 }catch(err){notice(err instanceof Error?err.message:"No se pudo actualizar el pedido.");}
 finally{busy=false;$("saveReview").disabled=false;}
});

$("pairSheets").addEventListener("click",()=>{
 $("pairToken").value="";
 $("copyPair").disabled=true;
 $("pairDialog").showModal();
});
$("closePair").addEventListener("click",()=>$("pairDialog").close());
$("generatePair").addEventListener("click",async()=>{
 const b=$("generatePair");
 if(!window.confirm("¿Generar una nueva clave de sincronización? Si existía otra, dejará de funcionar."))return;
 b.disabled=true;
 try{
  const r=await call("sync-pair",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});
  $("pairToken").value=r.sync_token;
  $("copyPair").disabled=false;
  notice("Nueva clave generada. Guardala en las propiedades del script de Sheets.");
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

client.auth.onAuthStateChange((_event,newSession)=>{
 if(newSession?.access_token!==session?.access_token){
  session=newSession;
  if(newSession)window.setTimeout(loadOrders,0);
  else{$("signin").hidden=false;$("dashboard").hidden=true}
 }
});
updateSession();
})();