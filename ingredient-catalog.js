/* Purchase references are adjustable defaults, not universal market package sizes. */
(function(root){
'use strict';
const entries = [
  {
    "id": "farinha-trigo",
    "name": "Farinha de trigo",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "pacote de 1 kg",
    "aliases": [
      "Farinha W300+ ou Tipo 1 Forte",
      "Farinha de trigo Tipo 1",
      "Farinha de trigo média/forte",
      "Farinha de trigo W300+ ou Tipo 1 Forte"
    ],
    "cup": 120,
    "note": "Mantenha o tipo/força indicado na receita ao escolher a farinha."
  },
  {
    "id": "agua",
    "name": "Água",
    "unit": "ml",
    "packageSize": 1000,
    "packageLabel": "litro",
    "aliases": [
      "Água filtrada",
      "Água quente"
    ],
    "density": 1
  },
  {
    "id": "fermento-fresco",
    "name": "Fermento biológico fresco",
    "unit": "g",
    "packageSize": 15,
    "packageLabel": "tablete de 15 g",
    "aliases": []
  },
  {
    "id": "fermento-seco",
    "name": "Fermento biológico seco",
    "unit": "g",
    "packageSize": 10,
    "packageLabel": "sachê de 10 g",
    "aliases": []
  },
  {
    "id": "fermento-quimico",
    "name": "Fermento químico em pó",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "pote de 100 g",
    "aliases": [
      "Fermento em pó químico",
      "Fermento químico para bolos"
    ],
    "spoon": 12
  },
  {
    "id": "mel-acucar",
    "name": "Mel ou açúcar",
    "unit": "g",
    "packageSize": 250,
    "packageLabel": "embalagem de 250 g",
    "aliases": [],
    "note": "Escolha mel ou açúcar conforme a receita; não são somados aos produtos separados sem definir a opção.",
    "review": true
  },
  {
    "id": "sal",
    "name": "Sal",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "pacote de 1 kg",
    "aliases": [
      "Sal refinado",
      "Sal Refinado"
    ]
  },
  {
    "id": "azeite",
    "name": "Azeite de oliva",
    "unit": "ml",
    "packageSize": 500,
    "packageLabel": "garrafa de 500 ml",
    "aliases": [],
    "density": 0.91
  },
  {
    "id": "leite",
    "name": "Leite integral",
    "unit": "ml",
    "packageSize": 1000,
    "packageLabel": "caixa de 1 L",
    "aliases": [
      "Leite integral gelado",
      "Leite Integral",
      "Leite integral (bem quente)",
      "Leite integral (quente)"
    ],
    "density": 1.03,
    "cup": 240,
    "spoon": 15
  },
  {
    "id": "ovos",
    "name": "Ovos",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "unidade",
    "aliases": [
      "Ovos inteiros",
      "Ovos integrais",
      "Ovos Tipo Grande/Extra",
      "Gemas",
      "Gemas de ovos"
    ],
    "eggWeight": 50,
    "yolkWeight": 18,
    "note": "Para quantidades em massa: referência de 50 g por ovo sem casca e 18 g por gema; tamanho variável. Cada gema demanda um ovo, sem presumir aproveitamento de sobras."
  },
  {
    "id": "acucar",
    "name": "Açúcar",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "pacote de 1 kg",
    "aliases": [
      "Açúcar refinado"
    ],
    "cup": 200
  },
  {
    "id": "manteiga",
    "name": "Manteiga",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "tablete de 200 g",
    "aliases": [
      "Manteiga sem sal",
      "Manteiga sem sal, ponto pomada",
      "Manteiga (com ou sem sal)",
      "Manteiga sem sal (para Beurre Noisette)"
    ],
    "spoon": 14,
    "note": "Confira na receita se a manteiga deve ser sem sal."
  },
  {
    "id": "baunilha",
    "name": "Baunilha",
    "unit": "g",
    "packageSize": 30,
    "packageLabel": "embalagem de referência de 30 g",
    "aliases": [],
    "note": "Tipo de baunilha não especificado nesta linha; confira o produto e a embalagem.",
    "review": true
  },
  {
    "id": "raspas-citricos",
    "name": "Cítricos para raspas",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "fruta",
    "aliases": [
      "Raspas de limão ou laranja",
      "Raspas de cítricos"
    ],
    "note": "Escolha os cítricos da receita. Quantidades a gosto exigem conferência.",
    "review": true
  },
  {
    "id": "especiarias",
    "name": "Especiarias",
    "unit": "g",
    "packageSize": 20,
    "packageLabel": "embalagem de referência de 20 g",
    "aliases": [],
    "note": "Escolha as especiarias e confira a quantidade a gosto.",
    "review": true
  },
  {
    "id": "oleo",
    "name": "Óleo vegetal",
    "unit": "ml",
    "packageSize": 900,
    "packageLabel": "garrafa de 900 ml",
    "aliases": [
      "Óleo de soja",
      "Óleo"
    ],
    "density": 0.92
  },
  {
    "id": "vinagre",
    "name": "Vinagre",
    "unit": "ml",
    "packageSize": 500,
    "packageLabel": "garrafa de 500 ml",
    "aliases": [
      "Vinagre de álcool ou vinho branco"
    ],
    "density": 1
  },
  {
    "id": "essencia-baunilha",
    "name": "Essência de baunilha",
    "unit": "ml",
    "packageSize": 30,
    "packageLabel": "frasco de 30 ml",
    "aliases": [],
    "density": 1,
    "spoon": 15
  },
  {
    "id": "extrato-baunilha",
    "name": "Extrato de baunilha",
    "unit": "ml",
    "packageSize": 30,
    "packageLabel": "frasco de 30 ml",
    "aliases": [
      "Extrato de baunilha de verdade"
    ],
    "density": 1
  },
  {
    "id": "cenoura",
    "name": "Cenoura",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "kg",
    "aliases": [
      "Cenouras picadas"
    ]
  },
  {
    "id": "cacau-50",
    "name": "Cacau em pó 50%",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "pacote de 200 g",
    "aliases": [],
    "cup": 100,
    "note": "Medida em xícara usa referência aproximada de 100 g; confira sua medida e o teor de cacau."
  },
  {
    "id": "cacau-70",
    "name": "Cacau em pó 70%",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "pacote de 200 g",
    "aliases": [],
    "cup": 100,
    "note": "Medida em xícara usa referência aproximada de 100 g; confira sua medida e o teor de cacau."
  },
  {
    "id": "cacau-100",
    "name": "Cacau em pó 100%",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "pacote de 200 g",
    "aliases": [],
    "cup": 100,
    "note": "Medida em xícara usa referência aproximada de 100 g; confira sua medida e o teor de cacau."
  },
  {
    "id": "leite-condensado",
    "name": "Leite condensado",
    "unit": "g",
    "packageSize": 395,
    "packageLabel": "caixa de 395 g",
    "aliases": []
  },
  {
    "id": "creme-leite",
    "name": "Creme de leite",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "caixa de 200 g",
    "aliases": [
      "Creme de leite (caixinha)",
      "Creme de leite (ganache)"
    ]
  },
  {
    "id": "chocolate-meio-amargo",
    "name": "Chocolate meio amargo",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "barra de 100 g",
    "aliases": [
      "Chocolate meio amargo em barra",
      "Chocolate meio amargo (ganache)"
    ]
  },
  {
    "id": "chocolate-70",
    "name": "Chocolate amargo 70%",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "barra de 100 g",
    "aliases": [
      "Chocolate amargo (70%) picado ou em gotas"
    ]
  },
  {
    "id": "chocolate",
    "name": "Chocolate",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "barra de 100 g",
    "aliases": [],
    "note": "Escolha o tipo de chocolate previsto na receita; ajuste para pacotes de gotas se necessário."
  },
  {
    "id": "coco",
    "name": "Coco ralado em flocos",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "pacote de 100 g",
    "aliases": []
  },
  {
    "id": "polvilho-azedo",
    "name": "Polvilho azedo",
    "unit": "g",
    "packageSize": 500,
    "packageLabel": "pacote de 500 g",
    "aliases": [
      "Polvilho Azedo"
    ]
  },
  {
    "id": "polvilho-doce",
    "name": "Polvilho doce",
    "unit": "g",
    "packageSize": 500,
    "packageLabel": "pacote de 500 g",
    "aliases": [
      "Polvilho Doce"
    ]
  },
  {
    "id": "gordura-opcao",
    "name": "Óleo, banha ou manteiga",
    "unit": "ml",
    "packageSize": 100,
    "packageLabel": "porção de referência de 100 ml",
    "aliases": [
      "Gordura (Óleo/Banha/Manteiga)"
    ],
    "note": "A receita permite três gorduras. Escolha o produto e ajuste a embalagem; não presumimos equivalência de densidade.",
    "review": true
  },
  {
    "id": "queijo-meia-cura",
    "name": "Queijo meia cura ou Canastra",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "kg",
    "aliases": [
      "Queijo Meia Cura / Canastra, ralado grosso"
    ]
  },
  {
    "id": "parmesao",
    "name": "Queijo parmesão",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "pacote de 100 g",
    "aliases": [
      "Queijo Parmesão, ralado fino"
    ]
  },
  {
    "id": "laranja",
    "name": "Laranja Bahia",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "unidade",
    "aliases": [
      "Raspas de laranja Bahia",
      "Raspas de laranja bahia"
    ]
  },
  {
    "id": "tangerina",
    "name": "Tangerina",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "unidade",
    "aliases": [
      "Raspas de tangerina"
    ]
  },
  {
    "id": "limao-siciliano",
    "name": "Limão siciliano",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "unidade",
    "aliases": [
      "Raspas de limão siciliano"
    ]
  },
  {
    "id": "limao-taiti",
    "name": "Limão taiti",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "unidade",
    "aliases": [
      "Raspas de limão taiti"
    ]
  },
  {
    "id": "fava-baunilha",
    "name": "Fava de baunilha",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "fava",
    "aliases": []
  },
  {
    "id": "canela-pau",
    "name": "Canela em pau",
    "unit": "un",
    "packageSize": 5,
    "packageLabel": "pacote de referência de 5 paus",
    "aliases": [
      "Pau de canela"
    ],
    "note": "O tamanho e a contagem do pacote variam; ajuste a embalagem."
  },
  {
    "id": "cravo",
    "name": "Cravo-da-índia",
    "unit": "g",
    "packageSize": 10,
    "packageLabel": "sachê de 10 g",
    "aliases": [
      "Cravo-da-índia",
      "Cravos-da-índia"
    ],
    "gramsPerUnit": 0.2,
    "note": "Referência aproximada de 0,2 g por cravo; a embalagem pode variar."
  },
  {
    "id": "cardamomo",
    "name": "Cardamomo",
    "unit": "g",
    "packageSize": 10,
    "packageLabel": "sachê de 10 g",
    "aliases": [],
    "gramsPerUnit": 0.2,
    "note": "Referência aproximada de 0,2 g por baga."
  },
  {
    "id": "mel",
    "name": "Mel",
    "unit": "g",
    "packageSize": 250,
    "packageLabel": "frasco de 250 g",
    "aliases": []
  },
  {
    "id": "destilado",
    "name": "Destilado",
    "unit": "ml",
    "packageSize": 500,
    "packageLabel": "garrafa de referência de 500 ml",
    "aliases": [],
    "note": "Escolha o destilado da essência; não é fundido automaticamente à cachaça de amburana."
  },
  {
    "id": "cumaru",
    "name": "Semente de cumaru",
    "unit": "un",
    "packageSize": 1,
    "packageLabel": "semente",
    "aliases": [
      "Semente de cumaru ralada"
    ]
  },
  {
    "id": "noz-moscada",
    "name": "Noz-moscada",
    "unit": "g",
    "packageSize": 10,
    "packageLabel": "sachê de 10 g",
    "aliases": [
      "Noz-moscada ralada"
    ]
  },
  {
    "id": "arroz",
    "name": "Arroz agulhinha",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "pacote de 1 kg",
    "aliases": [
      "Arroz Agulhinha (não lavar)"
    ]
  },
  {
    "id": "cafe",
    "name": "Café solúvel",
    "unit": "g",
    "packageSize": 50,
    "packageLabel": "frasco de 50 g",
    "aliases": []
  },
  {
    "id": "cachaca",
    "name": "Cachaça de amburana",
    "unit": "ml",
    "packageSize": 500,
    "packageLabel": "garrafa de 500 ml",
    "aliases": [
      "Cachaça envelhecida em Amburana",
      "Cachaça envelhecida em amburana"
    ],
    "density": 0.95
  },
  {
    "id": "canela-po",
    "name": "Canela em pó",
    "unit": "g",
    "packageSize": 20,
    "packageLabel": "sachê de 20 g",
    "aliases": []
  },
  {
    "id": "canjica",
    "name": "Canjica cozida",
    "unit": "g",
    "packageSize": 500,
    "packageLabel": "pacote de 500 g",
    "aliases": [
      "Canjica Vapza (2 pacotes)"
    ],
    "note": "Canjica já cozida; não equivale ao mesmo peso de grão seco."
  },
  {
    "id": "amido",
    "name": "Amido de milho",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "caixa de 200 g",
    "aliases": []
  },
  {
    "id": "leite-ou-agua",
    "name": "Leite ou água",
    "unit": "ml",
    "packageSize": 1000,
    "packageLabel": "litro",
    "aliases": [
      "Leite integral ou água fria"
    ],
    "note": "Escolha o líquido permitido na receita; não foi somado ao leite separado sem definir a opção.",
    "review": true
  },
  {
    "id": "essencia-caseira",
    "name": "Essência caseira de panetone",
    "unit": "g",
    "packageSize": 50,
    "packageLabel": "porção de referência de 50 g",
    "aliases": [
      "Essência natural caseira"
    ],
    "note": "Componente preparado dentro do panetone. A lista compra os ingredientes do lote, sem adicionar uma porção extra de essência pronta.",
    "review": true
  },
  {
    "id": "leite-po",
    "name": "Leite em pó",
    "unit": "g",
    "packageSize": 400,
    "packageLabel": "pacote de 400 g",
    "aliases": []
  },
  {
    "id": "castanhas-opcao",
    "name": "Castanha de caju ou nozes",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "pacote de 100 g",
    "aliases": [
      "Castanhas de caju ou nozes"
    ],
    "note": "Escolha uma das castanhas permitidas.",
    "review": true
  },
  {
    "id": "mix-frutas",
    "name": "Mix de frutas cristalizadas, cranberry e castanha de caju",
    "unit": "g",
    "packageSize": 450,
    "packageLabel": "mistura de referência de 450 g",
    "aliases": [
      "Mistura de frutas cristalizadas, cranberry seco e castanha de caju"
    ],
    "note": "A receita não informa a proporção dos componentes. Confira as compras para preparar a mistura; não foram inventadas quantidades individuais.",
    "review": true
  },
  {
    "id": "banana",
    "name": "Banana",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "kg",
    "aliases": [
      "Bananas maduras prata/nanica",
      "Banana extra cortada ao meio (longitudinal)"
    ],
    "gramsPerUnit": 100,
    "note": "Banana informada em unidade usa referência aproximada de 100 g; calibre conforme o tamanho comprado."
  },
  {
    "id": "acucar-mascavo",
    "name": "Açúcar mascavo",
    "unit": "g",
    "packageSize": 500,
    "packageLabel": "pacote de 500 g",
    "aliases": []
  },
  {
    "id": "melado-ou-mel",
    "name": "Melado ou mel",
    "unit": "g",
    "packageSize": 250,
    "packageLabel": "frasco de 250 g",
    "aliases": [
      "Melado de cana ou mel"
    ],
    "note": "Escolha melado ou mel; não substituímos automaticamente os dois produtos.",
    "review": true
  },
  {
    "id": "iogurte",
    "name": "Iogurte natural integral",
    "unit": "g",
    "packageSize": 170,
    "packageLabel": "pote de 170 g",
    "aliases": []
  },
  {
    "id": "aveia",
    "name": "Aveia em flocos finos",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "pacote de 200 g",
    "aliases": []
  },
  {
    "id": "bicarbonato",
    "name": "Bicarbonato de sódio",
    "unit": "g",
    "packageSize": 50,
    "packageLabel": "sachê de 50 g",
    "aliases": []
  },
  {
    "id": "nozes-opcao",
    "name": "Nozes ou pecãs",
    "unit": "g",
    "packageSize": 100,
    "packageLabel": "pacote de 100 g",
    "aliases": [
      "Nozes ou pecãs tostadas e picadas"
    ],
    "review": true
  },
  {
    "id": "acucar-cristal",
    "name": "Açúcar cristal ou demerara",
    "unit": "g",
    "packageSize": 1000,
    "packageLabel": "pacote de 1 kg",
    "aliases": [],
    "review": true
  },
  {
    "id": "suco-laranja",
    "name": "Suco de laranja",
    "unit": "ml",
    "packageSize": 1000,
    "packageLabel": "litro",
    "aliases": [],
    "density": 1,
    "note": "Suco informado em gramas usa aproximação de 1 g por ml. Não convertemos em número de laranjas sem rendimento informado."
  },
  {
    "id": "cacau-sem-teor",
    "name": "Cacau em pó",
    "unit": "g",
    "packageSize": 200,
    "packageLabel": "pacote de 200 g",
    "aliases": [],
    "review": true,
    "note": "Teor não especificado nesta receita; confira o produto. Não é fundido automaticamente com cacaus de teor definido."
  },
  {
    "id": "cravo-po",
    "name": "Cravo em pó",
    "unit": "g",
    "packageSize": 10,
    "packageLabel": "sachê de 10 g",
    "aliases": [],
    "review": true,
    "note": "A medida em colher de café deve ser conferida; sem conversão em gramas cadastrada."
  },
  {
    "id": "gengibre-noz-moscada",
    "name": "Gengibre em pó ou noz-moscada",
    "unit": "g",
    "packageSize": 20,
    "packageLabel": "sachê de referência de 20 g",
    "aliases": [
      "Gengibre em pó (ou noz moscada)"
    ],
    "review": true,
    "note": "Escolha uma das especiarias. Colher de café sem conversão cadastrada: confira a quantidade."
  },
  {
    "id": "doce-leite",
    "name": "Doce de leite",
    "unit": "g",
    "packageSize": 400,
    "packageLabel": "pote de 400 g",
    "aliases": [
      "Doce de leite firme (recheio)"
    ],
    "note": "Use a consistência firme indicada para o recheio."
  }
];
const normalize = name => String(name).normalize('NFD').replace(/\p{Diacritic}/gu,'').replace(/\s+/g,' ').trim().toLowerCase();
const aliases = new Map();
for (const entry of entries) for (const name of [entry.name,...entry.aliases]) aliases.set(normalize(name),entry);
const resolve = name => aliases.get(normalize(name)) || null;
const api = {entries,normalize,resolve};
if(typeof module!=='undefined'&&module.exports) module.exports=api;else root.ElGuapoIngredients=api;
})(globalThis);
