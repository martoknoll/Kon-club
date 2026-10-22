(()=>{
'use strict';
const albums=window.KON_MUSIC_RECOMMENDATIONS, issues=window.KON_CONFIG?.readerIssues;
const rail=document.getElementById('recordRail'),index=document.getElementById('musicIndex');
const prev=document.getElementById('recordPrev'),next=document.getElementById('recordNext');
if(!Array.isArray(albums)||!issues||!rail||!index||!prev||!next)return;
const collection=albums.filter(a=>issues[a.issue]&&(a.cover||issues[a.issue].pages?.[3])).map(a=>({...a,source:issues[a.issue],cover:a.cover||issues[a.issue].pages[3]}));
if(!collection.length)return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const coverEl=(album,name)=>{const el=document.createElement('span');el.className=name;el.style.backgroundImage='url("'+album.cover+'")';el.setAttribute('role','img');el.setAttribute('aria-label','Portada del álbum '+album.title+' de '+album.artist);return el};
let current=0,lastPaint=-1,framePending=false;
const cards=[],rows=[];
function select(index,animate){
 current=Math.max(0,Math.min(collection.length-1,index));
 const card=cards[current];
 const center=card.offsetLeft-(rail.clientWidth-card.clientWidth)/2;
 rail.scrollTo({left:Math.max(0,center),behavior:animate&&!reduced.matches?'smooth':'auto'});
 paint(true);
}
function paint(force){
 if(!force&&lastPaint===current)return;
 lastPaint=current;
 const album=collection[current];
 for(let i=0;i<cards.length;i++){
  cards[i].classList.toggle('is-active',i===current);
  cards[i].setAttribute('aria-current',i===current?'true':'false');
  rows[i].classList.toggle('is-active',i===current);
  rows[i].setAttribute('aria-current',i===current?'true':'false');
 }
 document.getElementById('recordNumber').textContent=String(current+1).padStart(2,'0')+' / '+String(collection.length).padStart(2,'0');
 document.getElementById('recordTag').textContent='FANZINE Nº '+String(album.n).padStart(2,'0')+' / '+album.source.name;
 document.getElementById('recordYear').textContent=album.year+' · '+album.duration;
 document.getElementById('recordArtist').textContent=album.artist;
 document.getElementById('recordTitle').textContent=album.title;
 document.title=album.title+' — '+album.artist+' · La disquería del Kon';
 document.getElementById('recordGenre').textContent=album.genre;
 document.getElementById('recordDuration').textContent=album.duration;
 document.getElementById('recordRecommender').textContent='POR '+album.by.toUpperCase();
 document.getElementById('recordHeadline').textContent=album.headline;
 document.getElementById('recordBlurb').textContent=album.blurb;
 document.getElementById('recordListen').href='https://open.spotify.com/search/'+encodeURIComponent(album.artist+' '+album.title);
 document.getElementById('recordEdition').href='index.html#archivo-completo/'+album.source.folder;
 const root=document.documentElement;
 root.style.setProperty('--music-bg',album.source.bg);
 root.style.setProperty('--music-fg',album.source.on);
 root.style.setProperty('--music-accent',album.source.on);
 document.getElementById('konMusicTheme')?.setAttribute('content',album.source.bg);
 document.dispatchEvent(new CustomEvent('kon:albumchange',{detail:{artist:album.artist,title:album.title,issue:album.n}}));
}
collection.forEach((album,i)=>{
 const button=document.createElement('button');
 button.type='button';button.className='record-card';
 button.setAttribute('aria-label','Seleccionar '+album.title+' de '+album.artist);
 // La portada original es protagonista: sin vinilo decorativo.
 const cover=coverEl(album,'record-cover');
 const label=document.createElement('span');label.className='record-label';
 const subtitle=document.createElement('small');subtitle.textContent=album.artist;
 const title=document.createElement('span');title.textContent=album.title;
 label.append(subtitle,title);button.append(cover,label);
 button.addEventListener('click',()=>select(i,true));
 rail.append(button);cards.push(button);
 const row=document.createElement('button');
 row.type='button';row.className='music-index-item';
 const num=document.createElement('span');num.className='mini-no';num.textContent=String(album.n).padStart(2,'0');
 const mini=coverEl(album,'mini-cover');mini.setAttribute('aria-hidden','true');
 const name=document.createElement('strong');name.textContent=album.title;
 const artist=document.createElement('span');artist.className='mini-artist';artist.textContent=album.artist;
 const arrow=document.createElement('span');arrow.className='mini-arrow';arrow.textContent='↗';
 row.append(num,mini,name,artist,arrow);
 row.setAttribute('aria-label','Seleccionar '+album.title+' de '+album.artist);
 row.addEventListener('click',()=>{
  select(i,true);
  rail.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'center'});
 });
 index.append(row);rows.push(row);
});
function nearest(){
 const mid=rail.scrollLeft+rail.clientWidth/2;
 let n=0,d=Infinity;
 for(let i=0;i<cards.length;i++){
  const distance=Math.abs(cards[i].offsetLeft+cards[i].offsetWidth/2-mid);
  if(distance<d){d=distance;n=i}
 }
 return n;
}
rail.addEventListener('scroll',()=>{
 if(framePending)return;framePending=true;
 requestAnimationFrame(()=>{framePending=false;const idx=nearest();if(current!==idx){current=idx;paint(false)}});
},{passive:true});
prev.addEventListener('click',()=>select((current-1+cards.length)%cards.length,true));
next.addEventListener('click',()=>select((current+1)%cards.length,true));
rail.addEventListener('keydown',event=>{
 if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
  event.preventDefault();select((current+(event.key==='ArrowRight'?1:-1)+cards.length)%cards.length,true);
 }
});
const urlParams=new URLSearchParams(location.search);
const initial=Number(urlParams.get('n'));
if(Number.isInteger(initial)&&initial>0){
 const found=collection.findIndex(a=>a.n===initial);if(found>=0)current=found;
}
requestAnimationFrame(()=>select(current,false));
})();
