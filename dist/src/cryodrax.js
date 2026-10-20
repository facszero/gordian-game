import {NUCLEUS} from './nucleus.js';
export const CRYODRAX={...NUCLEUS,id:14,title:'Cryodrax Prime',background:'cryo-background',
 boss:{...NUCLEUS.boss,kind:'cryodrax',name:'CRYODRAX PRIME',number:5}};
export const CRYO_REGIONS=[[0,0,.52,1],[.52,0,.48,.57],[.52,.57,.48,.43]];
const rotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
// The torso is the parent transform: neck, jaw, ports and target move with it.
export function cryoPose(b){return {x:b.left+1040+(b.lean||0)*12+(b.recoil||0)*10,y:660+Math.sin(b.age*1.3)*3,angle:(b.headAngle||0)*.16+(b.lean||0)*.025+(b.recoil||0)*.018};}
function bodyPoint(b,x,y){const p=cryoPose(b),r=rotate(x,y,p.angle);return {x:p.x+r.x,y:p.y+r.y};}
function headPoint(b,x,y){const r=rotate(x,y,b.headAngle||0);return bodyPoint(b,-65+r.x,-380+r.y);}
export function cryoMuzzles(b){return {chest:bodyPoint(b,-68,-195),mouth:headPoint(b,-250,-90),eyes:headPoint(b,-152,-112)};}
export function cryoBounds(b){const m=cryoMuzzles(b).chest;return {x:m.x-70,y:m.y-60,w:140,h:160};}
export function updateCryodrax(b,dt,p){
 if(b.dead)return [];
 b.active=true;b.age+=dt;b.flash=Math.max(0,b.flash-dt);b.hazards=[];
 b.phase=b.hp>b.maxHp*2/3?1:b.hp>b.maxHp/3?2:3;
 if(b.state==='idle'){b.state='recover';b.timer=2;}
 const warning=b.state==='warning',mouth=b.attack==='mouth'&&(warning||b.state==='firing');
 b.jaw=(b.jaw||0)+((mouth?.35:0)-(b.jaw||0))*Math.min(1,dt*5);
 b.lean=(b.lean||0)+((warning?1:0)-(b.lean||0))*Math.min(1,dt*3);
 b.kick=Math.max(0,(b.kick||0)-dt*3);
 b.recoil=(b.recoil||0)+((b.kick||0)-(b.recoil||0))*Math.min(1,dt*12);
 if(b.state==='recover'||warning&&b.timer>.65){
  b.targetX=p.x+p.w/2;b.targetY=p.y+p.h*.45;
  const m=cryoMuzzles(b).eyes,a=Math.max(-.25,Math.min(.22,-Math.atan2(b.targetY-m.y,m.x-b.targetX)*.45));
  b.headAngle=(b.headAngle||0)+(a-(b.headAngle||0))*Math.min(1,dt*3);
 }
 b.timer-=dt;if(b.timer>0)return [];
 if(b.state==='recover'){
  b.attack=['chest','mouth','eyes'][b.cycle%3];b.cycle++;b.state='warning';b.timer=b.attack==='chest'?2.2:1.5;
  b.rounds=b.attack==='mouth'?2:b.attack==='eyes'?3:1;return [];
 }
 const m=cryoMuzzles(b)[b.attack],shots=[];
 const emit=(offset,beam=false)=>{
  const angle=Math.atan2(b.targetY-m.y,b.targetX-m.x)+offset,speed=beam?300:b.attack==='eyes'?340:240;
  const length=beam?200:46,thickness=beam?52:13;
  shots.push({...m,w:Math.abs(Math.cos(angle))*length+Math.abs(Math.sin(angle))*thickness,h:Math.abs(Math.sin(angle))*length+Math.abs(Math.cos(angle))*thickness,
   vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,angle,length,thickness,life:6,damage:beam?26:14,friendly:false,boss:true,ice:true,iceBeam:beam});
 };
 if(b.attack==='chest')emit(0,true);
 else if(b.attack==='mouth')for(const a of (b.phase===3?[-.28,-.14,0,.14,.28]:[-.18,0,.18]))emit(a);
 else emit(0);
 b.kick=b.attack==='chest'?1:.5;b.rounds--;
 if(b.rounds>0){b.state='firing';b.timer=.36;}else{b.state='recover';b.timer=b.phase===3?1.9:2.5;}
 return shots;
}
export function drawCryodrax(ctx,b,parts,reduced=false){
 if(!b||b.dead||parts.length<3)return;
 const p=cryoPose(b),m=cryoMuzzles(b);
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.filter=b.flash>0?'brightness(1.6)':'none';
 ctx.drawImage(parts[0],-230,-440,450,540);
 ctx.save();ctx.translate(-65,-380);ctx.rotate(b.headAngle||0);
 // Jaw hinge remains attached to the skull throughout opening and tracking.
 ctx.save();ctx.translate(-25,-65);ctx.rotate(-(b.jaw||0));ctx.drawImage(parts[2],-285,-40,310,140);ctx.restore();
 ctx.drawImage(parts[1],-300,-220,360,280);ctx.restore();ctx.restore();
 if(b.state==='warning'){
  const port=m[b.attack];ctx.save();ctx.strokeStyle='#9beeff';ctx.lineWidth=2;ctx.globalAlpha=.55;ctx.setLineDash([8,12]);
  ctx.beginPath();ctx.moveTo(port.x,port.y);ctx.lineTo(b.targetX,b.targetY);ctx.stroke();ctx.setLineDash([]);
  const charge=1-b.timer/(b.attack==='chest'?2.2:1.5);ctx.globalAlpha=.3+charge*.5;ctx.fillStyle='#c8faff';ctx.shadowColor='#29caff';ctx.shadowBlur=reduced?0:22;
  ctx.beginPath();ctx.arc(port.x,port.y,12+Math.max(0,charge)*(b.attack==='chest'?38:12),0,Math.PI*2);ctx.fill();ctx.restore();
 }
}
export function drawIceShot(ctx,s,time,reduced=false){
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.angle);ctx.shadowColor='#53dfff';ctx.shadowBlur=reduced?0:s.iceBeam?20:8;
 const l=s.length/2,t=s.thickness/2;
 if(s.iceBeam){
  const g=ctx.createLinearGradient(0,-t,0,t);g.addColorStop(0,'#159add55');g.addColorStop(.35,'#74e7ff');g.addColorStop(.5,'#f4ffff');g.addColorStop(.65,'#74e7ff');g.addColorStop(1,'#159add55');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(l,0);ctx.lineTo(l-24,-t);ctx.lineTo(-l,-t*.7);ctx.lineTo(-l-45,0);ctx.lineTo(-l,t*.7);ctx.lineTo(l-24,t);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ecffff';ctx.lineWidth=2;
  for(let i=0;i<3;i++){const y=(i-1)*13;ctx.beginPath();ctx.moveTo(-l,y);for(let j=1;j<=5;j++)ctx.lineTo(-l+j*s.length/5,y+(reduced?0:Math.sin(time*13+j+i)*5));ctx.stroke();}
 }else{
  ctx.fillStyle='#83dfff';ctx.strokeStyle='#e3fcff';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(l,0);ctx.lineTo(-l*.35,-t);ctx.lineTo(-l,t*.3);ctx.lineTo(-l*.2,t);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(-l*.7,0);ctx.lineTo(l,0);ctx.stroke();
 }
 ctx.restore();
}
// Snow decorates the existing collision edge; platforms retain their exact geometry.
export function drawFrozenEdge(ctx,p){
 ctx.save();ctx.fillStyle='#e0f5ff';ctx.fillRect(p.x,p.y-3,p.w,5);ctx.fillStyle='#9edaf3';
 for(let x=12;x<p.w-8;x+=37){const h=8+((x*13+p.y)%19);ctx.beginPath();ctx.moveTo(p.x+x,p.y+2);ctx.lineTo(p.x+x+5,p.y+h);ctx.lineTo(p.x+x+9,p.y+2);ctx.fill();}ctx.restore();
}
