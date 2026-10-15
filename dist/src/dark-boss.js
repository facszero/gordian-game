// The eclipse guardian commits to a destination and aim before dealing damage.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function darkBounds(b){return {x:b.x+35,y:b.floor-480,w:b.w-70,h:480};}
export function darkMuzzle(b){return {x:b.x+b.w/2+b.face*95,y:b.floor-245};}
export function darkSword(b){return b.attack==='cleave'?{x:b.targetX-75,y:b.floor-440,w:150,h:440}:{x:b.face>0?b.x+b.w/2:b.x+b.w/2-440,y:b.floor-95,w:440,h:95};}
export function updateDarkBoss(b,dt,p,random){
 const out=[];b.flash=Math.max(0,b.flash-dt);b.age+=dt;b.moving=false;
 if(!b.active){if(p.x<b.trigger)return out;b.active=true;b.state='recover';b.timer=1.4;b.face=-1;}
 b.timer-=dt;if(b.timer>0)return out;
 const fast=b.hp<=b.maxHp/2;
 if(b.state==='recover'){
  if(!b.bag.length)b.bag=['ambush','sword','cleave'];
  const choices=b.bag.filter(a=>a!==b.attack),pool=choices.length?choices:b.bag;
  b.attack=pool[Math.floor(random()*pool.length)];b.bag.splice(b.bag.indexOf(b.attack),1);
  const center=p.x+p.w/2;
  const behind=center-(p.face||1)*(b.w/2+220)-b.w/2;
  const a=b.left+30,z=b.right-b.w-30;
  let dest=clamp(behind,a,z);
  // At the arena edge use the other side instead of materializing on the player.
  if(dest<p.x+p.w+110&&dest+b.w>p.x-110)dest=center<(b.left+b.right)/2?z:a;
  b.destination=dest;b.hidden=true;b.hazards=[];b.state='vanish';b.timer=.45;
  return out;
 }
 if(b.state==='vanish'){
  b.x=b.destination;b.face=p.x+p.w/2>b.x+b.w/2?1:-1;
  b.targetX=clamp(p.x+p.w/2,b.left+85,b.right-85);b.targetY=p.y+p.h*.5;
  b.hidden=false;b.state='warning';b.timer=fast?.95:1.25;b.rounds=fast?4:3;return out;
 }
 if(b.state==='warning'){
  b.state='attack';b.timer=b.attack==='ambush'?.28:.4;
  if(b.attack!=='ambush'){b.hazards=[darkSword(b)];return out;}
 }
 if(b.state==='attack'&&b.attack==='ambush'&&b.rounds>0){
  const {x,y}=darkMuzzle(b),dx=b.targetX-x,dy=b.targetY-y,len=Math.hypot(dx,dy)||1;
  out.push({x,y,w:20,h:16,vx:dx/len*(fast?480:400),vy:dy/len*(fast?480:400),life:4,friendly:false,boss:true,damage:24});
  b.rounds--;b.timer=fast?.24:.32;return out;
 }
 b.hazards=[];b.state='recover';b.timer=(fast?.8:1.15)+random()*.45;return out;
}
