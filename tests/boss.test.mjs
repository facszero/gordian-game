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
test('boss warnings precede attacks, lock targets and offer crouch/jump/move counters',()=>{
 const b=createBoss(FORTRESS.boss),p={x:5600,y:400,w:80,h:160,grounded:true};
 updateBoss(b,.1,{...p,x:5000});assert.equal(b.active,false);
 updateBoss(b,.1,p);assert.equal(b.active,true);assert.equal(b.state,'recover');
 updateBoss(b,2,p);assert.equal(b.state,'warning');assert.equal(b.hazards.length,0);
 updateBoss(b,2,p);assert.ok(overlaps(p,b.hazards[0]));setStance(p,true,160);assert.equal(overlaps(p,b.hazards[0]),false);
 updateBoss(b,1,p);updateBoss(b,2,p);assert.equal(b.attack,'shell');const target=b.targetX;p.x+=220;
 updateBoss(b,2,p);assert.equal(b.targetX,target);assert.equal(overlaps(p,b.hazards[0]),false);
 updateBoss(b,1,p);updateBoss(b,2,p);assert.equal(b.attack,'wave');const shots=updateBoss(b,2,p);assert.equal(shots.length,1);assert.ok(shots[0].vx<0);
 p.y=300;assert.equal(overlaps(p,shotBounds(shots[0])),false);
});
test('Garbin shots hit boss body; phase two accelerates and death clears damage',()=>{
 const b=createBoss(FORTRESS.boss);b.active=true;
 for(const crouch of [false,true]){const p={robot:'garbin',x:5700,y:400,w:80,h:160,face:1,grounded:true};setStance(p,crouch,160);const s=playerShot(p);s.x=b.x+150;assert.ok(overlaps(shotBounds(s),bossBounds(b)));assert.equal(s.damage,3);}
 hitBoss(b,95);b.state='recover';b.timer=0;updateBoss(b,.01,{x:5700,w:80});assert.equal(b.timer,.95);
 b.hazards=[{x:0}];assert.equal(hitBoss(b,100),true);assert.equal(b.hp,0);assert.equal(b.active,false);assert.deepEqual(b.hazards,[]);assert.deepEqual(updateBoss(b,10,{}),[]);
});
