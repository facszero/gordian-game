// Base layouts; level.js extends the non-boss routes for the playable campaign.
const decks=rows=>rows.map(([x,y,w])=>({x,y,w,h:30}));
function patrols(platforms){return platforms.flatMap((p,i)=>[
 ['turret',p.x+310,p.y],
 ['armor',p.x+Math.min(450,p.w*.48),p.y],
 ['drone',p.x+Math.min(590,p.w*.64),p.y-230],
 ['turret',p.x+p.w-135,p.y],
 ['drone',p.x+p.w-70,p.y-300],
 ...(i%2?[['drone',p.x+220,p.y-190]]:[])
]);}
function stage(id,title,robot,background,rows){
 const platforms=decks(rows),height={protesser:90,dellinger:120,garbin:160}[robot];
 return {id,title,robot,background,width:rows.at(-1)[0]+rows.at(-1)[2],spawn:{x:150,y:rows[0][1]-height},exit:rows.at(-1)[0]+rows.at(-1)[2]-140,
 platforms:[...platforms,...platforms.filter(p=>p.w<1500).map(p=>({x:p.x+260,y:p.y-(robot==='protesser'?140:90),w:220,h:30}))],
 enemies:patrols(platforms),checkpoints:[2,4,6].filter(i=>platforms[i]).map(i=>({x:platforms[i].x+40,y:platforms[i].y-height})),
 pickups:platforms.flatMap(p=>[{x:p.x+300,y:p.y-(robot==='protesser'?180:130)},{x:p.x+p.w-80,y:p.y-50}])};
}
export const OUTPOST=stage(9,'Frontera del vacío','protesser','eclipse',[[0,560,850],[940,510,700],[1730,550,780],[2600,490,720],[3410,540,800],[4300,500,760],[5150,550,780],[6020,510,1100]]);
export const LEGION=stage(10,'Legión de acero','dellinger','foundry',[[0,560,900],[970,535,850],[1890,580,1700],[3660,540,850],[4580,560,900],[5550,580,1700],[7320,540,800]]);
export const SHADOWS=stage(11,'Guardianes del eclipse','garbin','reactor',[[0,560,900],[970,540,850],[1890,620,1700],[3660,560,850],[4580,540,900],[5550,620,1700],[7320,560,800]]);
// Every elite arena starts after its checkpoint, so retries never trap the player beyond it.
LEGION.checkpoints=[{x:1910,y:460},{x:5570,y:460},{x:7360,y:420}];
SHADOWS.checkpoints=[{x:1910,y:460},{x:5570,y:460},{x:7360,y:400}];
LEGION.elites=[1940,5600].map((left,i)=>({name:'CENTINELA COBALTO '+(i+1),elite:true,tint:'hue-rotate(155deg) saturate(1.65)',hp:60,damageScale:1/3,x:left+820,floor:580,w:500,h:340,left,right:left+1550,trigger:left+40}));
SHADOWS.elites=[1940,5600].map((left,i)=>({kind:'dark',name:'ESPECTRO ESMERALDA '+(i+1),elite:true,tint:'hue-rotate(115deg) saturate(.85)',hp:110,damageScale:1/3,x:left+880,floor:620,w:260,h:550,left,right:left+1550,trigger:left+40}));
// Avoid overlapping routine enemies and the main elite combat spaces.
for(const level of [LEGION,SHADOWS])level.enemies=level.enemies.filter(([,x])=>!level.elites.some(b=>x>b.left+250&&x<b.right));
export const THRONE=stage(12,'Trono de Dokuma','garbin','eclipse',[[0,560,900],[970,540,850],[1890,570,900],[2860,540,850],[3780,560,900],[4750,540,850],[5670,620,2100]]);
THRONE.checkpoints=[{x:2900,y:380},{x:5710,y:460}];
THRONE.enemies=THRONE.enemies.filter(([,x])=>x<5600);
THRONE.boss={kind:'dokuma',name:'Grandmaster Dokuma (Evolved)',number:3,hp:540,x:6500,floor:620,w:900,h:590,left:5800,right:7080,trigger:5840};
export const CHAPTER912=[OUTPOST,LEGION,SHADOWS,THRONE];
