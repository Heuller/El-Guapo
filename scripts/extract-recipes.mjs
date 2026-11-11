// One-time extraction from the preserved recipe markup. Deliberately no HTML rewrite.
import { browser } from '../tests/browser.mjs';
import { writeFile, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const domain = require('../recipe-domain.js');
const output = new URL('../content/recipes.json', import.meta.url);
let previous;
try { previous = JSON.parse(await readFile(output, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
const app = await browser();
try {
  const recipes = await app.evaluate(`Array.from(document.querySelectorAll('.recipe-card'), card => ({
    id:card.id, title:card.querySelector('.rc-name').textContent.trim(),
    sourceUrl:card.dataset.sourceUrl || null,
    ...(card.dataset.replacesRecipes ? {replacesRecipeIds:card.dataset.replacesRecipes.split(' ').filter(Boolean)} : {}),
    notes:Array.from(card.querySelectorAll('.rc-note'),e=>{const clone=e.cloneNode(true);const title=clone.querySelector('.rc-note-title');const heading=title?.textContent.replace(/\\s+/g,' ').trim() || '';title?.remove();return {title:heading,content:clone.textContent.replace(/\\s+/g,' ').trim()}}),
    category:card.closest('section')?.querySelector('h2')?.textContent.trim() || null,
    tags:Array.from(card.querySelectorAll('.rc-chip'),e=>e.textContent.trim()),
    metadata:Array.from(card.querySelectorAll('.rc-meta-item'),e=>({label:e.querySelector('.rc-meta-label')?.textContent.trim(),value:e.querySelector('.rc-meta-value')?.textContent.trim()})),
    image:card.querySelector('.rc-image img') ? {src:card.querySelector('.rc-image img').getAttribute('src'),alt:card.querySelector('.rc-image img').alt} : null,
    ingredientGroups:Array.from(card.querySelectorAll('.rc-ing-group'),(group,g)=>({id:card.id+'-group-'+g,...(group.dataset.variant ? {variant:group.dataset.variant} : {}),title:group.querySelector('.rc-ing-group-name')?.textContent.trim() || '',ingredients:Array.from(group.querySelectorAll('.rc-ing-item'),(item,i)=>({id:card.id+'-ingredient-'+g+'-'+i,...(item.dataset.prepared === 'true' ? {prepared:true} : {}),name:item.querySelector('.rc-ing-row span:first-child')?.childNodes[0]?.textContent.trim() || '',quantityText:item.querySelector('.rc-ing-qty')?.getAttribute('data-orig') || item.querySelector('.rc-ing-qty')?.textContent.trim() || '',detail:item.querySelector('.ing-pct')?.textContent.trim() || null}))})),
    steps:Array.from(card.querySelectorAll('.rc-step-text'),(e,i)=>({id:card.id+'-step-'+i,text:e.textContent.replace(/\\s+/g,' ').trim(),quantityReferences:[],reviewStatus:'pending'}))
  }))`);
  for (const recipe of recipes) {
    for (const group of recipe.ingredientGroups) for (const ingredient of group.ingredients) ingredient.quantity = domain.parseQuantity(ingredient.quantityText);
    const old = previous?.recipes.find(r => r.id === recipe.id);
    for (const step of recipe.steps) {
      const reviewed = old?.steps.find(s => s.id === step.id && s.text === step.text);
      if (reviewed) { step.quantityReferences = reviewed.quantityReferences; step.reviewStatus = reviewed.reviewStatus; }
    }
  }
  const catalog = {schemaVersion:1,sourceCommit:'c9eb5075759c74fee6d5614623faa1ddc31d1a1f',recipes};
  domain.validateCatalog(catalog);
  await writeFile(output, JSON.stringify(catalog,null,2)+'\n');
} finally { await app.close(); }
