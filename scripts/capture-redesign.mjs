import {browser} from '../tests/browser.mjs';
import {writeFile} from 'node:fs/promises';
const app=await browser();
try {
 for(const [name,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844]]){
  await app.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});
  await app.evaluate('window.scrollTo(0,0);document.fonts.ready');
  await new Promise(r=>setTimeout(r,400));
  await writeFile(`test-results/redesign/${name}-home.png`,Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await app.evaluate('document.getElementById("catalogo").scrollIntoView()');
  await new Promise(r=>setTimeout(r,300));
  await writeFile(`test-results/redesign/${name}-catalog.png`,Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await app.evaluate(`document.querySelector('[data-open-recipe]').click()`);
  await new Promise(r=>setTimeout(r,300));
  await writeFile(`test-results/redesign/${name}-recipe.png`,Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
  await app.evaluate(`document.querySelector('#bolo-prestigio .rc-head').click()`);
  console.log(name,await app.evaluate(`({overflow:document.documentElement.scrollWidth>innerWidth,fonts:document.fonts.check('600 32px Fraunces'),images:[...document.querySelectorAll('.rc-image img')].filter(x=>x.complete&&x.naturalWidth>0).length,rules:document.styleSheets[1].cssRules.length})`));
 }
 await app.evaluate(`document.querySelector('[data-open-recipe]').click()`);
 await new Promise(r=>setTimeout(r,500));
 await writeFile('test-results/redesign/mobile-recipe.png',Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await app.evaluate(`document.querySelector('#bolo-prestigio .rc-shop-btn').click()`);
 await writeFile('test-results/redesign/mobile-shopping.png',Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 await app.evaluate(`document.querySelector('#modal-close').click();document.querySelector('.candle-toggle').click();window.scrollTo(0,0)`);
 await writeFile('test-results/redesign/mobile-dark.png',Buffer.from((await app.send('Page.captureScreenshot',{format:'png'})).data,'base64'));
 console.log('Runtime errors:', app.errors);
}finally{await app.close()}
