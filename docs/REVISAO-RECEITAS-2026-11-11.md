# Revisão do acervo — 11/11/2026

Alterações solicitadas pelo usuário nesta conversa. Implementadas localmente, sem push, deploy ou publicação do ambiente.

## Fórmulas atualizadas

- Focaccia: 600 g de farinha e 450 g de leite, método direto. Restante dos ingredientes preservado. Tangzhong removido da fórmula, das etapas, das tags e das notas pertinentes.
- Cuca: 600 g de farinha e 420 g de leite, método direto. Demais ingredientes preservados; removidos o tangzhong e as instruções de separação para essa etapa.
- Crumble: 150 g de farinha, 150 g de açúcar, 75 g de manteiga; raspas de cítricos e especiarias a gosto.
- Panetone: farinha 600 g, água 100 g, suco de laranja 150 g, fermento seco 10 g, essência natural 50 g, gemas 130 g, açúcar 150 g, leite em pó 30 g, sal 8 g, manteiga 150 g. Massa base total: 1.378 g antes das inclusões.

A esponja recebe 100 g de farinha + 100 g de água + os 10 g de fermento. A massa principal recebe a esponja inteira, os 500 g de farinha restantes e os demais ingredientes; não recebe outra porção de água ou fermento. Removidos mel, baunilha e raspas como adições separadas da massa: a nova essência já tem composição própria. Rendimento antigo de duas unidades de 500 g retirado, pois não corresponde ao novo peso total.

Inclusões alternativas confirmadas pelo usuário:

1. Chocolate 400 g + castanhas de caju ou nozes 50 g.
2. Mistura de frutas cristalizadas, cranberry seco e castanha de caju: 450 g no total. Não foi inventada divisão entre esses três ingredientes.

O seletor usa a opção chocolate inicialmente; a outra opção fica disponível, mas não entra simultaneamente na lista de compras ou no mise en place. Ambas somam 450 g; massa crua com uma opção: 1.828 g. A escala multiplica as quantidades das duas opções, mantendo só a escolhida na coleta de ingredientes.

## Essência caseira

Receita cadastrada separadamente. Raspas de 3 laranjas Bahia, 2 tangerinas, 2 limões sicilianos e ¼ de limão taiti; ½ fava de baunilha; 1 pedaço de canela; 3 cravos; 2 bagas de cardamomo; água 250 ml; mel 150 g; destilado 125 ml. O destilado entra antes da redução, conforme confirmação do usuário. Depois de esfriar: ½ semente de cumaru ralada + 1 pitada de noz-moscada ralada. Tempo/volume final de redução não especificados; nenhum rendimento ou prazo de conservação foi inventado. Frações ¼ e ½ passaram a funcionar no escalonador do frontend atual.

## Importação

Fonte: https://heuller.github.io/el-guapooo/ — consultada nesta execução em 11/11/2026.

Receitas importadas: Arroz Doce Toffee Amburana e Canjicada El Guapo. Ingredientes, quantidades, fases, passos, notas e metadados preservados. Imagens públicas copiadas para o diretório local para não depender de hotlink nem criar referência quebrada. O material foi transportado; não houve validação independente das alegações culinárias das notas.

Bundle público consultado: https://heuller.github.io/el-guapooo/assets/index-8k3zGoRo.js

SHA-256 do bundle: `23195f1d0b071e6f3c604d0baa73295b0433ae70bf4e7d224e5c3ee9b72f52e2`.

Os dois registros normalizados da fonte estão em `tests/fixtures/imported-sweets-2026-11-11.json`. O catálogo de 13 receitas anterior a esta revisão está em `tests/fixtures/catalog-before-2026-11-11.json`. A referência de hashes correspondente foi preservada, e a referência ativa registra apenas as mudanças de conteúdo autorizadas e os dois novos arquivos de imagem.

## Verificações

33 testes aprovados: cálculos e validação do catálogo, fidelidade das receitas importadas, preservação das receitas não alteradas pelo usuário, dedução da esponja, opções exclusivas de inclusões, frações da essência, escala e lista de compras no Chromium, além das regressões anteriores de segurança, persistência e foco. `npm run check` e `git diff --check` passaram.

Catálogo atual: 16 receitas, 166 linhas de ingredientes (incluindo ambas as alternativas do panetone) e 122 etapas. Não somar as alternativas para calcular o peso do panetone. A reconstrução visual escolhida e a futura substituição geral das fotos permanecem nas etapas seguintes. Imagens anteriores do aplicativo não foram apagadas.
