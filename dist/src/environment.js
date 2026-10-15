// Atlas regions are normalized because the props intentionally have different proportions.
export const INDUSTRIAL_REGIONS=[[0,0,.31,.5],[.31,0,.31,.5],[.62,0,.18,.5],[.8,0,.2,.5],[0,.5,.31,.5],[.31,.5,.15,.5],[.46,.5,.36,.5],[.82,.5,.18,.5]];
export function extractProps(img,regions,chroma='magenta',preserveCells=false){
 const sheet=document.createElement('canvas');sheet.width=img.width;sheet.height=img.height;
 const ctx=sheet.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
 const pixels=ctx.getImageData(0,0,img.width,img.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4)if(chroma==='green'?(d[i+1]>100&&d[i+1]>d[i]*1.35&&d[i+1]>d[i+2]*1.35):(d[i]>100&&d[i+2]>100&&d[i]>d[i+1]*1.5&&d[i+2]>d[i+1]*1.5))d[i+3]=0;
 ctx.putImageData(pixels,0,0);
 return regions.map(([rx,ry,rw,rh])=>{
  const ox=Math.round(rx*img.width),oy=Math.round(ry*img.height),w=Math.min(img.width-ox,Math.round(rw*img.width)),h=Math.min(img.height-oy,Math.round(rh*img.height));
  let left=w,top=h,right=-1,bottom=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[((oy+y)*img.width+ox+x)*4+3]>150){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(right<left)throw Error('Empty environment sprite');
  if(preserveCells){left=0;top=0;right=w-1;bottom=h-1;}
  const sprite=document.createElement('canvas');sprite.width=right-left+1;sprite.height=bottom-top+1;
  sprite.getContext('2d').drawImage(sheet,ox+left,oy+top,sprite.width,sprite.height,0,0,sprite.width,sprite.height);return sprite;
 });
}

// Cache the assembled structures once; gameplay keeps its original collision geometry.
export function buildPlatform(p,theme,parts){
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(p.w);canvas.height=Math.max(100,720-p.y+36);
 const c=canvas.getContext('2d'),top=36,deck=parts[[2,5,7].includes(theme)?1:0];
 const draw=(index,x,y,w,h)=>c.drawImage(parts[index],x,y,w,h);
 if(p.w>300){
  // Structural work stays beneath the walkable edge and inside the platform footprint.
  const span=180,depth=canvas.height-top-32;
  for(let x=28;x<p.w-40;x+=span){
   draw(3,x+9,top+33,132,Math.max(140,depth));draw(2,x,top+29,23,Math.max(160,depth));
  }
  draw(6,30,top+58,Math.min(220,p.w-60),24);
  if(Math.floor(p.x/100)%2===0)draw(5,p.w-62,top+48,25,Math.max(110,depth));
  for(let x=18;x<p.w-20;x+=160)draw(4,x,top-31,Math.min(148,p.w-x-8),32);
 }
 // Repeat complete deck sections; distribute widths evenly to avoid a squeezed end tile.
 const count=Math.max(1,Math.ceil(p.w/210)),width=p.w/count;
 for(let i=0;i<count;i++)c.drawImage(deck,i*width,top,width,45);
 c.strokeStyle=[2,5,7].includes(theme)?'#e7c278':'#d7b18a';c.lineWidth=1.5;c.beginPath();c.moveTo(0,top+1);c.lineTo(p.w,top+1);c.stroke();
 if(p.w>300){draw(7,10,top+18,14,23);draw(7,p.w-25,top+18,14,23);}
 return canvas;
}
