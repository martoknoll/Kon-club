
(()=>{
'use strict';
const cfg=window.KON_CHECKOUT;
const site=window.KON_CONFIG;
const service=window.KON_SUPABASE;
let catalogLoaded=false;
let salesOpen=false;
let pendingOrder=null;
let submitting=false;
const liveReady=()=>Boolean(cfg.allowLive&&catalogLoaded&&salesOpen&&service);
async function apiCall(path,options={}){
 if(!service)throw new Error('No está configurada la conexión a Supabase.');
 const headers={apikey:service.publishableKey,...(options.headers||{})};
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
 byId('continueToPay').disabled=total()===0;
}
renderSummary();

async function loadCatalog(){
 const status=byId('apiStatus');
 try{
  const response=await apiCall('catalog');
  if(!response.event||!Array.isArray(response.products))throw new Error('Catálogo incompleto.');
  catalogLoaded=true;
  salesOpen=Boolean(response.event.sales_open);
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
   status.textContent='INSCRIPCIONES ABIERTAS · PAGOS POR TRANSFERENCIA';
   byId('demoBanner').hidden=true;
   byId('paymentNotice').innerHTML='<strong>IMPORTANTE:</strong> La transferencia se verificará manualmente. Recibirás la confirmación cuando Kon Club apruebe el pago.';
   byId('completionNotice').innerHTML='<strong>PEDIDO RECIBIDO.</strong> Tu inscripción queda pendiente hasta que verifiquemos la acreditación. Todavía no enviamos correos automáticos.';
   proof.parentElement.querySelector('small').textContent='PNG, JPG o PDF · Máximo 10 MB';
  }else{
   status.textContent=salesOpen?'CATÁLOGO CONECTADO · COMPRA DE PRUEBA':'CATÁLOGO CONECTADO · VENTA REAL NO HABILITADA';
  }
 }catch(err){
  catalogLoaded=false;
  status.textContent='MODO DEMOSTRACIÓN · NO HAY CONEXIÓN DE VENTA';
  console.warn('Catalog load failed:',err instanceof Error?err.message:err);
 }
}
loadCatalog();

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
byId('continueToPay').addEventListener('click',()=>{if(total()>0)go(2)});
byId('continueToDetails').addEventListener('click',()=>go(3));
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
form.addEventListener('submit',async(evt)=>{
 evt.preventDefault();
 setError('');
 if(submitting)return;
 if(!form.reportValidity())return;
 if(total()<=0){setError('Elegí al menos un producto.');go(1);return;}
 const file=proof.files&&proof.files[0];
 if(!file){setError('Seleccioná un comprobante.');return;}
 if(file.size>cfg.proofMaxBytes){setError('El archivo supera el límite de 10 MB.');return;}
 const allowed=['image/png','image/jpeg','application/pdf'];
 const ext=/\.(png|jpe?g|pdf)$/i.test(file.name);
 if(!allowed.includes(file.type)&&!ext){setError('Usá una imagen JPG/PNG o un PDF.');return;}
 const formData=new FormData(form);
 const isReal=liveReady();
 const submitButton=form.querySelector('[type="submit"]');
 submitting=true;
 submitButton.disabled=true;
 submitButton.textContent=isReal?'REGISTRANDO PEDIDO...':'MOSTRANDO DEMO...';
 try{
  if(isReal){
   if(!pendingOrder){
    const order=await apiCall('order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
      fullName:String(formData.get('fullName')||''),
      email:String(formData.get('email')||''),
      instagram:String(formData.get('instagram')||''),
      firstTime:formData.get('firstTime')==='si',
      discovery:String(formData.get('discovery')||''),
      items:cfg.products.filter(p=>quantities[p.id]>0).map(p=>({id:p.backendId,qty:quantities[p.id]}))
    })});
    pendingOrder=order;
   }
   const upload=new FormData();
   upload.set('order_id',pendingOrder.order.id);
   upload.set('proof_token',pendingOrder.proof_token);
   upload.set('file',file,file.name);
   await apiCall('proof',{method:'POST',body:upload});
  }
  const box=byId('confirmation');box.replaceChildren();
  const title=document.createElement('h3');
  title.textContent=isReal?'PEDIDO RECIBIDO · PENDIENTE':'RESUMEN DE TU PEDIDO (DEMO)';
  box.appendChild(title);
  if(isReal)appendReview(box,'Número de pedido',pendingOrder.order.code);
  appendReview(box,'Nombre',String(formData.get('fullName')||''));
  appendReview(box,'Email',String(formData.get('email')||''));
  appendReview(box,'Instagram',String(formData.get('instagram')||''));
  appendReview(box,'Primera visita',formData.get('firstTime')==='si'?'Sí':'No');
  if(formData.get('firstTime')==='si')appendReview(box,'Cómo nos conoció',String(formData.get('discovery')||''));
  cfg.products.forEach(p=>{if(quantities[p.id])appendReview(box,p.title,quantities[p.id]+' × '+money(p.price))});
  appendReview(box,'Total',isReal?money(pendingOrder.order.total):money(total()));
  appendReview(box,'Comprobante',isReal?'Almacenado para revisión':file.name+' (no enviado)');
  const explanation=document.createElement('p');
  explanation.textContent=isReal?'La confirmación definitiva requiere verificar que se acreditó tu transferencia. Guardá tu número de pedido.':'Esta es una demostración: no se envió ni guardó ningún dato.';
  box.appendChild(explanation);
  if(isReal){
   form.reset();
   pendingOrder=null;
  }
  go(4);
 }catch(err){
  const message=err instanceof Error?err.message:'No pudimos enviar el pedido.';
  const translated={
   sales_closed:'La venta de esta edición todavía no está habilitada.',
   not_enough_capacity:'No quedan suficientes cupos para alguna de las opciones.',
   rate_limited:'Hay demasiados intentos de inscripción. Probá más tarde.',
   proof_already_uploaded:'Este comprobante ya fue registrado.',
   unable_to_upload_proof:'Falló la carga del comprobante. Volvé a intentar.',
   request_failed:'No pudimos completar tu pedido. Volvé a intentar.'
  };
  setError(translated[message]||'No se pudo completar la inscripción: '+message);
 }finally{
  submitting=false;
  submitButton.disabled=false;
  submitButton.textContent='REVISAR PEDIDO →';
 }
});
})();
