import test from 'node:test';
import assert from 'node:assert/strict';
import {bossAudioEvents,enemyVolume} from '../dist/src/enemy-audio.js';
import {createBoss,updateBoss} from '../dist/src/boss.js';
import {NUCLEUS} from '../dist/src/nucleus.js';
import {CRYODRAX} from '../dist/src/cryodrax.js';
test('off-screen enemies are silent and distant enemies are quieter',()=>{
 assert.equal(enemyVolume(1500,100,0,1280),0);
 assert.ok(enemyVolume(800,100,0,1280)<enemyVolume(200,100,0,1280));
});
test('real extra boss cycles emit one cue per volley and only one warning per windup',()=>{
 for(const config of [NUCLEUS.boss,CRYODRAX.boss]){
  const b=createBoss(config),counts={};let warnings=0;
  for(let i=0;i<4000;i++){
   const previous=b.state,shots=updateBoss(b,.016,{x:110,y:400,w:70,h:120});
   const events=bossAudioEvents(b,previous,shots);
   for(const name of events)counts[name]=(counts[name]||0)+1;
   if(b.state==='warning'&&previous!=='warning')warnings++;
   if(shots.length)assert.equal(events.filter(n=>n!=='bossWarning').length,1);
  }
  assert.equal(counts.bossWarning,warnings);
  assert.ok(config.kind==='nucleus'?counts.reactorBurst&&counts.bossPulse:counts.iceBeam&&counts.iceShard);
 }
});
test('hazard attacks and teleport trigger once, while dead bosses remain silent',()=>{
 const b={active:true,state:'attack',kind:'dark',attack:'sword'};
 assert.deepEqual(bossAudioEvents(b,'warning',[]),['sword']);
 assert.deepEqual(bossAudioEvents(b,'attack',[]),[]);
 b.state='vanish';assert.deepEqual(bossAudioEvents(b,'recover',[]),['teleport']);
 b.kind='dokuma';b.state='attack';b.attack='eyes';
 assert.deepEqual(bossAudioEvents(b,'warning',[]),['dokumaBeam']);
 delete b.kind;b.attack='beam';
 assert.deepEqual(bossAudioEvents(b,'warning',[]),['scorpionBeam']);
 b.dead=true;assert.deepEqual(bossAudioEvents(b,'warning',[{}]),[]);
});
