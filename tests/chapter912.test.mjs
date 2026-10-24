import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTER912,LEGION,SHADOWS,THRONE} from '../dist/src/chapter912.js';
import {ROBOTS,GRAVITY,moveBody,overlaps} from '../dist/src/level.js';
import {createBoss,updateBoss,hitBoss,bossBounds} from '../dist/src/boss.js';
import {groupForEnemy} from '../dist/src/enemies.js';
import {normalizeSave} from '../dist/src/campaign.js';
for(const level of CHAPTER912)test('final chapter route '+level.id+' supports jumps, checkpoints and six mixed groups',()=>{
 const route=level.platforms.filter(p=>p.w>=300),s=ROBOTS[level.robot];
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],p={x:a.x+a.w-s.width-12,y:a.y-s.height,w:s.width,h:s.height,vx:s.speed,vy:-s.jump};let landed=false;
  for(let t=0;t<1.5;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,level.platforms,1/120);if(p.grounded&&p.x+p.w>b.x&&p.x<b.x+b.w){landed=true;break;}}
  assert.ok(landed,'gap '+i);
 }
 for(const p of level.checkpoints)assert.ok(route.some(f=>p.x>=f.x&&p.x<f.x+f.w&&p.y+s.height===f.y));
 assert.equal(new Set(level.enemies.map((_,i)=>groupForEnemy(level.id,i))).size,6);
 assert.ok(level.enemies.length>=24,'enemies: '+level.enemies.length);
});
test('two recolored elites per level have one-third power and validated defeat persistence',()=>{
 for(const [level,hp] of [[LEGION,180],[SHADOWS,330]]){
  assert.equal(level.elites.length,2);
  for(const b of level.elites){assert.equal(b.hp,hp/3);assert.equal(b.damageScale,1/3);assert.ok(b.tint);assert.ok(level.checkpoints.some(p=>p.x<b.trigger&&p.x>b.left-100));}
  assert.deepEqual(normalizeSave({levelId:level.id,elitesDefeated:[0,0,1,2,-1]}).elitesDefeated,[0,1]);
 }
});
test('Dokuma shifts through three phases, locks warnings, bounds drones, and clears everything on death',()=>{
 const b=createBoss(THRONE.boss),p={x:6200,y:460,w:80,h:160,face:1};
 updateBoss(b,.01,p);assert.equal(b.phase,1);
 for(const [hp,phase,attack] of [[540,1,'drones'],[350,2,'fist'],[170,3,'tentacles']]){
  b.hp=hp;updateBoss(b,.01,p);assert.equal(b.phase,phase);
  b.state='recover';b.timer=0;b.attack='eyes';updateBoss(b,.01,p,()=>0);
  assert.equal(b.attack,attack);assert.equal(b.state,'warning');assert.equal(b.hazards.length,0);
  const target=b.targetX;updateBoss(b,.4,{...p,x:6500});assert.equal(b.targetX,target);assert.equal(b.hazards.length,0);
  updateBoss(b,1.5,p);assert.equal(b.state,'attack');
  if(phase===1)assert.equal(b.drones.length,3);else assert.ok(b.hazards.length);
  updateBoss(b,1,p);assert.equal(b.hazards.length,0);
 }
 b.drones=[{}];b.hazards=[{}];hitBoss(b,999);assert.deepEqual(b.drones,[]);assert.deepEqual(b.hazards,[]);assert.deepEqual(updateBoss(b,1,p),[]);
});
test('Dokuma eyes, fists and tentacles have distinct dodge counters and a reachable reactor',()=>{
 const b=createBoss(THRONE.boss),p={x:6200,y:460,w:80,h:160,face:1};b.active=true;b.phase=2;b.hp=350;
 for(const attack of ['eyes','fist','tentacles']){
  b.state='warning';b.attack=attack;b.timer=0;b.targetX=p.x+40;updateBoss(b,.01,p);
  assert.ok(overlaps(p,b.hazards[0]));
  const escaped=attack==='eyes'?{...p,y:535,h:85}:attack==='fist'?{...p,x:p.x+240}:{...p,y:p.y-160};
  assert.equal(overlaps(escaped,b.hazards[0]),false);
 }
 assert.ok(overlaps({x:bossBounds(b).x,y:510,w:30,h:20},bossBounds(b)));
 assert.equal(normalizeSave({levelId:12,stage:'complete',bossDefeated:true}).stage,'complete');
});
