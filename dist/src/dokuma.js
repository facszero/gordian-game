export const dokumaPhase=b=>b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
// The reactor is reachable by a grounded Garbin shot in every phase.
export const dokumaBounds=b=>({x:b.left+(b.phase===1?760:900),y:b.floor-280,w:220,h:270});
export function updateDokuma(b,dt,p,random=Math.random){
 if(b.dead)return [];
 b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.drones??=[];
 if(!b.active){if(p.x<b.trigger)return [];b.active=true;b.state='recover';b.timer=1.5;b.phase=1;}
 const phase=dokumaPhase(b);
 if(phase!==b.phase){b.phase=phase;b.state='shift';b.timer=1.8;b.hazards=[];b.drones=[];return [];}
 const shots=[];
 for(const d of b.drones){
  if(d.dead)continue;d.age+=dt;d.x+=d.vx*dt;d.y=d.baseY+Math.sin(d.age*3)*28;d.timer-=dt;
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
  b.state='warning';b.timer=phase===3?.95:1.25;return shots;
 }
 if(b.state==='warning'){
  b.state='attack';b.timer=b.attack==='eyes'?.65:.5;
  if(b.attack==='drones'){
   for(let i=0;i<3&&b.drones.length<6;i++)b.drones.push({x:b.left+500+i*170,y:b.floor-260,baseY:b.floor-260-i*35,w:64,h:64,hp:5,age:i,timer:1+i*.3,vx:-90-i*15});
  }else if(b.attack==='eyes'){
   b.hazards=[{x:b.left,y:b.floor-120,w:b.right-b.left,h:20}];
  }else if(b.attack==='fist')b.hazards=[{x:b.targetX-95,y:b.floor-300,w:190,h:300}];
  else b.hazards=[{x:b.targetX-190,y:b.floor-75,w:380,h:75}];
  return shots;
 }
 b.hazards=[];b.state='recover';b.timer=phase===3?1.2:1.6;return shots;
}

export function drawDokuma(ctx,b,frames,reduced){
 if(!b||b.dead||!b.active||!frames.length)return;
 const phase=b.phase||1,pose=phase===1?0:phase===2?1:2,f=frames[pose];
 const h=phase===1?450:620,w=f.width/f.height*h,cx=b.left+(phase===1?850:1000);
 ctx.save();if(b.flash>0)ctx.filter='brightness(1.7)';
 ctx.drawImage(f,cx-w/2,b.floor-h,w,h);ctx.restore();
 // Core aperture aligns with the damage bounds; its glow makes the target readable.
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
   // A cropped armored fist from the close pose descends at the marked position.
   const fist=frames[1];ctx.drawImage(fist,0,fist.height*.32,fist.width*.46,fist.height*.48,hazard.x,hazard.y,190,300);
   mark(hazard.x,b.floor-4,hazard.x+hazard.w,b.floor-4,'#ddffb0',9);
  }else{
   for(let i=0;i<5;i++){const x=hazard.x+i*hazard.w/4;ctx.strokeStyle='#76dca1';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(x,b.floor);ctx.quadraticCurveTo(x-30,b.floor-90,x+25,b.floor-70);ctx.stroke();}
  }
  ctx.restore();
 }
 for(const d of b.drones||[]){if(!d.dead)ctx.drawImage(frames[3],d.x-8,d.y-8,80,80);}
}
