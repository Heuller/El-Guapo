import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {browser} from './browser.mjs';
let a;
before(async()=>a=await browser());after(async()=>{try{assert.deepEqual(a.errors,[])}finally{await a.close()}});
beforeEach(async()=>{await a.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});await a.evaluate('localStorage.clear()');await a.load()});
async function key(key,code,virtual){await a.send('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode:virtual});await a.send('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode:virtual});}
async function launch(query){const url=await a.evaluate(`location.origin+'/' + ${JSON.stringify(query)}`);await a.send('Page.navigate',{url});await a.wait(`document.readyState==='complete'&&!!document.querySelector('.candle-toggle')`);}
test('mise en place exposes native checkbox names and scaled quantities; Space toggles both ways',async()=>{
 await a.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click();document.querySelector('#pizza-massa-base [data-mult="2"]').click();document.querySelector('#pizza-massa-base .rc-mise-btn').focus();document.querySelector('#pizza-massa-base .rc-mise-btn').click();document.querySelector('.mise-checkbox').focus()`);
 assert.equal(await a.evaluate(`document.querySelector('.mise-checkbox').type`),'checkbox');
 const ax=await a.send('Accessibility.getFullAXTree');const checks=ax.nodes.filter(n=>n.role?.value==='checkbox');assert.ok(checks.length>0);assert.match(checks[0].name.value,/Farinha/);assert.match(checks[0].name.value,/1000/);
 await key(' ','Space',32);assert.equal(await a.evaluate(`document.querySelector('.mise-checkbox').checked&&document.querySelector('.mise-item').classList.contains('checked')`),true);
 await key(' ','Space',32);assert.equal(await a.evaluate(`document.querySelector('.mise-checkbox').checked`),false);
 await key('Escape','Escape',27);assert.equal(await a.evaluate(`document.activeElement.classList.contains('rc-mise-btn')`),true);
});
test('focus wraps through visible modal controls and never enters the hidden purchase editor',async()=>{
 await a.evaluate(`document.querySelector('.nav-btn-shopping').click();document.querySelector('#modal-close').focus()`);
 await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9,modifiers:8});
 assert.equal(await a.evaluate(`!!document.activeElement.closest('#modal-overlay')&&!document.activeElement.closest('[hidden]')&&!!document.activeElement.getClientRects().length`),true);
 await key('Tab','Tab',9);assert.equal(await a.evaluate(`document.activeElement.id`),'modal-close');
});
test('theme-color follows switch, reload, storage updates and clearing preferences',async()=>{
 const color=()=>a.evaluate(`document.querySelector('meta[name="theme-color"]').content`);
 assert.equal(await color(),'#FFFDF8');await a.evaluate(`document.querySelector('.candle-toggle').click()`);assert.equal(await color(),'#241B20');await a.load();assert.equal(await color(),'#241B20');
 assert.equal(await a.evaluate(`document.querySelector('.candle-toggle').hasAttribute('aria-pressed')`),false);
 await a.evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:'eg-candlelight',newValue:'false'}))`);assert.equal(await color(),'#FFFDF8');assert.equal(await a.evaluate(`document.querySelector('.candle-toggle').checked`),false);
 await a.evaluate(`window.dispatchEvent(new StorageEvent('storage',{key:null,newValue:null}))`);assert.equal(await color(),'#FFFDF8');
});
test('catalog shortcut reveals all recipes and focuses search without changing unrelated URL parameters',async()=>{
 await launch('?view=index&keep=1');await a.wait(`document.activeElement.id==='recipe-search'&&document.querySelector('#catalogo').getBoundingClientRect().top<180`);assert.equal(await a.evaluate(`location.search`),'?keep=1');assert.equal(await a.evaluate(`document.querySelector('#modal-overlay').classList.contains('active')`),false);assert.equal(await a.evaluate(`document.querySelector('#catalogo').getBoundingClientRect().top<180`),true);
});
test('focus shortcut offers all recipes, starts selected kitchen and returns focus on exit',async()=>{
 await launch('?mode=kitchen');await a.wait(`!!document.querySelector('.kitchen-recipe-picker')`);
 assert.equal(await a.evaluate(`document.querySelectorAll('.kitchen-recipe-picker button').length`),14);
 const name=await a.evaluate(`document.querySelector('.kitchen-picker-name').textContent`);
 await a.evaluate(`document.querySelector('.kitchen-recipe-picker button').click()`);
 assert.equal(await a.evaluate(`document.querySelector('#modal-overlay').getAttribute('aria-hidden')`),'true');assert.equal(await a.evaluate(`document.querySelector('#kitchen-mode-recipe-name').textContent`),name);
 await key('Escape','Escape',27);assert.equal(await a.evaluate(`document.activeElement.classList.contains('kitchen-btn')`),true);assert.equal(await a.evaluate(`location.search`),'');await a.load();assert.equal(await a.evaluate(`document.querySelector('#modal-overlay').classList.contains('active')`),false);
});
test('shortcuts open from the service worker navigation fallback offline',async()=>{
 await a.evaluate(`navigator.serviceWorker.ready`);await a.wait(`!!navigator.serviceWorker.controller`);
 await a.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 await launch('?mode=kitchen');await a.wait(`!!document.querySelector('.kitchen-recipe-picker')`);await a.evaluate(`document.querySelector('#modal-close').click()`);
 await launch('?view=index');await a.wait(`document.activeElement.id==='recipe-search'`);
});
test('manifest retains implemented shortcuts and stops advertising unsupported POST sharing',async()=>{
 const m=JSON.parse(await readFile(new URL('../manifest.json',import.meta.url),'utf8'));assert.equal('share_target'in m,false);assert.deepEqual(m.shortcuts.map(s=>s.url),['./?mode=kitchen','./?view=index']);
});

test('recipe picker keeps food images intact, responsive rows, visible close and keyboard focus in both themes',async()=>{
 for(const width of [320,390,1440]){
  await a.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
  for(const dark of [false,true]){
   await a.evaluate(`localStorage.setItem('eg-candlelight','${dark}')`);await launch('?mode=kitchen');await a.wait(`!!document.querySelector('.kitchen-recipe-picker')`);
   await a.evaluate(`Promise.all([...document.querySelectorAll('.kitchen-recipe-picker img')].map(img=>img.decode()))`);
   assert.equal(await a.evaluate(`(()=>{const rows=[...document.querySelectorAll('.kitchen-recipe-option')];return rows.length===14&&rows.every(b=>{const img=b.querySelector('img'),r=b.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth&&img.naturalWidth>0&&getComputedStyle(img).filter==='none'})&&document.documentElement.scrollWidth<=innerWidth})()`),true);
   await a.evaluate(`document.querySelector('.kitchen-recipe-option:last-child').focus()`);
   assert.equal(await a.evaluate(`(()=>{const r=document.getElementById('modal-close').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight})()`),true);
   await key('Tab','Tab',9);assert.equal(await a.evaluate('document.activeElement.id'),'modal-close');
   await key('Escape','Escape',27);
  }
 }
});
