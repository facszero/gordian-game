// Translate actual emissions/state changes into one cue per volley.
export function enemyVolume(x,playerX,camera,width){
 if(x<camera-80||x>camera+width+80)return 0;
 return Math.max(.2,1-Math.abs(x-playerX)/1000);
}
export function bossAudioEvents(b,previousState,shots){
 if(!b.active||b.dead)return [];
 const events=[];
 if(b.state==='warning'&&previousState!=='warning')events.push('bossWarning');
 if(b.state==='vanish'&&previousState!=='vanish')events.push('teleport');
 if(shots.length){
  if(shots.some(s=>s.reactorBurst))events.push('reactorBurst');
  else if(shots.some(s=>s.iceBeam))events.push('iceBeam');
  else if(b.kind==='cryodrax')events.push('iceShard');
  else if(b.kind==='dokuma')events.push('enemyLight');
  else if(b.kind==='nucleus')events.push('bossPulse');
  else events.push(b.kind==='dark'?'darkShot':'bossShot');
 }
 if(b.state==='attack'&&previousState!=='attack'){
  if(b.kind==='dark'&&b.attack!=='ambush')events.push('sword');
  else if(b.kind==='dokuma')events.push(b.attack==='eyes'?'dokumaBeam':b.attack==='drones'?'summon':'bossImpact');
  else if(!b.kind&&['beam','shell'].includes(b.attack))events.push(b.attack==='beam'?'scorpionBeam':'bossImpact');
 }
 return events;
}
