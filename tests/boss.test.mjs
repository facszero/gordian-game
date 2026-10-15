import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,updateBoss,hitBoss,bossBounds} from '../dist/src/boss.js';
import {FORTRESS,TUNNELS,ROBOTS,GRAVITY,moveBody,overlaps} from '../dist/src/level.js';
import {playerShot,shotBounds,setStance} from '../dist/src/combat.js';
for(const level of [TUNNELS,FORTRESS])test('main route and checkpoint floors are reachable in level '+level.id,()=>{
 const route=level.platforms.filter(p=>p.w>=300),spec=ROBOTS[level.robot];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],p={x:a.x+a.w-spec.width-12,y:a.y-spec.height,w:spec.width,h:spec.height,vx:spec.speed,vy:-spec.jump};let landed=false;
  for(let t=0;t<1.5;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,level.platforms,1/120);if(p.grounded&&p.x+p.w>b.x&&p.x<b.x+b.w){landed=true;break;}}
  assert.ok(landed,'jump '+i);
 }
 for(const p of level.checkpoints)assert.ok(route.some(f=>p.x>=f.x&&p.x<f.x+f.w&&p.y+spec.height===f.y));
});
test('boss warning targets stay locked and attacks retain dodge counters',()=>{
 const p={x:5600,y:400,w:80,h:160,grounded:true};
 for(const attack of ['beam','shell','wave']){
  const b=createBoss(FORTRESS.boss);b.active=true;b.state='warning';b.attack=attack;b.timer=.1;b.targetX=5640;
  assert.equal(b.hazards.length,0);const shots=updateBoss(b,.2,p,()=>.5);
  if(attack==='beam'){assert.ok(overlaps(p,b.hazards[0]));const crouched={...p};setStance(crouched,true,160);assert.equal(overlaps(crouched,b.hazards[0]),false);}
  if(attack==='shell'){assert.equal(b.targetX,5640);assert.equal(overlaps({...p,x:5900},b.hazards[0]),false);}
  if(attack==='wave'){assert.equal(shots.length,1);assert.ok(shots[0].vx<0);assert.equal(overlaps({...p,y:300},shotBounds(shots[0])),false);}
 }
});
test('bursts emit exactly three or four aimed rounds with spaced cadence',()=>{
 for(const r of [0,.99]){
  const b=createBoss(FORTRESS.boss),p={x:5700,y:400,w:80,h:160};b.active=true;b.state='recover';b.timer=0;b.bag=['burst'];
  updateBoss(b,.01,p,()=>r);const count=b.rounds;assert.equal(count,r===0?3:4);assert.equal(b.state,'warning');
  const target=b.targetX;const times=[];let elapsed=0;
  while(elapsed<5&&b.state!=='recover'){const shots=updateBoss(b,.01,{...p,x:5900},()=>r);if(shots.length){times.push(elapsed);assert.ok(shots[0].vx<0);}elapsed+=.01;}
  assert.equal(times.length,count);assert.equal(b.targetX,target);
  for(let i=1;i<times.length;i++)assert.ok(times[i]-times[i-1]>=.27);
 }
});
test('boss patrol advances, retreats and leaves the player room',()=>{
 const b=createBoss(FORTRESS.boss),p={x:5580,y:400,w:80,h:160};let min=b.x,max=b.x;const directions=new Set();
 for(let i=0;i<7200;i++){updateBoss(b,1/120,p,()=>.5);min=Math.min(min,b.x);max=Math.max(max,b.x);directions.add(b.direction);assert.ok(b.x>=b.homeX-210-.01&&b.x<=b.homeX+50+.01);}
 assert.ok(min<b.homeX-150);assert.ok(max>b.homeX+30);assert.equal(directions.size,2);
 const x=b.x;b.dead=true;updateBoss(b,1,p);assert.equal(b.x,x);
});
test('attack bag includes bursts and random intervals vary',()=>{
 const snapshots=[];
 for(const r of [0,.99]){const b=createBoss(FORTRESS.boss),p={x:5600,y:400,w:80,h:160},attacks=[];b.active=true;
  for(let i=0;i<4;i++){b.state='recover';b.timer=0;updateBoss(b,.01,p,()=>r);attacks.push(b.attack);}
  assert.equal(new Set(attacks).size,4);snapshots.push(b.timer);
 }
 assert.notEqual(snapshots[0],snapshots[1]);
});
test('walk animation follows signed displacement and freezes for attacks and death',()=>{
 const b=createBoss(FORTRESS.boss),p={x:5580,y:400,w:80,h:160};
 updateBoss(b,.1,p,()=>.5);assert.ok(b.walkDistance<0);assert.ok(b.moving);
 b.direction=1;const before=b.walkDistance;updateBoss(b,.1,p,()=>.5);assert.ok(b.walkDistance>before);
 b.state='attack';b.timer=1;const stopped=b.walkDistance;updateBoss(b,.1,p,()=>.5);assert.equal(b.walkDistance,stopped);assert.equal(b.moving,false);
 hitBoss(b,999);updateBoss(b,1,p,()=>.5);assert.equal(b.walkDistance,stopped);
});
test('Garbin shots hit boss body; phase two accelerates and death clears damage',()=>{
 const b=createBoss(FORTRESS.boss);b.active=true;
 for(const crouch of [false,true]){const p={robot:'garbin',x:5700,y:400,w:80,h:160,face:1,grounded:true};setStance(p,crouch,160);const s=playerShot(p);s.x=b.x+150;assert.ok(overlaps(shotBounds(s),bossBounds(b)));assert.equal(s.damage,3);}
 hitBoss(b,95);b.state='recover';b.timer=0;updateBoss(b,.01,{x:5700,y:400,w:80,h:160},()=>.5);assert.ok(b.timer>=.75&&b.timer<=1.05);
 b.hazards=[{x:0}];assert.equal(hitBoss(b,100),true);assert.equal(b.hp,0);assert.equal(b.active,false);assert.deepEqual(b.hazards,[]);assert.deepEqual(updateBoss(b,10,{}),[]);
});
