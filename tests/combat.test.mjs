import test from 'node:test';
import assert from 'node:assert/strict';
import {setStance,playerShot,shotBounds} from '../dist/src/combat.js';
import {overlaps,moveBody} from '../dist/src/level.js';
const robot=()=>({x:100,y:470,w:38,h:90,face:1,grounded:true,vx:0,vy:0});
test('crouch dodges a high shot but remains vulnerable to low shots',()=>{
 const p=robot(),high={x:120,y:495,w:13,h:10},low={x:120,y:540,w:13,h:10};
 assert.ok(overlaps(p,shotBounds(high)));
 setStance(p,true);assert.equal(p.y+p.h,560);assert.equal(p.h,48);
 assert.equal(overlaps(p,shotBounds(high)),false);assert.ok(overlaps(p,shotBounds(low)));
 moveBody(p,[{x:0,y:560,w:500}],1/120);assert.equal(p.grounded,true);
 setStance(p,false);assert.equal(p.y,470);assert.equal(p.h,90);
});
test('stance is stable over repeated updates and cannot crouch in midair',()=>{
 const p=robot();for(let i=0;i<100;i++)setStance(p,true);assert.equal(p.y+p.h,560);
 p.grounded=false;setStance(p,true);assert.equal(p.h,90);assert.equal(p.crouching,false);assert.equal(p.y,470);
});
test('up directs normal and charged shots vertically regardless of facing',()=>{
 for(const face of [-1,1])for(const charged of [false,true]){
  const p={...robot(),face,aimUp:true};const s=playerShot(p,charged);
  assert.equal(s.vx,0);assert.ok(s.vy<0);assert.ok(s.h>s.w);
  assert.equal(s.damage,charged?4:1);assert.ok(s.y<p.y);
  s.y-=100;assert.ok(overlaps(shotBounds(s),{x:100,y:340,w:38,h:40}));
 }
});
test('horizontal crouched shot originates lower; releasing up restores facing direction',()=>{
 const p=robot(),standing=playerShot(p);setStance(p,true);const crouched=playerShot(p);
 assert.ok(crouched.y>standing.y);assert.equal(crouched.vy,0);
 p.aimUp=true;assert.ok(playerShot(p).vy<0);p.aimUp=false;p.face=-1;
 assert.ok(playerShot(p).vx<0);assert.equal(playerShot(p).vy,0);
});
