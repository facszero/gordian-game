import fs from 'node:fs';
import {LEVELS, ROBOTS, GRAVITY} from '../../dist/src/level.js';
import {enemySpec} from '../../dist/src/enemies.js';
import {createCompanion} from '../../dist/src/companion.js';
import {INDUSTRIAL_REGIONS} from '../../dist/src/environment.js';
import {CHAPTER_STORY} from '../../dist/src/story.js';
import {couplingState} from '../../dist/src/coupling.js';
const root=new URL('../',import.meta.url);
fs.mkdirSync(new URL('data/',root),{recursive:true});
for(const level of LEVELS.slice(0,2)) {
fs.writeFileSync(new URL(`data/level${level.id}.json`,root),JSON.stringify({...level,sourceCommit:'11439a2ef93966d3e5c8e7df9147a979d7e61f80',gravity:GRAVITY,robotSpec:ROBOTS[level.robot],story:CHAPTER_STORY[level.id],nextTitle:LEVELS[level.id].title,enemies:level.enemies.map(([type,x,y],id)=>({type,x,y,id,...enemySpec(type,level.id)})),companion:createCompanion(level)},null,2)+'\n');
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
