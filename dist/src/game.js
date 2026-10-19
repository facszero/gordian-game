import {NUCLEUS,drawNucleus,drawReactorBurst} from './nucleus.js';
import {drawPlayerShot,drawShotEffects,shotEffect,updateShotEffects,WEAPON_COLORS} from './weapons.js';
import {createGameAudio} from './audio.js';
import {drawDokuma,hitDokumaDrone,updateBossDrop} from './dokuma.js';
import {createBoss,updateBoss,hitBoss,bossBounds,darkMuzzle,darkSword} from './boss.js';
import {createCompanion,updateCompanion} from './companion.js';
import {extractProps,buildPlatform,INDUSTRIAL_REGIONS} from './environment.js';
import {enemySpec,enemyMuzzle,groupForEnemy,ENEMY_GROUPS} from './enemies.js';
import {COUPLING_DURATION,couplingState,ease} from './coupling.js';
import {DEVELOPMENT_MODE} from './config.js';
import {LEVELS,ROBOTS,GRAVITY,moveBody,overlaps} from './level.js';
import {setStance,playerShot,shotBounds,garbinUpHeight} from './combat.js';
import {normalizeSave,blockHorizontal} from './campaign.js';
let nucleusParts=[],victoryRobot=null,bonusEndTimer=0,nucleusSupplyCycle=0;
let elites=[],dokumaFrames=[],dokumaSummonFrames=[],dokumaPunchFrames=[];
let LEVEL=LEVELS[0],unlocked=1,transitionTime=0,barriers=[],boss=null,bossSprite=null,bossWalkFrames=[],crateFrames=[],darkFrames=[],garbinUpFrames=[];
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),W=1280,H=720;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='menu',beforePause='play',clock=0,elapsed=0,cam=0,shake=0,intro=0,toastUntil=0,checkpoint=-1,kills=0,cells=0,energy=100,last=0,acc=0,soundOn=true,ac=null,musicTick=0;
let weaponEffects=[];
let player,enemies=[],shots=[],particles=[],pickups=[],keys=new Set(),touch=new Set(),prevJump=false,airJumpsLeft=1,chargeLatch=false,jumpBuffer=0,coyote=0,shotCooldown=0,chargeCooldown=0,invulnerable=0,respawnTimer=0;
const platformCache=new Map();let industrialParts=[],energySprite=null,stationParts=[],catFrames=[],companion=null;
const assets={};let spriteFrames={};
const maps={ArrowDown:'crouch',KeyS:'crouch',ArrowUp:'up',KeyW:'up',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyZ:'jump',KeyX:'fire',KeyJ:'fire',KeyC:'charge',KeyK:'charge'};
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
function line(x,y,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function text(s,x,y,size=16,color='#ecd5aa',align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px Arial`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function save(stage='play'){try{localStorage.setItem('gordian-v2',JSON.stringify({version:2,levelId:LEVEL.id,victoryRobot,unlocked,checkpoint,kills,cells,elapsed,stage,bossDefeated:boss?.dead||false,elitesDefeated:elites.flatMap((b,i)=>b.dead?[i]:[]),defeated:enemies.filter(e=>e.dead).map(e=>e.id),collected:pickups.filter(p=>p.taken&&!p.bossDrop).map(p=>p.id),destroyed:barriers.filter(b=>b.dead).map(b=>b.id)}));}catch{}}
function saved(){try{return normalizeSave(JSON.parse(localStorage.getItem('gordian-v2')||localStorage.getItem('gordian-v1')));}catch{return null;}}
function hud(){ $('boss-hud').hidden=!boss?.active;$('boss-health').style.width=(boss?boss.hp/boss.maxHp*100:100)+'%';document.querySelector('#boss-hud strong').textContent=boss?boss.name+(LEVEL.extra?' · EXTRA':' · JEFE 0'+(boss.number||1)):'';$('boss-phase').textContent='FASE '+(boss?.phase||(boss&&boss.hp<=boss.maxHp/2?2:1));document.querySelector('.unit strong').textContent=player.robot.toUpperCase();document.querySelector('.unit .eyebrow').textContent='SISTEMA ACTIVO / '+(LEVEL.extra?'EXTRA':String(LEVEL.id)).padStart(2,'0');document.querySelector('.mission small').textContent=LEVEL.extra?'COMBATE EXTRA':'NIVEL '+String(LEVEL.id).padStart(2,'0')+' / 12';document.querySelector('.mission strong').textContent=LEVEL.title.toUpperCase();$('health').style.width=player.health/ROBOTS[player.robot].maxHealth*100+'%';$('energy').textContent='ENERGÍA '+Math.floor(energy)+'%';$('progress').style.width=Math.min(100,player.x/LEVEL.exit*100)+'%';}
function sound(name){if(soundOn&&ac)ac.play(name,player?.robot||LEVEL.robot);}
function activateAudio(){try{ac??=createGameAudio(new AudioContext());ac.resume()?.catch(()=>{});}catch{}}
function toast(s,duration=3){$('toast').textContent=s;toastUntil=clock+duration;}
function reset(continuing=false,levelId=1){
 const data=continuing?saved():null;LEVEL=[...LEVELS,NUCLEUS].find(l=>l.id===(data?.levelId||levelId))||LEVELS[0];
 victoryRobot=data?.victoryRobot||null;bonusEndTimer=0;nucleusSupplyCycle=0;
 unlocked=Math.max(Math.min(LEVEL.id,12),saved()?.unlocked||1);checkpoint=data?.checkpoint??-1;kills=data?.kills||0;cells=data?.cells||0;elapsed=data?.elapsed||0;
 energy=100;shots=[];weaponEffects=[];particles=[];pickups=LEVEL.pickups.map((p,id)=>({...p,id,taken:data?.collected.includes(id)||false}));
 barriers=(LEVEL.barriers||[]).map((b,id)=>({...b,id,hp:6,dead:data?.destroyed.includes(id)||false}));
 const spec=ROBOTS[LEVEL.robot],pos=checkpoint>=0?LEVEL.checkpoints[checkpoint]:LEVEL.spawn;
 player={...pos,robot:LEVEL.robot,w:spec.width,h:spec.height,vx:0,vy:0,grounded:false,health:spec.maxHealth,face:1,crouching:false,aimUp:false};
 enemies=LEVEL.enemies.map(([type,x,y],id)=>{const spec=enemySpec(type,LEVEL.id,groupForEnemy(LEVEL.id,id),LEVEL.robot);return {...spec,id,type,x,y:type==='drone'?y:y-spec.h,baseY:type==='drone'?y:y-spec.h,maxHp:spec.hp,flash:0,timer:1+id*.13,phase:id,dead:data?.defeated.includes(id)||(checkpoint>=0&&x<pos.x-120)};});
 boss=createBoss(LEVEL.boss,data?.bossDefeated);
 elites=(LEVEL.elites||[]).map((config,i)=>createBoss(config,data?.elitesDefeated.includes(i)));
 companion=createCompanion(LEVEL,!LEVEL.extra&&!continuing&&!reduced);
 cam=Math.max(0,player.x-330);intro=0;prevJump=false;airJumpsLeft=1;chargeLatch=false;jumpBuffer=0;coyote=0;invulnerable=2;respawnTimer=0;shotCooldown=0;chargeCooldown=0;
 mode=continuing||LEVEL.id>1?'play':'intro';$('menu').hidden=true;$('pause-menu').hidden=true;$('end').hidden=true;$('skip').hidden=true;$('hud').hidden=false;$('touch').hidden=!matchMedia('(pointer:coarse)').matches;
 keys.clear();touch.clear();hud();canvas.focus();toast(continuing?'MISIÓN RECUPERADA':LEVEL.robot.toUpperCase()+' ACTIVO · '+LEVEL.title.toUpperCase(),4);
 if(data?.stage==='transition')beginTransition();else if(data?.stage==='complete')completeLevel();else save();
}
function transitionDuration(){return LEVEL.id===8?20.8:LEVEL.id===11?5:LEVEL.id===3?15:COUPLING_DURATION;}
function beginTransition(){sound('coupling');mode='transition';transitionTime=0;unlocked=Math.max(unlocked,LEVEL.id+1);keys.clear();touch.clear();$('touch').hidden=true;$('skip').hidden=false;$('boss-hud').hidden=true;$('hint').textContent='';toast([2,4,6,8].includes(LEVEL.id)?'DESACOPLAMIENTO AUTORIZADO':'ACOPLAMIENTO AUTORIZADO',3);save('transition');}
function finishTransition(){reset(false,Math.min(LEVELS.length,LEVEL.id+1));save();}
function completeLevel(){
 if((boss&&!boss.dead)||elites.some(b=>!b.dead))return;
 if(LEVEL.id===12&&(victoryRobot||player.robot)==='dellinger'){reset(false,13);toast('RUTA EXTRA DESBLOQUEADA · NÚCLEO MADOKTER',4);return;}
 if(LEVEL.id<LEVELS.length){beginTransition();return;}
 mode='end';$('end').hidden=false;document.querySelector('#end h2').textContent=LEVEL.extra?'NÚCLEO DESTRUIDO':'DOKUMA DERROTADO';$('ending-story').textContent=LEVEL.extra?'Has silenciado el corazón de la fortaleza Madokter.':'Grandmaster Dokuma (Evolved) ha caído. La última ofensiva ha terminado.';$('ending-note').textContent=LEVEL.extra?'Campaña y combate extra completados.':'Has completado los doce niveles de la campaña.';$('again').textContent=LEVEL.extra?'REPETIR COMBATE EXTRA':'REPETIR NIVEL 12';$('touch').hidden=true;$('hint').textContent='';
 $('summary').textContent=(LEVEL.extra?'Núcleo Madokter derrotado. ':'Grandmaster Dokuma (Evolved) derrotado. ')+kills+' enemigos neutralizados · '+cells+' células recuperadas · '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');save('complete');sound('victory');
}
function burst(x,y,color,n=14){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*240;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.5,color});}}
function damage(amount,projectile=false){if(invulnerable>0||mode!=='play')return;if(projectile&&player.crouching)amount*=.25;player.health=Math.max(0,player.health-amount);invulnerable=1.3;shake=reduced?0:9;sound('hit');burst(player.x+20,player.y+40,'#ffc071');if(player.health===0){if(releaseInnerRobot())return;mode='dead';respawnTimer=1.2;toast('SISTEMA DAÑADO · REINICIANDO',2);}}
function releaseInnerRobot(fell=false){
 if(!['dokuma','nucleus'].includes(boss?.kind)||!boss.active||boss.dead)return false;
 const next={garbin:'dellinger',dellinger:'protesser'}[player.robot];if(!next)return false;
 const old=player.robot,spec=ROBOTS[next],feet=fell?boss.floor:player.y+player.h,center=player.x+player.w/2;
 Object.assign(player,{robot:next,w:spec.width,h:spec.height,x:Math.max(boss.left+20,Math.min(boss.right-spec.width-20,center-spec.width/2)),y:feet-spec.height,health:spec.maxHealth,vx:0,vy:0,crouching:false,aimUp:false,grounded:false});
 energy=100;invulnerable=2.5;airJumpsLeft=1;prevJump=false;jumpBuffer=0;coyote=0;chargeLatch=false;shotCooldown=.25;chargeCooldown=.25;
 keys.clear();touch.clear();shots=shots.filter(s=>s.friendly);burst(player.x+player.w/2,player.y+player.h/2,'#83efff',36);
 toast(old.toUpperCase()+' DESTRUIDO · '+next.toUpperCase()+' ACTIVO',3);sound('coupling');hud();return true;
}
function respawn(){weaponEffects=[];pickups=pickups.filter(p=>!p.bossDrop);elites=elites.map((b,i)=>b.dead?b:createBoss(LEVEL.elites[i]));airJumpsLeft=1;prevJump=false;jumpBuffer=0;coyote=0;if(boss&&!boss.dead)boss=createBoss(LEVEL.boss);bonusEndTimer=0;nucleusSupplyCycle=0;const pos=checkpoint>=0?LEVEL.checkpoints[checkpoint]:LEVEL.spawn;Object.assign(player,pos,{robot:LEVEL.robot,w:ROBOTS[LEVEL.robot].width,vx:0,vy:0,health:ROBOTS[LEVEL.robot].maxHealth,h:ROBOTS[LEVEL.robot].height,crouching:false,aimUp:false});energy=100;shots=[];invulnerable=2;mode='play';cam=Math.max(0,player.x-330);toast('PUNTO DE CONTROL RESTAURADO',2);}
function pause(){if(!['play','intro','transition'].includes(mode))return;beforePause=mode;mode='pause';keys.clear();touch.clear();$('pause-menu').hidden=false;$('skip').hidden=true;}
function returnToMenu(){
 if(mode!=='pause')return;
 save(beforePause==='transition'?'transition':'play');
 mode='menu';keys.clear();touch.clear();shots=[];weaponEffects=[];particles=[];shake=0;cam=0;
 for(const id of ['pause-menu','hud','touch','boss-hud','skip','end'])$(id).hidden=true;
 $('hint').textContent='';$('toast').textContent='';$('menu').hidden=false;
 $('continue').hidden=!saved();$('level-two').hidden=(saved()?.unlocked||1)<2;
 $('continue').focus();
}
function resume(){if(innerHeight>innerWidth)return;$('pause-menu').hidden=true;mode=beforePause;$('skip').hidden=mode!=='transition';last=performance.now();acc=0;canvas.focus();}
function input(){let a=new Set([...keys,...touch]);const gp=navigator.getGamepads?.()[0];if(gp){if(gp.axes[1]<-.4||gp.buttons[12]?.pressed)a.add('up');if(gp.axes[1]>.4||gp.buttons[13]?.pressed)a.add('crouch');if(gp.axes[0]<-.25||gp.buttons[14]?.pressed)a.add('left');if(gp.axes[0]>.25||gp.buttons[15]?.pressed)a.add('right');if(gp.buttons[0]?.pressed)a.add('jump');if(gp.buttons[2]?.pressed||gp.buttons[7]?.pressed)a.add('fire');if(gp.buttons[1]?.pressed)a.add('charge');}return a;}
function shotImpact(s){if(s.friendly){weaponEffects.push(shotEffect(s,'impact'));burst(s.x,s.y,WEAPON_COLORS[s.robot||'protesser'][0],s.charged?7:3);}}
function fire(charged=false){const shot=playerShot(player,charged),{x,y}=shot;shots.push(shot);shotCooldown=player.robot==='garbin'?.3:player.robot==='dellinger'?.24:.17;if(charged){energy-=35;chargeCooldown=.65;shake=reduced?0:3;}sound(charged?'charge':'shot');weaponEffects.push(shotEffect(shot,'muzzle'));}
function update(dt){clock+=dt;if(clock>toastUntil)$('toast').textContent='';if(mode==='menu'||mode==='pause'||mode==='end')return;if(innerHeight>innerWidth){pause();return;}weaponEffects=updateShotEffects(weaponEffects,dt);if(mode==='transition'){transitionTime+=dt;if(transitionTime>=transitionDuration())finishTransition();return;}if(mode==='dead'){respawnTimer-=dt;if(respawnTimer<=0)respawn();return;}updateCompanion(companion,dt,cam);if(mode==='intro'){intro+=dt;player.x=150;player.y=470;if(intro>4){mode='play';toast('PROTESSER ACTIVO · ALCANZA EL HANGAR',3);sound('ready');}return;}
elapsed+=dt;energy=Math.min(100,energy+dt*7);invulnerable=Math.max(0,invulnerable-dt);shotCooldown-=dt;chargeCooldown-=dt;shake=Math.max(0,shake-dt*30);
const a=input(),jump=a.has('jump');player.aimUp=a.has('up');setStance(player,a.has('crouch'),ROBOTS[player.robot].height);if(player.grounded)airJumpsLeft=1;if(jump&&!prevJump)jumpBuffer=.13;prevJump=jump;jumpBuffer-=dt;coyote=player.grounded?.1:coyote-dt;player.vx=(Number(a.has('right'))-Number(a.has('left')))*ROBOTS[player.robot].speed*(player.crouching?.4:1);if(player.vx)player.face=Math.sign(player.vx);if(jumpBuffer>0&&(coyote>0||(airJumpsLeft>0&&player.vy!==0))){
 const airJump=coyote<=0;if(airJump)airJumpsLeft--;
 setStance(player,false,ROBOTS[player.robot].height);player.vy=-ROBOTS[player.robot].jump;jumpBuffer=0;coyote=0;player.grounded=false;
 sound(airJump?'doubleJump':'jump');burst(player.x+player.w/2,player.y+player.h,airJump?'#83efff':'#c1b093',airJump?10:5);
}if(!jump&&player.vy<-250)player.vy+=GRAVITY*dt*.85;player.vy=Math.min(1000,player.vy+GRAVITY*dt);const previousX=player.x;moveBody(player,[...LEVEL.platforms,...barriers.filter(b=>!b.dead)],dt);blockHorizontal(player,previousX,barriers);player.x=Math.max(0,Math.min(LEVEL.width-player.w,player.x));if(player.y>810){player.health=0;if(releaseInnerRobot(true))return;mode='dead';respawnTimer=.7;toast('CAÍDA · RECUPERANDO SEÑAL',2);return;}if(a.has('fire')&&shotCooldown<=0)fire();if(a.has('charge')&&!chargeLatch&&energy>=35&&chargeCooldown<=0)fire(true);chargeLatch=a.has('charge');
for(let i=0;i<LEVEL.checkpoints.length;i++){if(player.x>LEVEL.checkpoints[i].x&&checkpoint<i){checkpoint=i;player.health=ROBOTS[player.robot].maxHealth;save();toast('PUNTO DE CONTROL · SISTEMAS RESTAURADOS');sound('checkpoint');}}
for(const p of pickups){updateBossDrop(p,dt);if(!p.taken&&overlaps(player,{...p,w:24,h:24})){p.taken=true;cells++;player.health=Math.min(ROBOTS[player.robot].maxHealth,player.health+25);energy=Math.min(100,energy+25);burst(p.x,p.y,'#65fff0');sound('pickup');save();}}
for(const e of enemies){if(e.dead||Math.abs(e.x-player.x)>850)continue;e.timer-=dt;e.flash=Math.max(0,e.flash-dt);if(e.type==='drone'){e.y=e.baseY+Math.sin(clock*2+e.phase)*24;e.x+=Math.sin(clock+e.phase)*dt*28;}if(e.timer<=0){e.timer=e.type==='armor'?1.6:e.type==='turret'?1.9:2.6;e.flash=.14;const face=player.x+player.w/2<e.x+e.w/2?-1:1,muzzle=enemyMuzzle(e,face),dx=player.x+player.w/2-muzzle.x,dy=player.y+player.h*.45-muzzle.y,l=Math.hypot(dx,dy)||1;shots.push({...muzzle,w:13,h:10,vx:dx/l*220,vy:dy/l*220,friendly:false,life:4});}if(overlaps(player,e))damage(18);}
for(const elite of elites){
 if(elite.dead)continue;const active=elite.active;shots.push(...updateBoss(elite,dt,player).map(s=>({...s,damage:(s.damage||12)*elite.damageScale})));
 if(!active&&elite.active)toast(elite.name+' · UNIDAD ÉLITE',3);
 if(elite.active){player.x=Math.max(elite.left+12,Math.min((elite.kind==='dark'?elite.right-12:elite.x)-player.w,player.x));for(const h of elite.hazards)if(overlaps(player,h))damage(26*elite.damageScale);}
}
if(boss&&!boss.dead){
 const wasActive=boss.active;shots.push(...updateBoss(boss,dt,player));
 if(LEVEL.extra&&boss.state==='recover'&&boss.cycle>0&&boss.cycle%3===0&&boss.cycle!==nucleusSupplyCycle){nucleusSupplyCycle=boss.cycle;pickups=pickups.filter(p=>!p.bossDrop||!p.taken);if(pickups.filter(p=>p.bossDrop&&!p.taken).length<3)pickups.push({bossDrop:true,taken:false,x:170,y:400,vy:0,floor:680});}
 if(!wasActive&&boss.active){shots=shots.filter(s=>s.friendly||s.boss);toast(boss.name+(LEVEL.extra?' · EXTRA':' · JEFE 0'+(boss.number||1)),3);}
 if(boss.active){player.x=Math.max(boss.left+12,Math.min((['dark','dokuma','nucleus'].includes(boss.kind)?boss.right-12:boss.x)-player.w,player.x));for(const h of boss.hazards)if(overlaps(player,h))damage(26);}
}
for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.friendly){
 const drone=boss?.drones?.find(d=>!d.dead&&overlaps(shotBounds(s),d));
 if(drone){s.life=0;shotImpact(s);const drop=hitDokumaDrone(boss,drone,s.damage);if(drone.dead)burst(drone.x,drone.y,'#68ffb5',16);if(drop){pickups.push(drop);toast('RECARGA LIBERADA · +25 SALUD / ENERGÍA',2);}continue;}
 const elite=elites.find(b=>b.active&&!b.dead&&!b.hidden&&overlaps(shotBounds(s),bossBounds(b)));
 if(elite){s.life=0;shotImpact(s);if(hitBoss(elite,s.damage)){kills++;burst(elite.x+130,elite.floor-150,'#8feacb',35);toast(elite.name+' DERROTADO',3);shots=shots.filter(p=>p.friendly);save();}continue;}
 if(boss?.active&&!boss.dead&&!boss.hidden&&overlaps(shotBounds(s),bossBounds(boss))){
 s.life=0;shotImpact(s);if(hitBoss(boss,s.damage)){victoryRobot=player.robot;shots=shots.filter(p=>p.friendly);kills++;burst(boss.x+240,boss.floor-140,'#ffc476',60);toast(boss.name+' DERROTADO · SALIDA ABIERTA',4);save();}continue;
}for(const b of barriers){if(!b.dead&&overlaps(shotBounds(s),b)){b.hp-=s.damage;s.life=0;shotImpact(s);if(b.hp<=0){b.dead=true;burst(b.x+30,b.y+40,'#ffc476',28);save();}break;}}if(s.life<=0)continue;for(const e of enemies){if(!e.dead&&overlaps(shotBounds(s),e)){e.hp-=s.damage;s.life=0;shotImpact(s);if(e.hp<=0){e.dead=true;kills++;save();burst(e.x+25,e.y+20,'#ffb466',25);sound('explosion');shake=reduced?0:5;}break;}}}else if(overlaps(shotBounds(s),player)){damage(s.damage||12,true);s.life=0;shotImpact(s);}}
shots=shots.filter(s=>s.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);cam+=((boss?.active?boss.left:Math.max(0,Math.min(LEVEL.width-W,player.x-W*.32)))-cam)*Math.min(1,dt*5);
if(boss?.dead&&(LEVEL.extra||LEVEL.id===12&&victoryRobot==='dellinger')){bonusEndTimer+=dt;if(bonusEndTimer>2){completeLevel();return;}}
if(player.x>LEVEL.exit){completeLevel();return;}
hud();$('hint').textContent=LEVEL.extra?(boss?.dead?'NÚCLEO DESTRUIDO':boss?.state==='warning'?(boss.mega?'DESCARGA GIGANTE · CAMBIA DE PLATAFORMA':{chest:'REACTOR CARGANDO · CAMBIA DE ALTURA',eyes:'MIRADA FIJADA · MUÉVETE',shoulders:'HOMBROS ACTIVOS · ESQUIVA LA DESCARGA'}[boss.attack]):'DISPARA AL REACTOR VIOLETA · USA LAS PLATAFORMAS'):LEVEL.id>=5?chapterHint():LEVEL.id>=3?(boss?.active?(boss.state==='warning'?(boss.attack==='beam'?'LÁSER ALTO · ↓ AGÁCHATE':boss.attack==='shell'?'IMPACTO MARCADO · MUÉVETE':boss.attack==='burst'?'RÁFAGA DE '+boss.rounds+' DISPAROS · ESQUIVA':'ONDA BAJA · SALTA'):'DISPARA AL CUERPO · C / ϟ PARA CARGA'):boss?.dead?'SALIDA ABIERTA →':LEVEL.id===4?'GARBIN · RUMBO AL BASTIÓN →':'PROTESSER · INFILTRACIÓN EN LOS TÚNELES →'):LEVEL.id===2?(player.x<900?'DELLINGER · DISPARA PARA ROMPER LAS BARRERAS':player.x>5700?'ALCANZA LA SALIDA →':'CANTERA · ↑ APUNTA A LOS DRONES · ↓ ESQUIVA'):player.x<680?'SALTA EL CAÑÓN · Z / ESPACIO':player.x<1600?'↓ AGACHARSE · ↑ + DISPARO ARRIBA':player.x>5500?'ALCANZA EL HANGAR →':'VICTOR TOWN · RUMBO AL HANGAR →';}

function background(){const backdrop=assets[LEVEL.background||'canyon'];if(backdrop){const s=Math.max(W/backdrop.width,H/backdrop.height),w=backdrop.width*s*1.22,h=backdrop.height*s*1.22;ctx.drawImage(backdrop,-(cam/Math.max(1,LEVEL.width-W))*(w-W),-(h-H)*.35,w,h);}else rect(0,0,W,H,'#b36d63');const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10223d18');g.addColorStop(.7,'#10223d10');g.addColorStop(1,'#071324bb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
function platform(p){
 if(!industrialParts.length){rect(p.x,p.y,p.w,30,'#354455');return;}
 const key=LEVEL.id+':'+p.x+':'+p.y+':'+p.w;
 if(!platformCache.has(key))platformCache.set(key,buildPlatform(p,LEVEL.id,industrialParts));
 ctx.drawImage(platformCache.get(key),p.x,p.y-36);
}
function robot(x,y,frame=4,scale=1,face=1,alpha=1,height=90,aimUp=false,unit=LEVEL.robot){const frames=spriteFrames[unit];if(!frames?.length)return;if(aimUp&&unit==='garbin'&&garbinUpFrames.length){
 const crouched=height<ROBOTS.garbin.height,f=garbinUpFrames[crouched?1:0],h=garbinUpHeight(height,crouched),w=f.width/f.height*h;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+ROBOTS.garbin.width/2*scale,y+height*scale);ctx.scale(face*scale,scale);
 ctx.drawImage(f,-w*(crouched?.57:.414),-h,w,h);ctx.restore();return;
}const f=frames[frame];ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+ROBOTS[unit].width/2*scale,y+height*scale);ctx.scale(face*scale,scale);const targetH=height<ROBOTS[unit].height?height*1.21:height*1.145,targetW=f.width/f.height*targetH;if(aimUp){const splitX=f.width*.54,splitY=f.height*.34,dx=-targetW*.5,dy=-targetH;ctx.drawImage(f,0,splitY,f.width,f.height-splitY,dx,dy+targetH*.34,targetW,targetH*.66);ctx.drawImage(f,0,0,splitX,splitY,dx,dy,targetW*.54,targetH*.34);ctx.save();ctx.translate(dx+targetW*.54,dy+targetH*.23);ctx.rotate(-Math.PI/2);ctx.drawImage(f,splitX,0,f.width-splitX,splitY,0,-targetH*.23,targetW*.46,targetH*.34);ctx.restore();}else ctx.drawImage(f,-targetW*.5,-targetH,targetW,targetH);ctx.restore();}
function hangar(x,y,arrival=false){
 const f=stationParts[arrival?1:0];if(!f)return;
 const height=LEVEL.robot==='garbin'?280:LEVEL.robot==='dellinger'?230:205,width=f.width/f.height*height;
 ctx.drawImage(f,x+60-width/2,y-height,width,height);
 text(arrival?'SALIDA / '+String(LEVEL.id).padStart(2,'0'):'SANTORE / '+String(LEVEL.id).padStart(2,'0'),x+60,y-height-7,11,'#e5bf88','center');
}
function checkpointArt(p,i){
 const f=stationParts[i<=checkpoint?3:2];if(!f)return;
 const floor=LEVEL.platforms.find(q=>p.x>=q.x&&p.x<q.x+q.w&&q.y>=p.y+ROBOTS[LEVEL.robot].height-2);
 const feet=floor?.y??p.y+ROBOTS[LEVEL.robot].height,height=80,width=f.width/f.height*height;
 ctx.drawImage(f,p.x+24-width/2,feet-height,width,height);
 text('CP '+(i+1),p.x+24,feet-height-7,10,i<=checkpoint?'#66f7d6':'#f3b05d','center');
}
function drawCompanion(){
 if(!companion?.active||!catFrames.length||!['intro','play','pause'].includes(mode))return;
 const f=catFrames[companion.frame],width=112,height=f.height/f.width*width;
 ctx.drawImage(f,companion.x-width/2,companion.feet-height,width,height);
}
function draw(){ctx.clearRect(0,0,W,H);background();if(LEVEL.extra)drawNucleus(ctx,boss,nucleusParts,reduced);if(mode==='transition'||(mode==='pause'&&beforePause==='transition')){drawTransition();return;}ctx.save();ctx.translate(-cam+(Math.random()-.5)*shake,(Math.random()-.5)*shake);for(const p of LEVEL.platforms){if(p.x+p.w>cam-50&&p.x<cam+W+50)platform(p);}if(!LEVEL.extra){hangar(110,LEVEL.spawn.y+ROBOTS[LEVEL.robot].height);hangar(LEVEL.exit-60,LEVEL.platforms.find(p=>LEVEL.exit>=p.x&&LEVEL.exit<p.x+p.w).y,true);}for(const b of barriers)if(!b.dead)barrier(b);for(let i=0;i<LEVEL.checkpoints.length;i++)checkpointArt(LEVEL.checkpoints[i],i);
drawCompanion();drawBoss();for(const elite of elites){drawBoss(elite);if(elite.active&&!elite.dead){rect(elite.x+50,elite.floor-elite.h-18,160,5,"#17293a");rect(elite.x+50,elite.floor-elite.h-18,160*elite.hp/elite.maxHp,5,"#84dbbd");}}
for(const p of pickups){if(!p.taken&&energySprite){
 const bob=reduced?0:Math.sin(clock*3+p.x)*3,cx=p.x+12,cy=p.y+12+bob;
 ctx.save();ctx.shadowBlur=10;ctx.shadowColor='#55e3f3';
 const height=34,width=energySprite.width/energySprite.height*height;
 ctx.drawImage(energySprite,cx-width/2,cy-height/2,width,height);ctx.restore();
}}

for(const e of enemies){if(!e.dead&&e.x>cam-100&&e.x<cam+W+100)enemySprite(e);}
if(mode==='menu'){robot(290,410,4,1.55);}
else if(mode==='intro'){robot(150,470,4,1,1,intro>2.3?1:.6);if(intro>2.4){ctx.globalAlpha=Math.max(0,1-(intro-2.4));rect(130,455,80,105,'#9cf5ff');ctx.globalAlpha=1;}}
else if(player){let frame=player.crouching?7:player.aimUp?4:!player.grounded?6:Math.abs(player.vx)>10?Math.floor(clock*11)%4:shotCooldown>.08?5:4;robot(player.x,player.y,frame,1,player.face,invulnerable>0&&Math.floor(clock*12)%2?.45:1,player.h,player.aimUp,player.robot);}
for(const s of shots){if(s.friendly){drawPlayerShot(ctx,s,clock,reduced);continue;}if(s.reactorBurst){drawReactorBurst(ctx,s,clock,reduced);continue;}ctx.save();ctx.shadowBlur=reduced?0:12;ctx.shadowColor=s.nucleus?'#ef58ff':'#ff755a';ellipse(s.x,s.y,s.w/2,s.h/2,s.nucleus?'#ffc9ff':'#ff9a68');line(s.x-s.vx*.025,s.y-s.vy*.025,s.x,s.y,'#fb5f50',Math.min(s.w,s.h)*.55);ctx.restore();}drawShotEffects(ctx,weaponEffects,reduced);for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,3,3,p.color);}ctx.globalAlpha=1;ctx.restore();
for(let i=0;i<24;i++){const x=(i*137+clock*13)%W,y=(i*71)%H;ellipse(x,y,1,1,'#ffdbab45');}if(mode==='intro'){text(intro<2.5?'DAIGO → PROTESSER':'SINCRONIZACIÓN COMPLETA',W/2,610,23,'#a9f6ff','center');}}
function barrier(b){
 const frame=crateFrames[b.hp<6?1:0];if(frame)ctx.drawImage(frame,b.x,b.y,b.w,b.h);
}
function enemySprite(e){
 const frame=spriteFrames['enemy-'+e.group]?.[e.frame+(e.flash>0?1:0)];if(!frame)return;
 const face=player&&player.x+player.w/2<e.x+e.w/2?-1:1;
 ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);ctx.scale(face,1);
 if(e.type!=='drone')ellipse(0,1,e.w*.5,5,'#040b1599');
 const recoil=e.flash>0?-2:0;ctx.save();if(['D','E','F'].includes(e.group))ctx.scale(-1,1);ctx.drawImage(frame,-(e.w+20)/2+recoil,-e.h-3,e.w+20,e.h+3);ctx.restore();
 // A small charge indicator preserves the readable warning before a shot.
 if(e.timer<.4){ctx.globalAlpha=.65+Math.sin(clock*28)*.25;ellipse(e.w/2+9,-e.h*(1-e.muzzleY),3,3,'#ffd28a');}
 ctx.restore();
 if(e.type==='armor'&&e.hp<e.maxHp){rect(e.x+10,e.y-12,e.w-20,3,'#182734');rect(e.x+10,e.y-12,(e.w-20)*e.hp/e.maxHp,3,'#e7b563');}
}
function drawBoss(subject=boss){
 const boss=subject;
 if(boss?.kind==='nucleus')return;
 if(boss?.kind==='dokuma'){drawDokuma(ctx,boss,dokumaFrames,reduced,dokumaSummonFrames,dokumaPunchFrames);return;}
 if(boss?.kind==='dark'){drawDarkBoss(boss);return;}
 if(!boss||boss.dead||!bossSprite||boss.x>cam+W+100)return;
 ctx.save();
 const walkFrame=reduced?0:((Math.floor(-boss.walkDistance/10)%4)+4)%4;
 const sprite=bossWalkFrames[walkFrame]||bossSprite;
 ctx.filter=(boss.tint||'')+(boss.flash>0?' brightness(1.8)':'');
 ctx.drawImage(sprite,boss.x,boss.floor-boss.h,boss.w,boss.h);ctx.restore();
 if(boss.dead)return;
 if(boss.active){line(boss.left,boss.floor-200,boss.left,boss.floor,'#ee734c',4);}
 if(boss.state==='warning'){
  const alpha=.35+Math.sin(clock*18)*.15;ctx.save();ctx.globalAlpha=alpha;
  if(boss.attack==='beam')line(boss.left,boss.floor-110,boss.x+140,boss.floor-110,'#ff694f',3);
  else if(boss.attack==='shell'){rect(boss.targetX-75,boss.floor-8,150,8,'#ff674b');line(boss.targetX,boss.floor-190,boss.targetX,boss.floor,'#ff8c5c',2);}
  else if(boss.attack==='burst')line(boss.x+100,boss.floor-110,boss.targetX,boss.targetY,'#ff8765',2);  else line(boss.left,boss.floor-16,boss.x+100,boss.floor-16,'#ffb454',3);
  ctx.restore();ellipse(boss.x+210,boss.floor-265,9,9,'#ff6d67');
 }
 for(const h of boss.hazards){ctx.save();ctx.globalAlpha=.75;ctx.shadowBlur=25;ctx.shadowColor='#ff654c';rect(h.x,h.y,h.w,h.h,'#ff7955');ctx.restore();}
}
function chapterHint(){
 if(boss?.kind==='dokuma'&&boss.active){
  if(boss.state==='shift')return 'DOKUMA EVOLUCIONA · PREPARA EL SIGUIENTE ATAQUE';
  if(boss.state==='warning')return {eyes:'RAYOS OCULARES · AGÁCHATE O SALTA',fist:'PUÑO COLOSAL · SAL DE LA MARCA',tentacles:'TENTÁCULOS · DOBLE SALTO',drones:'DRONES DE ASALTO · APUNTA Y DISPARA'}[boss.attack];
  return 'DISPARA AL NÚCLEO VERDE · FASE '+boss.phase+' / 3';
 }
 const elite=elites.find(b=>b.active&&!b.dead);if(elite)return elite.name+' · ESQUIVA Y CONTRAATACA';
 if(!boss?.active)return boss?.dead?'SALIDA ABIERTA →':LEVEL.robot.toUpperCase()+' · '+LEVEL.title.toUpperCase()+' →';
 if(boss.hidden)return 'SEÑAL DE TELETRANSPORTE · PREPARA EL GIRO';
 if(boss.state==='warning')return boss.attack==='ambush'?'RÁFAGA TRAS EL GIRO · MUÉVETE Y CONTRAATACA':boss.attack==='sword'?'BARRIDO BAJO · DOBLE SALTO':'ESPADA VERTICAL · SAL DE LA MARCA';
 return 'DISPARA AL CUERPO · VIGILA AMBOS LADOS';
}
function drawDarkBoss(subject=boss){
 const boss=subject;
 if(!boss||boss.dead||!darkFrames.length||boss.x>cam+W+600)return;
 if(boss.hidden){
  const x=boss.destination+boss.w/2;
  ellipse(x,boss.floor-5,100,12,'#ed4b6740');
  line(x,boss.floor-480,x,boss.floor,'#f085a3',3);
  text('REAPARICIÓN',x,boss.floor-490,14,'#ffc0cb','center');return;
 }
 const attacking=boss.state==='attack',warning=boss.state==='warning';
 const pose=warning||attacking?(boss.attack==='ambush'?1:attacking?3:2):0;
 const f=darkFrames[pose],h=pose===3?boss.h*.87:boss.h,w=f.width/f.height*h;
 ctx.save();ctx.translate(boss.x+boss.w/2,boss.floor);ctx.scale(boss.face,1);
 ctx.filter=(boss.tint||'')+(boss.flash>0?' brightness(1.7)':'');
 ctx.drawImage(f,-w/2,-h,w,h);ctx.restore();
 if(!boss.active)return;
 line(boss.left,boss.floor-180,boss.left,boss.floor,'#bb475f',3);
 line(boss.right,boss.floor-180,boss.right,boss.floor,'#bb475f',3);
 if(warning){
  if(boss.attack==='ambush'){
   const m=darkMuzzle(boss);line(m.x,m.y,boss.targetX,boss.targetY,'#ffc297',2);
   ellipse(boss.targetX,boss.targetY,12,12,'#ffbb9638');
  }else{
   const h=darkSword(boss);
   line(h.x,boss.floor-4,h.x+h.w,boss.floor-4,'#ff986f',3);
   for(const edge of [h.x,h.x+h.w])line(edge,boss.floor-14,edge,boss.floor+1,'#ffd7b6',2);
  }
 }
 for(const h of boss.hazards){
  ctx.save();ctx.strokeStyle='#ffd7c2';ctx.lineWidth=5;ctx.shadowColor='#ff624c';ctx.shadowBlur=12;
  ctx.beginPath();
  if(boss.attack==='cleave'){
   const cx=h.x+h.w/2;ctx.moveTo(cx-18,h.y);ctx.quadraticCurveTo(cx+14,h.y+h.h*.5,cx,h.y+h.h);ctx.stroke();
   for(let i=-2;i<=2;i++)line(cx,boss.floor,cx+i*18,boss.floor-10-Math.abs(i)*8,'#ffb174',2);
  }else{
   const from=boss.face>0?h.x:h.x+h.w,to=boss.face>0?h.x+h.w:h.x;
   ctx.moveTo(from,h.y+15);ctx.quadraticCurveTo((from+to)/2,h.y+h.h,to,h.y+45);ctx.stroke();
  }
  ctx.restore();
 }
}

function drawGarbinTransition(t){
 const reverse=LEVEL.robot==='garbin',duration=transitionDuration();
 const phase=reverse?duration-t:t;
 // Use the same frontal open shell, limb closure and final turn as chapter 3.
 const pose=phase<4.4?8:phase<5.8?9:phase<7.2?10:phase<8.8?11:4;
 const f=spriteFrames.garbin?.[pose];
 if(f){const h=460,w=f.width/f.height*h;ctx.drawImage(f,810-w/2,604-h,w,h);}
 if(phase<4.4){const p=ease(Math.min(1,phase/3.8));couplingPose(8,440+370*p,604,320-90*p,Math.min(1,(4.4-phase)*2));}
 text('SANTORE / TRANSICIÓN '+String(LEVEL.id).padStart(2,'0')+' → '+String(LEVEL.id+1).padStart(2,'0'),64,192,14,'#e8b76d');
 text(reverse?'DESACOPLAMIENTO':'ACOPLAMIENTO',64,232,19,'#b9efff');
 text(reverse?'GARBIN → DELLINGER':'DELLINGER → GARBIN',64,264,15,'#e8c483');
 rect(64,290,330,4,'#233d4e');rect(64,290,330*Math.min(1,t/duration),4,'#79e5ef');
 text('DESTINO: '+LEVELS[LEVEL.id].title.toUpperCase(),64,340,12,'#a3bac8');
 if(t>duration-.5){ctx.save();ctx.globalAlpha=(t-duration+.5)*2;rect(0,0,W,H,'#07111f');ctx.restore();}
}
function couplingPose(index,x=810,feet=604,size=490,alpha=1){
 const pose=spriteFrames.coupling?.[index];if(!pose||alpha<=0)return;
 ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(pose,x-size/2,feet-size,size,size);ctx.restore();
}
function drawTransition(){
 const t=transitionTime,state=couplingState(t);
 const backdrop=assets['hangar-background'];
 if(backdrop)ctx.drawImage(backdrop,0,0,W,H);else rect(0,0,W,H,'#07111f');
 const shade=ctx.createLinearGradient(0,0,W,0);shade.addColorStop(0,'#030b16dd');shade.addColorStop(.48,'#030b1640');shade.addColorStop(1,'#030b1600');ctx.fillStyle=shade;ctx.fillRect(0,0,W,H);
 ellipse(810,606,190,18,'#69d9ec28');ellipse(810,606,130,9,'#91e9ed20');
 if(LEVEL.id>1){drawLaterTransition(t);return;}
 if(state.pose===0){
  couplingPose(0);
  if(t>.9){const p=state.entry;couplingPose(11,420+390*p,636-32*p,330+100*p,Math.min(1,(t-.9)*3));}
 }else{
  if(state.blend<1)couplingPose(state.previous);
  couplingPose(state.pose,810,604,490,state.blend);
 }
 // Brief mechanical confirmation lights accompany each latch, without a full-screen flash.
 if(state.pose>=2&&state.pose<=4&&state.blend<1&&!reduced){ctx.save();ctx.globalAlpha=(1-state.blend)*.65;ellipse(810,state.pose===2?505:state.pose===3?290:255,90,5,'#91eeff');ctx.restore();}
 text('SANTORE / ACOPLAMIENTO 01 → 02',64,192,14,'#e8b76d');
 text(state.label,64,232,19,'#b9efff');text('PROTESSER + DELLINGER',64,264,13,'#9eb3c2');
 rect(64,290,330,4,'#233d4e');rect(64,290,330*Math.min(1,t/10.4),4,'#79e5ef');
 const steps=['ALINEACIÓN','ENCAJE','CIERRE','GIRO'];const active=t<3?0:t<3.8?1:t<7.6?2:3;
 steps.forEach((label,i)=>{ellipse(72,340+i*31,4,4,i<=active?'#81e4eb':'#344d60');text(label,88,345+i*31,12,i===active?'#f2d093':'#91a8b8');});
 if(state.fade>0){ctx.save();ctx.globalAlpha=state.fade;rect(0,0,W,H,'#07111f');ctx.restore();}
}
function drawLaterTransition(t){
 const duration=transitionDuration();let label;
 if(LEVEL.id>=8){drawFinalTransition(t);return;}
 if(LEVEL.id>=4){drawGarbinTransition(t);return;}
 if(LEVEL.id===2){
  label='DELLINGER → PROTESSER';
  if(t<8.5){const state=couplingState(Math.max(0,10.4-t*1.22));couplingPose(state.pose);}
  else{couplingPose(0);const p=ease((t-8.5)/2);couplingPose(11,810-360*p,604,430-100*p);}
 }else{
  label=t<8?'PROTESSER → DELLINGER':'DELLINGER → GARBIN';
  if(t<8){const state=couplingState(t*10.4/8);if(state.pose===0){couplingPose(0);if(t>.7)couplingPose(11,420+390*state.entry,604,330+100*state.entry);}else couplingPose(state.pose);}
  else{
   const pose=t<11.2?8:t<12.1?9:t<13?10:t<13.8?11:4;
   const f=spriteFrames.garbin?.[pose];if(f){const h=460,w=f.width/f.height*h;ctx.drawImage(f,810-w/2,604-h,w,h);}
   if(t<11.2){const p=ease((t-8)/2.8);couplingPose(8,440+370*p,604,320-90*p,Math.min(1,(11.2-t)*3));}
  }
 }
 text('SANTORE / TRANSICIÓN '+String(LEVEL.id).padStart(2,'0')+' → '+String(LEVEL.id+1).padStart(2,'0'),64,192,14,'#e8b76d');
 text(LEVEL.id===2?'DESACOPLAMIENTO':'ACOPLAMIENTO DOBLE',64,232,19,'#b9efff');text(label,64,264,15,'#e8c483');
 rect(64,290,330,4,'#233d4e');rect(64,290,330*Math.min(1,t/duration),4,'#79e5ef');
 text('DESTINO: '+LEVELS[LEVEL.id].title.toUpperCase(),64,340,12,'#a3bac8');
 if(t>duration-.5){ctx.save();ctx.globalAlpha=(t-duration+.5)*2;rect(0,0,W,H,'#07111f');ctx.restore();}
}
function drawFinalTransition(t){
 const duration=transitionDuration();
 if(LEVEL.id===10){drawGarbinTransition(t);return;}
 if(LEVEL.id===11){robot(770,144,4,1,1,1,460,false,'garbin');}
 else if(LEVEL.id===8&&t<10.4){
  const phase=10.4-t,pose=phase<4.4?8:phase<5.8?9:phase<7.2?10:phase<8.8?11:4,f=spriteFrames.garbin?.[pose];
  if(f){const h=460,w=f.width/f.height*h;ctx.drawImage(f,810-w/2,604-h,w,h);}
  if(phase<4.4){const p=ease(phase/4.4);couplingPose(8,440+370*p,604,320-90*p);}
 }else{
  const reverse=LEVEL.id===8,local=reverse?t-10.4:t,state=couplingState(reverse?Math.max(0,10.4-local):local);
  couplingPose(state.pose);if(state.pose===0){const p=reverse?1-ease(Math.max(0,(local-7)/3.4)):state.entry;couplingPose(11,420+390*p,604,330+100*p);}
 }
 text('SANTORE / TRANSICIÓN '+String(LEVEL.id).padStart(2,'0')+' → '+String(LEVEL.id+1).padStart(2,'0'),64,192,14,'#e8b76d');
 text(LEVEL.id===11?'REABASTECIMIENTO':LEVEL.id===8?'DESACOPLAMIENTO DOBLE':'ACOPLAMIENTO',64,232,19,'#b9efff');
 text(LEVEL.robot.toUpperCase()+' → '+LEVELS[LEVEL.id].robot.toUpperCase(),64,264,15,'#e8c483');
 rect(64,290,330,4,'#233d4e');rect(64,290,330*Math.min(1,t/duration),4,'#79e5ef');
 text('DESTINO: '+LEVELS[LEVEL.id].title.toUpperCase(),64,340,12,'#a3bac8');
}
function syncDevPreview(){const id=Number($('dev-level').value)||1;$('preview-transition').disabled=id>=LEVELS.length;$('preview-transition').textContent=id<LEVELS.length?'PROBAR TRANSICIÓN '+String(id).padStart(2,'0')+' → '+String(id+1).padStart(2,'0'):'FINAL DE CAMPAÑA';}
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}
function keySprites(img,unit,rows=2,preserveCells=false,chroma='green'){spriteFrames[unit]=[];const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;const c=sheet.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const d=c.getImageData(0,0,img.width,img.height);for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];if((chroma==='green'&&g>100&&g>r*1.35&&g>b*1.35)||(chroma==='magenta'&&r>100&&b>100&&r>g*1.5&&b>g*1.5)){d.data[i+3]=0;}}c.putImageData(d,0,0);const cw=img.width/4,ch=img.height/rows;for(let i=0;i<4*rows;i++){const ox=(i%4)*cw,oy=Math.floor(i/4)*ch;let minX=cw,minY=ch,maxX=0,maxY=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){if(d.data[((oy+y)*img.width+ox+x)*4+3]>150){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}if(preserveCells){minX=0;minY=0;maxX=cw-1;maxY=ch-1;}const f=document.createElement('canvas');f.width=maxX-minX+1;f.height=maxY-minY+1;f.getContext('2d').drawImage(sheet,ox+minX,oy+minY,f.width,f.height,0,0,f.width,f.height);spriteFrames[unit].push(f);}}
window.addEventListener('keydown',e=>{if(maps[e.code]){e.preventDefault();keys.add(maps[e.code]);}if(e.code==='Escape'&&!e.repeat){mode==='pause'?resume():pause();}});window.addEventListener('keyup',e=>{keys.delete(maps[e.code]);});window.addEventListener('blur',()=>{keys.clear();touch.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('resize',()=>{if(innerHeight>innerWidth)pause();});
for(const button of document.querySelectorAll('[data-action]')){const release=e=>{e.preventDefault();touch.delete(button.dataset.action);button.classList.remove('active');};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(button.dataset.action);button.classList.add('active');});button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
$('start').onclick=()=>{activateAudio();reset(false,DEVELOPMENT_MODE?Number($('dev-level').value):1);};$('preview-transition').onclick=()=>{activateAudio();reset(false,Math.min(LEVELS.length-1,Number($('dev-level').value)||1));beginTransition();};$('continue').onclick=()=>{activateAudio();reset(true);};$('resume').onclick=resume;$('main-menu').onclick=returnToMenu;$('pause').onclick=pause;$('restart').onclick=()=>reset(false,LEVEL.id);$('again').onclick=()=>reset(false,LEVEL.id);$('dev-boss').onclick=()=>{activateAudio();reset(false,4);checkpoint=1;respawn();player.x=LEVEL.boss.trigger;cam=LEVEL.boss.left;save();};$('dev-boss-two').onclick=()=>{activateAudio();reset(false,8);checkpoint=1;respawn();player.x=LEVEL.boss.left+520;cam=LEVEL.boss.left;save();};$('dev-nucleus').onclick=()=>{activateAudio();reset(false,13);};$('dev-boss-final').onclick=()=>{activateAudio();reset(false,12);checkpoint=1;respawn();player.x=LEVEL.boss.trigger;boss.hp=Number($('dev-phase').value)===3?180:Number($('dev-phase').value)===2?360:540;cam=LEVEL.boss.left;save();};$('skip').onclick=finishTransition;$('level-two').onclick=()=>{activateAudio();reset(false,2);};$('sound').onclick=()=>{activateAudio();soundOn=!soundOn;ac?.setEnabled(soundOn);$('sound').textContent='SONIDO '+(soundOn?'ON':'OFF');};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();}catch{toast('Usa la opción de pantalla completa del navegador');}};
Promise.all(['nucleus-background','nucleus-parts','nucleus-rage','canyon','protesser','dellinger','quarry','coupling-front','enemy-army','enemy-group-b','enemy-group-c','industrial-props','energy-atom','companion','stations','hangar-background','garbin','boss-scorpion','enemy-group-d','fortress','tunnels','boss-walk','industrial-crates','dark-dellinger','garbin-up','enemy-group-e','enemy-group-f','foundry','dam','reactor','eclipse','dokuma','dokuma-summon','dokuma-punch'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{assets[name]=img;resolve();};img.onerror=()=>reject(new Error('No se pudo cargar '+name+'.webp'));img.src='assets/'+name+'.webp';}))).then(()=>{industrialParts=extractProps(assets['industrial-props'],INDUSTRIAL_REGIONS);nucleusParts=extractProps(assets['nucleus-parts'],[[0,0,.642,1],[.642,0,.358,1]],'green');nucleusParts.push(extractProps(assets['nucleus-rage'],[[.642,0,.358,1]],'green')[0]);
dokumaSummonFrames=extractProps(assets['dokuma-summon'],[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]],'magenta',true);
dokumaPunchFrames=extractProps(assets['dokuma-punch'],Array.from({length:6},(_,i)=>[i%3/3,Math.floor(i/3)/2,1/3,.5]),'magenta',true);
dokumaFrames=extractProps(assets.dokuma,[[0,0,.53,.5],[.53,0,.47,.5],[0,.5,.53,.5],[.53,.5,.47,.5]]);
stationParts=extractProps(assets.stations,[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]);
catFrames=extractProps(assets.companion,[[0,0,.285,.5],[.285,0,.22,.5],[.505,0,.24,.5],[.745,0,.255,.5],[0,.5,.255,.5],[.255,.5,.285,.5],[.54,.5,.23,.5],[.77,.5,.23,.5]]);
bossSprite=extractProps(assets['boss-scorpion'],[[0,0,1,1]])[0];
bossWalkFrames=extractProps(assets['boss-walk'],[[0,.016,.5,.467],[.5,.016,.5,.467],[0,.516,.5,.467],[.5,.516,.5,.467]],'magenta',true);
garbinUpFrames=extractProps(assets['garbin-up'],[[0,0,.5,1],[.5,0,.5,1]]);
darkFrames=extractProps(assets['dark-dellinger'],[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]);
crateFrames=extractProps(assets['industrial-crates'],[[0,0,.5,1],[.5,0,.5,1]]);
spriteFrames.garbin=extractProps(assets.garbin,[[0,0,.25,.305],[.25,0,.25,.305],[.5,0,.25,.305],[.75,0,.25,.305],[0,.305,.24,.325],[.24,.305,.26,.325],[.5,.305,.25,.325],[.75,.305,.25,.325],[0,.63,.265,.37],[.265,.63,.27,.37],[.535,.63,.25,.37],[.785,.63,.215,.37]],'green');
energySprite=extractProps(assets['energy-atom'],[[0,0,1,1]])[0];keySprites(assets.protesser,'protesser');keySprites(assets.dellinger,'dellinger');keySprites(assets['coupling-front'],'coupling',3,true);for(const [group,spec] of Object.entries(ENEMY_GROUPS)){if(spec.available)keySprites(assets[spec.asset],'enemy-'+group,2,false,'magenta');}$('start').disabled=false;$('start').textContent='INICIAR MISIÓN →';$('dev-tools').hidden=!DEVELOPMENT_MODE;$('dev-level').replaceChildren(...LEVELS.map(l=>new Option('Nivel '+l.id+' · '+l.title+' / '+l.robot,l.id)));$('dev-level').onchange=syncDevPreview;syncDevPreview();$('continue').hidden=!saved();$('level-two').hidden=(saved()?.unlocked||1)<2;}).catch(error=>{console.error('Carga de Gordian:',error);$('start').disabled=false;$('start').textContent='REINTENTAR CARGA ↻';$('app-status').textContent=error.message+'. Si aparece ACTUALIZAR JUEGO, púlsalo para descargar la corrección.';$('start').onclick=()=>{if(!$('update-app').hidden)$('update-app').click();else location.reload();};});requestAnimationFrame(frame);


