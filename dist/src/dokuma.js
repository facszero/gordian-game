export const dokumaPhase=b=>b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
// The reactor is reachable by a grounded Garbin shot in every phase.
export const dokumaBounds=b=>{const pose=dokumaBodyPose(b);return {x:pose?pose.x+pose.size*.65-110:b.left+(b.phase===1?760:900),y:b.floor-280,w:220,h:270};};
export const SUMMON_WARNING=1.8;
export function dokumaSummonPose(b){
 if(b.summonStart===undefined)return {from:0,to:0,blend:0};
 const t=b.age-b.summonStart,keys=[[0,0],[.3,1],[.8,2],[1.5,3],[2.45,3],[2.8,1],[3.15,0]];
 for(let i=1;i<keys.length;i++)if(t<keys[i][0]){const a=keys[i-1],z=keys[i],p=Math.max(0,(t-a[0])/(z[0]-a[0]));return {from:a[1],to:z[1],blend:p*p*(3-2*p)};}
 return {from:0,to:0,blend:0};
}
export function dokumaPalm(b,index){return {x:b.left+850+(index%2?270:-270),y:b.floor-560};}
// The fist travels during the warning, reaches the hitbox on impact, then retracts.
export function dokumaFistPose(b){
 if(b.fistStart===undefined||b.dead)return null;
 const t=b.age-b.fistStart,windup=b.fistWindup;
 if(t<0||t>=windup+.95)return null;
 const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
 const reach=t<windup?smooth((t/windup-.35)/.65):t<windup+.5?1:1-smooth((t-windup-.5)/.45);
 const lift=Math.sin(Math.min(1,t/windup)*Math.PI)*90*(1-reach);
 const w=110+80*reach,h=160+140*reach;
 const homeX=b.left+820,homeY=b.floor-420;
 return {x:homeX+(b.fistTargetX-95-homeX)*reach,y:homeY+(b.floor-300-homeY)*reach-lift,w,h,alpha:Math.min(smooth(t/.12),smooth((windup+.95-t)/.15))};
}
export function dokumaBodyPose(b){
 const fist=dokumaFistPose(b);if(!fist)return null;
 const t=b.age-b.fistStart,w=b.fistWindup;
 const keys=[[0,0],[w*.25,1],[w*.6,2],[w*.83,3],[w,4],[w+.5,4],[w+.72,5],[w+.95,0]];
 let from=0,to=0,blend=0;
 for(let i=1;i<keys.length;i++)if(t<keys[i][0]){from=keys[i-1][1];to=keys[i][1];blend=Math.max(0,1-(keys[i][0]-t)/.08);break;}
 const reach=(fist.w-110)/80,size=1020,home=b.left+1000-size*.65;
 return {from,to,blend,size,x:home+(b.fistTargetX-size*.2-home)*reach,y:b.floor-size*.9-12*Math.sin(reach*Math.PI)};
}
// Only destroyed drones count; clearing them on a phase change never creates supplies.
export function hitDokumaDrone(b,d,damage){
 if(!b?.active||b.dead||d.dead)return null;
 d.hp-=damage;if(d.hp>0)return null;d.dead=true;
 b.orbsDestroyed=(b.orbsDestroyed||0)+1;
 return {bossDrop:true,taken:false,x:Math.max(b.left+55,Math.min(b.right-100,d.x)),y:Math.max(110,Math.min(b.floor-32,d.y)),vy:0,floor:b.floor};
}
export function updateBossDrop(p,dt){
 if(!p.bossDrop||p.taken)return;
 p.vy=Math.min(340,(p.vy||0)+650*dt);p.y=Math.min(p.floor-32,p.y+p.vy*dt);
}
export function updateDokuma(b,dt,p,random=Math.random){
 if(b.dead)return [];
 b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.drones??=[];
 if(!b.active){if(p.x<b.trigger)return [];b.active=true;b.state='recover';b.timer=1.5;b.phase=1;}
 const phase=dokumaPhase(b);
 if(phase!==b.phase){b.phase=phase;b.state='shift';b.timer=1.8;b.hazards=[];b.drones=[];b.summonStart=undefined;b.fistStart=undefined;return [];}
 const shots=[];
 for(const d of b.drones){
  if(d.dead)continue;
  if(d.entry<1){d.entry=Math.min(1,d.entry+dt/1.1);const t=d.entry*d.entry*(3-2*d.entry);d.x=d.originX+(d.destinationX-d.originX)*t;d.y=d.originY+(d.baseY-d.originY)*t;continue;}
  d.age+=dt;d.x+=d.vx*dt;d.y=d.baseY+Math.sin(d.age*3)*28;d.timer-=dt;
  if(d.x<b.left+30)d.vx=Math.abs(d.vx);if(d.x>b.right-80)d.vx=-Math.abs(d.vx);
  if(d.timer<=0){d.timer=2;const dx=p.x+p.w/2-d.x,dy=p.y+p.h*.5-d.y,l=Math.hypot(dx,dy)||1;shots.push({x:d.x,y:d.y,w:14,h:14,vx:dx/l*270,vy:dy/l*270,life:5,friendly:false,boss:true,damage:14});}
 }
 b.drones=b.drones.filter(d=>!d.dead);
 b.timer-=dt;if(b.timer>0)return shots;
 if(b.state==='shift'){b.state='recover';b.timer=1;return shots;}
 if(b.state==='recover'){
  const attacks=phase===1?['drones','eyes']:phase===2?['fist','eyes']:['tentacles','eyes','fist'];
  const pool=attacks.filter(a=>a!==b.attack);b.attack=pool[Math.floor(random()*pool.length)];
  b.targetX=Math.max(b.left+100,Math.min(b.right-150,p.x+p.w/2));b.targetY=p.y+p.h*.5;
  b.state='warning';b.timer=b.attack==='drones'?SUMMON_WARNING:phase===3?.95:1.25;
  if(b.attack==='drones')b.summonStart=b.age;
  if(b.attack==='fist'){b.fistStart=b.age;b.fistWindup=b.timer;b.fistTargetX=b.targetX;}
  return shots;
 }
 if(b.state==='warning'){
  b.state='attack';b.timer=b.attack==='eyes'?.65:.5;
  if(b.attack==='drones'){
   b.timer=.65;
   for(let i=0;i<3&&b.drones.length<6;i++){const palm=dokumaPalm(b,i);b.drones.push({x:palm.x-32,y:palm.y-32,originX:palm.x-32,originY:palm.y-32,destinationX:b.left+350+i*180,entry:0,baseY:b.floor-260-i*35,w:64,h:64,hp:5,age:i,timer:1+i*.3,vx:-90-i*15});}
  }else if(b.attack==='eyes'){
   b.hazards=[{x:b.left,y:b.floor-120,w:b.right-b.left,h:20}];
  }else if(b.attack==='fist')b.hazards=[{x:b.targetX-95,y:b.floor-300,w:190,h:300}];
  else b.hazards=[{x:b.targetX-190,y:b.floor-75,w:380,h:75}];
  return shots;
 }
 b.hazards=[];b.state='recover';b.timer=phase===3?1.2:1.6;return shots;
}

export function drawDokuma(ctx,b,frames,reduced,summonFrames=[],punchFrames=[]){
 if(!b||b.dead||!b.active||!frames.length)return;
 const phase=b.phase||1,pose=phase===1?0:phase===2?1:2,f=frames[pose];
 const h=phase===1?570:715,w=f.width/f.height*h,cx=b.left+(phase===1?850:1000);
 ctx.save();if(b.flash>0)ctx.filter='brightness(1.7)';
 if(phase>1&&punchFrames.length){
  const pose=dokumaBodyPose(b)||{from:0,to:0,blend:0,size:1020,x:cx-1020*.65,y:b.floor-1020*.9};
  const anchors=[.865,.865,.865,.815,.815,.815];
  const draw=index=>ctx.drawImage(punchFrames[index],pose.x,pose.y+( .9-anchors[index])*pose.size,pose.size,pose.size);
  if(reduced)draw(pose.blend<.5?pose.from:pose.to);
  else {ctx.globalAlpha=1-pose.blend;draw(pose.from);if(pose.blend){ctx.globalAlpha=pose.blend;draw(pose.to);}}
 }else if(phase===1&&summonFrames.length){
  const pose=dokumaSummonPose(b),size=820,anchors=[.925,.925,.882,.882];
  const drawPose=index=>ctx.drawImage(summonFrames[index],cx-size/2,b.floor-size*anchors[index],size,size);
  if(reduced)drawPose(pose.blend<.5?pose.from:pose.to);
  else {ctx.globalAlpha=1-pose.blend;drawPose(pose.from);ctx.globalAlpha=pose.blend;drawPose(pose.to);}
 }else ctx.drawImage(f,cx-w/2,b.floor-h,w,h);ctx.restore();
 const mark=(x,y,x2,y2,color,width=3)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();};
 if(b.state==='warning'){
  ctx.save();ctx.globalAlpha=reduced?.8:.65+Math.sin(b.age*15)*.2;
  if(b.attack==='eyes')mark(b.left,b.floor-110,b.right,b.floor-110,'#ff858e',2);
  else if(b.attack!=='drones'){const width=b.attack==='fist'?190:380;mark(b.targetX-width/2,b.floor-5,b.targetX+width/2,b.floor-5,'#a4ffc7',5);}
  ctx.restore();
 }
 for(const hazard of b.hazards){
  ctx.save();ctx.shadowBlur=20;ctx.shadowColor=b.attack==='eyes'?'#ff3658':'#58ffb0';
  if(b.attack==='eyes'){
   for(const offset of [-12,12]){mark(cx+offset,b.floor-h*.7,b.right-30,b.floor-110,'#ff8ca2',4);}
   mark(hazard.x,b.floor-110,b.right,b.floor-110,'#ffcfdd',12);
  }else if(b.attack==='fist'){
   mark(hazard.x,b.floor-4,hazard.x+hazard.w,b.floor-4,'#ddffb0',9);
  }else{
   for(let i=0;i<5;i++){const x=hazard.x+i*hazard.w/4;ctx.strokeStyle='#76dca1';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(x,b.floor);ctx.quadraticCurveTo(x-30,b.floor-90,x+25,b.floor-70);ctx.stroke();}
  }
  ctx.restore();
 }
 for(const d of b.drones||[]){if(!d.dead)ctx.drawImage(frames[3],d.x-8,d.y-8,80,80);}
}
