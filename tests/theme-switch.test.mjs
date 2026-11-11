import{test}from'node:test';import assert from'node:assert/strict';import{browser}from'./browser.mjs';
test('animated switch has exact dimensions, keyboard control, persistence and reduced motion',async()=>{const a=await browser();try{
assert.deepEqual(await a.evaluate(`(()=>{const l=document.querySelector('.el-guapo-theme-switch').getBoundingClientRect(),s=document.querySelector('.eg-ts-slider').getBoundingClientRect();return[l.width,l.height,s.width,s.height,document.querySelectorAll('.eg-ts-input').length]})()`),[60,44,60,34,1]);
await a.evaluate(`document.querySelector('.candle-toggle').focus()`);
await a.send('Input.dispatchKeyEvent',{type:'keyDown',key:' ',code:'Space',windowsVirtualKeyCode:32});await a.send('Input.dispatchKeyEvent',{type:'keyUp',key:' ',code:'Space',windowsVirtualKeyCode:32});
assert.equal(await a.evaluate(`document.querySelector('.candle-toggle').checked===document.documentElement.classList.contains('candlelight')`),true);
await a.load();assert.equal(await a.evaluate(`document.querySelector('.candle-toggle').checked`),true);
await a.send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await a.evaluate(`document.querySelectorAll('style').forEach(e=>e.remove())`);
assert.equal(await a.evaluate(`getComputedStyle(document.querySelector('.eg-ts-star')).animationName`),'none');
assert.deepEqual(a.errors,[]);
}finally{await a.close()}});
