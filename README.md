# El-Guapo
Livro de receitas digital do El Guapo

## Sobre
El Guapo é um caderno de receitas artesanais focado em panificação e confeitaria, com uma interface editorial pensada para trabalhar na cozinha.

## Novas funcionalidades adicionadas
- Despensa local com cadastro rápido de ingredientes disponíveis.
- Lista de compras dinâmica com categorias e checagem automática da despensa.
- Sugestões de substituições de ingredientes chave quando algo está faltando.
- Escalonamento de receitas com controles precisos de ½×, 1×, 1,5×, 2× e 3×.
- Modo Cozinha com leitura de passos por voz e integração segura com temporizadores automáticos.
- Notificações audíveis e temporizadores contextuais em etapas que mencionam tempo.
- PWA habilitado com service worker para suporte offline e instalação.

## Como usar
1. Abra o app localmente ou via GitHub Pages.
2. Use o botão `Despensa` para adicionar ingredientes que você já tem.
3. Em uma receita, clique em `Lista de Compras` para gerar a lista categorizada.
4. Itens faltantes aparecem destacados e podem ser adicionados à despensa.
5. Use os botões de escala para ajustar as quantidades da receita.
6. Ative `Modo Foco na Cozinha` para ver os passos um a um.
7. No modo cozinha, pressione `Voz: ON` para ouvir cada passo e receba alertas quando os temporizadores terminarem.

## Local development
```bash
cd /workspaces/El-Guapo
python3 -m http.server 8000
```
Acesse `http://127.0.0.1:8000` no navegador.

## Deploy
O código foi enviado para o branch `main` do repositório GitHub e pode ser publicado usando GitHub Pages.
