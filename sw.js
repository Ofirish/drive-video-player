let token='';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('message',e=>{if(e.data&&e.data.token)token=e.data.token});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url),m=u.pathname.match(/\/stream\/([\w-]+)$/);
  if(!m||u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const h={Authorization:'Bearer '+(u.searchParams.get('t')||token)};
    const range=e.request.headers.get('Range');if(range)h.Range=range;
    const r=await fetch('https://www.googleapis.com/drive/v3/files/'+m[1]+'?alt=media&supportsAllDrives=true',{headers:h});
    const oh=new Headers();['Content-Type','Content-Length','Content-Range','Accept-Ranges','ETag','Last-Modified'].forEach(k=>{const v=r.headers.get(k);if(v)oh.set(k,v)});
    if(!oh.has('Accept-Ranges'))oh.set('Accept-Ranges','bytes');
    return new Response(r.body,{status:r.status,statusText:r.statusText,headers:oh});
  })());
});
