import test from 'node:test';
import assert from 'node:assert/strict';
import {NUCLEUS,nucleusBounds,nucleusMuzzles,drawNucleus} from '../dist/src/nucleus.js';
import {createBoss,updateBoss,hitBoss} from '../dist/src/boss.js';
import {normalizeSave} from '../dist/src/campaign.js';
import {ROBOTS,moveBody,GRAVITY,overlaps} from '../dist/src/level.js';
import {playerShot,shotBounds} from '../dist/src/combat.js';
test('nucleus cycles all three telegraphed attacks, locks aim and stops after defeat',()=>{
 const b=createBoss(NUCLEUS.boss),p={x:140,y:520,w:80,h:160};const attacks=new Set();let count=0;
 for(let i=0;i<5000;i++){
  const shots=updateBoss(b,1/120,p);count+=shots.length;
  if(b.state==='warning')attacks.add(b.attack);
  for(const s of shots)assert.ok(Number.isFinite(s.vx)&&Number.isFinite(s.vy)&&s.boss&&s.nucleus);
 }
 assert.deepEqual([...attacks],['chest','eyes','shoulders']);assert.ok(count>15);
 b.state='warning';b.attack='eyes';b.timer=.25;const target=b.targetX,angle=b.headAngle;
 updateBoss(b,.1,{...p,x:900});assert.equal(b.targetX,target);assert.equal(b.headAngle,angle);
 b.hp=90;updateBoss(b,.01,p);assert.equal(b.phase,3);
 hitBoss(b,999);assert.deepEqual(updateBoss(b,1,p),[]);
 let draws=0;drawNucleus({drawImage(){draws++;}},b,[{},{}]);assert.equal(draws,0);
});
test('head tracks smoothly and shot origins follow its transform',()=>{
 const b=createBoss(NUCLEUS.boss),p={x:150,y:500,w:80,h:160};updateBoss(b,.01,p);
 const a=b.headAngle,m=nucleusMuzzles(b).eyes;updateBoss(b,1/120,{...p,y:100});
 assert.ok(Math.abs(b.headAngle-a)<.03);assert.notDeepEqual(nucleusMuzzles(b).eyes,m);
});
test('all reserve robots can climb to the reactor firing platform and hit it',()=>{
 for(const [robot,s] of Object.entries(ROBOTS)){
  const p={robot,x:100,y:680-s.height,w:s.width,h:s.height,vx:0,vy:-s.jump,face:1};let landed=false;
  for(let i=0;i<240;i++){
   p.vy+=GRAVITY/120;moveBody(p,NUCLEUS.platforms,1/120);
   if(p.grounded&&p.y+p.h===560){landed=true;break;}
  }
  assert.ok(landed,robot+' platform');
  const shot=playerShot(p,false);shot.x=850;
  assert.ok(overlaps(shotBounds(shot),nucleusBounds(NUCLEUS.boss)),robot+' reactor');
 }
});
test('extra saves remain outside campaign progression and retain the winning robot',()=>{
 const s=normalizeSave({levelId:13,unlocked:13,bossDefeated:true,stage:'complete',victoryRobot:'dellinger'});
 assert.equal(s.levelId,13);assert.equal(s.unlocked,12);assert.equal(s.stage,'complete');assert.equal(s.victoryRobot,'dellinger');
 assert.equal(normalizeSave({levelId:12,victoryRobot:'invalid'}).victoryRobot,null);
});
