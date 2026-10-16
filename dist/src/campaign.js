import {LEVELS} from './level.js';

// Validate persisted data before it can select a level or checkpoint.
export function normalizeSave(data) {
  if (!data || typeof data !== 'object') return null;
  const levelId = LEVELS.some(l=>l.id===data.levelId) ? data.levelId : 1;
  const level = LEVELS.find(l=>l.id===levelId);
  const count = value => Number.isFinite(value) ? Math.max(0,Math.floor(value)) : 0;
  const ids = (value,max) => Array.isArray(value) ? [...new Set(value.filter(i=>Number.isInteger(i)&&i>=0&&i<max))] : [];
  return {version:2,levelId,unlocked:Math.max(levelId,Math.min(LEVELS.length,count(data.unlocked)||1)),
    checkpoint:Number.isInteger(data.checkpoint)?Math.max(-1,Math.min(level.checkpoints.length-1,data.checkpoint)):-1,
    kills:count(data.kills),cells:count(data.cells),elapsed:count(data.elapsed),
    defeated:ids(data.defeated,level.enemies.length),collected:ids(data.collected,level.pickups.length),
    elitesDefeated:ids(data.elitesDefeated,(level.elites||[]).length),
    destroyed:ids(data.destroyed,(level.barriers||[]).length),
    bossDefeated:Boolean(level.boss&&data.bossDefeated===true),
    stage:(data.stage==='transition'||data.stage==='complete')&&levelId<LEVELS.length?'transition':data.stage==='complete'&&levelId===LEVELS.length&&data.bossDefeated===true?'complete':'play'};
}

export function blockHorizontal(body,previousX,barriers) {
  for(const b of barriers){
    if(b.dead || body.y+body.h<=b.y || body.y>=b.y+b.h)continue;
    if(previousX+body.w<=b.x && body.x+body.w>b.x){body.x=b.x-body.w;body.vx=0;}
    else if(previousX>=b.x+b.w && body.x<b.x+b.w){body.x=b.x+b.w;body.vx=0;}
  }
}
