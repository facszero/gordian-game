import test from 'node:test';
import assert from 'node:assert/strict';
import {enemySpec,enemyMuzzle,ENEMY_GROUPS,ENEMY_GROUP_PLAN,groupForEnemy} from '../dist/src/enemies.js';
import {ROBOTS,overlaps} from '../dist/src/level.js';
import {playerShot,setStance,shotBounds} from '../dist/src/combat.js';

test('both ground enemy silhouettes can be hit from standing and crouching',()=>{
 for(const [type,robot,levelId] of [['turret','protesser',1],['armor','dellinger',2],['turret','garbin',4],['armor','garbin',4]]){
  const spec=enemySpec(type,levelId),unit=ROBOTS[robot],enemy={...spec,x:300,y:560-spec.h};
  for(const crouch of [false,true]){
   const p={robot,x:100,y:560-unit.height,w:unit.width,h:unit.height,face:1,grounded:true};
   setStance(p,crouch,unit.height);const shot=playerShot(p);shot.x=enemy.x+enemy.w/2;
   assert.ok(overlaps(shotBounds(shot),enemy),`${type}, crouch=${crouch}`);
  }
 }
});
test('muzzle follows enemy scale and facing; heavy variants are larger',()=>{
 for(const type of ['turret','drone','armor']){
  const enemy={...enemySpec(type,2),x:100,y:100};
  assert.ok(enemyMuzzle(enemy,-1).x<enemy.x);assert.ok(enemyMuzzle(enemy,1).x>enemy.x+enemy.w);
  assert.ok(enemyMuzzle(enemy,1).y>enemy.y&&enemyMuzzle(enemy,1).y<enemy.y+enemy.h);
 }
 assert.ok(enemySpec('drone',2).h>enemySpec('drone',1).h);
 assert.ok(enemySpec('armor',2).h>enemySpec('turret',1).h);
});

test('enemy groups remain separate early, mix from level five and retain planned six-group finale',()=>{
 assert.deepEqual(Object.keys(ENEMY_GROUPS).filter(id=>ENEMY_GROUPS[id].available),['A','B','C','D']);
 assert.equal(groupForEnemy(1),'A');assert.equal(groupForEnemy(2),'B');assert.equal(groupForEnemy(3),'C');
 assert.deepEqual([0,1,2,3].map(i=>groupForEnemy(5,i)),['A','B','C','A']);
 assert.equal(ENEMY_GROUP_PLAN[11].length,6);
 assert.equal(groupForEnemy(4),'D');assert.throws(()=>enemySpec('armor',8,'E'),/not implemented/);
 for(const group of ['A','B','C']){assert.equal(enemySpec('armor',2,group).group,group);assert.ok(enemySpec('drone',3,group,'protesser').h<enemySpec('drone',3,group,'dellinger').h);}
});
