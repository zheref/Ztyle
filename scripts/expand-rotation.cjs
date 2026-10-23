// The source matrix owns the schedule; these are casual, weather-specific interpretations.
const fs=require('fs');const matrix=require('../src/domain/matrix.json');const catalog=require('../src/domain/catalog.json');
const aliases={16:'ironman',17:'robin',18:'levi',19:'blackstar',20:'natsu',21:'batman',22:'ichigo',27:'kirito',29:'jinwoo'};
const styles={
'Captain America (Marvel)': ['Navy bomber jacket','White cotton tee','Dark straight denim','Red retro sneakers',['#23374e','#f7f6f0','#a92c36'],'Navy sleeveless training top','Navy training shorts'],
'Itadori (JJK)': ['Cropped navy overshirt over a red hoodie','Red relaxed cotton tee','Black straight cargo pants','Red-and-white skate sneakers',['#252c43','#a82c34','#f1f0e9'],'Red athletic tee','Black training shorts'],
'Inuyasha (Inuyasha)': ['Scarlet zip hoodie','White cotton tee with an open red short-sleeve shirt','Black relaxed jeans','Black low-top sneakers',['#b72c32','#f6f2e9','#242428'],'Red athletic tank','Black training shorts'],
'Deku (MHA)': ['Forest green zip hoodie','Black cotton tee','Black cargo pants','Red high-top sneakers',['#285948','#24272b','#b43437'],'Green performance tank','Black gym shorts'],
'Megumi (JJK)': ['Navy stand-collar casual overshirt','Plain black cotton tee','Relaxed navy cargo pants','Black skate sneakers',['#252d42','#24252b','#405344'],'Navy athletic tank','Black training joggers'],
'Tanjiro (KNY)': ['Green-and-black checked flannel overshirt','White relaxed cotton tee','Charcoal cargo pants','Black canvas sneakers',['#34573d','#25292b','#eee9dc'],'Dark green performance tee','Black gym shorts'],
'Tomioka (KMY)': ['Burgundy zip hoodie','Burgundy cotton tee','Charcoal relaxed jeans','White skate sneakers',['#74303b','#3f5b41','#c6a14e'],'Burgundy athletic tank','Black gym shorts'],
'Archer (Fate)': ['Short crimson chore jacket','Black cotton tee','Black straight jeans','Black-and-white skate sneakers',['#9e2934','#24262b','#e0e0df'],'Crimson athletic tank','Black training shorts'],
'Gon (HxH)': ['Forest green track jacket with orange zip','Green cotton tee with a small orange accent','Black relaxed cargo pants','Green-and-orange retro runners',['#357448','#c36b31','#24272a'],'Green athletic tank','Black training shorts with orange trim'],
'Rengoku (KNY)': ['Cream fleece zip jacket','Off-white cotton tee','Relaxed charcoal pants','Rust-and-white casual sneakers',['#e9dfc9','#c77335','#a33532'],'Cream performance tee','Charcoal gym shorts with orange trim'],
'Naruto (Naruto)': ['Blue denim jacket over an orange hoodie','Orange cotton tee','Dark blue relaxed jeans','Blue-and-white skate sneakers',['#dc7938','#385b83','#f0eee5'],'Orange performance tee','Blue training shorts'],
'Naruto (Naruto Shippuden)': ['Black-and-orange casual track jacket','Black cotton tee with orange detail','Black cargo pants','Black-and-orange sneakers',['#22252b','#db783a','#eeeeea'],'Black athletic tee with orange trim','Black training shorts'],
'Naruto Sage (Naruto)': ['Short crimson zip jacket','Black cotton tee','Relaxed black cargo pants','Black-and-red casual sneakers',['#a6333c','#24262b','#d18140'],'Crimson performance tee','Black gym shorts with orange detail'],
'Alice (SAO)': ['Royal blue casual zip jacket','White cotton tee','Cream relaxed denim','White low-top sneakers',['#3b548d','#f0eee6','#baa059'],'Royal blue performance tee','White training shorts'],
'Seshomaru (Inuyasha)': ['Cream fleece zip hoodie','Off-white relaxed cotton tee','Light gray casual cargo pants','White canvas sneakers',['#eae6dc','#8c72a0','#c1a863'],'Cream performance tee','Gray training shorts with purple detail'],
'Kaneki (Tokyo Ghoul)': ['Black denim jacket','White cotton tee','Washed charcoal cargo jeans','Black skate sneakers',['#252629','#ecebe5','#684661'],'Black sleeveless athletic tank','Charcoal gym shorts'],
'Sasuke (Naruto)': ['Off-white casual overshirt','White loose short-sleeve camp shirt','Relaxed navy cargo pants','Navy-and-white skate sneakers',['#e8e5dd','#30384d','#7c5b94'],'White athletic tank','Navy training shorts'],
'Yuta (JJK)': ['White denim utility jacket','White cotton tee','Navy relaxed cargo pants','White retro sneakers',['#edede7','#303b51','#272a31'],'White performance tee','Navy gym shorts'],
'Roy Mustang (FMA)': ['Short navy casual field jacket','White cotton tee','Black relaxed jeans','Black-and-white street sneakers',['#303c58','#ecebe5','#bea466'],'Navy performance tee','Black training shorts']
};
for(let i=0;i<matrix.length;i++){
 const row=matrix[i],rowNumber=i+2,rotationId=`rotation-${row.week}-${row.day.toLowerCase()}`;row.rotationId=rotationId;
 if(aliases[rowNumber]){
  for(const l of catalog.filter(l=>l.id.startsWith(aliases[rowNumber]+'-'))){l.rotationId=rotationId;l.matrixLabel=row.name;}
 }
 const existing=catalog.filter(l=>l.rotationId===rotationId);
 const config=styles[row.name];
 for(const variant of ['cold','warm','gym']){
  if(existing.some(l=>l.variant===variant))continue;
  const exemplar=existing[0];
  const colors=config?.[4]||exemplar?.colors||['#34363b','#eeece6','#81709e'];
  let pieces;
  if(config){const [outer,top,bottom,shoes,,gymTop,gymBottom]=config;pieces=variant==='cold'?[['Outerwear',outer],['Base',top],['Bottoms',bottom],['Footwear',shoes]]:variant==='warm'?[['Top',top],['Bottoms',bottom.includes('jeans')?'Lightweight '+bottom.toLowerCase():bottom],['Footwear',shoes],['Accent','A small accessory in the character’s accent color']]:[['Top',gymTop],['Bottoms',gymBottom],['Footwear','Supportive training sneakers'],['Accent','Simple sports watch in the accent color']];}
  else {pieces=[['Top',`Relaxed ${exemplar.colors[0]==='#00BFFF'?'cyan':'black'} performance tee`],['Bottoms','Black training shorts'],['Footwear','Supportive training sneakers'],['Accent','A sports watch in the inspiration palette']];}
  catalog.push({id:`${rotationId}-${variant}`,rotationId,name:`${(row.name==='Naruto (Naruto Shippuden)'?'Naruto Shippuden':row.name.replace(/\s*\([^)]*\)/g,''))} · ${variant==='gym'?'Training':variant==='warm'?'Easy days':'Casual layers'}`,character:exemplar?.character||row.name.replace(/\s*\([^)]*\)/g,''),series:exemplar?.series||(row.name.match(/\(([^)]+)\)$/)?.[1]||'Character matrix'),variant,image:'',colors,pieces:pieces.map(([category,name])=>({category,name})),tip:`Keep the ${row.palette.split('|')[0].replace('Primary:','').trim().toLowerCase()} palette as the main cue. Use relaxed everyday fits, hip-length layers and comfortable sneakers for your 172 cm frame.${variant==='gym'?' Choose breathable performance fabric and style your hair in upright spikes.':variant==='warm'?' Keep layers light, with textured spiky hair.':''}`,source:'matrix',sourceOutfit:row.outfit,matrixLabel:row.name});
 }
}
fs.writeFileSync('src/domain/catalog.json',JSON.stringify(catalog,null,2)+'\n');fs.writeFileSync('src/domain/matrix.json',JSON.stringify(matrix,null,2)+'\n');console.log(`${matrix.length} matrix inspirations, ${catalog.length} outfit variants`);
