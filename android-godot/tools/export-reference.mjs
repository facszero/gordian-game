import fs from 'node:fs';
import {LEVELS, ROBOTS, GRAVITY} from '../../dist/src/level.js';
import {enemySpec,groupForEnemy} from '../../dist/src/enemies.js';
import {NUCLEUS} from '../../dist/src/nucleus.js';
import {CRYODRAX,CRYO_REGIONS} from '../../dist/src/cryodrax.js';
import {victoryStory,epilogueStory} from '../../dist/src/story.js';
import {createCompanion} from '../../dist/src/companion.js';
import {INDUSTRIAL_REGIONS} from '../../dist/src/environment.js';
import {CHAPTER_STORY} from '../../dist/src/story.js';
import {couplingState} from '../../dist/src/coupling.js';
import {createBoss,updateBoss,bossBounds} from '../../dist/src/boss.js';
// Extended routes can replace the floor at the join; bind ground units to its actual surface.
function groundY(level,type,x,y,w){
 if(type==='drone')return y;
 const floors=level.platforms.filter(p=>x+w/2>=p.x&&x+w/2<=p.x+p.w&&p.y>=y-2);
 return floors.length?Math.min(...floors.map(p=>p.y)):y;
}
const root=new URL('../',import.meta.url);
const boss=createBoss(LEVELS[3].boss),player={x:5600,y:400,w:80,h:160},trace=[];
for(let frame=0;frame<3600;frame++){
  if(frame===1800)boss.hp=80;
  const shots=updateBoss(boss,1/60,player,()=>.37);
  if(frame%10===0||shots.length)trace.push({frame,x:boss.x,timer:boss.timer,state:boss.state,attack:boss.attack,walkDistance:boss.walkDistance,targetX:boss.targetX,targetY:boss.targetY,rounds:boss.rounds,hazards:boss.hazards.length,shots});
}
fs.mkdirSync(new URL('data/',root),{recursive:true});
fs.writeFileSync(new URL('data/boss-reference.json',root),JSON.stringify(trace));
const advanced=[];
for(const config of [LEVELS[7].boss,LEVELS[11].boss,NUCLEUS.boss,CRYODRAX.boss,...LEVELS[9].elites,...LEVELS[10].elites]) {
 const b=createBoss(config),p={x:b.left+180,y:b.floor-160,w:80,h:160,face:1},samples=[];
 for(let frame=0;frame<5400;frame++) {
  if(frame===1800)b.hp=b.maxHp*.5;
  if(frame===3600)b.hp=b.maxHp*.2;
  const shots=updateBoss(b,1/60,p,()=>.37);
  if(frame%15===0||shots.length)samples.push({frame,state:b.state,attack:b.attack,x:b.x,timer:b.timer,targetX:b.targetX,targetY:b.targetY,hidden:b.hidden,phase:b.phase||0,hazards:b.hazards,shots,bounds:bossBounds(b),drones:(b.drones||[]).length});
 }
 advanced.push({config,player:p,samples});
}
fs.writeFileSync(new URL('data/advanced-reference.json',root),JSON.stringify(advanced));
for(const level of [...LEVELS,NUCLEUS,CRYODRAX]) {
fs.writeFileSync(new URL(`data/level${level.id}.json`,root),JSON.stringify({...level,sourceCommit:'11439a2ef93966d3e5c8e7df9147a979d7e61f80',gravity:GRAVITY,robots:ROBOTS,robotSpec:ROBOTS[level.robot],story:CHAPTER_STORY[level.id]||[],nextTitle:LEVELS[level.id]?.title||'',nextRobot:LEVELS[level.id]?.robot||'',victories:Object.fromEntries(Object.keys(ROBOTS).map(r=>[r,victoryStory(level.id,r)])),epilogue:epilogueStory(!!level.extra),enemies:level.enemies.map(([type,x,y],id)=>({type,x,y:groundY(level,type,x,y,enemySpec(type,level.id,groupForEnemy(level.id,id),level.robot).w),id,...enemySpec(type,level.id,groupForEnemy(level.id,id),level.robot)})),companion:createCompanion(level)},null,2)+'\n');
console.log(`Level ${level.id}: ${level.platforms.length} platforms, ${level.enemies.length} enemies, ${level.checkpoints.length} checkpoints, ${level.pickups.length} cells`);
}
fs.writeFileSync(new URL('data/coupling-reference.json',root),JSON.stringify(Array.from({length:1321},(_,i)=>({time:i/120,...couplingState(i/120)}))));
const grid=(rows)=>Array.from({length:rows*4},(_,i)=>[i%4/4,Math.floor(i/4)/rows,1/4,1/rows]);
fs.writeFileSync(new URL('data/atlas-spec.json',root),JSON.stringify({protesser:{key:'green',regions:grid(2)},'enemy-army':{key:'magenta',regions:grid(2)},'coupling-front':{key:'green',regions:grid(3),preserve:true},'industrial-props':{key:'magenta',regions:INDUSTRIAL_REGIONS},stations:{key:'magenta',regions:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]},'energy-atom':{key:'magenta',regions:[[0,0,1,1]]},companion:{key:'magenta',regions:[[0,0,.285,.5],[.285,0,.22,.5],[.505,0,.24,.5],[.745,0,.255,.5],[0,.5,.255,.5],[.255,.5,.285,.5],[.54,.5,.23,.5],[.77,.5,.23,.5]]}},null,2));
const atlas=JSON.parse(fs.readFileSync(new URL('data/atlas-spec.json',root)));
atlas.dellinger={key:'green',regions:grid(2)};
atlas['enemy-group-b']={key:'magenta',regions:grid(2)};
atlas['industrial-crates']={key:'magenta',regions:[[0,0,.5,1],[.5,0,.5,1]]};
fs.writeFileSync(new URL('data/atlas-spec.json',root),JSON.stringify(atlas,null,2));

for (const name of ['enemy-group-c','enemy-group-d']) atlas[name]={key:'magenta',regions:grid(2)};
// C's lower robots begin above the sheet midpoint. Keep their antennae out
// of the upper row; otherwise the crop makes the grounded sentry float.
atlas['enemy-group-c'].regions=Array.from({length:8},(_,i)=>[i%4/4,i<4?0:.4375,.25,i<4?.4375:.5625]);
atlas.garbin={key:'green',regions:[[0,0,.25,.305],[.25,0,.25,.305],[.5,0,.25,.305],[.75,0,.25,.305],[0,.305,.24,.325],[.24,.305,.26,.325],[.5,.305,.25,.325],[.75,.305,.25,.325],[0,.63,.265,.37],[.265,.63,.27,.37],[.535,.63,.25,.37],[.785,.63,.215,.37]]};
atlas['garbin-up']={key:'magenta',regions:[[0,0,.5,1],[.5,0,.5,1]]};
atlas['boss-scorpion']={key:'magenta',regions:[[0,0,1,1]]};
atlas['boss-walk']={key:'magenta',regions:[[0,.016,.5,.467],[.5,.016,.5,.467],[0,.516,.5,.467],[.5,.516,.5,.467]],preserve:true};
for(const name of ['enemy-group-e','enemy-group-f']) atlas[name]={key:'magenta',regions:grid(2)};
atlas['enemy-group-f'].regions=Array.from({length:8},(_,i)=>[i%4/4,i<4?0:.45,.25,i<4?.45:.55]);
atlas['dark-dellinger']={key:'magenta',regions:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]};
atlas.dokuma={key:'magenta',regions:[[0,0,.53,.5],[.53,0,.47,.5],[0,.5,.53,.5],[.53,.5,.47,.5]]};
atlas['dokuma-summon']={key:'magenta',regions:[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],preserve:true};
atlas['dokuma-punch']={key:'magenta',regions:Array.from({length:6},(_,i)=>[i%3/3,Math.floor(i/3)/2,1/3,.5]),preserve:true};
atlas['nucleus-parts']={key:'green',regions:[[0,0,.642,1],[.642,0,.358,1]]};
atlas['nucleus-rage']={key:'green',regions:[[.642,0,.358,1]]};
atlas['cryo-parts']={key:'green',regions:CRYO_REGIONS};
fs.writeFileSync(new URL('data/atlas-spec.json',root),JSON.stringify(atlas,null,2));
