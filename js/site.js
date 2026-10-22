(()=>{const assets=window.KON_CONFIG.assets;const app=document.getElementById('app');document.querySelectorAll('[data-asset]').forEach(img=>{img.src=assets[img.dataset.asset]});const $=id=>document.getElementById(id);const IS_EDITOR_PREVIEW=new URLSearchParams(window.location.search).get('preview')==='1';document.documentElement.classList.toggle('kon-editor-preview',IS_EDITOR_PREVIEW);const STORE='kon_editor_preview_'+window.KON_CONFIG.activeEdition;const editionDefaults=window.KON_CONFIG.editionDefaults;let saved={};if(IS_EDITOR_PREVIEW){try{saved=JSON.parse(localStorage.getItem(STORE)||'{}')}catch(e){}}let edition=window.KON_CONFIG.activeEdition;let overrides=IS_EDITOR_PREVIEW?(saved.overrides||{}):{};let sessionImages={};
const edSelect=document.getElementById('editionSelect');if(edSelect){edSelect.replaceChildren(...Object.entries(editionDefaults).map(([key,c])=>new Option(c.lead||key,key)));}
function current(){return {...editionDefaults[edition],...(overrides[edition]||{}),palette:{...editionDefaults[edition].palette,...((overrides[edition]||{}).palette||{})}}}function save(){if(!IS_EDITOR_PREVIEW)return;try{localStorage.setItem(STORE,JSON.stringify({current:edition,overrides}))}catch(e){}}function richTitle(str){const parts=String(str).split('|');return (parts.length>1?parts[0]+'<br><span>'+parts.slice(1).join(' ').replace(/</g,'&lt;')+'</span>':('<span>'+escapeHtml(parts[0])+'</span>'))}function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}function writeHtmlLabel(str){return escapeHtml(str).replace(/\s*\|\s*/g,'<br>')}function render(){const c=current(),pal=c.palette;Object.entries(pal).forEach(([k,v])=>app.style.setProperty('--'+k,v));$('brandLogo').src=sessionImages[edition+'_logo']||assets[c.logo];$('heroPoster').src=sessionImages[edition+'_poster']||assets[c.poster];$('heroEditionTag').textContent=c.tag;$('heroStatus').textContent=edition===window.KON_CONFIG.activeEdition?'PRÓXIMA EDICIÓN':'VISTA PREVIA DE EDICIÓN';$('heroTitle').innerHTML=richTitle(c.title);$('heroLead').textContent=c.lead;$('heroDate').innerHTML=writeHtmlLabel(c.date);$('heroPlace').innerHTML=writeHtmlLabel(c.place);$('ticketPrice').textContent='ENTRADA '+c.price+' · TRANSFERENCIA Y COMPROBANTE';$('heroPoster').alt='Flyer original de '+c.lead;$('editionSelect').value=edition;$('inputTitle').value=c.title;$('inputLead').value=c.lead;$('inputDate').value=c.date;$('inputPlace').value=c.place;$('inputPrice').value=c.price;document.querySelectorAll('[data-color]').forEach(i=>{i.value=pal[i.dataset.color]});document.querySelector('meta[name="theme-color"]').content=pal.bg}function edit(key,value){overrides[edition]={...(overrides[edition]||{}),[key]:value};save();render()}function notify(s){const e=$('toast');e.textContent=s;e.classList.add('show');clearTimeout(window.__konToast);window.__konToast=setTimeout(()=>e.classList.remove('show'),2300)}function openPanel(){ $('adminPanel').classList.add('open');$('panelCover').classList.add('open');$('adminPanel').setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');$('closeAdmin').focus()}function closePanel(){ $('adminPanel').classList.remove('open');$('panelCover').classList.remove('open');$('adminPanel').setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll') }$('openAdmin').onclick=openPanel;$('closeAdmin').onclick=closePanel;$('panelCover').onclick=closePanel;$('editionSelect').onchange=e=>{edition=e.target.value;save();render();notify('TEMA ACTUALIZADO · '+edition.toUpperCase())};document.querySelectorAll('[data-color]').forEach(i=>i.addEventListener('input',e=>{overrides[edition]={...(overrides[edition]||{}),palette:{...(overrides[edition]?.palette||{}),[i.dataset.color]:e.target.value}};save();render()}));[['inputTitle','title'],['inputLead','lead'],['inputDate','date'],['inputPlace','place'],['inputPrice','price']].forEach(([id,key])=>{$(id).addEventListener('change',e=>edit(key,e.target.value))});[['uploadLogo','logo'],['uploadPoster','poster']].forEach(([id,key])=>{$(id).onchange=e=>{let f=e.target.files?.[0];if(!f)return; if(!/^image\/(png|jpeg|webp)$/.test(f.type)){notify('USÁ UNA IMAGEN PNG, JPG O WEBP');return}let u=URL.createObjectURL(f);sessionImages[edition+'_'+key]=u;render();notify('IMAGEN ACTUALIZADA EN VISTA PREVIA')}});$('applySave').onclick=()=>{save();closePanel();notify('VISTA PREVIA GUARDADA EN ESTE NAVEGADOR')};$('resetTheme').onclick=()=>{delete overrides[edition];delete sessionImages[edition+'_logo'];delete sessionImages[edition+'_poster'];save();render();notify('SE RESTABLECIÓ LA EDICIÓN')};const modal=$('modal');function openModal(markup){$('dialogContent').innerHTML=markup;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');$('closeModal').focus()}function closeModal(){modal.classList.remove('open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll')} $('closeModal').onclick=closeModal;modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){closePanel();closeModal()}});// El registro de pedidos se realiza en checkout.html; la transferencia es externa.
document.querySelectorAll('[data-ticket]').forEach(b=>b.onclick=()=>{window.location.assign('checkout.html')});
// Las tarjetas destacadas de la home abren las fichas completas, no el modal antiguo.
const homeArchiveIds={wag:'35',nirvanna:'34',flcl:'33',paprika:'17'};
document.querySelectorAll('[data-archive]').forEach(b=>b.onclick=()=>{const id=homeArchiveIds[b.dataset.archive];if(id)location.hash='#archivo-completo/'+id;});
// Lector integrado V03. Orden corregido: portada p1, contratapa p8.
const readerIssues=window.KON_CONFIG.readerIssues;
const zr=id=>document.getElementById(id);const zrRoot=zr('zineReader'),zrBook=zr('zrBook'),zrMobile=zr('zrMobileBook'),zrMobileImg=zr('zrMobileImg');
const zrMobileQuery=window.matchMedia('(max-width: 700px)');
let zrKey='wag-the-dog',zrTurn=0,zrMobileIndex=0,zrBusy=false,zrPointer=null,zrTouch=null,zrZoomScale=1,zrReturnFocus=null;
const zrCurrent=()=>readerIssues[zrKey],zrIsMobile=()=>zrMobileQuery.matches;
function zrVisible(){if(zrIsMobile())return[zrMobileIndex];if(zrTurn===0)return[0];if(zrTurn===4)return[7];return[zrTurn*2-1,zrTurn*2]}
function zrSetLayers(){zrBook.querySelectorAll('.zr-sheet').forEach((el,i)=>{el.style.zIndex=i<zrTurn?i+1:4-i;el.classList.toggle('flipped',i<zrTurn);el.style.transform='';el.style.transition='';})}
function zrBuild(){zrBook.querySelectorAll('.zr-sheet').forEach(e=>e.remove());for(let i=0;i<4;i++){
 const leaf=document.createElement('div');leaf.className='zr-sheet';leaf.dataset.idx=i;
 leaf.innerHTML='<div class="zr-face front"><img draggable="false" alt="Página '+(2*i+1)+'" src="'+zrCurrent().pages[2*i]+'"></div><div class="zr-face back"><img draggable="false" alt="Página '+(2*i+2)+'" src="'+zrCurrent().pages[2*i+1]+'"></div>';
 zrBook.appendChild(leaf)} zrMobileImg.src=zrCurrent().pages[zrMobileIndex];zrMobileImg.alt='Página '+(zrMobileIndex+1)+' de '+zrCurrent().name;zrSetLayers()}
function zrNav(){let pages=zrVisible();zr('zrCount').textContent=pages.map(x=>String(x+1).padStart(2,'0')).join(' — ')+' / 08';zr('zrPlace').textContent=pages.length===2?'DOBLE PÁGINA':pages[0]===0?'PORTADA':pages[0]===7?'CONTRATAPA':'PÁGINA';zr('zrPrev').disabled=zrIsMobile()?zrMobileIndex===0:zrTurn===0;zr('zrNext').disabled=zrIsMobile()?zrMobileIndex===7:zrTurn===4;zr('zrDots').innerHTML=Array.from({length:8},(_,i)=>'<span class="zr-dot '+(pages.includes(i)?'here':'')+'"></span>').join('')}
function zrPickMarkup(){
  const picks=zr('zrPicks');
  // No regenerar la lista en cada cambio: se conservarán el scroll y el foco del usuario.
  if(!picks.children.length){
    picks.innerHTML=Object.entries(readerIssues).map(([k,it])=>'<button class="zr-pick" type="button" data-reader-issue="'+k+'" aria-pressed="false"><img src="'+it.pages[0]+'" alt="Tapa de '+it.name+'" loading="lazy"><div><small>REVISTA Nº '+it.number+'</small><strong>'+it.name+'</strong></div></button>').join('');
    picks.querySelectorAll('[data-reader-issue]').forEach(b=>b.onclick=()=>zrSelect(b.dataset.readerIssue));
  }
  let current=null;
  picks.querySelectorAll('[data-reader-issue]').forEach(button=>{
    const selected=button.dataset.readerIssue===zrKey;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
    if(selected)current=button;
  });
  if(current){
    // Solo se desplaza el selector, sin saltos en la revista ni en la pantalla completa.
    const mobile=zrMobileQuery.matches;
    const start=mobile?current.offsetLeft-picks.offsetLeft:current.offsetTop-picks.offsetTop;
    const extent=mobile?current.offsetWidth:current.offsetHeight;
    const viewport=mobile?picks.clientWidth:picks.clientHeight;
    const scroll=mobile?picks.scrollLeft:picks.scrollTop;
    const margin=mobile?12:8;
    if(start<scroll+margin||start+extent>scroll+viewport-margin){
      const target=Math.max(0,start-(viewport-extent)/2);
      const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if(mobile)picks.scrollTo({left:target,behavior:reduced?'instant':'smooth'});
      else picks.scrollTo({top:target,behavior:reduced?'instant':'smooth'});
    }
  }
}
function zrSelect(key){if(!readerIssues[key]||zrBusy)return;zrKey=key;zrTurn=0;zrMobileIndex=0;zrRoot.style.setProperty('--zrbase',zrCurrent().bg);zrRoot.style.setProperty('--zron',zrCurrent().on);zr('zrNum').textContent='N.º '+zrCurrent().number;zr('zrTitle').textContent=zrCurrent().name;let pl=zr('zrPrint');pl.href=zrCurrent().print;pl.download='KonClub_'+zrCurrent().folder+'_para_imprimir.jpg';zrPickMarkup();zrBuild();zrNav()}
function openZine(key){zrReturnFocus=document.activeElement; if(modal.classList.contains('open'))closeModal(); if(zr('adminPanel').classList.contains('open'))closePanel();zrRoot.classList.add('open');zrRoot.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');zrRoot.scrollTop=0;zrSelect(key);zr('zrClose').focus()}
function closeZine(){zrRoot.classList.remove('open');zrRoot.setAttribute('aria-hidden','true');document.body.classList.toggle('no-scroll',location.hash==='#fanzinoteca-completa'||location.hash.startsWith('#archivo-completo'));if(zr('zrZoom').open)zr('zrZoom').close();zrReturnFocus?.focus?.()}
zr('zrClose').onclick=closeZine;
function zrFlipDesk(dir){if(zrBusy||(dir===1&&zrTurn>=4)||(dir===-1&&zrTurn<=0))return;zrBusy=true;let i=dir===1?zrTurn:zrTurn-1,leaf=zrBook.querySelectorAll('.zr-sheet')[i];leaf.style.zIndex=20;void leaf.offsetWidth;leaf.style.transition='transform 800ms cubic-bezier(.21,.65,.21,1)';leaf.style.transform=dir===1?'rotateY(-180deg)':'rotateY(0deg)';let finished=false;function done(){if(finished)return;finished=true;zrTurn+=dir;zrBusy=false;zrSetLayers();zrNav()}leaf.addEventListener('transitionend',done,{once:true});setTimeout(done,850)}
function zrFlipMobile(dir){if(zrBusy)return;const next=zrMobileIndex+dir;if(next<0||next>=8)return;zrBusy=true;let over=document.createElement('div');over.className='zr-mobile-turn'+(dir<0?' backward':'');over.innerHTML='<img src="'+zrCurrent().pages[zrMobileIndex]+'" alt="">';zrMobile.append(over);zrMobileImg.src=zrCurrent().pages[next];zrMobileImg.alt='Página '+(next+1)+' de '+zrCurrent().name;void over.offsetWidth;over.style.transition='transform 580ms cubic-bezier(.16,.62,.34,1), opacity 540ms';over.style.transform=dir===1?'rotateY(-175deg)':'rotateY(175deg)';over.style.opacity='.45';zrMobileIndex=next;let finished=false;function done(){if(finished)return;finished=true;over.remove();zrBusy=false;zrNav()}over.addEventListener('transitionend',done,{once:true});setTimeout(done,650)}
function zrFlip(dir){zrIsMobile()?zrFlipMobile(dir):zrFlipDesk(dir)}
zr('zrPrev').onclick=()=>zrFlip(-1);zr('zrNext').onclick=()=>zrFlip(1);
zrBook.addEventListener('pointerdown',e=>{if(e.button!==0||zrBusy)return;let r=zrBook.getBoundingClientRect(),dir=e.clientX>r.left+r.width/2?1:-1;if((dir===1&&zrTurn===4)||(dir===-1&&zrTurn===0))return;zrPointer={x:e.clientX,dir,moved:false};zrBook.setPointerCapture(e.pointerId);zrBook.classList.add('dragging')});
zrBook.addEventListener('pointermove',e=>{if(!zrPointer||zrBusy)return;let d=e.clientX-zrPointer.x;if(Math.abs(d)>15)zrPointer.moved=true;if(!zrPointer.moved)return;let prog=Math.min(1,Math.max(0,(zrPointer.dir===1?-d:d)/(zrBook.clientWidth*.5)));let i=zrPointer.dir===1?zrTurn:zrTurn-1,leaf=zrBook.querySelectorAll('.zr-sheet')[i];leaf.style.transition='none';leaf.style.zIndex=20;leaf.style.transform='rotateY('+(zrPointer.dir===1?-180*prog:-180+180*prog)+'deg)'});
zrBook.addEventListener('pointerup',e=>{if(!zrPointer)return;zrBook.classList.remove('dragging');let p=zrPointer;zrPointer=null;if(p.moved){let prog=(p.dir===1?-(e.clientX-p.x):(e.clientX-p.x))/(zrBook.clientWidth*.5);let leaf=zrBook.querySelectorAll('.zr-sheet')[p.dir===1?zrTurn:zrTurn-1];if(prog>.22){leaf.style.transition='none';void leaf.offsetWidth;zrFlipDesk(p.dir)}else{leaf.style.transition='transform 350ms ease';leaf.style.transform=p.dir===1?'rotateY(0deg)':'rotateY(-180deg)';setTimeout(zrSetLayers,370)}}else zrFlipDesk(p.dir)});
zrBook.addEventListener('pointercancel',()=>{zrPointer=null;zrSetLayers();zrBook.classList.remove('dragging')});
zrMobile.addEventListener('touchstart',e=>{if(!zrBusy)zrTouch={x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY}},{passive:true});
zrMobile.addEventListener('touchend',e=>{if(!zrTouch||zrBusy)return;let x=e.changedTouches[0].clientX-zrTouch.x,y=e.changedTouches[0].clientY-zrTouch.y;if(Math.abs(x)>42&&Math.abs(x)>Math.abs(y)*1.2)zrFlip(x<0?1:-1);else if(Math.abs(x)<11&&Math.abs(y)<11){const r=zrMobile.getBoundingClientRect();zrFlip(e.changedTouches[0].clientX>r.left+r.width/2?1:-1)}zrTouch=null},{passive:true});
zrMobile.addEventListener('click',e=>{if('ontouchstart' in window)return;const r=zrMobile.getBoundingClientRect();zrFlip(e.clientX>r.left+r.width/2?1:-1)});
zrMobileQuery.addEventListener('change',()=>{zrTurn=0;zrMobileIndex=0;zrBusy=false;zrSetLayers();zrMobileImg.src=zrCurrent().pages[0];zrNav()});
function zrZoomPage(){return zrVisible().at(-1)}
function zrApplyZoom(){zr('zrZoomImg').style.width=(Math.min(window.innerWidth*.9,700)*zrZoomScale)+'px'}
function zrOpenZoom(){let i=zrZoomPage();zrZoomScale=1;zr('zrZoomImg').src=zrCurrent().pages[i];zr('zrZoomTitle').textContent='REVISTA Nº '+zrCurrent().number+' · PÁGINA '+String(i+1).padStart(2,'0');zr('zrZoom').showModal();zrApplyZoom()}
zr('zrZoomOpen').onclick=zrOpenZoom;zr('zrZoomClose').onclick=()=>zr('zrZoom').close();zr('zrZoomPlus').onclick=()=>{zrZoomScale=Math.min(zrZoomScale+.35,3);zrApplyZoom()};zr('zrZoomMinus').onclick=()=>{zrZoomScale=Math.max(zrZoomScale-.35,.5);zrApplyZoom()};zr('zrZoom').addEventListener('click',e=>{if(e.target===zr('zrZoom'))zr('zrZoom').close()});
zr('zrDownload').onclick=()=>{let i=zrZoomPage();const a=document.createElement('a');a.href=zrCurrent().pages[i];a.download='KonClub_'+zrCurrent().number+'_pagina_'+String(i+1).padStart(2,'0')+'.webp';a.click()};
document.addEventListener('keydown',e=>{if(!zrRoot.classList.contains('open'))return;if(e.key==='Escape'){if(!zr('zrZoom').open)closeZine();return}if(zr('zrZoom').open)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();zrFlip(e.key==='ArrowRight'?1:-1)}});
document.querySelectorAll('[data-zine]').forEach(b=>b.onclick=()=>openZine(b.dataset.zine));document.querySelectorAll('[data-photo]').forEach(b=>b.onclick=()=>{openModal('<div class="eyebrow">ÁLBUM / FEAR AND LOATHING</div><h3 id="dialogTitle">FOTOS DEL KON</h3><img class="dialog-image" src="'+assets[b.dataset.photo]+'" alt="Registro fotográfico de Kon Club">')});$('menuButton').onclick=()=>{let n=$('mobileNav'),state=!n.classList.contains('open');n.classList.toggle('open',state);$('menuButton').setAttribute('aria-expanded',String(state))};document.querySelectorAll('.mobile-nav a').forEach(a=>a.onclick=()=>{$('mobileNav').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false')});
// Archivo público interno: contenido editorial, sin enlaces a Google Drive.
const archiveCatalog=window.KON_CONFIG.archiveCatalog;const archiveLookup=archiveCatalog;
window.KON_ADD_ARCHIVED=function(entries){
 if(!Array.isArray(entries))return;
 for(const e of entries){
  const folder=String(e.archive_number||"");
  if(!/^\d+$/.test(folder)||Number(folder)<17||archiveCatalog.some(it=>it[0]===folder))continue;
  const key="cms-"+String(e.slug||"").replace(/[^a-z0-9-]/g,"");
  const url=String(e.flyer_url||"");
  if(!/^\/public\/media\/[A-Za-z0-9_.-]+$/.test(url)&&!/^https:\/\/ogrzuiwlyfobhtknjuzu\.supabase\.co\/storage\/v1\/object\/public\/kon-edition-media\/[A-Za-z0-9/_.-]+$/.test(url))continue;
  assets[key]=url;
  archiveCatalog.unshift([folder,String(e.film_title||e.title||"KON CLUB"),key]);
  const synopsis=String(e.synopsis||"").slice(0,1800);
  window.KON_CONFIG.archiveSynopses[folder]=synopsis?[{title:String(e.film_title||""),text:synopsis}]:[];
 }
 archiveCatalog.sort((a,b)=>Number(b[0])-Number(a[0]));
 archivePaint();
};const archivePage=$('archivo-completo'),archiveGrid=$('archiveAllGrid'),archiveDetail=$('archiveDetail'),archiveDetailContent=$('archiveDetailContent');
const archiveSearch=$('archiveSearch');

function archiveImage(asset){
  const src=asset&&assets[asset]?String(assets[asset]):'';
  return src?'<img alt="Flyer original de Kon Club" src="'+escapeHtml(src)+'" loading="lazy" decoding="async">':null;
}
function archiveCard(it){
  const img=archiveImage(it[2]);
  return '<button class="archive-index-card" type="button" data-archive-id="'+escapeHtml(it[0])+'" aria-label="Abrir edición '+escapeHtml(it[1])+'"><div class="archive-index-cover '+(img?'':'placeholder')+'">'+(img||'<span>'+escapeHtml(it[0])+'</span><strong>'+escapeHtml(it[1])+'</strong>')+'</div><div class="archive-index-meta"><small>EDICIÓN N.º '+escapeHtml(it[0])+'</small><strong>'+escapeHtml(it[1])+'</strong><span class="archive-index-cta">ABRIR FICHA ↗</span></div></button>';
}
function archivePaint(){
  const q=archiveSearch.value.trim().toLocaleLowerCase('es');
  const regular=archiveCatalog.filter(it=>(it[0]+' '+it[1]).toLocaleLowerCase('es').includes(q));
  archiveGrid.innerHTML=regular.map(archiveCard).join('');
  $('regularCount').textContent=regular.length+' EDICIONES';
  $('archiveResultCount').textContent=regular.length+' EDICIONES DEL KON';
  $('archiveEmpty').hidden=regular.length!==0;
  archiveGrid.querySelectorAll('[data-archive-id]').forEach(b=>b.onclick=()=>{location.hash='#archivo-completo/'+b.dataset.archiveId;});
}
function archiveSynopsis(folder){
  const entries=window.KON_CONFIG.archiveSynopses?.[folder]||[];
  if(!entries.length)return '<p>Estamos preparando la sinopsis de esta edición.</p>';
  const double=entries.length>1;
  return '<div class="archive-synopses"><span class="archive-synopsis-kicker">'+(double?'SINOPSIS / DOBLE FUNCIÓN':'SINOPSIS / SIN SPOILERS')+'</span>'+entries.map(entry=>'<div class="archive-synopsis">'+(double?'<h4>'+escapeHtml(entry.title)+'</h4>':'')+'<p>'+escapeHtml(entry.text)+'</p></div>').join('')+'</div>';
}
// Solo mostramos imágenes oficiales alojadas en la carpeta pública, nunca enlaces arbitrarios.
function archiveMediaSrc(src){
  const value=String(src||'');
  return /^public\/media\/[A-Za-z0-9/_-]+\.(png|jpg|jpeg|webp)$/i.test(value)?value:null;
}
function archiveMediaGrid(items,kind){
  return '<div class="archive-issue-gallery">'+items.map((item,i)=>{
    const src=archiveMediaSrc(item.src);
    const label=escapeHtml(item.description||item.alt||'Registro original del Kon Club');
    return '<button type="button" class="archive-issue-photo" data-archive-media="'+kind+'" data-archive-index="'+i+'" aria-label="Ampliar: '+label+'"><img src="'+escapeHtml(src)+'" alt="'+label+'" loading="lazy" decoding="async"><span>VER FOTO ↗</span></button>';
  }).join('')+'</div>';
}
const archiveHero=document.querySelector('.archive-full-hero');
let archiveActiveId=null;
let archiveViewerItems=[],archiveViewerIndex=0;
const archiveViewer=$('archiveMediaViewer');
function archiveViewerPaint(){
  const item=archiveViewerItems[archiveViewerIndex];
  if(!item)return;
  $('archiveViewerImage').src=archiveMediaSrc(item.src);
  $('archiveViewerImage').alt=item.description||item.alt||'Imagen del Kon Club';
  $('archiveViewerTitle').textContent=(item.description||item.alt||'REGISTRO DEL KON').toUpperCase();
  $('archiveViewerCount').textContent=String(archiveViewerIndex+1).padStart(2,'0')+' / '+String(archiveViewerItems.length).padStart(2,'0');
  $('archiveViewerPrev').disabled=archiveViewerIndex===0;
  $('archiveViewerNext').disabled=archiveViewerIndex>=archiveViewerItems.length-1;
}
function archiveViewerOpen(items,index){
  archiveViewerItems=items;archiveViewerIndex=index;
  if(!archiveViewerItems[index])return;
  archiveViewerPaint();
  if(!archiveViewer.open)archiveViewer.showModal();
}
$('archiveViewerClose').onclick=()=>archiveViewer.close();
$('archiveViewerPrev').onclick=()=>{if(archiveViewerIndex>0){archiveViewerIndex--;archiveViewerPaint();}};
$('archiveViewerNext').onclick=()=>{if(archiveViewerIndex<archiveViewerItems.length-1){archiveViewerIndex++;archiveViewerPaint();}};
archiveViewer.addEventListener('click',e=>{if(e.target===archiveViewer)archiveViewer.close();});
document.addEventListener('keydown',e=>{
  if(!archiveViewer.open)return;
  if(e.key==='ArrowLeft'&&archiveViewerIndex>0){e.preventDefault();archiveViewerIndex--;archiveViewerPaint();}
  if(e.key==='ArrowRight'&&archiveViewerIndex<archiveViewerItems.length-1){e.preventDefault();archiveViewerIndex++;archiveViewerPaint();}
});
// Lectura integrada en la ficha: desktop en doble página y móvil en página única.
let archiveInlineZineCleanup=null;
function initArchiveInlineZine(issue){
  const view=$('archiveInlinePages'),back=$('archiveInlinePrev'),forward=$('archiveInlineNext'),count=$('archiveInlineCount');
  if(!view||!back||!forward||!count||!issue?.pages?.length)return()=>{};
  const mobile=window.matchMedia('(max-width:700px)');
  let currentPage=0,gesture=null;
  const pageGroups=()=>{
    if(mobile.matches)return issue.pages.map((_,i)=>[i]);
    const groups=[[0]];
    for(let i=1;i<issue.pages.length-1;i+=2)groups.push([i,...(i+1<issue.pages.length-1?[i+1]:[])]);
    if(issue.pages.length>1)groups.push([issue.pages.length-1]);
    return groups;
  };
  function groupIndex(groups){
    const index=groups.findIndex(group=>group.includes(currentPage));
    return index<0?0:index;
  }
  function draw(){
    const groups=pageGroups(),index=groupIndex(groups),visible=groups[index];
    view.replaceChildren();
    view.classList.toggle('single',visible.length===1);
    for(const pageNo of visible){
      const figure=document.createElement('figure');
      const photo=document.createElement('img');
      photo.src=issue.pages[pageNo];
      photo.alt='Página '+(pageNo+1)+' de '+issue.pages.length+' · '+issue.name;
      photo.loading='lazy';
      photo.decoding='async';
      figure.appendChild(photo);
      view.appendChild(figure);
    }
    const numbered=visible.map(i=>String(i+1).padStart(2,'0')).join(' — ');
    count.textContent=numbered+' / '+String(issue.pages.length).padStart(2,'0');
    view.setAttribute('aria-label','Páginas '+numbered+' de '+issue.pages.length+' de '+issue.name+'. Usá las flechas para avanzar.');
    back.disabled=index===0;
    forward.disabled=index===groups.length-1;
  }
  function turn(direction){
    const groups=pageGroups(),next=groupIndex(groups)+direction;
    if(next<0||next>=groups.length)return;
    currentPage=groups[next][0];
    draw();
  }
  back.addEventListener('click',()=>turn(-1));
  forward.addEventListener('click',()=>turn(1));
  view.addEventListener('keydown',event=>{
    if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
      event.preventDefault();
      turn(event.key==='ArrowRight'?1:-1);
    }
  });
  view.addEventListener('touchstart',event=>{
    if(!mobile.matches||event.touches.length!==1){gesture=null;return;}
    const touch=event.touches[0];gesture={x:touch.clientX,y:touch.clientY};
  },{passive:true});
  view.addEventListener('touchend',event=>{
    if(!gesture||event.changedTouches.length!==1){gesture=null;return;}
    const touch=event.changedTouches[0];
    const dx=touch.clientX-gesture.x,dy=touch.clientY-gesture.y;
    gesture=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)turn(dx<0?1:-1);
  },{passive:true});
  view.addEventListener('touchcancel',()=>{gesture=null;},{passive:true});
  const onLayoutChange=()=>draw();
  if(mobile.addEventListener)mobile.addEventListener('change',onLayoutChange);
  else if(mobile.addListener)mobile.addListener(onLayoutChange);
  draw();
  return()=>{
    if(mobile.removeEventListener)mobile.removeEventListener('change',onLayoutChange);
    else if(mobile.removeListener)mobile.removeListener(onLayoutChange);
  };
}

function archiveOpenDetail(id){
  archiveInlineZineCleanup?.();
  archiveInlineZineCleanup=null;
  const it=archiveLookup.find(a=>a[0]===String(id));
  if(!it){archiveBack();return;}
  const folder=it[0],zineKey=Object.keys(readerIssues).find(k=>readerIssues[k].folder===folder),zine=zineKey?readerIssues[zineKey]:null;
  const photos=(window.KON_CONFIG.photoAlbum||[]).filter(x=>Number(x.edition)===Number(folder)&&archiveMediaSrc(x.src));
  const reviews=(window.KON_CONFIG.archiveReviews?.[folder]||[]).filter(x=>archiveMediaSrc(x.src));
  archiveActiveId=folder;
  $('archiveSections').hidden=true;
  document.querySelector('.archive-full-toolbar').hidden=true;
  archiveHero.hidden=true;
  archiveDetail.hidden=false;
  const img=archiveImage(it[2]);
  const idx=archiveCatalog.findIndex(a=>a[0]===folder);
  const nextNewer=idx>0?archiveCatalog[idx-1]:null;
  const nextOlder=idx<archiveCatalog.length-1?archiveCatalog[idx+1]:null;
  const zineHtml=zine?
    '<div class="archive-embedded-zine" id="archiveInlineZine" style="--zine-bg:'+escapeHtml(zine.bg)+';--zine-on:'+escapeHtml(zine.on)+'" aria-label="Fanzine de '+escapeHtml(it[1])+'">'+
      '<div class="archive-embedded-zine-header"><div><span>PUBLICACIÓN DEL KON / REVISTA N.º '+escapeHtml(zine.number)+'</span><h5>EL FANZINE<br>DE ESTA FECHA.</h5><p>'+zine.pages.length+' PÁGINAS · UNA REVISTA PARA HOJEAR</p></div><span class="archive-embedded-zine-symbol" aria-hidden="true">✳</span></div>'+
      '<div class="archive-embedded-zine-pages single" id="archiveInlinePages" tabindex="0" role="group" aria-label="Páginas de la revista. Usá las flechas para avanzar."></div>'+
      '<div class="archive-embedded-zine-navigation"><button id="archiveInlinePrev" type="button" aria-label="Página anterior">← ANTERIOR</button><span id="archiveInlineCount" aria-live="polite" aria-atomic="true">01 / '+String(zine.pages.length).padStart(2,'0')+'</span><button id="archiveInlineNext" type="button" aria-label="Página siguiente">SIGUIENTE →</button></div>'+
      '<div class="archive-embedded-zine-footer"><p>Pasá las páginas acá mismo. En el celular también podés deslizar hacia los costados.</p><div class="archive-embedded-zine-actions"><button type="button" id="archiveReadZine">VER EN PANTALLA COMPLETA ↗</button><a href="'+escapeHtml(zine.print)+'" download="KonClub_'+escapeHtml(folder)+'_para_imprimir.jpg">↓ BAJAR PARA IMPRIMIR</a></div></div>'+
    '</div>'
    :'<div class="archive-issue-empty"><span>✳</span><p>Todavía no hay un fanzine digital cargado para esta edición.</p></div>';
  const photosHtml=photos.length?archiveMediaGrid(photos,'photo'):'<div class="archive-issue-empty"><span>↗</span><p>Aún no hay fotografías publicadas de esta fecha en el archivo.</p></div>';
  const reviewsHtml=reviews.length?archiveMediaGrid(reviews,'review'):'<div class="archive-issue-empty archive-issue-reviews-empty"><span>✳</span><div><strong>LAS RESEÑAS TAMBIÉN SON PARTE DE LA FUNCIÓN.</strong><p>Estamos preparando este espacio para las reseñas escritas a mano por el público. Todavía no hay imágenes de esta edición cargadas.</p></div></div>';
  archiveDetailContent.innerHTML=
   '<header class="archive-issue-meta"><span>ARCHIVO VIVO / KON CLUB</span><span>EDICIÓN N.º '+escapeHtml(folder)+' · DESDE PAPRIKA</span><button id="archiveShare" type="button">COMPARTIR FICHA ↗</button></header>'+
   '<div class="archive-detail-grid archive-issue-intro"><div><span class="num">[ FICHA '+escapeHtml(folder)+' / CINE Y MÁS ]</span><h3>'+escapeHtml(it[1])+'</h3>'+archiveSynopsis(folder)+
   '<div class="archive-issue-jumps"><button type="button" data-archive-jump="archiveIssueReviews">RESEÑAS ↓</button><button type="button" data-archive-jump="archiveIssueZine">FANZINE ↓</button><button type="button" data-archive-jump="archiveIssuePhotos">FOTOS ↓</button></div>'+
   '</div><div>'+(img?'<figure class="archive-detail-poster">'+img+'<figcaption>AFICHE ORIGINAL / EDICIÓN '+escapeHtml(folder)+'</figcaption></figure>':'<div class="archive-index-cover placeholder" style="min-height:320px"><span>'+escapeHtml(folder)+'</span><strong>'+escapeHtml(it[1])+'</strong></div>')+'</div></div>'+
   '<section class="archive-issue-chapter" id="archiveIssueReviews"><header><span>[01] / VOCES DEL KON</span><h4>LO QUE DIJO<br>EL PÚBLICO<span>.</span></h4><small>RESEÑAS MANUSCRITAS ORIGINALES</small></header>'+reviewsHtml+'</section>'+
   '<section class="archive-issue-chapter" id="archiveIssueZine"><header><span>[02] / EDICIÓN IMPRESA</span><h4>LO QUE<br>IMPRIMIMOS<span>.</span></h4></header>'+zineHtml+'</section>'+
   '<section class="archive-issue-chapter" id="archiveIssuePhotos"><header><span>[03] / REGISTRO FOTOGRÁFICO</span><h4>ESTUVIMOS<br>AHÍ<span>.</span></h4><small>'+photos.length+' FOTOGRAFÍA(S) · EDICIÓN '+escapeHtml(folder)+'</small></header>'+photosHtml+'</section>'+
   '<nav class="archive-issue-pagination" aria-label="Más ediciones"><div>'+(nextNewer?'<button type="button" data-archive-go="'+escapeHtml(nextNewer[0])+'">← EDICIÓN '+escapeHtml(nextNewer[0])+'<strong>'+escapeHtml(nextNewer[1])+'</strong></button>':'')+'</div><div>'+(nextOlder?'<button type="button" data-archive-go="'+escapeHtml(nextOlder[0])+'">EDICIÓN '+escapeHtml(nextOlder[0])+' →<strong>'+escapeHtml(nextOlder[1])+'</strong></button>':'')+'</div></nav>';
  if(zine){
    archiveInlineZineCleanup=initArchiveInlineZine(zine);
    $('archiveReadZine').onclick=()=>openZine(zineKey);
  }
  $('archiveShare').onclick=async()=>{
    const url=location.origin+location.pathname+'#archivo-completo/'+folder;
    try{
      if(navigator.share){await navigator.share({title:'Kon Club · '+it[1],url});return;}
      if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(url);notify('ENLACE A LA EDICIÓN COPIADO');return;}
      window.prompt('Copiá el enlace de esta edición:',url);
    }catch(e){if(e.name!=='AbortError')notify('NO SE PUDO COPIAR EL ENLACE');}
  };
  archiveDetailContent.querySelectorAll('[data-archive-jump]').forEach(b=>b.onclick=()=>{document.getElementById(b.dataset.archiveJump)?.scrollIntoView({behavior:'smooth',block:'start'});});
  archiveDetailContent.querySelectorAll('[data-archive-go]').forEach(b=>b.onclick=()=>{location.hash='#archivo-completo/'+b.dataset.archiveGo;});
  archiveDetailContent.querySelectorAll('[data-archive-media]').forEach(b=>b.onclick=()=>{
    const collection=b.dataset.archiveMedia==='review'?reviews:photos;
    archiveViewerOpen(collection,Number(b.dataset.archiveIndex));
  });
  archivePage.scrollTop=0;
}
function archiveBack(){
  archiveInlineZineCleanup?.();
  archiveInlineZineCleanup=null;
  archiveActiveId=null;
  archiveDetail.hidden=true;
  $('archiveSections').hidden=false;
  document.querySelector('.archive-full-toolbar').hidden=false;
  archiveHero.hidden=false;
  archivePage.scrollTop=0;
}
function archiveSync(){
  const match=location.hash.match(/^#archivo-completo(?:\/(\d+))?$/);
  const show=Boolean(match);
  archivePage.classList.toggle('is-open',show);
  archivePage.setAttribute('aria-hidden',String(!show));
  if(archiveViewer.open)archiveViewer.close();
  if(show){
    archivePaint();
    if(match[1]&&archiveCatalog.some(a=>a[0]===match[1]))archiveOpenDetail(match[1]);else archiveBack();
    $('mobileNav').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');
    document.body.classList.add('no-scroll');
  }else if(location.hash!=='#fanzinoteca-completa'&&!zrRoot.classList.contains('open')){
    document.body.classList.remove('no-scroll');
  }
}
$('closeFullArchive').onclick=()=>{location.hash='#archivo';};
$('archiveBack').onclick=()=>{location.hash='#archivo-completo';};
archiveSearch.addEventListener('input',()=>{archivePaint();});
window.addEventListener('hashchange',archiveSync);
archiveSync();

// Fanzinoteca: página interna de catálogo completo; la home solo muestra 2 números.
const fullFanzinePage=$('fanzinoteca-completa');
function syncFanzinePage(){
  const show=location.hash==='#fanzinoteca-completa';
  fullFanzinePage.classList.toggle('is-open',show);
  fullFanzinePage.setAttribute('aria-hidden',String(!show));
  document.body.classList.toggle('no-scroll',show||location.hash.startsWith('#archivo-completo')||zrRoot.classList.contains('open'));
  if(show){fullFanzinePage.scrollTop=0; $('mobileNav').classList.remove('open');$('menuButton').setAttribute('aria-expanded','false');}
}
const fanzineFilter=$('fanzineFullSearch');
fanzineFilter.addEventListener('input',()=>{
  const q=fanzineFilter.value.trim().toLocaleLowerCase('es');
  let count=0;
  $('fanzineFullGrid').querySelectorAll('.zine-card').forEach(card=>{
    const matches=(card.innerText||card.textContent).toLocaleLowerCase('es').includes(q);
    card.hidden=!matches;if(matches) count++;
  });
  $('fanzineFullCount').textContent=count+' FANZINES';
  $('fanzineFullEmpty').hidden=count>0;
});
window.addEventListener('hashchange',syncFanzinePage);syncFanzinePage();

render()})();