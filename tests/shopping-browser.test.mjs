import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browser } from './browser.mjs';
let app;
before(async()=>{app=await browser()});after(async()=>{await app?.close()});
async function reset(){await app.evaluate('localStorage.clear()');await app.load();}
async function addRecipe(id='pizza-massa-base') {await app.evaluate(`document.querySelector('#${id} .rc-head').click();document.querySelector('#${id} .rc-shop-btn').focus();document.querySelector('#${id} .rc-shop-btn').click()`)}
async function edit(selector,value){await app.evaluate(`{const el=document.querySelector(${JSON.stringify(selector)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));}`)}
async function editProduct(id,field,value){await app.evaluate(`{const row=Array.from(document.querySelectorAll('.market-item')).find(r=>window.ElGuapoShoppingModel.productFor(r.querySelector('.market-item-name').textContent).id===${JSON.stringify(id)});const el=row.querySelector(${JSON.stringify(field)});el.value=${JSON.stringify(value)};el.dispatchEvent(new Event('input',{bubbles:true}));}`)}
async function state(){return app.evaluate(`JSON.parse(localStorage.getItem('eg-shopping-v2'))`)}

test('all 14 recipes offer add-all, pantry disappears and old data is not read or removed',async()=>{
  await reset();await app.evaluate(`localStorage.setItem('eg-pantry-v1','keep-old-data')`);await app.load();
  assert.equal(await app.evaluate(`document.querySelectorAll('.rc-shop-btn').length`),14);
  assert.equal(await app.evaluate(`document.querySelector('[aria-label="Abrir despensa"], .nav-btn-pantry')`),null);
  await addRecipe();
  assert.equal(await app.evaluate(`localStorage.getItem('eg-pantry-v1')`),'keep-old-data');
  assert.equal((await state()).length,6);
  assert.equal(await app.evaluate(`document.querySelectorAll('.market-item').length`),6);
  assert.doesNotMatch(await app.evaluate(`document.querySelector('.market-list').textContent`),/500g|325g|na despensa/);
  await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe();
  assert.equal((await state()).length,6);
});

test('purchase count, unit price, checking and unchecking update totals and survive reload',async()=>{
  await reset();await addRecipe();
  await edit('.market-quantity','2');await edit('.market-price','5,50');
  await app.evaluate(`document.querySelector('.market-check input').click()`);
  let items=await state();assert.equal(items[0].quantity,2);assert.equal(items[0].priceCents,550);assert.equal(items[0].checked,true);
  assert.match(await app.evaluate(`document.querySelector('.market-total').textContent`),/11,00/);
  assert.match(await app.evaluate(`document.querySelector('.market-picked-total').textContent`),/11,00/);
  await app.load();await app.evaluate(`document.querySelector('.nav-btn-shopping').click()`);
  assert.equal(await app.evaluate(`document.querySelector('.market-check input').checked`),true);
  assert.equal(await app.evaluate(`document.querySelector('.market-price').value`),'5,50');
  await app.evaluate(`document.querySelector('.market-check input').click()`);
  assert.match(await app.evaluate(`document.querySelector('.market-picked-total').textContent`),/0,00/);
  assert.equal((await state())[0].checked,false);
});

test('invalid price and quantity have accessible errors and cannot corrupt saved totals',async()=>{
  await reset();await addRecipe();await edit('.market-price','5,50');
  for(const raw of ['-2','0','1e3','Infinity']){
    await edit('.market-quantity',raw);
    assert.equal(await app.evaluate(`document.querySelector('.market-quantity').getAttribute('aria-invalid')`),'true');
    assert.equal((await state())[0].quantity,1);
  }
  await edit('.market-quantity','2');await edit('.market-price','-5');
  assert.equal(await app.evaluate(`document.querySelector('.market-price').getAttribute('aria-invalid')`),'true');
  assert.equal((await state())[0].priceCents,550);
  await edit('.market-price','0');assert.equal((await state())[0].priceCents,0);
});

test('manual item names are safe text and removal recalculates the total',async()=>{
  await reset();await app.evaluate(`document.querySelector('.nav-btn-shopping').click()`);
  const payload='<img src=x onerror="window.__injected=true">';
  await app.evaluate(`document.querySelector('.market-name').value=${JSON.stringify(payload)};document.querySelector('.market-add-form').requestSubmit()`);
  assert.equal(await app.evaluate(`document.querySelector('.market-item-name').textContent`),payload);
  assert.equal(await app.evaluate(`document.querySelector('.market-items img') !== null`),false);
  await edit('.market-price','8,20');await app.evaluate(`document.querySelector('.market-remove').click()`);
  assert.deepEqual(await state(),[]);assert.match(await app.evaluate(`document.querySelector('.market-total').textContent`),/0,00/);
});

test('corrupt stored list warns on open and preserves its raw data before a new list is written',async()=>{
  await reset();await app.evaluate(`localStorage.setItem('eg-shopping-v2','invalid-json')`);await app.load();
  await app.evaluate(`document.querySelector('.nav-btn-shopping').click()`);
  assert.match(await app.evaluate(`document.querySelector('.market-error').textContent`),/não pôde ser lida/);
  await app.evaluate(`document.querySelector('.market-name').value='Farinha';document.querySelector('.market-add-form').requestSubmit()`);
  assert.equal(await app.evaluate(`localStorage.getItem('eg-shopping-v2-recovery')`),'invalid-json');
  assert.equal((await state())[0].name,'Farinha');
});

test('panettone adds only selected inclusions with normalized products and without prepared sponge',async()=>{
  await reset();
  await app.evaluate(`document.querySelector('#bolo-panetone-el-guapo input[value="frutas"]').click()`);await addRecipe('bolo-panetone-el-guapo');
  let names=(await state()).map(i=>i.name).join(' ');assert.match(names,/cranberry/);assert.doesNotMatch(names,/Chocolate|Esponja preparada/);
  await reset();await addRecipe('bolo-panetone-el-guapo');names=(await state()).map(i=>i.name).join(' ');
  assert.match(names,/Chocolate/);assert.doesNotMatch(names,/cranberry|Esponja preparada/);
});

test('adding another recipe preserves existing purchase values and merges shared ingredients',async()=>{
  await reset();await addRecipe('bolo-prestigio');
  await editProduct('leite-condensado','.market-quantity','2');await editProduct('leite-condensado','.market-price','6,25');
  await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe('arroz-doce-toffee-amburana');
  const items=await state();const milk=items.filter(i=>i.name==='Leite condensado');
  assert.equal(milk.length,1);assert.equal(milk[0].quantity,2);assert.equal(milk[0].priceCents,625);
  assert.ok(items.some(i=>i.name==='Coco ralado em flocos'));
  assert.ok(items.some(i=>i.name==='Farinha de trigo'));
});

test('storage failure keeps working state in memory and displays a persistence warning',async()=>{
  await reset();await app.evaluate(`Storage.prototype.setItem=function(){throw new Error('quota')}`);await addRecipe();
  assert.match(await app.evaluate(`document.querySelector('.market-error').textContent`),/Não foi possível salvar/);
  assert.equal(await app.evaluate(`document.querySelectorAll('.market-item').length`),6);
  await edit('.market-price','3,50');
  assert.match(await app.evaluate(`document.querySelector('.market-total').textContent`),/3,50/);
});

test('rice pudding and Prestige aggregate to three condensed-milk boxes and preserve automatic counts on reload',async()=>{
  await reset();await addRecipe('arroz-doce-toffee-amburana');
  await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe('bolo-prestigio');
  let milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,3);assert.equal(milk.needed,1185);
  assert.equal((await state()).filter(i=>i.productId==='leite-condensado').length,1);
  await app.load();await app.evaluate(`document.querySelector('.nav-btn-shopping').click()`);
  milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,3);assert.equal(milk.sources.length,3);
});

test('flour aliases sum before rounding and removed legacy display preferences cannot alter purchases',async()=>{
  await reset();await app.evaluate(`localStorage.setItem('eg-unit-mode-pizza-massa-base','caseiro')`);await app.load();
  await addRecipe();await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe('focaccia-massa-base');
  const flour=(await state()).filter(i=>i.productId==='farinha-trigo');assert.equal(flour.length,1);assert.equal(flour[0].name,'Farinha de trigo');assert.equal(flour[0].needed,1100);assert.equal(flour[0].quantity,2);
});

test('readding a recipe replaces its scale and selected variant instead of accumulating duplicates',async()=>{
  await reset();await addRecipe();await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe();
  assert.equal((await state()).find(i=>i.productId==='farinha-trigo').needed,500);
  await app.evaluate(`document.querySelector('#modal-close').click();document.querySelector('#pizza-massa-base [data-mult="3"]').click();document.querySelector('#pizza-massa-base .rc-shop-btn').click()`);
  assert.equal((await state()).find(i=>i.productId==='farinha-trigo').needed,1500);assert.equal((await state()).find(i=>i.productId==='farinha-trigo').quantity,2);
});

test('editing only price leaves quantity automatic; manual quantity can be reset to suggestion',async()=>{
  await reset();await addRecipe('bolo-prestigio');await editProduct('leite-condensado','.market-price','6,00');
  assert.equal((await state()).find(i=>i.productId==='leite-condensado').manualQuantity,false);
  await editProduct('leite-condensado','.market-quantity','5');assert.equal((await state()).find(i=>i.productId==='leite-condensado').manualQuantity,true);
  await app.evaluate(`document.querySelector('#modal-close').click()`);await addRecipe('arroz-doce-toffee-amburana');
  let milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,5);assert.equal(milk.suggestedQuantity,3);assert.equal(milk.priceCents,600);
  await app.evaluate(`Array.from(document.querySelectorAll('.market-item')).find(r=>r.querySelector('.market-item-name').textContent==='Leite condensado').querySelector('.market-auto').click()`);
  milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,3);assert.equal(milk.manualQuantity,false);
  assert.match(await app.evaluate(`document.querySelector('.market-total').textContent`),/18,00/);
});

test('changing package content recalculates the suggestion and requires a fresh unit price',async()=>{
  await reset();await addRecipe('bolo-prestigio');await editProduct('leite-condensado','.market-price','5,50');
  await editProduct('leite-condensado','.market-package','200');let milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.quantity,4);assert.equal(milk.packageSize,200);assert.equal(milk.priceCents,null);
  await editProduct('leite-condensado','.market-package','0');await editProduct('leite-condensado','.market-price','7,00');assert.match(await app.evaluate(`document.querySelector('.market-error').textContent`),/Corrija/);assert.equal((await state()).find(i=>i.productId==='leite-condensado').priceCents,null);
});

test('previous saved list migrates aliases without overwriting old storage or manual purchase values',async()=>{
  await reset();const old=JSON.stringify([{name:'Farinha W300+ ou Tipo 1 Forte',quantity:2,priceCents:600,checked:true}]);
  await app.evaluate(`localStorage.setItem('eg-shopping-v1',${JSON.stringify(old)})`);await app.load();await app.evaluate(`document.querySelector('.nav-btn-shopping').click()`);
  assert.equal(await app.evaluate(`document.querySelector('.market-item-name').textContent`),'Farinha de trigo');
  await edit('.market-price','6,50');const flour=(await state())[0];assert.equal(flour.quantity,2);assert.equal(flour.checked,true);assert.equal(flour.manualQuantity,true);assert.equal(flour.priceCents,650);
  assert.equal(await app.evaluate(`localStorage.getItem('eg-shopping-v1')`),old);
});

test('unified cuca includes crumble and replaces its old shopping contribution without double counting',async()=>{
  await reset();
  await app.evaluate(`{const old=window.ElGuapoShoppingModel.add([],[{name:'Farinha de trigo',qty:'150g'}],{recipeId:'cuca-crumble-basico',recipeTitle:'Crumble Básico'});localStorage.setItem('eg-shopping-v2',JSON.stringify(old));}`);
  await app.load();await addRecipe('cuca-massa-base');
  const items=await state();const flour=items.find(i=>i.productId==='farinha-trigo');assert.equal(flour.needed,750);
  assert.equal(items.find(i=>i.productId==='acucar').needed,270);assert.equal(items.find(i=>i.productId==='manteiga').needed,165);
  assert.equal(items.some(i=>i.sources.some(s=>s.recipeId==='cuca-crumble-basico')),false);
  assert.equal(await app.evaluate(`document.querySelector('#cuca-crumble-basico')`),null);
});

test('panettone includes one full essence batch without buying prepared essence or duplicating its retired recipe',async()=>{
  await reset();await app.evaluate(`{const old=window.ElGuapoShoppingModel.add([],[{name:'Mel',qty:'150g'},{name:'Água',qty:'250ml'}],{recipeId:'essencia-caseira-panetone',recipeTitle:'Essência'});localStorage.setItem('eg-shopping-v2',JSON.stringify(old));}`);
  await app.load();await addRecipe('bolo-panetone-el-guapo');
  const items=await state();assert.equal(items.find(i=>i.productId==='mel').needed,150);assert.equal(items.find(i=>i.productId==='agua').needed,350);
  assert.equal(items.some(i=>i.productId==='essencia-caseira'),false);
  assert.equal(items.some(i=>i.sources.some(s=>s.recipeId==='essencia-caseira-panetone')),false);
  assert.equal(await app.evaluate(`document.querySelector('#essencia-caseira-panetone')`),null);
});

test('Prestige replaces the retired standalone brigadeiro demand rather than adding it twice',async()=>{
  await reset();await app.evaluate(`{const old=window.ElGuapoShoppingModel.add([],[{name:'Leite condensado',qty:'395g'}],{recipeId:'bolo-brigadeiro-el-guapo',recipeTitle:'Brigadeiro'});localStorage.setItem('eg-shopping-v2',JSON.stringify(old));}`);
  await app.load();await addRecipe('bolo-prestigio');
  const milk=(await state()).find(i=>i.productId==='leite-condensado');assert.equal(milk.needed,790);assert.equal(milk.quantity,2);
  assert.equal(milk.sources.some(s=>s.recipeId==='bolo-brigadeiro-el-guapo'),false);
  assert.equal(await app.evaluate(`document.querySelector('#bolo-brigadeiro-el-guapo')`),null);
});
