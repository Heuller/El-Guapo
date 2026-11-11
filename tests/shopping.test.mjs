import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url), shop=require('../shopping-list.js');

test('shopping merges equal ingredient names, retains purchases and omits prepared intermediates',()=>{
  const prior=[{name:'Leite condensado',quantity:2,priceCents:550,checked:true}];
  const added=shop.add(prior,[{name:'  leite   condensado '},{name:'Farinha de trigo',qty:'600g'},{name:'Esponja preparada',qty:'toda'}]);
  assert.equal(added.length,2);assert.equal(added[0].quantity,2);assert.equal(added[0].priceCents,550);assert.equal(added[0].checked,true);assert.equal(added[1].quantity,1);assert.equal(added[1].priceCents,null);assert.equal('qty' in added[1],false);
  assert.equal(prior.length,1);
});

test('prices use integer cents, valid zero, optional missing value and strict decimal input',()=>{
  assert.equal(shop.price('5,50'),550);assert.equal(shop.price('0'),0);assert.equal(shop.price(''),null);
  for(const raw of ['-1','Infinity','1e3','2,999','a','99999999999999'])assert.equal(shop.price(raw),undefined);
  assert.equal(shop.quantity('1,5'),1.5);
  for(const raw of ['','0','-1','NaN','1e2','1,2,3'])assert.equal(shop.quantity(raw),null);
});

test('total and picked subtotal handle counts, fractional purchases and items without a price',()=>{
  assert.deepEqual(shop.totals([
    {quantity:2,priceCents:550,checked:true},
    {quantity:.5,priceCents:1999,checked:false},
    {quantity:1,priceCents:null,checked:false},
  ]),{cents:2100,pickedCents:1100,unpriced:1});
});

test('saved list rejects invalid shapes, counts, negative prices and duplicate names',()=>{
  const good={name:'Farinha',quantity:1,priceCents:550,checked:false};
  assert.equal(shop.validate([good])[0].name,good.name);assert.equal(shop.validate([good])[0].quantity,1);
  for(const value of [{},[null],[{...good,quantity:-1}],[{...good,priceCents:-1}],[good,good]])assert.throws(()=>shop.validate(value));
});
