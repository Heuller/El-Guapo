# Auditoria do El Guapo em produção — 11/11/2026

URL: https://el-guapo.vercel.app/ — versão publicada `d9a930e`.

**Veredito:** os fluxos centrais funcionam, os dois temas mantêm a identidade editorial e não houve erro JavaScript ou HTTP nas requisições observadas no percurso principal. Entretanto, há uma inconsistência importante de escala e pendências de acessibilidade/UX. Não considero a aplicação integralmente livre de falhas.

## Método e limites

Acesso real ao domínio Vercel em Chromium, por HTTPS, com perfil descartável. Dados de compras e notas usados na auditoria ficaram nesse perfil isolado. Foram registrados 37 checks no percurso principal, além de verificações complementares e axe-core 4.10.3 executado no DOM de produção. Nenhum código do aplicativo ou deploy foi alterado.

Viewports: 320×844, 390×844, 820×1180 e 1440×1000 CSS px, DPR 1, nos temas claro e escuro. Capturas atuais em `test-results/live-audit/`; foram abertas antes de serem usadas como evidência. O domínio acessado pelo navegador e todos os recursos registrados pertencem a `el-guapo.vercel.app`.

Nos 189 eventos de resposta do percurso principal, correspondentes a 46 URLs distintas, não houve status HTTP >=400. Nenhuma exceção de execução ou console.error do aplicativo foi registrada nesse percurso. Todas as 81 imagens/ícones presentes no DOM carregaram. Esses números não constituem uma varredura de todas as URLs possíveis ou prova de ausência de bugs.

O roteiro usa DOM para acionar controles e eventos reais de teclado para os casos de acessibilidade. Animações foram congeladas para capturas estáveis; sua fluidez não foi avaliada. Som audível, voz em aparelho físico, instalação da PWA, notificações com navegador fechado e leitores de tela reais não foram certificados. O teste offline utilizou a emulação de rede do Chromium após instalar o service worker; não reproduz todas as suspensões possíveis do sistema operacional. Não foi executado Lighthouse nem atribuído escore de performance.

## Fluxo examinado

| Etapa | Saúde | Evidência |
|---|---|---|
| 1. Entrada e temas | Boa. Marca, slogan, imagens, controle de tema e navegação renderizam corretamente. | [Mobile claro](../test-results/live-audit/mobile-light-home.png), [desktop escuro](../test-results/live-audit/desktop-dark-home.png). |
| 2. Descoberta | Boa. Busca sem acentos, filtro salgados com quatro receitas, estado vazio e retorno ao catálogo funcionaram. Sem overflow horizontal nos oito pares de tema/largura. | [Catálogo escuro](../test-results/live-audit/mobile-dark-catalog.png), [busca](../test-results/live-audit/search-accent.png), [vazio](../test-results/live-audit/search-empty.png). |
| 3. Receitas e cozinha | Parcial. As 14 receitas abrem com ingredientes, etapas e botão de compras. O passo seguinte funciona, mas a escala não atualiza as quantidades do preparo. | [Escala inconsistente](../test-results/live-audit/scale-inconsistency.png), [cozinha](../test-results/live-audit/kitchen-scaled.png). |
| 4. Compras e notas | Boa com mouse/toque; pendências por teclado. Preço 5,50 × duas unidades gera R$ 11,00, marcação e dados persistem no reload. | [Compras editadas](../test-results/live-audit/shopping-edited.png), [mise en place](../test-results/live-audit/mise-mobile.png). |
| 5. Temporizador e offline | Bons nos cenários testados. Contagem real de dez segundos até zero, pausa, tema, reload e encerramento funcionaram; página offline mantém 14 receitas e estilos. | [Últimos segundos](../test-results/live-audit/timer-last-seconds.png), [conclusão](../test-results/live-audit/timer-done.png), [offline](../test-results/live-audit/offline.png). |

![Escala 2×: ingredientes e preparo divergem](../test-results/live-audit/scale-inconsistency.png)

![Catálogo mobile no tema escuro](../test-results/live-audit/mobile-dark-catalog.png)

## Achados priorizados

### F01 — Alta / P1: escala não acompanha o preparo, notas auxiliares ou rendimento

**Reprodução:** abrir Massa de Pizza, selecionar 2× e iniciar o modo cozinha.

**Observado:** a farinha principal passa de 500 g para 1000 g e a água para 650 g. A etapa do poolish continua pedindo 200 g de farinha, 200 g de água e 2 g de fermento; o modo cozinha repete as quantidades originais. A etapa de refresco ainda menciona 300 g de farinha e 125 g de água. O título do grupo continua “100% = 500g farinha”, o rendimento continua “2 pizzas ~435g” e a equivalência de fermento seco permanece 1,7 g.

**Impacto:** usuário pode separar ingredientes para uma escala e executar o método de outra, com fórmula final incoerente. Esta é a correção de maior prioridade.

**Correção recomendada:** vincular quantidades de etapas, equivalências e rendimento ao modelo de receita e à escala selecionada; o modo cozinha deve ler o mesmo resultado. Não multiplicar indiscriminadamente números de texto: tempos, temperaturas e percentuais precisam continuar corretos. Conferir os demais componentes compostos do catálogo.

**Evidência:** `scale-inconsistency.png`, `kitchen-scaled.png`, campos `scale` e `kitchenText` em `results.json`. Local principal: escalonamento e `startKitchenMode` em `script.js`.

### F02 — Alta / P1: Tab entra em um modal fechado e invisível

**Reprodução:** com modal fechado, focar Compras na navegação inferior e pressionar Tab.

**Observado:** o foco passa para `#modal-close`, embora `#modal-overlay` tenha `aria-hidden="true"` e opacity 0. O axe também sinalizou `aria-hidden-focus` no claro, no escuro e na receita aberta.

**Impacto:** quem navega por teclado perde a indicação visual de foco e pode acionar controles de um diálogo que não está aberto. `pointer-events:none` não impede tabulação.

**Correção recomendada:** tornar o diálogo realmente não interativo quando fechado, com `hidden`/`inert` ou abordagem equivalente, sincronizada com abertura, fechamento e retorno de foco. O retorno de foco após fechar um modal aberto funcionou e deve ser preservado.

**Evidência:** `extra-results.json > tabWhenModalClosed`, `accessibility.json` e `deep-accessibility.json`. Local principal: `.modal-overlay` e funções `openModal`/`closeModal`.

### F03 — Média / P2: anotações e mise en place não funcionam plenamente por teclado

**Observado:** “Anotações Pessoais” recebe foco, mas Enter não expande a área; clique expande e salvar/persistir funciona. No mise en place da pizza, seis itens clicáveis são marcados com o mouse, porém não existem checkboxes nativos ou itens tabuláveis.

**Impacto:** duas funções operacionais ficam indisponíveis para usuários que dependem de teclado e têm semântica insuficiente para tecnologias assistivas.

**Correção recomendada:** cabeçalho de notas como botão nativo, com aria-expanded/aria-controls; itens da mise en place como checkboxes com rótulos. Manter aparência e regras de negócio.

**Evidência:** `results.json > notesKeyboard`, `extra-results.json > mise`, `mise-mobile.png`.

### F04 — Média / P2: atributo ARIA incompatível no interruptor

**Observado:** input nativo com `role="switch"` recebe `aria-pressed`, atributo destinado a botões. O axe sinalizou `aria-allowed-attr` nos dois temas e nos diálogos.

**Impacto:** semântica de acessibilidade inconsistente. A alternância visual e a propriedade checked funcionam; isso não significa que o tema esteja quebrado para todos os usuários.

**Correção recomendada:** remover aria-pressed; manter o estado nativo checked e a semântica correta de switch. Revisar testes que atualmente verificam o atributo inadequado.

**Nota de gravidade:** o axe classifica essa regra como “critical”; essa classificação automática não foi confundida com uma falha crítica de disponibilidade do produto. Aqui a prioridade é P2.

### F05 — Média / P2: atalhos declarados da PWA não cumprem o destino

**Observado:** o manifesto oferece `?mode=kitchen` como “Modo Foco”. A URL carrega a home, com o overlay de cozinha fechado. `?view=index` também inicia no topo da home: scrollY 0, catálogo ainda cerca de 800 px abaixo no viewport testado. Links de receita como `#bolo-prestigio`, por outro lado, abrem a receita corretamente.

**Impacto:** os atalhos prometem acesso direto e exigem navegação manual.

**Correção recomendada:** tratar os parâmetros ou alterar os atalhos para rotas suportadas. Para iniciar cozinha, definir um fluxo claro de escolha de receita, sem selecionar uma arbitrariamente.

**Evidência:** `results.json > shortcut`, `extra-results.json > indexShortcut`, `shortcut-kitchen.png`, `manifest.json`. Não foi necessário instalar a PWA para demonstrar o comportamento dos destinos declarados.

### F06 — Baixa / P3: título do modal compete com o botão de fechar em 320 px

**Observado:** o contorno de foco do botão fechar invade a linha do título de “Lista de Compras” e de “Mise en Place”. O diálogo continua utilizável.

**Correção recomendada:** reservar espaço no cabeçalho para o botão de 44 px e seu anel de foco, sem remover o foco visível.

**Evidência:** `shopping-320.png`, `mise-mobile.png`.

### F07 — Baixa / P3: cabeçalho da grade perde ritmo em 320 px

**Observado:** “Para se aventurar” e a contagem de receitas ficam espremidos lado a lado, com quebras em ambas as colunas. Não há overflow nem perda de função.

**Correção recomendada:** em telas estreitas, colocar a contagem abaixo do título ou ajustar o alinhamento. Não exige redesenhar os cartões ou as ilustrações aprovadas.

**Evidência:** `narrow-dark-catalog.png`, `narrow-light-catalog.png`.

## Verificações positivas adicionais

- Os 14 cards têm ingredientes, passos e botão de compras; nenhuma ilustração foi substituída ou ficou quebrada.
- Busca “PAO DO HEULLER” encontra a receita com acento; a busca sem resultado informa o estado vazio.
- Variante de frutas do panetone adiciona o mix de frutas/cranberry/castanha; a lista observada não contém chocolate nessa seleção. Ingredientes da essência integrada continuam presentes.
- Adicionar outra receita mantém somente uma linha normalizada de Farinha de trigo.
- Quantidade 2, preço 5,50 e marcação de compra sobrevivem ao reload; total e subtotal marcado são R$ 11,00.
- Nota pessoal salva sobrevive ao reload.
- Escape fecha compras e devolve foco ao acionador.
- Timer pausado permanece pausado após tema/reload; ao retomar, alcança 00:00 e “Concluído!”.
- Service worker corrente oferece 52 entradas no precache. Após emulação offline e reload, o site renderiza as 14 receitas com o tema esperado.
- Axe não apontou violação automática de contraste nos estados examinados. Isso não equivale a conformidade WCAG integral.

## UI, UX e frontend

A identidade Doce Contemporâneo/Cacau & Vinho se mantém coerente em produção: títulos editoriais, hierarquia de destaque, cores de ação consistentes e áreas claras que preservam as ilustrações. O novo timer é legível e não usa o círculo apertado anterior. Não recomendo uma nova repaginação geral neste momento; as prioridades são consistência dos dados exibidos e acessibilidade dos controles.

Performance observada não mostrou travamento no ambiente de teste. Não se extrapola essa experiência para redes lentas ou celulares de entrada: faltam medições de campo, Lighthouse com throttling e testes físicos. Voz, áudio, transferência para clipboard e instalação efetiva da PWA ainda precisam de validação específica em dispositivos reais.

## Evidências e próximos passos

Arquivos estruturados: `results.json`, `extra-results.json`, `accessibility.json`, `deep-accessibility.json`, em `test-results/live-audit/`. Os roteiros locais de auditoria também estão nessa pasta ignorada pelo Git. Há uma única falha de sonda no primeiro roteiro complementar (leitura de um elemento durante navegação), corrigida e repetida; ela não foi contabilizada como erro do aplicativo.

Ordem recomendada: **F01 → F02 → F03/F04 → F05 → F06/F07**. Criar regressões dos casos agora descobertos, além de manter os 82 testes já existentes. A aprovação anterior desses testes não abrangia todos os percursos exploratórios realizados nesta revisão.

Nenhuma correção ou publicação foi executada nesta auditoria.
