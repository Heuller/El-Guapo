(function(root){
  'use strict';
  const catalog=typeof module!=='undefined'&&module.exports?require('./ingredient-catalog.js'):root.ElGuapoIngredients;
  const KEY='eg-shopping-v2', LEGACY_KEY='eg-shopping-v1';
  const normalize=catalog.normalize;
  function quantity(raw){const s=String(raw).trim().replace(',','.');const n=Number(s);return /^\d+(?:\.\d{1,3})?$/.test(s)&&n>0&&n<=1000000?n:null;}
  function price(raw){const s=String(raw).trim().replace(',','.');if(!s)return null;if(!/^\d+(?:\.\d{1,2})?$/.test(s))return undefined;const [a,b='']=s.split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));return Number.isSafeInteger(n)&&n<=100000000?n:undefined;}
  const num=s=>{const m=s.match(/^(\d*)([¼½¾])$/);return m?Number(m[1]||0)+({'¼':.25,'½':.5,'¾':.75})[m[2]]:Number(s.replace(',','.'));};
  function demand(ingredient,product){
    const text=String(ingredient.baseQty??ingredient.qty??'').trim();
    const scale=ingredient.scale??1;
    if(!Number.isFinite(scale)||scale<=0)throw new RangeError('Invalid recipe scale');
    const m=text.match(/^(~?)(\d+(?:[.,]\d+)?[¼½¾]?|[¼½¾])(?:\s*[–—-]\s*(\d+(?:[.,]\d+)?))?\s*(kg|ml|g|l|un\.?|xícaras?|col\. sopa|pedaço|bagas?)(?:\s.*)?$/iu);
    if(!m)return {amount:null,estimated:false,reason:'Quantidade a gosto, não especificada ou sem conversão cadastrada.'};
    let amount=num(m[3]||m[2])*scale;const unit=m[4].toLowerCase().replace('un.','un').replace('xícaras','xícara');
    let estimated=!!m[1]||!!m[3],reason=m[3]?'Usado o limite superior do intervalo.':'';
    if(!Number.isFinite(amount)||amount<=0)return {amount:null,estimated:false,reason:'Quantidade inválida; confira a receita.'};
    const approximate=message=>{estimated=true;reason=[reason,message].filter(Boolean).join(' ');};
    if(unit==='kg'){amount*=1000;if(product.unit!=='g')return {amount:null,estimated:false,reason:'Unidade incompatível.'};}
    else if(unit==='l'){amount*=1000;if(product.unit!=='ml')return {amount:null,estimated:false,reason:'Unidade incompatível.'};}
    else if(unit==='g'&&product.unit==='ml'&&product.density){amount/=product.density;approximate(`Conversão aproximada: ${product.density} g por ml.`);}
    else if(unit==='g'&&product.id==='ovos'){const per=/gema/i.test(ingredient.name)?product.yolkWeight:product.eggWeight;amount/=per;approximate(`Referência de ${per} g por ${/gema/i.test(ingredient.name)?'gema':'ovo sem casca'}.`);}
    else if(unit==='xícara'||unit==='col. sopa'){
      const factor=unit==='xícara'?product.cup:product.spoon;
      if(!factor)return {amount:null,estimated:false,reason:'Medida caseira sem conversão cadastrada.'};
      amount*=factor;approximate(`Medida caseira aproximada: ${factor} ${product.unit} por ${unit}.`);
    }else if(['un','pedaço','baga','bagas'].includes(unit)&&product.unit==='g'&&product.gramsPerUnit){amount*=product.gramsPerUnit;approximate(`Referência de ${product.gramsPerUnit} g por unidade.`);}
    else if(unit!==product.unit&&!(['un','pedaço','baga','bagas'].includes(unit)&&product.unit==='un'))return {amount:null,estimated:false,reason:'Unidade sem conversão cadastrada.'};
    return {amount:Math.round(amount*1e6)/1e6,estimated,reason};
  }
  function productFor(name){return catalog.resolve(name)||{id:'custom:'+normalize(name),name:name.replace(/\s+/g,' ').trim(),unit:'un',packageSize:1,packageLabel:'unidade',note:'Produto sem tamanho de embalagem cadastrado; confira a quantidade.'};}
  function blank(product){return {version:2,productId:product.id,name:product.name,unit:product.unit,packageSize:product.packageSize,quantity:1,priceCents:null,checked:false,manualQuantity:false,manualItem:false,sources:[],suggestedQuantity:1,needed:0,unknown:false};}
  function recalculate(item){
    const old=item.quantity;
    item.needed=Math.round(item.sources.reduce((n,s)=>n+(s.amount??0),0)*1e6)/1e6;
    item.unknown=item.sources.some(s=>s.amount===null);
    item.suggestedQuantity=Math.max(1,Math.ceil(item.needed/item.packageSize-1e-9));
    if(!item.manualQuantity)item.quantity=item.suggestedQuantity;
    if(item.quantity>old)item.checked=false;
    return item;
  }
  function validBase(item){return item&&typeof item.name==='string'&&item.name.trim()&&typeof item.quantity==='number'&&quantity(item.quantity)!==null&&(item.priceCents===null||(Number.isSafeInteger(item.priceCents)&&item.priceCents>=0&&item.priceCents<=100000000))&&typeof item.checked==='boolean';}
  function validate(value){
    if(!Array.isArray(value))throw new TypeError('Invalid shopping list');
    const seen=new Set();
    return value.map(raw=>{
      if(!validBase(raw))throw new TypeError('Invalid shopping item');
      if(raw.version!==2){
        if(raw.version!==undefined)throw new TypeError('Unsupported shopping version');
        const p=productFor(raw.name),item={...blank(p),quantity:raw.quantity,priceCents:raw.priceCents,checked:raw.checked,manualQuantity:true,manualItem:true};
        if(seen.has(item.productId))throw new TypeError('Duplicate item');seen.add(item.productId);return item;
      }
      if(typeof raw.productId!=='string'||seen.has(raw.productId)||!['g','ml','un'].includes(raw.unit)||typeof raw.packageSize!=='number'||quantity(raw.packageSize)===null||typeof raw.manualQuantity!=='boolean'||typeof raw.manualItem!=='boolean'||!Array.isArray(raw.sources))throw new TypeError('Invalid catalogued item');
      const product=productFor(raw.name);if(product.id!==raw.productId||product.unit!==raw.unit)throw new TypeError('Unknown product identity');
      const sourceIds=new Set();
      const sources=raw.sources.map(s=>{
        if(!s||typeof s.key!=='string'||sourceIds.has(s.key)||typeof s.recipeId!=='string'||typeof s.recipeTitle!=='string'||!(s.amount===null||(Number.isFinite(s.amount)&&s.amount>0&&s.amount<=1000000000))||typeof s.estimated!=='boolean'||typeof s.reason!=='string')throw new TypeError('Invalid source');
        sourceIds.add(s.key);return {...s};
      });
      seen.add(raw.productId);return recalculate({...blank(product),...raw,sources});
    });
  }
  function migrate(old){
    if(!Array.isArray(old))throw new TypeError('Invalid legacy list');const output=[];
    for(const raw of old){
      if(!validBase(raw))throw new TypeError('Invalid legacy item');
      const product=productFor(raw.name);let item=output.find(i=>i.productId===product.id);
      if(!item){item={...blank(product),manualQuantity:true,manualItem:true,quantity:raw.quantity,priceCents:raw.priceCents,checked:raw.checked,migrationNote:'Quantidade trazida da lista anterior; confira a embalagem.'};output.push(item);}
      else{item.quantity+=raw.quantity;item.checked=item.checked&&raw.checked;if(item.priceCents!==raw.priceCents){item.priceCents=null;item.migrationNote='Itens antigos reunidos com preços diferentes. Informe o preço da embalagem escolhida.';}}
    }
    return validate(output);
  }
  function add(items,ingredients,options={}){
    const next=validate(items);const recipeId=options.recipeId||'adhoc';
    const replaced=new Set([recipeId,...(options.replacesRecipeIds||[])]);
    if(!options.manual)for(const item of next)item.sources=item.sources.filter(s=>!replaced.has(s.recipeId));
    ingredients.forEach((ingredient,index)=>{
      const raw=typeof ingredient.name==='string'?ingredient.name.replace(/\s+/g,' ').trim():'';
      if(!raw||ingredient.prepared===true||/^(todo|toda)$/i.test(String(ingredient.baseQty??ingredient.qty??'').trim()))return;
      const product=productFor(raw);let item=next.find(i=>i.productId===product.id);
      if(!item){item=blank(product);next.push(item);}
      if(options.manual||(!ingredient.qty&&!ingredient.baseQty)){item.manualItem=true;return;}
      const need=demand(ingredient,product);
      item.sources.push({key:recipeId+':'+(ingredient.sourceKey??index),recipeId,recipeTitle:options.recipeTitle||recipeId,...need});
    });
    return next.filter(i=>i.sources.length||i.manualItem||i.manualQuantity||i.checked||i.priceCents!==null).map(recalculate);
  }
  function totals(items){return items.reduce((t,i)=>{if(i.priceCents===null)t.unpriced++;else{const c=Math.round(i.quantity*i.priceCents);t.cents+=c;if(i.checked)t.pickedCents+=c;}return t;},{cents:0,pickedCents:0,unpriced:0});}
  const api={KEY,LEGACY_KEY,quantity,price,add,validate,migrate,totals,demand,productFor,recalculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ElGuapoShoppingModel=api;
})(globalThis);
