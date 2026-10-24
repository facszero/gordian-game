import test from 'node:test';
import assert from 'node:assert/strict';
import {playerShot,shotBounds} from '../dist/src/combat.js';
import {drawPlayerShot,shotEffect,updateShotEffects} from '../dist/src/weapons.js';
test('visual identity survives switching robots and rendering preserves projectile physics in every direction',()=>{
 const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
 for(const [robot,power] of [['protesser',1],['dellinger',2],['garbin',3]])for(const charged of [false,true])for(const direction of ['left','right','up']){
  const player={robot,x:100,y:200,w:80,h:160,face:direction==='left'?-1:1,aimUp:direction==='up'};
  const shot=playerShot(player,charged),before=structuredClone(shot),box=shotBounds(shot);player.robot='protesser';
  drawPlayerShot(ctx,shot,1);assert.deepEqual(shot,before);assert.deepEqual(shotBounds(shot),box);assert.equal(shot.robot,robot);assert.equal(shot.damage,power*(charged?4:1));assert.equal(Math.hypot(shot.vx,shot.vy),charged?900:780);
  const fx=shotEffect(shot,'impact');assert.equal(fx.robot,robot);assert.equal(fx.angle,Math.atan2(shot.vy,shot.vx));assert.equal(updateShotEffects([fx],1).length,0);
 }
});
