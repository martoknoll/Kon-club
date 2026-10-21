(()=>{
'use strict';
const kon=window.KON_CONFIG;
if(!kon||!kon.archiveEditionNumbers)return;
const byId=id=>document.getElementById(id);
const edition=folder=>kon.archiveEditionNumbers[String(folder)]||null;
const label=folder=>edition(folder)?'EDICIÓN #'+edition(folder):'EDICIÓN DEL ARCHIVO';
const validId=id=>/^[A-Za-z0-9_-]{20,80}$/.test(String(id||''));
const thumb=(id,large=false)=>validId(id)?'https://drive.google.com/thumbnail?id='+id+'&sz='+(large?'w2400':'w1200'):'';
const safeLocalSrc=src=>/^public\/media\/entradas\/[a-z0-9-]+\.webp$/.test(String(src||''))?src:'';
const ticketSrc=(item,large=false)=>safeLocalSrc(item.src)||thumb(item.id,large);
const validTicket=item=>Boolean(safeLocalSrc(item.src)||validId(item.id));
const archivePage=byId('archivo-completo');
const themeProperties=['bg','on','paper','ink','accent','secondary'];
let ticketDialog=null;
function themeForEdition(folder){
  const palette=kon.archiveThemes?.[folder];
  return palette&&themeProperties.every(key=>/^#[0-9a-fA-F]{6}$/.test(palette[key]||''))?palette:null;
}
function applyEditionTheme(folder){
  const theme=folder?themeForEdition(folder):null;
  archivePage.classList.toggle('kon-edition-theme',Boolean(theme));
  archivePage.dataset.activeEdition=theme?folder:'';
  for(const key of themeProperties){
    if(theme)archivePage.style.setProperty('--'+key,theme[key]);
    else archivePage.style.removeProperty('--'+key);
  }
  if(ticketDialog?.open)ticketDialog.close();
  ticketDialog=null;
}
function enhanceList(){
  document.querySelectorAll('#archiveAllGrid .archive-index-card').forEach(card=>{
    const id=card.dataset.archiveId,small=card.querySelector('.archive-index-meta small');
    if(small)small.textContent=label(id)+(id==='26'?' · KON CLUB LITE':'');
    const emptyNumber=card.querySelector('.archive-index-cover.placeholder span');
    if(emptyNumber)emptyNumber.textContent=edition(id)||'✳';
  });
  if(byId('archiveResultCount'))byId('archiveResultCount').textContent=byId('archiveResultCount').textContent.replace('EDICIONES DEL KON','FUNCIONES DEL KON');
  if(byId('regularCount'))byId('regularCount').textContent=byId('regularCount').textContent.replace('EDICIONES','FUNCIONES');
}
function section(folder){
  const items=(kon.archiveTickets?.[folder]||[]).filter(validTicket);
  const root=document.createElement('section');
  root.className='kon-archive-ticket';root.id='archiveIssueTicket';
  const current=items[0];
  const empty='<div class="archive-issue-empty"><span>✳</span><p>Esta pieza todavía no está disponible en el archivo digital.</p></div>';
  root.innerHTML='<header><span>[01] / ARCHIVO DE PAPEL</span><h4>LA ENTRADA<br>DE ESA <em>FECHA.</em></h4><small>'+label(folder)+'</small></header>'+
    (!current?empty:'<div class="kon-archive-ticket-layout"><div class="kon-ticket-stage"><button type="button" class="kon-archive-ticket-card" id="konTicketCard" aria-label="Ampliar entrada física"><div class="kon-ticket-backdrop"><span>KON CLUB / ARCHIVO</span><strong>ENTRADA<br>ORIGINAL</strong></div><img id="konTicketImage" alt="Entrada del Kon" src="'+ticketSrc(current)+'" loading="lazy"><span class="kon-ticket-corner">AMPLIAR ⤢</span></button></div><div class="kon-archive-ticket-copy"><span class="archive-issue-kicker">PIEZAS ORIGINALES / SIN REDISEÑAR</span><h5>UNA ENTRADA.<br>UN RECUERDO.</h5><p>La entrada física que diseñamos para esta función. Un recorrido por la evolución gráfica del club desde Paprika.</p><strong id="konTicketName" aria-live="polite"></strong><small class="kon-ticket-mobile-help">'+(items.length>1?'DESLIZÁ PARA CAMBIAR · TOCÁ PARA AMPLIAR':'TOCÁ LA ENTRADA PARA AMPLIAR')+'</small><div class="kon-archive-ticket-actions"><button type="button" id="konTicketZoom">AMPLIAR ENTRADA ⤢</button>'+(items.length>1?'<button type="button" id="konTicketPrev" aria-label="Ver entrada anterior">← ANTERIOR</button><button type="button" id="konTicketNext" aria-label="Ver entrada siguiente">SIGUIENTE →</button>':'')+'</div>'+(items.length>1?'<small id="konTicketPosition" role="status" aria-live="polite"></small>':'')+'<small>Registro gráfico del Kon. Esta imagen es parte del archivo histórico, no una entrada válida para ingresar.</small></div></div><dialog class="kon-ticket-dialog" aria-label="Entrada física ampliada"><div class="kon-ticket-dialog-top"><span>ARCHIVO DE ENTRADAS · '+label(folder)+'</span><button type="button" class="kon-ticket-dialog-close">CERRAR ×</button></div><img class="kon-ticket-dialog-image" alt="Entrada física de la edición"><span class="kon-ticket-dialog-caption"></span></dialog>');
  if(items.length){
    let index=0;
    const frame=root.querySelector('#konTicketCard'),img=root.querySelector('#konTicketImage'),name=root.querySelector('#konTicketName'),position=root.querySelector('#konTicketPosition');
    const modal=root.querySelector('.kon-ticket-dialog'),modalImg=root.querySelector('.kon-ticket-dialog-image'),modalCaption=root.querySelector('.kon-ticket-dialog-caption');
    ticketDialog=modal;
    img.addEventListener('error',()=>frame.classList.add('fallback'));
    img.addEventListener('load',()=>{
      frame.classList.remove('fallback');
      const w=img.naturalWidth,h=img.naturalHeight;
      if(w&&h){
        const aspect=w/h;
        frame.style.setProperty('--ticket-aspect',aspect.toFixed(4));
        frame.parentElement.classList.toggle('is-portrait',aspect<.9);
        frame.parentElement.classList.toggle('is-square',aspect>=.9&&aspect<1.2);
      }
    });
    const paint=()=>{
      const item=items[index];
      frame.classList.remove('fallback');
      frame.style.removeProperty('--ticket-aspect');
      img.src=ticketSrc(item);
      img.alt='Entrada original de '+item.name;
      name.textContent=item.name;
      frame.setAttribute('aria-label','Ampliar entrada de '+item.name);
      const hint=frame.querySelector('.kon-ticket-corner');
      if(hint)hint.textContent='AMPLIAR ⤢';
      if(position)position.textContent=(index+1)+' / '+items.length+' VARIANTES';
    };
    const advance=(direction=1)=>{
      index=(index+direction+items.length)%items.length;
      paint();
      img.classList.remove('kon-card-enter','kon-card-enter-reverse');
      void img.offsetWidth;
      img.classList.add(direction<0?'kon-card-enter-reverse':'kon-card-enter');
    };
    const zoom=()=>{
      const item=items[index];
      modalImg.src=ticketSrc(item,true);
      modalImg.alt='Entrada original de '+item.name;
      modalCaption.textContent=item.name+' · '+label(folder);
      if(!modal.open)modal.showModal();
    };
    paint();
    const prev=root.querySelector('#konTicketPrev');
    if(prev)prev.addEventListener('click',()=>advance(-1));
    const next=root.querySelector('#konTicketNext');
    if(next)next.addEventListener('click',()=>advance(1));
    frame.parentElement.classList.toggle('has-variants',items.length>1);
    // Mobile: botones y swipe natural; el toque abre el visor sin competidores de gestos.
    let suppressClickUntil=0;
    frame.addEventListener('click',event=>{
      if(Date.now()<suppressClickUntil){event.preventDefault();return;}
      zoom();
    });
    enableTicketSwipe(frame,items.length,advance,()=>{
      suppressClickUntil=Date.now()+700;
    });
    root.querySelector('#konTicketZoom').addEventListener('click',zoom);
    root.querySelector('.kon-ticket-dialog-close').addEventListener('click',()=>modal.close());
    modal.addEventListener('click',event=>{if(event.target===modal)modal.close();});
    if(window.VanillaTilt&&window.matchMedia('(hover: hover) and (pointer: fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      frame.dataset.konTilt='enabled';
      window.VanillaTilt.init(frame,{max:7,perspective:1200,scale:1.015,speed:450,glare:true,'max-glare':0.08,gyroscope:false});
    }
    if(img.complete&&!img.naturalWidth)frame.classList.add('fallback');
  }
  return root;
}

// Los gestos son de lectura, no de arrastre: no se captura el puntero ni se bloquea el scroll.
// Los controles anterior/siguiente siguen disponibles aunque el navegador cancele el swipe.
function enableTicketSwipe(frame,count,advance,suppressClick){
  if(count<2)return;
  let start=null;
  frame.addEventListener('touchstart',event=>{
    if(event.touches.length!==1){start=null;return;}
    const point=event.touches[0];
    start={x:point.clientX,y:point.clientY};
  },{passive:true});
  frame.addEventListener('touchend',event=>{
    if(!start||event.changedTouches.length!==1){start=null;return;}
    const point=event.changedTouches[0];
    const dx=point.clientX-start.x,dy=point.clientY-start.y;
    start=null;
    if(Math.abs(dx)<45||Math.abs(dx)<Math.abs(dy)*1.3)return;
    suppressClick(); // Un swipe no debe abrir por error el diálogo de ampliación.
    advance(dx<0?1:-1);
  },{passive:true});
  frame.addEventListener('touchcancel',()=>{start=null;},{passive:true});
}

function enhanceDetail(){
  const hash=location.hash.match(/^#archivo-completo\/(\d+)$/),id=hash?.[1],el=byId('archiveDetailContent');
  if(!id||!el||byId('archiveDetail')?.hidden)return;
  const meta=el.querySelector('.archive-issue-meta span:nth-child(2)');
  if(meta)meta.textContent=label(id)+' · DESDE PAPRIKA';
  const kicker=el.querySelector('.archive-issue-intro .num');
  if(kicker)kicker.textContent='[ '+label(id)+' / CINE Y MÁS ]';
  const caption=el.querySelector('.archive-detail-poster figcaption');
  if(caption)caption.textContent='AFICHE ORIGINAL / '+label(id);
  const placeholder=el.querySelector('.archive-issue-intro .archive-index-cover.placeholder span');
  if(placeholder)placeholder.textContent=edition(id)||'✳';
  const prev=el.querySelectorAll('.archive-issue-pagination [data-archive-go]');
  prev.forEach(btn=>{const fid=btn.dataset.archiveGo;const title=btn.querySelector('strong');btn.replaceChildren(document.createTextNode(label(fid)+(fid===id?'':' ↗')),title||document.createTextNode(''));});
  el.querySelectorAll('.archive-issue-facts span').forEach(s=>{});
  el.querySelectorAll('.archive-issue-chapter>header>small').forEach(s=>{s.textContent=s.textContent.replace('EDICIÓN '+id,label(id));});
  if(byId('archiveIssueTicket'))return;
  const spot=byId('archiveIssueReviews');
  if(!spot)return;
  const ticketSection=section(id);
  spot.insertAdjacentElement('beforebegin',ticketSection);
  const jump=document.createElement('button');
  jump.type='button';jump.textContent='ENTRADA ↓';
  jump.onclick=()=>byId('archiveIssueTicket')?.scrollIntoView({behavior:'smooth',block:'start'});
  const nav=el.querySelector('.archive-issue-jumps');
  if(nav)nav.prepend(jump);
  // Reindexamos los capítulos del archivo tras incorporar la entrada original.
  el.querySelectorAll('.archive-issue-chapter>header>span').forEach((span,i)=>span.textContent=span.textContent.replace(/^\[\d+\]/,'['+String(i+2).padStart(2,'0')+']'));
}
function enhance(){
  enhanceList();
  const match=location.hash.match(/^#archivo-completo\/(\d+)$/);
  applyEditionTheme(match?.[1]||null);
  enhanceDetail();
}
document.addEventListener('DOMContentLoaded',enhance);
window.addEventListener('hashchange',enhance);
byId('archiveSearch')?.addEventListener('input',enhance);
enhance();
})();
