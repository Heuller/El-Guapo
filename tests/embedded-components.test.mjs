import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),current=require('../content/recipes.json').recipes,previous=require('./fixtures/catalog-before-embedded-essence.json').recipes;
const sig=i=>({name:i.name,quantityText:i.quantityText,detail:i.detail});

test('essence is complete inside panettone and brigadeiro remains complete only inside Prestige',()=>{
  assert.equal(current.some(r=>r.id==='essencia-caseira-panetone'||r.id==='bolo-brigadeiro-el-guapo'),false);
  const pan=current.find(r=>r.id==='bolo-panetone-el-guapo'),essence=previous.find(r=>r.id==='essencia-caseira-panetone'),oldPan=previous.find(r=>r.id===pan.id);
  assert.deepEqual(pan.ingredientGroups.slice(4).flatMap(g=>g.ingredients.map(sig)),essence.ingredientGroups.flatMap(g=>g.ingredients.map(sig)));
  assert.deepEqual(pan.steps.map(s=>s.text),[...essence.steps,...oldPan.steps].map(s=>s.text));
  assert.ok(pan.ingredientGroups[1].ingredients.find(i=>i.name==='Essência natural caseira').prepared);
  const prestige=current.find(r=>r.id==='bolo-prestigio'),oldPrestige=previous.find(r=>r.id===prestige.id);
  assert.deepEqual(prestige.ingredientGroups,oldPrestige.ingredientGroups);assert.deepEqual(prestige.steps,oldPrestige.steps);
  assert.equal(current.length,14);
});
