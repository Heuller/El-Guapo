import {browser} from '../tests/browser.mjs';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='test-results/first-delivery';await mkdir(dir,{recursive:true});
const a=await browser();const evidence=[];
async function shot(name){await a.evaluate(`document.fonts.ready`);await writeFile(`${dir}/${name}.png`,Buffer.from((await a.send('Page.captureScreenshot',{format:'png'})).data,'base64'));}
try{
for(const [device,width] of [['mobile',320],['desktop',1440]]){
 await a.send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});
 for(const theme of ['light','dark']){
  await a.evaluate(`localStorage.clear();localStorage.setItem('eg-candlelight','${theme==='dark'}')`);await a.load();
  await a.evaluate(`(()=>{const c=document.getElementById('focaccia-massa-base');c.querySelector('.rc-head').click();const b=[...c.querySelectorAll('.timer-btn')].find(b=>b.dataset.durations.includes('1h a 1h30'));b.click();document.querySelector('.timer-choice').scrollIntoView({block:'center'})})()`);
  evidence.push(await a.evaluate(`({device:${JSON.stringify(device)},theme:${JSON.stringify(theme)},overflow:document.documentElement.scrollWidth>innerWidth,options:[...document.querySelector('.timer-range-select').options].map(o=>o.textContent)})`));
  await shot(`${device}-${theme}-duration-choice`);
  await a.evaluate(`document.querySelector('.timer-choice').requestSubmit();const c=document.getElementById('pizza-massa-base');c.querySelector('.rc-head').click();c.querySelector('[data-mult="2"]').click();c.querySelector('.rc-body-inner').scrollIntoView({block:'start'})`);
  await shot(`${device}-${theme}-pizza-2x`);
 }
}
await writeFile(`${dir}/evidence.json`,JSON.stringify({checks:evidence,browserErrors:a.errors},null,2));
if(evidence.some(e=>e.overflow)||a.errors.length)throw Error('Visual validation failed');
console.log(JSON.stringify(evidence));
}finally{await a.close()}
