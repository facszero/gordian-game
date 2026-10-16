import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVEL,ROBOTS,GRAVITY,moveBody,CAMPAIGN} from '../dist/src/level.js';
test('every main-route jump is reachable with Protesser',()=>{
 const platforms=LEVEL.platforms.slice(0,10);
 for(let i=0;i<platforms.length-1;i++){
  const from=platforms[i],to=platforms[i+1];
  const p={x:from.x+from.w-70,y:from.y-90,w:38,h:90,vx:ROBOTS.protesser.speed,vy:-ROBOTS.protesser.jump};
  let landed=false;
  for(let t=0;t<1.5;t+=1/120){p.vy+=GRAVITY/120;moveBody(p,LEVEL.platforms,1/120);if(p.grounded&&p.x+p.w>to.x&&p.x<to.x+to.w){landed=true;break;}}
  assert.ok(landed,`unreachable platform ${i+1}`);
 }
});
test('platforms allow ascent from below and catch falling body',()=>{const p={x:15,y:110,w:20,h:30,vx:0,vy:-300};moveBody(p,[{x:0,y:100,w:100}],.1);assert.equal(p.grounded,false);p.y=40;p.vy=300;moveBody(p,[{x:0,y:100,w:100}],.2);assert.equal(p.y,70);assert.equal(p.grounded,true);});
test('campaign retains the agreed bosses and final robot',()=>{assert.equal(CAMPAIGN.length,12);assert.deepEqual(CAMPAIGN.filter(x=>x.boss).map(x=>x.id),[4,8,12]);assert.equal(CAMPAIGN[11].robot,'garbin');assert.equal(CAMPAIGN.filter(x=>x.available).length,12);});

