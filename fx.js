(()=>{const c=document.getElementById('embers');if(!c||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
const x=c.getContext('2d');let W,H,ps=[],raf=0;const N=()=>document.body.classList.contains('playing')?60:30;
const rs=()=>{const d=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;c.width=W*d;c.height=H*d;x.setTransform(d,0,0,d,0,0)};
const mk=()=>({x:Math.random()*W,y:H+10,r:Math.random()*2+.6,vy:Math.random()*.6+.25,vx:(Math.random()-.5)*.3,l:1});
function f(){x.clearRect(0,0,W,H);while(ps.length<N())ps.push(Object.assign(mk(),{y:Math.random()*H}));if(ps.length>N())ps.length=N();
for(const p of ps){p.y-=p.vy;p.x+=p.vx+Math.sin(p.y/40)*.2;p.l=p.y/H;if(p.y<-10)Object.assign(p,mk());
x.fillStyle=`rgba(255,${120+(p.r*40|0)},0,${.25+p.l*.6})`;x.beginPath();x.arc(p.x,p.y,p.r,0,7);x.fill()}raf=requestAnimationFrame(f)}
rs();addEventListener('resize',rs);document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(raf);if(!document.hidden)raf=requestAnimationFrame(f)});f()})();
