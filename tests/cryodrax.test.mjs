import test from 'node:test';
import assert from 'node:assert/strict';
import {CRYODRAX,cryoPose,cryoBounds,cryoMuzzles,drawCryodrax} from '../dist/src/cryodrax.js';
import {createBoss,updateBoss,hitBoss} from '../dist/src/boss.js';
import {normalizeSave,bonusLevelFor} from '../dist/src/campaign.js';
import {ROBOTS,overlaps} from '../dist/src/level.js';
import {playerShot,shotBounds} from '../dist/src/combat.js';
test('winning robot selects one exclusive extra and extra saves retain id 14',()=>{
 assert.equal(bonusLevelFor('garbin'),null);assert.equal(bonusLevelFor('dellinger'),13);assert.equal(bonusLevelFor('protesser'),14);
 const s=normalizeSave({levelId:14,unlocked:14,stage:'complete',bossDefeated:true,victoryRobot:'protesser'});
 assert.equal(s.levelId,14);assert.equal(s.unlocked,12);assert.equal(s.stage,'complete');
});
test('Cryodrax telegraphs three attacks, fires ice and stops all drawing after defeat',()=>{
 const b=createBoss(CRYODRAX.boss),p={x:150,y:400,w:80,h:160};const attacks=new Set();let beams=0,shards=0,maxJaw=0;
 for(let i=0;i<7000;i++){
  const shots=updateBoss(b,1/120,p);maxJaw=Math.max(maxJaw,b.jaw||0);if(b.state==='warning')attacks.add(b.attack);
  for(const s of shots){assert.ok(Number.isFinite(s.vx)&&Number.isFinite(s.vy)&&s.ice);assert.ok(s.w>0&&s.h>0);if(s.iceBeam)beams++;else shards++;}
 }
 assert.deepEqual([...attacks],['chest','mouth','eyes']);assert.ok(beams>=3&&shards>20&&maxJaw>.3);
 b.state='warning';b.timer=.4;const target=[b.targetX,b.targetY,b.headAngle];updateBoss(b,.1,{...p,x:600,y:100});assert.deepEqual([b.targetX,b.targetY,b.headAngle],target);
 hitBoss(b,999);assert.deepEqual(updateBoss(b,1,p),[]);let draws=0;drawCryodrax({drawImage(){draws++;}},b,[{},{},{}]);assert.equal(draws,0);
});
test('torso and neck accompany aim and recoil without snapping',()=>{
 const b=createBoss(CRYODRAX.boss),p={x:100,y:500,w:80,h:160};updateBoss(b,.01,p);
 const before=cryoPose(b),ports=cryoMuzzles(b);updateBoss(b,1/120,{...p,y:100});
 assert.notEqual(cryoPose(b).angle,before.angle);assert.notDeepEqual(cryoMuzzles(b).eyes,ports.eyes);
 b.state='warning';b.attack='chest';b.timer=.001;b.rounds=1;updateBoss(b,.01,p);
 const firing=cryoPose(b);updateBoss(b,1/120,p);const after=cryoPose(b);
 assert.ok(after.x>firing.x);assert.ok(Math.abs(after.x-firing.x)<2);
});
test('all robots can hit the moving chest from the main platform',()=>{
 for(const [robot,s] of Object.entries(ROBOTS)){
  const b=createBoss(CRYODRAX.boss);b.active=true;b.lean=1;b.headAngle=-.25;
  const p={robot,x:100,y:560-s.height,w:s.width,h:s.height,face:1};const shot=playerShot(p,false);shot.x=cryoMuzzles(b).chest.x;
  assert.ok(overlaps(shotBounds(shot),cryoBounds(b)),robot);
 }
});
