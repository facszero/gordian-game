import {DEVELOPMENT_MODE} from './config.js';
import {LEVELS,ROBOTS,GRAVITY,moveBody,overlaps} from './level.js';
import {setStance,playerShot,shotBounds} from './combat.js';
import {normalizeSave,blockHorizontal} from './campaign.js';
let LEVEL=LEVELS[0],unlocked=1,transitionTime=0,barriers=[];
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d'),W=1280,H=720;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let mode='menu',beforePause='play',clock=0,elapsed=0,cam=0,shake=0,intro=0,toastUntil=0,checkpoint=-1,kills=0,cells=0,energy=100,last=0,acc=0,soundOn=true,ac=null,musicTick=0;
let player,enemies=[],shots=[],particles=[],pickups=[],keys=new Set(),touch=new Set(),prevJump=false,chargeLatch=false,jumpBuffer=0,coyote=0,shotCooldown=0,chargeCooldown=0,invulnerable=0,respawnTimer=0;
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
 enemies=LEVEL.enemies.map(([type,x,y],id)=>{const h=type==='armor'?78:type==='turret'?44:42;return {id,type,x,y:type==='drone'?y:y-h,baseY:type==='drone'?y:y-h,w:type==='armor'?76:type==='turret'?65:58,h,hp:type==='armor'?10:type==='turret'?4:2,timer:1+id*.13,phase:id,dead:data?.defeated.includes(id)||(checkpoint>=0&&x<pos.x-120)};});
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
function update(dt){clock+=dt;if(clock>toastUntil)$('toast').textContent='';if(mode==='menu'||mode==='pause'||mode==='end')return;if(innerHeight>innerWidth){pause();return;}if(mode==='transition'){transitionTime+=dt;if(transitionTime>=7)finishTransition();return;}if(mode==='dead'){respawnTimer-=dt;if(respawnTimer<=0)respawn();return;}if(mode==='intro'){intro+=dt;player.x=150;player.y=470;if(intro>4){mode='play';toast('PROTESSER ACTIVO · ALCANZA EL HANGAR',3);tone(440,.2,'triangle',.04,880);}return;}
elapsed+=dt;energy=Math.min(100,energy+dt*7);invulnerable=Math.max(0,invulnerable-dt);shotCooldown-=dt;chargeCooldown-=dt;shake=Math.max(0,shake-dt*30);musicTick+=dt;if(musicTick>.6){musicTick=0;const seq=[110,110,146.83,130.81,98,110,164.81,146.83];tone(seq[Math.floor(clock/.6)%8],.3,'triangle',.008);}
const a=input(),jump=a.has('jump');player.aimUp=a.has('up');setStance(player,a.has('crouch'),ROBOTS[LEVEL.robot].height);if(jump&&!prevJump)jumpBuffer=.13;prevJump=jump;jumpBuffer-=dt;coyote=player.grounded?.1:coyote-dt;player.vx=(Number(a.has('right'))-Number(a.has('left')))*ROBOTS[LEVEL.robot].speed*(player.crouching?.4:1);if(player.vx)player.face=Math.sign(player.vx);if(jumpBuffer>0&&coyote>0){setStance(player,false,ROBOTS[LEVEL.robot].height);player.vy=-ROBOTS[LEVEL.robot].jump;jumpBuffer=0;coyote=0;player.grounded=false;tone(180,.12,'triangle',.03,520);burst(player.x+20,player.y+90,'#c1b093',5);}if(!jump&&player.vy<-250)player.vy+=GRAVITY*dt*.85;player.vy=Math.min(1000,player.vy+GRAVITY*dt);const previousX=player.x;moveBody(player,[...LEVEL.platforms,...barriers.filter(b=>!b.dead)],dt);blockHorizontal(player,previousX,barriers);player.x=Math.max(0,Math.min(LEVEL.width-player.w,player.x));if(player.y>810){player.health=0;mode='dead';respawnTimer=.7;toast('CAÍDA · RECUPERANDO SEÑAL',2);return;}if(a.has('fire')&&shotCooldown<=0)fire();if(a.has('charge')&&!chargeLatch&&energy>=35&&chargeCooldown<=0)fire(true);chargeLatch=a.has('charge');
for(let i=0;i<LEVEL.checkpoints.length;i++){if(player.x>LEVEL.checkpoints[i].x&&checkpoint<i){checkpoint=i;player.health=ROBOTS[LEVEL.robot].maxHealth;save();toast('PUNTO DE CONTROL · SISTEMAS RESTAURADOS');tone(440,.25,'triangle',.04,880);}}
for(const p of pickups){if(!p.taken&&overlaps(player,{...p,w:24,h:24})){p.taken=true;cells++;player.health=Math.min(ROBOTS[LEVEL.robot].maxHealth,player.health+25);energy=Math.min(100,energy+25);burst(p.x,p.y,'#65fff0');tone(660,.15,'sine',.04,990);save();}}
for(const e of enemies){if(e.dead||Math.abs(e.x-player.x)>850)continue;e.timer-=dt;if(e.type==='drone'){e.y=e.baseY+Math.sin(clock*2+e.phase)*24;e.x+=Math.sin(clock+e.phase)*dt*28;}if(e.timer<=0){e.timer=e.type==='armor'?1.6:e.type==='turret'?1.9:2.6;const dx=player.x-e.x,dy=player.y+player.h*.45-e.y-20,l=Math.hypot(dx,dy);shots.push({x:e.x+e.w/2,y:e.y+20,w:13,h:10,vx:dx/l*220,vy:dy/l*220,friendly:false,life:4});}if(overlaps(player,e))damage(18);}
for(const s of shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.friendly){for(const b of barriers){if(!b.dead&&overlaps(shotBounds(s),b)){b.hp-=s.damage;s.life=0;burst(s.x,s.y,'#ffb466',6);if(b.hp<=0){b.dead=true;burst(b.x+30,b.y+40,'#ffc476',28);save();}break;}}if(s.life<=0)continue;for(const e of enemies){if(!e.dead&&overlaps(shotBounds(s),e)){e.hp-=s.damage;s.life=0;burst(s.x,s.y,'#ffcc7a',6);if(e.hp<=0){e.dead=true;kills++;save();burst(e.x+25,e.y+20,'#ffb466',25);tone(70,.18,'sawtooth',.035,25);shake=reduced?0:5;}break;}}}else if(overlaps(shotBounds(s),player)){damage(12);s.life=0;}}
shots=shots.filter(s=>s.life>0);for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=300*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);cam+=(Math.max(0,Math.min(LEVEL.width-W,player.x-W*.32))-cam)*Math.min(1,dt*5);
if(player.x>LEVEL.exit){completeLevel();return;}
hud();$('hint').textContent=LEVEL.id===2?(player.x<900?'DELLINGER · DISPARA PARA ROMPER LAS BARRERAS':player.x>5700?'ALCANZA LA SALIDA →':'CANTERA · ↑ APUNTA A LOS DRONES · ↓ ESQUIVA'):player.x<680?'SALTA EL CAÑÓN · Z / ESPACIO':player.x<1600?'↓ AGACHARSE · ↑ + DISPARO ARRIBA':player.x>5500?'ALCANZA EL HANGAR →':'VICTOR TOWN · RUMBO AL HANGAR →';}

function background(){const backdrop=assets[LEVEL.background||'canyon'];if(backdrop){const s=Math.max(W/backdrop.width,H/backdrop.height),w=backdrop.width*s*1.22,h=backdrop.height*s*1.22;ctx.drawImage(backdrop,-(cam/(LEVEL.width-W))*(w-W),-(h-H)*.35,w,h);}else rect(0,0,W,H,'#b36d63');const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#10223d18');g.addColorStop(.7,'#10223d10');g.addColorStop(1,'#071324bb');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(-cam*.32,0);for(let i=0;i<19;i++){let x=i*200,y=430+(i%3)*35;rect(x,y,65,300,'#1a28375c');rect(x-6,y,77,10,'#24313b77');for(let j=0;j<3;j++)rect(x+12+j*16,y+18,6,4,'#f6ae6940');}ctx.restore();}
function platform(p){const {x,y,w}=p;rect(x,y,w,13,'#ac8970');rect(x,y+13,w,22,'#263949');rect(x,y+32,w,5,'#111d2b');line(x,y,x+w,y,'#ebc395',3);for(let q=x+8;q<x+w-5;q+=32){rect(q,y+3,12,6,Math.floor(q/32)%2?'#d8a348':'#3a3b3c');ellipse(q,y+23,2,2,'#94a2a6');}for(let q=x+35;q<x+w-20;q+=120){rect(q,y+37,13,720-y,'#182735');rect(q+2,y+37,3,720-y,'#52606a');line(q+13,y+60,q+110,y+150,'#243543',8);line(q+13,y+150,q+110,y+60,'#45505a',4);}if(w>300){for(let q=x+30;q<x+w-40;q+=110){line(q,y,q,y-27,'#5d6570',3);line(q,y-27,q+65,y-27,'#8a8480',3);}}}
function turret(e){ctx.save();ctx.translate(e.x,e.y);const aim=player&&player.x<e.x?-1:1;ellipse(32,42,40,7,'#050b1499');rect(0,29,65,15,'#182c36');for(let i=7;i<65;i+=14){ellipse(i,38,6,6,'#66706a');ellipse(i,38,3,3,'#111c28');}rect(11,10,43,25,'#465747');rect(17,4,30,13,'#67725c');line(32,15,32+aim*45,12,'#17242c',12);line(32,13,32+aim*44,10,'#87917a',3);ellipse(aim<0?17:47,21,5,5,e.timer<.4?'#ffcf7b':'#ec5949');rect(22,22,14,4,'#222d28');ctx.restore();}
function drone(e){ctx.save();ctx.translate(e.x+29,e.y+20);const flap=Math.sin(clock*35+e.phase)*8;line(-10,-5,-41,-18-flap,'#b8d2d79c',5);line(10,-5,42,-18+flap,'#b8d2d79c',5);ellipse(0,0,29,17,'#152830');ellipse(0,-3,24,13,'#68745c');line(-19,-8,12,-12,'#c5ad7b',3);ellipse(player&&player.x<e.x?-15:15,0,8,8,'#2a1318');ellipse(player&&player.x<e.x?-15:15,0,5,5,e.timer<.4?'#fff3a5':'#ff5748');for(let i=-1;i<=1;i+=2){line(i*13,11,i*27,25,'#23353b',4);line(i*27,25,i*31,16,'#a19a78',2);}ctx.restore();}
function robot(x,y,frame=4,scale=1,face=1,alpha=1,height=90,aimUp=false,unit=LEVEL.robot){const frames=spriteFrames[unit];if(!frames?.length)return;const f=frames[frame];ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+ROBOTS[unit].width/2*scale,y+height*scale);ctx.scale(face*scale,scale);const targetH=height<ROBOTS[unit].height?height*1.21:height*1.145,targetW=f.width/f.height*targetH;if(aimUp){const splitX=f.width*.54,splitY=f.height*.34,dx=-targetW*.5,dy=-targetH;ctx.drawImage(f,0,splitY,f.width,f.height-splitY,dx,dy+targetH*.34,targetW,targetH*.66);ctx.drawImage(f,0,0,splitX,splitY,dx,dy,targetW*.54,targetH*.34);ctx.save();ctx.translate(dx+targetW*.54,dy+targetH*.23);ctx.rotate(-Math.PI/2);ctx.drawImage(f,splitX,0,f.width-splitX,splitY,0,-targetH*.23,targetW*.46,targetH*.34);ctx.restore();}else ctx.drawImage(f,-targetW*.5,-targetH,targetW,targetH);ctx.restore();}
function hangar(x,y){rect(x-30,y-185,180,185,'#0b1d2c');rect(x-24,y-180,168,175,'#364552');rect(x-8,y-165,136,165,'#08101e');for(let i=0;i<4;i++){rect(x-4,y-145+i*38,4,16,'#69deec');rect(x+120,y-145+i*38,4,16,'#69deec');}rect(x-38,y-190,196,12,'#ae8b5e');text('SANTORE / 0'+LEVEL.id,x+60,y-169,11,'#e5bf88','center');}
function draw(){ctx.clearRect(0,0,W,H);background();if(mode==='transition'||(mode==='pause'&&beforePause==='transition')){drawTransition();return;}ctx.save();ctx.translate(-cam+(Math.random()-.5)*shake,(Math.random()-.5)*shake);for(const p of LEVEL.platforms){if(p.x+p.w>cam-50&&p.x<cam+W+50)platform(p);}hangar(110,560);hangar(LEVEL.exit-60,LEVEL.id===1?500:510);for(const b of barriers)if(!b.dead)barrier(b);for(let i=0;i<LEVEL.checkpoints.length;i++){const p=LEVEL.checkpoints[i];rect(p.x+20,p.y+25,9,75,'#192d3d');ellipse(p.x+24,p.y+25,9,9,i<=checkpoint?'#66f7d6':'#f3b05d');line(p.x+24,p.y+25,p.x+75,p.y+25,'#96b3bd',2);text('CP '+(i+1),p.x+36,p.y+17,10);}
for(const p of pickups){if(!p.taken){ctx.save();ctx.translate(p.x+12,p.y+12+Math.sin(clock*3+p.x)*5);ctx.rotate(Math.PI/4);ctx.shadowBlur=16;ctx.shadowColor='#51f2ec';rect(-8,-8,16,16,'#66f1e0');rect(-4,-4,8,8,'#effff6');ctx.restore();}}
for(const e of enemies){if(!e.dead&&e.x>cam-100&&e.x<cam+W+100)(e.type==='armor'?armor:e.type==='turret'?turret:drone)(e);}
if(mode==='menu'){robot(290,410,4,1.55);}
else if(mode==='intro'){robot(150,470,4,1,1,intro>2.3?1:.6);if(intro<2.8){const dx=30+Math.min(1,intro/2.8)*130;ctx.save();ctx.globalAlpha=intro>2?Math.max(0,(2.8-intro)/.8):1;ellipse(dx,508,7,8,'#efbd96');rect(dx-7,516,14,20,'#e5d9ba');line(dx-4,536,dx-8+Math.sin(intro*15)*5,558,'#872e29',5);line(dx+4,536,dx+8-Math.sin(intro*15)*5,558,'#872e29',5);ctx.restore();}if(intro>2.4){ctx.globalAlpha=Math.max(0,1-(intro-2.4));rect(130,455,80,105,'#9cf5ff');ctx.globalAlpha=1;}}
else if(player){let frame=player.crouching?7:player.aimUp?4:!player.grounded?6:Math.abs(player.vx)>10?Math.floor(clock*11)%4:shotCooldown>.08?5:4;robot(player.x,player.y,frame,1,player.face,invulnerable>0&&Math.floor(clock*12)%2?.45:1,player.h,player.aimUp);}
for(const s of shots){ctx.save();ctx.shadowBlur=s.friendly?18:12;ctx.shadowColor=s.friendly?'#53dcff':'#ff755a';ellipse(s.x,s.y,s.w/2,s.h/2,s.friendly?'#a4f7ff':'#ff9a68');line(s.x-s.vx*.025,s.y-s.vy*.025,s.x,s.y,s.friendly?'#52c9ff':'#fb5f50',Math.min(s.w,s.h)*.55);ctx.restore();}for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);rect(p.x,p.y,3,3,p.color);}ctx.globalAlpha=1;ctx.restore();
for(let i=0;i<24;i++){const x=(i*137+clock*13)%W,y=(i*71)%H;ellipse(x,y,1,1,'#ffdbab45');}if(mode==='intro'){text(intro<2.5?'DAIGO → PROTESSER':'SINCRONIZACIÓN COMPLETA',W/2,610,23,'#a9f6ff','center');}}
function barrier(b){
 rect(b.x,b.y,b.w,b.h,'#283c4b');rect(b.x+5,b.y+5,b.w-10,b.h-10,'#6f6550');
 line(b.x+8,b.y+8,b.x+b.w-8,b.y+b.h-8,'#baa078',7);line(b.x+b.w-8,b.y+8,b.x+8,b.y+b.h-8,'#baa078',7);
 rect(b.x,b.y+b.h*.45,b.w,12,'#d3a648');for(let x=b.x+6;x<b.x+b.w;x+=18)line(x,b.y+b.h*.45,x-6,b.y+b.h*.45+12,'#253445',6);
 if(b.hp<6){line(b.x+20,b.y,b.x+34,b.y+35,'#131e29',3);line(b.x+34,b.y+35,b.x+19,b.y+65,'#131e29',3);}
}
function armor(e){
 ctx.save();ctx.translate(e.x,e.y);const facing=player.x<e.x?-1:1;
 ellipse(38,78,43,8,'#030a1599');rect(10,56,22,22,'#23313b');rect(46,56,22,22,'#23313b');
 rect(4,16,68,43,'#4c5b49');rect(14,8,48,25,'#7b8063');rect(23,0,30,21,'#353f3f');
 rect(27,7,22,5,e.timer<.4?'#ffe5a0':'#ff6a4c');line(38,38,38+facing*53,38,'#202b35',16);line(38,33,38+facing*51,33,'#9b9f83',3);
 rect(facing<0?3:56,26,17,40,'#94a083');rect(15,-12,46,3,'#182734');rect(15,-12,46*e.hp/10,3,'#e7b563');ctx.restore();
}
// Mechanical cradle inspired by the articulated toy's nested armor shells.
function couplingBay(close,foreground){
 const openness=1-close;
 const poly=(points,fill,stroke='#8299a6',width=2)=>{ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();};
 ctx.save();
 if(!foreground){
  // Beveled pressure frame, recessed lining and ribbed backplate.
  poly([[776,270],[858,270],[880,290],[880,437],[859,470],[775,470],[754,437],[754,290]],'#a7b6bc','#253b4a',4);
  poly([[781,280],[852,280],[870,296],[870,434],[853,458],[781,458],[764,434],[764,296]],'#354f63','#dfebeb',2);
  const well=ctx.createLinearGradient(764,0,870,0);well.addColorStop(0,'#162a3c');well.addColorStop(.45,'#54758a');well.addColorStop(.7,'#304b60');well.addColorStop(1,'#132638');
  poly([[788,287],[847,287],[859,302],[859,427],[846,447],[788,447],[775,427],[775,302]],well,'#1b2b3a',3);
  for(let y=306;y<431;y+=19){poly([[789,y],[846,y],[851,y+7],[785,y+7]],'#708997','#263c4a',1);line(795,y+3,842,y+3,'#a4bdc5',1);}
  // Shoulder pads, central spine and shock-absorbing hip supports.
  rect(807,293,20,130,'#1c3448');for(let y=300;y<420;y+=13)rect(811,y,12,5,'#a5b6ba');
  for(const x of [778,843]){rect(x,313,12,48,'#233341');line(x+3,318,x+3,356,'#7a95a4',2);ellipse(x+6,380,9,13,'#172c3c');ellipse(x+6,380,5,8,'#738d9c');}
  poly([[786,422],[847,422],[856,436],[846,449],[787,449],[779,437]],'#a0acaf','#263b49',2);
  rect(790,431,23,7,'#253d4e');rect(822,431,23,7,'#253d4e');
  for(const x of [764,866]){line(x,303,x,427,'#80ddea',3);for(const y of [294,441]){ellipse(x,y,4,4,'#172c3c');ellipse(x,y,2,2,'#e0e7e5');}}
 }
 if(foreground){
  // Side shells pivot inward. The original sprite supplies the closed armor.
  for(const side of [-1,1]){
   const hinge=side<0?755:879,tip=hinge+side*43*openness;
   line(hinge,309,tip,316,'#bbc5c5',5);line(hinge,410,tip,422,'#b8c2c3',5);
   poly([[hinge,285],[tip,298],[tip,433],[hinge,450]],'#9b2533','#e96c63',2);
   poly([[hinge+side*5,297],[tip-side*5,307],[tip-side*5,422],[hinge+side*5,435]],'#b2bdc0','#4a6070',2);
   for(let y=322;y<408;y+=19)line(hinge+side*9,y,tip-side*9,y+5,'#566e7c',3);
   for(const y of [300,433]){ellipse(hinge,y,6,6,'#d3d9d6');ellipse(hinge,y,3,3,'#425565');}
  }
  // Raised upper cowl and its hydraulic struts fold back into the chest.
  const lift=openness*35;
  line(775,284,779,269-lift,'#d2dddd',4);line(859,284,855,269-lift,'#d2dddd',4);
  poly([[771,277-lift],[778,258-lift],[852,258-lift],[864,277-lift],[852,287-lift],[783,287-lift]],'#a82f3c','#f18d76',2);
  poly([[782,273-lift],[788,266-lift],[847,266-lift],[854,276-lift],[846,281-lift],[788,281-lift]],'#425b6c','#93a8ad',1);
  for(let x=796;x<844;x+=10)rect(x,270-lift,4,7,'#c3d0d0');
  // Restore the actual red armor progressively from either side, avoiding a flat door.
  if(close>0){ctx.save();ctx.beginPath();ctx.rect(748,265,70*close,210);ctx.rect(888-70*close,265,70*close,210);ctx.clip();robot(738,200,4,3,1,1,120,false,'dellinger');ctx.restore();}
  const lock=Math.max(0,(close-.5)*2);if(lock>0){rect(795,449,44,6,'#d2b368');rect(813,449,8,6,'#9ef3e0');}
 }
 ctx.restore();
}
function drawTransition(){
 const t=transitionTime,walk=Math.min(1,t/2.8),enter=Math.max(0,Math.min(1,(t-2.8)/1.8)),close=Math.max(0,Math.min(1,(t-4.6)/.9));
 rect(0,0,W,H,'#07111fee');const glow=ctx.createRadialGradient(810,365,20,810,365,450);glow.addColorStop(0,'#234b64');glow.addColorStop(1,'#07111f');ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
 for(let i=0;i<9;i++){rect(i*160,120,5,440,'#2c4351');line(i*160,560,640+(i-4)*240,720,'#344652',2);}rect(0,558,W,12,'#72828b');
 ellipse(820,560,180,23,'#6adffb28');robot(738,200,4,3,1,1,120,false,'dellinger');
 // The robot enters a lined cradle; the armor occludes it as the shell closes.
 if(close<1)couplingBay(close,false);
 if(close<1){
  const scale=1.8-enter*.95,x=210+walk*500+enter*80,feet=558-enter*112;
  ctx.save();
  if(enter>=1){ctx.beginPath();ctx.rect(758+60*close,275,120*(1-close),188);ctx.clip();}
  robot(x,feet-90*scale,t<2.8?Math.floor(t*8)%4:4,scale,1,1,90,false,'protesser');ctx.restore();
  couplingBay(close,true);
 }
 if(t>5.4&&!reduced){ctx.globalAlpha=Math.max(0,.6-(t-5.4));rect(0,0,W,H,'#acf4ff');ctx.globalAlpha=1;}
 text('SANTORE / CÁMARA DE ACOPLAMIENTO',80,166,16,'#e8b76d');
 text(t<2.8?'PROTESSER EN POSICIÓN':t<4.6?'INSERCIÓN EN DELLINGER':t<5.5?'SELLANDO ARMADURA':'DELLINGER · SISTEMAS ACTIVOS',80,211,25,'#b9efff');
 text('NIVEL 02 / CANTERA DE SANTORE',80,247,14,'#9eb3c2');rect(80,275,310,4,'#233d4e');rect(80,275,310*Math.min(1,t/6),4,'#79e5ef');
}
function frame(now){const dt=Math.min(.1,(now-last)/1000||0);last=now;acc+=dt;while(acc>=1/120){update(1/120);acc-=1/120;}draw();requestAnimationFrame(frame);}
function keySprites(img,unit){spriteFrames[unit]=[];const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;const c=sheet.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const d=c.getImageData(0,0,img.width,img.height);for(let i=0;i<d.data.length;i+=4){const r=d.data[i],g=d.data[i+1],b=d.data[i+2];if(g>100&&g>r*1.35&&g>b*1.35){d.data[i+3]=0;}}c.putImageData(d,0,0);const cw=img.width/4,ch=img.height/2;for(let i=0;i<8;i++){const ox=(i%4)*cw,oy=Math.floor(i/4)*ch;let minX=cw,minY=ch,maxX=0,maxY=0;for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){if(d.data[((oy+y)*img.width+ox+x)*4+3]>150){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}}const f=document.createElement('canvas');f.width=maxX-minX+1;f.height=maxY-minY+1;f.getContext('2d').drawImage(sheet,ox+minX,oy+minY,f.width,f.height,0,0,f.width,f.height);spriteFrames[unit].push(f);}}
window.addEventListener('keydown',e=>{if(maps[e.code]){e.preventDefault();keys.add(maps[e.code]);}if(e.code==='Escape'&&!e.repeat){mode==='pause'?resume():pause();}});window.addEventListener('keyup',e=>{keys.delete(maps[e.code]);});window.addEventListener('blur',()=>{keys.clear();touch.clear();pause();});document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('resize',()=>{if(innerHeight>innerWidth)pause();});
for(const button of document.querySelectorAll('[data-action]')){const release=e=>{e.preventDefault();touch.delete(button.dataset.action);button.classList.remove('active');};button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);touch.add(button.dataset.action);button.classList.add('active');});button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);}
$('start').onclick=()=>{activateAudio();reset(false,DEVELOPMENT_MODE?Number($('dev-level').value):1);};$('preview-transition').onclick=()=>{activateAudio();reset(false,1);beginTransition();};$('continue').onclick=()=>{activateAudio();reset(true);};$('resume').onclick=resume;$('pause').onclick=pause;$('restart').onclick=()=>reset(false,LEVEL.id);$('again').onclick=()=>reset(false,2);$('skip').onclick=finishTransition;$('level-two').onclick=()=>{activateAudio();reset(false,2);};$('sound').onclick=()=>{activateAudio();soundOn=!soundOn;$('sound').textContent='SONIDO '+(soundOn?'ON':'OFF');};$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('game-shell').requestFullscreen();}catch{toast('Usa la opción de pantalla completa del navegador');}};
Promise.all(['canyon','protesser','dellinger','quarry'].map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{assets[name]=img;resolve();};img.onerror=()=>reject(new Error(name));img.src='assets/'+name+'.webp';}))).then(()=>{keySprites(assets.protesser,'protesser');keySprites(assets.dellinger,'dellinger');$('start').disabled=false;$('start').textContent='INICIAR MISIÓN →';$('dev-tools').hidden=!DEVELOPMENT_MODE;$('dev-level').replaceChildren(...LEVELS.map(l=>new Option('Nivel '+l.id+' · '+l.title+' / '+l.robot,l.id)));$('continue').hidden=!saved();$('level-two').hidden=(saved()?.unlocked||1)<2;}).catch(()=>{$('start').textContent='ERROR DE RECURSOS · RECARGA';});requestAnimationFrame(frame);


