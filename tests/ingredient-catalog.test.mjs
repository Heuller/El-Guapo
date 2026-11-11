import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),catalog=require('../ingredient-catalog.js'),model=require('../shopping-model.js'),recipes=require('../content/recipes.json').recipes;
const line=(name,qty,more={})=>({name,qty,...more});
// Retired brigadeiro is retained as a reference fixture for arithmetic regressions.
const historical=require('./fixtures/prestigio-components.json');
const addRecipe=(items,id,scale=1)=>{
  const live=recipes.find(r=>r.id===id),recipe=live||historical.find(r=>r.id===id);
  return model.add(items,recipe.ingredientGroups.filter(g=>!g.variant||g.variant==='chocolate').flatMap((g,gi)=>g.ingredients.map((i,ii)=>line(i.name,i.quantityText,{scale,sourceKey:gi+'-'+ii,prepared:i.prepared}))),{recipeId:live?id:'reference:'+id,recipeTitle:recipe.title,replacesRecipeIds:recipe.replacesRecipeIds});
};

test('catalog covers every ingredient in all current recipes, with unique identities and aliases',()=>{
  const ids=new Set(),aliases=new Map();
  for(const product of catalog.entries){assert.ok(!ids.has(product.id));ids.add(product.id);assert.ok(product.packageSize>0);for(const name of [product.name,...product.aliases]){const key=catalog.normalize(name);assert.ok(!aliases.has(key)||aliases.get(key)===product.id,key);aliases.set(key,product.id);}}
  for(const recipe of recipes)for(const group of recipe.ingredientGroups)for(const ingredient of group.ingredients){if(ingredient.quantityText==='toda')continue;assert.ok(catalog.resolve(ingredient.name),ingredient.name);}
});

test('flour names normalize together, while distinct cocoa percentages and yeast types remain separate',()=>{
  for(const name of ['Farinha de trigo','Farinha de trigo Tipo 1','Farinha W300+ ou Tipo 1 Forte','FARINHA DE TRIGO'])assert.equal(catalog.resolve(name).id,'farinha-trigo');
  assert.notEqual(catalog.resolve('Cacau em pó 50%').id,catalog.resolve('Cacau em pó 100%').id);
  assert.notEqual(catalog.resolve('Fermento biológico seco').id,catalog.resolve('Fermento biológico fresco').id);
});

test('brigadeiro plus Prestige require exactly three 395g boxes, not one rounded box per occurrence',()=>{
  const items=addRecipe(addRecipe([],'bolo-brigadeiro-el-guapo'),'bolo-prestigio');const milk=items.find(i=>i.productId==='leite-condensado');
  assert.equal(milk.needed,1185);assert.equal(milk.quantity,3);assert.equal(milk.packageSize,395);
  assert.equal(items.find(i=>i.productId==='creme-leite').quantity,3);
});

test('pizza and focaccia merge flour before rounding; reinserting a recipe updates rather than duplicates',()=>{
  let items=addRecipe(addRecipe([],'pizza-massa-base'),'focaccia-massa-base');let flour=items.find(i=>i.productId==='farinha-trigo');
  assert.equal(flour.needed,1100);assert.equal(flour.quantity,2);
  items=addRecipe(items,'focaccia-massa-base');assert.equal(items.find(i=>i.productId==='farinha-trigo').needed,1100);
  items=addRecipe(items,'focaccia-massa-base',2);assert.equal(items.find(i=>i.productId==='farinha-trigo').needed,1700);
});

test('egg grams and yolk grams use different explicit estimates, then round to whole eggs',()=>{
  const items=model.add([],[line('Ovos inteiros','200g'),line('Gemas de ovos','36g'),line('Ovos Tipo Grande/Extra','3–4 un.')],{recipeId:'eggs'});
  assert.equal(items.length,1);assert.equal(items[0].needed,10);assert.equal(items[0].quantity,10);assert.ok(items[0].sources.some(s=>s.estimated));
});

test('milk litres, household measures, gram conversion and missing measures are explicit',()=>{
  const milk=catalog.resolve('Leite integral');assert.equal(model.demand(line('Leite integral','1 l'),milk).amount,1000);
  assert.equal(model.demand(line('Leite integral','3 xícaras'),milk).amount,720);
  assert.equal(model.demand(line('Leite integral','3 xícara'),milk).amount,720);
  assert.equal(model.demand(line('Leite integral','103g'),milk).amount,100);
  assert.equal(model.demand(line('Canela em pó','a gosto'),catalog.resolve('Canela em pó')).amount,null);
  const mix=addRecipe([],'bolo-panetone-el-guapo').find(i=>i.productId==='castanhas-opcao');assert.equal(mix.needed,50);
});

test('manual override and price persist as recipes accumulate; restore suggestion and change pack recalculate',()=>{
  let items=addRecipe([],'bolo-brigadeiro-el-guapo');let milk=items.find(i=>i.productId==='leite-condensado');milk.quantity=4;milk.manualQuantity=true;milk.priceCents=625;
  items=addRecipe(items,'bolo-prestigio');milk=items.find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,4);assert.equal(milk.suggestedQuantity,3);assert.equal(milk.priceCents,625);
  milk.manualQuantity=false;milk.packageSize=200;model.recalculate(milk);assert.equal(milk.quantity,6);
  const roundtrip=model.validate(JSON.parse(JSON.stringify(items)));assert.equal(roundtrip.find(i=>i.productId==='leite-condensado').quantity,6);
});

test('migration standardizes old aliases, preserves quantity overrides and detects price conflicts',()=>{
  const old=[{name:'Farinha W300+ ou Tipo 1 Forte',quantity:1,priceCents:500,checked:true},{name:'Farinha de trigo',quantity:2,priceCents:600,checked:false}];
  const result=model.migrate(old);assert.equal(result.length,1);assert.equal(result[0].name,'Farinha de trigo');assert.equal(result[0].quantity,3);assert.equal(result[0].manualQuantity,true);assert.equal(result[0].priceCents,null);assert.equal(result[0].checked,false);assert.match(result[0].migrationNote,/preços diferentes/);assert.equal(old.length,2);
});

test('a larger automatic purchase clears checked status; unknown quantities remain marked for review',()=>{
  let items=addRecipe([],'bolo-brigadeiro-el-guapo');items.find(i=>i.productId==='leite-condensado').checked=true;
  items=addRecipe(items,'bolo-prestigio');assert.equal(items.find(i=>i.productId==='leite-condensado').checked,false);
  const spices=model.add([],[line('Especiarias','a gosto')],{recipeId:'spices'})[0];assert.equal(spices.unknown,true);assert.equal(spices.quantity,1);
});

test('stored purchase provenance and package schema reject malformed values and unknown versions',()=>{
  const item=addRecipe([],'bolo-brigadeiro-el-guapo')[0];
  for(const change of [{version:3},{packageSize:0},{packageSize:'395'},{unit:'ml'},{productId:'forged'},{sources:[{...item.sources[0],amount:-1}]}])assert.throws(()=>model.validate([{...item,...change}]));
});
