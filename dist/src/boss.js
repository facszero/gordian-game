import {nucleusBounds,updateNucleus} from './nucleus.js';
import {dokumaBounds,updateDokuma} from './dokuma.js';
import {darkBounds,updateDarkBoss} from './dark-boss.js';
export {darkMuzzle,darkSword} from './dark-boss.js';
export function createBoss(config,defeated=false){
 return config?{...config,homeX:config.x,direction:-1,moving:false,walkDistance:0,hp:defeated?0:(config.hp||180),maxHp:config.hp||180,hidden:false,face:-1,active:false,dead:defeated,state:'idle',timer:1,cycle:0,attack:'beam',targetX:0,targetY:0,hazards:[],flash:0,age:0,bag:[],rounds:0}:null;
}
export function bossBounds(b){return b.kind==='nucleus'?nucleusBounds(b):b.kind==='dokuma'?dokumaBounds(b):b.kind==='dark'?darkBounds(b):{x:b.x+100,y:b.floor-175,w:b.w-150,h:175};}
export function hitBoss(b,amount){
 if(!b?.active||b.dead||b.hidden)return false;
 b.hp=Math.max(0,b.hp-amount);b.flash=.12;
 if(!b.hp){b.dead=true;b.active=false;b.moving=false;b.rounds=0;b.hazards=[];b.drones=[];return true;}return false;
}
function volleyShot(b){
 const x=b.x+100,y=b.floor-110,dx=b.targetX-x,dy=b.targetY-y,d=Math.hypot(dx,dy)||1,speed=b.hp<=b.maxHp/2?420:350;
 b.rounds--;return {x,y,w:20,h:16,vx:dx/d*speed,vy:dy/d*speed,life:4,friendly:false,boss:true,damage:20};
}
// Randomness is injectable for reproducible tests. Targets lock during the warning.
export function updateBoss(b,dt,player,random=Math.random){
 if(!b||b.dead)return [];
 if(b.kind==='nucleus')return updateNucleus(b,dt,player);
 if(b.kind==='dokuma')return updateDokuma(b,dt,player,random);
 if(b.kind==='dark')return updateDarkBoss(b,dt,player,random);
 b.flash=Math.max(0,b.flash-dt);b.age+=dt;
 if(!b.active){if(player.x<b.trigger)return [];b.active=true;b.state='recover';b.timer=1.2;}
 const fast=b.hp<=b.maxHp/2;
 b.moving=b.state!=='attack';
 const previousX=b.x;
 if(b.moving){
  const minX=Math.max(b.homeX-210,player.x+player.w+110),maxX=b.homeX+50;
  const next=b.x+b.direction*(fast?90:60)*dt;
  // Do not push or teleport the player when the front of the boss approaches.
  if(next<minX){b.direction=1;b.x=Math.max(b.x,Math.min(maxX,next));}
  else if(next>maxX){b.x=maxX;b.direction=-1;}
  else b.x=next;
 }
 b.walkDistance+=b.x-previousX;b.moving=Math.abs(b.x-previousX)>.001;
 b.timer-=dt;if(b.timer>0)return [];
 if(b.state==='recover'){
  if(!b.bag.length)b.bag=['beam','shell','wave','burst'];
  const choices=b.bag.filter(a=>a!==b.attack);const pool=choices.length?choices:b.bag;
  b.attack=pool[Math.floor(random()*pool.length)];b.bag.splice(b.bag.indexOf(b.attack),1);b.cycle++;
  b.state='warning';b.timer=(fast?.75:1.05)+random()*.3;
  b.targetX=Math.max(b.left+85,Math.min(b.x-100,player.x+player.w/2));b.targetY=player.y+player.h*.5;
  b.rounds=b.attack==='burst'?(random()<.5?3:4):0;return [];
 }
 if(b.state==='warning'){
  b.state='attack';b.timer=.55;
  if(b.attack==='beam')b.hazards=[{x:b.left,y:b.floor-118,w:b.x-b.left+140,h:16}];
  if(b.attack==='shell')b.hazards=[{x:b.targetX-75,y:b.floor-210,w:150,h:210}];
  if(b.attack==='wave')return [{x:b.x+50,y:b.floor-15,w:46,h:26,vx:fast?-340:-260,vy:0,life:5,friendly:false,boss:true}];
  if(b.attack==='burst'){b.timer=(fast?.2:.28)+random()*.1;return [volleyShot(b)];}
  return [];
 }
 if(b.attack==='burst'&&b.rounds>0){b.timer=(fast?.2:.28)+random()*.1;return [volleyShot(b)];}
 b.hazards=[];b.state='recover';b.timer=(fast?.45:.7)+random()*.75;return [];
}
