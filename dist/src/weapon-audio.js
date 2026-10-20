// Short, normalized excerpts of the supplied recordings; decoded once on demand.
export const RECORDINGS=['LivianaSimple1','LivianaSimple2','PesadaSimple1','Jefes3'];
export const WEAPON_AUDIO={
  protesser:{shot:[0,.05,.18,1.15,3200,.22],charge:[2,0,.55,1.15,3000,.32]},
  dellinger:{shot:[1,.03,.22,1,2300,.22],charge:[2,0,.7,.95,2400,.34]},
  garbin:{shot:[1,.03,.25,.78,1600,.24],charge:[2,0,.85,.75,1800,.36]},
  reactorBurst:[3,.05,1.6,.85,2600,.42],
};
export function excerpt(context,buffer,offset,duration){
  const start=Math.floor(offset*buffer.sampleRate),length=Math.min(Math.floor(duration*buffer.sampleRate),buffer.length-start);
  if(length<=0)throw new Error('Empty audio excerpt');
  const result=context.createBuffer(1,length,buffer.sampleRate),out=result.getChannelData(0);
  for(let c=0;c<buffer.numberOfChannels;c++){
    const input=buffer.getChannelData(c);
    for(let i=0;i<length;i++)out[i]+=input[start+i]/buffer.numberOfChannels;
  }
  let peak=0;for(const value of out)peak=Math.max(peak,Math.abs(value));
  const scale=peak>0?Math.min(4,.8/peak):1;
  const fadeIn=Math.min(length/2,buffer.sampleRate*.004),fadeOut=Math.min(length/2,buffer.sampleRate*.045);
  for(let i=0;i<length;i++)out[i]*=scale*Math.min(1,i/fadeIn,(length-1-i)/fadeOut);
  return result;
}
export function createWeaponSamples(context,output,fetcher=globalThis.fetch){
  const buffers=new Map(),voices=new Set();let loading;
  function load(){
    return loading??=Promise.allSettled(RECORDINGS.map(async(name,index)=>{
      const response=await fetcher(new URL(`../audio/${name}.mp3`,import.meta.url));
      if(!response.ok)throw new Error('Audio unavailable');
      const decoded=await context.decodeAudioData(await response.arrayBuffer());
      for(const [key,spec] of Object.entries({
        ...Object.fromEntries(Object.entries(WEAPON_AUDIO).filter(([k])=>k!=='reactorBurst').flatMap(([robot,types])=>Object.entries(types).map(([type,s])=>[`${robot}:${type}`,s]))),
        reactorBurst:WEAPON_AUDIO.reactorBurst,
      }))if(spec[0]===index)buffers.set(key,excerpt(context,decoded,spec[1],spec[2]));
    }));
  }
  function stop(){
    for(const voice of [...voices]){try{voice.source.stop();}catch{}voice.clean();}
  }
  function play(name,robot){
    const boss=name==='reactorBurst',key=boss?name:`${robot}:${name}`,buffer=buffers.get(key);
    if(!buffer)return false;
    const category=boss?'boss':name;
    const same=[...voices].filter(v=>v.category===category);
    if(same.length>=(boss?1:name==='charge'?2:3)){same[0].source.stop();same[0].clean();}
    const spec=boss?WEAPON_AUDIO.reactorBurst:WEAPON_AUDIO[robot][name];
    const source=context.createBufferSource(),gain=context.createGain(),filter=context.createBiquadFilter(),t=context.currentTime;
    source.buffer=buffer;source.playbackRate.value=spec[3];filter.type='lowpass';filter.frequency.value=spec[4];
    gain.gain.value=spec[5];source.connect(filter);filter.connect(gain);gain.connect(output);
    const voice={source,gain,category,clean(){source.disconnect();filter.disconnect();gain.disconnect();voices.delete(voice);}};
    voices.add(voice);source.onended=voice.clean;
    // Leave collection/damage cues on their separate synthesis path.
    if(boss)for(const v of voices)if(v.category!=='boss'){
      v.gain.gain.cancelScheduledValues(t);v.gain.gain.setTargetAtTime(.06,t,.015);
    }
    if(!boss&&[...voices].some(v=>v.category==='boss'))gain.gain.value*=.45;
    source.start(t);source.stop(t+buffer.duration/spec[3]+.01);return true;
  }
  return {load,play,stop};
}
