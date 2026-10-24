// A single streaming element keeps the full song out of decoded effect buffers.
export function createMenuMusic(track){
 let inMenu=false,enabled=true,visible=true;
 if(track){track.loop=true;track.preload='metadata';track.volume=.45;}
 const rewind=()=>{if(track){track.pause();try{track.currentTime=0;}catch{}}};
 function play(){
  if(!track||!inMenu||!enabled||!visible||!track.paused)return;
  try{track.play()?.catch(()=>{});}catch{}
 }
 return {
  enter(){inMenu=true;rewind();play();},
  leave(){inMenu=false;rewind();},
  unlock:play,
  setEnabled(value){enabled=value;if(!value)track?.pause();else play();},
  setVisible(value){visible=value;if(!value)track?.pause();else play();},
 };
}
