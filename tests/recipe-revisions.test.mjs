import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const catalog=require('../content/recipes.json');
const previous=require('./fixtures/catalog-before-2026-11-11.json');
const imported=require('./fixtures/imported-sweets-2026-11-11.json');
const recipe=id=>catalog.recipes.find(r=>r.id===id);
const ingredients=r=>r.ingredientGroups.flatMap(g=>g.ingredients);
const pair=i=>[i.name,i.quantityText];

test('focaccia and cuca are direct doughs with the user-specified flour and milk totals',()=>{
  for(const [id,milk] of [['focaccia-massa-base',450],['cuca-massa-base',420]]) {
    const r=recipe(id),items=r.ingredientGroups[0].ingredients;
    assert.equal(items.filter(i=>i.name.startsWith('Farinha')).length,1);
    assert.equal(items.find(i=>i.name.startsWith('Farinha')).quantityText,'600g');
    assert.equal(items.filter(i=>i.name.startsWith('Leite')).length,1);
    assert.equal(items.find(i=>i.name.startsWith('Leite')).quantityText,`${milk}g`);
    assert.doesNotMatch(JSON.stringify(r),/tangzhong|550g|560g|220g na batedeira/i);
    const keep=i=>!/^Farinha|^Leite|Tangzhong/i.test(i.name);
    assert.deepEqual(items.filter(keep).map(pair),ingredients(previous.recipes.find(r=>r.id===id)).filter(keep).map(pair));
  }
});

test('crumble uses the replacement 150/150/75 formula and optional aromatics',()=>{
  assert.deepEqual(recipe('cuca-massa-base').ingredientGroups.slice(1).flatMap(g=>g.ingredients).map(pair),[
    ['Farinha de trigo','150g'],['Açúcar','150g'],['Manteiga','75g'],['Raspas de cítricos','a gosto'],['Especiarias','a gosto'],
  ]);
});

test('panettone sponge is subtracted from the formula, without double-counting flour, water or yeast',()=>{
  const r=recipe('bolo-panetone-el-guapo');
  assert.deepEqual(r.ingredientGroups[0].ingredients.map(pair),[['Farinha de trigo','100g'],['Água','100g'],['Fermento biológico seco','10g']]);
  assert.deepEqual(r.ingredientGroups[1].ingredients.map(pair),[
    ['Esponja preparada','toda'],['Farinha de trigo','500g'],['Suco de laranja','150g'],['Essência natural caseira','50g'],['Gemas de ovos','130g'],['Açúcar','150g'],['Leite em pó','30g'],['Sal','8g'],['Manteiga','150g'],
  ]);
  const base=r.ingredientGroups.slice(0,2).flatMap(g=>g.ingredients);
  const sum=name=>base.filter(i=>i.name===name).reduce((n,i)=>n+i.quantity.amount,0);
  assert.equal(sum('Farinha de trigo'),600);assert.equal(sum('Água'),100);assert.equal(sum('Fermento biológico seco'),10);
  assert.equal(base.filter(i=>i.quantity.kind==='amount').reduce((n,i)=>n+i.quantity.amount,0),1378);
  assert.doesNotMatch(r.steps.find(s=>s.text.startsWith('Mistura inicial.')).text,/300g|baunilha|raspas|mel e/);
});

test('homemade essence contains every supplied ingredient and reserves cumaru and nutmeg for the cold finish',()=>{
  const parent=recipe('bolo-panetone-el-guapo');
  const r={ingredientGroups:parent.ingredientGroups.slice(4),steps:parent.steps.slice(0,3)};
  assert.deepEqual(ingredients(r).map(pair),[
    ['Raspas de laranja Bahia','3 un.'],['Raspas de tangerina','2 un.'],['Raspas de limão siciliano','2 un.'],['Raspas de limão taiti','¼ un.'],
    ['Fava de baunilha','½ un.'],['Canela em pau','1 pedaço'],['Cravo-da-índia','3 un.'],['Cardamomo','2 bagas'],['Água','250ml'],['Mel','150g'],['Destilado','125ml'],
    ['Semente de cumaru ralada','½ un.'],['Noz-moscada ralada','1 pitada'],
  ]);
  assert.match(r.steps.at(-1).text,/deixe esfriar/);
  assert.match(r.steps.at(-1).text,/cumaru.*noz-moscada/);
});

test('rice pudding and canjicada preserve every imported ingredient, preparation step, note and source',()=>{
  for(const source of imported) {
    const r=recipe(source.id);assert.ok(r);
    assert.equal(r.sourceUrl,'https://heuller.github.io/el-guapooo/');
    assert.deepEqual(r.ingredientGroups.map(g=>[g.title,g.ingredients.map(pair)]),source.ingredients.map(g=>[g.name,g.items.map(i=>[i.name,i.qty])]));
    assert.deepEqual(r.steps.map(s=>s.text),source.steps.map(s=>s.text));
    assert.deepEqual(r.notes,source.notes);
    assert.equal(r.image.src,source.id === 'arroz-doce-toffee-amburana' ? 'images/recipes/arroz-doce.jpg' : 'images/recipes/canjicada.jpg');
  }
});

test('all recipes the user left unchanged retain their formulas, steps and metadata after the authorized image replacement',()=>{
  const changed=new Set(['focaccia-massa-base','cuca-massa-base','cuca-crumble-basico','bolo-panetone-el-guapo','bolo-brigadeiro-el-guapo']);
  for(const old of previous.recipes.filter(r=>!changed.has(r.id))) {
    const current=recipe(old.id);
    for(const field of ['title','tags','metadata','ingredientGroups','steps'])assert.deepEqual(current[field],old[field],`${old.id}: ${field}`);
  }
});

test('panettone offers two alternative 450g inclusion formulas, not a combined 900g charge',()=>{
  const groups=recipe('bolo-panetone-el-guapo').ingredientGroups.filter(g=>g.variant);
  assert.deepEqual(groups.map(g=>[g.variant,g.ingredients.map(pair)]),[
    ['chocolate',[['Chocolate','400g'],['Castanhas de caju ou nozes','50g']]],
    ['frutas',[['Mistura de frutas cristalizadas, cranberry seco e castanha de caju','450g']]],
  ]);
  for(const group of groups)assert.equal(group.ingredients.reduce((n,i)=>n+i.quantity.amount,0),450);
});
