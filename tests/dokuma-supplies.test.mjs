import test from 'node:test';
import assert from 'node:assert/strict';
import {createBoss,updateBoss} from '../dist/src/boss.js';
import {THRONE} from '../dist/src/chapter912.js';
import {hitDokumaDrone,updateBossDrop,dokumaSummonPose,dokumaPalm,SUMMON_WARNING} from '../dist/src/dokuma.js';
test('every second destroyed orb releases exactly one reachable supply',()=>{
 const b=createBoss(THRONE.boss);b.active=true;let count=0;
 for(let i=1;i<=6;i++){
  const d={x:i%2?b.left-400:b.right+400,y:80,hp:5};
  assert.equal(hitDokumaDrone(b,d,3),null);assert.equal(d.dead,undefined);
  const drop=hitDokumaDrone(b,d,3);assert.equal(d.dead,true);assert.equal(Boolean(drop),i%2===0);
  assert.equal(hitDokumaDrone(b,d,999),null);assert.equal(b.orbsDestroyed,i);
  if(drop){count++;assert.ok(drop.x>b.left&&drop.x+24<b.right);for(let t=0;t<5;t+=1/120)updateBossDrop(drop,1/120);assert.equal(drop.y,b.floor-32);}
 }
 assert.equal(count,3);
});
test('phase changes do not count cleared orbs and retry starts a fresh pair',()=>{
 const b=createBoss(THRONE.boss);b.active=true;b.phase=1;
 hitDokumaDrone(b,{x:b.left+100,y:300,hp:1},3);b.drones=[{hp:5},{hp:5}];b.hp=360;
 updateBoss(b,.01,{x:b.left+100,y:460,w:80,h:160});assert.equal(b.orbsDestroyed,1);assert.equal(b.drones.length,0);
 const fresh=createBoss(THRONE.boss);fresh.active=true;assert.equal(hitDokumaDrone(fresh,{x:fresh.left+100,y:300,hp:1},3),null);
});
test('clenched hands precede open hands and orbs leave palms before shooting',()=>{
 const b=createBoss(THRONE.boss),p={x:b.left+100,y:460,w:80,h:160};b.active=true;b.phase=1;b.state='recover';b.timer=0;b.attack='eyes';
 updateBoss(b,.01,p,()=>0);assert.equal(b.attack,'drones');assert.equal(b.timer,SUMMON_WARNING);
 updateBoss(b,.9,p);assert.equal(dokumaSummonPose(b).from,2);assert.equal(b.drones.length,0);
 updateBoss(b,.9,p);assert.equal(dokumaSummonPose(b).to,3);assert.equal(b.drones.length,3);
 for(const [i,d] of b.drones.entries()){assert.equal(d.x+32,dokumaPalm(b,i).x);assert.equal(d.y+32,dokumaPalm(b,i).y);}
 assert.deepEqual(updateBoss(b,.5,p),[]);assert.ok(b.drones.every(d=>d.entry>0&&d.entry<1));
 updateBoss(b,1,p);assert.ok(b.drones.every(d=>d.entry===1));
});
