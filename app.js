const API='https://www.googleapis.com/drive/v3/files',$=id=>document.getElementById(id),v=$('v');
let token='',files=[],cur=-1,tc,blobUrl;
const msg=t=>$('msg').textContent=t||'';
$('folder').value=localStorage.lastFolder||'1BdQ3Xxk1Klryfedm-RL2QHxy0IFEiQfR';
const fid=s=>(s.match(/folders\/([\w-]+)/)||s.match(/id=([\w-]+)/)||[,s.trim()])[1];
const fmtSize=b=>b?(b/1048576).toFixed(1)+' MB':'?',dt=d=>new Date(d).toLocaleString();
function signIn(){return new Promise(res=>{tc=tc||google.accounts.oauth2.initTokenClient({client_id:CLIENT_ID,scope:'https://www.googleapis.com/auth/drive',callback:r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';res()}});tc.callback=r=>{token=r.access_token;postTok();$('signin').textContent='Signed in';res()};tc.requestAccessToken({prompt:token?'':'consent'})})}
async function api(url,opt={}){if(!token)await signIn();opt.headers={...opt.headers,Authorization:'Bearer '+token};
 let r=await fetch(url,opt);if(r.status==401){await signIn();opt.headers.Authorization='Bearer '+token;r=await fetch(url,opt)}
 if(!r.ok)throw Error((await r.text()).slice(0,200));return r}
async function load(){const id=fid($('folder').value);localStorage.lastFolder=id;msg('Loading…');files=[];let pt='';
 try{do{const q=new URLSearchParams({q:`'${id}' in parents and mimeType contains 'video/' and trashed=false`,pageSize:1000,orderBy:'name',
  fields:'nextPageToken,files(id,name,size,mimeType,thumbnailLink,createdTime,modifiedTime,videoMediaMetadata,webViewLink)',
  supportsAllDrives:true,includeItemsFromAllDrives:true,pageToken:pt});const j=await (await api(API+'?'+q)).json();files.push(...j.files);pt=j.nextPageToken}while(pt);
  render();msg(files.length+' videos')}catch(e){msg('Error: '+e.message)}}
function render(){$('list').innerHTML='';files.forEach((f,i)=>{const li=document.createElement('li');li.className=i==cur?'on':'';
 li.innerHTML=`<img loading="lazy" src="${f.thumbnailLink||''}" referrerpolicy="no-referrer" alt=""><div><b></b><small>${fmtSize(+f.size)} · created ${dt(f.createdTime)}</small><small>modified ${dt(f.modifiedTime)}</small></div>`;
 li.querySelector('b').textContent=f.name;li.onclick=()=>play(i);$('list').append(li)})}
const media=f=>`${API}/${f.id}?alt=media&supportsAllDrives=true`;
async function play(i){if(i<0||i>=files.length)return;cur=i;render();$('pl').hidden=false;$('info').hidden=true;const f=files[i];
 if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null}
 v.onerror=async()=>{v.onerror=null;msg('Stream failed, downloading to memory…');try{blobUrl=URL.createObjectURL(await fetchBlob(f));v.src=blobUrl;v.play().catch(()=>{});msg(f.name)}catch(e){msg('Error: '+e.message)}};
 if(!token)await signIn();await swReady();postTok();
 v.src='./stream/'+f.id+'?t='+encodeURIComponent(token);v.play().catch(()=>{});msg(f.name)}
async function fetchBlob(f){const r=await api(media(f));if(!r.ok)throw Error('HTTP '+r.status);const tot=+r.headers.get('Content-Length')||+f.size||0;const rd=r.body.getReader(),ch=[];let n=0;
 for(;;){const {done,value}=await rd.read();if(done)break;ch.push(value);n+=value.length;msg('Downloading '+(tot?Math.round(n*100/tot)+'%':(n/1048576).toFixed(1)+' MB'))}
 return new Blob(ch,{type:f.mimeType||'video/mp4'})}
function postTok(){const c=navigator.serviceWorker&&navigator.serviceWorker.controller;if(c&&token)c.postMessage({token})}
async function swReady(){if(!('serviceWorker' in navigator))return;await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller){if(!sessionStorage.swr){sessionStorage.swr=1;location.reload()}await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}))}}
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(()=>swReady()).catch(e=>console.warn(e));navigator.serviceWorker.addEventListener('controllerchange',postTok)}
v.onended=()=>$('auto').checked&&play(cur+1);
$('ff').onsubmit=e=>{e.preventDefault();load()};$('signin').onclick=signIn;
$('play').onclick=()=>v.paused?v.play():v.pause();$('stop').onclick=()=>{v.pause();v.currentTime=0};
$('prev').onclick=()=>play(cur-1);$('next').onclick=()=>play(cur+1);
$('fs').onclick=()=>(v.requestFullscreen||v.webkitEnterFullscreen||v.webkitRequestFullscreen).call(v);
$('dl').onclick=async()=>{const f=files[cur];if(!f)return;msg('Downloading…');try{const a=document.createElement('a');a.href=URL.createObjectURL(await (await api(media(f))).blob());a.download=f.name;a.click();msg('')}catch(e){msg('Error: '+e.message)}};
$('ren').onclick=async()=>{const f=files[cur];if(!f)return;const n=prompt('New name',f.name);if(!n||n==f.name)return;
 try{await api(`${API}/${f.id}?supportsAllDrives=true`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})});const id=f.id;await load();cur=files.findIndex(x=>x.id==id);render()}catch(e){msg('Error: '+e.message)}};
$('det').onclick=()=>{const f=files[cur];if(!f)return;const m=f.videoMediaMetadata||{};$('info').hidden=!$('info').hidden;
 $('info').textContent=`Name: ${f.name}\nType: ${f.mimeType}\nSize: ${fmtSize(+f.size)}\nCreated: ${dt(f.createdTime)}\nModified: ${dt(f.modifiedTime)}\nResolution: ${m.width||'?'}x${m.height||'?'}\nDuration: ${m.durationMillis?Math.round(m.durationMillis/1000)+'s':'?'}\nID: ${f.id}\n${f.webViewLink||''}`};
