/* Market UI: package suggestions, editable purchase counts and unit prices. */
(function (root) {
  'use strict';
  const model = typeof module !== 'undefined' && module.exports ? require('./shopping-model.js') : root.ElGuapoShoppingModel;
  const { KEY, LEGACY_KEY, quantity, price, add, validate, migrate, totals, productFor, recalculate } = model;
  function createUI(openModal) {
    let items = [], warning = '', corruptRaw = null;
    try {
      const raw = root.localStorage.getItem(KEY);
      const legacy = raw === null ? root.localStorage.getItem(LEGACY_KEY) : null;
      try {
        items = raw ? validate(JSON.parse(raw)) : legacy ? migrate(JSON.parse(legacy)) : [];
        if (legacy) warning = 'Lista anterior recuperada. Confira as embalagens e as quantidades editadas.';
      }
      catch { corruptRaw = raw || legacy; warning = 'A lista salva não pôde ser lida. Os novos itens começarão uma nova lista.'; }
    } catch { warning = 'Armazenamento indisponível. As alterações durarão apenas nesta página.'; }
    function persist() {
      try {
        if (corruptRaw !== null) {
          root.localStorage.setItem(KEY + '-recovery', corruptRaw);
          corruptRaw = null;
        }
        root.localStorage.setItem(KEY, JSON.stringify(items));
        warning = '';
      } catch { warning = 'Não foi possível salvar. Mantenha esta página aberta e copie a lista para não perder as alterações.'; }
    }
    const money = cents => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
    function open(message = '') {
      const container = document.createElement('div');
      container.className = 'market-list';
      const feedback = document.createElement('p');
      feedback.className = 'market-feedback'; feedback.setAttribute('role', 'status');
      feedback.textContent = message;
      const alert = document.createElement('p');
      alert.className = 'market-error'; alert.setAttribute('role', 'alert');
      const list = document.createElement('ul'); list.className = 'market-items';
      const summary = document.createElement('div'); summary.className = 'market-summary'; summary.setAttribute('aria-live', 'polite');
      const form = document.createElement('form'); form.className = 'market-add-form';
      form.innerHTML = '<label>Adicionar outro item<input class="market-name" type="text" maxlength="200" placeholder="Nome do ingrediente" required></label><button type="submit" class="btn--primary">Adicionar item</button>';
      const invalid = new Set();
      function updateSummary() {
        const total = totals(items);
        summary.replaceChildren();
        for (const [label, cents, cls] of [['Total da lista', total.cents, 'market-total'], ['Já peguei', total.pickedCents, 'market-picked-total']]) {
          const line = document.createElement('p');
          line.className = cls; line.textContent = `${label}: ${money(cents)}`;
          summary.appendChild(line);
        }
        const detail = document.createElement('p'); detail.className = 'market-summary-detail';
        detail.textContent = `${items.filter(i => i.checked).length} de ${items.length} itens marcados. ${total.unpriced} ${total.unpriced === 1 ? 'item sem preço' : 'itens sem preço'}.`;
        summary.appendChild(detail);
        alert.textContent = invalid.size ? 'Corrija os campos destacados. O total considera somente os últimos valores válidos.' : warning;
      }
      function render() {
        invalid.clear(); list.replaceChildren();
        if (!items.length) {
          const empty = document.createElement('li'); empty.className = 'market-empty';
          empty.textContent = 'Sua lista está vazia. Adicione os ingredientes de uma receita ou um item abaixo.';
          list.appendChild(empty);
        }
        items.forEach((item, index) => {
          const row = document.createElement('li'); row.className = 'market-item';
          row.classList.toggle('market-item--checked', item.checked);
          row.innerHTML = '<label class="market-check"><input type="checkbox"><span class="market-item-name"></span></label><p class="market-suggestion"></p><div class="market-fields"><label>Quantidade de compra<input class="market-quantity" type="text" inputmode="decimal" required></label><label>Preço unitário (R$)<input class="market-price" type="text" inputmode="decimal" placeholder="0,00"></label></div><details class="market-calculation"><summary>Embalagem e cálculo</summary><label class="market-package-label">Conteúdo por embalagem<input class="market-package" type="text" inputmode="decimal"></label><p class="market-need"></p></details><button type="button" class="market-auto">Usar sugestão</button><p class="market-line-error" role="alert"></p><div class="market-row-end"><output class="market-subtotal"></output><button type="button" class="market-remove">Remover</button></div>';
          row.querySelector('.market-item-name').textContent = item.name;
          const checkbox = row.querySelector('input[type="checkbox"]'); checkbox.checked = item.checked;
          checkbox.setAttribute('aria-label', `Já peguei: ${item.name}`);
          const count = row.querySelector('.market-quantity'), unitPrice = row.querySelector('.market-price');
          const lineError = row.querySelector('.market-line-error'); lineError.id = `market-error-${index}`;
          const pack = row.querySelector('.market-package');
          row.querySelector('.market-package-label').firstChild.textContent = `Conteúdo por embalagem (${item.unit})`;
          pack.setAttribute('aria-label', `Conteúdo por embalagem em ${item.unit}: ${item.name}`);
          pack.setAttribute('aria-describedby', `market-error-${index} market-need-${index}`);
          pack.value = String(item.packageSize).replace('.', ',');
          const need = row.querySelector('.market-need'); need.id = `market-need-${index}`;
          const auto = row.querySelector('.market-auto');
          const number = n => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(n);
          function describeNeed() {
            const product = productFor(item.name);
            const facts = item.sources.length ? `Necessidade das receitas: ${number(item.needed)} ${item.unit}${item.unknown ? ' conhecidos; há quantidades a conferir' : ''}. ` : 'Item manual; confira a quantidade. ';
            const recipes = [...new Set(item.sources.map(s => s.recipeTitle))];
            row.querySelector('.market-suggestion').textContent = `Sugestão: ${item.suggestedQuantity} × ${number(item.packageSize)} ${item.unit}.` + (item.unknown ? ' Confira as quantidades sem medida.' : product.review ? ' Confira o produto ou a composição.' : item.sources.some(s => s.estimated) ? ' Estimativa.' : '') + (item.manualQuantity ? ' Quantidade editada.' : '');
            const reasons = [...new Set(item.sources.filter(s => s.estimated || s.amount === null).map(s => s.reason))];
            need.textContent = facts + `Sugestão: ${item.suggestedQuantity} embalagem(ns) de ${number(item.packageSize)} ${item.unit}. ` +
              (item.manualQuantity ? 'Quantidade de compra editada manualmente. ' : '') +
              (item.sources.some(s => s.estimated) ? 'Estimativa. ' : '') +
              (recipes.length ? 'Receitas: ' + recipes.join(', ') + '. ' : '') + reasons.join(' ') + ' ' + (product.note || '') + ' ' + (item.migrationNote || '');
            auto.hidden = !item.manualQuantity;
            auto.textContent = `Usar sugestão (${item.suggestedQuantity})`;
          }
          auto.addEventListener('click', () => {
            if (quantity(pack.value) === null) return;
            item.manualQuantity = false; recalculate(item); count.value = String(item.quantity).replace('.', ',');
            checkbox.checked = item.checked; row.classList.toggle('market-item--checked', item.checked);
            invalid.delete(item); lineError.textContent = ''; count.removeAttribute('aria-invalid');
            persist(); subtotal(); describeNeed(); updateSummary();
          });
          pack.addEventListener('input', () => {
            const size = quantity(pack.value);
            pack.setAttribute('aria-invalid', String(size === null));
            if (size === null) { invalid.add(item); lineError.textContent = 'Informe um conteúdo de embalagem maior que zero.'; updateSummary(); return; }
            item.packageSize = size; recalculate(item);
            item.priceCents = null; unitPrice.value = '';
            count.value = String(item.quantity).replace('.', ','); checkbox.checked = item.checked;
            row.classList.toggle('market-item--checked', item.checked);
            count.removeAttribute('aria-invalid'); unitPrice.removeAttribute('aria-invalid');
            invalid.delete(item); lineError.textContent = 'Embalagem alterada. Informe o preço desta embalagem.';
            persist(); subtotal(); describeNeed(); updateSummary();
          });

          for (const field of [count, unitPrice]) field.setAttribute('aria-describedby', lineError.id);
          count.setAttribute('aria-label', `Quantidade de compra: ${item.name}`);
          unitPrice.setAttribute('aria-label', `Preço unitário em reais: ${item.name}`);
          count.value = String(item.quantity).replace('.', ',');
          unitPrice.value = item.priceCents === null ? '' : (item.priceCents / 100).toFixed(2).replace('.', ',');
          function subtotal() { row.querySelector('.market-subtotal').textContent = item.priceCents === null ? 'Sem preço informado' : `Subtotal: ${money(Math.round(item.quantity * item.priceCents))}`; }
          checkbox.addEventListener('change', () => {
            item.checked = checkbox.checked; row.classList.toggle('market-item--checked', item.checked);
            persist(); updateSummary();
          });
          function edit(event) {
            const amount = quantity(count.value), cents = price(unitPrice.value), size = quantity(pack.value);
            count.setAttribute('aria-invalid', String(amount === null));
            unitPrice.setAttribute('aria-invalid', String(cents === undefined));
            if (amount === null || cents === undefined || size === null) {
              invalid.add(item);
              lineError.textContent = size === null ? 'Informe um conteúdo de embalagem maior que zero.' : amount === null ? 'Informe uma quantidade maior que zero, com até três casas decimais.' : 'Informe um preço a partir de zero, com até duas casas decimais.';
              updateSummary(); return;
            }
            invalid.delete(item); lineError.textContent = '';
            if (event.target === count) item.manualQuantity = true;
            item.quantity = amount; item.priceCents = cents; persist(); subtotal(); describeNeed(); updateSummary();
          }
          count.addEventListener('input', edit); unitPrice.addEventListener('input', edit);
          const remove = row.querySelector('.market-remove');
          remove.setAttribute('aria-label', `Remover ${item.name}`);
          remove.addEventListener('click', () => {
            items.splice(index, 1); persist(); render();
            (list.querySelector('.market-remove') || form.querySelector('input')).focus();
          });
          subtotal(); describeNeed(); list.appendChild(row);
        });
        updateSummary();
      }
      form.addEventListener('submit', e => {
        e.preventDefault();
        const input = form.querySelector('input');
        if (!input.value.trim()) { input.setCustomValidity('Informe o nome do ingrediente.'); input.reportValidity(); return; }
        items = add(items, [{ name: input.value }], { manual: true }); persist(); render(); input.value = ''; input.focus();
      });
      form.querySelector('input').addEventListener('input', e => e.target.setCustomValidity(''));
      const copy = document.createElement('button'); copy.type = 'button'; copy.className = 'market-copy'; copy.textContent = 'Copiar lista';
      copy.addEventListener('click', async () => {
        const text = items.map(i => `${i.checked ? '[x]' : '[ ]'} ${i.name} — ${i.quantity} × ${i.priceCents === null ? 'sem preço' : money(i.priceCents)}`).join('\n') + '\nTotal: ' + money(totals(items).cents);
        try { await navigator.clipboard.writeText(text); feedback.textContent = 'Lista copiada.'; }
        catch { feedback.textContent = 'Não foi possível copiar automaticamente neste navegador.'; }
      });
      const hint = document.createElement('p'); hint.className = 'market-hint';
      hint.textContent = 'As receitas são somadas e arredondadas para embalagens inteiras. Os tamanhos são referências editáveis: confira o produto do mercado. O preço é por embalagem ou unidade.';
      container.append(feedback, hint, list, form, summary, alert, copy);
      render();
      openModal('Lista de Compras', 'Marque o que já pegou e acompanhe os gastos', container);
    }
    return {
      open,
      addRecipe(ingredients, options) {
        items = add(items, ingredients, options); persist();
        open('Necessidades atualizadas. Repetir a mesma receita atualiza sua escala; não duplica a compra.');
      },
    };
  }
  const api = { ...model, createUI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ElGuapoShopping = Object.freeze(api);
})(globalThis);
