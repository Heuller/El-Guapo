# Reconstrução — registro de execução

## Lote 1 — segurança, validação e foco (10/11/2026)

Base: c9eb5075759c74fee6d5614623faa1ddc31d1a1f.

- Despensa usa textContent para nome, unidade e nota; anotação salva usa value do textarea.
- Quantidade exige número finito positivo; vazio representa estoque desconhecido. O seletor informa a unidade, sem aceitar sufixos misturados no campo numérico.
- Dados antigos são normalizados em memória; abrir a despensa não sobrescreve o armazenamento original. Migração/backup completos são trabalho do lote de persistência.
- Modal captura o foco antes de deslocá-lo e devolve ao acionador conectado ao DOM.
- Corrigida conversão de litros para mililitros e rótulo da diferença de volume em compras, exercitada por regressão no navegador.
- Service worker passa a v2.1 para renovar os assets corrigidos. A limpeza remove somente versões antigas do próprio app e mantém seus caches auxiliares atuais.
- Testes próprios, sem dependências externas, com Node e Chromium. O registro npm está bloqueado no ambiente; não há dependência do HNC nem necessidade de baixar navegador para esta suíte.

Conteúdo original das receitas, imagens e manifest preservado por baseline de hashes e ids. Capturas da auditoria e plano detalhado estão em /workspace/auditoria-el-guapo nesta sessão. Nenhum deploy ou push foi executado.

Próximas entregas: extração/modelagem do conteúdo e cálculo consistente entre ingredientes e etapas; três direções visuais antes de reconstruir a UI; timers persistentes, migração/backup e validação ampliada. A correção de foco cobre os modais testados, sem afirmar conformidade WCAG integral ou resolver todos os comportamentos de teclado do aplicativo.

Validação: 9 regressões no Chromium e 1 teste da ativação do service worker aprovados. `npm run check` e `git diff --check` passaram. A suíte funcional usa interação DOM e eventos de teclado; testes completos de toque, foco visual e acessibilidade permanecem nas próximas entregas.

## Lote 2 — conteúdo estruturado e domínio (em andamento)

- `content/recipes.json` contém 15 receitas, 142 linhas de ingredientes e 110 etapas, extraídas do HTML preservado. Os ids antigos foram mantidos.
- `recipe-domain.js` separa quantidade numérica, intervalo, aproximação, anotação de origem e quantidade textual. Escalas não alteram a fonte; conversões não presumem densidade entre massa e volume.
- A pizza tem seis referências explícitas de quantidade nas três primeiras etapas: farinha 200+300 g, água 200+125 g e fermento 2+3 g. As somas foram verificadas para as cinco escalas suportadas. Isso verifica coerência aritmética, sem certificar a receita culinariamente.
- As demais referências de etapas permanecem pendentes de revisão. Não há substituição automática de números da prosa: tempo, temperatura e peso por unidade podem ter significado diferente da massa total.
- O novo catálogo/domínio ainda não substitui a renderização atual. A inconsistência do modo cozinha do legado continua pendente até integrar referências revisadas. O lote E2 não está concluído.
- Extração repetível por `npm run extract:recipes`; mantém referências revistas se o texto da etapa não mudou e volta a revisão quando mudou. Nenhuma troca de framework foi feita nesta etapa.
- A reconstrução visual depende da escolha entre as três imagens de direção visual apresentadas no chat. As imagens são conceitos, não screenshots de código implementado.


## Revisão de conteúdo e direção escolhida (10/11/2026)

Direção visual escolhida: terceira imagem exibida, Acervo fotográfico (`/workspace/generated_images/exec-29f94977-26d7-467e-9368-9f2255572591.png`). O usuário informou que enviará novas imagens para todas as receitas. Refinar a direção selecionada com essas imagens antes de construir a nova UI; não presumir correspondência de fotos ainda não recebidas.

Catálogo atual: 13 receitas, 131 linhas de ingredientes, 109 etapas. Bolo Prestígio integra massa de pão de ló de chocolate, brigadeiro e coco. A massa e o brigadeiro individuais são preservados sem alteração de fórmula. Recheio de coco, cuca de chocolate e crumble de chocolate foram retirados como receitas individuais. Crumble básico e cuca tradicional continuam.

A receita composta preserva os 15 passos originais dos componentes e acrescenta uma etapa de montagem, usando a orientação de refrigeração já existente no brigadeiro. Não foi inventada receita de calda ou ganache. Algumas notas originais ainda mencionam calda e montagem em mais discos que o rendimento da massa; sua padronização culinária continua pendente, sem alteração silenciosa da fórmula.

`tests/fixtures/prestigio-components.json` conserva os três componentes antes da combinação para comparação de ingredientes, quantidades e etapas. A referência inicial de hashes/ids foi arquivada em `tests/fixtures/original-content-baseline.json`; a referência ativa foi atualizada somente para a mudança de catálogo solicitada. Imagens e manifest não mudaram. Dados locais/anotações dos ids retirados não foram apagados; o resgate dessas notas para a nova receita pertence à etapa futura de migração.

Validação desta revisão: 24 testes aprovados, incluindo presença/ausência dos itens solicitados, integridade dos componentes, abertura, escala 2× e lista de compras do Prestígio. Service worker v2.2 renova o HTML do catálogo. Sem publicação em produção.

## Revisão de 11/11/2026

Fórmulas de focaccia, cuca, crumble e panetone atualizadas; essência caseira, arroz-doce e canjicada adicionados. Panetone com seletor de inclusões exclusivas. 33 testes aprovados. Ver [registro completo](REVISAO-RECEITAS-2026-11-11.md). Catálogo atual: 16 receitas.

## Lista de mercado no lugar da despensa

Despensa removida da interface e do código ativo. As 16 receitas adicionam todos os ingredientes a uma lista única, com quantidades de compra, preços unitários, checkboxes, subtotais e totais. Nomes repetidos não duplicam os itens; as alternativas do panetone respeitam a seleção. O armazenamento antigo da despensa permanece intocado.

Validação: 39 testes aprovados; sintaxe e diff verificados. Inspeção mobile em 390×844 sem overflow horizontal, com exemplo de 2 × R$ 5,50 = R$ 11,00. Detalhes em [Lista de compras](LISTA-COMPRAS.md). Sem publicação.

## Catálogo e sugestão de embalagens

66 produtos de compra padronizados cobrem 93 nomes de ingredientes das 16 receitas. As fontes por receita/linha são somadas antes do arredondamento por embalagem; a reinserção atualiza a escala. Referências editáveis de compra e conversões aproximadas são inspecionáveis na interface. Quantidade manual e preços são preservados; “Usar sugestão” reaplica a quantidade calculada. Lista anterior é importada sem apagar a chave original.

Validação final: 55 testes aprovados, incluindo exemplos de 1.185 g de leite condensado → 3 caixas de 395 g e 1.100 g de farinha → 2 pacotes de 1 kg, migração, origem das quantidades, troca de embalagem, modo de unidade caseira e campo manual. Sintaxe e diff passaram. Capturas mobile em 390×844 sem overflow horizontal. Ver [catálogo](CATALOGO-INGREDIENTES.md) e [regras de compras](LISTA-COMPRAS.md). Sem publicação.

## Remoção do seletor de medidas caseiras

Removidos de todas as receitas os controles g/caseiro, as conversões de exibição e a leitura da preferência antiga de unidade. As medidas originalmente escritas no conteúdo, incluindo xícaras e colheres, foram preservadas. O escalonador mantém as unidades originais. A lista de compras continua interpretando as medidas originais das receitas para sugerir embalagens. Service worker v2.6 renova o script e os estilos. 56 testes aprovados, incluindo preferência antiga salva, ausência dos controles nas 16 receitas, integridade de todas as medidas originais e escala de receitas em xícaras. Sem publicação.

## Segundo lote de fotos, cuca unificada e pão de mel

Dez originais enviados pelo usuário estão preservados em /workspace/el-guapo-assets/recebidas, com associações e hashes em manifest.json. Segundo lote: cuca, bolo de cenoura, bolo pão de mel, Prestígio e pão de queijo.

Cuca com Crumble mantém o id cuca-massa-base e reúne a massa e os 150 g de farinha + 150 g de açúcar + 75 g de manteiga do crumble, com seus aromáticos. O cartão separado do crumble foi removido. As etapas da farofa aparecem durante o descanso da massa, antes de modelagem/fermentação final/assamento. A nota antiga 2:1:1 foi alinhada à fórmula 2:2:1. A lista de compras substitui contribuições do antigo crumble ao adicionar a cuca unificada, evitando dupla contagem. Anotações antigas não são apagadas.

Pão de mel cadastrado com autorização do usuário. A nova consulta a https://heuller.github.io/el-guapooo/ retornou HTTP 404; utilizou-se a cópia do bundle consultada anteriormente nesta sessão, SHA-256 23195f1d0b071e6f3c604d0baa73295b0433ae70bf4e7d224e5c3ee9b72f52e2. Registro normalizado em tests/fixtures/pao-de-mel-imported.json. Ingredientes e sete etapas preservados; imagem do usuário copiada sem alteração para images/bolo-pao-de-mel.jpg. As outras fotos permanecem reservadas para a integração visual dos lotes.

Catálogo atual: 16 receitas, 184 linhas de ingredientes e 129 etapas. Catálogo de compras: 70 produtos. Service worker v2.7. 59 testes aprovados, incluindo integridade da cuca composta, importação de pão de mel e substituição das contribuições antigas na lista. Sem publicação.

## Componentes incorporados e cobertura de imagens

Essência caseira foi integrada ao panetone: ingredientes do lote e três etapas de preparo preservados, com uso de 50 g na massa. Os 50 g prontos não entram como produto extra nas compras. Brigadeiro foi retirado como receita individual; fórmula e cinco etapas continuam dentro do Prestígio. As contribuições das receitas individuais antigas são substituídas ao adicionar os pratos compostos. Cartões removidos sem apagar anotações antigas.

Catálogo atual: 14 receitas, todas cobertas pelas 14 imagens recebidas em /workspace/el-guapo-assets. A integração visual das fotos continua na próxima etapa. Service worker v2.8. 62 testes aprovados, incluindo preservação dos componentes e exclusão de dupla contagem nas compras. Sintaxe e diff verificados. Sem publicação.

## Doce Contemporâneo — implementação visual (11/11/2026)

O novo briefing e a referência enviada nesta revisão substituem a direção anterior de “Acervo fotográfico”. A aplicação continua em HTML, CSS e JavaScript, sem framework ou dependência npm adicionada. Foram examinados a estrutura, os scripts compartilhados, os controles de receita, o armazenamento e a PWA antes da alteração.

- Entrada editorial com Bolo Prestígio em destaque, chamada para o catálogo e identidade El Guapo preservada em texto.
- Catálogo visual com as 14 ilustrações recebidas, busca sem distinção de acentos, filtros combináveis de doces/salgados, contagem e estado vazio. Não havia favoritos, autenticação nem cadastro de receitas na aplicação; a referência não foi usada para simular esses recursos.
- Receitas abrem no próprio catálogo, conservando os ids e links de categoria. Ingredientes, passos, notas técnicas, escala, alternativas do panetone, anotações, mise en place, modo cozinha, voz e temporizadores foram preservados. O botão do modo cozinha é um controle independente, acessível por teclado.
- Paleta centralizada em `style.css`: Wine, Coral, Mustard, Blush e Cream. Variantes mais escuras para textos coral e dourados; variante mais escura de vinho nas ações coral para contraste. Fraunces e DM Sans locais, com licenças OFL. Ícones Lucide locais com licença ISC.
- As imagens foram copiadas sem edição para `images/recipes/`; `content/recipe-images.json` registra origem e SHA-256. Todas usam `object-fit: contain`, sem filtros nos alimentos.
- Apresentação antiga substituída no CSS; estilos dos componentes funcionais preservados. Navegação inferior no celular; composição de duas colunas na entrada e grade em telas maiores. Preferência por movimento reduzido e modo luz de vela mantidos.
- Service worker v3.0 inclui imagens, fontes e ícones novos. Testado recarregamento offline, sem apagar as chaves de dados locais.

Validação: `npm run check`, `npm test` (68/68) e `git diff --check`. Testes de interface em 320, 390, 820 e 1440 pixels, sem overflow horizontal. Nenhum erro de execução/console nos cenários novos. Capturas reproduzíveis com `node scripts/capture-redesign.mjs`, salvas em `test-results/redesign/`. Registro visual e limitação do comparativo formal em `design-qa.md`. Nenhum commit, push ou publicação nesta revisão.

## Auditoria comparativa com o original — 11/11/2026

O arquivo `701475.jpg` resolveu a indisponibilidade anterior da referência. Comparativos conjuntos de antes e depois foram produzidos em `test-results/redesign/comparisons/` e inspecionados junto dos detalhes. A auditoria ajustou o protagonismo da imagem na abertura mobile, integrou superfícies brancas às ilustrações, recuperou o destaque editorial do catálogo, aproximou o modo cozinha do título no desktop e refinou acentos coral/mostarda. Uma segunda rodada corrigiu a legenda e o estado ativo no tema escuro. Nenhuma fórmula ou imagem original foi alterada.

Evidências e classificação em `design-qa.md`, resultado `passed`, sem pendências críticas/importantes nos estados testados. 70 testes aprovados; sintaxe e diff passaram. Service worker v3.1; dados locais preservados. Nenhuma publicação. Referência preservada em `docs/design-reference/doce-contemporaneo.jpg`. Relatório anterior arquivado em `docs/design-qa-before-reference.md`.

## Hero da marca — ajuste textual

Aplicados os quatro textos fornecidos: eyebrow “Receitas artesanais”, título “El Guapo”, slogan “Feito com o coração, para conquistar o seu.” e apoio “Doces, massas e receitas para tirar do papel e levar ao forno.”. Título com maior escala editorial; slogan serifado em itálico com destaque secundário e quebra equilibrada. Paleta, ilustrações, componentes e estrutura da home preservados. Capturas em `test-results/hero-brand/` (320, 390, 820 e 1440 px), sem overflow ou erros de execução. 70 testes aprovados, sintaxe e diff passaram. Service worker v3.2 renova o CSS; sem publicação.

## Correção de atualização com cache legado

A captura enviada após a publicação era compatível com HTML novo e CSS legado: link de acessibilidade exposto, fundo anterior e ilustração sem limite. Reproduzido em Chromium com um worker antigo mantendo CSS em cache. Os testes anteriores usavam perfis novos e não cobriam essa transição.

Entradas CSS/JS agora usam URLs versionadas (`?v=3.3`), com os mesmos endereços no precache. Assim, o HTML novo recebe os arquivos correspondentes mesmo antes da substituição do worker antigo. O worker v3.3 consulta apenas seus caches, solicita o precache com revalidação e só ativa após concluir todos os downloads. Falha de rede conserva a versão offline anterior. O registro ignora cache HTTP do script do worker. Nenhum armazenamento de receitas, compras, despensa antiga ou anotações é apagado.

Validação: 72 testes aprovados, incluindo troca de CSS legado para o atual em uma única recarga com worker antigo ainda ativo, preservação de dados locais e impedimento de ativação com precache incompleto. Evidências em `test-results/cache-update/legacy-broken.png` e `upgraded-mobile.png`. Sintaxe e diff passaram.

Em próximas versões, atualizar conjuntamente o identificador das URLs CSS/JS no HTML e precache e a versão dos caches. Não reutilizar URLs de arquivos de entrada alterados entre versões da aplicação.
