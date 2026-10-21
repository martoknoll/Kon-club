
(()=>{
'use strict';
const cfg=window.KON_CHECKOUT;
const site=window.KON_CONFIG;
const service=window.KON_SUPABASE;
const authClient=window.supabase && service
 ?window.supabase.createClient(service.url,service.publishableKey,
   {auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}})
 :null;
let stageAuthorized=false;
let catalogLoaded=false;
let salesOpen=false;
let pendingOrder=null;
let submitting=false;
const liveReady=()=>Boolean(cfg.mode==="test"&&cfg.allowLive&&catalogLoaded&&stageAuthorized&&salesOpen&&service);
async function apiCall(path,options={}){
 if(!service||!authClient)throw new Error('No se pudo cargar la autenticación de Supabase.');
 const {data:{session}}=await authClient.auth.getSession();
 if(!session?.access_token)throw new Error('Primero iniciá sesión en el panel de Kon Club.');
 const headers={apikey:service.publishableKey,Authorization:'Bearer '+session.access_token,...(options.headers||{})};
 const response=await fetch(service.functionUrl+'/'+path,{...options,headers});
 let data;
 try{data=await response.json()}catch(_e){throw new Error('El servidor no devolvió una respuesta válida.');}
 if(!response.ok||!data.ok)throw new Error(data.error||'Error al contactar el servidor.');
 return data;
}

if(!cfg||!site) return;
const byId=(id)=>document.getElementById(id);
const event=site.editionDefaults[cfg.eventKey]||site.editionDefaults[site.activeEdition];
const palette=event.palette;
Object.entries(palette).forEach(([key,val])=>document.documentElement.style.setProperty('--'+key,val));
byId('headerLogo').src=site.assets[event.logo];
byId('poster').src=site.assets[event.poster];
byId('eventTitle').textContent=event.lead;
byId('eventDate').textContent=event.date.replace(' | ',' · ');
byId('payAlias').textContent=cfg.alias;
const money=(v)=>'$'+new Intl.NumberFormat('es-AR').format(v);
const quantities=Object.fromEntries(cfg.products.map((p)=>[p.id,0]));
const total=()=>cfg.products.reduce((sum,p)=>sum+p.price*quantities[p.id],0);
const items=byId('products');
const lines=byId('summaryLines');

function button(text,ariaLabel,handler){
 const b=document.createElement('button');
 b.type='button';b.textContent=text;b.setAttribute('aria-label',ariaLabel);
 b.addEventListener('click',handler);return b;
}
function productRow(product){
 const item=document.createElement('div');item.className='product';
 const info=document.createElement('div');info.className='product-info';
 const name=document.createElement('h3');name.textContent=product.title;
 const subtitle=document.createElement('p');subtitle.textContent=product.subtitle;
 const price=document.createElement('strong');price.textContent=money(product.price);
 info.append(name,subtitle,price);
 const counter=document.createElement('div');counter.className='counter';
 const value=document.createElement('output');value.textContent='0';value.setAttribute('aria-label','Cantidad de '+product.title);
 const minus=button('−','Quitar '+product.unit+' de '+product.title,()=>adjust(-1));
 const plus=button('+','Agregar '+product.unit+' de '+product.title,()=>adjust(1));
 function adjust(delta){
   quantities[product.id]=Math.max(0,Math.min(product.max,quantities[product.id]+delta));
   refresh();
 }
 function refresh(){
   value.textContent=String(quantities[product.id]);
   minus.disabled=quantities[product.id]===0;
   plus.disabled=quantities[product.id]===product.max;
   renderSummary();
 }
 counter.append(minus,value,plus);
 item.append(info,counter);
 refresh();
 return item;
}
cfg.products.forEach((p)=>items.appendChild(productRow(p)));

function renderSummary(){
 lines.replaceChildren();
 let hasProducts=false;
 cfg.products.forEach((product)=>{
  const amount=quantities[product.id];if(!amount)return;
  hasProducts=true;
  const line=document.createElement('div');line.className='summary-line';
  const name=document.createElement('span');name.textContent=amount+' × '+product.title;
  const price=document.createElement('b');price.textContent=money(amount*product.price);
  line.append(name,price);lines.appendChild(line);
 });
 if(!hasProducts){
  const empty=document.createElement('p');empty.className='empty';empty.textContent='Todavía no elegiste nada.';lines.appendChild(empty);
 }
 byId('summaryTotal').textContent=money(total());
 byId('payTotal').textContent=money(total());
 byId('continueToPay').disabled=total()===0||!liveReady();
}
renderSummary();

async function loadCatalog(){
 const status=byId('apiStatus');
 try{
  const response=await apiCall('catalog?environment=test');
  if(!response.event||!Array.isArray(response.products))throw new Error('Catálogo incompleto.');
  catalogLoaded=true;
  salesOpen=Boolean(response.event.test_mode&&response.event.checkout_enabled&&response.event.slug==="halloween-staging");
  cfg.alias=response.event.bank_alias;
  byId('payAlias').textContent=cfg.alias;
  const bySlug=new Map(response.products.map(p=>[p.slug,p]));
  cfg.products.forEach(p=>{
   const real=bySlug.get(p.id);
   if(!real){p.backendId=null;p.max=0;return;}
   p.backendId=real.id;
   p.title=real.label;
   p.subtitle=real.subtitle||p.subtitle;
   p.price=Number(real.price_ars);
   p.max=Number(real.per_order_max);
  });
  items.replaceChildren();
  cfg.products.forEach(p=>items.appendChild(productRow(p)));
  renderSummary();
  if(liveReady()){
   status.textContent='PRUEBA AUTORIZADA · SE GUARDARÁ EN SUPABASE SIN COBRAR';
   byId('demoBanner').hidden=false;
   byId('paymentNotice').textContent='SOLO PRUEBA · Generá el comprobante ficticio aquí. Ningún banco ni monto real interviene.';
   byId('completionNotice').textContent='PRUEBA RECIBIDA · Abrí el panel, elegí AMBIENTE: PRUEBA y revisá el pedido. No se envían emails.';
  }else{
   status.textContent='PRUEBA NO HABILITADA · CONTACTÁ A UN ADMINISTRADOR';
  }
 }catch(err){
  catalogLoaded=false;
  status.textContent='MODO DEMOSTRACIÓN · NO HAY CONEXIÓN DE VENTA';
  console.warn('Catalog load failed:',err instanceof Error?err.message:err);
 }
}
async function startTestCheckout(){
 const status=byId('apiStatus');
 try{
  if(!authClient)throw new Error('No se cargó la biblioteca de Supabase.');
  // Permissions are checked on the server, not just in the browser.
  await apiCall('orders?environment=test');
  stageAuthorized=true;
  byId('authStatus').textContent='SESIÓN VÁLIDA · SOLO PEDIDOS FICTICIOS';
  await loadCatalog();
 }catch(err){
  stageAuthorized=false;
  status.textContent='ACCESO RESTRINGIDO A ADMINISTRADORES';
  const message=err instanceof Error?err.message:'Error de autenticación';
  const line=byId('authStatus');
  line.replaceChildren(document.createTextNode(message+' '));
  const link=document.createElement('a');
  link.href='./admin.html';link.textContent='Entrá al panel en este mismo navegador →';
  line.appendChild(link);
  renderSummary();
 }
}
startTestCheckout();

const screens=[...document.querySelectorAll('section.step')];
let currentStep=1;
function go(step){
  currentStep=step;
  screens.forEach((screen)=>{screen.hidden=Number(screen.dataset.step)!==step});
  document.querySelectorAll('[data-step-marker]').forEach((el)=>{
   const marker=Number(el.dataset.stepMarker);
   el.classList.toggle('is-active',step===marker);
   el.classList.toggle('is-done',marker<step);
   if(marker===step)el.setAttribute('aria-current','step');
   else el.removeAttribute('aria-current');
  });
  const main=document.querySelector('.checkout');
  main.scrollIntoView({behavior:'auto',block:'start'});
}
byId('continueToPay').addEventListener('click',()=>{if(total()>0&&liveReady())go(2)});
document.querySelectorAll('[data-back]').forEach((b)=>b.addEventListener('click',()=>go(Number(b.dataset.back))));
byId('copyAlias').addEventListener('click',async()=>{
 const button=byId('copyAlias');
 try{
   await navigator.clipboard.writeText(cfg.alias);
   button.textContent='COPIADO ✓';
 }catch(_error){
   button.textContent='SELECCIONÁ EL ALIAS';
   const range=document.createRange();range.selectNodeContents(byId('payAlias'));
   const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
 }
});

const form=byId('orderForm');
// Datos sintéticos obligatorios: nunca guardar compradores reales en staging.
const mockName=form.querySelector('[name="fullName"]');
const mockEmail=form.querySelector('[name="email"]');
const mockInstagram=form.querySelector('[name="instagram"]');
mockName.value="PRUEBA COMPRA WEB KON CLUB";
mockEmail.value="prueba-web-"+crypto.randomUUID().slice(0,12)+"@example.invalid";
mockInstagram.value="@konclub_prueba";
[mockName,mockEmail,mockInstagram].forEach(field=>field.readOnly=true);
const noRadio=form.querySelector('input[name="firstTime"][value="no"]');
const yesRadio=form.querySelector('input[name="firstTime"][value="si"]');
noRadio.checked=true;
yesRadio.disabled=true;
const discoveryField=byId('discoveryField');
const discovery=byId('discovery');
function updateDiscovery(){
 const firstTime=form.querySelector('input[name="firstTime"]:checked')?.value==='si';
 discoveryField.hidden=!firstTime;
 discovery.disabled=!firstTime;
 discovery.required=firstTime;
 if(!firstTime)discovery.value='';
}
form.querySelectorAll('input[name="firstTime"]').forEach(input=>input.addEventListener('change',updateDiscovery));
updateDiscovery();
const proof=byId('proof');
const error=byId('formError');
function setError(message){
 error.textContent=message;
 error.hidden=!message;
}
proof.addEventListener('change',()=>setError(''));
function appendReview(parent,label,value){
 const row=document.createElement('p');
 const strong=document.createElement('strong');strong.textContent=label+': ';
 row.append(strong,document.createTextNode(value));
 parent.appendChild(row);
}
const proofForm=byId('proofForm');
const proofError=byId('proofError');
const registeredCode=byId('registeredCode');
const generateProofButton=byId('generateTestProof');
generateProofButton.addEventListener('click',async()=>{
 const message=byId('testProofStatus');
 if(!pendingOrder?.order?.code){message.textContent='Primero registrá el pedido ficticio.';return;}
 generateProofButton.disabled=true;
 try{
  const canvas=document.createElement('canvas');
  canvas.width=1100;canvas.height=650;
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('No se pudo generar una imagen.');
  ctx.fillStyle='#fff6df';ctx.fillRect(0,0,1100,650);
  ctx.strokeStyle='#9e0024';ctx.lineWidth=12;ctx.strokeRect(26,26,1048,598);
  ctx.fillStyle='#9e0024';ctx.font='bold 66px Arial';
  ctx.fillText('KON CLUB — PRUEBA',75,135);
  ctx.font='bold 49px Arial';ctx.fillText('SIN TRANSFERENCIA REAL',75,243);
  ctx.font='36px Arial';ctx.fillStyle='#251224';
  ctx.fillText('DOCUMENTO GENERADO AUTOMÁTICAMENTE',75,337);
  ctx.fillText('PEDIDO: '+pendingOrder.order.code,75,402);
  ctx.fillText('IMPORTE FICTICIO: '+money(pendingOrder.order.total),75,460);
  ctx.font='bold 29px Arial';ctx.fillText('NO ES UN COMPROBANTE BANCARIO',75,545);
  const blob=await new Promise((resolve,reject)=>
   canvas.toBlob(value=>value?resolve(value):reject(new Error('No se pudo crear el PNG.')),'image/png')
  );
  const syntheticFile=new File([blob],'KON-TEST-comprobante.png',{type:'image/png'});
  const transfer=new DataTransfer();
  transfer.items.add(syntheticFile);
  proof.files=transfer.files;
  proof.dispatchEvent(new Event('change',{bubbles:true}));
  message.textContent='LISTO · Comprobante sintético generado ('+Math.ceil(blob.size/1024)+' KB).';
 }catch(err){
  message.textContent=err instanceof Error?err.message:'No pudimos generar el archivo.';
 }finally{generateProofButton.disabled=false;}
});
function setProofError(message){
 proofError.textContent=message;
 proofError.hidden=!message;
}
form.addEventListener('submit',async(evt)=>{
 evt.preventDefault();
 setError('');
 if(submitting)return;
 if(!form.reportValidity())return;
 if(total()<=0){setError('Elegí al menos una entrada o fanzine.');go(1);return;}
 if(!liveReady()){setError('No hay una sesión de prueba autorizada. Abrí el panel.');return;}
 const formData=new FormData(form);
 const button=form.querySelector('[type="submit"]');
 submitting=true;button.disabled=true;button.textContent='REGISTRANDO...';
 try{
  if(liveReady()){
   const response=await apiCall('order',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
     fullName:String(formData.get('fullName')||''),
     email:String(formData.get('email')||''),
     instagram:String(formData.get('instagram')||''),
     firstTime:formData.get('firstTime')==='si',
     discovery:String(formData.get('discovery')||''),
     environment:'test',
     items:cfg.products.filter(p=>quantities[p.id]>0).map(p=>({id:p.backendId,qty:quantities[p.id]}))
    })
   });
   pendingOrder=response;
   byId('payTotal').textContent=money(response.order.total);
   registeredCode.textContent='PEDIDO DE PRUEBA '+response.order.code+' · No hagas transferencias. Generá el archivo ficticio.';
   byId('returnToDetails').hidden=true;
  }else{
   registeredCode.textContent='PEDIDO DE DEMOSTRACIÓN · No transfieras dinero real.';
   byId('returnToDetails').hidden=false;
  }
  go(3);
 }catch(err){
  const message=err instanceof Error?err.message:'No pudimos crear el pedido.';
  const translated={
   sales_closed:'La venta todavía no está habilitada.',
   not_enough_capacity:'No quedan suficientes cupos para alguna de las opciones.',
   rate_limited:'Hay demasiados intentos. Probá más tarde.',
   invalid_order:'Revisá tus datos y las cantidades.'
  };
  setError(translated[message]||'No pudimos registrar el pedido: '+message);
 }finally{
  submitting=false;button.disabled=false;button.textContent='REGISTRAR PEDIDO Y SEGUIR →';
 }
});
proofForm.addEventListener('submit',async(evt)=>{
 evt.preventDefault();setProofError('');
 if(submitting)return;
 if(!proofForm.reportValidity())return;
 const file=proof.files&&proof.files[0];
 if(!file){setProofError('Seleccioná un comprobante.');return;}
 if(file.size>cfg.proofMaxBytes){setProofError('El archivo supera el máximo de 10 MB.');return;}
 if(file.name!=='KON-TEST-comprobante.png'||file.type!=='image/png'){
  setProofError('Usá exclusivamente el comprobante que genera esta página.');
  return;
 }
 const formData=new FormData(form);
 if(!liveReady()||!pendingOrder){setProofError('No hay un pedido de prueba autorizado.');return;}
 const isReal=true; // Se guarda un pedido de prueba, nunca un pago real.
 const button=proofForm.querySelector('[type="submit"]');
 submitting=true;button.disabled=true;button.textContent=isReal?'SUBIENDO...':'REVISANDO...';
 try{
  if(isReal){
   const payload=new FormData();
   payload.set('order_id',pendingOrder.order.id);
   payload.set('proof_token',pendingOrder.proof_token);
   payload.set('file',file,file.name);
   await apiCall('proof',{method:'POST',body:payload});
  }
  const box=byId('confirmation');box.replaceChildren();
  const title=document.createElement('h3');
  title.textContent='PEDIDO FICTICIO ENVIADO · PENDIENTE';
  box.appendChild(title);
  if(isReal)appendReview(box,'Número de pedido',pendingOrder.order.code);
  appendReview(box,'Nombre',String(formData.get('fullName')||''));
  appendReview(box,'Email',String(formData.get('email')||''));
  appendReview(box,'Instagram',String(formData.get('instagram')||''));
  appendReview(box,'Primera visita',formData.get('firstTime')==='si'?'Sí':'No');
  if(formData.get('firstTime')==='si')appendReview(box,'Cómo nos conoció',String(formData.get('discovery')||''));
  cfg.products.forEach(p=>{if(quantities[p.id])appendReview(box,p.title,quantities[p.id]+' × '+money(p.price))});
  appendReview(box,'Total',isReal?money(pendingOrder.order.total):money(total()));
  appendReview(box,'Comprobante',isReal?'Almacenado en forma privada':file.name+' (no enviado)');
  const description=document.createElement('p');
  description.textContent='Prueba exitosa: pedido y archivo PNG ficticio guardados de forma privada. No transfieras dinero. En el panel elegí AMBIENTE · PRUEBA y marcá CORTESÍA cuando lo revises.';
  box.appendChild(description);
  if(isReal){
   proofForm.reset();
   pendingOrder=null;
   const back=byId('confirmation').closest('.step').querySelector('[data-back="3"]');
   if(back)back.hidden=true;
  }
  go(4);
 }catch(err){
  const error=err instanceof Error?err.message:'Falló el envío del comprobante.';
  const translations={
   proof_already_uploaded:'Este comprobante ya fue registrado. Contactá a Kon Club.',
   unable_to_upload_proof:'No pudimos subir el archivo. Volvé a intentar.',
   invalid_or_expired_order:'El pedido venció o ya no admite comprobantes. Contactá a Kon Club.',
   request_failed:'No pudimos subir el comprobante. Volvé a intentar.'
  };
  setProofError(translations[error]||'Error al subir comprobante: '+error);
 }finally{
  submitting=false;button.disabled=false;button.textContent='ENVIAR COMPROBANTE →';
 }
});

})();
