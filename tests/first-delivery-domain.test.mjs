import{test}from'node:test';import assert from'node:assert/strict';import{createRequire}from'node:module';const require=createRequire(import.meta.url),time=require('../timer-durations.js'),scale=require('../recipe-scaling.js');
for(const [text,min,max]of[['1h a 1h30',3600,5400],['1h30 a 2h',5400,7200],['45–60 min',2700,3600],['45—60 minutos',2700,3600],['20-25 minutos',1200,1500],['1h30min',5400,5400],['1 hora e 30 minutos',5400,5400],['2 min e 30 segundos',150,150],['1,5h',5400,5400],['12 a 18h',43200,64800],['1h a1h30',3600,5400],['18 a 24h',64800,86400],['1h e 30s',3630,3630]])test('duration '+text,()=>assert.deepEqual(time.parse(text).map(x=>[x.min,x.max]),[[min,max]]));
test('multiple durations retain order and context without treating temperatures and masses as time',()=>{const r=time.parse('Preaqueça a 180°C por 20 minutos e asse 25 a 30 min; 500g, 50ml e 75%.');assert.deepEqual(r.map(x=>[x.min,x.max]),[[1200,1200],[1500,1800]]);assert.ok(r[1].context.includes('asse'));assert.deepEqual(time.parse('20–10 min, 500 g, 180°C, 1 médias e 2 mãos'),[])});
test('fractional quantities and equivalents scale precisely without converting original units',()=>{
 assert.equal(scale.quantity('¼ un.',.5),'0,125 un.');assert.equal(scale.quantity('6 un. (~330g)',2),'12 un. (~660g)');assert.equal(scale.quantity('1½ xícara',.5),'0,75 xícara');assert.equal(scale.quantity('3–4 un.',2),'6–8 un.');assert.equal(scale.quantity('a gosto',3),'a gosto');
});
test('every recipe has an explicit scaling review synchronized with audit data',()=>{
 const catalog=require('../content/recipes.json'),review=require('../content/scaling-review.json');
 assert.deepEqual(scale.review,review.recipes);assert.deepEqual(Object.keys(scale.review),catalog.recipes.map(r=>r.id));assert.ok(Object.values(scale.review).every(r=>r.reviewed));
});
