import test from 'node:test';
import assert from 'node:assert/strict';
import {CHAPTER_STORY,victoryStory,epilogueStory} from '../dist/src/story.js';
import {normalizeSave} from '../dist/src/campaign.js';
test('each transition has a short paragraph and all victory routes have a closing',()=>{
 assert.equal(Object.keys(CHAPTER_STORY).length,11);
 for(let i=1;i<=11;i++){assert.ok(CHAPTER_STORY[i][0]);assert.ok(CHAPTER_STORY[i][1].split(' ').length<=45);}
 assert.match(victoryStory(12,'dellinger').body,/Núcleo/);assert.match(victoryStory(12,'protesser').body,/Cryodrax/);
 assert.match(epilogueStory(true).note,/enemigos/);assert.ok(victoryStory(13).body);assert.ok(victoryStory(14).body);
});
test('save migration grants four lives, exhaustion cannot continue, invalid counts clamp',()=>{
 assert.equal(normalizeSave({levelId:4}).lives,4);assert.equal(normalizeSave({levelId:4,lives:2}).lives,2);
 assert.equal(normalizeSave({levelId:4,lives:0}),null);assert.equal(normalizeSave({lives:99}).lives,4);
});
