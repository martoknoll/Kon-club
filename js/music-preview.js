(()=>{
'use strict';
// Reproducimos solamente previews promocionales suministrados en tiempo real por iTunes.
// No alojamos, descargamos ni almacenamos archivos de audio de terceros.
const root=document.getElementById('konPreviewPlayer');
if(!root)return;
const by=id=>document.getElementById(id);
const play=by('konPreviewToggle'),song=by('konPreviewSong'),status=by('konPreviewStatus');
const credit=by('konPreviewCredit'),apple=by('konPreviewApple');
const next=by('konPreviewAnother'),time=by('konPreviewTime');
const fill=by('konPreviewFill'),progress=by('konPreviewProgress');
const audio=document.createElement('audio');
audio.preload='none';
audio.setAttribute('aria-hidden','true');
root.appendChild(audio);
const remembered=new Map();
const pending=new Map();
let selected=null,tracks=[],trackIndex=0,requestNumber=0,searchTimer=null;
const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,' ').trim();
const keyFor=a=>normalize(a.artist)+'::'+normalize(a.title);
const sameArtist=(a,b)=>{
  const x=normalize(a),y=normalize(b);
  return x===y||x==='the '+y||y==='the '+x;
};
const sameAlbum=(a,b)=>{
  const x=normalize(a),y=normalize(b);
  if(x===y)return true;
  if(!x.startsWith(y+' '))return false;
  return /^(?:remaster(?:ed)?|deluxe|expanded|special|anniversary|bonus|the complete|edition|reissue|original)/.test(x.slice(y.length).trim());
};
const safeAudio=url=>{
  try{
    const u=new URL(url);
    return u.protocol==='https:'&&(u.hostname==='audio-ssl.itunes.apple.com'||u.hostname.endsWith('.itunes.apple.com'))?u.href:'';
  }catch{return '';}
};
const safeApple=url=>{
  try{
    const u=new URL(url);
    return u.protocol==='https:'&&(u.hostname==='music.apple.com'||u.hostname==='itunes.apple.com')?u.href:'';
  }catch{return '';}
};
function jsonp(endpoint,params){
  // La API de Apple admite callback JSONP para consultas desde páginas estáticas.
  return new Promise((resolve,reject)=>{
    const callback='kon_itunes_'+Date.now()+'_'+Math.floor(Math.random()*1000000);
    const script=document.createElement('script');
    const q=new URLSearchParams({...params,callback});
    let finished=false,timer;
    function cleanup(){
      if(finished)return false;
      finished=true;
      clearTimeout(timer);
      script.remove();
      try{delete window[callback];}catch{window[callback]=undefined;}
      return true;
    }
    window[callback]=result=>{if(cleanup())resolve(result||{});};
    script.onerror=()=>{if(cleanup())reject(new Error('iTunes no responde'));};
    timer=setTimeout(()=>{if(cleanup())reject(new Error('Tiempo de espera agotado'));},8500);
    script.async=true;
    script.src='https://itunes.apple.com/'+endpoint+'?'+q.toString();
    document.head.appendChild(script);
  });
}
function toTrack(row,albumLink){
  const sample=safeAudio(row.previewUrl);
  if(!sample)return null;
  return {song:row.trackName||'Canción del álbum',sample,link:safeApple(row.trackViewUrl)||albumLink||'' ,
    number:Number.isFinite(Number(row.trackNumber))?Number(row.trackNumber):999};
}
function chooseSongs(records,albumLink,collectionId){
  const unique=new Set();
  return records.filter(row=>row&&row.kind==='song'&&(!collectionId||String(row.collectionId)===String(collectionId)))
    .map(row=>toTrack(row,albumLink))
    .filter(Boolean)
    .sort((a,b)=>a.number-b.number)
    .filter(row=>{
      if(unique.has(row.song.toLowerCase()))return false;
      unique.add(row.song.toLowerCase());return true;
    });
}
async function fetchOneCountry(album,country){
  const albums=await jsonp('search',{
    country,media:'music',entity:'album',limit:'100',
    term:album.artist+' '+album.title
  });
  const options=(Array.isArray(albums.results)?albums.results:[])
    .filter(item=>item?.collectionId&&sameArtist(item.artistName,album.artist)&&sameAlbum(item.collectionName,album.title))
    .sort((a,b)=>{
      const exactA=normalize(a.collectionName)===normalize(album.title)?1:0;
      const exactB=normalize(b.collectionName)===normalize(album.title)?1:0;
      return exactB-exactA;
    });
  // Verificar primero la colección exacta, no elegir por popularidad un tema de otro disco.
  for(const item of options.slice(0,2)){
    const info=await jsonp('lookup',{id:String(item.collectionId),entity:'song',country,limit:'200'});
    const albumLink=safeApple(item.collectionViewUrl);
    const found=chooseSongs(Array.isArray(info.results)?info.results:[],albumLink,item.collectionId);
    if(found.length)return found;
  }
  // Algunas versiones de iTunes indexan canciones aunque no devuelvan el álbum como colección.
  const singles=await jsonp('search',{
    country,media:'music',entity:'song',limit:'100',
    term:album.artist+' '+album.title
  });
  const matched=(Array.isArray(singles.results)?singles.results:[])
    .filter(item=>sameArtist(item?.artistName,album.artist)&&sameAlbum(item?.collectionName,album.title));
  return chooseSongs(matched,'',null);
}
async function findTracks(album){
  const key=keyFor(album);
  if(remembered.has(key))return remembered.get(key);
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
    let sawError=false;
    for(const country of ['AR','US']){
      try{
        const found=await fetchOneCountry(album,country);
        if(found.length){
          remembered.set(key,found);
          return {songs:found,error:false};
        }
      }catch(err){sawError=true;}
    }
    if(!sawError)remembered.set(key,[]);
    return {songs:[],error:sawError};
  })();
  pending.set(key,task);
  try{return await task;}finally{pending.delete(key);}
}
const stamp=seconds=>{
  const t=Math.max(0,Math.floor(Number(seconds)||0));
  return Math.floor(t/60)+':'+String(t%60).padStart(2,'0');
};
function displayProgress(sec=0){
  const n=Math.max(0,Math.min(30,Number(sec)||0));
  fill.style.width=String(n/30*100)+'%';
  progress.setAttribute('aria-valuenow',String(Math.round(n)));
  time.textContent=stamp(n)+' / 0:30';
}
function stop(){
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  root.classList.remove('is-playing');
  play.textContent='▶';
  play.setAttribute('aria-label','Reproducir fragmento de 30 segundos');
  displayProgress(0);
}
function paintTrack(){
  stop();
  const t=tracks[trackIndex];
  if(!t)return;
  song.textContent=t.song;
  status.textContent='FRAGMENTO OFICIAL DISPONIBLE · TOCÁ PLAY';
  play.disabled=false;
  next.hidden=tracks.length<2;
  credit.hidden=!t.link;
  if(t.link)apple.href=t.link;
}
function changeAlbum(album){
  if(!album||!album.artist||!album.title)return;
  const key=keyFor(album);
  if(selected&&keyFor(selected)===key)return;
  selected={artist:album.artist,title:album.title,issue:album.issue};
  const thisRequest=++requestNumber;
  clearTimeout(searchTimer);
  tracks=[];trackIndex=0;
  stop();
  play.disabled=true;
  credit.hidden=true;next.hidden=true;
  song.textContent=album.artist+' — '+album.title;
  status.textContent='BUSCANDO FRAGMENTO DEL ÁLBUM…';
  searchTimer=setTimeout(async()=>{
    let result;
    try{result=await findTracks(album);}
    catch{result={songs:[],error:true};}
    if(thisRequest!==requestNumber)return;
    tracks=result.songs||[];
    if(tracks.length){
      const nonIntro=tracks.findIndex(t=>!/\b(intro|interlude|outro)\b/i.test(t.song));
      trackIndex=Math.max(nonIntro,0);
      paintTrack();
    }else{
      song.textContent=album.artist+' — '+album.title;
      status.textContent=result.error?'NO SE PUDO CONSULTAR EL CATÁLOGO · PROBÁ MÁS TARDE':'NO HAY UN FRAGMENTO OFICIAL DISPONIBLE PARA ESTE DISCO';
      play.disabled=true;
    }
  },300);
}
play.addEventListener('click',()=>{
  const track=tracks[trackIndex];
  if(!track)return;
  if(!audio.paused){
    audio.pause();
    return;
  }
  if(!audio.getAttribute('src')||audio.getAttribute('src')!==track.sample){
    audio.src=track.sample;
  }
  if(audio.ended||audio.currentTime>=29.9)audio.currentTime=0;
  const result=audio.play();
  if(result?.catch)result.catch(()=>{
    root.classList.remove('is-playing');
    play.textContent='▶';
    status.textContent='NO SE PUDO REPRODUCIR EL FRAGMENTO EN ESTE DISPOSITIVO';
  });
});
next.addEventListener('click',()=>{
  if(tracks.length<2)return;
  trackIndex=(trackIndex+1)%tracks.length;
  paintTrack();
});
audio.addEventListener('play',()=>{
  root.classList.add('is-playing');
  play.textContent='Ⅱ';
  play.setAttribute('aria-label','Pausar fragmento');
  status.textContent='REPRODUCIENDO UNA MUESTRA DEL DISCO';
});
audio.addEventListener('pause',()=>{
  root.classList.remove('is-playing');
  play.textContent='▶';
  play.setAttribute('aria-label','Reproducir fragmento de 30 segundos');
});
audio.addEventListener('timeupdate',()=>{
  displayProgress(audio.currentTime);
  if(audio.currentTime>=30){audio.pause();audio.currentTime=0;status.textContent='FIN DEL FRAGMENTO · TOCÁ PLAY PARA REPETIR';}
});
audio.addEventListener('ended',()=>{
  root.classList.remove('is-playing');
  status.textContent='FIN DEL FRAGMENTO · TOCÁ PLAY PARA REPETIR';
  play.textContent='▶';
});
audio.addEventListener('error',()=>{
  if(!audio.getAttribute('src'))return;
  root.classList.remove('is-playing');
  status.textContent='FRAGMENTO NO DISPONIBLE AHORA · PODÉS PROBAR OTRO TEMA';
  play.textContent='▶';
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!audio.paused)audio.pause();});
window.addEventListener('pagehide',()=>audio.pause());
document.addEventListener('kon:albumchange',event=>changeAlbum(event.detail));
// Seguridad ante cambios de orden de carga: la primera selección también puede leerse del catálogo.
})();
