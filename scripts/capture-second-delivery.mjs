import {browser} from '../tests/browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='test-results/second-delivery';await mkdir(dir,{recursive:true});
const a=await browser();const checks=[];
async function capture(name){await a.evaluate('document.fonts.ready');await a.evaluate(`Promise.all([...document.querySelectorAll(".kitchen-recipe-picker img")].map(img=>img.decode()))`);await writeFile(`${dir}/${name}.png`,Buffer.from((await a.send('Page.captureScreenshot',{format:'png'})).data,'base64'));}
try{for(const [device,width]of[['mobile',320],['desktop',1440]]){
 await a.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 for(const theme of['light','dark']){
  await a.evaluate(`localStorage.clear();localStorage.setItem('eg-candlelight','${theme==='dark'}')`);await a.load();
  await a.evaluate(`document.querySelector('.rc-head').click();document.querySelector('.rc-mise-btn').click();document.querySelector('.mise-checkbox').click();document.querySelectorAll('.mise-checkbox')[1].focus()`);
  checks.push(await a.evaluate(`({device:${JSON.stringify(device)},theme:${JSON.stringify(theme)},themeColor:document.querySelector('meta[name="theme-color"]').content,checked:document.querySelector('.mise-checkbox').checked,overflow:document.documentElement.scrollWidth>innerWidth,focusOutline:getComputedStyle(document.querySelectorAll('.mise-item')[1]).outlineStyle})`));
  await capture(`${device}-${theme}-mise-en-place`);
  await a.evaluate(`document.querySelector('#modal-close').click();history.replaceState(null,'','?mode=kitchen')`);await a.send('Page.reload');await a.wait(`document.readyState==='complete'&&!!document.querySelector('.kitchen-recipe-picker')`);
  await a.evaluate(`(()=>{const style=document.createElement('style');style.textContent='*,*::before,*::after{animation:none!important;transition:none!important}';document.head.append(style);return new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))})()`);
  await capture(`${device}-${theme}-focus-picker`);
 }
}
await writeFile(`${dir}/evidence.json`,JSON.stringify({checks,errors:a.errors},null,2));
if(checks.some(c=>c.overflow||!c.checked||c.focusOutline==='none')||a.errors.length)throw Error('Capture validation failed');
console.log(JSON.stringify(checks));
}finally{await a.close()}
