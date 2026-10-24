import {createWeaponSamples,ENEMY_AUDIO} from './weapon-audio.js';
// Recorded weapons with an offline synthesized fallback.
export function createGameAudio(context) {
  const master=context.createGain(), limiter=context.createDynamicsCompressor();
  master.gain.value=.65;limiter.threshold.value=-12;limiter.ratio.value=8;
  master.connect(limiter);limiter.connect(context.destination);
  const weapons=createWeaponSamples(context,master);
  const noise=context.createBuffer(1,context.sampleRate,context.sampleRate);
  const samples=noise.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
  let enabled=true;const voices=new Set();
  function layer(freq,end,duration,volume,type='sine',delay=0,cutoff=1800) {
    if(!enabled||context.state==='suspended'||voices.size>=48)return;
    const source=type==='noise'?context.createBufferSource():context.createOscillator();
    if(type==='noise')source.buffer=noise;
    else {source.type=type;source.frequency.setValueAtTime(freq,context.currentTime+delay);source.frequency.exponentialRampToValueAtTime(Math.max(20,end),context.currentTime+delay+duration);}
    const gain=context.createGain(),filter=context.createBiquadFilter(),t=context.currentTime+delay;
    filter.type='lowpass';filter.frequency.value=cutoff;
    gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.006);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
    source.connect(filter);filter.connect(gain);gain.connect(master);voices.add(source);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();voices.delete(source);};
    source.start(t);source.stop(t+duration+.01);
  }
  const lastEnemy=new Map();
  function play(name,robot='protesser',volume=1) {
    if(!enabled||context.state==='suspended')return;
    const hostile=!!ENEMY_AUDIO[name]||name==='bossWarning';
    if(hostile){const key=name.startsWith('enemy')?'enemy':name,interval=name==='bossWarning'?.35:name.startsWith('enemy')?.09:.06;
      if(context.currentTime-(lastEnemy.get(key)??-Infinity)<interval)return;lastEnemy.set(key,context.currentTime);}
    if((['shot','charge','reactorBurst'].includes(name)||ENEMY_AUDIO[name])&&weapons.play(name,robot,volume))return;
    if(hostile){if(name==='bossWarning'){layer(420,680,.24,.045,'triangle');return;}
      const big=['scorpionBeam','dokumaBeam','iceBeam','bossImpact'].includes(name);
      layer(big?140:700,big?35:110,big?.65:.17,(big?.16:.07)*volume,'sawtooth',0,2200);
      layer(0,0,big?.5:.1,(big?.12:.04)*volume,'noise',0,2800);return;}

    if(name==='reactorBurst'){layer(120,28,.9,.2);layer(0,0,1.1,.15,'noise',0,1600);return;}
    const weight=robot==='garbin'?.55:robot==='dellinger'?.77:1;
    if(name==='shot'||name==='charge') {
      const heavy=name==='charge';
      layer((heavy?240:1050)*weight,55*weight,heavy?.48:.19,heavy?.22:.1,'sawtooth',0,heavy?1900:2600);
      layer(heavy?95:180*weight,35,heavy?.4:.13,.18);
      layer(0,0,heavy?.32:.085,heavy?.14:.07,'noise',0,2400);
      if(heavy)layer(480,65,.32,.06,'triangle',.09);
    } else if(name==='jump'||name==='doubleJump') {
      layer(name==='jump'?110:220,650,.22,.065,'triangle');
      layer(0,0,.2,.08,'noise',0,900);
    } else if(name==='hit'||name==='explosion') {
      layer(0,0,name==='hit'?.24:.55,.2,'noise',0,1100);
      layer(150,28,.3,.18);layer(380,75,.13,.04,'square');
    } else if(name==='pickup'||name==='checkpoint'||name==='ready') {
      [660,880,1320].forEach((f,i)=>layer(f,f,.26,.075,'sine',i*.065));
      layer(220,440,.3,.035,'triangle');
    } else if(name==='coupling') {
      layer(90,280,.7,.065,'sawtooth',0,650);
      [0,.24,.55].forEach(t=>{layer(0,0,.12,.12,'noise',t,1200);layer(180,45,.16,.09,'triangle',t);});
    } else if(name==='victory') {
      [330,440,550,660,880].forEach((f,i)=>layer(f,f,.45,.08,'triangle',i*.12));
    }
  }
  function stop(){lastEnemy.clear();weapons.stop();for(const source of [...voices]){try{source.stop();}catch{}source.onended();}}
  return {play,stop,loadSamples:weapons.load,setEnabled(value){enabled=value;if(!value)stop();master.gain.cancelScheduledValues(context.currentTime);master.gain.setTargetAtTime(value?.65:0,context.currentTime,.01);},resume(){return context.resume();}};
}
