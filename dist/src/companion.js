// Decorative companion: follows a precomputed route, never enters combat physics.
export function createCompanion(level,active=true){
 const floors=level.platforms.filter(p=>p.w>=300).sort((a,b)=>a.x-b.x);
 const jumps=[];
 for(let i=0;i<floors.length-1;i++){
  const a=floors[i],b=floors[i+1];
  jumps.push({start:a.x+a.w-70,end:b.x+70,from:a.y,to:b.y,height:125});
 }
 for(const b of level.barriers||[]){
  const floor=floors.find(p=>b.x>=p.x&&b.x+b.w<=p.x+p.w);
  if(floor)jumps.push({start:b.x-110,end:b.x+b.w+110,from:floor.y,to:floor.y,height:b.h+75});
 }
 return {active,x:level.spawn.x+55,feet:floors[0].y,time:0,frame:0,floors,jumps};
}
export function updateCompanion(cat,dt,camera,viewport=1280){
 if(!cat?.active)return;
 cat.time+=dt;if(cat.time<.35)return;
 cat.x+=620*dt;
 const jump=cat.jumps.find(j=>cat.x>=j.start&&cat.x<=j.end);
 if(jump){
  const t=(cat.x-jump.start)/(jump.end-jump.start);
  cat.feet=jump.from+(jump.to-jump.from)*t-4*jump.height*t*(1-t);
  cat.frame=t<.2?4:t<.6?5:t<.88?6:7;
 }else{
  const floor=cat.floors.find(p=>cat.x>=p.x&&cat.x<=p.x+p.w);
  if(!floor){cat.active=false;return;}
  cat.feet=floor.y;cat.frame=Math.floor(cat.time*14)%4;
 }
 if(cat.x-70>camera+viewport+80)cat.active=false;
}
