const API='https://www.googleapis.com/drive/v3/files',$=id=>document.getElementById(id),v=$('v');
let token='',files=[],cur=-1,tc,blobUrl;
const KEY=typeof API_KEY=='string'&&API_KEY&&API_KEY!='PASTE_API_KEY'?API_KEY:'',viewOnly=()=>!token&&!!KEY;
function mode(){$('vo').hidden=!viewOnly();$('ren').hidden=viewOnly()}
const LT=['SUMMONING VIDEOS...','OPENING THE ANCIENT ARCHIVE...','AWAKENING THE DRAGON...'];const msg=t=>{t=t||'';$('msg').textContent=t;const b=/^(Loading|Downloading|Stream failed)/.test(t);if(b&&$('load').hidden)$('ltx').textContent=LT[Math.random()*3|0];$('load').hidden=!b};
$('folder').value=new URLSearchParams(location.search).get('folder')||'';
const parse=s=>{s=(s||'').trim();let m;if(m=s.match(/\/folders\/([\w-]+)/))return{t:'folder',id:m[1]};if(m=s.match(/\/file\/(?:u\/\d+\/)?d\/([\w-]+)/)||s.match(/\/(?:open|uc)\?(?:.*&)?id=([\w-]+)/))return{t:'file',id:m[1]};if(m=s.match(/[?&]id=([\w-]+)/))return{t:'any',id:m[1]};return{t:'any',id:s}},fid=s=>parse(s).id;
const FF='id,name,size,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata,webViewLink';
const fmtSize=b=>b?(b/1048576).toFixed(1)+' MB':'?',dt=d=>new Date(d).toLocaleString();
function signIn(){return new Promise(res=>{tc=tc||google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:'https://www.googleapis.com/auth/drive',callback:r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';mode();res()}});tc.callback=r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';mode();res()};tc.requestAccessToken({prompt:token?'':'consent'})})}
async function api(url,opt={}){if(viewOnly()&&(!opt.method||opt.method=='GET')){const r=await fetch(url+(url.includes('?')?'&':'?')+'key='+KEY);if(!r.ok)throw Error((await r.text()).slice(0,200));return r}
 if(!token)await signIn();opt.headers={...opt.headers,Authorization:'Bearer '+token};
 let r=await fetch(url,opt);if(r.status==401){await signIn();opt.headers.Authorization='Bearer '+token;r=await fetch(url,opt)}
 if(!r.ok)throw Error((await r.text()).slice(0,200));return r}
async function load(){const p=parse($('folder').value),id=p.id;if(!id)return msg('Paste a Google Drive folder or video link');msg('Loading…');
 if(p.t!='folder'){try{const r=await api(`${API}/${id}?supportsAllDrives=true&fields=${FF}`);const f=await r.json();if(f.error)throw Error(f.error.message);if(f.mimeType!='application/vnd.google-apps.folder'){files=[f];cur=0;render();await play(0);$('info').hidden=true;$('det').click();return}}catch(e){if(p.t=='file')return msg('Error: '+e.message)}}
 files=[];let pt='';
 try{do{const q=new URLSearchParams({q:`'${id}' in parents and mimeType contains 'video/' and trashed=false`,pageSize:1000,orderBy:'name',
  fields:'nextPageToken,files(id,name,size,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata,webViewLink)',
  supportsAllDrives:true,includeItemsFromAllDrives:true,pageToken:pt});const j=await (await api(API+'?'+q)).json();files.push(...j.files);pt=j.nextPageToken}while(pt);
  sortFiles();render();msg(files.length+' videos')}catch(e){msg('Error: '+e.message)}}
$('sort').value=localStorage.sort||'name';
function sortFiles(){const [k,d]=$('sort').value.split('-'),m=d=='d'?-1:1;files.sort((a,b)=>k=='name'?a.name.localeCompare(b.name,undefined,{numeric:true}):k=='size'?m*((+a.size||0)-(+b.size||0)):m*(new Date(a[k])-new Date(b[k])))}
$('sort').onchange=()=>{localStorage.sort=$('sort').value;const id=files[cur]&&files[cur].id;sortFiles();cur=files.findIndex(x=>x.id==id);render()};
function render(){const g=localStorage.view!='list',L=$('list');L.className=g?'grid':'';$('view').textContent=g?'☰ List':'▦ Grid';L.innerHTML='';files.forEach((f,i)=>{const li=document.createElement('li');li.className=i==cur?'on'+(i===lit?' ign':''):'';
 const t=(f.thumbnailLink||'').replace(/=s\d+$/,g?'=s640':'=s220');
 li.innerHTML=g?`<img loading="lazy" data-src="${t}" data-id="${f.id}" referrerpolicy="no-referrer" alt=""><b></b><small>${fmtSize(+f.size)} · ${dt(f.createdTime)}</small><button class="more">⋯</button><span class="menu" hidden><button data-a="dl">Download</button>${viewOnly()?'':'<button data-a="ren">Rename</button>'}<button data-a="det">Details</button></span>`:`<img loading="lazy" data-src="${t}" data-id="${f.id}" referrerpolicy="no-referrer" alt=""><div><b></b><small>${fmtSize(+f.size)} · created ${dt(f.createdTime)}</small><small>modified ${dt(f.modifiedTime)}</small></div>`;
 li.querySelector('b').textContent=f.name;li.onclick=e=>{const b=e.target.closest('button');if(!b)return play(i);e.stopPropagation();if(b.classList.contains('more')){li.querySelector('.menu').hidden^=1;return}cur=i;$('pl').hidden=false;$(b.dataset.a).click();render()};L.append(li);li.querySelectorAll('img[data-id]').forEach(thumb)})}
const PH='assets/no-preview.svg';
function thumbNext(im){const s=+(im.dataset.st||0);im.dataset.st=s+1;const id=im.dataset.id,w=localStorage.view!='list'?'w640':'w320';
 if(s==0&&im.dataset.src){im.src=im.dataset.src;return}
 if(s<=1){im.dataset.st=2;im.src='https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz='+w;return}
 im.onerror=null;im.src=PH;im.classList.add('noprev')}
const tio='IntersectionObserver' in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){tio.unobserve(e.target);thumbNext(e.target)}}),{rootMargin:'400px'}):null;
function thumb(im){im.onerror=()=>thumbNext(im);im.onload=()=>{if(im.naturalWidth<8&&!im.classList.contains('noprev'))thumbNext(im)};if(tio)tio.observe(im);else thumbNext(im)}
$('view').onclick=()=>{localStorage.view=localStorage.view!='list'?'list':'grid';render()};
const media=f=>`${API}/${f.id}?alt=media&supportsAllDrives=true`;
let lit=-1;async function play(i){if(i<0||i>=files.length)return;cur=i;lit=i;setTimeout(()=>{lit=-1},900);render();$('pl').hidden=false;$('info').hidden=true;const f=files[i];
 if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}
 let done=false,tm;const fb=async why=>{if(done)return;done=true;clearTimeout(tm);v.onerror=v.onloadedmetadata=null;console.warn('Stream failed:',why);msg('Stream failed ('+why+'), downloading to memory…');try{blobUrl=URL.createObjectURL(await fetchBlob(f));v.src=blobUrl;v.play().catch(()=>{});msg(f.name)}catch(e){msg('Error: '+e.message)}};
 const ok=()=>{done=true;clearTimeout(tm);v.onerror=v.onloadedmetadata=null;msg(f.name)};
 const why=async src=>{const c=v.error?('media error '+v.error.code+(v.error.message?': '+v.error.message:'')):'error';if(!src.startsWith('./stream/'))return c;try{const r=await fetch(src,{headers:{Range:'bytes=0-1'}});return c+', HTTP '+r.status+' '+(r.ok?'':(await r.text()).slice(0,120))}catch(e){return c+', '+e.message}};
 let src;
 const vo=KEY&&!token;if(vo){src=`${API}/${f.id}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(KEY)}`}
 else{if(!token)await signIn();await swReady();postTok();src='./stream/'+f.id+'?t='+encodeURIComponent(token)+'&s='+(+f.size||0);if(!navigator.serviceWorker||!navigator.serviceWorker.controller)console.warn('No SW controller; stream will likely fail')}
 let tried=0;const voFail=async w=>{if(done)return;clearTimeout(tm);
  if(!tried&&navigator.serviceWorker&&navigator.serviceWorker.controller){tried=1;console.warn('Direct view-only stream failed:',w);src='./stream/'+f.id+'?k='+encodeURIComponent(KEY)+'&s='+(+f.size||0);tm=setTimeout(()=>voFail('timeout 15s via proxy'),15000);v.src=src;v.play().catch(()=>{});msg('Retrying '+f.name+' via proxy…');return}
  done=true;v.onerror=v.onloadedmetadata=null;let d=w;try{const r=await fetch(`${API}/${f.id}?alt=media&supportsAllDrives=true&key=${encodeURIComponent(KEY)}`,{headers:{Range:'bytes=0-1'}});d+=', HTTP '+r.status;if(!r.ok){const t=await r.text();d+=': '+((t.match(/"message":\s*"([^"]+)/)||[])[1]||t.slice(0,140))}}catch(e){d+=', '+e.message}
  if(v.error&&v.error.code==4&&!/HTTP [45]/.test(d))d+=' (this browser may not support the video format)';msg('Cannot play in view-only mode: '+d)};
 v.onloadedmetadata=ok;v.onerror=async()=>vo?voFail(await why(src)):fb(await why(src));tm=setTimeout(()=>vo?voFail('timeout 15s before metadata'):fb('timeout 15s before metadata'),15000);
 v.src=src;v.play().catch(()=>{});msg('Loading '+f.name+'…')}
async function fetchBlob(f){const r=await api(media(f));if(!r.ok)throw Error('HTTP '+r.status);const tot=+r.headers.get('Content-Length')||+f.size||0;const rd=r.body.getReader(),ch=[];let n=0;
 for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);n+=value.length;msg('Downloading '+(tot?Math.round(n*100/tot)+'%':(n/1048576).toFixed(1)+' MB'))}
 return new Blob(ch,{type:f.mimeType||'video/mp4'})}
function postTok(){const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c&&token)c.postMessage({token})}
async function swReady(){if(!('serviceWorker' in navigator))return;await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller){if(!sessionStorage.swr){sessionStorage.swr=1;location.reload()}await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}))}}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js?v=4',{scope:'./',updateViaCache:'none'}).then(r=>{r.update();return r}).then(()=>swReady()).catch(e=>console.warn(e));navigator.serviceWorker.addEventListener('controllerchange',postTok)}
v.onended=()=>$('auto').checked&&play(cur+1);
$('ff').onsubmit=e=>{e.preventDefault();load()};$('folder').addEventListener('paste',()=>setTimeout(load,0));
const help=$('help'),hd=$('hdlg');help.onclick=()=>hd.showModal();$('hOk').onclick=()=>{hd.close();localStorage.seenHelp=1};hd.onclose=()=>localStorage.seenHelp=1;if(!localStorage.seenHelp&&hd.showModal)hd.showModal();
if($('folder').value)load();$('signin').onclick=()=>{if(token)return;const d=$('appr');d.showModal?d.showModal():(confirm('Approval needed from the folder owner for editing. Continue to Google sign-in?')&&signIn())};
$('apC').onclick=()=>$('appr').close();$('apOk').onclick=()=>{$('appr').close();signIn()};
const ft=s=>{s=Math.floor(s||0);const h=Math.floor(s/3600),m=Math.floor(s/60)%60,x=String(s%60).padStart(2,'0');return h?h+':'+String(m).padStart(2,'0')+':'+x:m+':'+x};
let seeking=false;const P=$('prog');const upd=()=>{const d=v.duration||0;$('tc').textContent=ft(v.currentTime);$('td').textContent=ft(d);if(!seeking)P.value=d?v.currentTime/d*1000:0;P.style.setProperty('--p',P.value/10+'%')};
v.ontimeupdate=v.ondurationchange=upd;P.oninput=()=>{seeking=true;P.style.setProperty('--p',P.value/10+'%');$('tc').textContent=ft(P.value/1000*(v.duration||0))};P.onchange=()=>{if(v.duration)v.currentTime=P.value/1000*v.duration;seeking=false};
v.onplay=v.onpause=()=>document.body.classList.toggle('playing',!v.paused);v.onclick=()=>v.paused?v.play():v.pause();
{const pb=$('play'),sync=()=>{const p=!v.paused;pb.classList.toggle('playing',p);pb.setAttribute('aria-label',p?'Pause':'Play')};['play','playing','pause','ended','emptied'].forEach(e=>v.addEventListener(e,sync));const fb=$('fs');document.addEventListener('fullscreenchange',()=>{const f=!!(document.fullscreenElement||document.webkitFullscreenElement);fb.classList.toggle('isfs',f);fb.setAttribute('aria-label',f?'Exit fullscreen':'Fullscreen')});document.addEventListener('webkitfullscreenchange',()=>document.dispatchEvent(new Event('fullscreenchange')))}
$('play').onclick=()=>v.paused?v.play():v.pause();$('stop').onclick=()=>{v.pause();v.currentTime=0};
$('prev').onclick=()=>play(cur-1);$('next').onclick=()=>play(cur+1);
$('fs').onclick=()=>(v.requestFullscreen||v.webkitEnterFullscreen||v.webkitRequestFullscreen).call(v);
$('dl').onclick=async()=>{const f=files[cur];if(!f)return;msg('Downloading…');try{const a=document.createElement('a');a.href=URL.createObjectURL(await (await api(media(f))).blob());a.download=f.name;a.click();msg('')}catch(e){msg('Error: '+e.message)}};
$('ren').onclick=async()=>{const f=files[cur];if(!f||viewOnly())return;const n=prompt('New name',f.name);if(!n||n==f.name)return;
 try{await api(`${API}/${f.id}?supportsAllDrives=true`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});const id=f.id;await load();cur=files.findIndex(x=>x.id==id);render()}catch(e){msg('Error: '+e.message)}};
$('det').onclick=()=>{const f=files[cur];if(!f)return;const m=f.videoMediaMetadata||{};$('info').hidden=!$('info').hidden;
 $('info').textContent=`Name: ${f.name}\nType: ${f.mimeType}\nSize: ${fmtSize(+f.size)}\nCreated: ${dt(f.createdTime)}\nModified: ${dt(f.modifiedTime)}\nResolution: ${m.width||'?'}x${m.height||'?'}\nDuration: ${m.durationMillis?Math.round(m.durationMillis/1000)+'s':'?'}\nID: ${f.id}\n${f.webViewLink||''}`};
mode();

$('rnd').onclick=()=>{if(!files.length)return msg('Load a vault first');let i=Math.random()*files.length|0;if(files.length>1&&i==cur)i=(i+1)%files.length;play(i)};
