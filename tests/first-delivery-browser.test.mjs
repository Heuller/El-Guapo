import{test,before,after,beforeEach}from'node:test';import assert from'node:assert/strict';import{browser}from'./browser.mjs';
let a;before(async()=>a=await browser());after(async()=>{try{assert.deepEqual(a.errors,[])}finally{await a.close()}});beforeEach(async()=>{await a.evaluate('localStorage.clear()');await a.load()});
async function choose(selector,preset='middle'){await a.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);await a.wait(`!!document.querySelector('.timer-choice')`);await a.evaluate(`document.querySelector('.timer-range-select').value=${JSON.stringify(preset)};document.querySelector('.timer-choice').requestSubmit()`)}
test('different recipes with the same stage duration run independently; repeated start only focuses',async()=>{
 const selectors=await a.evaluate(`(()=>{const grouped={};for(const b of document.querySelectorAll('.recipe-card .timer-btn')){const k=b.dataset.label+':'+b.dataset.durations;(grouped[k]??=[]).push(b)}const pair=Object.values(grouped).find(bs=>new Set(bs.map(b=>b.dataset.recipeId)).size>1);return pair.slice(0,2).map(b=>'#'+b.dataset.recipeId+' .timer-btn[data-step-id="'+b.dataset.stepId+'"]')})()`);
 await choose(selectors[0]);await choose(selectors[1]);assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card').length`),2);assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card.paused').length`),0);
 const saved=await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))`);assert.notEqual(saved[0].sourceKey,saved[1].sourceKey);
 await choose(selectors[0]);assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card').length`),2);assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card.paused').length`),0);
 await a.load();assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card').length`),2);
});
test('1h to 1h30 offers 60,75,90 minutes and a bounded custom duration',async()=>{
 const selector=await a.evaluate(`(()=>{const b=[...document.querySelectorAll('#focaccia-massa-base .timer-btn')].find(b=>b.dataset.durations.includes('1h a 1h30'));return '#focaccia-massa-base .timer-btn[data-step-id="'+b.dataset.stepId+'"]'})()`);
 await a.evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);const options=await a.evaluate(`[...document.querySelector('.timer-range-select').options].map(o=>o.textContent)`);assert.match(options[0],/01:00:00/);assert.match(options[1],/01:15:00/);assert.match(options[2],/01:30:00/);
 await a.evaluate(`const s=document.querySelector('.timer-range-select');s.value='custom';s.dispatchEvent(new Event('change'));document.querySelector('.timer-custom-minutes').value='100';document.querySelector('.timer-choice').requestSubmit()`);
 assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card').length`),0);assert.match(await a.evaluate(`document.querySelector('.timer-choice-error').textContent`),/entre/);
 await a.evaluate(`document.querySelector('.timer-custom-minutes').value='80';document.querySelector('.timer-choice').requestSubmit()`);
 assert.equal(await a.evaluate(`document.querySelector('.timer-time').textContent`),'01:20:00');
});
test('card and kitchen buttons point to the same stage timer',async()=>{
 await a.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click()`);await choose('#pizza-massa-base .timer-btn');
 await a.evaluate(`document.querySelector('#pizza-massa-base .kitchen-btn').click()`);await a.wait(`!!document.querySelector('#kitchen-mode-step-text .timer-btn')`);await choose('#kitchen-mode-step-text .timer-btn');
 assert.equal(await a.evaluate(`document.querySelectorAll('.timer-card').length`),1);
});
test('legacy saved timers migrate without guessing recipe ownership or changing paused remaining time',async()=>{
 const old={id:'tlegacy',label:'Etapa 3 · 10min',totalSeconds:600,remaining:420,paused:true,deadline:Date.now()+600000,done:false};
 await a.evaluate(`localStorage.setItem('eg-timers-v1',${JSON.stringify(JSON.stringify([old]))})`);await a.load();assert.equal(await a.evaluate(`document.querySelector('.timer-time').textContent`),'07:00');assert.equal(await a.evaluate(`document.querySelector('.timer-status').textContent`),'Pausado');assert.equal(await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))[0].sourceKey`),null);
});
test('pizza phase quantities, yields and equivalents agree at 2x and kitchen reads the same scaled text',async()=>{
 await a.evaluate(`document.querySelector('#pizza-massa-base .rc-head').click();document.querySelector('#pizza-massa-base [data-mult="2"]').click()`);
 const x=await a.evaluate(`(()=>{const c=document.getElementById('pizza-massa-base');return{steps:[...c.querySelectorAll('.rc-step-text')].map(s=>s.textContent),yield:c.querySelector('.rc-meta-value').textContent,group:c.querySelector('.rc-ing-group-name').textContent,details:[...c.querySelectorAll('.ing-pct')].map(s=>s.textContent)}})()`);
 assert.match(x.steps[0],/400g de farinha, 400g de água/);assert.match(x.steps[0],/4g de fermento/);assert.match(x.steps[1],/600g de farinha/);assert.match(x.steps[1],/250g de água/);assert.match(x.steps[2],/6g restantes/);assert.match(x.steps[4],/4 porções de\s+aproximadamente 435g/);assert.match(x.yield,/4 pizzas ~435g/);assert.match(x.group,/1000g/);assert.match(x.details.join(' '),/3,4g/);assert.match(x.steps[0],/18 a 24h/);
 await a.evaluate(`document.querySelector('#pizza-massa-base .kitchen-btn').click()`);await a.wait(`document.querySelector('#kitchen-mode-step-text').textContent.includes('400g')`);
});
test('all 14 recipes restore their exact base step text after every supported scale, with no unmatched reviewed references',async()=>{
 assert.equal(await a.evaluate(`document.querySelectorAll('[data-scaling-review="mismatch"]').length`),0);
 assert.equal(await a.evaluate(`(()=>{for(const c of document.querySelectorAll('.recipe-card')){const base=[...c.querySelectorAll('.rc-step-text')].map(s=>s.innerHTML);for(const m of [.5,1.5,2,3]){c.querySelector('[data-mult="'+m+'"]').click();c.querySelector('[data-mult="1"]').click();if(JSON.stringify(base)!==JSON.stringify([...c.querySelectorAll('.rc-step-text')].map(s=>s.innerHTML)))return false}}return true})()`),true);
});
test('unit weights, temperatures, pan sizes and density stay fixed while batch counts and masses scale',async()=>{
 await a.evaluate(`for(const c of document.querySelectorAll('.recipe-card'))c.querySelector('[data-mult="2"]').click()`);
 const text=await a.evaluate(`Object.fromEntries([...document.querySelectorAll('.recipe-card')].map(c=>[c.id,c.textContent]))`);
 assert.match(text['pao-de-queijo-heuller'],/~100 un\. \(30g\)/);assert.match(text['pao-de-queijo-heuller'],/30g \(coquetel\) ou 50g/);assert.match(text['pao-de-queijo-heuller'],/após 6 ovos/);assert.match(text['pao-de-queijo-heuller'],/até 8 ovos/);
 assert.match(text['cuca-massa-base'],/2 forma\(s\) 30×40cm ou 4 de 20×30cm/);assert.match(text['bolo-prestigio'],/1,03 g\/ml/);assert.match(text['bolo-prestigio'],/pese 400g de leite/);assert.match(text['bolo-panetone-el-guapo'],/2756g \+ 900g/);
});

test('selected duration keeps its own identity and never silently resumes a paused timer',async()=>{
 const selector=await a.evaluate(`(()=>{const b=[...document.querySelectorAll('#focaccia-massa-base .timer-btn')].find(b=>b.dataset.durations.includes('1h a 1h30'));return '#focaccia-massa-base .timer-btn[data-step-id="'+b.dataset.stepId+'"]'})()`);
 await choose(selector,'min');await a.evaluate(`document.querySelector('.timer-pause').click()`);const old=await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))[0]`);await choose(selector,'max');
 const now=await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))`);assert.equal(now.length,1);assert.equal(now[0].id,old.id);assert.equal(now[0].deadline,old.deadline);assert.equal(now[0].paused,true);assert.equal(now[0].totalSeconds,3600);
});
test('multiple duration mentions can be selected separately and keep different keys',async()=>{
 const selector=await a.evaluate(`(()=>{const b=[...document.querySelectorAll('#focaccia-massa-base .timer-btn')].find(b=>JSON.parse(b.dataset.durations).length>1);return '#focaccia-massa-base .timer-btn[data-step-id="'+b.dataset.stepId+'"]'})()`);
 await a.evaluate(`document.querySelector(${JSON.stringify(selector)}).click();document.querySelector('.timer-choice').requestSubmit()`);
 await a.evaluate(`document.querySelector(${JSON.stringify(selector)}).click();const s=document.querySelector('.timer-duration-select');s.value='1';s.dispatchEvent(new Event('change'));document.querySelector('.timer-choice').requestSubmit()`);
 const ts=await a.evaluate(`JSON.parse(localStorage.getItem('eg-timers-v1'))`);assert.equal(ts.length,2);assert.notEqual(ts[0].sourceKey,ts[1].sourceKey);
});
test('scaling keeps timer durations and temperatures invariant across all recipes and all supported multipliers',async()=>{
 assert.equal(await a.evaluate(`(()=>{for(const c of document.querySelectorAll('.recipe-card')){const before=[...c.querySelectorAll('.rc-step-text')].map(e=>({times:ElGuapoDurations.parse(e.textContent).map(d=>[d.min,d.max]),temp:e.textContent.match(/\\d+(?:[–—-]\\d+)?\\s*°C/g)}));for(const m of [.5,1,1.5,2,3]){c.querySelector('[data-mult="'+m+'"]').click();const after=[...c.querySelectorAll('.rc-step-text')].map(e=>({times:ElGuapoDurations.parse(e.textContent).map(d=>[d.min,d.max]),temp:e.textContent.match(/\\d+(?:[–—-]\\d+)?\\s*°C/g)}));if(JSON.stringify(before)!==JSON.stringify(after))return false}}return true})()`),true);
});
test('scaled packaging annotations do not change normalized shopping identity and mise en place uses scaled values',async()=>{
 await a.evaluate(`document.querySelector('#canjicada-el-guapo .rc-head').click();document.querySelector('#canjicada-el-guapo [data-mult="2"]').click();document.querySelector('#canjicada-el-guapo .rc-mise-btn').click()`);
 assert.match(await a.evaluate(`document.querySelector('.mise-list').textContent`),/4 pacotes/);assert.match(await a.evaluate(`document.querySelector('.mise-qty').textContent`),/2000 g/);
 await a.evaluate(`document.querySelector('#modal-close').click();document.querySelector('#canjicada-el-guapo .rc-shop-btn').click()`);
 const rows=await a.evaluate(`JSON.parse(localStorage.getItem('eg-shopping-v2'))`);assert.ok(rows.some(r=>r.name.includes('Canjica')));assert.equal(rows.some(r=>r.name.includes('4 pacotes')),false);
});
