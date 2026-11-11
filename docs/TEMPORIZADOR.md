# Temporizador flutuante — miniplayer

Revisão local, sem publicação. Referência de composição: https://webdevpuneet.com/ui-snippets/now-playing-mini-player/. Implementação própria integrada às funções existentes de timer, sem biblioteca ou segundo relógio.

## Apresentação

Tempo em MM:SS ou HH:MM:SS com números tabulares, identificação de etapa quando disponível, ícone de relógio, botões nativos de pausa/retomada e encerramento (44×44 px) e progress horizontal nativo de 4 px. Tempo e estado são elementos separados; o grupo não é um botão aninhado. A contagem não é anunciada por leitor de tela a cada atualização; mudanças de estado são anunciadas.

Mobile: margens de 16 px, raio de 16 px e altura mínima de 90 px. Identificações maiores quebram linha em vez de serem cortadas. A distância até a barra inferior é calculada a partir da altura real da navegação, incluindo safe area, com folga de 10 px. No modo cozinha, o dock se posiciona acima do rodapé real. Desktop: 360 px no canto inferior direito, com margem de 24 px. Vários timers permanecem acessíveis em uma pilha rolável, limitada a 45% da altura da tela. Espaço inferior de rolagem e scroll-padding permitem alcançar conteúdo e controles sem ficarem permanentemente atrás do dock.

As superfícies usam os tokens dos temas aprovados: creme/vinho no claro e superfície vinho/texto creme no escuro, controles coral e progresso mostarda. Não foram alterados receitas, imagens, compras, tema ou componentes fora da integração necessária do dock.

## Contagem e dados

A versão anterior decrementava um segundo por callback, não persistia os timers e acumulava atraso sob throttling. O mesmo mapa e as mesmas funções de timer agora calculam o restante a partir de um deadline em Date.now(). Intervalos apenas atualizam a apresentação. Ao retornar à aba, o restante e o progresso são reconciliados imediatamente; pausa registra o restante, retomada recalcula o deadline. Não há reset ao navegar dentro da página ou alternar tema.

Persistência adicionada em `eg-timers-v1`, sem alterar as outras chaves. Reload recupera timers ativos/pausados. Entradas inválidas são ignoradas; ids e números são validados e rótulos são inseridos como texto seguro. Aviso sonoro, observador de voz e remoção após 30 segundos da conclusão foram mantidos. Alertas dependem da permissão de áudio e da execução do navegador: se o sistema suspender a página, o prazo é reconciliado e a conclusão sinalizada quando a execução voltar. Não há serviço de notificações do sistema com navegador fechado.

## Validação

Suíte completa: 82 testes aprovados. Testes específicos repetidos após os ajustes finais de rótulos e validação do armazenamento. Sintaxe e diff passaram.

- 9 minutos: 09:00; 60 minutos: 01:00:00; mais de uma hora: 02:01:05.
- Avanço de relógio sem callbacks intermediários: contador e barra recuperam o tempo real.
- Pausa, retomada, troca de tema e reload preservam o restante.
- Últimos 10 segundos, zero, estado concluído, botão de pausa desabilitado e encerramento.
- Tela de 320 px: tempo inteiro e controles de 44 px cabem acima da navegação, nos dois temas.
- Capturas mobile 390×844 e desktop 1440×844, claro e escuro, com as três durações. Zero erros de execução na captura.

Evidências: `test-results/timer-player/`. Reprodução: `node scripts/capture-timer.mjs` (criar a pasta de destino antes). Exemplos: `mobile-light-7265.png`, `mobile-dark-540.png`, `desktop-light-540.png`, `desktop-dark-3600.png`.

Arquivos principais: `script.js`, `timer-player.css`, ícones Lucide locais, links versionados no HTML e precache v3.6. Nada foi publicado.
