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
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},hidden:true,textContent:'',value:'2',focus(){},getContext(){return {};}});return nodes.get(id);};
 const context=vm.createContext({...environmentArt,...enemyDesign,...level,...combat,...campaign,...coupling,DEVELOPMENT_MODE:true,
  document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],addEventListener(){}},
  window:{addEventListener(){}},matchMedia:()=>({matches:false}),innerHeight:720,innerWidth:1280,
  navigator:{getGamepads:()=>[]},performance:{now:()=>0},requestAnimationFrame(){},Image:class {},
  localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},
 });
 vm.runInContext(fs.readFileSync(new URL('../dist/src/game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,''),context);
 return code=>vm.runInContext(code,context);
}
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
test('second level completion persists and can be replayed',()=>{
 const run=game();run('reset(false,2);player.x=LEVEL.exit+1;update(1/120)');assert.equal(run('mode'),'end');
 run('reset(true)');assert.equal(run('mode'),'end');assert.equal(run('saved().stage'),'complete');
 run("$('again').onclick()");assert.equal(run('mode'),'play');assert.equal(run('LEVEL.id'),2);
});
test('Dellinger shots destroy barriers through the real collision loop',()=>{
 const run=game();run('reset(false,2);player.x=350;player.y=440;fire(true);for(let i=0;i<15;i++)update(1/120)');
 assert.equal(run('barriers[0].dead'),true);assert.equal(run('saved().destroyed[0]'),0);
});
