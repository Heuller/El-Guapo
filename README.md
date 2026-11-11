# El-Guapo
Livro de receitas digital do El Guapo

## Sobre
El Guapo é um caderno de receitas artesanais focado em panificação e confeitaria, com uma interface editorial pensada para trabalhar na cozinha.

## Identidade visual: Doce Contemporâneo

Interface responsiva em HTML, CSS e JavaScript, com Fraunces e DM Sans locais,
paleta vinho/coral/mostarda e as 14 ilustrações enviadas para o acervo. Busca por
nome ou ingrediente, filtros de doces/salgados e receitas expansíveis preservam
os dados e as funções de preparo e compras.

Tokens de design em `style.css`; imagens e hashes em `content/recipe-images.json`.
Fontes e ícones com suas licenças em `assets/`. Não exige instalar bibliotecas.
Detalhes da implementação em [docs/IMPLEMENTACAO.md](docs/IMPLEMENTACAO.md).

## Novas funcionalidades adicionadas
- Lista de compras persistente, com marcação de itens, quantidade de compra e preço unitário.
- Adição de todos os ingredientes de uma receita e cálculo de subtotais e total em reais.
- Sugestões de substituições de ingredientes chave quando algo está faltando.
- Escalonamento de receitas com controles precisos de ½×, 1×, 1,5×, 2× e 3×.
- Modo Cozinha com passos individuais e temporizadores contextuais.
- Notificações audíveis e temporizadores contextuais em etapas que mencionam tempo.
- PWA habilitado com service worker para suporte offline e instalação.

## Como usar
1. Abra o app localmente ou via GitHub Pages.
2. Use `Adicionar todos à lista de compras` em uma receita para reunir seus ingredientes.
3. Abra `Compras` para acessar a lista única, inclusive com ingredientes de outras receitas.
4. Marque o que já pegou, registre a quantidade de pacotes ou unidades e o preço unitário; os totais são atualizados automaticamente.
5. Use os botões de escala para ajustar as quantidades da receita.
6. Ative `Modo Foco na Cozinha` para ver os passos um a um.
7. Use os temporizadores contextuais para acompanhar os tempos de preparo; o aviso sonoro de conclusão permanece disponível.

## Local development
```bash
cd /workspace/El-Guapo
python3 -m http.server 8000
```
Acesse `http://127.0.0.1:8000` no navegador.

## Deploy
Aplicação estática; a branch `main` está conectada ao Vercel em https://el-guapo.vercel.app/. Publicar exige autorização do usuário e aprovação dos testes de regressão.

## Testes de regressão

Requisitos: Node.js 22.12+ e Chromium instalado. Os testes usam o executor nativo
`node:test`, um servidor HTTP local temporário e um perfil descartável do navegador.
Não precisam instalar pacotes npm nem acessar os dados do navegador pessoal.

```bash
npm run check
npm test
# Caso Chromium esteja em outro caminho:
CHROMIUM_PATH=/caminho/para/chromium npm test
```

Os testes verificam renderização segura da lista/anotações, validação de
quantidades e preços, persistência, foco dos modais, totais de compra
e preservação do conteúdo do catálogo aprovado. Os testes usam as fontes locais da aplicação e bloqueiam as antigas URLs externas.
Não substituem uma revisão com leitor de tela.
`tests/content-baseline.json` registra a referência aprovada ativa, com os hashes das imagens recebidas. Mudanças
intencionais no acervo exigem revisão antes de atualizar essa referência.

## Catálogo estruturado para a reconstrução

`content/recipes.json` contém as 14 receitas do catálogo aprovado. `recipe-domain.js` contém
funções puras de quantidade, escala e comparação de estoque, com testes próprios.
O frontend legado ainda lê o HTML; a integração será feita após revisar as
referências de quantidade das etapas e selecionar a direção visual.

`npm run extract:recipes` extrai novamente o catálogo com Chromium local, preservando
referências já revisadas quando o texto de origem permanece idêntico. Revise o diff
antes de aceitar mudanças no acervo ou no estado de revisão.


## Organização do catálogo (10/11/2026)

- Bolo Prestígio reúne uma receita de Pão de Ló de Chocolate, uma de Brigadeiro El Guapo e uma de Recheio de Coco Cremoso, com ingredientes e preparo separados por componente.
- Pão de Ló de Chocolate permanece individual. O brigadeiro aparece somente como componente do Bolo Prestígio.
- Recheio de Coco deixa de ser individual; Cuca de Chocolate e Crumble de Chocolate saem do catálogo. Cuca tradicional e crumble foram reunidos em Cuca com Crumble.
- Novas fotografias serão fornecidas pelo usuário. Os arquivos atuais permanecem preservados; o Prestígio ainda não recebeu uma foto substituta.

As fórmulas e importações de 11/11/2026 estão registradas em [Revisão de receitas](docs/REVISAO-RECEITAS-2026-11-11.md), incluindo a esponja e as duas opções exclusivas de inclusões do panetone.

A lista soma as necessidades das receitas por ingrediente padronizado e preenche embalagens inteiras sugeridas. Exemplo: 1.185 g de leite condensado → 3 caixas de 395 g. Quantidade e conteúdo da embalagem continuam editáveis; o preço é por embalagem. Itens sem preço são indicados e não entram no total. Veja [Lista de compras](docs/LISTA-COMPRAS.md).

O [catálogo de ingredientes](docs/CATALOGO-INGREDIENTES.md) descreve os nomes padronizados, as referências de embalagem e as conversões aproximadas.

O catálogo inclui Cuca com Crumble como receita única e Bolo Pão de Mel (massa, calda, recheio e cobertura), importado da cópia do site indicada pelo usuário.

A essência caseira integra o preparo do panetone, com uso de 50 g na massa. Essência e brigadeiro não têm mais cartões individuais. O catálogo atual tem 14 receitas, todas com imagens recebidas para a reconstrução visual.
