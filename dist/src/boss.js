export function createBoss(config,defeated=false){
 return config?{...config,hp:defeated?0:180,maxHp:180,active:false,dead:defeated,state:'idle',timer:1,cycle:0,attack:'beam',targetX:0,hazards:[],flash:0,age:0}:null;
}
export function bossBounds(b){return {x:b.x+100,y:b.floor-175,w:b.w-150,h:175};}
export function hitBoss(b,amount){
 if(!b?.active||b.dead)return false;
 b.hp=Math.max(0,b.hp-amount);b.flash=.12;
 if(!b.hp){b.dead=true;b.active=false;b.hazards=[];return true;}return false;
}
// Each attack has a fixed warning target; it never tracks after the warning starts.
export function updateBoss(b,dt,player){
 if(!b||b.dead)return [];
 b.flash=Math.max(0,b.flash-dt);b.age+=dt;
 if(!b.active){if(player.x<b.trigger)return [];b.active=true;b.state='recover';b.timer=1.5;}
 b.timer-=dt;
 if(b.timer>0)return [];
 if(b.state==='recover'){
  b.attack=['beam','shell','wave'][b.cycle++%3];b.state='warning';b.timer=b.hp<=90?.95:1.4;
  b.targetX=Math.max(b.left+85,Math.min(b.x-100,player.x+player.w/2));return [];
 }
 if(b.state==='warning'){
  b.state='attack';b.timer=.7;
  if(b.attack==='beam')b.hazards=[{x:b.left,y:b.floor-118,w:b.x-b.left+140,h:16}];
  if(b.attack==='shell')b.hazards=[{x:b.targetX-75,y:b.floor-210,w:150,h:210}];
  if(b.attack==='wave')return [{x:b.x+50,y:b.floor-15,w:46,h:26,vx:b.hp<=90?-340:-260,vy:0,life:5,friendly:false,boss:true}];
  return [];
 }
 b.hazards=[];b.state='recover';b.timer=b.hp<=90?1.1:1.6;return [];
}
