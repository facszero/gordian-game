// Shared army palette; silhouettes and scale distinguish each role.
const SCOUT={name:'Explorador',w:64,h:40,hp:2,frame:2,muzzleY:.76};
const GUNSHIP={name:'Dron blindado',w:88,h:56,hp:2,frame:6,muzzleY:.8};
const SENTRY={name:'Centinela ligero',w:88,h:68,hp:4,frame:0,muzzleY:.34};
const HEAVY={name:'Centinela blindado',w:82,h:112,hp:10,frame:4,muzzleY:.42};
export const ENEMY_GROUPS={
 A:{name:'Grupo enemigos A',theme:'Militar',asset:'enemy-army',available:true},
 B:{name:'Grupo enemigos B',theme:'Insectoide',asset:'enemy-group-b',available:true},
 C:{name:'Grupo enemigos C',theme:'Industrial',asset:'enemy-group-c',available:true},
 D:{name:'Grupo enemigos D',theme:'Asedio',asset:'enemy-group-d',available:true},
 E:{name:'Grupo enemigos E',theme:'Reactores',asset:'enemy-group-e',available:true},
 F:{name:'Grupo enemigos F',theme:'Legión oscura',asset:'enemy-group-f',available:true}
};
// Campaign plan only; this does not unlock or implement future levels.
export const ENEMY_GROUP_PLAN=[['A'],['B'],['C'],['D'],['A','B','C'],['B','D','E'],['A','C','E'],['B','D','F'],['A','C','E','F'],['A','B','D','F'],['A','B','C','D','E','F'],['A','B','C','D','E','F']];
export function groupForEnemy(levelId,index=0){const groups=ENEMY_GROUP_PLAN[levelId-1];if(!groups)throw Error('Unknown level');return groups[index%groups.length];}
export function enemySpec(type,levelId,group=groupForEnemy(levelId),robot=levelId===4?'garbin':[1,3].includes(levelId)?'protesser':'dellinger'){
 if(!ENEMY_GROUPS[group]?.available)throw Error('Enemy group not implemented: '+group);
 const base=type==='armor'?HEAVY:type==='turret'?SENTRY:robot==='protesser'?SCOUT:GUNSHIP;
 const variant=group==='B'?(type==='armor'?{w:116,muzzleY:.48}:type==='turret'?{w:92,muzzleY:.5}:{}):group==='C'&&type==='armor'?{w:94,muzzleY:.43}:{};
 return {...base,...variant,...(robot==='garbin'?{w:Math.round((variant.w||base.w)*1.3),h:type==='drone'?Math.round(base.h*1.3):Math.max(130,Math.round(base.h*1.3)),hp:base.hp*2}:{}),group};
}
export function enemyMuzzle(enemy,face){return {x:enemy.x+enemy.w/2+face*(enemy.w/2+9),y:enemy.y+enemy.h*enemy.muzzleY};}
