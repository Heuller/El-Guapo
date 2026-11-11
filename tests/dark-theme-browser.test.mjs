import {test,before,after,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {browser} from './browser.mjs';
let app;
before(async()=>{app=await browser()});
after(async()=>{try{assert.deepEqual(app?.errors,[])}finally{await app?.close()}});
beforeEach(async()=>{
 await app.evaluate('localStorage.clear()');await app.load();
 await app.evaluate(`document.querySelector('.candle-toggle').click()`);
});
const luminance=rgb=>{
 const c=rgb.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4});
 return .2126*c[0]+.7152*c[1]+.0722*c[2];
};
const ratio=(a,b)=>{const c=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(c[1]+.05)/(c[0]+.05)};

test('night preference persists on reload and switching back restores the approved light style',async()=>{
 assert.equal(await app.evaluate(`document.querySelector('.candle-toggle').getAttribute('aria-pressed')`),'true');
 await app.load();
 assert.equal(await app.evaluate(`document.documentElement.classList.contains('candlelight')`),true);
 assert.equal(await app.evaluate(`getComputedStyle(document.body).backgroundColor`),'rgb(36, 27, 32)');
 await app.evaluate(`document.querySelector('.candle-toggle').click()`);await app.load();
 assert.equal(await app.evaluate(`getComputedStyle(document.body).backgroundColor`),'rgb(255, 253, 248)');
 const selectorList=['body','.nav','.hero','h1','.hero-slogan','.primary-link','.hero-food','.search-wrap','.featured-link','.recipe-card','.rc-image','.modal-content','.kitchen-mode-content','.mobile-nav'];
 const capture=`${JSON.stringify(selectorList)}.map(selector=>{const e=document.querySelector(selector),s=getComputedStyle(e),r=e.getBoundingClientRect();return [selector,s.color,s.backgroundColor,s.font,s.padding,s.border,s.borderRadius,s.filter,r.width,r.height]})`;
 const enabled=await app.evaluate(capture);
 await app.evaluate(`document.querySelector('link[href^="dark-theme.css"]').sheet.disabled=true`);
 assert.deepEqual(await app.evaluate(capture),enabled,'The dark stylesheet must have zero effect on the light theme');
});

test('night text, actions and input boundaries meet measured contrast thresholds',async()=>{
 const pairs=[['body','body'],['.hero-description','.hero'],['.hero-slogan','.hero'],['.primary-link','.primary-link'],['.category-filter.active','.category-filter.active'],['.search-input','.search-wrap'],['.featured-copy strong','.featured-link'],['.featured-cta','.featured-link'],['.hero-caption strong','.hero-caption'],['.rc-name','.recipe-card']];
 for(const [fg,bg]of pairs){
  const [a,b]=await app.evaluate(`[getComputedStyle(document.querySelector('${fg}')).color,getComputedStyle(document.querySelector('${bg}')).backgroundColor]`);
  assert.ok(ratio(a,b)>=4.5,`${fg}: ${ratio(a,b).toFixed(2)}:1`);
 }
 const [border,bg]=await app.evaluate(`(()=>{const s=getComputedStyle(document.querySelector('.search-wrap'));return[s.borderTopColor,s.backgroundColor]})()`);
 assert.ok(ratio(border,bg)>=3,'Input boundary should remain identifiable');
});

test('food artwork is unfiltered, opaque and contained; the mobile hero CTA stays above the navigation',async()=>{
 for(const width of [320,390,820,1440]){
  await app.send('Emulation.setDeviceMetricsOverride',{width,height:844,deviceScaleFactor:1,mobile:width<600});
  await app.evaluate('window.scrollTo(0,0);new Promise(requestAnimationFrame)');
  assert.equal(await app.evaluate('document.documentElement.scrollWidth>innerWidth'),false,`${width}px`);
  const images=await app.evaluate(`[...document.querySelectorAll('.hero-food,.featured-food,.rc-image img')].map(e=>{const s=getComputedStyle(e);return[s.filter,s.opacity,s.mixBlendMode,s.objectFit]})`);
  for(const state of images) assert.deepEqual(state,['none','1','normal','contain']);
  if(width<600)assert.equal(await app.evaluate(`document.querySelector('.primary-link').getBoundingClientRect().bottom<=document.querySelector('.mobile-nav').getBoundingClientRect().top`),true,`${width}px CTA`);
 }
});

test('keyboard focus is visible and kitchen progress does not overlap its navigation controls',async()=>{
 await app.evaluate(`document.querySelector('#recipe-search').focus()`);
 await app.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 await app.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert.equal(await app.evaluate(`document.activeElement.matches(':focus-visible')&&getComputedStyle(document.activeElement).outlineStyle!=='none'`),true);
 await app.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await app.evaluate(`document.querySelector('.featured-link').click()`);
 await app.wait(`document.querySelector('#bolo-prestigio').classList.contains('open')`);
 await app.evaluate(`document.querySelector('#bolo-prestigio .kitchen-btn').click()`);
 await app.wait(`document.querySelector('#kitchen-mode-step-text').textContent.trim()!=='Carregando...'`);
 assert.equal(await app.evaluate(`(()=>{const p=document.querySelector('#kitchen-mode-progress').getBoundingClientRect();return['#kitchen-mode-next','#kitchen-mode-prev'].every(selector=>document.querySelector(selector).getBoundingClientRect().bottom<=p.top)})()`),true);
});

test('night stylesheet and saved preference remain available after an offline reload',async()=>{
 await app.evaluate('navigator.serviceWorker.ready');
 await app.wait('!!navigator.serviceWorker.controller');
 assert.equal(await app.evaluate(`caches.open('el-guapo-v3.6').then(c=>c.keys()).then(keys=>keys.some(k=>new URL(k.url).pathname.endsWith('/dark-theme.css')))`),true);
 await app.send('Network.emulateNetworkConditions',{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
 try {
  await app.load();
  assert.equal(await app.evaluate(`document.documentElement.classList.contains('candlelight')`),true);
  assert.equal(await app.evaluate(`getComputedStyle(document.body).backgroundColor`),'rgb(36, 27, 32)');
 } finally {await app.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1})}
});
