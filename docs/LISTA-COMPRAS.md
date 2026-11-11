# Lista de compras com quantidades sugeridas

## Somar primeiro, arredondar depois

Cada receita fornece suas quantidades originais e o multiplicador selecionado, independentemente do modo de exibição em gramas ou medidas caseiras. Os nomes são resolvidos no [catálogo de ingredientes](CATALOGO-INGREDIENTES.md). As necessidades do mesmo produto são somadas na unidade base (g, ml ou unidade); a sugestão é o teto de necessidade total / conteúdo da embalagem.

- Prestígio: 395 g de leite condensado no brigadeiro + 395 g no coco. Arroz-doce: 395 g. Soma 1.185 g → 3 caixas de 395 g. O brigadeiro não é mais receita individual.
- Pizza: farinha 500 g. Focaccia: farinha 600 g. Soma 1.100 g → 2 pacotes de 1 kg.
- Leite é comprado por litro (referência 1.000 ml); ovos por unidade. É possível selecionar embalagem de 12 unidades para comprar uma dúzia, alterando o conteúdo por embalagem.
- As fontes de cada produto aparecem em “Embalagem e cálculo”. A mesma receita adicionada novamente substitui sua contribuição pela escala atual. Para mais de uma produção, use a escala da receita. Mudar a opção do panetone e adicioná-lo novamente substitui a contribuição dessa receita, em vez de acumular as duas opções. Itens que já tenham compra manual/preço/marcação não são apagados silenciosamente.

## Edição manual, marcação e preço

A quantidade sugerida é preenchida automaticamente. A quantidade editada pelo usuário é preservada nas próximas adições, junto com preço e marcação; a sugestão atual continua visível e pode ser aplicada com “Usar sugestão”. Alterar só o preço não transforma a quantidade em manual.

O conteúdo de embalagem também pode ser editado. Se a quantidade ainda é automática, a sugestão é recalculada; o preço é limpo para que seja registrado o preço da nova embalagem. Se uma compra automática aumenta após adicionar outra receita, a marcação “já peguei” é retirada, evitando dar como comprado o novo total.

Preço é por embalagem/unidade, em reais. Preços são armazenados em centavos. Subtotal = quantidade comprada × preço unitário; total soma as linhas com preço, e “Já peguei” soma somente as marcadas. Itens sem preço são contados separadamente. Quantidades manuais decimais permanecem disponíveis para compras por peso. Nomes manuais são tratados como texto, sem interpretar HTML.

## Estimativas e casos que exigem conferência

As embalagens cadastradas são padrões editáveis, por exemplo farinha 1 kg, leite condensado 395 g e creme de leite 200 g. Não são uma afirmação de que todos os mercados vendem o mesmo tamanho.

Referências aproximadas declaradas: ovos sem casca 50 g/unidade; gemas 18 g/unidade; leite 1,03 g/ml; óleo vegetal 0,92 g/ml; azeite 0,91 g/ml. Medidas caseiras usam fatores por produto. As linhas identificam estimativa e permitem inspecionar a conversão. Cada gema demanda um ovo, sem descontar claras/gemas de outras preparações. Nos intervalos é usado o limite superior; as frações são preservadas antes do arredondamento para compra.

“A gosto”, pitadas e medidas sem conversão ficam sinalizadas para conferência; uma embalagem inicial é referência, não cálculo exato. Ingredientes com alternativas mantêm a escolha explícita, sem substituir automaticamente mel por açúcar, por exemplo. Cacaus 50%, 70% e 100%, fermento seco e fresco e chocolate com perfis distintos não são confundidos.

O mix de frutas/cranberry/castanha informa 450 g de mistura, sem divisão dos componentes. É sinalizado para conferência, sem inventar proporções. O panetone inclui o preparo completo da essência e usa 50 g dela na massa. Como o rendimento após redução não foi informado, a lista considera os ingredientes de um lote completo de essência, sem tentar reduzi-los proporcionalmente a 50 g. A essência pronta é marcada como componente preparado e não vira uma compra adicional.

## Persistência e migração

A lista nova é salva em `eg-shopping-v2`. Na primeira abertura sem essa lista, a versão anterior `eg-shopping-v1` é importada e seus nomes normalizados. Quantidades antigas são preservadas como manuais, pois a versão anterior não guardava a demanda por receita. Aliases duplicados são reunidos; quantidades manuais somadas. Preços diferentes ficam sem preço e com nota para revisão. Marcações só permanecem se todos os itens reunidos estavam marcados. A versão anterior não é apagada nem sobrescrita.

Dados inválidos são preservados em `eg-shopping-v2-recovery` antes de gravar uma nova lista. Falha de armazenamento mostra aviso e mantém a sessão em memória. Não há sincronização entre dispositivos. A chave antiga da despensa continua intocada e não participa dos cálculos.

## Validação

Testes de cobertura dos nomes do acervo, aliases, massa/volume, gemas/ovos, intervalos, desconhecidos, arredondamento posterior à soma, escala, reinserção de receitas, edição e restauração de sugestões, embalagem/preço, persistência, migração e integridade do armazenamento. Casos principais executados também no Chromium. Capturas mobile em 390×844 sem overflow horizontal.

Service worker v2.8 inclui catálogo e modelo de compras no cache. Não houve publicação em produção. O redesenho visual completo segue separado desta mudança funcional.

Ao adicionar panetone ou Prestígio novamente, a lista também substitui contribuições das antigas receitas individuais de essência ou brigadeiro, evitando dupla contagem. Dados de compra já editados e anotações antigas permanecem preservados.
