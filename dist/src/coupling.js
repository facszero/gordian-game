export const COUPLING_DURATION=11;
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const p=clamp(x);return p*p*(3-2*p);};
// Each pose has a short blend followed by a readable hold.
const cues=[0,3,3.8,4.6,5.4,6.2,6.9,7.6,8.1,8.6,9.1];
export function couplingState(time){
 const t=Math.max(0,time);let pose=0;
 for(let i=1;i<cues.length;i++)if(t>=cues[i])pose=i;
 return {pose,previous:Math.max(0,pose-1),blend:pose?ease((t-cues[pose])/.22):1,
  entry:ease((t-.9)/2.1),fade:ease((t-10.5)/.5),
  label:t<.9?'DELLINGER · ARMADURA ABIERTA':t<3?'ALINEANDO PROTESSER':t<3.8?'ENCAJE CONFIRMADO':t<4.6?'SELLANDO PIERNAS':t<5.4?'SELLANDO BRAZOS':t<6.2?'CERRANDO TORSO Y CASCO':t<7.6?'ACOPLAMIENTO COMPLETO':t<9.1?'POSICIÓN DE COMBATE':'DELLINGER · LISTO PARA AVANZAR'};
}
