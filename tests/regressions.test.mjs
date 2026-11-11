import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { browser } from './browser.mjs';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

let app;
before(async () => { app = await browser(); });
after(async () => { await app?.close(); });
async function reset() {
  await app.evaluate('localStorage.clear()');
  await app.load();
}
async function openShopping() {
  await app.evaluate(`document.querySelector('.nav-btn-shopping').focus();document.querySelector('.nav-btn-shopping').click()`);
  await app.wait(`document.querySelector('#modal-overlay.active .market-list') !== null`);
}

test('personal notes cannot escape the textarea on load and retain exact content', async () => {
  await reset();
  const payload = '</textarea><img src=x onerror="window.__injected=true">';
  await app.evaluate(`localStorage.setItem('eg-note-pizza-massa-base',${JSON.stringify(payload)})`);
  await app.load();
  assert.equal(await app.evaluate(`document.querySelector('#pizza-massa-base .rc-user-notes-area').value`), payload);
  assert.equal(await app.evaluate(`document.querySelector('.rc-user-notes img') !== null`), false);
  assert.equal(await app.evaluate('window.__injected === true'), false);
});


test('modal returns focus on close, Escape and outside click; reopening stays correct', async () => {
  await reset();
  for (const method of ['close', 'escape', 'overlay', 'close']) {
    await openShopping();
    assert.equal(await app.evaluate('document.activeElement.id'), 'modal-close');
    if (method === 'escape') {
      await app.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await app.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    } else await app.evaluate(`document.querySelector('${method === 'overlay' ? '#modal-overlay' : '#modal-close'}').click()`);
    assert.equal(await app.evaluate(`document.querySelector('#modal-overlay').getAttribute('aria-hidden')`), 'true');
    assert.equal(await app.evaluate(`document.activeElement.classList.contains('nav-btn-shopping')`), true);
  }
});


test('shopping-list modal returns focus to its own trigger', async () => {
  await reset();
  await app.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click();document.querySelector('#pizza-massa-base .rc-shop-btn').focus();document.querySelector('#pizza-massa-base .rc-shop-btn').click()`);
  await app.wait(`document.querySelector('#modal-overlay.active') !== null`);
  assert.match(await app.evaluate(`document.querySelector('#modal-body').textContent`), /Farinha/);
  await app.evaluate(`document.querySelector('#modal-close').click()`);
  assert.equal(await app.evaluate(`document.activeElement.classList.contains('rc-shop-btn')`), true);
});


test('recipe source, images and recipe ids match the approved content baseline', async () => {
  const baseline = JSON.parse(await readFile(new URL('./content-baseline.json', import.meta.url), 'utf8'));
  for (const [path, hash] of Object.entries(baseline.files)) {
    const bytes = await readFile(new URL('../' + path, import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, path);
  }
  await reset();
  assert.deepEqual(await app.evaluate(`[...document.querySelectorAll('.rc-head')].map(e=>e.closest(".recipe-card").id).sort()`), [...baseline.recipeIds].sort());
});


test('structured catalog matches ingredient text and preparation steps in the approved HTML', async () => {
  await reset();
  const catalog=JSON.parse(await readFile(new URL('../content/recipes.json',import.meta.url),'utf8'));catalog.recipes.sort((a,b)=>a.title.localeCompare(b.title,'pt-BR',{sensitivity:'base',numeric:true}));
  const actual=await app.evaluate(`Array.from(document.querySelectorAll('.recipe-card'),card=>({id:card.id,title:card.querySelector('.rc-name').textContent.trim(),quantities:Array.from(card.querySelectorAll('.rc-ing-qty'),e=>e.getAttribute('data-orig')),steps:Array.from(card.querySelectorAll('.rc-step-text'),e=>e.textContent.replace(/\\s+/g,' ').trim())}))`);
  assert.deepEqual(actual,catalog.recipes.map(r=>({id:r.id,title:r.title,quantities:r.ingredientGroups.flatMap(g=>g.ingredients.map(i=>i.quantityText)),steps:r.steps.map(s=>s.text)})));
});


test('Prestígio opens with all three components and supports scaling and shopping', async () => {
  await reset();
  await app.evaluate(`document.querySelector('#bolo-prestigio .rc-head').click();document.querySelector('#bolo-prestigio [data-mult="2"]').click()`);
  assert.equal(await app.evaluate(`document.querySelector('#bolo-prestigio .rc-head').getAttribute('aria-expanded')`),'true');
  assert.deepEqual(await app.evaluate(`Array.from(document.querySelectorAll('#bolo-prestigio .rc-ing-group-name'),e=>e.textContent.trim())`),['Massa — Pão de Ló de Chocolate','Brigadeiro El Guapo','Recheio de Coco Cremoso']);
  assert.equal(await app.evaluate(`document.querySelectorAll('#bolo-prestigio .rc-step-text').length`),16);
  assert.equal(await app.evaluate(`document.querySelector('#bolo-prestigio .rc-ing-qty').textContent`),'260 g');
  await app.evaluate(`document.querySelector('#bolo-prestigio .rc-shop-btn').click()`);
  const list=await app.evaluate(`document.querySelector('#modal-body').textContent`);
  assert.match(list,/Coco ralado em flocos/);
  assert.match(list,/Chocolate meio amargo/);
  assert.match(list,/Farinha de trigo/);
});


test('embedded essence scales quarter and half units and new recipes open normally', async()=>{
  await reset();
  await app.evaluate(`document.querySelector('#bolo-panetone-el-guapo .rc-head').click();document.querySelector('#bolo-panetone-el-guapo [data-mult="2"]').click()`);
  const quantities=await app.evaluate(`Object.fromEntries(Array.from(document.querySelectorAll('#bolo-panetone-el-guapo .rc-ing-item'),e=>[e.querySelector('.rc-ing-row span:first-child').childNodes[0].textContent.trim(),e.querySelector('.rc-ing-qty').textContent]))`);
  assert.equal(quantities['Raspas de limão taiti'],'0,5 un.');
  assert.equal(quantities['Fava de baunilha'],'1 un.');
  assert.equal(quantities['Semente de cumaru ralada'],'1 un.');
  for(const id of ['arroz-doce-toffee-amburana','canjicada-el-guapo']){
    await app.evaluate(`document.querySelector('#${id} .rc-head').click();document.querySelector('#${id} .rc-shop-btn').click()`);
    assert.match(await app.evaluate(`document.querySelector('#modal-body').textContent`),/Leite condensado/);
    await app.evaluate(`document.querySelector('#modal-close').click()`);
  }
});


test('all recipes keep original measures and scaling after removing the household-unit selector, even with old saved preferences',async()=>{
  await reset();
  await app.evaluate(`for(const card of document.querySelectorAll('.recipe-card'))localStorage.setItem('eg-unit-mode-'+card.id,'caseiro')`);
  await app.load();
  assert.equal(await app.evaluate(`document.querySelectorAll('.rc-unit-switcher, .rc-unit-btn, [data-unit="caseiro"]').length`),0);
  assert.equal(await app.evaluate(`Array.from(document.querySelectorAll('button')).some(e=>e.textContent.trim().toLowerCase()==='caseiro')`),false);
  const catalog=JSON.parse(await readFile(new URL('../content/recipes.json',import.meta.url),'utf8'));catalog.recipes.sort((a,b)=>a.title.localeCompare(b.title,'pt-BR',{sensitivity:'base',numeric:true}));
  assert.deepEqual(await app.evaluate(`Array.from(document.querySelectorAll('.recipe-card'),card=>Array.from(card.querySelectorAll('.rc-ing-qty'),e=>e.textContent.trim()))`),catalog.recipes.map(r=>r.ingredientGroups.flatMap(g=>g.ingredients.map(i=>i.quantityText))));
  await app.evaluate(`document.querySelector('#bolo-cenoura-gabriela .rc-head').click();document.querySelector('#bolo-cenoura-gabriela [data-mult="2"]').click()`);
  const cups=await app.evaluate(`Array.from(document.querySelectorAll('#bolo-cenoura-gabriela .rc-ing-qty')).filter(e=>e.dataset.orig.includes('xícara')).map(e=>e.textContent)`);
  assert.deepEqual(cups,['2 xícara','2 xícara','3 xícara','2 xícara','6 xícaras']);
});
