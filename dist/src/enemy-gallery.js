import {ENEMY_GROUPS,ENEMY_GROUP_PLAN} from './enemies.js';
const names={A:['Centinela ligero','Dron explorador','Centinela blindado','Dron pesado'],B:['Ácaro centinela','Escarabajo explorador','Arácnido blindado','Escarabajo pesado'],D:['Tanque de asedio','Escarabajo de ataque','Artillero pesado','Nave de asedio'],C:['Vigía hidráulico','Dron recolector','Autómata de asedio','Transporte blindado']};
const destinations={A:'Nivel 1 · Victor Town',B:'Nivel 2 · Cantera de Santore',C:'Nivel 3 · Túneles de infiltración',D:'Nivel 4 · Bastión de acero'};
let firing=false;const renderers=[];
for(const [group,spec] of Object.entries(ENEMY_GROUPS)){
 if(!spec.available)continue;
 const section=document.createElement('section');section.className='group';
 const title=document.createElement('h2');title.textContent=spec.name+' · '+spec.theme;
 const note=document.createElement('p');note.textContent=destinations[group];
 const cards=document.createElement('div');cards.className='cards';section.append(title,note,cards);document.getElementById('groups').append(section);
 const img=new Image();img.src='assets/'+spec.asset+'.webp';
 img.onload=()=>{
  const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;const sc=sheet.getContext('2d');sc.drawImage(img,0,0);
  const pixels=sc.getImageData(0,0,sheet.width,sheet.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4)if(d[i]>100&&d[i+2]>100&&d[i]>d[i+1]*1.5&&d[i+2]>d[i+1]*1.5)d[i+3]=0;
  sc.putImageData(pixels,0,0);const cw=sheet.width/4,ch=sheet.height/2;
  for(let i=0;i<4;i++){
   const card=document.createElement('article');card.className='card';const canvas=document.createElement('canvas');canvas.width=300;canvas.height=250;canvas.setAttribute('aria-label',spec.name+' — '+names[group][i]);
   const label=document.createElement('h3');label.textContent=names[group][i];const size=document.createElement('small');size.textContent=i<2?'Unidad ligera':'Unidad pesada';card.append(canvas,label,size);cards.append(card);
   const draw=()=>{const index=i*2+Number(firing),ox=index%4*cw,oy=Math.floor(index/4)*ch;let minX=cw,minY=ch,maxX=0,maxY=0;
    for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(d[((oy+y)*sheet.width+ox+x)*4+3]>150){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    const w=maxX-minX+1,h=maxY-minY+1,scale=Math.min(270/w,215/h),ctx=canvas.getContext('2d');ctx.clearRect(0,0,300,250);ctx.drawImage(sheet,ox+minX,oy+minY,w,h,(300-w*scale)/2,230-h*scale,w*scale,h*scale);
   };renderers.push(draw);draw();
  }
 };img.onerror=()=>{note.textContent+=' · Error al cargar el arte; recarga la página.';};
}
document.getElementById('pose').onclick=e=>{firing=!firing;e.currentTarget.setAttribute('aria-pressed',String(firing));e.currentTarget.textContent=firing?'Ver poses de reposo':'Ver poses de disparo';renderers.forEach(draw=>draw());};
ENEMY_GROUP_PLAN.forEach((groups,i)=>{const el=document.createElement('div');el.className='level';el.textContent='Nivel '+(i+1);const value=document.createElement('strong');value.textContent=groups.join(' + ');el.append(value);document.getElementById('plan').append(el);});
