/* Shared, dependency-free recipe domain. No DOM or storage side effects. */
(function (root) {
  'use strict';
  const units = new Set(['g', 'kg', 'ml', 'l', 'un', 'xícara', 'col. sopa']);
  const fractions = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
  function number(text) {
    const match = text.match(/^(\d+)?([½¼¾])$/);
    return match ? Number(match[1] || 0) + fractions[match[2]] : Number(text.replace(',', '.'));
  }
  function parseQuantity(text) {
    if (typeof text !== 'string') throw new TypeError('Quantity text must be a string');
    const match = text.trim().match(/^(~?)(\d+(?:[.,]\d+)?(?:[½¼¾])?|[½¼¾])(?:[–—-](\d+(?:[.,]\d+)?))?\s*(kg|ml|g|l|un\.?|xícara|col\. sopa)(?:\s+(\(.*\)))?$/u);
    if (!match) return { kind: 'text', text };
    const amount = number(match[2]);
    const max = match[3] ? number(match[3]) : null;
    const unit = match[4].replace(/^un\.$/, 'un');
    if (!Number.isFinite(amount) || amount <= 0 || (max !== null && (!Number.isFinite(max) || max < amount))) return { kind: 'text', text };
    return { kind: max === null ? 'amount' : 'range', amount, ...(max === null ? {} : { max }), unit, approximate: !!match[1], annotation: match[5] || null, source: text };
  }
  function scale(quantity, multiplier) {
    if (!Number.isFinite(multiplier) || multiplier <= 0) throw new RangeError('Scale must be finite and positive');
    if (quantity.kind === 'text') return { ...quantity };
    const amount = quantity.amount * multiplier;
    const max = quantity.kind === 'range' ? quantity.max * multiplier : null;
    if (!Number.isFinite(amount) || (max !== null && !Number.isFinite(max))) throw new RangeError('Scaled amount exceeds supported range');
    return { ...quantity, amount, ...(max === null ? {} : { max }) };
  }
  function format(quantity) {
    if (quantity.kind === 'text') return quantity.text;
    const n = x => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3, useGrouping: false }).format(x);
    // Parenthetical weights are source annotations, not automatically reviewed calculations.
    return `${quantity.approximate ? '~' : ''}${n(quantity.amount)}${quantity.kind === 'range' ? '–' + n(quantity.max) : ''} ${quantity.unit}${quantity.annotation ? ' ' + quantity.annotation : ''}`;
  }
  function compareStock(required, stock) {
    if (required.kind !== 'amount' || stock.kind !== 'amount') return { status: 'unknown' };
    function canonical(q) {
      if (q.unit === 'kg') return { unit: 'g', amount: q.amount * 1000 };
      if (q.unit === 'l') return { unit: 'ml', amount: q.amount * 1000 };
      return q;
    }
    const req = canonical(required), available = canonical(stock);
    if (req.unit !== available.unit) return { status: 'incompatible' };
    return { status: available.amount >= req.amount ? 'sufficient' : 'missing', missing: Math.max(0, req.amount - available.amount), unit: req.unit };
  }
  function validateCatalog(catalog) {
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.recipes)) throw new TypeError('Invalid recipe catalog');
    const ids = new Set();
    for (const recipe of catalog.recipes) {
      if (!recipe || typeof recipe.id !== 'string' || !recipe.id || ids.has(recipe.id)) throw new TypeError('Invalid or duplicate recipe id');
      ids.add(recipe.id);
      if (typeof recipe.title !== 'string' || !recipe.title || !Array.isArray(recipe.ingredientGroups) || !Array.isArray(recipe.steps)) throw new TypeError('Invalid recipe structure');
      const children = new Set();
      const ingredients = new Set(recipe.ingredientGroups.flatMap(g => (g.ingredients || []).map(i => i.id)));
      for (const entry of [...recipe.ingredientGroups.flatMap(g => g.ingredients || []), ...recipe.steps]) {
        if (!entry.id || children.has(entry.id)) throw new TypeError('Invalid or duplicate child id');
        children.add(entry.id);
        if ('quantityText' in entry && (!entry.name || !entry.quantityText || JSON.stringify(entry.quantity) !== JSON.stringify(parseQuantity(entry.quantityText)))) throw new TypeError('Invalid ingredient');
        if ('reviewStatus' in entry && (!entry.text || !Array.isArray(entry.quantityReferences))) throw new TypeError('Invalid step');
      }
      for (const step of recipe.steps) for (const ref of step.quantityReferences) {
        if (!ingredients.has(ref.ingredientId) || !units.has(ref.unit) || !Number.isFinite(ref.amount) || ref.amount <= 0 || !step.text.includes(ref.sourceText)) throw new TypeError('Invalid step quantity reference');
      }
    }
    return catalog;
  }
  const api = { parseQuantity, scale, format, compareStock, validateCatalog };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ElGuapoDomain = Object.freeze(api);
})(globalThis);
