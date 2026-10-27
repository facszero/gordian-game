import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,LEVEL,QUARRY,TUNNELS,FORTRESS,ROBOTS,GRAVITY,moveBody} from '../dist/src/level.js';
import {CHAPTER58} from '../dist/src/chapter58.js';
import {CHAPTER912} from '../dist/src/chapter912.js';
const originals=[LEVEL,QUARRY,TUNNELS,FORTRESS,...CHAPTER58,...CHAPTER912];
for(const level of LEVELS)test(`extended campaign route ${level.id}: distance, supplies and traversability`,()=>{
 const original=originals[level.id-1];
 if(original.boss){assert.equal(level,original);return;}
 assert.equal(level.exit-level.spawn.x,2*(original.exit-original.spawn.x));
 assert.equal(level.enemies.length,original.enemies.length*2);
 assert.equal(level.pickups.length,original.pickups.length*2);
 assert.deepEqual(level.enemies.slice(0,original.enemies.length),original.enemies);
 assert.deepEqual(level.checkpoints.slice(0,original.checkpoints.length),original.checkpoints);
 const route=level.platforms.filter(p=>p.w>=300).sort((a,b)=>a.x-b.x),s=ROBOTS[level.robot];
 assert.ok(route.some(p=>level.exit>=p.x&&level.exit<p.x+p.w));
 for(const cp of level.checkpoints)assert.ok(route.some(p=>cp.x>=p.x&&cp.x+s.width<=p.x+p.w&&cp.y+s.height===p.y),'supported checkpoint');
 for(let i=0;i<route.length-1;i++){
  const a=route[i],b=route[i+1],p={x:a.x+a.w-s.width-12,y:a.y-s.height,w:s.width,h:s.height,vx:s.speed,vy:-s.jump};let landed=false;
  for(let t=0;t<2;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,level.platforms,1/120);if(p.grounded&&p.x+p.w>b.x&&p.x<b.x+b.w){landed=true;break;}}
  assert.ok(landed,`unreachable section ${i}: ${a.x} to ${b.x}`);
 }
 for(const b of level.elites){
  assert.ok(route.some(p=>b.left>=p.x&&b.right<=p.x+p.w&&p.y===b.floor));
  assert.ok(level.checkpoints.some(p=>p.x<b.trigger&&p.x>b.left-100));
 }
});
