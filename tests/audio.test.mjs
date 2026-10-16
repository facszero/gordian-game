import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAudio} from '../dist/src/audio.js';
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
test('rapid overlapping effects have a bounded voice count',()=>{
 const c=mock(),a=createGameAudio(c);for(let i=0;i<100;i++)a.play('explosion');assert.equal(c.sources.length,48);
 for(const n of [...c.sources])n.onended();a.play('jump');assert.ok(c.sources.length>48);
});
