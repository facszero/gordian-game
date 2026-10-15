import test from 'node:test';
import assert from 'node:assert/strict';
import {QUARRY,ROBOTS,GRAVITY,moveBody} from '../dist/src/level.js';
import {normalizeSave,blockHorizontal} from '../dist/src/campaign.js';
import {setStance,playerShot} from '../dist/src/combat.js';

test('Dellinger can reach every main quarry platform',()=>{
 const route=QUARRY.platforms.slice(0,8),spec=ROBOTS.dellinger;
 for(let i=0;i<route.length-1;i++){
  const from=route[i],to=route[i+1],p={x:from.x+from.w-65,y:from.y-spec.height,w:spec.width,h:spec.height,vx:spec.speed,vy:-spec.jump};
  let landed=false;
  for(let t=0;t<1.5;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,QUARRY.platforms,1/120);if(p.grounded&&p.x+p.w>to.x&&p.x<to.x+to.w){landed=true;break;}}
  assert.ok(landed,`quarry jump ${i+1}`);
 }
});
test('Dellinger stance keeps feet anchored and restores its full height',()=>{
 const p={x:0,y:440,w:55,h:120,grounded:true,face:1,robot:'dellinger'};
 setStance(p,true,120);assert.equal(p.y+p.h,560);assert.equal(p.h,64);
 setStance(p,false,120);assert.equal(p.y,440);assert.equal(p.h,120);
 assert.equal(playerShot(p).damage,2);assert.equal(playerShot(p,true).damage,8);
});
test('barriers stop horizontal motion until destroyed and support landing',()=>{
 const b={x:100,y:100,w:60,h:90},p={x:80,y:110,w:30,h:60,vx:240};
 blockHorizontal(p,65,[b]);assert.equal(p.x,70);assert.equal(p.vx,0);
 p.x=80;b.dead=true;blockHorizontal(p,65,[b]);assert.equal(p.x,80);
 const falling={x:110,y:0,w:30,h:50,vx:0,vy:300};moveBody(falling,[b],.2);assert.equal(falling.y,50);
});
test('save validation migrates v1 and preserves progression and transition',()=>{
 assert.equal(normalizeSave(null),null);
 assert.equal(normalizeSave({checkpoint:1,kills:4}).levelId,1);
 const save=normalizeSave({levelId:2,unlocked:2,checkpoint:1,kills:8,collected:[0,2,2,99],defeated:[1],destroyed:[0],stage:'complete'});
 assert.equal(save.levelId,2);assert.equal(save.unlocked,2);assert.equal(save.checkpoint,1);assert.deepEqual(save.collected,[0,2]);assert.equal(save.stage,'transition');
 assert.equal(normalizeSave({levelId:1,stage:'transition',unlocked:2}).stage,'transition');
 const invalid=normalizeSave({levelId:99,checkpoint:99,kills:-5,unlocked:99});assert.equal(invalid.levelId,1);assert.equal(invalid.checkpoint,1);assert.equal(invalid.kills,0);assert.equal(invalid.unlocked,4);
});
