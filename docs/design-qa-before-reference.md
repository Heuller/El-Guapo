# El Guapo — Doce Contemporâneo

## Referência e evidências

- Fonte visual: imagem “03 — Doce Contemporâneo” embutida na mensagem do usuário (1931 × 1280 px). Não há arquivo raster correspondente nos anexos acessíveis; o arquivo fornecido separadamente contém o briefing textual, preservado em `/workspace/attachments/ddc1f89b-3a25-4af4-b6b1-afcab079480b/Texto colado.txt`.
- A imagem é uma prancha conceitual com três celulares inclinados. Conforme o briefing, não deve ser reproduzida literalmente: molduras, perspectivas e decoração da prancha não fazem parte da aplicação.
- Implementação renderizada em Chromium local. Capturas em `test-results/redesign/`: `desktop-home.png`, `desktop-catalog.png`, `desktop-recipe.png`, `tablet-home.png`, `tablet-catalog.png`, `tablet-recipe.png`, `mobile-home.png`, `mobile-catalog.png`, `mobile-recipe.png`, `mobile-shopping.png` e `mobile-dark.png`.
- Viewports: desktop 1440 × 1000, tablet 820 × 1180, mobile 390 × 844, todos com deviceScaleFactor 1. Teste adicional de overflow e controles em 320 px. Capturas representam CSS pixels a 1:1; não foram normalizadas contra a prancha em perspectiva.
- Estados: início, busca/categorias, receita Prestígio aberta, compras e modo luz de vela. Testados também estado vazio, links diretos, teclado, foco, persistência e offline. Zero erros de execução/console nos cenários novos.

## Superfícies verificadas

- **Tipografia:** Fraunces para títulos e itálicos editoriais; DM Sans para interface, servidas localmente. Títulos dos cartões quebram linhas sem truncamento. O texto das receitas foi preservado. Não se afirma que as fontes sejam idênticas às da prancha: são as famílias expressamente sugeridas no briefing.
- **Ritmo e layout:** entrada em duas colunas no desktop e empilhada no celular; grades de 4, 3 e 2 colunas; receita aberta ocupa a largura da grade. Navegação inferior somente no celular. Sem overflow nas quatro larguras verificadas. A composição desktop é uma adaptação intencional, pois a referência apresenta somente celulares.
- **Cores:** tokens Wine `#4A2532`, Coral `#F36A62`, Mustard `#E9B64E`, Blush `#FFF1EA` e Cream `#FFFDF8`. Textos usam variantes acessíveis: coral escuro `#A53535` sobre blush (6,02:1), neutro `#775C65` sobre cream (5,90:1) e dourado escuro `#795411` sobre blush (6,16:1). Texto de ações coral usa `#3F1C29`, mais escuro que Wine, para superar 4,5:1.
- **Imagens:** 14 originais recebidos, sem edição nem filtros, identidade comprovada por SHA-256 em `content/recipe-images.json`. Alimentos inteiros com `object-fit: contain`, proporção preservada e imagens carregadas. Ícones de navegação Lucide locais, sem emojis para representar alimentos.
- **Conteúdo:** nomes reais do catálogo, incluindo Pão de Ló de Chocolate, preservados. Não se inventou uma receita de bolo de cerejas com base na imagem. Sem favoritos, login ou cadastro fictícios. Fórmulas, etapas, medidas, compras e chaves de armazenamento preservadas.

## Histórico de correções

1. **[P1, corrigido] Ícones quebrados nas capturas locais.** O servidor de testes servia SVG como octet-stream. Corrigidos os tipos MIME de SVG, imagens e fontes em `tests/browser.mjs`. Evidência posterior: todas as imagens/ícones decodificam e as capturas finais exibem os ícones.
2. **[P2, corrigido] Contraste insuficiente nas ações pequenas.** Wine sobre Coral dava 4,40:1. Aplicado `--action-ink: #3F1C29` às ações coral e removida a transparência dos rótulos auxiliares. Capturas finais substituem as anteriores nos mesmos viewports/estados.
3. **[P2, corrigido] Controle do modo cozinha aninhado no cabeçalho acionável.** O botão agora é independente, com nome visível e acionamento por Enter verificado no Chromium.
4. **[P2, corrigido] Navegação desktop mantinha Início ativo no catálogo.** Estado ativo compartilhado com a navegação inferior usa a posição do catálogo e `aria-current`.

## Limitação do comparativo formal

A inspeção das capturas e a aplicação do briefing foram concluídas. Entretanto, a skill [product-design:design-qa](skill://Plugin_fa77aec24fc08191bc6e57f377126d76/design-qa/SKILL.md) exige: “Put the source image and the implementation screenshot together in the same comparison input”. Não foi possível produzir esse artefato conjunto porque a prancha está visível apenas na mensagem, sem arquivo raster acessível. Não se apresenta a inspeção em imagens separadas como uma comparação lado a lado concluída. Falta esse artefato para encerrar formalmente a QA visual; não foi identificada falha funcional pendente nos cenários executados.

## Validação e arquivos

`npm run check`, `npm test` (68 testes) e `git diff --check`. Capturas reproduzíveis com `node scripts/capture-redesign.mjs`. Revisão com leitor de tela e testes em dispositivos físicos não foram executados. Nenhuma publicação.

Arquivos desta revisão: `index.html`, `style.css`, `script.js`, `manifest.json`, `sw.js`, `README.md`, `content/recipes.json`, `content/recipe-images.json`, `images/recipes/*`, `assets/fonts.css`, `assets/fonts/*`, `assets/icons/*`, `scripts/capture-redesign.mjs`, `tests/browser.mjs`, `tests/content-baseline.json`, `tests/cuca-and-honey-cake.test.mjs`, `tests/recipe-revisions.test.mjs`, `tests/service-worker.test.mjs`, `tests/redesign-browser.test.mjs`, `docs/IMPLEMENTACAO.md` e este relatório.

final result: blocked
