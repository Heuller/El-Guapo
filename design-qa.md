# Auditoria comparativa — El Guapo / Doce Contemporâneo

**Resultado:** validação visual aprovada após duas rodadas de ajustes. Nenhuma divergência crítica ou importante permanece aberta nos estados examinados. As capturas finais estão disponíveis para revisão do usuário; nenhuma alteração foi publicada.

## Referência e método

Referência original: [docs/design-reference/doce-contemporaneo.jpg](docs/design-reference/doce-contemporaneo.jpg), recebida como `701475.jpg`. Embora descrita na mensagem como PNG, o arquivo recebido é JPEG, de **1280 × 848 pixels**; foi preservado sem conversão. SHA-256: `a4fbe9c8c6cc280b77d1fac2d53b38489564713499250c64698b928e490fa5fc`.

O bloqueio anterior de comparação foi resolvido com esse arquivo. O [relatório anterior](docs/design-qa-before-reference.md) foi arquivado como histórico, não representa o resultado atual.

As capturas anteriores, explicitamente indicadas pelo usuário, foram abertas e preservadas em `test-results/redesign/before/`. A auditoria comparou essas capturas com a imagem original **no mesmo arquivo de comparação**, antes das correções. Novas capturas foram feitas no Chromium local após cada rodada. As composições finais foram abertas e inspecionadas, incluindo detalhes de alimentos, texto e controles.

A prancha contém três celulares em perspectiva e não especifica uma interface desktop. Os recortes da referência foram retificados apenas nas evidências, sem alterar imagens do aplicativo. Não se reproduziram molduras, inclinações, adesivos ou o fundo publicitário. Não se apresenta esta avaliação como um comparativo de pixels idênticos.

### Normalização

| Artefato | Dimensões e tratamento |
|---|---|
| Prancha original | 1280 × 848 px; cópia integral preservada |
| Conteúdo das três telas da referência | Retificação por quadriláteros para 350 × 800 px, removendo a maior parte das molduras; coordenadas em `scripts/compare-redesign.py` |
| Mobile da aplicação | 390 × 844 CSS px; screenshot 390 × 844 px; deviceScaleFactor 1 |
| Tablet da aplicação | 820 × 1180 CSS px; screenshot 820 × 1180 px; deviceScaleFactor 1 |
| Desktop da aplicação | 1440 × 1000 CSS px; screenshot 1440 × 1000 px; deviceScaleFactor 1 |
| Largura adicional | Controles e overflow testados a 320 px |
| Composições | Mobile 1500 × 980; desktop 1750 × 1180; detalhes 1280 × 960 px. Painéis reduzidos proporcionalmente, sem deformar screenshots |

A ampliação dos recortes não recupera detalhes perdidos no JPEG. As proporções, cores e fontes foram avaliadas como linguagem visual; não foram inventadas medidas exatas de margens ou nomes de fontes a partir da prancha.

## Evidências lado a lado

- Antes: [mobile](test-results/redesign/comparisons/mobile-before.png) · [desktop](test-results/redesign/comparisons/desktop-before.png) · [detalhes](test-results/redesign/comparisons/details-before.png).
- Após a primeira rodada: [mobile](test-results/redesign/comparisons/mobile-after.png) · [desktop](test-results/redesign/comparisons/desktop-after.png). Capturas individuais dessa rodada em `test-results/redesign/iteration-1/`.
- Finais: [mobile](test-results/redesign/comparisons/mobile-final.png) · [desktop](test-results/redesign/comparisons/desktop-final.png) · [detalhes de receita e alimentos](test-results/redesign/comparisons/details-final.png).

![Referência e interface mobile — comparativo final](test-results/redesign/comparisons/mobile-final.png)

![Referência e adaptação desktop — comparativo final](test-results/redesign/comparisons/desktop-final.png)

![Detalhes de tipografia, alimentos, cartões e receita](test-results/redesign/comparisons/details-final.png)

## Classificação das divergências

Crítica = bloqueia uso, esconde controles essenciais ou compromete seriamente a apresentação. Importante = altera a hierarquia, a personalidade ou a clareza dos componentes. Cosmética = diferença pequena ou adaptação intencional, sem prejuízo de uso.

**Críticas: nenhuma identificada.**

| ID / gravidade | Evidência anterior e impacto | Correção e evidência final |
|---|---|---|
| I1 — importante / P1 | No comparativo mobile anterior, o título e o CTA antecediam uma ilustração menor e encaixotada. A abertura parecia uma landing page genérica, enquanto a referência apresenta o alimento como protagonista. | No celular, ilustração de 300 px de altura antes do título; receita identificada com link discreto. CTA permanece visível no viewport de 390 × 844. Ver `mobile-final.png` e `mobile-home.png`. |
| I2 — importante / P1 | Hero com grande superfície blush e um segundo cartão branco ao redor da imagem; na receita, branco da imagem contrastava com a área cream. O alimento parecia um asset inserido em caixas sucessivas. | Hero e capa de receita em superfície branca contínua, molduras e divisores reduzidos; imagens originais inteiras. No modo escuro, área branca com cantos suaves é intencional para preservar a arte. Ver comparativos mobile, desktop e detalhes finais. |
| I3 — importante / P2 | O catálogo começava diretamente na grade; faltava o destaque horizontal, um dos componentes mais reconhecíveis da referência. A composição ficava uniforme e repetitiva. | “Destaque da vez” com Prestígio real, superfície pêssego, ilustração e texto em duas colunas. Abre a receita existente e desaparece com busca/filtro ativo, evitando contradizer os resultados. Ver `mobile-catalog.png`. |
| I4 — importante / P2 | A receita desktop tinha uma grande faixa vazia à direita e o botão de cozinhar abaixo da imagem, distante do título. | Capa compartilhada com ilustração à esquerda e título, chips, composição e CTA à direita. Botão independente do controle de expansão, com hit-test e Enter verificados. No celular, segue abaixo do conteúdo introdutório. Ver `desktop-recipe.png` e `mobile-recipe.png`. |
| I5 — importante / P2 | Itálico de destaque em coral muito escuro e navegação mobile monocromática reduziam a vivacidade da referência. | Coral `#D14943` apenas em títulos grandes, preservando contraste; seleção mobile usa mostarda com ícone escuro e rótulo legível. Textos pequenos mantêm variantes escuras. Ver comparativo mobile final. |
| I6 — importante / P2, detectada na primeira rodada | A alteração de composição expôs legenda clara sobre área branca no modo escuro; o filtro do ícone invertia também seu realce amarelo. Evidência: `iteration-1/mobile-dark.png`. | Legenda escura independente do tema; ícone ativo não passa por inversão. Área da ilustração com cantos suaves. Evidência: `mobile-dark.png`; cores e filtro verificados no teste de interface. |

## Fidelidade por superfície

| Superfície | Avaliação final |
|---|---|
| Cores | Wine, Coral, Mustard, Blush e Cream do briefing permanecem nos tokens. O destaque pêssego e a mostarda recuperam a personalidade sem usar o rosa do fundo publicitário como fundo geral. Amostras aproximadas dos círculos do JPEG: vinho `#4C2433`, coral `#FA695D`, mostarda `#F0B257`, cream `#FCF1E9`; pequenas diferenças para os tokens escritos são esperadas pela compressão e tratamento da prancha. |
| Tipografia | Fraunces local em títulos e itálicos; DM Sans local na interface. Hierarquia e alternância serifada/sem serifa correspondem à direção. Família exata da prancha não é comprovável; a equivalência é aceita, conforme o briefing original. Títulos reais quebram linhas sem truncamento nos viewports examinados. |
| Proporções e espaçamentos | Mobile prioriza alimento, título e ação; descoberta distingue destaque e grade. Desktop usa largura disponível em duas colunas, sem ampliar uma tela de telefone. Os comparativos finais mostram menos caixas e melhor proximidade entre título e CTA. |
| Cartões | Grade com bordas discretas, alimento inteiro e nome legível. Destaque pêssego diferencia a descoberta. Chips de composição usam blush e informação real. Não se acrescentaram etiquetas fictícias de “Novo” ou avaliações. |
| Navegação | Atalhos existentes de Início, Receitas e Compras preservados. Seleção mobile clara com mostarda e `aria-current`; navegação desktop com estado ativo. Favoritos e menus fictícios não foram acrescentados. |
| Ilustrações | Todas as 14 imagens originais permanecem byte a byte, comprovadas por SHA-256. `object-fit: contain`, sem filtros nos alimentos, sem recortes de pratos, deformações ou substituições. O branco da arte se integra à área branca da interface clara. As sombras são as originais das ilustrações. |
| Conteúdo | Catálogo, fórmulas, nomes, unidades, etapas e regras de compras preservados. A referência de bolo com cerejas não virou uma receita fictícia; as imagens fornecidas continuam associadas ao catálogo aprovado. |

### Contraste e acessibilidade observável

Texto de ações coral usa `#3F1C29`, mais escuro que Wine; texto pequeno coral usa `#A53535`; o novo coral expressivo é restrito aos títulos grandes. Neutro `#775C65` sobre cream tem 5,90:1; dourado escuro sobre blush, 6,16:1. Controles conservam foco visível, nomes acessíveis e áreas de toque existentes. Imagens têm texto alternativo. Movimento reduzido, teclado e retorno de foco dos modais permanecem verificados.

Não se afirma conformidade integral de acessibilidade com base nas imagens. Leitor de tela, zoom do navegador e dispositivos físicos não foram avaliados nesta rodada.

## Diferenças cosméticas e adaptações aceitas

- **C1 / P3:** wordmark textual existente preservado. Não foi redesenhado o logotipo para imitar a combinação dourada da prancha; isso exigiria uma decisão de marca separada.
- **C2 / P3:** fonte equivalente sugerida pelo briefing, sem alegar identificação exata da fonte da imagem. Peso, itálico, hierarquia e contraste foram priorizados.
- **C3 / P3:** ícones Lucide uniformes e alvos de toque maiores que os controles minúsculos da prancha. Legibilidade e funcionamento prevalecem sobre a densidade publicitária.
- Adaptação intencional: abertura e catálogo integram a mesma página, receitas expandem no acervo e desktop usa colunas. São decisões coerentes com a arquitetura existente; não são telas fictícias nem molduras de apresentação.
- Adesivo “Hmm!”, estrelas, inclinações e sombras de celulares não foram reproduzidos. A personalidade vem da comida, tipografia, cores e ritmo editorial.

## Fluxo examinado e saúde final

1. **Início — aprovado:** ilustração protagonista, hierarquia editorial, chamada clara e imagem sem caixa interna excessiva. Captura: [mobile](test-results/redesign/mobile-home.png), [desktop](test-results/redesign/desktop-home.png).
2. **Descoberta — aprovado:** busca, filtros, destaque e grade têm hierarquia distinta; destaque respeita filtros e abre receita real. Captura: [mobile](test-results/redesign/mobile-catalog.png), [tablet](test-results/redesign/tablet-catalog.png).
3. **Receita — aprovado:** alimento completo, título, composição e ação próximos; conteúdo e controles de receita preservados. Captura: [mobile](test-results/redesign/mobile-recipe.png), [desktop](test-results/redesign/desktop-recipe.png).
4. **Compras e tema — aprovado nos cenários testados:** lista, valores e foco dos modais preservados; tema escuro sem alterar a aparência dos alimentos. Capturas: [compras](test-results/redesign/mobile-shopping.png), [escuro](test-results/redesign/mobile-dark.png).

## Histórico de validação

- Rodada inicial: comparação dos artefatos anteriores com o original em arquivos conjuntos. I1–I5 identificadas; resultado ainda bloqueado para QA visual.
- Primeira correção: composição, destaque, superfícies, capa de receita e acentos ajustados. Novas capturas comparadas com a referência (`*-after.png`); I6 detectada no modo escuro.
- Segunda correção: contraste da legenda, realce noturno e escala do alimento no mobile ajustados. Novas capturas no mesmo viewport/estado; comparativos `*-final.png` e detalhes inspecionados. Nenhuma divergência P0/P1/P2 permaneceu aberta.
- `npm run check`: passou. `npm test`: **70/70 passaram**, incluindo os dois testes novos de destaque/filtros e composição/acesso ao modo cozinha. Testes existentes cobrem fórmulas, imagens, compras, preços, escala, foco, persistência e offline.
- 320, 390, 820 e 1440 px: verificações sem overflow horizontal. 390, 820 e 1440 px: capturas finais renderizadas; todas as 14 ilustrações carregadas; fontes locais carregadas. Zero erros de execução/console nos cenários de captura e testes novos.
- Service worker v3.1 para invalidar a apresentação anterior. Chaves de dados e regras de negócio não foram alteradas.
- `git diff --check`: passou. Sem commit, push ou publicação.

## Reprodução e checklist

Requer Node/Chromium para testes e capturas; Pillow para compor evidências. Nenhuma dependência foi adicionada ao aplicativo.

```bash
npm run check
npm test
node scripts/capture-redesign.mjs
python3 scripts/compare-redesign.py final
```

- [x] Original e capturas anteriores abertos.
- [x] Comparativos conjuntos mobile, desktop e detalhes criados e inspecionados.
- [x] Divergências classificadas e importantes corrigidas.
- [x] Novas capturas, teste funcional completo e revisão após correções.
- [x] Report atualizado, inclusive limitações e diferenças aceitas.
- [ ] Publicação — não solicitada; permanece para decisão posterior do usuário.

final result: passed
