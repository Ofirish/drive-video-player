// v4
const V='v5';let token='';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{if(e.data&&e.data.token)token=e.data.token});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url),m=u.pathname.match(/\/stream\/([\w-]+)$/);
  if(!m||u.origin!==location.origin)return;
  e.respondWith((async()=>{
    try{
      const k=u.searchParams.get('k'),t=u.searchParams.get('t')||token,size=+u.searchParams.get('s')||0;
      const h={};const rf=self.registration.scope;if(t)h.Authorization='Bearer '+t;
      const range=e.request.headers.get('Range');if(range)h.Range=range;
      const url='https://www.googleapis.com/drive/v3/files/'+m[1]+'?alt=media&supportsAllDrives=true'+(t?'':'&key='+encodeURIComponent(k||''));
      const r=await fetch(new Request(url,{headers:h,mode:'cors',credentials:'omit',redirect:'follow',cache:'no-store',referrer:rf,referrerPolicy:'strict-origin-when-cross-origin'}));
      if(!r.ok){console.warn('[sw '+V+'] Drive',r.status,r.statusText);const tx=await r.text().catch(()=>'');return new Response('Drive HTTP '+r.status+' '+tx.slice(0,200),{status:r.status,statusText:r.statusText})}
      const oh=new Headers();['Content-Type','Content-Length','Content-Range','ETag','Last-Modified'].forEach(n=>{const v=r.headers.get(n);if(v)oh.set(n,v)});
      oh.set('Accept-Ranges','bytes');
      if(!oh.get('Content-Type')||oh.get('Content-Type')=='application/octet-stream')oh.set('Content-Type','video/mp4');
      // CORS may hide Content-Range/Length from the SW; rebuild them from the known size so Chrome can seek/stream.
      if(r.status==206&&!oh.has('Content-Range')&&size&&range){const mm=range.match(/bytes=(\d*)-(\d*)/);if(mm){const a=+mm[1]||0,b=mm[2]?Math.min(+mm[2],size-1):size-1;oh.set('Content-Range',`bytes ${a}-${b}/${size}`);oh.set('Content-Length',String(b-a+1))}}
      if(r.status==200&&!oh.has('Content-Length')&&size)oh.set('Content-Length',String(size));
      return new Response(r.body,{status:r.status,statusText:r.statusText,headers:oh});
    }catch(err){console.warn('[sw '+V+'] fetch failed',err);return new Response('SW fetch failed: '+err,{status:502,statusText:'SW fetch failed'})}
  })());
});
