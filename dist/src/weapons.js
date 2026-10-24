// Decorative layers only: projectile collision boxes and damage live in combat.js.
export const WEAPON_COLORS={protesser:['#54ff9e','#deffe9'],dellinger:['#ff564b','#fff0cb'],garbin:['#78cfff','#ffffff']};
export function shotEffect(shot,kind){return {x:shot.x,y:shot.y,angle:Math.atan2(shot.vy,shot.vx),robot:shot.robot||'protesser',charged:!!shot.charged,kind,age:0,duration:kind==='muzzle'?.13:shot.charged?.32:.19};}
export function updateShotEffects(effects,dt){for(const e of effects)e.age+=dt;return effects.filter(e=>e.age<e.duration).slice(-48);}
const oval=(c,x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
const stroke=(c,points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
export function drawPlayerShot(c,s,time,reduced=false){
 const robot=s.robot||'protesser',[color,core]=WEAPON_COLORS[robot],charged=!!s.charged,L=Math.max(s.w,s.h),R=Math.min(s.w,s.h)/2;
 c.save();c.translate(s.x,s.y);c.rotate(Math.atan2(s.vy,s.vx));c.lineCap='round';c.shadowColor=color;c.shadowBlur=reduced?0:charged?12:7;
 // Fading tail is decorative, not an extra hitbox.
 const tail=c.createLinearGradient(-L*1.6,0,L/2,0);tail.addColorStop(0,'#ffffff00');tail.addColorStop(.65,color+'90');tail.addColorStop(1,color);
 c.fillStyle=tail;c.beginPath();c.moveTo(-L*1.6,0);c.lineTo(L*.2,-R*.8);c.lineTo(L*.45,0);c.lineTo(L*.2,R*.8);c.closePath();c.fill();
 if(robot==='protesser'){
  oval(c,0,0,L*.5,R,color);oval(c,L*.12,0,L*.3,R*.4,core);
  if(charged){c.strokeStyle=core;c.lineWidth=1.5;c.beginPath();c.ellipse(0,0,L*.42,R*1.3,0,0,Math.PI*2);c.stroke();stroke(c,[[-L*.45,-R],[-L*.65,-R],[-L*.85,0],[-L*.65,R],[-L*.45,R]],color,2);}
 }else if(robot==='dellinger'){
  c.fillStyle=color;c.beginPath();c.moveTo(L*.5,0);c.lineTo(L*.12,-R);c.lineTo(-L*.5,-R*.6);c.lineTo(-L*.3,0);c.lineTo(-L*.5,R*.6);c.lineTo(L*.12,R);c.closePath();c.fill();
  stroke(c,[[-L*.25,0],[L*.28,0]],core,Math.max(2,R*.6));
  if(charged)for(const x of [-L*.35,-L*.7])stroke(c,[[x-R*.5,-R*1.2],[x+R*.5,0],[x-R*.5,R*1.2]],'#ffbd76',2);
 }else{
  c.fillStyle=color;c.fillRect(-L*.45,-R,L*.8,R*2);oval(c,L*.35,0,L*.15,R,core);
  stroke(c,[[-L*.4,0],[L*.35,0]],core,Math.max(2,R*.8));
  if(charged){const wave=reduced?0:Math.sin(time*28)*R*.35;stroke(c,[[-L*.8,0],[-L*.5,-R-wave],[-L*.1,R+wave],[L*.3,0]],'#bdeaff',1.5);for(const x of [-L*.3,0,L*.3]){c.strokeStyle=color;c.lineWidth=1.5;c.beginPath();c.ellipse(x,0,3,R*1.25,0,0,Math.PI*2);c.stroke();}}
 }
 c.restore();
}
export function drawShotEffects(c,effects,reduced=false){
 for(const e of effects){const [color,core]=WEAPON_COLORS[e.robot],p=e.age/e.duration,r=(e.charged?26:13)*(e.kind==='muzzle'?1-p:.4+p);
  c.save();c.translate(e.x,e.y);c.rotate(e.angle);c.globalAlpha=(1-p)*.85;c.lineCap='round';c.shadowColor=color;c.shadowBlur=reduced?0:8;
  if(e.kind==='muzzle'){
   oval(c,3,0,r*.65,r*.28,core);stroke(c,[[0,-r*.65],[0,r*.65]],color,2);stroke(c,[[-r*.35,0],[r,0]],color,2);
  }else{
   c.strokeStyle=color;c.lineWidth=e.charged?3:2;c.beginPath();c.ellipse(0,0,r*(e.robot==='dellinger'?.65:1),r,0,0,Math.PI*2);c.stroke();
   const rays=e.robot==='garbin'?8:6;for(let i=0;i<rays;i++){const a=i*Math.PI*2/rays;stroke(c,[[Math.cos(a)*r*.65,Math.sin(a)*r*.65],[Math.cos(a)*r*1.35,Math.sin(a)*r*1.35]],i%2?color:core,1.5);}
   oval(c,0,0,Math.max(1,r*(1-p)*.3),Math.max(1,r*(1-p)*.3),core);
  }c.restore();
 }
}
