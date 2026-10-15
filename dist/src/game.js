import {createCompanion,updateCompanion} from './companion.js';
import {extractProps,buildPlatform,INDUSTRIAL_REGIONS} from './environment.js';
import {enemySpec,enemyMuzzle,groupForEnemy,ENEMY_GROUPS} from './enemies.js';
import {COUPLING_DURATION,couplingState,ease} from './coupling.js';
import {DEVELOPMENT_MODE} from './config.js';
import {LEVELS,ROBOTS,GRAVITY,moveBody,overlaps} from './level.js';
import {setStance,playerShot,shotBounds} from './combat.js';
import {normalizeSave,blockHorizontal} from './campaign.js';
let LEVEL=LEVELS[0],unlocked=1,transitionTime=0,barriers=[];
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),W=1280,H=720;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='menu',beforePause='play',clock=0,elapsed=0,cam=0,shake=0,intro=0,toastUntil=0,checkpoint=-1,kills=0,cells=0,energy=100,last=0,acc=0,soundOn=true,ac=null,musicTick=0;
let player,enemies=[],shots=[],particles=[],pickups=[],keys=new Set(),touch=new Set(),prevJump=false,chargeLatch=false,jumpBuffer=0,coyote=0,shotCooldown=0,chargeCooldown=0,invulnerable=0,respawnTimer=0;
const platformCache=new Map();let industrialParts=[],energySprite=null,stationParts=[],catFrames=[],companion=null;
const assets={};let spriteFrames={};
const maps={ArrowDown:'crouch',KeyS:'crouch',ArrowUp:'up',KeyW:'up',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',KeyZ:'jump',KeyX:'fire',KeyJ:'fire',KeyC:'charge',KeyK:'charge'};
const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
const ellipse=(x,y,rx,ry,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();};
function line(x,y,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.stroke();}
function text(s,x,y,size=16,color='#ecd5aa',align='left'){ctx.fillStyle=color;ctx.font=`bold ${size}px Arial`;ctx.textAlign=align;ctx.fillText(s,x,y);}
function save(stage='play'){try{localStorage.setItem('gordian-v2',JSON.stringify({version:2,levelId:LEVEL.id,unlocked,checkpoint,kills,cells,elapsed,stage,defeated:enemies.filter(e=>e.dead).map(e=>e.id),collected:pickups.filter(p=>p.taken).map(p=>p.id),destroyed:barriers.filter(b=>b.dead).map(b=>b.id)}));}catch{}}
function saved(){try{return normalizeSave(JSON.parse(localStorage.getItem('gordian-v2')||localStorage.getItem('gordian-v1')));}catch{return null;}}
function hud(){document.querySelector('.unit strong').textContent=LEVEL.robot.toUpperCase();document.querySelector('.unit .eyebrow').textContent='SISTEMA ACTIVO / 0'+LEVEL.id;document.querySelector('.mission small').textContent='NIVEL 0'+LEVEL.id+' / 12';document.querySelector('.mission strong').textContent=LEVEL.title.toUpperCase();$('health').style.width=player.health/ROBOTS[LEVEL.robot].maxHealth*100+'%';$('energy').textContent='ENERGÍA '+Math.floor(energy)+'%';$('progress').style.width=Math.min(100,player.x/LEVEL.exit*100)+'%';}
function tone(freq,dur=.08,type='square',volume=.025,end=freq){if(!soundOn||!ac)return;const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),ac.currentTime+dur);g.gain.setValueAtTime(volume,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.connect(g);g.connect(ac.destination);o.start();o.stop(ac.currentTime+dur);}
function activateAudio(){try{ac??=new AudioContext();ac.resume();}catch{}}
function toast(s,duration=3){$('toast').textContent=s;toastUntil=clock+duration;}
function reset(continuing=false,levelId=1){
 const data=continuing?saved():null;LEVEL=LEVELS.find(l=>l.id===(data?.levelId||levelId))||LEVELS[0];
 unlocked=Math.max(LEVEL.id,saved()?.unlocked||1);checkpoint=data?.checkpoint??-1;kills=data?.kills||0;cells=data?.cells||0;elapsed=data?.elapsed||0;
 energy=100;shots=[];particles=[];pickups=LEVEL.pickups.map((p,id)=>({...p,id,taken:data?.collected.includes(id)||false}));
 barriers=(LEVEL.barriers||[]).map((b,id)=>({...b,id,hp:6,dead:data?.destroyed.includes(id)||false}));
 const spec=ROBOTS[LEVEL.robot],pos=checkpoint>=0?LEVEL.checkpoints[checkpoint]:LEVEL.spawn;
 player={...pos,robot:LEVEL.robot,w:spec.width,h:spec.height,vx:0,vy:0,grounded:false,health:spec.maxHealth,face:1,crouching:false,aimUp:false};
 enemies=LEVEL.enemies.map(([type,x,y],id)=>{const spec=enemySpec(type,LEVEL.id,groupForEnemy(LEVEL.id,id),LEVEL.robot);return {...spec,id,type,x,y:type==='drone'?y:y-spec.h,baseY:type==='drone'?y:y-spec.h,maxHp:spec.hp,flash:0,timer:1+id*.13,phase:id,dead:data?.defeated.includes(id)||(checkpoint>=0&&x<pos.x-120)};});
 companion=createCompanion(LEVEL,!continuing&&!reduced);
 cam=Math.max(0,player.x-330);intro=0;prevJump=false;chargeLatch=false;jumpBuffer=0;coyote=0;invulnerable=2;respawnTimer=0;shotCooldown=0;chargeCooldown=0;
 mode=continuing||LEVEL.id>1?'play':'intro';$('menu').hidden=true;$('pause-menu').hidden=true;$('end').hidden=true;$('skip').hidden=true;$('hud').hidden=false;$('touch').hidden=!matchMedia('(pointer:coarse)').matches;
 keys.clear();touch.clear();hud();canvas.focus();toast(LEVEL.id===2?'DELLINGER ACTIVO · ABRE PASO EN LA CANTERA':continuing?'MISIÓN RECUPERADA':'DAIGO · EL LEGADO DE TU PADRE TE ESPERA',4);
 if(data?.stage==='transition')beginTransition();else if(data?.stage==='complete')completeLevel();else save();
}
function beginTransition(){mode='transition';transitionTime=0;unlocked=2;keys.clear();touch.clear();$('touch').hidden=true;$('skip').hidden=false;$('hint').textContent='PROTESSER → DELLINGER';toast('ACOPLAMIENTO AUTORIZADO',3);save('transition');}
function finishTransition(){reset(false,2);save();}
function completeLevel(){
 if(LEVEL.id===1){beginTransition();return;}
 mode='end';$('end').hidden=false;$('touch').hidden=true;$('hint').textContent='';
 $('summary').textContent='Cantera asegurada. '+kills+' enemigos neutralizados · '+cells+' células recuperadas · '+Math.floor(elapsed/60)+':'+String(Math.floor(elapsed%60)).padStart(2,'0');save('complete');tone(440,.6,'triangle',.04,880);
}
function burst(x,y,color,n=14){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=60+Math.random()*240;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.5,color});}}
function damage(amount){if(invulnerable>0||mode!=='play')return;player.health=Math.max(0,player.health-amount);invulnerable=1.3;shake=reduced?0:9;tone(90,.2,'sawtooth',.04,35);burst(player.x+20,player.y+40,'#ffc071');if(player.health===0){mode='dead';respawnTimer=1.2;toast('SISTEMA DAÑADO · REINICIANDO',2);}}
function respawn(){const pos=checkpoint>=0?LEVEL.checkpoints[checkpoint]:LEVEL.spawn;Object.assign(player,pos,{vx:0,vy:0,health:ROBOTS[LEVEL.robot].maxHealth,h:ROBOTS[LEVEL.robot].height,crouching:false,aimUp:false});energy=100;shots=[];invulnerable=2;mode='play';cam=Math.max(0,player.x-330);toast('PUNTO DE CONTROL RESTAURADO',2);}
function pause(){if(!['play','intro','transition'].includes(mode))return;beforePause=mode;mode='pause';keys.clear();touch.clear();$('pause-menu').hidden=false;$('skip').hidden=true;}
function resume(){if(innerHeight>innerWidth)return;$('pause-menu').hidden=true;mode=beforePause;$('skip').hidden=mode!=='transition';last=performance.now();acc=0;canvas.focus();}
function input(){let a=new Set([...keys,...touch]);const gp=navigator.getGamepads?.()[0];if(gp){if(gp.axes[1]<-.4||gp.buttons[12]?.pressed)a.add('up');if(gp.axes[1]>.4||gp.buttons[13]?.pressed)a.add('crouch');if(gp.axes[0]<-.25||gp.buttons[14]?.pressed)a.add('left');if(gp.axes[0]>.25||gp.buttons[15]?.pressed)a.add('right');if(gp.buttons[0]?.pressed)a.add('jump');if(gp.buttons[2]?.pressed||gp.buttons[7]?.pressed)a.add('fire');if(gp.buttons[1]?.pressed)a.add('charge');}return a;}
function fire(charged=false){const shot=playerShot(player,charged),{x,y}=shot;shots.push(shot);shotCooldown=LEVEL.robot==='dellinger'?.24:.17;if(charged){energy-=35;chargeCooldown=.65;shake=reduced?0:3;}tone(charged?150:620,charged?.22:.08,'sawtooth',.025,charged?50:180);burst(x,y,'#83efff',charged?12:3);}
function update(dt){clock+=dt;if(clock>toastUntil)$('toast').textContent='';if(mode==='menu'||mode==='pause'||mode==='end')return;if(innerHeight>innerWidth){pause();return;}if(mode==='transition'){transitionTime+=dt;if(transitionTime>=COUPLING_DURATION)finishTransition();return;}if(mode==='dead'){respawnTimer-=dt;if(respawnTimer<=0)respawn();return;}updateCompanion(companion,dt,cam);if(mode==='intro'){intro+=dt;player.x=150;player.y=470;if(intro>4){mode='play';toast('PROTESSER ACTIVO · ALCANZA EL HANGAR',3);tone(440,.2,'triangle',.04,880);}return;}
elapsed+=dt;energy=Math.min(100,energy+dt*7);invulnerable=Math.max(0,invulnerable-dt);shotCooldown-=dt;chargeCooldown-=dt;shake=Math.max(0,shake-dt*30);musicTick+=dt;if(musicTick>.6){musicTick=0;const seq=[110,110,146.83,130.81,98,110,164.81,146.83];tone(seq[Math.floor(clock/.6)%8],.3,'triangle',.008);}
const a=input(),jump=a.has('jump');player.aimUp=a.has('up');setStance(player,a.has('crouch'),ROBOTS[LEVEL.robot].height);if(jump&&!prevJump)jumpBuffer=.13;prevJump=jump;jumpBuffer-=dt;coyote=player.grounded?.1:coyote-dt;player.vx=(Number(a.has('right'))-Number(a.has('left')))*ROBOTS[LEVEL.robot].speed*(player.crouching?.4:1);if(player.vx)player.face=Math.sign(player.vx);if(jumpBuffer>0&&coyote>0){setStance(player,false,ROBOTS[LEVEL.robot].height);player.vy=-ROBOTS[LEVEL.robot].jump;jumpBuffer=0;coyote=0;player.grounded=false;tone(180,.12,'triangle',.03,520);burst(player.x+20,player.y+90,'#c1b093',5);}if(!jump&&player.vy<-250)player.vy+=GRAVITY*dt*.85;player.vy=Math.min(1000,player.vy+GRAVITY*dt);const previousX=player.x;moveBody(player,[...LEVEL.platforms,...barriers.filter(b=>!b.dead)],dt);blockHorizontal(player,previousX,barriers);player.x=Math.max(0,Math.min(LEVEL.width-player.w,player.x));if(player.y>810){player.health=0;mode='dead';respawnTimer=.7;toast('CAÍDA · RECUPERANDO SEÑAL',2);return;}if(a.has('fire')&&shotCooldown<=0)fire();if(a.has('charge')&&!chargeLatch&&energy>=35&&chargeCooldown<=0)fire(true);chargeLatch=a.has('charge');
for(let i=0;i<LEVEL.checkpoints.length;i++){if(player.x>LEVEL.checkpoints[i].x&&checkpoint<i){checkpoint=i;player.health=ROBOTS[LEVEL.robot].maxHealth;save();toast('PUNTO DE CONTROL · SISTEMAS RESTAURADOS');tone(440,.25,'triangle',.04,880);}}
for(const p of pickups){if(!p.taken&&overlaps(player,{...p,w:24,h:24})){p.taken=true;cells++;player.health=Math.min(ROBOTS[LEVEL.robot].maxHealth,player.health+25);energy=Math.min(100,energy+25);burst(p.x,p.y,'#65fff0');tone(660,.15,'sine',.04,990);save();}}
for(const e of enemies){if(e.dead||Math.abs(e.x-player.x)>850)continue;e.timer-=dt;e.flash=Math.max(0,e.flash-dt);if(e.type==='drone'){e.y=e.baseY+Math.sin(clock*2+e.phase)*24;e.x+=Math.sin(clock+e.phase)*dt*28;}if(e.timer<=0){e.timer=e.type==='armor'?1.6:e.type==='turret'?1.9:2.6;e.flash=.14;const face=player.x+player.w/2<e.x+e.w/2?-1:1,muzzle=enemyMuzzle(e,face),dx=player.x+player.w/2-muzzle.x,dy=player.y+player.h*.45-muzzle.y,l=Math.hypot(dx,dy)||1;shots.push({...muzzle,w:13,h:10,vx:dx/l*220,vy:dy/l*220,friendly:false,life:4});}if(overlaps(player,e))damage(18);}
for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.friendly){for(const b of barriers){if(!b.dead&&overlaps(shotBounds(s),b)){b.hp-=s.damage;s.life=0;burst(s.x,s.y,'#ffb466',6);if(b.hp<=0){b.dead=true;burst(b.x+30,b.y+40,'#ffc476',28);save();}break;}}if(s.life<=0)continue;for(const e of enemies){if(!e.dead&&overlaps(shotBounds(s),e)){e.hp-=s.damage;s.life=0;burst(s.x,s.y,'#ffcc7a',6);if(e.hp<=0){e.dead=true;kills++;save();burst(e.x+25,e.y+20,'#ffb466',25);tone(70,.18,'sawtooth',.035,25);shake=reduced?0:5;}break;}}}else if(overlaps(shotBounds(s),player)){damage(12);s.life=0;}}
shots=shots.filter(s=>s.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);cam+=(Math.max(0,Math.min(LEVEL.width-W,player.x-W*.32))-cam)*Math.min(1,dt*5);
if(player.x>LEVEL.exit){completeLevel();return;}
hud();$('hint').textContent=LEVEL.id===2?(player.x<900?'DELLINGER · DISPARA PARA ROMPER LAS BARRERAS':player.x>5700?'ALCANZA LA SALIDA →':'CANTERA · ↑ APUNTA A LOS DRONES · ↓ ESQUIVA'):player.x<680?'SALTA EL CAÑÓN · Z / ESPACIO':player.x<1600?'↓ AGACHARSE · ↑ + DISPARO ARRIBA':player.x>5500?'ALCANZA EL HANGAR →':'VICTOR TOWN · RUMBO AL HANGAR →';}

function background(){const backdrop=assets[LEVEL.background||'canyon'];if(backdrop){const s=Math.max(W/backdrop.width,H/backdrop.height),w=backdrop.width*s*1.22,h=backdrop.height*s*1.22;ctx.drawImage(backdrop,-(cam/(LEVEL.width-W))*(w-W),-(h-H)*.35,w,h);}else rect(0,0,W,H,'#b36d63');const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10223d18');g.addColorStop(.7,'#10223d10');g.addColorStop(1,'#071324bb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam*.32,0);for(let i=0;i<19;i++){let x=i*200,y=430+(i%3)*35;rect(x,y,65,300,'#1a28375c');rect(x-6,y,77,10,'#24313b77');for(let j=0;j<3;j++)rect(x+12+j*16,y+18,6,4,'#f6ae6940');}ctx.restore();}
function platform(p){
 if(!industrialParts.length){rect(p.x,p.y,p.w,30,'#354455');return;}
 const key=LEVEL.id+':'+p.x+':'+p.y+':'+p.w;
 if(!platformCache.has(key))platformCache.set(key,buildPlatform(p,LEVEL.id,industrialParts));
 ctx.drawImage(platformCache.get(key),p.x,p.y-36);
}
function robot(x,y,frame=4,scale=1,face=1,alpha=1,height=90,aimUp=false,unit=LEVEL.robot){const frames=spriteFrames[unit];if(!frames?.length)return;const f=frames[frame];ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+ROBOTS[unit].width/2*scale,y+height*scale);ctx.scale(face*scale,scale);const targetH=height<ROBOTS[unit].height?height*1.21:height*1.145,targetW=f.width/f.height*targetH;if(aimUp){const splitX=f.width*.54,splitY=f.height*.34,dx=-targetW*.5,dy=-targetH;ctx.drawImage(f,0,splitY,f.width,f.height-splitY,dx,dy+targetH*.34,targetW,targetH*.66);ctx.drawImage(f,0,0,splitX,splitY,dx,dy,targetW*.54,targetH*.34);ctx.save();ctx.translate(dx+targetW*.54,dy+targetH*.23);ctx.rotate(-Math.PI/2);ctx.drawImage(f,splitX,0,f.width-splitX,splitY,0,-targetH*.23,targetW*.46,targetH*.34);ctx.restore();}else ctx.drawImage(f,-targetW*.5,-targetH,targetW,targetH);ctx.restore();}
function hangar(x,y,arrival=false){
 const f=stationParts[arrival?1:0];if(!f)return;
 const height=LEVEL.robot==='dellinger'?230:205,width=f.width/f.height*height;
 ctx.drawImage(f,x+60-width/2,y-height,width,height);
 text(arrival?'SALIDA / 0'+LEVEL.id:'SANTORE / 0'+LEVEL.id,x+60,y-height-7,11,'#e5bf88','center');
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
function draw(){ctx.clearRect(0,0,W,H);background();if(mode==='transition'||(mode==='pause'&&beforePause==='transition')){drawTransition();return;}ctx.save();ctx.translate(-cam+(Math.random()-.5)*shake,(Math.random()-.5)*shake);for(const p of LEVEL.platforms){if(p.x+p.w>cam-50&&p.x<cam+W+50)platform(p);}hangar(110,560);hangar(LEVEL.exit-60,LEVEL.id===1?500:510,true);for(const b of barriers)if(!b.dead)barrier(b);for(let i=0;i<LEVEL.checkpoints.length;i++)checkpointArt(LEVEL.checkpoints[i],i);
drawCompanion();
for(const p of pickups){if(!p.taken&&energySprite){
 const bob=reduced?0:Math.sin(clock*3+p.x)*3,cx=p.x+12,cy=p.y+12+bob;
 ctx.save();ctx.shadowBlur=10;ctx.shadowColor='#55e3f3';
 const height=34,width=energySprite.width/energySprite.height*height;
 ctx.drawImage(energySprite,cx-width/2,cy-height/2,width,height);ctx.restore();
}}

for(const e of enemies){if(!e.dead&&e.x>cam-100&&e.x<cam+W+100)enemySprite(e);}
if(mode==='menu'){robot(290,410,4,1.55);}
else if(mode==='intro'){robot(150,470,4,1,1,intro>2.3?1:.6);if(intro>2.4){ctx.globalAlpha=Math.max(0,1-(intro-2.4));rect(130,455,80,105,'#9cf5ff');ctx.globalAlpha=1;}}
else if(player){let frame=player.crouching?7:player.aimUp?4:!player.grounded?6:Math.abs(player.vx)>10?Math.floor(clock*11)%4:shotCooldown>.08?5:4;robot(player.x,player.y,frame,1,player.face,invulnerable>0&&Math.floor(clock*12)%2?.45:1,player.h,player.aimUp);}
for(const s of shots){ctx.save();ctx.shadowBlur=s.friendly?18:12;ctx.shadowColor=s.friendly?'#53dcff':'#ff755a';ellipse(s.x,s.y,s.w/2,s.h/2,s.friendly?'#a4f7ff':'#ff9a68');line(s.x-s.vx*.025,s.y-s.vy*.025,s.x,s.y,s.friendly?'#52c9ff':'#fb5f50',Math.min(s.w,s.h)*.55);ctx.restore();}for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,3,3,p.color);}ctx.globalAlpha=1;ctx.restore();
for(let i=0;i<24;i++){const x=(i*137+clock*13)%W,y=(i*71)%H;ellipse(x,y,1,1,'#ffdbab45');}if(mode==='intro'){text(intro<2.5?'DAIGO → PROTESSER':'SINCRONIZACIÓN COMPLETA',W/2,610,23,'#a9f6ff','center');}}
function barrier(b){
 rect(b.x,b.y,b.w,b.h,'#283c4b');rect(b.x+5,b.y+5,b.w-10,b.h-10,'#6f6550');
 line(b.x+8,b.y+8,b.x+b.w-8,b.y+b.h-8,'#baa078',7);line(b.x+b.w-8,b.y+8,b.x+8,b.y+b.h-8,'#baa078',7);
 rect(b.x,b.y+b.h*.45,b.w,12,'#d3a648');for(let x=b.x+6;x<b.x+b.w;x+=18)line(x,b.y+b.h*.45,x-6,b.y+b.h*.45+12,'#253445',6);
 if(b.hp<6){line(b.x+20,b.y,b.x+34,b.y+35,'#131e29',3);line(b.x+34,b.y+35,b.x+19,b.y+65,'#131e29',3);}
}
function enemySprite(e){
 const frame=spriteFrames['enemy-'+e.group]?.[e.frame+(e.flash>0?1:0)];if(!frame)return;
 const face=player&&player.x+player.w/2<e.x+e.w/2?-1:1;
 ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h);ctx.scale(face,1);
 if(e.type!=='drone')ellipse(0,1,e.w*.5,5,'#040b1599');
 const recoil=e.flash>0?-2:0;ctx.drawImage(frame,-(e.w+20)/2+recoil,-e.h-3,e.w+20,e.h+3);
 // A small charge indicator preserves the readable warning before a shot.
 if(e.timer<.4){ctx.globalAlpha=.65+Math.sin(clock*28)*.25;ellipse(e.w/2+9,-e.h*(1-e.muzzleY),3,3,'#ffd28a');}
 ctx.restore();
 if(e.type==='armor'&&e.hp<e.maxHp){rect(e.x+10,e.y-12,e.w-20,3,'#182734');rect(e.x+10,e.y-12,(e.w-20)*e.hp/e.maxHp,3,'#e7b563');}
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
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}
function keySprites(img,unit,rows=2,preserveCells=false,chroma='green'){spriteFrames[unit]=[];const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;const c=sheet.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const d=c.getImageData(0,0,img.width,img.height);for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];if((chroma==='green'&&g>100&&g>r*1.35&&g>b*1.35)||(chroma==='magenta'&&r>100&&b>100&&r>g*1.5&&b>g*1.5)){d.data[i+3]=0;}}c.putImageData(d,0,0);const cw=img.width/4,ch=img.height/rows;for(let i=0;i<4*rows;i++){const ox=(i%4)*cw,oy=Math.floor(i/4)*ch;let minX=cw,minY=ch,maxX=0,maxY=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){if(d.data[((oy+y)*img.width+ox+x)*4+3]>150){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}if(preserveCells){minX=0;minY=0;maxX=cw-1;maxY=ch-1;}const f=document.createElement('canvas');f.width=maxX-minX+1;f.height=maxY-minY+1;f.getContext('2d').drawImage(sheet,ox+minX,oy+minY,f.width,f.height,0,0,f.width,f.height);spriteFrames[unit].push(f);}}
window.addEventListener('keydown',e=>{if(maps[e.code]){e.preventDefault();keys.add(maps[e.code]);}if(e.code==='Escape'&&!e.repeat){mode==='pause'?resume():pause();}});window.addEventListener('keyup',e=>{keys.delete(maps[e.code]);});window.addEventListener('blur',()=>{keys.clear();touch.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('resize',()=>{if(innerHeight>innerWidth)pause();});
for(const button of document.querySelectorAll('[data-action]')){const release=e=>{e.preventDefault();touch.delete(button.dataset.action);button.classList.remove('active');};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(button.dataset.action);button.classList.add('active');});button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
$('start').onclick=()=>{activateAudio();reset(false,DEVELOPMENT_MODE?Number($('dev-level').value):1);};$('preview-transition').onclick=()=>{activateAudio();reset(false,1);beginTransition();};$('continue').onclick=()=>{activateAudio();reset(true);};$('resume').onclick=resume;$('pause').onclick=pause;$('restart').onclick=()=>reset(false,LEVEL.id);$('again').onclick=()=>reset(false,2);$('skip').onclick=finishTransition;$('level-two').onclick=()=>{activateAudio();reset(false,2);};$('sound').onclick=()=>{activateAudio();soundOn=!soundOn;$('sound').textContent='SONIDO '+(soundOn?'ON':'OFF');};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();}catch{toast('Usa la opción de pantalla completa del navegador');}};
Promise.all(['canyon','protesser','dellinger','quarry','coupling-front','enemy-army','enemy-group-b','enemy-group-c','industrial-props','energy-atom','companion','stations','hangar-background'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{assets[name]=img;resolve();};img.onerror=()=>reject(new Error(name));img.src='assets/'+name+'.webp';}))).then(()=>{industrialParts=extractProps(assets['industrial-props'],INDUSTRIAL_REGIONS);
stationParts=extractProps(assets.stations,[[0,0,.5,.5],[.5,0,.5,.5],[0,.5,.5,.5],[.5,.5,.5,.5]]);
catFrames=extractProps(assets.companion,[[0,0,.285,.5],[.285,0,.22,.5],[.505,0,.24,.5],[.745,0,.255,.5],[0,.5,.255,.5],[.255,.5,.285,.5],[.54,.5,.23,.5],[.77,.5,.23,.5]]);
energySprite=extractProps(assets['energy-atom'],[[0,0,1,1]])[0];keySprites(assets.protesser,'protesser');keySprites(assets.dellinger,'dellinger');keySprites(assets['coupling-front'],'coupling',3,true);for(const [group,spec] of Object.entries(ENEMY_GROUPS)){if(spec.available)keySprites(assets[spec.asset],'enemy-'+group,2,false,'magenta');}$('start').disabled=false;$('start').textContent='INICIAR MISIÓN →';$('dev-tools').hidden=!DEVELOPMENT_MODE;$('dev-level').replaceChildren(...LEVELS.map(l=>new Option('Nivel '+l.id+' · '+l.title+' / '+l.robot,l.id)));$('continue').hidden=!saved();$('level-two').hidden=(saved()?.unlocked||1)<2;}).catch(()=>{$('start').textContent='ERROR DE RECURSOS · RECARGA';});requestAnimationFrame(frame);

