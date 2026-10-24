import test from 'node:test';
import assert from 'node:assert/strict';
import {createMenuMusic} from '../dist/src/menu-music.js';
function track(){return {paused:true,currentTime:0,plays:0,pause(){this.paused=true;},play(){this.paused=false;this.plays++;return Promise.resolve();}};}
test('menu loops, exits immediately and every return restarts at zero',()=>{
 const t=track(),m=createMenuMusic(t);m.enter();assert.equal(t.loop,true);assert.equal(t.plays,1);
 t.currentTime=35;m.unlock();assert.equal(t.currentTime,35);assert.equal(t.plays,1);
 m.leave();assert.equal(t.paused,true);assert.equal(t.currentTime,0);
 m.unlock();assert.equal(t.plays,1);m.enter();assert.equal(t.plays,2);assert.equal(t.currentTime,0);
});
test('mute and hidden tab do not start music outside menu',()=>{
 const t=track(),m=createMenuMusic(t);m.enter();m.setEnabled(false);m.enter();assert.equal(t.paused,true);
 m.setEnabled(true);assert.equal(t.paused,false);m.setVisible(false);assert.equal(t.paused,true);
 m.leave();m.setVisible(true);m.setEnabled(true);assert.equal(t.paused,true);
});
test('blocked autoplay can retry on a gesture but never after leaving',async()=>{
 const t=track();t.play=function(){this.plays++;return Promise.reject(new Error('NotAllowedError'));};
 const m=createMenuMusic(t);m.enter();await Promise.resolve();assert.equal(t.plays,1);
 m.unlock();await Promise.resolve();assert.equal(t.plays,2);
 m.leave();m.unlock();assert.equal(t.plays,2);
});
