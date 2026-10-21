(()=>{
'use strict';
const kon=window.KON_CONFIG;
if(!kon||!kon.archiveEditionNumbers)return;
const byId=id=>document.getElementById(id);
const edition=folder=>kon.archiveEditionNumbers[String(folder)]||null;
const label=folder=>edition(folder)?'EDICIÓN #'+edition(folder):'EDICIÓN DEL ARCHIVO';
const external=id=>/^[A-Za-z0-9_-]{20,80}$/.test(String(id))?'https://drive.google.com/file/d/'+id+'/view':'';
const thumb=id=>/^[A-Za-z0-9_-]{20,80}$/.test(String(id))?'https://drive.google.com/thumbnail?id='+id+'&sz=w1200':'';
let lastDetail=null;
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
  const items=(kon.archiveTickets?.[folder]||[]).filter(t=>external(t.id));
  const root=document.createElement('section');
  root.className='kon-archive-ticket';root.id='archiveIssueTicket';
  const current=items[0];
  const empty='<div class="archive-issue-empty"><span>✳</span><p>Esta pieza todavía no está disponible en el archivo digital.</p></div>';
  root.innerHTML='<header><span>[01] / ARCHIVO DE PAPEL</span><h4>LA ENTRADA<br>DE ESA <em>FECHA.</em></h4><small>'+label(folder)+'</small></header>'+
    (!current?empty:'<div class="kon-archive-ticket-layout"><div class="kon-ticket-stage"><div class="kon-archive-ticket-card" id="konTicketCard" role="button" tabindex="0" aria-label="Explorar entrada original"><div class="kon-ticket-backdrop"><span>KON CLUB / ARCHIVO</span><strong>ENTRADA<br>ORIGINAL</strong></div><img id="konTicketImage" alt="Entrada del Kon" src="'+thumb(current.id)+'" loading="lazy"><span class="kon-ticket-corner">EXPLORAR ↗</span></div></div><div class="kon-archive-ticket-copy"><span class="archive-issue-kicker">PIEZAS ORIGINALES / SIN REDISEÑAR</span><h5>UNA ENTRADA.<br>UN RECUERDO.</h5><p>La entrada física que diseñamos para esta función. Un recorrido por la evolución gráfica del club desde Paprika.</p><strong id="konTicketName"></strong><div class="kon-archive-ticket-actions"><a id="konTicketOpen" href="'+external(current.id)+'" target="_blank" rel="noopener noreferrer">VER ORIGINAL ↗</a>'+(items.length>1?'<button type="button" id="konTicketNext">OTRA VERSIÓN ↻</button>':'')+'</div>'+(items.length>1?'<small id="konTicketPosition"></small>':'')+'<small>Vista previa servida desde Drive; puede requerir permisos. No es una entrada digital válida para ingresar.</small></div></div>');
  if(items.length){
    let index=0;const frame=root.querySelector('#konTicketCard'),img=root.querySelector('#konTicketImage'),link=root.querySelector('#konTicketOpen'),name=root.querySelector('#konTicketName'),position=root.querySelector('#konTicketPosition');
    img.addEventListener('error',()=>frame.classList.add('fallback'));
    img.addEventListener('load',()=>frame.classList.remove('fallback'));
    const paint=()=>{
      const item=items[index];frame.classList.remove('fallback');img.src=thumb(item.id);
      img.alt='Entrada original de '+item.name;link.href=external(item.id);
      name.textContent=item.name;
      frame.setAttribute('aria-label',items.length>1?'Ver otra versión de '+item.name:'Ver entrada original de '+item.name+' en Google Drive');
      const hint=frame.querySelector('.kon-ticket-corner');
      if(hint)hint.textContent=items.length>1?'OTRA ENTRADA ↻':'VER ENTRADA ↗';
      if(position)position.textContent=(index+1)+' / '+items.length+' VARIANTES';
    };
    const advance=()=>{
      index=(index+1)%items.length;
      paint();
      img.classList.remove('kon-card-enter');
      void img.offsetWidth;
      img.classList.add('kon-card-enter');
    };
    paint();
    const next=root.querySelector('#konTicketNext');
    if(next)next.addEventListener('click',advance);
    frame.parentElement.classList.toggle('has-variants',items.length>1);
    frame.addEventListener('click',()=>{
      if(items.length>1)advance();
      else window.open(external(items[0].id),'_blank','noopener,noreferrer');
    });
    frame.addEventListener('keydown',event=>{
      if(event.key==='Enter'||event.key===' '){event.preventDefault();frame.click();}
    });
    if(window.VanillaTilt&&window.matchMedia('(hover: hover) and (pointer: fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      frame.dataset.konTilt='enabled';
      window.VanillaTilt.init(frame,{max:7,perspective:1200,scale:1.015,speed:450,glare:true,'max-glare':0.08,gyroscope:false});
    }
    if(img.complete&&!img.naturalWidth)frame.classList.add('fallback');
  }
  return root;
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
  spot.insertAdjacentElement('beforebegin',section(id));
  const jump=document.createElement('button');
  jump.type='button';jump.textContent='ENTRADA ↓';
  jump.onclick=()=>byId('archiveIssueTicket')?.scrollIntoView({behavior:'smooth',block:'start'});
  const nav=el.querySelector('.archive-issue-jumps');
  if(nav)nav.prepend(jump);
  // Reindexamos los capítulos del archivo tras incorporar la entrada original.
  el.querySelectorAll('.archive-issue-chapter>header>span').forEach((span,i)=>span.textContent=span.textContent.replace(/^\[\d+\]/,'['+String(i+2).padStart(2,'0')+']'));
}
function enhance(){
  enhanceList();enhanceDetail();
}
document.addEventListener('DOMContentLoaded',enhance);
window.addEventListener('hashchange',enhance);
byId('archiveSearch')?.addEventListener('input',enhance);
enhance();
})();
