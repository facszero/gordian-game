import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTER58,ECLIPSE} from '../dist/src/chapter58.js';
import {ROBOTS,GRAVITY,moveBody,overlaps} from '../dist/src/level.js';
import {createBoss,updateBoss,hitBoss,bossBounds,darkSword} from '../dist/src/boss.js';
import {enemySpec,groupForEnemy} from '../dist/src/enemies.js';
import {normalizeSave} from '../dist/src/campaign.js';
for(const level of CHAPTER58)test('level '+level.id+' has reachable route, supported checkpoints and available enemy groups',()=>{
 const route=level.platforms.filter(p=>p.w>=300),s=ROBOTS[level.robot];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],p={x:a.x+a.w-s.width-12,y:a.y-s.height,w:s.width,h:s.height,vx:s.speed,vy:-s.jump};let landed=false;
  for(let t=0;t<1.5;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,level.platforms,1/120);if(p.grounded&&p.x+p.w>b.x&&p.x<b.x+b.w){landed=true;break;}}
  assert.ok(landed,'gap '+i);
 }
 for(const p of level.checkpoints)assert.ok(route.some(f=>p.x>=f.x&&p.x<f.x+f.w&&p.y+s.height===f.y));
 for(const [i,[type]] of level.enemies.entries())assert.ok(enemySpec(type,level.id,groupForEnemy(level.id,i),level.robot).hp>0);
 assert.ok(route.some(p=>level.exit>=p.x&&level.exit<p.x+p.w));
});
test('dark boss teleports behind either facing, warns before firing, and never spawns on player at edges',()=>{
 for(const x of [6312,6800,7480])for(const face of [-1,1]){
  const b=createBoss(ECLIPSE.boss),p={x,y:460,w:80,h:160,face};
  b.active=true;b.state='recover';b.timer=0;b.bag=['ambush'];
  assert.deepEqual(updateBoss(b,.01,p,()=>.5),[]);assert.equal(b.hidden,true);assert.equal(b.hazards.length,0);
  const hp=b.hp;hitBoss(b,100);assert.equal(b.hp,hp);
  updateBoss(b,.46,p,()=>.5);assert.equal(b.hidden,false);assert.equal(b.state,'warning');assert.equal(overlaps(p,bossBounds(b)),false);
  if(x===6800)assert.equal(Math.sign((b.x+b.w/2)-(p.x+p.w/2)),-face);
  assert.ok(b.x>=b.left&&b.x+b.w<=b.right);
  assert.deepEqual(updateBoss(b,.5,p,()=>.5),[]);
  const shots=updateBoss(b,.8,p,()=>.5);assert.equal(shots.length,1);
  assert.equal(Math.sign(shots[0].vx),b.face);
 }
});
test('dark boss uses three attacks, exact burst counts, locked aim and phase two',()=>{
 for(const hp of [330,150]){
  const b=createBoss(ECLIPSE.boss),p={x:6800,y:460,w:80,h:160,face:1};b.active=true;b.hp=hp;
  const seen=new Set();
  for(let i=0;i<3;i++){
   b.state='recover';b.timer=0;updateBoss(b,.01,p,()=>.5);seen.add(b.attack);
   updateBoss(b,.5,p,()=>.5);const target=b.targetX;
   let shots=0;
   for(let j=0;j<400&&b.state!=='recover';j++)shots+=updateBoss(b,.01,{...p,x:7000},()=>.5).length;
   assert.equal(b.targetX,target);assert.equal(b.hazards.length,0);
   if(b.attack==='ambush')assert.equal(shots,hp===330?3:4);
  }
  assert.equal(seen.size,3);
 }
});
test('sword attacks are escapable and death removes hazards',()=>{
 const b=createBoss(ECLIPSE.boss);b.active=true;b.face=-1;b.attack='sword';
 const h=darkSword(b),p={x:h.x+50,y:b.floor-160,w:80,h:160};
 assert.ok(overlaps(p,h));assert.equal(overlaps({...p,y:p.y-180},h),false);
 b.attack='cleave';b.targetX=6900;const v=darkSword(b);assert.equal(overlaps({...p,x:7050},v),false);
 b.hazards=[v];assert.equal(hitBoss(b,999),true);assert.equal(b.hazards.length,0);assert.deepEqual(updateBoss(b,1,p,()=>.5),[]);
});
test('old chapter-four completion resumes campaign and chapter eight completes only after boss victory',()=>{
 assert.equal(normalizeSave({levelId:4,stage:'complete',bossDefeated:true}).stage,'transition');
 assert.equal(normalizeSave({levelId:8,stage:'complete',bossDefeated:false}).stage,'play');
 assert.equal(normalizeSave({levelId:8,stage:'complete',bossDefeated:true}).stage,'complete');
});
