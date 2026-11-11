"""Review boards made only from the original reference and browser screenshots."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
root=Path(__file__).resolve().parent.parent
base=root/'test-results/cacau-vinho';out=base/'comparisons';out.mkdir(parents=True,exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
ref=Image.open(root/'docs/design-reference/cacau-vinho.jpg').convert('RGB')
# Straight crops remove the phone frames. The reference itself is never retouched.
for name,box in [('home',(47,148,319,800)),('catalog',(367,148,648,800)),('recipe',(694,148,967,800))]:ref.crop(box).save(out/f'reference-{name}.png')
def put(canvas,path,x,y,w,h,label):
 d=ImageDraw.Draw(canvas);d.text((x,y),label,font=font,fill='#F8EDE5')
 im=Image.open(path).convert('RGB');im.thumbnail((w,h),Image.Resampling.LANCZOS)
 canvas.paste(im,(x+(w-im.width)//2,y+35))
for state in ['home','catalog','recipe']:
 c=Image.new('RGB',(1660,1020),'#241B20');d=ImageDraw.Draw(c);d.text((22,14),'CACAU & VINHO | '+state.upper(),font=font,fill='#DBB476')
 entries=[(out/f'reference-{state}.png','Referência / recorte'),(base/f'before/dark/mobile-{state}.png','Escuro anterior'),(base/f'after/dark/mobile-{state}.png','Cacau & Vinho'),(base/f'after/light/mobile-{state}.png','Claro aprovado')]
 for i,(p,label)in enumerate(entries):put(c,p,22+i*411,58,380,865,label)
 d.text((22,983),'Mesmo conteúdo do app, 390 × 844 CSS px, DPR 1. Referência é direção artística; não é comparação literal de pixels.',font=small,fill='#D6BFC4')
 c.save(out/f'mobile-{state}.png')
c=Image.new('RGB',(2000,1550),'#241B20');d=ImageDraw.Draw(c);d.text((24,14),'MESMA IDENTIDADE | Claro e Cacau & Vinho — desktop',font=font,fill='#DBB476')
for row,state in enumerate(['home','recipe']):
 for col,theme in enumerate(['light','dark']):put(c,base/f'after/{theme}/desktop-{state}.png',24+col*986,58+row*735,960,670,f'{theme} / {state} — 1440 × 1000')
c.save(out/'desktop-themes.png')
c=Image.new('RGB',(1250,960),'#241B20');d=ImageDraw.Draw(c);d.text((24,14),'CACAU & VINHO | Cartões, compras e modo cozinha',font=font,fill='#DBB476')
for i,(state,label) in enumerate([('cards','Cartões do catálogo'),('shopping-summary','Compras / total'),('kitchen','Modo cozinha')]):put(c,base/f'after/dark/mobile-{state}.png',24+i*414,58,390,844,label)
c.save(out/'night-components.png')
# Compare computed light colors, geometry and typography at identical states.
b=json.loads((base/'before/evidence.json').read_text());a=json.loads((base/'after/evidence.json').read_text())
old={(x['device'],x['state']):x['styles'] for x in b['metrics'] if x['theme']=='light'}
results=[]
for x in a['metrics']:
 if x['theme']=='light':
  differences=[sel for sel,v in x['styles'].items() if v!=old[(x['device'],x['state'])][sel]]
  results.append({'device':x['device'],'state':x['state'],'changed_selectors':differences})
(out/'light-preservation.json').write_text(json.dumps(results,indent=2)+'\n')
print(json.dumps({'comparisons':5,'light_states':len(results),'light_style_differences':sum(bool(r['changed_selectors'])for r in results)}))
