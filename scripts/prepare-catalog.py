import re,json,html,glob,os
if os.path.exists("src/domain/catalog.json"):
 raise SystemExit("This one-time draft importer preserves the existing catalog. Edit the current catalog or use expand-rotation.cjs instead.")
s=open('/Users/zheref/Downloads/anime_character_wardrobe_lookbook.html').read()
looks=[]
slugs=['ironman','robin','levi','blackstar','natsu','batman','ichigo']
names=['Crimson standard','Forest utility','Off-duty scout','Electric energy','Dragon instinct','Urban stealth','Midnight edge']
for i,b in enumerate(s.split('<div class="lookbook-card')[1:]):
 character=html.unescape(re.search(r'<h2[^>]*>(.*?)</h2>',b).group(1))
 colors=re.findall(r'background-color: (#[0-9A-Fa-f]+)',b)
 tip=html.unescape(re.findall(r'<p[^>]*>(.*?)</p>',b)[-1])
 series=re.search(r'3rd \w+ • ([^<]+)',b).group(1)
 for variant in ['cold','warm']:
  part=b.split('outfit-details '+variant+'-details')[1].split('<!--')[0]
  pairs=re.findall(r'<span class="text-slate-400 [^"]*">(.*?)</span>\s*<span class="text-slate-200">(.*?)</span>',part)
  pieces=[dict(category=html.unescape(k.strip(':')),name=html.unescape(v)) for k,v in pairs if not v.startswith('None')]
  image='/art/'+slugs[i]+'-'+variant+'.jpg'
  looks.append(dict(id=slugs[i]+'-'+variant,name=names[i],character=character,series=series,variant=variant,image=image,colors=colors,pieces=pieces,tip=tip,source='draft'))
core=[
('jinwoo-cold','Shadow monarch','Sung Jinwoo','Solo Leveling','cold',['#202127','#313343','#8b78b4'],['Outerwear|Midnight black tailored wool overcoat','Base|Fitted black mock-neck knit','Bottoms|Charcoal tapered tailored trousers','Footwear|Polished black leather boots','Accent|Silver watch with a violet dial'],'Build depth through matte wool and a smooth knit. Keep violet to a single accessory; let the long coat carry the silhouette.'),
('kirito-cold','Coat of midnight','Kirito','Sword Art Online','cold',['#17191b','#6b7078','#dddeda'],['Outerwear|Black longline coat with subtle white piping','Base|Black cotton crewneck','Bottoms|Straight-cut black denim','Footwear|Black leather Chelsea boots','Accent|Minimal silver pendant'],'Silver hardware adds definition to an all-black outfit. A clean shoulder and straight leg keep the long coat modern.'),
('kirito-warm','Midnight, lightened','Kirito','Sword Art Online','warm',['#24282c','#ecebe5','#969d9b'],['Top|Breathable black camp-collar shirt with silver edge','Base|White cotton tank','Bottoms|Black tailored shorts, above the knee','Footwear|White leather low-top sneakers','Accent|Fine silver chain'],'Wear the shirt open over the white tank. Airy fabric and a shorter hem preserve the black-and-silver identity without heavy layers. Keep hair textured and spiky.'),
('jinwoo-warm','Blue hour','Sung Jinwoo','Solo Leveling','warm',['#252c3b','#52525b','#8a75ac'],['Top|Fitted midnight navy short-sleeve tee','Bottoms|Lightweight charcoal pleated trousers','Footwear|Black minimalist sneakers','Accent|Silver watch with a violet face'],'Choose breathable cotton and a relaxed tapered trouser. The navy-to-charcoal contrast keeps the outfit subtle; style the black hair up in defined spikes.'),
('kirito-gym','Level up','Kirito','Sword Art Online','gym',['#31343a','#111316','#e0e3e6'],['Top|Charcoal sleeveless athletic tank','Bottoms|Black tapered training joggers','Footwear|Black-and-white performance trainers','Accent|Slim black sports watch'],'Let the shoulders move freely and keep hems away from equipment. Moisture-wicking fabric and secure trainers are the priorities. Finish with spiky hair.'),
('jinwoo-gym','Daily quest','Sung Jinwoo','Solo Leveling','gym',['#17191d','#e7e7e3','#8d7ab4'],['Top|Black sleeveless performance tank','Bottoms|Black training shorts, above the knee','Footwear|White running sneakers and crew socks','Accent|Violet sports watch'],'A simple performance set with a single purple accent echoes the Shadow Monarch. Keep the fit comfortable through squats and lunges; textured spiky hair completes the look.')]
for id,name,char,series,var,colors,pieces,tip in core:
 looks.insert(0,dict(id=id,name=name,character=char,series=series,variant=var,image='/art/'+id+'.webp',colors=colors,pieces=[dict(category=p.split('|')[0],name=p.split('|')[1]) for p in pieces],tip=tip,source='original'))
# Put the hero first and vary the catalog's first row.
order=['jinwoo-cold','kirito-warm','kirito-gym','levi-cold','jinwoo-warm','kirito-cold','jinwoo-gym']
looks.sort(key=lambda l:order.index(l['id']) if l['id'] in order else 99)
json.dump(looks,open('src/domain/catalog.json','w'),ensure_ascii=False,indent=2)
print(len(looks),'looks,',len(set(l['character'] for l in looks)),'characters')
