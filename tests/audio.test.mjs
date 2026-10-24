import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAudio} from '../dist/src/audio.js';
import {createWeaponSamples,excerpt} from '../dist/src/weapon-audio.js';
function mock(){
 const sources=[],nodes=[];const param=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},cancelScheduledValues(){},setTargetAtTime(v){this.value=v;}});
 const node=()=>{const n={gain:param(),frequency:param(),threshold:param(),ratio:param(),connect(){},disconnect(){this.disconnected=true;},start(){},stop(){}};nodes.push(n);return n;};
 const source=()=>{const n=node();sources.push(n);return n;};
 return {sources,nodes,currentTime:0,sampleRate:8000,state:'running',destination:{},createGain:node,createDynamicsCompressor:node,createBiquadFilter:node,createOscillator:source,createBufferSource:source,createBuffer:()=>({getChannelData:()=>new Float32Array(8000)}),resume:()=>Promise.resolve()};
}
test('effects release audio nodes and mute suppresses new voices',()=>{
 const c=mock(),a=createGameAudio(c);a.play('charge','garbin');assert.ok(c.sources.length>1);
 for(const n of c.sources)n.onended();assert.ok(c.sources.every(n=>n.disconnected));
 const count=c.sources.length;a.setEnabled(false);a.play('shot');assert.equal(c.sources.length,count);assert.equal(c.nodes[0].gain.value,0);
 a.setEnabled(true);a.play('pickup');assert.ok(c.sources.length>count);
});
function sampleMock(){
 const c=mock();c.createBuffer=(channels,length,rate)=>{
  const data=Array.from({length:channels},()=>new Float32Array(length));
  return {length,sampleRate:rate,numberOfChannels:channels,duration:length/rate,getChannelData:i=>data[i]};
 };
 const original=c.createBufferSource;c.createBufferSource=()=>{const s=original();s.playbackRate={value:1};return s;};
 c.decodeAudioData=async()=>{const b=c.createBuffer(2,40000,8000);b.getChannelData(0).fill(1);b.getChannelData(1).fill(1);return b;};
 return c;
}
test('recordings load once, bound overlap, release and preserve distinct robot profiles',async()=>{
 const c=sampleMock();let requests=0;const a=createWeaponSamples(c,c.destination,async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(1)};});
 assert.equal(a.play('shot','protesser'),false);
 await Promise.all([a.load(),a.load()]);assert.equal(requests,7);
 for(let i=0;i<10;i++)assert.equal(a.play('shot','protesser'),true);
 assert.equal(c.sources.filter(s=>!s.disconnected).length,3);
 a.play('charge','garbin');assert.equal(c.sources.at(-1).playbackRate.value,.75);
 a.play('reactorBurst','garbin');a.play('reactorBurst','garbin');
 assert.equal(c.sources.filter(s=>!s.disconnected).length,5);
 a.stop();assert.ok(c.sources.every(s=>s.disconnected));
});
test('failed recordings resolve without blocking synthesized fallback',async()=>{
 const c=sampleMock(),a=createWeaponSamples(c,c.destination,async()=>{throw new Error('offline');});
 await a.load();assert.equal(a.play('charge','garbin'),false);
});
test('sample excerpts normalize peaks and fade both edges',()=>{
 const c=sampleMock(),b=c.createBuffer(2,8000,8000);
 b.getChannelData(0).fill(2);b.getChannelData(1).fill(2);
 const result=excerpt(c,b,.05,.2),data=result.getChannelData(0);
 assert.equal(result.length,1600);assert.equal(data[0],0);assert.equal(data.at(-1),0);
 assert.ok(Math.max(...data)<=.800001);
});
test('rapid overlapping effects have a bounded voice count',()=>{
 const c=mock(),a=createGameAudio(c);for(let i=0;i<100;i++)a.play('explosion');assert.equal(c.sources.length,48);
 for(const n of [...c.sources])n.onended();a.play('jump');assert.ok(c.sources.length>48);
});
test('hostile sound flood is throttled even when recordings are unavailable',()=>{
 const c=mock(),a=createGameAudio(c);
 for(let i=0;i<100;i++)a.play(i%2?'enemyLight':'enemyHeavy','garbin',.3);
 assert.equal(c.sources.length,2);
 c.currentTime=.1;a.play('enemyLight');assert.equal(c.sources.length,4);
 a.stop();assert.ok(c.sources.every(s=>s.disconnected));
 a.play('enemyLight');assert.equal(c.sources.length,6);
});
test('enemy sample voices are capped independently of player shots and boss beams',async()=>{
 const c=sampleMock(),a=createWeaponSamples(c,c.destination,async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)}));
 await a.load();a.play('shot','protesser');
 for(let i=0;i<30;i++)a.play(i%2?'enemyHeavy':'enemyLight','garbin',.3);
 assert.equal(c.sources.filter(s=>!s.disconnected).length,4);
 a.play('iceBeam','garbin');assert.equal(c.sources.filter(s=>!s.disconnected).length,5);
 a.stop();assert.ok(c.sources.every(s=>s.disconnected));
});
