"""Bake fixed UI artwork from the Windows fonts selected by the web CSS.
Only rendered images ship; font files are neither copied nor bundled.
Requires Pillow on the design workstation. Generated PNGs/JSON are versioned.
"""
from pathlib import Path
import json, math
from PIL import Image, ImageDraw, ImageFont
ROOT=Path(__file__).resolve().parents[1]/'ui'
ROOT.mkdir(exist_ok=True)
S=3
font_dir=Path('C:/Windows/Fonts')

def font(size,bold=False):
    f=ImageFont.truetype(str(font_dir/'bahnschrift.ttf'),round(size*S))
    if bold:
        try: f.set_variation_by_axes([700,100])
        except (ValueError,OSError): pass
    return f

def text_image(text,size,color,spacing=0,bold=False,stroke=0):
    f=font(size,bold)
    width=math.ceil(sum(f.getlength(ch) for ch in text)+spacing*S*max(0,len(text)-1))+12*S
    im=Image.new('RGBA',(width,round(size*S*1.7)+12*S))
    d=ImageDraw.Draw(im);x=6*S
    for ch in text:
        glyph_font=ImageFont.truetype(str(font_dir/"seguisym.ttf"),round(size*S)) if ch in "←→↑↓" else f
        d.text((x,5*S),ch,font=glyph_font,fill=color,stroke_width=stroke,stroke_fill=color)
        x+=glyph_font.getlength(ch)+spacing*S
    box=im.getbbox()
    return im.crop(box) if box else im

labels={
'eyebrow':('UNA NUEVA BATALLA COMIENZA',10,'#f7bf63',3,True),
'subtitle':('EL DESPERTAR',15,'#f6c279',10,False),
'edition':('DOCE NIVELES · CUATRO VIDAS · UNA ESPERANZA',9,'#7f9aaf',2,False),
'intro1':('El desierto guarda un legado.',14,'#d3dce0',0,False),
'intro2':('Entra en Protesser. Protege Victor Town.',14,'#d3dce0',0,False),
'start':('INICIAR MISIÓN →',12,'#0a1727',1.5,True),
'continue':('CONTINUAR MISIÓN',12,'#d5e5ed',1.5,True),
'help1':('← → / A D · Mover    Z / Espacio · Saltar (2 pulsaciones: doble salto)',11,'#b7c5cd',0,False),
'help2':('X / J · Disparar    C / K · Carga    Esc · Pausa',11,'#b7c5cd',0,False),
'help3':('↓ / S · Agacharse    ↑ / W + disparo · Disparar arriba',11,'#b7c5cd',0,False),
'side':('PROTESSER',18,'#f4ecd9',4,False),
'side-small':('ÁGIL · PRECISO · RESISTENTE',8,'#f4bf6d',4,False),
'active':('SISTEMA ACTIVO / 01',8,'#f7bf63',2,True),
}
for name in ['PROTESSER','DELLINGER','GARBIN']: labels[name]=(name,21,'#f4ecd9',2,True)
for i in range(1,15):
    data=json.loads((ROOT.parent/'data'/f'level{i}.json').read_text(encoding='utf-8'))
    labels[f'level{i}']=(data['title'].upper(),13,'#f4ecd9',2,True)
    labels[f'number{i}']=(f'NIVEL {i:02d} / 12' if i<=12 else 'MISIÓN EXTRA',10,'#ffc574',3,False)
# Fixed strings, not a redistributable font/glyph set.
items={key:text_image(*values) for key,values in labels.items()}
atlas=Image.new('RGBA',(2048,2048));info={};x=y=8;row=0
for key,im in items.items():
    if x+im.width+8>atlas.width: x=8;y+=row+8;row=0
    atlas.alpha_composite(im,(x,y));info[key]=[x,y,im.width,im.height]
    x+=im.width+8;row=max(row,im.height)
atlas=atlas.crop((0,0,2048,y+row+8));atlas.save(ROOT/'web-labels.png',optimize=True)
(ROOT/'web-labels.json').write_text(json.dumps(info,ensure_ascii=False,indent=2),encoding='utf-8')
# Arial Black faux italic, skewY(-4deg), red face with the original stepped gold extrusion.
f=ImageFont.truetype(str(font_dir/'ariblk.ttf'),round(89.6*S))
mask=Image.new('L',(650*S,150*S));d=ImageDraw.Draw(mask);x=30*S
for ch in 'GORDIAN':
    d.text((x,5*S),ch,font=f,fill=255,stroke_width=0)
    x+=f.getlength(ch)-.055*89.6*S
mask=mask.transform(mask.size,Image.Transform.AFFINE,(1,.22,-25*S,.07,1,-22*S),Image.Resampling.BICUBIC)
from PIL import ImageFilter
outline=mask.filter(ImageFilter.MaxFilter(2*round(1.5*S)+1))
logo=Image.new('RGBA',mask.size)
for dx,dy,color in [(11,13,'#030a16'),(9,10,'#211a13'),(8,8,'#c99b19')]+[(i,i,'#ffde39') for i in range(7,0,-1)]+[(0,0,'#251c13')]:
    layer=Image.new('RGBA',logo.size,color);alpha=Image.new('L',logo.size);alpha.paste(outline,(round(dx*S),round(dy*S)));layer.putalpha(alpha);logo.alpha_composite(layer)
face=Image.new('RGBA',logo.size,'#f02527');face.putalpha(mask);logo.alpha_composite(face)
logo.crop(logo.getbbox()).save(ROOT/'web-logo.png',optimize=True)
print('Generated web menu artwork:',atlas.size)
