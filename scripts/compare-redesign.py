"""Compose audit evidence only; application artwork is never modified."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import sys
root=Path(__file__).resolve().parent.parent
base=root/'test-results/redesign'; out=base/'comparisons';out.mkdir(parents=True,exist_ok=True)
reference=Image.open(root/'docs/design-reference/doce-contemporaneo.jpg').convert('RGB')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',17)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
# Perspective normalization for comparison evidence, excluding most of the bezels.
quads={'welcome':(132,190,176,744,416,723,369,174),'discovery':(527,154,527,708,768,708,768,154),'recipe':(921,196,882,730,1114,752,1160,217)}
for key,quad in quads.items():
 reference.transform((350,800),Image.Transform.QUAD,quad,Image.Resampling.BICUBIC).save(out/f'reference-{key}.png')
phase=sys.argv[1] if len(sys.argv)>1 else 'before'
folder=base/'before' if phase=='before' else base

def panel(canvas,path,xy,wh,label):
 d=ImageDraw.Draw(canvas);x,y=xy;w,h=wh;d.text((x,y),label,font=font,fill='#4A2532')
 im=Image.open(path).convert('RGB');im.thumbnail((w,h),Image.Resampling.LANCZOS);canvas.paste(im,(x+(w-im.width)//2,y+33))
canvas=Image.new('RGB',(1500,980),'#F5EBE7');d=ImageDraw.Draw(canvas)
d.text((24,14),'DOCE CONTEMPORÂNEO | Referência e interface — '+phase.upper(),font=font,fill='#4A2532')
for x,path,label in [(24,out/'reference-welcome.png','Referência / boas-vindas'),(398,folder/'mobile-home.png','Aplicação / início'),(772,out/'reference-discovery.png','Referência / descoberta'),(1146,folder/'mobile-catalog.png','Aplicação / catálogo')]:panel(canvas,path,(x,58),(330,840),label)
d.text((24,946),'Recortes de referência retificados e ampliados. Compara-se a linguagem visual, não a escala da prancha.',font=small,fill='#775C65')
canvas.save(out/f'mobile-{phase}.png')
canvas=Image.new('RGB',(1750,1180),'#F5EBE7');d=ImageDraw.Draw(canvas);d.text((24,14),'DOCE CONTEMPORÂNEO | Adaptação desktop — '+phase.upper(),font=font,fill='#4A2532')
panel(canvas,root/'docs/design-reference/doce-contemporaneo.jpg',(24,55),(650,450),'Direção artística original / 1280 × 848')
panel(canvas,out/'reference-recipe.png',(174,570),(350,530),'Referência / leitura da receita')
panel(canvas,folder/'desktop-home.png',(705,55),(1020,510),'Aplicação / início — 1440 × 1000')
panel(canvas,folder/'desktop-recipe.png',(705,626),(1020,510),'Aplicação / receita — 1440 × 1000')
canvas.save(out/f'desktop-{phase}.png')
# Food and typography at a larger scale; no filters or retouching.
canvas=Image.new('RGB',(1280,960),'#F5EBE7')
panel(canvas,out/'reference-recipe.png',(24,18),(350,870),'Referência / receita')
panel(canvas,folder/'mobile-recipe.png',(420,18),(390,870),'Aplicação / receita')
panel(canvas,folder/'mobile-catalog.png',(854,18),(390,870),'Aplicação / cartões')
canvas.save(out/f'details-{phase}.png')
print('Comparisons:',phase)
