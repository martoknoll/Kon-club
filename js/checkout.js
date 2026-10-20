
(()=>{
'use strict';
const cfg=window.KON_CHECKOUT;
const site=window.KON_CONFIG;
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
form.addEventListener('submit',(evt)=>{
 evt.preventDefault();
 setError('');
 if(!form.reportValidity())return;
 if(total()<=0){setError('Elegí al menos un producto.');go(1);return;}
 const file=proof.files&&proof.files[0];
 if(!file){setError('Seleccioná un archivo de prueba.');return;}
 if(file.size>cfg.proofMaxBytes){setError('El archivo supera el límite de 10 MB.');return;}
 const allowed=['image/png','image/jpeg','application/pdf'];
 const ext=/\.(png|jpe?g|pdf)$/i.test(file.name);
 if(!allowed.includes(file.type)&&!ext){setError('Usá una imagen JPG/PNG o un PDF.');return;}
 const formData=new FormData(form);
 const box=byId('confirmation');box.replaceChildren();
 const title=document.createElement('h3');title.textContent='RESUMEN DE TU PEDIDO (DEMO)';box.appendChild(title);
 appendReview(box,'Nombre',String(formData.get('fullName')||''));
 appendReview(box,'Email',String(formData.get('email')||''));
 appendReview(box,'Instagram',String(formData.get('instagram')||''));
 appendReview(box,'Primera visita',formData.get('firstTime')==='si'?'Sí':'No');
 if(formData.get('firstTime')==='si')appendReview(box,'Cómo nos conoció',String(formData.get('discovery')||''));
 cfg.products.forEach((p)=>{if(quantities[p.id])appendReview(box,p.title,quantities[p.id]+' × '+money(p.price))});
 appendReview(box,'Total',money(total()));
 appendReview(box,'Archivo seleccionado',file.name);
 const explanation=document.createElement('p');explanation.textContent='No se envió ningún dato: solo estás viendo el resumen de la futura compra.';box.appendChild(explanation);
 go(4);
});
})();
