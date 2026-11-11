# Cacau & Vinho — revisão exclusiva do tema escuro

**Resultado técnico: aprovado para revisão visual do usuário.** O novo tema está apenas no espaço de trabalho. Não houve commit, push ou publicação nesta revisão. O tema claro aprovado foi preservado.

## Fonte e evidências

- Referência: [Cacau & Vinho](docs/design-reference/cacau-vinho.jpg), arquivo original `701512.jpg`, **1280 × 853 px**, preservado sem edição.
- Relatório anterior do tema claro: [arquivo histórico](docs/design-qa-doce-contemporaneo.md).
- Capturas anteriores: `test-results/cacau-vinho/before/{light,dark}/`. O roteiro usa a versão publicada `9b144bb` como base do HTML e service worker.
- Capturas finais: `test-results/cacau-vinho/after/{light,dark}/`.
- Chromium local, perfis isolados, fontes e imagens completamente carregadas. Mobile **390 × 844**, tablet **820 × 1180**, desktop **1440 × 1000 CSS px**; screenshots nas mesmas dimensões, deviceScaleFactor **1**. Responsividade e posição do CTA também testadas a **320 px**.
- 42 capturas por rodada: sete estados, três viewports e dois temas. Estados: início, descoberta, grade de cartões, receita aberta, compras, total de compras e modo cozinha com a primeira etapa efetivamente carregada.
- Sem molduras de celular no produto. Nos comparativos, apenas os recortes da referência excluem as molduras; são redimensionados proporcionalmente. A referência comunica linguagem visual, não um layout com medidas exatas.

## Comparativos conjuntos inspecionados

Cada arquivo reúne a referência, o tema escuro anterior, a nova implementação e o tema claro. Os arquivos foram abertos antes da conclusão. As comparações de desktop reúnem os dois temas no mesmo viewport e estado. O painel de componentes permite ler cartões, campos, totais e navegação do modo cozinha em escala maior.

- [Mobile — início](test-results/cacau-vinho/comparisons/mobile-home.png)
- [Mobile — catálogo](test-results/cacau-vinho/comparisons/mobile-catalog.png)
- [Mobile — receita aberta](test-results/cacau-vinho/comparisons/mobile-recipe.png)
- [Desktop — claro e escuro, início e receita](test-results/cacau-vinho/comparisons/desktop-themes.png)
- [Detalhes — cartões, compras e modo cozinha](test-results/cacau-vinho/comparisons/night-components.png)

![Referência, antes, Cacau & Vinho e claro aprovado — início](test-results/cacau-vinho/comparisons/mobile-home.png)

![Referência e temas — catálogo](test-results/cacau-vinho/comparisons/mobile-catalog.png)

![Referência e temas — receita](test-results/cacau-vinho/comparisons/mobile-recipe.png)

![Comparação desktop entre temas](test-results/cacau-vinho/comparisons/desktop-themes.png)

![Detalhes dos componentes noturnos](test-results/cacau-vinho/comparisons/night-components.png)

## Achados e correções

| Prioridade | Antes / impacto | Correção e evidência final |
|---|---|---|
| P1 — imagens | Branco das ilustrações encostava diretamente nos blocos escuros, com integração fraca entre foto e texto. | Áreas brancas editoriais com passe-partout creme em hero, destaque e cartões. Nome/link sobre rodapé creme no hero. O branco dos arquivos não foi removido nem tingido. Ver comparativos de início, catálogo e receita. |
| P1 — hierarquia noturna | Muitas superfícies se confundiam num mesmo vinho; a identidade dependia quase exclusivamente da mudança de fundo. | Tokens separados para fundo cacau, navegação, cartões vinho, áreas rebaixadas e superfícies elevadas. Creme, coral e dourado recuperam a hierarquia editorial. Ver comparação desktop e painel de componentes. |
| P2 — altura do hero mobile | Ilustração de 300 px e bloco externo prolongavam a entrada até o CTA. | Somente no escuro, imagem de 230 px, margens ajustadas e retirada do grande bloco externo no celular. CTA acima da navegação em 320 e 390 px. Ver início mobile. |
| P2 — fechar receita | Ícone claro sobre o branco da imagem tinha pouca visibilidade. | Controle de fechar com área vinho circular e ícone claro, independente da arte. Ver receita mobile. |
| P2 — controles e foco | Bordas, campos e estados ativos não tinham um sistema noturno consistente. | Campos elevados, bordas identificáveis, seleção coral, navegação dourada e foco de teclado visível. Ver catálogo, compras e testes de contraste. |
| P2 — modo cozinha | A primeira captura revelou contador de progresso sobreposto aos botões. | Rodapé noturno em duas linhas: botões na primeira, progresso na segunda. Conteúdo em superfície vinho, sem alterar etapas. Captura final mostra texto carregado e controles separados. |

Não restam achados P0/P1/P2 abertos nos estados examinados. A aceitação estética final pertence ao usuário.

## Superfícies de fidelidade

**Tipografia e conteúdo:** Fraunces e DM Sans locais permanecem idênticas às do tema claro. Nome “El Guapo”, slogan oficial e texto de apoio preservados. Creme nos títulos, coral nos itálicos e dourado em rótulos e estados ativos. Nenhuma receita, medida, etapa ou regra de compra foi alterada.

**Espaçamento e proporções:** entrada mais curta no mobile noturno; no desktop, apresentação editorial em duas colunas. Busca, filtros e botões mantêm áreas de toque e hierarquia. Cartões separam a área clara da ilustração e a legenda vinho. Sem overflow nas capturas mobile, tablet e desktop ou nos testes adicionais a 320 px.

**Cores e tokens:** `dark-theme.css` contém exclusivamente seletores ligados a `html.candlelight`. Fundo `#241B20`; navegação `#2E2229`; cartão `#392A31`; área rebaixada `#30242B`; superfície elevada `#49353E`; texto `#F8EDE5`; secundário `#D6BFC4`; coral `#F08A82`; dourado `#DBB476`. Não há fundo preto puro. Bordas e campos usam tons intermediários, sem blur ou gradientes adicionados.

**Imagens:** arquivos originais e associações do catálogo preservados. `object-fit: contain`, `opacity: 1`, `filter: none`, `mix-blend-mode: normal` verificados nas ilustrações. A moldura creme é uma superfície ao redor do arquivo, não uma transformação da imagem. Filtros de contraste existentes nos ícones da interface não são aplicados a alimentos.

**Componentes:** cabeçalho e navegação inferior com superfícies próprias; campos e filtros distinguem estados; ingredientes, método e notas usam níveis de superfície; compras mantêm totais e controles; modo cozinha tem texto e navegação legíveis. O tema continua associado à preferência existente `eg-candlelight`.

## Preservação do claro

`style.css`, `script.js` e `content/recipes.json` são **byte a byte idênticos** aos da versão publicada `9b144bb`. A mudança no HTML é de carregamento: novo stylesheet escuro e URLs de versão, sem alteração do conteúdo.

A comparação de **21 estados claros correspondentes** encontrou **zero diferenças** nos estilos calculados, cores, tipografia e dimensões dos seletores examinados. Evidência: [light-preservation.json](test-results/cacau-vinho/comparisons/light-preservation.json). Um teste adicional desabilita o novo stylesheet no tema claro e confirma que a apresentação permanece igual. Não se afirma identidade binária de todas as capturas PNG: rasterização de imagens e barras de rolagem do navegador podem variar entre execuções.

## Contraste medido

| Combinação | Razão |
|---|---:|
| Texto creme / fundo cacau | 14,56:1 |
| Texto creme / cartão vinho | 11,77:1 |
| Texto secundário / cartão | 7,81:1 |
| Coral / cartão | 5,59:1 |
| Texto escuro / botão coral | 6,29:1 |
| Dourado / fundo | 8,62:1 |
| Borda do campo / busca | 4,10:1 |

Os pares de texto testados superam 4,5:1; a borda testada supera 3:1. O foco foi percorrido por teclado e verificado como visível. Disabled possui tratamento distinto e não foi contado como texto ativo. Estas verificações não constituem auditoria integral WCAG: leitor de tela, dispositivos físicos e todas as combinações possíveis de dados não foram testados.

## Histórico e validação

1. Registrados os dois temas da versão publicada antes da alteração.
2. Implementado stylesheet independente, sem tocar o CSS claro, scripts de negócio ou dados.
3. Primeira revisão de capturas: ajustado o rodapé do modo cozinha e corrigido o roteiro para esperar a etapa carregar antes de fotografar.
4. Capturadas novamente as mesmas telas; comparativos conjuntos e detalhes abertos e revisados. Resultado final sem divergência importante pendente.
5. **77 testes passaram**, incluindo persistência após recarga, retorno ao claro, isolamento do CSS noturno, contraste, foco, posicionamento do CTA, apresentação dos alimentos, rodapé do modo cozinha e funcionamento noturno offline. A suíte existente continua validando receitas, imagens originais, compras, preços, escala e atualização de cache legado.
6. Zero erros de execução/console nas capturas finais e nos testes específicos. Sintaxe e diff verificados.

Service worker e URLs de entrada preparados como **v3.4** para que uma futura publicação não reutilize arquivos de versões anteriores. O stylesheet noturno está no precache. Nada foi enviado ao GitHub ou à Vercel nesta revisão.

Reprodução:

```bash
npm run check
npm test
node scripts/capture-themes.mjs before
node scripts/capture-themes.mjs after
python3 scripts/compare-night.py
```

As capturas `before` usam `9b144bb`; os roteiros exigem Chromium e, para compor evidências, Pillow. Nenhuma biblioteca foi adicionada à aplicação.

**Checklist:** referência aberta; início/catálogo/receita capturados nos dois temas; detalhes de componentes inspecionados; claro preservado; testes concluídos; alterações aguardando revisão visual, sem publicação.

final result: passed
