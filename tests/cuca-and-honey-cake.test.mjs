import {test} from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),recipes=require('../content/recipes.json').recipes;
const components=require('./fixtures/cuca-before-merge.json'),source=require('./fixtures/pao-de-mel-imported.json');
const signature=i=>({name:i.name,quantityText:i.quantityText,detail:i.detail});

test('cuca unifies the complete current dough and crumble formulas with the original recipe identity',()=>{
  const cuca=recipes.find(r=>r.id==='cuca-massa-base');assert.equal(cuca.title,'Cuca com Crumble');
  assert.equal(recipes.some(r=>r.id==='cuca-crumble-basico'),false);
  assert.deepEqual(cuca.ingredientGroups.flatMap(g=>g.ingredients.map(signature)),components.flatMap(r=>r.ingredientGroups.flatMap(g=>g.ingredients.map(signature))));
  const [mass,crumble]=components;
  assert.deepEqual(cuca.steps.map(s=>s.text),[...mass.steps.slice(0,5),...crumble.steps,...mass.steps.slice(5)].map(s=>s.text));
  assert.deepEqual(cuca.replacesRecipeIds,['cuca-crumble-basico']);
  assert.match(cuca.notes.map(n=>n.content).join(' '),/2:2:1/);
});

test('honey cake preserves all ingredients and steps from the saved public source and uses the uploaded photo',()=>{
  const cake=recipes.find(r=>r.id==='bolo-pao-de-mel');assert.ok(cake);
  assert.deepEqual(cake.ingredientGroups.map(g=>[g.title,g.ingredients.map(i=>[i.name,i.quantityText])]),source.ingredients.map(g=>[g.name,g.items.map(i=>[i.name,i.qty])]));
  assert.deepEqual(cake.steps.map(s=>s.text),source.steps.map(s=>s.text));
  assert.equal(cake.sourceUrl,'https://heuller.github.io/el-guapooo/');assert.equal(cake.image.src,'images/recipes/bolo-pao-de-mel.jpg');
});
