import test from 'node:test';
import assert from 'node:assert/strict';
import {createCompanion,updateCompanion} from '../dist/src/companion.js';
import {LEVELS} from '../dist/src/level.js';
for(const level of LEVELS)test('companion clears terrain and exits screen in level '+level.id,()=>{
 const cat=createCompanion(level);let jumped=false,barrierCleared=false;
 while(cat.active&&cat.time<5){
  updateCompanion(cat,1/120,0);
  if(!cat.active)break;
  const floor=cat.floors.find(p=>cat.x>=p.x&&cat.x<=p.x+p.w);
  if(!floor){assert.ok(cat.frame>=4);jumped=true;}
  else assert.ok(cat.feet<=floor.y+.01);
  for(const b of level.barriers||[])if(cat.x>=b.x-40&&cat.x<=b.x+b.w+40){assert.ok(cat.feet<b.y);barrierCleared=true;}
 }
 assert.ok(jumped);assert.equal(cat.active,false);assert.ok(cat.time<3);
 assert.ok(cat.x-70>1360);if(level.barriers?.length)assert.ok(barrierCleared);
 const x=cat.x;updateCompanion(cat,1,1000);assert.equal(cat.x,x);
});
test('disabled companion stays inactive',()=>{
 const cat=createCompanion(LEVELS[0],false);updateCompanion(cat,1,0);assert.equal(cat.time,0);
});
