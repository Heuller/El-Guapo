import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('activation discards stale app caches and preserves unrelated and current caches', async () => {
  const listeners = {};
  const removed = [];
  const names = [
    'el-guapo-v2.0', 'el-guapo-assets-v2.0', 'el-guapo-runtime-v2.0',
    'el-guapo-v3.11', 'el-guapo-assets-v3.11', 'el-guapo-runtime-v3.11', 'other-app-cache',
  ];
  let activation;
  vm.runInNewContext(await readFile(new URL('../sw.js', import.meta.url), 'utf8'), {
    self: {
      addEventListener: (type, handler) => { listeners[type] = handler; },
      skipWaiting() {},
      clients: { claim() {} },
    },
    caches: { keys: async () => names, delete: async name => { removed.push(name); return true; } },
    console: { log() {} },
  });
  listeners.activate({ waitUntil: promise => { activation = promise; } });
  await activation;
  assert.deepEqual(removed.sort(), ['el-guapo-assets-v2.0', 'el-guapo-runtime-v2.0', 'el-guapo-v2.0']);
});

test('a failed precache cannot activate an incomplete update',async()=>{
 const listeners={};let activationRequested=false;let installation;
 vm.runInNewContext(await readFile(new URL('../sw.js',import.meta.url),'utf8'),{
  self:{addEventListener:(type,fn)=>listeners[type]=fn,skipWaiting(){activationRequested=true}},
  caches:{open:async()=>({addAll:async()=>{throw new Error('download failed')}})},
  Request:class{constructor(url,options){this.url=url;this.cache=options.cache}},
  console:{log(){}}
 });
 listeners.install({waitUntil:p=>installation=p});
 await assert.rejects(installation,/download failed/);
 assert.equal(activationRequested,false);
});
