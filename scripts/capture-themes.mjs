import {browser} from '../tests/browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const phase=process.argv[2]||'after';
const overrides=phase==='before'?Object.fromEntries(['index.html','sw.js'].map(file=>[file,execFileSync('git',['show','9b144bb:'+file],{encoding:'utf8'})])):{};
const app=await browser({overrides});
const evidence=[];
const metrics=[];
try {
 for(const [device,width,height] of [['mobile',390,844],['desktop',1440,1000],['tablet',820,1180]]) {
  await app.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  for(const theme of ['light','dark']) {
   const folder=`test-results/cacau-vinho/${phase}/${theme}`;await mkdir(folder,{recursive:true});
   await app.evaluate(`localStorage.setItem('eg-candlelight','${theme==='dark'}')`);
   await app.load();
   await app.evaluate(`Promise.all([document.fonts.ready,...[...document.images].map(i=>{i.loading='eager';return i.decode().catch(()=>{})})])`);
   const capture=async state=>{
    await app.evaluate(`new Promise(requestAnimationFrame)`);
    const path=`${folder}/${device}-${state}.png`;
    await writeFile(path,Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
    evidence.push({theme,device,width,height,state,path,overflow:await app.evaluate('document.documentElement.scrollWidth>innerWidth')});
    metrics.push({theme,device,state,styles:await app.evaluate(`Object.fromEntries(['body','.nav','.hero','h1','.hero-food','.hero-slogan','.primary-link','.search-wrap','.featured-link','.recipe-card','.recipe-card.open','.rc-image','.rc-ingredients','.modal-content','.kitchen-mode-footer'].map(selector=>{const e=document.querySelector(selector);if(!e)return [selector,null];const s=getComputedStyle(e),r=e.getBoundingClientRect();return [selector,{color:s.color,background:s.backgroundColor,font:s.font,padding:s.padding,border:s.border,radius:s.borderRadius,filter:s.filter,opacity:s.opacity,objectFit:s.objectFit,width:r.width,height:r.height}]}))`)});
   };
   await app.evaluate('window.scrollTo(0,0)');await capture('home');
   await app.evaluate(`document.getElementById('catalogo').scrollIntoView()`);await capture('catalog');
   await app.evaluate(`document.querySelector('.catalog-grid').scrollIntoView()`);await capture('cards');
   await app.evaluate(`document.querySelector('.featured-link').click()`);
   await app.wait(`document.querySelector('#bolo-prestigio').classList.contains('open')`);
   await app.evaluate(`new Promise(requestAnimationFrame)`);await capture('recipe');
   await app.evaluate(`document.querySelector('#bolo-prestigio .rc-shop-btn').click()`);await capture('shopping');
   await app.evaluate(`document.querySelector('.modal-content').scrollTop=document.querySelector('.modal-content').scrollHeight`);await capture('shopping-summary');
   await app.evaluate(`document.getElementById('modal-close').click();document.querySelector('#bolo-prestigio .kitchen-btn').click()`);await app.wait(`document.getElementById('kitchen-mode-step-text').textContent.trim()!=='Carregando...'`);await capture('kitchen');
  }
 }
 await writeFile(`test-results/cacau-vinho/${phase}/evidence.json`,JSON.stringify({screens:evidence,metrics,errors:app.errors},null,2)+'\n');
 console.log(JSON.stringify({phase,captures:evidence.length,overflow:evidence.filter(e=>e.overflow),errors:app.errors}));
} finally {await app.close()}
