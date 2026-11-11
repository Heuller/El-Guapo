# Splash El Guapo — revisão local

## Publicação anterior

A ordenação alfabética foi publicada primeiro, no commit `e022091`, com Vercel confirmado como sucesso e JavaScript v3.10 verificado no domínio público. Hero e destaque continuam apontando para o Bolo Prestígio. A splash foi publicada posteriormente no commit `c819e81`. Esta revisão de duração foi autorizada pelo usuário após medir a versão publicada.

## Inspeção e composição

O HTML publicado não tinha um elemento `#splash` nem estilos ativos para ele; `script.js` ainda continha o ramo legado de 2.800 ms + 730 ms. Esse ramo foi removido. Existe agora uma única splash interna, composta de texto HTML, a foto original `images/recipes/bolo-prestigio.jpg` e CSS local.

Fraunces itálica dá destaque à marca e ao slogan oficial; DM Sans apresenta o estado de carregamento e a assinatura. O coral do slogan claro usa a variante acessível `#A53535`, com vinho `#4A2532` sobre creme `#FFFDF8`. No escuro são usados cacau `#241B20`, creme `#F8EDE5`, coral `#F08A82` e mostarda `#DBB476`. A foto fica numa superfície branca discreta, com `object-fit:contain`, sem filtros, recortes do alimento ou alteração dos pixels originais.

O código original de https://uiverse.io/Pradeepsaranbishnoi/tall-fish-38 foi consultado. Geometria, dedos, defasagens de 0,1s e ciclo de 1,2s preservados; classes isoladas e escala proporcional resultam em aproximadamente 32–36px de largura visual. Atribuição e licença MIT estão em `assets/licenses/uiverse-hand-MIT.txt`.

## Inicialização

- `splash.js` executa no cabeçalho. Se houver preferência de sessão, hash ou um atalho PWA conhecido, a apresentação é pulada.
- Primeira visita da sessão é registrada em `sessionStorage`, na chave nova `eg-splash-seen-v1`. Nenhuma chave de compras, receitas, anotações, tema ou temporizadores é migrada ou apagada.
- O aplicativo inicializa normalmente. Ao terminar catálogo, controles, restauração dos timers e atalhos, emite `eg:ready`.
- A saída depende desse sinal, da decodificação da foto principal e das duas fontes usadas na capa. Não espera outras fotos ou o cache completo do service worker. Após a revisão do usuário, a apresentação tem permanência mínima de 1.700ms desde o primeiro frame após DOMContentLoaded, seguida do fade de 220ms (cerca de 1,9–2s no fluxo normal, respeitando o watchdog). O prazo mínimo não reinicia quando os recursos ficam prontos. Erros, interação e movimento reduzido continuam liberando imediatamente.
- Saída em 220ms; watchdog inicia a saída em 1.780ms, para concluir em aproximadamente 2s mesmo sem prontidão. Falha na foto ou fontes libera imediatamente. Os limites dependem da disponibilidade do event loop do navegador, não são garantia de tempo real durante travamentos do processo.
- Tab, Escape, foco ou toque liberam a interface imediatamente. Não há foco preso, porcentagem inventada ou alteração de scroll/estilos do body. Ao sair, os dedos são pausados e o nó completo é removido; não sobra overlay capturando eventos.
- Sem JavaScript, a splash fica oculta por padrão. Se o script principal falhar, o watchdog da splash ainda pode liberar o conteúdo HTML.

## Animação

Título: 300ms; slogan: 300ms com defasagem de 60ms; bolo: 400ms com 120ms; mensagem e loader: 250ms com 180ms. Entradas usam opacidade e deslocamento de apenas 6px. Não há bounce ou rotação da comida. Ornamentos e mão são decorativos; o texto de estado usa `role=status`.

Com movimento reduzido, entradas e mão ficam estáticas e a remoção ocorre imediatamente após prontidão. A preferência de tema já armazenada é aplicada no cabeçalho antes da primeira apresentação do corpo.

## Evidências e testes

- `npm run check`: sem erro de sintaxe.
- `npm test`: 123 testes passaram, incluindo seis novos testes da splash.
- Verificados: primeira abertura, mesma sessão, nova sessão, links de receitas, atalhos, navegação interna, tema, movimento reduzido, teclado, erro da imagem, promessa de recurso que nunca resolve, rede com latência de 180ms e 2MB/s, timers/anotações/compras e funcionamento offline com service worker.
- Doze capturas: 320×568, 360×640, 390×844, 430×932, 1366×768 e 1440×900, nos dois temas. `test-results/splash/evidence.json` registra limites de título, slogan, imagem, status, loader e assinatura; todos dentro do viewport, sem overflow horizontal ou erros JavaScript.
- Capturas mantêm a promessa de prontidão da foto pendente **apenas no navegador de teste**, decodificam a imagem real e pausam as animações em 700ms para documentar a apresentação breve. Não existe atraso ou modo de demonstração no código de produção. Reprodução: `node scripts/capture-splash.mjs`.
- Capturas principais: `390x844-light.png`, `390x844-dark.png`, `1440x900-light.png`, `1440x900-dark.png`. A menor tela está em `320x568-light.png` e `320x568-dark.png`.

Não foi testado aparelho físico nem a splash nativa gerada pelo sistema operacional para uma PWA instalada. Esta implementação controla somente a apresentação interna do site. Se sessionStorage estiver bloqueado, o site continua utilizável, mas não pode garantir a supressão entre recarregamentos.

## Arquivos alterados

Produção: `index.html`, `script.js`, `sw.js`, novos `splash.js`, `splash.css` e `assets/licenses/uiverse-hand-MIT.txt`. Cache preparado para v3.13, incluindo os recursos novos.

Validação: `package.json`, `tests/content-baseline.json`, `tests/service-worker.test.mjs`, `tests/cache-upgrade-browser.test.mjs`, `tests/dark-theme-browser.test.mjs`, `tests/redesign-browser.test.mjs`, novo `tests/splash-browser.test.mjs` e `scripts/capture-splash.mjs`. Os testes existentes receberam apenas a nova versão dos recursos e o hash do HTML; conteúdo, fórmulas e imagens do catálogo não mudaram.

Documentação: este relatório. A atualização de duração está autorizada para publicação em v3.13.


## Revisão do tempo de apresentação

A medição da versão v3.11 em produção mostrou 0,42–0,50s na abertura comum e cerca de 1,8s em rede lenta. A saída começava antes de a entrada do bolo (520ms) terminar. A pedido do usuário, o fluxo comum agora respeita 900ms de apresentação antes do fade, mantendo o watchdog de aproximadamente 2s, atalhos e links diretos sem splash e ausência de repetição na mesma sessão. Movimento reduzido não recebe essa permanência mínima. Novo teste cobre prontidão tardia sem adicionar outra espera e Escape durante a permanência. A suíte agora reúne 124 testes.


## Extensão para perceber a mãozinha

A pedido do usuário, a permanência antes do fade passou de 900ms para 1.700ms, mantendo o watchdog original de aproximadamente 2s. Isso deixa a animação de 1,2s da mão mais perceptível, sem repetir a apresentação na sessão. O limite de segurança tem precedência em carregamentos demorados. Toque, teclado, foco, erros e movimento reduzido continuam ignorando a permanência mínima. Publicação autorizada como v3.13; a identidade visual e a velocidade da animação não foram alteradas.
