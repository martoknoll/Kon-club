(()=>{
'use strict';
const config=window.KON_CONFIG,rail=document.getElementById('konArchiveTrack');
const counter=document.getElementById('konArchiveRange'),prev=document.getElementById('konArchivePrev'),next=document.getElementById('konArchiveNext');
if(!config?.archiveCatalog||!config.assets||!rail||!counter||!prev||!next)return;
const entries=config.archiveCatalog.filter(it=>Array.isArray(it)&&it.length>=3&&/^\d+$/.test(String(it[0])));
if(!entries.length)return;
const cards=[];
for(const [folder,title,assetKey] of entries){
 const asset=config.assets[assetKey],card=document.createElement('button');
 card.type='button';card.className='archive-card';card.dataset.archiveFolder=folder;
 const num=config.archiveEditionNumbers?.[folder],current=assetKey===config.activeEdition;
 card.setAttribute('aria-label','Abrir '+(Number.isInteger(num)?'edición '+num+' · ':'')+title);
 const cover=document.createElement('div');cover.className='image-box';
 const img=document.createElement('img');img.alt='Flyer original de '+title;img.loading='lazy';img.decoding='async';
 if(typeof asset==='string'&&/^public\/media\/[A-Za-z0-9_./-]+$/.test(asset))img.src=asset;
 cover.appendChild(img);
 const info=document.createElement('div');info.className='info';
 const tag=document.createElement('span');tag.className='caps';
 tag.textContent=Number.isInteger(num)?'EDICIÓN #'+num+(current?' · ACTUAL':''):'ARCHIVO KON CLUB';
 const h=document.createElement('h3');h.textContent=title;
 const arrow=document.createElement('span');arrow.className='arrow';arrow.textContent='↗';arrow.setAttribute('aria-hidden','true');
 info.append(tag,h,arrow);card.append(cover,info);
 card.addEventListener('click',()=>{location.hash='#archivo-completo/'+folder});
 cards.push(card);
}
rail.replaceChildren(...cards);
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
let active=0,pauseUntil=0,inView=false,pausedByFocus=false,pausedByHover=false,scrollFrame=0;
function metrics(){
 if(cards.length<2)return{step:rail.clientWidth,visible:1,max:0};
 const step=Math.max(1,cards[1].offsetLeft-cards[0].offsetLeft);
 const visible=Math.max(1,Math.min(cards.length,Math.floor((rail.clientWidth+1)/step)));
 return{step,visible,max:Math.max(0,cards.length-visible)};
}
function updateCounter(){
 const {visible}=metrics(),from=active+1,to=Math.min(cards.length,active+visible);
 counter.textContent=String(from).padStart(2,'0')+(to>from?'–'+String(to).padStart(2,'0'):'')+' / '+String(cards.length).padStart(2,'0')+' EDICIONES';
}
function nearest(){
 const left=rail.scrollLeft,base=cards[0].offsetLeft,{max}=metrics();
 let best=0,dist=Infinity;
 for(let i=0;i<=max;i++){
  const d=Math.abs(cards[i].offsetLeft-base-left);
  if(d<dist){dist=d;best=i;}
 }
 return best;
}
function go(index,auto){
 active=Math.max(0,Math.min(metrics().max,index));
 rail.scrollTo({left:cards[active].offsetLeft-cards[0].offsetLeft,behavior:auto&&!reduced.matches?'smooth':'auto'});
 updateCounter();
}
function manual(){pauseUntil=Date.now()+9000;}
prev.addEventListener('click',()=>{manual();go(active<=0?metrics().max:active-1,false)});
next.addEventListener('click',()=>{manual();go(active>=metrics().max?0:active+1,false)});
rail.addEventListener('scroll',()=>{
 if(scrollFrame)cancelAnimationFrame(scrollFrame);
 scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;active=nearest();updateCounter()});
},{passive:true});
rail.addEventListener('pointerdown',manual,{passive:true});
rail.addEventListener('wheel',manual,{passive:true});
rail.addEventListener('focusin',()=>{pausedByFocus=true});
rail.addEventListener('focusout',()=>{pausedByFocus=false;manual()});
rail.addEventListener('mouseenter',()=>{pausedByHover=true});
rail.addEventListener('mouseleave',()=>{pausedByHover=false});
if(window.IntersectionObserver)new IntersectionObserver(entries=>{
 inView=entries.some(entry=>entry.isIntersecting);
},{threshold:.35}).observe(rail);
else inView=true;
window.addEventListener('resize',()=>{go(Math.min(active,metrics().max),false)},{passive:true});
updateCounter();
setInterval(()=>{
 if(!inView||pausedByFocus||pausedByHover||reduced.matches||document.visibilityState==='hidden'||Date.now()<pauseUntil)return;
 go(active>=metrics().max?0:active+1,true);
},4800);
})();
