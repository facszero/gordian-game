import {CHAPTER912} from './chapter912.js';
import {CHAPTER58} from './chapter58.js';
import {ENEMY_GROUP_PLAN} from './enemies.js';
// Under shared gravity, jump height scales with launch speed squared.
const jumpForHeight=height=>740*Math.sqrt(height/90);
export const ROBOTS={protesser:{speed:310,jump:740,width:38,height:90,maxHealth:100},dellinger:{speed:240,jump:jumpForHeight(120),width:55,height:120,maxHealth:150},garbin:{speed:190,jump:jumpForHeight(160),width:80,height:160,maxHealth:220}};
export const CAMPAIGN=['protesser','dellinger','protesser','garbin','dellinger','garbin','dellinger','garbin','protesser','dellinger','garbin','garbin'].map((robot,i)=>({id:i+1,robot,boss:[3,7,11].includes(i),available:true,enemyGroups:ENEMY_GROUP_PLAN[i]}));
export const LEVEL={id:1,title:'Victor Town',robot:'protesser',width:6200,spawn:{x:150,y:470},exit:5940,
 platforms:[
 [0,560,720],[840,525,440],[1400,560,540],[2050,490,330],[2500,550,420],[3040,500,430],[3590,560,510],[4210,505,410],[4730,550,450],[5320,500,880],
 [430,425,180],[1030,380,180],[1630,420,180],[2200,350,160],[2650,395,180],[3210,360,150],[3800,410,190],[4380,360,150],[4900,405,160],[5520,360,200]
 ].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[['turret',1090,525],['drone',1510,390],['turret',1780,560],['drone',2260,330],['turret',2700,550],['drone',3090,350],['turret',3360,500],['drone',3730,380],['turret',3950,560],['drone',4400,340],['turret',4960,550],['drone',5420,345],['turret',5710,500]],
 checkpoints:[{x:2540,y:460},{x:4770,y:460}],
 pickups:[{x:510,y:385},{x:1110,y:340},{x:1710,y:380},{x:2740,y:355},{x:3290,y:320},{x:3880,y:370},{x:4460,y:320},{x:4980,y:365},{x:5600,y:320}]};
export const GRAVITY=1800;
export const QUARRY={id:2,title:'Cantera de Santore',robot:'dellinger',background:'quarry',width:6400,spawn:{x:140,y:440},exit:6140,
 platforms:[[0,560,880],[970,530,680],[1740,560,720],[2550,510,660],[3300,550,740],[4130,510,700],[4920,550,650],[5660,510,740],
 [520,435,220],[1220,405,220],[1980,430,260],[2820,385,220],[3570,420,240],[4440,385,220],[5190,420,220],[5860,385,240]].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[['armor',650,560],['drone',1120,350],['armor',1440,530],['drone',1920,350],['armor',2210,560],['armor',2910,510],['drone',3420,350],['armor',3800,550],['drone',4320,330],['armor',4600,510],['armor',5300,550],['drone',5740,330],['armor',6010,510]],
 checkpoints:[{x:2600,y:390},{x:4960,y:430}],
 pickups:[{x:600,y:395},{x:1300,y:365},{x:2070,y:390},{x:2900,y:345},{x:3660,y:380},{x:4510,y:345},{x:5270,y:380},{x:5930,y:345}],
 barriers:[{x:430,y:470,w:60,h:90},{x:1810,y:470,w:60,h:90},{x:3370,y:460,w:60,h:90},{x:5730,y:420,w:60,h:90}]};
export const TUNNELS={id:3,title:'Túneles de infiltración',robot:'protesser',background:'tunnels',width:6200,spawn:{x:150,y:470},exit:5950,
 platforms:[[0,560,730],[840,500,480],[1440,550,520],[2080,475,440],[2640,535,570],[3330,480,450],[3900,540,590],[4610,490,470],[5200,540,1000],
 [410,415,190],[1020,360,190],[1620,410,190],[2240,335,180],[2840,395,210],[3480,340,190],[4100,400,210],[4770,350,180],[5480,400,220]].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[['turret',1120,500],['drone',1510,340],['armor',1830,550],['drone',2200,300],['turret',2910,535],['drone',3380,315],['turret',3630,480],['armor',4230,540],['drone',4710,320],['turret',4940,490],['drone',5350,350],['armor',5710,540]],
 checkpoints:[{x:2690,y:445},{x:5240,y:450}],
 pickups:[{x:480,y:375},{x:1090,y:320},{x:1690,y:370},{x:2300,y:295},{x:2900,y:355},{x:3540,y:300},{x:4180,y:360},{x:4820,y:310},{x:5540,y:360}]};
export const FORTRESS={id:4,title:'Bastión de acero',robot:'garbin',background:'fortress',width:6800,spawn:{x:150,y:400},exit:6700,
 platforms:[[0,560,900],[970,540,740],[1780,560,780],[2630,530,720],[3420,550,810],[4300,530,820],[5190,560,1610],
 [560,480,230],[1220,460,240],[2040,480,250],[2870,450,230],[3680,470,260],[4570,450,240]].map(([x,y,w])=>({x,y,w,h:30})),
 enemies:[['turret',670,560],['drone',1100,330],['armor',1490,540],['drone',1940,340],['armor',2290,560],['turret',2990,530],['drone',3490,330],['armor',3910,550],['drone',4420,330],['armor',4820,530]],
 checkpoints:[{x:3470,y:390},{x:5380,y:400}],
 pickups:[{x:640,y:440},{x:1300,y:420},{x:2130,y:440},{x:2950,y:410},{x:3770,y:430},{x:4650,y:410},{x:5430,y:475}],
 boss:{name:'CENTINELA DE ACERO',x:6160,floor:560,w:500,h:340,left:5520,trigger:5580}};
export const LEVELS=[LEVEL,QUARRY,TUNNELS,FORTRESS,...CHAPTER58,...CHAPTER912];
export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function moveBody(p,platforms,dt){const previousBottom=p.y+p.h;p.x+=p.vx*dt;p.y+=p.vy*dt;p.grounded=false;for(const s of platforms){if(p.vy>=0&&previousBottom<=s.y+1&&p.y+p.h>=s.y&&p.x+p.w>s.x&&p.x<s.x+s.w){p.y=s.y-p.h;p.vy=0;p.grounded=true;}}}
