import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {browser} from './browser.mjs';

// Minimal reproduction of the previously deployed worker: network-first HTML,
// cache-first unversioned styles, and immediate activation/client claiming.
const legacyWorker=`
self.addEventListener('install',e=>{e.waitUntil(caches.open('el-guapo-v2.0').then(c=>c.addAll(['./style.css'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith((async()=>{if(e.request.url.endsWith('.css')){const hit=await caches.match(e.request);if(hit)return hit}return fetch(e.request)})())});`;
const legacyCSS='/* cached before redesign */ body{background:#ede4d1} .nav-brand{letter-spacing:8px;text-transform:uppercase}.hero{min-height:100vh}';

test('an existing visitor upgrades from cached legacy CSS in one reload without losing local data',async()=>{
 const html=(await readFile(new URL('../index.html',import.meta.url),'utf8')).replaceAll('?v=3.3','');
 const app=await browser({overrides:{'index.html':html,'style.css':legacyCSS,'sw.js':legacyWorker}});
 try {
  await app.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await app.evaluate('navigator.serviceWorker.ready');
  await app.wait('!!navigator.serviceWorker.controller');
  await app.evaluate(`localStorage.setItem('eg-note-pizza-massa-base','Minha anotação preservada');localStorage.setItem('eg-shopping-v2','[]');localStorage.setItem('eg-pantry-v1','dados antigos preservados')`);
  assert.equal(await app.evaluate(`getComputedStyle(document.body).backgroundColor`),'rgb(237, 228, 209)');
  assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('.hero-food')).objectFit`),'fill');
  await mkdir(new URL('../test-results/cache-update/',import.meta.url),{recursive:true});
  await writeFile(new URL('../test-results/cache-update/legacy-broken.png',import.meta.url),Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  // Keep the old worker active intentionally. A new worker's activation must not
  // be necessary for the current HTML to retrieve its matching stylesheet.
  app.setOverrides({'sw.js':legacyWorker});
  await app.load();
  await app.evaluate(`Promise.all([document.fonts.ready,document.querySelector('.hero-food').decode()])`);
  assert.equal(await app.evaluate(`getComputedStyle(document.body).backgroundColor`),'rgb(255, 253, 248)');
  assert.equal(await app.evaluate(`document.documentElement.scrollWidth>innerWidth`),false);
  assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('.hero-food')).objectFit`),'contain');
  assert.equal(await app.evaluate(`getComputedStyle(document.querySelector('.skip-link')).position`),'fixed');
  assert.equal(await app.evaluate(`caches.match('style.css').then(r=>r.text())`),legacyCSS);
  assert.equal(await app.evaluate(`document.querySelector('#pizza-massa-base .rc-user-notes-area').value`),'Minha anotação preservada');
  assert.deepEqual(await app.evaluate(`['eg-shopping-v2','eg-pantry-v1'].map(k=>localStorage.getItem(k))`),['[]','dados antigos preservados']);
  await writeFile(new URL('../test-results/cache-update/upgraded-mobile.png',import.meta.url),Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  assert.deepEqual(app.errors,[]);
 } finally {await app.close()}
});
