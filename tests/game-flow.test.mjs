import * as dokumaArt from '../dist/src/dokuma.js';
import * as bossLogic from '../dist/src/boss.js';
import * as companionArt from '../dist/src/companion.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as enemyDesign from '../dist/src/enemies.js';
import * as environmentArt from '../dist/src/environment.js';
import * as level from '../dist/src/level.js';
import * as combat from '../dist/src/combat.js';
import * as coupling from '../dist/src/coupling.js';
import * as campaign from '../dist/src/campaign.js';

// Exercise the actual game loop without a rendering surface or audio device.
function game(){
 const nodes=new Map(),storage=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},hidden:true,textContent:'',value:id==='dev-phase'?'1':'2',focus(){},getContext(){return {};}});return nodes.get(id);};
 const context=vm.createContext({...bossLogic,...dokumaArt,...companionArt,...environmentArt,...enemyDesign,...level,...combat,...campaign,...coupling,DEVELOPMENT_MODE:true,updateBoss:(b,dt,p)=>bossLogic.updateBoss(b,dt,p,()=>.5),
  document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},
  window:{addEventListener(){}},matchMedia:()=>({matches:false}),innerHeight:720,innerWidth:1280,
  navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame(){},Image:class {},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
 });
 vm.runInContext(fs.readFileSync(new URL('../dist/src/game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''),context);
 return code=>vm.runInContext(code,context);
}

test('final chapter advances through all robots, persists elite kills and ends only after Dokuma',()=>{
 const run=game();run('reset(false,8);boss.active=true;hitBoss(boss,999);completeLevel();reset(true);finishTransition()');
 assert.equal(run('LEVEL.id'),9);assert.equal(run('player.robot'),'protesser');
 run('completeLevel();finishTransition()');assert.equal(run('LEVEL.id'),10);assert.equal(run('player.robot'),'dellinger');
 run('completeLevel()');assert.equal(run('mode'),'play');
 run('elites[0].active=true;hitBoss(elites[0],999);save();reset(true);elites[1].active=true;elites[1].hp=1;respawn()');
 assert.equal(run('elites[0].dead'),true);assert.equal(run('elites[1].hp'),60);
 run('elites[1].active=true;hitBoss(elites[1],999);completeLevel();reset(true);finishTransition()');assert.equal(run('LEVEL.id'),11);assert.equal(run('player.robot'),'garbin');
 run('for(const e of elites){e.active=true;hitBoss(e,999);}completeLevel();finishTransition()');assert.equal(run('LEVEL.id'),12);
 run('completeLevel()');assert.equal(run('mode'),'play');
 run('boss.active=true;hitBoss(boss,999);completeLevel();reset(true)');assert.equal(run('mode'),'end');assert.equal(run('saved().stage'),'complete');
});

test('Dokuma preview, damage, pause and retry run through the actual game loop',()=>{
 const run=game();run("$('dev-boss-final').onclick();update(1/120);pause()");const timer=run('boss.timer');
 run('update(1)');assert.equal(run('boss.timer'),timer);
 run('resume();player.x=6500;player.y=460;fire(true);for(let i=0;i<60;i++)update(1/120)');assert.ok(run('boss.hp')<540);
 run('respawn()');assert.equal(run('boss.hp'),540);assert.equal(run('boss.active'),false);
 run('boss.active=true;hitBoss(boss,999);dokumaFrames=[{}];drawBoss()');assert.equal(run('boss.dead'),true);
});
test('finishing level one transitions and automatically enters Dellinger level',()=>{
 const run=game();run('reset();mode="play";player.x=LEVEL.exit+1;update(1/120)');
 assert.equal(run('mode'),'transition');assert.equal(run('saved().stage'),'transition');
 run('pause();update(1)');assert.equal(run('transitionTime'),0);run('resume();update(COUPLING_DURATION)');
 assert.equal(run('LEVEL.id'),2);assert.equal(run('player.robot'),'dellinger');assert.equal(run('player.health'),150);
 assert.equal(run('saved().levelId'),2);assert.equal(run('mode'),'play');
});
test('reload during transition and skip both recover into the second level',()=>{
 const run=game();run('reset();beginTransition();reset(true)');assert.equal(run('mode'),'transition');
 run("$('skip').onclick()");assert.equal(run('LEVEL.id'),2);assert.equal(run("$('skip').hidden"),true);
});
test('development selector, restart, death and continue retain Dellinger',()=>{
 const run=game();run("$('start').onclick();player.grounded=true;keys.add('crouch');update(1/120)");
 assert.equal(run('player.h'),64);run('player.health=0;respawn()');assert.equal(run('player.h'),120);assert.equal(run('player.health'),150);
 run('checkpoint=1;save();reset(true)');assert.equal(run('player.x'),4960);assert.equal(run('LEVEL.id'),2);
 run("$('restart').onclick()");assert.equal(run('LEVEL.id'),2);assert.equal(run('checkpoint'),-1);
});
test('four-level progression, new transition saves and boss victory persist',()=>{
 const run=game();run('reset(false,2);player.x=LEVEL.exit+1;update(1/120)');assert.equal(run('mode'),'transition');
 run('reset(true)');assert.equal(run('mode'),'transition');run('finishTransition()');assert.equal(run('LEVEL.id'),3);assert.equal(run('player.robot'),'protesser');
 run('player.x=LEVEL.exit+1;update(1/120)');assert.equal(run('mode'),'transition');run('reset(true);finishTransition()');assert.equal(run('LEVEL.id'),4);assert.equal(run('player.robot'),'garbin');
 run('completeLevel()');assert.notEqual(run('mode'),'end');
 run('boss.active=true;hitBoss(boss,999);save();reset(true)');assert.equal(run('boss.dead'),true);
 run('player.x=LEVEL.exit+1;update(1/120)');assert.equal(run('mode'),'transition');run('reset(true)');assert.equal(run('mode'),'transition');
 run("$('again').onclick()");assert.equal(run('LEVEL.id'),4);assert.equal(run('boss.dead'),false);
});
test('boss preview, pause, death and charged damage use the actual game loop',()=>{
 const run=game();run("$('dev-boss').onclick()");assert.equal(run('checkpoint'),1);assert.equal(run('player.x'),5580);
 run('player.x=5600;update(1/120);pause()');const timer=run('boss.timer');run('update(1)');assert.equal(run('boss.timer'),timer);
 run('resume();player.x=6050;fire(true);for(let i=0;i<25;i++)update(1/120)');assert.ok(run('boss.hp')<180);
 run('damage(999);respawn()');assert.equal(run('boss.hp'),180);assert.equal(run('boss.active'),false);assert.equal(run('player.x'),5380);
});
test('first boss can be defeated with real Garbin shots and opens the exit',()=>{
 const run=game();run("$('dev-boss').onclick();player.x=5800;keys.add('fire');for(let i=0;i<3000;i++)update(1/120)");
 assert.equal(run('boss.dead'),true);assert.ok(run('player.health')>0);assert.equal(run('saved().bossDefeated'),true);
 run('player.x=LEVEL.exit+1;update(1/120)');assert.equal(run('mode'),'transition');
});
test('Dellinger shots destroy barriers through the real collision loop',()=>{
 const run=game();run('reset(false,2);player.x=350;player.y=440;fire(true);for(let i=0;i<15;i++)update(1/120)');
 assert.equal(run('barriers[0].dead'),true);assert.equal(run('saved().destroyed[0]'),0);
});

for(const id of [1,2,4])for(const input of ['keys','touch'])test(`level ${id}: ${input} gets one extra jump per landing, never on hold`,()=>{
 const run=game();run(`reset(false,${id});mode='play';update(1/120);${input}.add('jump');update(1/120)`);
 assert.ok(run('player.vy')<0);assert.equal(run('airJumpsLeft'),1);
 run('for(let i=0;i<12;i++)update(1/120)');assert.equal(run('airJumpsLeft'),1);
 run(`${input}.delete('jump');update(1/120)`);const before=run('player.vy');
 run(`${input}.add('jump');update(1/120)`);assert.equal(run('airJumpsLeft'),0);assert.ok(run('player.vy')<before);
 run(`for(let i=0;i<12;i++)update(1/120);${input}.delete('jump');update(1/120)`);const third=run('player.vy');
 run(`${input}.add('jump');update(1/120)`);assert.ok(run('player.vy')>third);assert.equal(run('airJumpsLeft'),0);
 run(`${input}.clear();for(let i=0;i<300&&!player.grounded;i++)update(1/120);update(1/120)`);
 assert.equal(run('player.grounded'),true);assert.equal(run('airJumpsLeft'),1);
 run('airJumpsLeft=0;respawn()');assert.equal(run('airJumpsLeft'),1);assert.equal(run('jumpBuffer'),0);
});
test('a defeated boss draws nothing, including after loading a saved victory',()=>{
 const run=game();run('reset(false,4);boss.active=true;hitBoss(boss,999);bossSprite={};drawBoss();save();reset(true);drawBoss()');
 // Rendering context deliberately has no draw methods: any ghost draw would throw.
 assert.equal(run('boss.dead'),true);
});
test('chapters 4 through 8 retain robot, transitions, save and final victory',()=>{
 const run=game();run('reset(false,4);boss.active=true;hitBoss(boss,999);completeLevel();reset(true)');
 for(let id=5;id<=8;id++){
  assert.equal(run('mode'),'transition');run("$('skip').onclick()");
  assert.equal(run('LEVEL.id'),id);assert.equal(run('player.robot'),id%2?'dellinger':'garbin');
  assert.equal(run('saved().levelId'),id);
  if(id<8)run('completeLevel();reset(true)');
 }
 run('completeLevel()');assert.equal(run('mode'),'play');
 run('boss.active=true;hitBoss(boss,999);darkFrames=[{}];drawBoss();save();reset(true);drawBoss();completeLevel()');
 assert.equal(run('mode'),'transition');run('reset(true)');assert.equal(run('mode'),'transition');
 run("$('again').onclick()");assert.equal(run('LEVEL.id'),8);assert.equal(run('boss.hp'),330);
});
test('dark boss preview, pause, respawn and shots from either side use the real loop',()=>{
 const run=game();run("$('dev-boss-two').onclick();update(1/120);pause()");
 const timer=run('boss.timer');run('update(1)');assert.equal(run('boss.timer'),timer);
 run('resume();respawn()');assert.equal(run('boss.hp'),330);assert.equal(run('checkpoint'),1);assert.equal(run('boss.active'),false);
 for(const face of [-1,1]){
  run(`boss.active=true;boss.hidden=false;boss.state='recover';boss.timer=5;boss.x=7000;player.x=${face===1?6840:7310};player.y=460;player.face=${face};shots=[];shotCooldown=0;fire(true);for(let i=0;i<30;i++)update(1/120)`);
 }
 assert.equal(run('boss.hp'),306);
 run('boss.active=true;boss.hidden=true;boss.state="vanish";boss.timer=5;player.x=6840;player.face=1;shots=[];fire(true);for(let i=0;i<30;i++)update(1/120)');
 assert.equal(run('boss.hp'),306);
});
