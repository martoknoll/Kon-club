(()=>{
"use strict";
const settings=window.KON_SUPABASE;
if(!settings)return;
const api=settings.url+"/functions/v1/kon-editions";
const $=id=>document.getElementById(id);
const params=new URLSearchParams(location.search);
const previewId=params.get("edition_preview");
function safeSrc(url){return typeof url==="string"&&(/^\/public\/media\/[A-Za-z0-9_.-]+$/.test(url)||url.startsWith(settings.url+"/storage/v1/object/public/kon-edition-media/"))?url:null}
function prettyDate(iso){
 const d=new Date(iso);
 if(!Number.isFinite(d.getTime()))return"FECHA POR CONFIRMAR";
 return new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",weekday:"short",day:"numeric",month:"long"}).format(d).toLocaleUpperCase("es-AR");
}
function time(iso){
 return new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).format(new Date(iso));
}
function brText(el,parts){
 el.replaceChildren();
 parts.forEach((str,i)=>{if(i)el.appendChild(document.createElement("br"));el.appendChild(document.createTextNode(str))});
}
function showBanner(text){
 let b=$("konCmsPreviewBanner");
 if(!b){b=document.createElement("div");b.id="konCmsPreviewBanner";b.style.cssText="position:relative;z-index:100;padding:11px 15px;text-align:center;background:#dad7d2;color:#191919;font:800 14px Barlow,Arial,sans-serif;letter-spacing:.08em;border-bottom:2px solid #94765c";document.body.prepend(b);}
 b.textContent=text;
}
function apply(e,privatePreview){
 if(!e||!e.palette)return;
 const app=$("app");if(!app)return;
 for(const key of ["bg","on","paper","ink","accent","secondary"]){
  const c=e.palette[key];
  if(/^#[0-9a-f]{6}$/i.test(c||""))app.style.setProperty("--"+key,c);
 }
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content",e.palette.bg);
 $("heroEditionTag").textContent=e.tag||"KON CLUB / CINE";
 $("heroStatus").textContent=privatePreview?"VISTA PREVIA PRIVADA":"PRÓXIMA EDICIÓN";
 const titles=String(e.headline||e.film_title||"KON CLUB").split("|");
 const headline=$("heroTitle");headline.replaceChildren();
 titles.forEach((segment,i)=>{if(i)headline.appendChild(document.createElement("br"));const span=document.createElement("span");span.textContent=segment;headline.appendChild(span)});
 $("heroLead").textContent=e.film_title||e.title||"KON CLUB";
 if(e.starts_at&&e.ends_at)brText($("heroDate"),[prettyDate(e.starts_at),time(e.starts_at)+" A "+time(e.ends_at)+" HS"]);
 else $("heroDate").textContent="PRÓXIMAMENTE";
 brText($("heroPlace"),[e.address||"BUENOS AIRES"]);
 $("ticketPrice").textContent=(e.price_ars===null?"PRECIOS POR CONFIRMAR":"ENTRADA $"+Number(e.price_ars||0).toLocaleString("es-AR"))+(privatePreview?" · VISTA PREVIA":"");
 const flyer=safeSrc(e.flyer_url),poster=$("heroPoster");
 if(flyer){poster.hidden=false;poster.src=flyer;poster.alt="Flyer original de "+(e.film_title||"Kon Club");}
 else {poster.hidden=true;const parent=poster.parentElement;let ph=$("cmsFlyerPlaceholder");if(!ph){ph=document.createElement("div");ph.id="cmsFlyerPlaceholder";ph.style.cssText="min-height:360px;display:grid;place-items:center;background:rgba(255,255,255,.12);border:2px dashed currentColor;text-align:center;padding:20px;font:900 30px Barlow Condensed,Arial";parent.appendChild(ph)}ph.textContent="FLYER PENDIENTE DE SUBIR";}
 const logo=$("brandLogo"),source=safeSrc(e.logo_url);
 if(source){logo.hidden=false;logo.src=source;}
 else{logo.hidden=true;let fallback=$("cmsTextLogo");if(!fallback){fallback=document.createElement("span");fallback.id="cmsTextLogo";fallback.style.cssText="font:900 28px/.7 Barlow Condensed,Arial,sans-serif;letter-spacing:-.03em;display:inline-block";fallback.textContent="KON CLUB";logo.parentElement.appendChild(fallback)}}
 for(const button of document.querySelectorAll("[data-ticket]")){
  const url=!privatePreview&&typeof e.ticket_url==="string"&&(/^\//.test(e.ticket_url)||/^https:\/\//.test(e.ticket_url))?e.ticket_url:null;
  if(!url){button.disabled=true;button.title=privatePreview?"Esta vista previa no acepta pedidos":"Esta edición todavía no tiene un enlace de entradas";button.textContent=privatePreview?"ENTRADAS · VISTA PREVIA":"ENTRADAS PRÓXIMAMENTE";}
  else{button.disabled=false;button.textContent=button.id==="heroButton"?"CONSEGUÍ TU ENTRADA ↗":"ENTRADAS ↗";}
  button.addEventListener("click",event=>{
   event.preventDefault();event.stopImmediatePropagation();
   if(url)window.location.assign(url);
  },true);
 }
 if(privatePreview){showBanner("VISTA PREVIA PRIVADA · NO SE PUBLICÓ ESTA EDICIÓN · NO SE PUEDEN RESERVAR ENTRADAS");}
}
async function publicEd(){
 const r=await fetch(api+"?view=public",{headers:{apikey:settings.publishableKey},cache:"no-store"});
 if(!r.ok)throw Error("CMS unavailable");
 const data=await r.json();if(!data.ok)throw Error("CMS returned error");
 if(data.active&&data.active.slug!=="halloween")apply(data.active,false); // La edición original sigue idéntica mientras Halloween esté activa.
 if(Array.isArray(data.archive)&&typeof window.KON_ADD_ARCHIVED==="function")window.KON_ADD_ARCHIVED(data.archive);
}
function loadSdk(){
 return new Promise((resolve,reject)=>{
  if(window.supabase)return resolve();
  const script=document.createElement("script");script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";script.onload=resolve;script.onerror=()=>reject(Error("Supabase no pudo cargarse"));document.head.appendChild(script);
 });
}
async function privateEd(id){
 if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id)){showBanner("ID DE VISTA PREVIA INVÁLIDO");return}
 await loadSdk();
 const client=window.supabase.createClient(settings.url,settings.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const {data:{session}}=await client.auth.getSession();
 if(!session?.access_token){showBanner("VISTA PREVIA PRIVADA · INICIÁ SESIÓN EN ADMINISTRACIÓN");return}
 const r=await fetch(api+"?view=detail&id="+encodeURIComponent(id),{headers:{apikey:settings.publishableKey,Authorization:"Bearer "+session.access_token},cache:"no-store"});
 if(!r.ok){showBanner("NO TENÉS PERMISO PARA VER ESTA EDICIÓN");return}
 const data=await r.json();
 if(data.ok&&data.edition)apply(data.edition,true);
}
if(previewId)privateEd(previewId).catch(()=>showBanner("NO SE PUDO CARGAR LA VISTA PREVIA"));
else publicEd().catch(()=>{ /* Sitio editorial estático sigue operativo como respaldo. */ });
})();