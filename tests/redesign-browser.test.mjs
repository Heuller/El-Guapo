import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {browser} from './browser.mjs';
let app;
before(async()=>{app=await browser()});
after(async()=>{try{assert.deepEqual(app?.errors,[],'Unexpected browser errors')}finally{await app?.close()}});
beforeEach(async()=>{await app.load()});

test('all uploaded illustrations retain their original bytes and load with local fonts and icons',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../content/recipe-images.json',import.meta.url),'utf8'));
 for(const image of manifest){
  const bytes=await readFile(new URL('../'+image.src,import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),image.sha256,image.recipeId);
 }
 await app.evaluate(`Promise.all([...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})}))`);
 assert.deepEqual(await app.evaluate(`[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)`),[]);
 assert.equal(await app.evaluate(`document.fonts.check('600 32px Fraunces')&&document.fonts.check('400 16px "DM Sans"')`),true);
 assert.equal(await app.evaluate(`document.querySelectorAll('link[href*="googleapis"]').length`),0);
});

test('category filters combine with accent-insensitive ingredient search and a recoverable empty state',async()=>{
 await app.evaluate(`document.querySelector('[data-category="savory"]').click()`);
 assert.equal(await app.evaluate(`document.querySelectorAll('.recipe-card:not(.search-hidden)').length`),4);
 await app.evaluate(`document.querySelector('#recipe-search').value='PAO DO HEULLER';document.querySelector('#recipe-search').dispatchEvent(new Event('input'))`);
 await app.wait(`document.querySelectorAll('.recipe-card:not(.search-hidden)').length===1`);
 await app.evaluate(`document.querySelector('#recipe-search').value='sem-resultado-123';document.querySelector('#recipe-search').dispatchEvent(new Event('input'))`);
 await app.wait(`!document.querySelector('.catalog-empty').hidden`);
 assert.equal(await app.evaluate(`document.getElementById('catalog-count').textContent`),'0 receitas no caderno');
 await app.evaluate(`document.querySelector('#search-clear').click();document.querySelector('[data-category="all"]').click()`);
 assert.equal(await app.evaluate(`document.querySelectorAll('.recipe-card:not(.search-hidden)').length`),14);
 assert.equal(await app.evaluate(`document.querySelector('.catalog-empty').hidden`),true);
});

test('responsive catalog, recipe and shopping keep controls inside mobile, tablet and desktop viewports',async()=>{
 for(const width of [320,390,820,1440]){
  await app.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
  assert.equal(await app.evaluate('document.documentElement.scrollWidth>innerWidth'),false,`${width}: catalog overflow`);
  await app.evaluate(`document.querySelector('[data-open-recipe]').click()`);
  await app.wait(`document.querySelector('#bolo-prestigio').classList.contains('open')`);
  assert.equal(await app.evaluate(`document.documentElement.scrollWidth>innerWidth`),false,`${width}: recipe overflow`);
  assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('#bolo-prestigio .rc-image img')).objectFit`),'contain');
  await app.evaluate(`document.querySelector('#bolo-prestigio .rc-shop-btn').click()`);
  assert.equal(await app.evaluate(`document.querySelector('.modal-content').getBoundingClientRect().right<=innerWidth`),true);
  await app.evaluate(`document.querySelector('#modal-close').click();document.querySelector('#bolo-prestigio .rc-head').click()`);
 }
});

test('kitchen mode has a standalone keyboard-accessible action and closed recipe bodies are hidden',async()=>{
 await app.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click()`);
 assert.equal(await app.evaluate(`document.querySelector('#pizza-massa-base .kitchen-btn').closest('.rc-head')===null`),true);
 await app.evaluate(`document.querySelector('#pizza-massa-base .kitchen-btn').focus()`);
 await app.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r'});
 await app.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 assert.equal(await app.evaluate(`document.querySelector('#kitchen-mode-overlay').getAttribute('aria-hidden')`),'false');
 await app.evaluate(`document.querySelector('#kitchen-mode-close').click();document.querySelector('#pizza-massa-base .rc-head').click()`);
 assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('#pizza-massa-base .rc-body')).display`),'none');
});

test('direct recipe links reveal the matching recipe without changing its formula',async()=>{
 await app.evaluate(`location.hash='bolo-panetone-el-guapo'`);
 await app.wait(`document.querySelector('#bolo-panetone-el-guapo').classList.contains('open')`);
 assert.equal(await app.evaluate(`document.querySelector('#bolo-panetone-el-guapo .rc-head').getAttribute('aria-expanded')`),'true');
});

test('the updated offline cache includes every local illustration, font and navigation icon',async()=>{
 await app.evaluate(`navigator.serviceWorker.ready`);
 await app.wait(`!!navigator.serviceWorker.controller`);
 const expected=await readFile(new URL('../content/recipe-images.json',import.meta.url),'utf8');
 const cached=await app.evaluate(`caches.open('el-guapo-v3.3').then(c=>c.keys()).then(keys=>keys.map(k=>new URL(k.url).pathname))`);
 for(const image of JSON.parse(expected)) assert.ok(cached.includes('/'+image.src),image.src);
 for(const path of ['/assets/fonts.css','/assets/fonts/fraunces-600-normal.ttf','/assets/icons/house.svg']) assert.ok(cached.includes(path),path);
 await app.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 try {
  await app.load();
  assert.equal(await app.evaluate(`document.querySelectorAll('.recipe-card').length`),14);
  assert.equal(await app.evaluate(`document.querySelector('.hero-food').complete&&document.querySelector('.hero-food').naturalWidth>0`),true);
 } finally {await app.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})}
});

test('editorial feature follows filters and opens the real recipe without duplicating the catalog',async()=>{
 assert.equal(await app.evaluate(`document.querySelectorAll('.recipe-card').length`),14);
 assert.equal(await app.evaluate(`document.querySelector('.featured-recipe').hidden`),false);
 await app.evaluate(`document.querySelector('[data-category="savory"]').click()`);
 assert.equal(await app.evaluate(`document.querySelector('.featured-recipe').hidden`),true);
 await app.evaluate(`document.querySelector('[data-category="all"]').click();document.querySelector('.featured-link').click()`);
 assert.equal(await app.evaluate(`document.querySelector('#bolo-prestigio .rc-head').getAttribute('aria-expanded')`),'true');
});

test('food leads the mobile welcome and the desktop kitchen action stays visible beside its recipe',async()=>{
 await app.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 assert.equal(await app.evaluate(`document.querySelector('.hero-food').getBoundingClientRect().bottom<document.querySelector('#welcome-title').getBoundingClientRect().top`),true);
 await app.evaluate(`document.querySelector('.candle-toggle').click()`);
 assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('.hero-caption strong')).color`),'rgb(63, 28, 41)');
 assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('.mobile-nav [aria-current] img')).filter`),'none');
 await app.evaluate(`document.querySelector('.candle-toggle').click()`);
 await app.send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await app.evaluate(`document.querySelector('.featured-link').click()`);
 await app.wait(`document.querySelector('#bolo-prestigio').classList.contains('open')`);
 assert.equal(await app.evaluate(`(()=>{const card=document.getElementById('bolo-prestigio');const button=card.querySelector('.kitchen-btn');const b=button.getBoundingClientRect();const image=card.querySelector('.rc-image').getBoundingClientRect();return b.left>image.right&&b.bottom<=image.bottom+20&&document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('.kitchen-btn')===button})()`),true);
});
