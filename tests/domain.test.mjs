import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const domain = require('../recipe-domain.js');
const catalog = require('../content/recipes.json');
const baseline = require('./content-baseline.json');

test('catalog preserves the approved recipe identities and validates references', () => {
  assert.equal(domain.validateCatalog(catalog), catalog);
  assert.deepEqual(catalog.recipes.map(r => r.id), baseline.recipeIds);
  for (const recipe of catalog.recipes) {
    assert.ok(recipe.ingredientGroups.length && recipe.steps.length);
    for (const group of recipe.ingredientGroups) for (const ingredient of group.ingredients) {
      assert.deepEqual(ingredient.quantity, domain.parseQuantity(ingredient.quantityText));
    }
  }
});
for (const multiplier of [0.5, 1, 1.5, 2, 3]) test(`all recipes: quantities scale without mutating source at ${multiplier}×`, () => {
  for (const recipe of catalog.recipes) for (const group of recipe.ingredientGroups) for (const ingredient of group.ingredients) {
    const q = ingredient.quantity;
    const before = JSON.stringify(q);
    const scaled = domain.scale(q, multiplier);
    assert.equal(JSON.stringify(q), before);
    if (q.kind === 'text') assert.equal(scaled.text, q.text);
    else {
      assert.equal(scaled.amount, q.amount * multiplier);
      if (q.kind === 'range') assert.equal(scaled.max, q.max * multiplier);
    }
  }
});
test('range, fractional household amount and unknown quantity are explicit', () => {
  assert.equal(domain.format(domain.scale(domain.parseQuantity('1½ xícara'), 2)), '3 xícara');
  assert.equal(domain.format(domain.scale(domain.parseQuantity('8–10g'), 0.5)), '4–5 g');
  assert.equal(domain.format(domain.scale(domain.parseQuantity('a gosto'), 3)), 'a gosto');
  assert.equal(domain.parseQuantity('todo').kind, 'text');
});
test('conversion does not assume density or compare incompatible quantities', () => {
  const p=domain.parseQuantity;
  assert.deepEqual(domain.compareStock(p('1 l'), p('750 ml')), {status:'missing',missing:250,unit:'ml'});
  assert.equal(domain.compareStock(p('500 g'),p('1 kg')).status,'sufficient');
  assert.equal(domain.compareStock(p('100 g'),p('100 ml')).status,'incompatible');
  assert.equal(domain.compareStock(p('8–10 g'),p('1 kg')).status,'unknown');
});
test('pizza phase quantities reconcile with total ingredients at every supported scale', () => {
  const recipe=catalog.recipes[0];
  for(const mult of [0.5,1,1.5,2,3])for(const i of [0,1,2]) {
    const ingredient=recipe.ingredientGroups[0].ingredients[i];
    const references=recipe.steps.flatMap(s=>s.quantityReferences).filter(r=>r.ingredientId===ingredient.id);
    assert.equal(references.reduce((sum,r)=>sum+r.amount*mult,0),domain.scale(ingredient.quantity,mult).amount);
  }
});
test('invalid multipliers, duplicate identities and broken references fail validation', () => {
  for(const mult of [-1,0,Infinity,NaN])assert.throws(()=>domain.scale(domain.parseQuantity('1 g'),mult));
  const copy=structuredClone(catalog);copy.recipes.push(copy.recipes[0]);assert.throws(()=>domain.validateCatalog(copy));
  const broken=structuredClone(catalog);broken.recipes[0].steps[0].quantityReferences[0].ingredientId='missing';assert.throws(()=>domain.validateCatalog(broken));
});

test('Prestígio contains the complete sponge, brigadeiro and coconut formulas and steps', () => {
  const originals = require('./fixtures/prestigio-components.json');
  const cake=catalog.recipes.find(r=>r.id==='bolo-prestigio');
  assert.equal(cake.title,'Bolo Prestígio');
  assert.equal(cake.ingredientGroups.length,3);
  const ingredientSignature = i => ({name:i.name, quantityText:i.quantityText, detail:i.detail});
  assert.deepEqual(cake.ingredientGroups.flatMap(g=>g.ingredients.map(ingredientSignature)),originals.flatMap(r=>r.ingredientGroups.flatMap(g=>g.ingredients.map(ingredientSignature))));
  const sourceSteps=originals.flatMap(r=>r.steps.map(s=>s.text));
  assert.deepEqual(cake.steps.slice(0,sourceSteps.length).map(s=>s.text),sourceSteps);
  assert.match(cake.steps.at(-1).text,/Montagem do Bolo Prestígio/);
  for(const original of originals.filter(r=>r.id==='bolo-pao-de-lo-chocolate')) {
    const individual=catalog.recipes.find(r=>r.id===original.id);
    assert.ok(individual);
    assert.deepEqual(individual.ingredientGroups,original.ingredientGroups);
    assert.deepEqual(individual.steps,original.steps);
  }
});

test('requested standalone recipes leave the catalog while the remaining bases are preserved', () => {
  const ids=catalog.recipes.map(r=>r.id);
  for(const id of ['bolo-recheio-coco','cuca-massa-chocolate','cuca-crumble-chocolate','cuca-crumble-basico','bolo-brigadeiro-el-guapo','essencia-caseira-panetone'])assert.equal(ids.includes(id),false);
  for(const id of ['cuca-massa-base','bolo-pao-de-lo-chocolate'])assert.ok(ids.includes(id));
  assert.equal(ids.length,14);
});
