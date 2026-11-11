import {browser} from '../tests/browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='test-results/splash';await mkdir(dir,{recursive:true});
const a=await browser();const evidence=[];
try{
await a.send('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{const original=HTMLImageElement.prototype.decode;window.__originalDecode=original;HTMLImageElement.prototype.decode=function(){return this.closest('#splash')?new Promise(resolve=>window.__releaseCover=resolve):original.call(this)}})()`});
for(const [width,height]of[[320,568],[360,640],[390,844],[430,932],[1366,768],[1440,900]]){
 await a.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
 for(const theme of ['light','dark']){
  await a.evaluate(`sessionStorage.clear();localStorage.setItem('eg-candlelight','${theme==='dark'}')`);
  const url=await a.evaluate('location.origin+"/"');await a.send('Page.navigate',{url});
  await a.wait(`document.readyState==='complete'&&!!window.__releaseCover`);
  await a.evaluate(`Promise.all([document.fonts.ready,window.__originalDecode.call(document.querySelector('#splash img'))])`);
  await a.evaluate(`document.getAnimations().forEach(a=>{a.pause();a.currentTime=700})`);
  const checks=await a.evaluate(`(()=>{const els=['.eg-splash__title','.eg-splash__slogan','.eg-splash__art','.eg-splash__status','.eg-splash__loader','.eg-splash__signature'];return{width:innerWidth,height:innerHeight,theme:${JSON.stringify(theme)},overflow:document.documentElement.scrollWidth>innerWidth,boxes:els.map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return{sel,x:r.x,y:r.y,width:r.width,height:r.height,inside:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight}}),foodFilter:getComputedStyle(document.querySelector('#splash img')).filter}})()`);evidence.push(checks);
  await writeFile(`${dir}/${width}x${height}-${theme}.png`,Buffer.from((await a.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await a.evaluate('window.__releaseCover()');await a.wait(`!document.querySelector('#splash')`);
 }
}
await writeFile(`${dir}/evidence.json`,JSON.stringify({note:'Only the image readiness promise is held in this test browser to capture the brief presentation. Actual local image is decoded; animations paused at 700ms. No production delays or hooks.',checks:evidence,errors:a.errors},null,2));
if(evidence.some(e=>e.overflow||e.boxes.some(b=>!b.inside))||a.errors.length)throw Error('Splash visual bounds failed');
console.log(`${evidence.length} captures verified`);
}finally{await a.close()}
