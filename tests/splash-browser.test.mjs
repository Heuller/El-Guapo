import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {browser} from './browser.mjs';
let a,hook;
before(async()=>a=await browser());
after(async()=>{try{assert.deepEqual(a.errors,[])}finally{await a.close()}});
beforeEach(async()=>{
 if(hook){await a.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook});hook=null;}
 await a.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
 await a.send('Emulation.setEmulatedMedia',{features:[]});
 await a.evaluate(`sessionStorage.clear();localStorage.clear()`);
});
async function install(code){hook=(await a.send('Page.addScriptToEvaluateOnNewDocument',{source:code})).identifier;}
const hold=`(()=>{const original=HTMLImageElement.prototype.decode;window.__originalDecode=original;HTMLImageElement.prototype.decode=function(){return this.closest('#splash')?new Promise(resolve=>window.__releaseCover=resolve):original.call(this)};document.addEventListener('eg:ready',()=>window.__appReady=true,{once:true});document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(()=>window.__coverFrame=performance.now()),{once:true})})()`;
async function nav(suffix=''){const url=await a.evaluate(`location.origin+'/' + ${JSON.stringify(suffix)}`);await a.send('Page.navigate',{url});await a.wait(`document.readyState==='complete'&&!!document.querySelector('.candle-toggle')`);}
const exists=()=>a.evaluate(`!!document.querySelector('#splash')`);
test('first session waits for essential artwork and readiness, leaves time to perceive the hand animation before exiting; reload and internal actions do not replay',async()=>{
 await install(hold);await nav();assert.equal(await a.evaluate(`document.documentElement.classList.contains('eg-splash-pending')&&window.__appReady`),true);
 assert.equal(await a.evaluate(`sessionStorage.getItem('eg-splash-seen-v1')`),'true');
 const before=await a.evaluate('performance.now()');await a.evaluate(`window.__releaseCover()`);await a.wait(`!document.querySelector('#splash')`);assert.ok(await a.evaluate('performance.now()')-before<3400);assert.ok(await a.evaluate('performance.now()-window.__coverFrame')>=2600);
 await a.evaluate(`document.querySelector('.candle-toggle').click();document.querySelector('#pizza-massa-base .rc-head').click();document.querySelector('#pizza-massa-base [data-mult="2"]').click();document.querySelector('#pizza-massa-base .kitchen-btn').click();document.querySelector('#kitchen-mode-close').click();document.querySelector('.nav-btn-shopping').click();document.querySelector('#modal-close').click()`);assert.equal(await exists(),false);
 await nav();assert.equal(await exists(),false);
 await a.evaluate('sessionStorage.clear()');await nav();assert.equal(await exists(),true);await a.evaluate(`window.__releaseCover()`);await a.wait(`!document.querySelector('#splash')`);
});
test('recipe deep links and PWA launch shortcuts bypass presentation without losing the requested flow',async()=>{
 await install(hold);
 for(const suffix of ['#bolo-prestigio','?mode=kitchen','?view=index']){
  await a.evaluate('sessionStorage.clear()');await nav(suffix);assert.equal(await exists(),false);
  if(suffix.startsWith('#'))assert.equal(await a.evaluate(`document.querySelector('#bolo-prestigio').classList.contains('open')&&location.hash==='#bolo-prestigio'`),true);
  if(suffix.includes('kitchen'))assert.equal(await a.evaluate(`!!document.querySelector('.kitchen-recipe-picker')`),true);
 }
});
test('failed artwork and a never-resolving resource fail open; safety removes cover by three seconds',async()=>{
 await install(`HTMLImageElement.prototype.decode=function(){return this.closest('#splash')?Promise.reject(Error('missing artwork')):Promise.resolve()}`);await nav();await a.wait(`!document.querySelector('#splash')`);
 await a.send('Page.removeScriptToEvaluateOnNewDocument',{identifier:hook});hook=null;await a.evaluate('sessionStorage.clear()');await install(hold);await nav();await a.wait(`!document.querySelector('#splash')`);assert.ok(await a.evaluate('performance.now()')<3400);assert.equal(await a.evaluate(`!!document.querySelector('.rc-scaler')`),true);
});
test('Tab dismisses immediately without trapping focus; reduced motion has no decorative animations',async()=>{
 await install(hold);await nav();await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});assert.equal(await exists(),false);
 await a.evaluate('sessionStorage.clear()');await a.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await nav();
 assert.equal(await a.evaluate(`[...document.querySelectorAll('#splash *')].every(el=>getComputedStyle(el).animationName==='none')`),true);
 await a.evaluate(`window.__releaseCover()`);await a.wait(`!document.querySelector('#splash')`);
});
test('cover preserves local state and running countdown, and works with the cached app offline',async()=>{
 await a.evaluate(`localStorage.setItem('eg-note-pizza-massa-base','Teste preservado');localStorage.setItem('eg-candlelight','true');localStorage.setItem('eg-timers-v1',JSON.stringify([{id:'tkeep',label:'Timer preservado',totalSeconds:540,remaining:540,paused:false,deadline:Date.now()+540000,done:false}]))`);
 await a.evaluate(`document.querySelector('#pizza-massa-base .rc-shop-btn').click();document.querySelector('#modal-close').click()`);const shoppingBefore=await a.evaluate(`localStorage.getItem('eg-shopping-v2')`);
 await install(hold);await nav();assert.equal(await a.evaluate(`getComputedStyle(document.querySelector('#splash')).backgroundColor`),'rgb(36, 27, 32)');await a.evaluate(`window.__releaseCover()`);await a.wait(`!document.querySelector('#splash')`);
 assert.ok(shoppingBefore);assert.equal(await a.evaluate(`localStorage.getItem('eg-shopping-v2')`),shoppingBefore);
 assert.equal(await a.evaluate(`document.querySelector('#pizza-massa-base .rc-user-notes-area').value`),'Teste preservado');assert.equal(await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))[0].id`),'tkeep');
 await a.evaluate(`navigator.serviceWorker.ready`);await a.wait(`!!navigator.serviceWorker.controller`);await a.evaluate('sessionStorage.clear()');await a.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});await nav();assert.equal(await exists(),true);await a.evaluate(`window.__releaseCover()`);await a.wait(`!document.querySelector('#splash')`);assert.equal(await a.evaluate(`document.querySelectorAll('.recipe-card').length`),14);
});
test('slow network still releases the cover and leaves the initialized recipe controls usable',async()=>{
 await a.send('Network.setBypassServiceWorker',{bypass:true});await a.send('Network.setCacheDisabled',{cacheDisabled:true});
 try{
  await a.send('Network.emulateNetworkConditions',{offline:false,latency:180,downloadThroughput:2000000,uploadThroughput:2000000});
  await install(`new MutationObserver(()=>{if(document.documentElement?.classList.contains('eg-splash-pending')&&!window.__coverStart)window.__coverStart=performance.now();if(window.__coverStart&&!document.querySelector('#splash')&&!document.documentElement.classList.contains('eg-splash-pending'))window.__coverEnd??=performance.now()}).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['class']})`);
  await nav();await a.wait(`!document.querySelector('#splash')`);
  assert.ok(await a.evaluate(`!window.__coverEnd||window.__coverEnd-window.__coverStart<3400`));
  await a.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click();document.querySelector('#pizza-massa-base [data-mult="2"]').click()`);assert.equal(await a.evaluate(`document.querySelector('#pizza-massa-base .rc-ing-qty').textContent`),'1000 g');
 }finally{await a.send('Network.setBypassServiceWorker',{bypass:false});await a.send('Network.setCacheDisabled',{cacheDisabled:false});}
});
test('late artwork readiness does not add another minimum and keyboard can bypass the presentation hold',async()=>{
 await install(hold);await nav();await a.wait('performance.now()-window.__coverFrame>=2800');
 const before=await a.evaluate('performance.now()');await a.evaluate('window.__releaseCover()');await a.wait(`!document.querySelector('#splash')`);assert.ok(await a.evaluate('performance.now()')-before<650);
 await a.evaluate('sessionStorage.clear()');await nav();await a.evaluate('window.__releaseCover()');await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});assert.equal(await exists(),false);
});
