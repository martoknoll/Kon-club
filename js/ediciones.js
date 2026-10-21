(()=>{
"use strict";
const cfg=window.KON_SUPABASE,lib=window.supabase;
const $=id=>document.getElementById(id);
const form=$("editionForm"),list=$("editionList"),status=$("editorStatus");
if(!cfg||!lib){$("authMessage").textContent="No se cargó Supabase.";return}
const auth=lib.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
const api=cfg.url+"/functions/v1/kon-editions";
const names=["bg","on","paper","ink","accent","secondary"];
let editions=[],current=null,busy=false,session=null;
function say(msg,isError=false){status.textContent=msg;status.style.color=isError?"#ffb9a7":"#c4d5b8"}
function value(name){return form.elements.namedItem(name)}
function fget(name){return String(value(name)?.value||"").trim()}
async function call(view,options={}){
 const {data:{session:live}}=await auth.auth.getSession();
 if(!live?.access_token)throw Error("La sesión expiró. Volvé a entrar desde el panel.");
 const r=await fetch(api+view,{...options,headers:{apikey:cfg.publishableKey,Authorization:"Bearer "+live.access_token,...options.headers}});
 let json;try{json=await r.json()}catch{throw Error("Respuesta inválida del servidor")}
 if(!r.ok||!json.ok)throw Error(json.error||"No se pudo completar la operación");
 return json;
}
const fmt=iso=>{
 if(!iso)return"";
 const date=new Date(iso);
 const p=new Intl.DateTimeFormat("en-GB",{timeZone:"America/Argentina/Buenos_Aires",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(date);
 const v=k=>p.find(x=>x.type===k)?.value||"";
 return [v("year"),v("month"),v("day")].join("-")+"T"+v("hour")+":"+v("minute");
};
function utc(local){return local?new Date(local+":00-03:00").toISOString():null}
function friendly(iso){return iso?new Intl.DateTimeFormat("es-AR",{timeZone:"America/Argentina/Buenos_Aires",day:"2-digit",month:"short",year:"numeric"}).format(new Date(iso)):"SIN FECHA"}
const baseColors={bg:"#191919",on:"#f5f2ed",paper:"#d8d6d2",ink:"#191919",accent:"#94765c",secondary:"#595959"};
function setPreview(kind,url){
 const img=$(kind+"Preview"),empty=$(kind+"Empty");
 if(url){img.src=url;img.hidden=false;empty.hidden=true}
 else{img.removeAttribute("src");img.hidden=true;empty.hidden=false}
}
function setEdition(e){
 current=e;
 form.reset();
 for(const k of ["id","slug","title","film_title","director","film_year","tag","headline","synopsis","address","price_ars","ticket_url"])value(k).value=e?.[k]??"";
 value("starts_at").value=fmt(e?.starts_at);
 value("ends_at").value=fmt(e?.ends_at);
 for(const k of names)value(k).value=e?.palette?.[k]||baseColors[k];
 $("flyerFile").value="";$("logoFile").value="";
 setPreview("flyer",e?.flyer_url);setPreview("logo",e?.logo_url);
 const locked=Boolean(e&&e.status!=="draft");
 [...form.querySelectorAll("input,textarea")].forEach(el=>{if(el.name!=="id"&&el.type!=="hidden")el.disabled=locked});
 $("saveDraft").disabled=locked;
 $("publishEdition").disabled=locked||!e?.id;
 $("previewEdition").disabled=!e?.id;
 $("formKicker").textContent=e?.status==="published"?"EDICIÓN PUBLICADA":e?.status==="archived"?"ARCHIVO / LECTURA":e?.id?"BORRADOR GUARDADO":"EDICIÓN NUEVA";
 $("formTitle").textContent=e?.film_title||"NUEVA FUNCIÓN.";
 $("formState").textContent=(e?.status||"draft").toUpperCase();
 $("formState").style.borderColor=e?.status==="published"?"#b8d0ad":"#777";
 list.querySelectorAll(".edition-item").forEach(b=>b.classList.toggle("selected",b.dataset.id===e?.id));
 say(locked?"Esta edición está publicada o archivada: no se edita aquí. Creá un borrador para la próxima fecha.":e?.id?"Borrador privado. Podés guardar cambios, subir imágenes o abrir la vista previa.":"Completá los campos y guardá para crear tu borrador.");
}
function paintList(){
 list.replaceChildren();
 if(!editions.length){const p=document.createElement("p");p.textContent="Todavía no hay funciones guardadas.";list.appendChild(p);}
 const sorted=[...editions].sort((a,b)=>{
  const rank=x=>x.status==="published"?0:x.status==="draft"?1:2;
  return rank(a)-rank(b)||String(b.starts_at||"").localeCompare(String(a.starts_at||""));
 });
 for(const e of sorted){
  const b=document.createElement("button");b.type="button";b.className="edition-item";b.dataset.id=e.id;
  const title=document.createElement("strong");title.textContent=e.film_title||e.slug;
  const sub=document.createElement("small");sub.textContent=(e.status==="published"?"● EN VIVO":e.status==="draft"?"○ BORRADOR":"◌ ARCHIVADA")+" · "+friendly(e.starts_at);
  b.append(title,sub);b.addEventListener("click",()=>setEdition(e));list.append(b);
 }
}
async function refresh(selectId){
 const response=await call("?view=list");
 editions=response.editions||[];
 paintList();
 const chosen=editions.find(e=>e.id===selectId)||editions.find(e=>e.status==="draft")||editions[0]||null;
 setEdition(chosen);
}
function payload(){
 const p={};
 for(const key of ["id","slug","title","film_title","director","film_year","tag","headline","synopsis","address","price_ars","ticket_url"]){const v=fget(key);p[key]=v;}
 p.film_year=p.film_year?Number(p.film_year):null;
 p.price_ars=p.price_ars!==""?Number(p.price_ars):null;
 p.starts_at=utc(fget("starts_at"));p.ends_at=utc(fget("ends_at"));
 p.flyer_url=current?.flyer_url||null;p.logo_url=current?.logo_url||null;
 p.palette=Object.fromEntries(names.map(n=>[n,fget(n)]));
 return p;
}
async function save(){
 if(!form.reportValidity())return null;
 if(current&&current.status!=="draft")return null;
 const body=payload();
 if(!body.id)delete body.id;
 const r=await call("?action=save",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
 current=r.edition;
 await refresh(current.id);
 return current;
}
async function imageFile(file){
 if(!file||!["image/png","image/jpeg","image/webp"].includes(file.type))throw Error("Usá PNG, JPG o WEBP.");
 if(file.size>35000000)throw Error("La imagen es demasiado grande (máximo 35 MB para comprimir).");
 if(file.size<8*1024*1024)return file;
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,2100/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement("canvas");canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
 const ctx=canvas.getContext("2d");if(!ctx)throw Error("No se pudo procesar el archivo");
 ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise(resolve=>canvas.toBlob(resolve,"image/webp",0.82));
 if(!blob||blob.size>10*1024*1024)throw Error("La imagen sigue siendo demasiado pesada");
 return new File([blob],"edicion.webp",{type:"image/webp"});
}
async function upload(kind,file){
 if(!current?.id||current.status!=="draft")throw Error("Primero guardá el borrador.");
 const good=await imageFile(file);
 const data=new FormData();data.set("file",good,good.name);
 const r=await call("?action=upload&id="+encodeURIComponent(current.id)+"&kind="+kind,{method:"POST",body:data});
 current=r.edition;
 await refresh(current.id);
 say("Imagen guardada en el borrador. La web pública no cambió.");
}
function fileHandler(kind,id){
 $(id).addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!current?.id){say("Guardá primero el borrador y después subí la imagen.",true);e.target.value="";return;}
  if(busy)return;
  busy=true;say("Subiendo imagen al espacio del Kon...");
  try{await upload(kind,file)}catch(err){say(err.message||"No se pudo subir la imagen.",true)}
  finally{busy=false}
 });
}
fileHandler("flyer","flyerFile");fileHandler("logo","logoFile");
form.addEventListener("submit",async e=>{
 e.preventDefault();if(busy)return;busy=true;$("saveDraft").disabled=true;say("Guardando...");
 try{const edition=await save();if(edition)say("Borrador guardado. No publicamos nada.")}catch(err){say(err.message||"Error al guardar.",true)}
 finally{busy=false;$("saveDraft").disabled=current?.status!=="draft"}
});
$("newEdition").onclick=()=>setEdition(null);
$("previewEdition").onclick=()=>{
 if(!current?.id)return;
 window.open("index.html?edition_preview="+encodeURIComponent(current.id),"_blank","noopener,noreferrer");
};
$("publishEdition").onclick=async()=>{
 if(busy||!current?.id||current.status!=="draft")return;
 if(!current.flyer_url){say("Falta el flyer. Subilo antes de publicar.",true);return}
 if(!current.ticket_url&&!window.confirm("Esta nueva edición no tiene enlace de entradas. El botón de compra quedará desactivado para no llevar al checkout de Halloween. ¿Seguimos?"))return;
 const exact=window.prompt("Esto cambia la HOME PÚBLICA y archiva la edición anterior. Escribí exactamente el identificador para CONFIRMAR PUBLICACIÓN:",current.slug);
 if(exact!==current.slug){say("Publicación cancelada. No cambió la web.");return}
 busy=true; $("publishEdition").disabled=true;say("Publicando edición...");
 try{
  const r=await call("?action=publish",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:current.id,slug:current.slug,confirm_slug:exact})});
  await refresh(r.edition.id);
  say("EDICIÓN PUBLICADA. La home tomará sus datos de Supabase; el checkout de Halloween no fue modificado.");
 }catch(e){say(e.message||"No se pudo publicar.",true)}finally{busy=false;$("publishEdition").disabled=current?.status!=="draft";}
};
async function init(){
 try{
  const {data:{session:s}}=await auth.auth.getSession();session=s;
  if(!s?.access_token){$("authMessage").textContent="No hay una sesión activa en este navegador. Primero ingresá a administración.";return}
  await refresh(new URL(location.href).searchParams.get("id"));
  $("authGate").hidden=true;$("workspace").hidden=false;
 }catch(err){$("authMessage").textContent=err.message||"No se pudo verificar tu acceso";}
}
init();
})();