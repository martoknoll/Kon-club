(()=>{"use strict";
const config=window.KON_CONFIG,viewport=document.getElementById("photoViewport"),rail=document.getElementById("photoRail"),viewer=document.getElementById("photoViewer");
if(!config||!viewport||!rail||!viewer)return;
const allowedFolders=new Set((config.archiveCatalog||[]).map(item=>Number(item[0])));
const eligible=(config.photoAlbum||[]).filter(item=>
 item&&Number(item.edition)>=17&&allowedFolders.has(Number(item.edition))&&
 typeof item.event==="string"&&typeof item.description==="string"&&
 typeof item.src==="string"&&/^public\/media\/(?:fotos\/)?[A-Za-z0-9_.-]+\.(?:webp|jpg|jpeg|png)$/i.test(item.src)
);
if(!eligible.length){document.getElementById("fotos").hidden=true;return}
const prev=document.getElementById("photoPrev"),next=document.getElementById("photoNext"),pause=document.getElementById("photoPause");
const counter=document.getElementById("photoCounter"),currentLabel=document.getElementById("photoCurrentLabel");
const modalImage=document.getElementById("photoViewerImage"),modalLabel=document.getElementById("photoViewerLabel"),modalCount=document.getElementById("photoViewerCount");
const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
let index=0,lightboxIndex=0,manualPause=false,hovered=false,hasFocus=false,visible=false,scrollFrame=0;
const cards=eligible.map((item,i)=>{
 const b=document.createElement("button");
 b.type="button";b.className="photo-carousel-card";b.setAttribute("aria-label","Ampliar foto "+(i+1)+" de "+eligible.length+" · "+item.event);b.setAttribute("aria-haspopup","dialog");
 const img=document.createElement("img");img.src=item.src;img.loading="lazy";img.decoding="async";img.alt=item.description+" · Kon Club, edición "+item.edition;img.width=640;img.height=480;
 const caption=document.createElement("span");caption.className="photo-card-title";
 const title=document.createElement("span");title.textContent=item.event;
 const magnify=document.createElement("b");magnify.setAttribute("aria-hidden","true");magnify.textContent="+";
 caption.append(title,magnify);b.append(img,caption);
 b.addEventListener("click",()=>openViewer(i));rail.append(b);return b;
});
const pad=n=>String(n).padStart(2,"0");
function step(){
 if(cards.length<2)return 1;
 const first=cards[0].getBoundingClientRect(),second=cards[1].getBoundingClientRect();
 return Math.max(1,second.left-first.left);
}
function maxFirst(){return Math.max(0,Math.ceil((viewport.scrollWidth-viewport.clientWidth-1)/step()));}
function selected(){
 const current=eligible[index];if(!current)return;
 counter.textContent=pad(index+1)+" / "+pad(eligible.length);
 currentLabel.textContent="KON CLUB / EDICIÓN "+current.edition+" · "+current.event;
}
function setIndex(n,behavior="smooth"){
 const max=Math.min(eligible.length-1,maxFirst());
 index=n<0?max:n>max?0:n;
 const pos=cards[index].offsetLeft-rail.offsetLeft;
 viewport.scrollTo({left:pos,behavior:reduced.matches?"auto":behavior});
 selected();
}
function positionFromScroll(){
 const value=Math.round(viewport.scrollLeft/step());
 index=Math.min(Math.max(0,value),eligible.length-1);
 selected();
}
viewport.addEventListener("scroll",()=>{
 if(scrollFrame)cancelAnimationFrame(scrollFrame);
 scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;positionFromScroll()});
},{passive:true});
function paused(){return manualPause||reduced.matches||document.hidden||!visible||hovered||hasFocus||viewer.open}
prev.addEventListener("click",()=>setIndex(index-1));
next.addEventListener("click",()=>setIndex(index+1));
pause.addEventListener("click",()=>{
 manualPause=!manualPause;
 pause.setAttribute("aria-pressed",String(manualPause));
 pause.textContent=manualPause?"▶ REANUDAR":"Ⅱ PAUSAR";
 pause.setAttribute("aria-label",manualPause?"Reanudar rotación automática":"Pausar rotación automática");
});
viewport.addEventListener("pointerenter",()=>hovered=true);
viewport.addEventListener("pointerleave",()=>hovered=false);
viewport.addEventListener("focusin",()=>hasFocus=true);
viewport.addEventListener("focusout",e=>{if(!viewport.contains(e.relatedTarget))hasFocus=false});
viewport.addEventListener("keydown",e=>{
 if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();setIndex(index+(e.key==="ArrowRight"?1:-1))}
});
const observer=new IntersectionObserver(entries=>{visible=entries.some(x=>x.isIntersecting)},{threshold:.15});
observer.observe(viewport);
window.setInterval(()=>{if(!paused())setIndex(index+1)},5300);
window.addEventListener("resize",()=>{const max=maxFirst();if(index>max)setIndex(max,"auto")});
function updateViewer(){
 const item=eligible[lightboxIndex];
 modalImage.src=item.src;
 modalImage.alt=item.description+" · Kon Club "+item.edition;
 modalLabel.textContent="EL ÁLBUM / EDICIÓN "+item.edition+" · "+item.event;
 modalCount.textContent=pad(lightboxIndex+1)+" / "+pad(eligible.length);
}
function openViewer(i){lightboxIndex=i;updateViewer();viewer.showModal()}
function viewerAdvance(offset){lightboxIndex=(lightboxIndex+offset+eligible.length)%eligible.length;updateViewer()}
document.getElementById("photoViewerClose").addEventListener("click",()=>viewer.close());
document.getElementById("photoViewerPrev").addEventListener("click",()=>viewerAdvance(-1));
document.getElementById("photoViewerNext").addEventListener("click",()=>viewerAdvance(1));
viewer.addEventListener("click",e=>{if(e.target===viewer)viewer.close()});
viewer.addEventListener("keydown",e=>{
 if(e.key==="ArrowRight"||e.key==="ArrowLeft"){e.preventDefault();viewerAdvance(e.key==="ArrowRight"?1:-1)}
});
viewer.addEventListener("close",()=>viewport.focus({preventScroll:true}));
selected();
})();