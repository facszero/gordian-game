// A bonus arena kept outside the twelve-level linear campaign.
export const NUCLEUS={id:13,extra:true,title:'Núcleo Madokter',robot:'garbin',background:'nucleus-background',width:1280,spawn:{x:110,y:400},exit:1230,
 platforms:[[0,680,1280],[0,560,430],[0,350,270],[530,530,210],[850,530,200],[1090,470,190]].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[],checkpoints:[],pickups:[{x:170,y:520},{x:100,y:310},{x:610,y:490}],
 boss:{kind:'nucleus',name:'NÚCLEO MADOKTER',hp:330,x:570,floor:680,w:760,h:592,left:0,right:1260,trigger:0,number:4}};
export const nucleusBounds=b=>({x:b.left+820,y:440,w:150,h:150});
export function nucleusPose(b){
 const sway=Math.sin(b.age*1.3)*2;
 return {x:b.left+570,y:170+sway,w:760,h:592,neckX:b.left+907,neckY:294+sway,angle:b.headAngle||0};
}
export function nucleusMuzzles(b){
 const p=nucleusPose(b),c=Math.cos(p.angle),s=Math.sin(p.angle);
 return {chest:{x:b.left+890,y:p.y+335},eyes:{x:p.neckX-25*c+80*s,y:p.neckY-25*s-80*c},
  shoulders:[{x:b.left+690,y:p.y+160},{x:b.left+1130,y:p.y+130}]};
}
export function updateNucleus(b,dt,p){
 if(b.dead)return [];
 b.active=true;b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.hazards=[];
 b.rageTimer=Math.max(0,(b.rageTimer||0)-dt);
 const furious=b.mega&&(b.state==='warning'||b.state==='firing')||b.rageTimer>0;
 b.rageBlend=Math.max(0,Math.min(1,(b.rageBlend||0)+(furious?dt*5:-dt*3)));
 b.phase=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(b.state==='idle'){b.state='recover';b.timer=2;}
 // Tracking stops before firing, so the warning remains dodgeable.
 if(b.state==='recover'||b.state==='warning'&&b.timer>(b.mega?.9:.35)){
  b.targetX=p.x+p.w/2;b.targetY=p.y+p.h*.45;
  const angle=Math.max(-.3,Math.min(.28,-Math.atan2(b.targetY-214,907-b.targetX)*.6));
  b.headAngle=(b.headAngle||0)+(angle-(b.headAngle||0))*Math.min(1,dt*4);
 }
 b.timer-=dt;if(b.timer>0)return [];
 if(b.state==='recover'){
  b.attack=['chest','eyes','shoulders'][b.cycle%3];b.cycle++;b.mega=b.attack==='chest'&&b.cycle%6===4;b.state='warning';b.timer=b.mega?2.2:1.4;
  b.rounds=b.attack==='eyes'?3:b.attack==='shoulders'?2:1;return [];
 }
 const muzzles=nucleusMuzzles(b),shots=[];
 const emit=(m,spread=0,speed=260)=>{
  const angle=Math.atan2(b.targetY-m.y,b.targetX-m.x)+spread;
  shots.push({...m,w:18,h:18,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:6,damage:16,friendly:false,boss:true,nucleus:true});
 };
 if(b.mega){emit(muzzles.chest,0,260);Object.assign(shots[0],{w:180,h:160,damage:28,reactorBurst:true});b.rageTimer=.8;}
 else if(b.attack==='chest')for(const offset of (b.phase===3?[-.32,-.16,0,.16,.32]:[-.2,0,.2]))emit(muzzles.chest,offset,240);
 else if(b.attack==='eyes')emit(muzzles.eyes,0,340);
 else for(const m of muzzles.shoulders)emit(m,0,210);
 b.rounds--;
 if(b.rounds>0){b.state='firing';b.timer=.3;}else{b.state='recover';b.timer=b.phase===3?1.7:2.3;}
 return shots;
}
export function drawNucleus(ctx,b,parts,reduced=false){
 if(!b||b.dead||parts.length<2)return;
 const p=nucleusPose(b),m=nucleusMuzzles(b);
 ctx.save();ctx.filter=b.flash>0?'brightness(1.6)':'none';
 ctx.drawImage(parts[0],p.x,p.y,p.w,p.h);
 ctx.save();ctx.translate(p.neckX,p.neckY);ctx.rotate(p.angle);
 const blend=parts[2]?(b.rageBlend||0):0;
 ctx.globalAlpha=1-blend;ctx.drawImage(parts[1],-135,-228,245,240);
 if(blend>0){ctx.globalAlpha=blend;ctx.drawImage(parts[2],-135,-228,245,240);}ctx.restore();ctx.restore();
 // Reactor glow remains visible as the target through the foreground platforms.
 ctx.save();ctx.strokeStyle='#f5a0ff';ctx.lineWidth=2;ctx.globalAlpha=.45;
 ctx.beginPath();ctx.arc(m.chest.x,m.chest.y,47+(reduced?0:Math.sin(b.age*4)*3),0,Math.PI*2);ctx.stroke();
 if(b.state==='warning'){
  const ports=b.attack==='chest'?[m.chest]:b.attack==='eyes'?[m.eyes]:m.shoulders;
  if(b.mega){
   const charge=Math.max(0,1-b.timer/2.2);ctx.globalAlpha=.25+charge*.55;ctx.fillStyle='#e855ff';
   ctx.shadowColor='#e855ff';ctx.shadowBlur=reduced?0:25;ctx.beginPath();ctx.arc(m.chest.x,m.chest.y,35+charge*45,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  }
  ctx.globalAlpha=.65;ctx.strokeStyle=b.attack==='eyes'?'#ff566f':'#ed93ff';ctx.setLineDash([8,12]);
  for(const o of ports){ctx.beginPath();ctx.moveTo(o.x,o.y);ctx.lineTo(b.targetX,b.targetY);ctx.stroke();}
  ctx.setLineDash([]);
 }
 ctx.restore();
}
export function drawReactorBurst(ctx,s,time,reduced=false){
 ctx.save();ctx.translate(s.x,s.y);
 const pulse=reduced?1:1+Math.sin(time*16)*.04;
 const glow=ctx.createRadialGradient(0,0,8,0,0,90);
 glow.addColorStop(0,'#fff5ff');glow.addColorStop(.28,'#ffc9ff');glow.addColorStop(.65,'#ed54ff');glow.addColorStop(1,'#7c16bd00');
 ctx.fillStyle=glow;ctx.shadowColor='#da38ff';ctx.shadowBlur=reduced?0:24;
 ctx.beginPath();ctx.ellipse(0,0,s.w/2*pulse,s.h/2*pulse,0,0,Math.PI*2);ctx.fill();
 const speed=Math.hypot(s.vx,s.vy)||1,dx=-s.vx/speed,dy=-s.vy/speed;
 ctx.strokeStyle='#ee8dff';ctx.lineWidth=5;
 for(const offset of [-35,0,35]){ctx.beginPath();ctx.moveTo(dx*35-dy*offset,dy*35+dx*offset);ctx.lineTo(dx*150-dy*offset*.4,dy*150+dx*offset*.4);ctx.stroke();}
 ctx.restore();
}
