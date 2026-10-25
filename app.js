const API='https://www.googleapis.com/drive/v3/files',$=id=>document.getElementById(id),v=$('v');
let token='',files=[],cur=-1,tc,blobUrl;
const KEY=typeof API_KEY=='string'&&API_KEY&&API_KEY!='PASTE_API_KEY'?API_KEY:'',viewOnly=()=>!token&&!!KEY;
function mode(){$('vo').hidden=!viewOnly();$('ren').hidden=viewOnly()}
const msg=t=>$('msg').textContent=t||'';
$('folder').value=localStorage.lastFolder||'1BdQ3Xxk1Klryfedm-RL2QHxy0IFEiQfR';
const fid=s=>(s.match(/folders\/([\w-]+)/)||s.match(/id=([\w-]+)/)||[,s.trim()])[1];
const fmtSize=b=>b?(b/1048576).toFixed(1)+' MB':'?',dt=d=>new Date(d).toLocaleString();
function signIn(){return new Promise(res=>{tc=tc||google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:'https://www.googleapis.com/auth/drive',callback:r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';mode();res()}});tc.callback=r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';mode();res()};tc.requestAccessToken({prompt:token?'':'consent'})})}
async function api(url,opt={}){if(viewOnly()&&(!opt.method||opt.method=='GET')){const r=await fetch(url+(url.includes('?')?'&':'?')+'key='+KEY);if(!r.ok)throw Error((await r.text()).slice(0,200));return r}
 if(!token)await signIn();opt.headers={...opt.headers,Authorization:'Bearer '+token};
 let r=await fetch(url,opt);if(r.status==401){await signIn();opt.headers.Authorization='Bearer '+token;r=await fetch(url,opt)}
 if(!r.ok)throw Error((await r.text()).slice(0,200));return r}
async function load(){const id=fid($('folder').value);localStorage.lastFolder=id;msg('Loading…');files=[];let pt='';
 try{do{const q=new URLSearchParams({q:`'${id}' in parents and mimeType contains 'video/' and trashed=false`,pageSize:1000,orderBy:'name',
  fields:'nextPageToken,files(id,name,size,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata,webViewLink)',
  supportsAllDrives:true,includeItemsFromAllDrives:true,pageToken:pt});const j=await (await api(API+'?'+q)).json();files.push(...j.files);pt=j.nextPageToken}while(pt);
  sortFiles();render();msg(files.length+' videos')}catch(e){msg('Error: '+e.message)}}
$('sort').value=localStorage.sort||'name';
function sortFiles(){const [k,d]=$('sort').value.split('-'),m=d=='d'?-1:1;files.sort((a,b)=>k=='name'?a.name.localeCompare(b.name,undefined,{numeric:true}):k=='size'?m*((+a.size||0)-(+b.size||0)):m*(new Date(a[k])-new Date(b[k])))}
$('sort').onchange=()=>{localStorage.sort=$('sort').value;const id=files[cur]&&files[cur].id;sortFiles();cur=files.findIndex(x=>x.id==id);render()};
function render(){$('list').innerHTML='';files.forEach((f,i)=>{const li=document.createElement('li');li.className=i==cur?'on':'';
 li.innerHTML=`<img loading="lazy" src="${f.thumbnailLink||''}" referrerpolicy="no-referrer" alt=""><div><b></b><small>${fmtSize(+f.size)} · created ${dt(f.createdTime)}</small><small>modified ${dt(f.modifiedTime)}</small></div>`;
 li.querySelector('b').textContent=f.name;li.onclick=()=>play(i);$('list').append(li)})}
const media=f=>`${API}/${f.id}?alt=media&supportsAllDrives=true`;
async function play(i){if(i<0||i>=files.length)return;cur=i;render();$('pl').hidden=false;$('info').hidden=true;const f=files[i];
 if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}
 let done=false,tm;const fb=async why=>{if(done)return;done=true;clearTimeout(tm);v.onerror=v.onloadedmetadata=null;console.warn('Stream failed:',why);msg('Stream failed ('+why+'), downloading to memory…');try{blobUrl=URL.createObjectURL(await fetchBlob(f));v.src=blobUrl;v.play().catch(()=>{});msg(f.name)}catch(e){msg('Error: '+e.message)}};
 const ok=()=>{done=true;clearTimeout(tm);v.onerror=v.onloadedmetadata=null;msg(f.name)};
 const why=async src=>{const c=v.error?('media error '+v.error.code+(v.error.message?': '+v.error.message:'')):'error';if(!src.startsWith('./stream/'))return c;try{const r=await fetch(src,{headers:{Range:'bytes=0-1'}});return c+', HTTP '+r.status+' '+(r.ok?'':(await r.text()).slice(0,120))}catch(e){return c+', '+e.message}};
 let src;
 if(KEY&&!token)src=`${API}/${f.id}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(KEY)}`;
 else{if(!token)await signIn();await swReady();postTok();src='./stream/'+f.id+'?t='+encodeURIComponent(token)+'&s='+(+f.size||0);if(!navigator.serviceWorker||!navigator.serviceWorker.controller)console.warn('No SW controller; stream will likely fail')}
 v.onloadedmetadata=ok;v.onerror=async()=>fb(await why(src));tm=setTimeout(()=>fb('timeout 15s before metadata'),15000);
 v.src=src;v.play().catch(()=>{});msg('Loading '+f.name+'…')}
async function fetchBlob(f){const r=await api(media(f));if(!r.ok)throw Error('HTTP '+r.status);const tot=+r.headers.get('Content-Length')||+f.size||0;const rd=r.body.getReader(),ch=[];let n=0;
 for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);n+=value.length;msg('Downloading '+(tot?Math.round(n*100/tot)+'%':(n/1048576).toFixed(1)+' MB'))}
 return new Blob(ch,{type:f.mimeType||'video/mp4'})}
function postTok(){const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c&&token)c.postMessage({token})}
async function swReady(){if(!('serviceWorker' in navigator))return;await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller){if(!sessionStorage.swr){sessionStorage.swr=1;location.reload()}await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}))}}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js?v=3',{scope:'./',updateViaCache:'none'}).then(r=>{r.update();return r}).then(()=>swReady()).catch(e=>console.warn(e));navigator.serviceWorker.addEventListener('controllerchange',postTok)}
v.onended=()=>$('auto').checked&&play(cur+1);
$('ff').onsubmit=e=>{e.preventDefault();load()};$('signin').onclick=signIn;
$('play').onclick=()=>v.paused?v.play():v.pause();$('stop').onclick=()=>{v.pause();v.currentTime=0};
$('prev').onclick=()=>play(cur-1);$('next').onclick=()=>play(cur+1);
$('fs').onclick=()=>(v.requestFullscreen||v.webkitEnterFullscreen||v.webkitRequestFullscreen).call(v);
$('dl').onclick=async()=>{const f=files[cur];if(!f)return;msg('Downloading…');try{const a=document.createElement('a');a.href=URL.createObjectURL(await (await api(media(f))).blob());a.download=f.name;a.click();msg('')}catch(e){msg('Error: '+e.message)}};
$('ren').onclick=async()=>{const f=files[cur];if(!f||viewOnly())return;const n=prompt('New name',f.name);if(!n||n==f.name)return;
 try{await api(`${API}/${f.id}?supportsAllDrives=true`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});const id=f.id;await load();cur=files.findIndex(x=>x.id==id);render()}catch(e){msg('Error: '+e.message)}};
$('det').onclick=()=>{const f=files[cur];if(!f)return;const m=f.videoMediaMetadata||{};$('info').hidden=!$('info').hidden;
 $('info').textContent=`Name: ${f.name}\nType: ${f.mimeType}\nSize: ${fmtSize(+f.size)}\nCreated: ${dt(f.createdTime)}\nModified: ${dt(f.modifiedTime)}\nResolution: ${m.width||'?'}x${m.height||'?'}\nDuration: ${m.durationMillis?Math.round(m.durationMillis/1000)+'s':'?'}\nID: ${f.id}\n${f.webViewLink||''}`};
mode();
