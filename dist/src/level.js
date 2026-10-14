export const ROBOTS={protesser:{speed:310,jump:740,width:38,height:90,maxHealth:100},dellinger:{speed:240,jump:650,width:55,height:120,maxHealth:150},garbin:{speed:190,jump:590,width:80,height:160,maxHealth:220}};
export const CAMPAIGN=['protesser','dellinger','protesser','protesser','dellinger','garbin','dellinger','garbin','dellinger','protesser','dellinger','garbin'].map((robot,i)=>({id:i+1,robot,boss:[3,7,11].includes(i),available:i===0}));
export const LEVEL={id:1,title:'Victor Town',robot:'protesser',width:6200,spawn:{x:150,y:470},exit:5940,
 platforms:[
 [0,560,720],[840,525,440],[1400,560,540],[2050,490,330],[2500,550,420],[3040,500,430],[3590,560,510],[4210,505,410],[4730,550,450],[5320,500,880],
 [430,425,180],[1030,380,180],[1630,420,180],[2200,350,160],[2650,395,180],[3210,360,150],[3800,410,190],[4380,360,150],[4900,405,160],[5520,360,200]
 ].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[['turret',1090,525],['drone',1510,390],['turret',1780,560],['drone',2260,330],['turret',2700,550],['drone',3090,350],['turret',3360,500],['drone',3730,380],['turret',3950,560],['drone',4400,340],['turret',4960,550],['drone',5420,345],['turret',5710,500]],
 checkpoints:[{x:2540,y:460},{x:4770,y:460}],
 pickups:[{x:510,y:385},{x:1110,y:340},{x:1710,y:380},{x:2740,y:355},{x:3290,y:320},{x:3880,y:370},{x:4460,y:320},{x:4980,y:365},{x:5600,y:320}]};
export const GRAVITY=1800;
export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function moveBody(p,platforms,dt){const previousBottom=p.y+p.h;p.x+=p.vx*dt;p.y+=p.vy*dt;p.grounded=false;for(const s of platforms){if(p.vy>=0&&previousBottom<=s.y+1&&p.y+p.h>=s.y&&p.x+p.w>s.x&&p.x<s.x+s.w){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}}
