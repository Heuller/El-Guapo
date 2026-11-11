# Primeira entrega de correções

Implementação local para revisão, sem publicação.

## Temporizadores

- Identidade por receita, etapa e ocorrência de duração. Receitas com rótulos iguais mantêm contagens independentes.
- Iniciar novamente a mesma origem destaca o timer existente; não pausa, retoma ou altera seu prazo implicitamente.
- O cartão e o modo cozinha compartilham a mesma origem.
- Contagem por prazo real, persistência, pausa e avisos preservados. Entradas antigas são mantidas sem inventar sua receita de origem; um novo acionamento pode criar outro timer quando essa origem é desconhecida.

## Durações

Interpretador numérico para horas, minutos, segundos, combinações e intervalos com `a`, `até`, hífen ou travessão. `1h a 1h30` oferece 60, 75 ou 90 minutos, além de valor personalizado dentro da faixa. Etapas com várias menções permitem escolher a duração desejada. A escolha aparece junto da instrução, inclusive no modo cozinha.

## Escala das receitas

As 14 receitas têm referências revisadas em `content/scaling-review.json`, sincronizadas com `recipe-scaling.js`. Os multiplicadores 0,5×, 1×, 1,5×, 2× e 3× atualizam ingredientes, equivalências totais, fases do preparo, rendimentos e referências selecionadas nas notas. O retorno a 1× restaura o texto original.

Tempos, temperaturas, dimensões das formas, densidades, percentuais e pesos por unidade permanecem como referências da receita base. As quantidades exigem recipientes suficientes, mantendo os tamanhos individuais; o aviso da escala explicita essa política e a necessidade de pesar frações de ovos. A essência do panetone escala seus ingredientes, sem presumir rendimento após redução. A lista de compras mantém a identidade normalizada dos ingredientes; o modo cozinha e a mise en place usam as quantidades ajustadas.

## Validação e evidências

- `npm run check`: verificação sintática.
- `npm test`: suíte funcional e de navegador, incluindo independência, persistência antiga, seleção de intervalos, restauração exata da escala, todas as receitas e preservação de tempos e temperaturas.
- `node scripts/capture-first-delivery.mjs`: capturas desktop (1440px) e mobile (320px), nos dois temas; sem overflow horizontal ou erros de navegador. A inspeção das primeiras capturas revelou posicionamento inadequado dos controles na grade das etapas, corrigido antes das capturas finais.
- Evidências: `test-results/first-delivery/`, com opções verificadas em `evidence.json`.

A segunda entrega continua pendente: acessibilidade da mise en place, integração dos atalhos/compartilhamento PWA e sincronização da cor do navegador. A remoção de voz já presente no trabalho local foi preservada. Nenhum commit, push ou deploy foi realizado nesta entrega.
