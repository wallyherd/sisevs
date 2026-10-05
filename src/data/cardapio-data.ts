export interface OpcaoItem {
  id: number;
  name: string;
  price: number;
}

export interface GrupoOpcoes {
  id: number;
  name: string;
  min: number;
  max: number;
  options: OpcaoItem[];
}

export interface ProdutoItem {
  id: number;
  name: string;
  group_name: string;
  description: string;
  price: number;
  image: string;
  optionGroups: GrupoOpcoes[];
}

export const ESTABELECIMENTO = {
  id: 65076,
  nome: "Espaço Vida Saudável Chácara Cachoeira",
  slogan: "Seu ponto de encontro com o bem-estar e nutrição inteligente",
  descricao: "Shakes proteicos cremosos com 2 chás funcionais, Kits SlimDay Detox, barras proteicas e nutrição Herbalife.",
  endereco: "Rua Jeribá, 325, sala 43 - Chácara Cachoeira, Campo Grande - MS",
  cidade: "Campo Grande - MS",
  telefone: "5567991579701",
  telefoneFormatado: "(67) 99157-9701",
  horarios: "Segunda a Sexta: 07h às 19h05 • Sábado: 08h15 às 12h30",
  logo: "https://static.goomer.app/stores/64935/products/mobile_menu/templates/94005/logo_v1653398689.png",
  corDestaque: "#10b981",
};

export const CATEGORIAS_EVS = [
  { id: "shakes", nome: "Shakes", icone: "CupSoda" },
  { id: "barras", nome: "Barras de Proteina", icone: "Cookie" },
  { id: "slimday", nome: "SLIMDAY - Kit Detox", icone: "Sparkles" },
  { id: "pronta-entrega", nome: "Produtos a Pronta Entrega", icone: "Package" },
];

export const PRODUTOS_EVS: ProdutoItem[] = [
  {
    id: 2487288,
    name: "Shake Tradicional ( + 2 chás)",
    group_name: "Shakes",
    description: "Delicioso Shake Proteico, com apenas 210 kcal, 20g de proteina, alto teor de fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Ideal para substituir uma refeição de maneira super prática e matar aquela vontade de comer doce sem culpa! Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    price: 27,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/2487898/picture/large/260408202442",
    optionGroups: [
      {
        id: 578345,
        name: "Qual o sabor do seu shake?",
        min: 1,
        max: 3,
        options: [
          { id: 2176617, name: "Chocolate", price: 0 },
          { id: 2176621, name: "Doce de Leite", price: 0 },
          { id: 2176622, name: "Cookies'n'cream", price: 0 },
          { id: 2176623, name: "Coco", price: 0 },
          { id: 2176624, name: "Baunilha", price: 0 },
          { id: 2176625, name: "Morango", price: 0 },
          { id: 2176626, name: "Banana Caramelizada", price: 0 },
          { id: 2176627, name: "Café cremoso", price: 0 },
          { id: 6352098, name: "Frapê de Abacaxi", price: 0 },
          { id: 9037942, name: "Torta de Limão", price: 0 }
        ]
      },
      {
        id: 578349,
        name: "Algum adicional?",
        min: 0,
        max: 5,
        options: [
          { id: 2176636, name: "Fibra de Manga", price: 7 },
          { id: 2176637, name: "Fibra de Uva", price: 7 },
          { id: 2176638, name: "Colágeno", price: 9 },
          { id: 2176639, name: "Proteina Crocante (3g)", price: 9 },
          { id: 2361661, name: "Proteina em Pó (5g)", price: 9 }
        ]
      },
      {
        id: 578350,
        name: "Gostaria cobertura?",
        min: 0,
        max: 1,
        options: [
          { id: 2176642, name: "Coco Ralado", price: 0 },
          { id: 2176643, name: "Canela em pó", price: 0 },
          { id: 2176644, name: "Xerem de Amendoim", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8107715,
    name: "Shake com Fibra (+ 2 chás)",
    group_name: "Shakes",
    description: "Delicioso Shake Proteico, com apenas 210 kcal, 20g de proteina, mais 6g fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Ideal para substituir uma refeição de maneira super prática e matar aquela vontade de comer doce sem culpa! Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    price: 34,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8115344/picture/large/260408202451",
    optionGroups: [
      {
        id: 578345,
        name: "Qual o sabor do seu shake?",
        min: 1,
        max: 3,
        options: [
          { id: 2176617, name: "Chocolate", price: 0 },
          { id: 2176621, name: "Doce de Leite", price: 0 },
          { id: 2176622, name: "Cookies'n'cream", price: 0 },
          { id: 2176623, name: "Coco", price: 0 },
          { id: 2176624, name: "Baunilha", price: 0 },
          { id: 2176625, name: "Morango", price: 0 },
          { id: 2176626, name: "Banana Caramelizada", price: 0 },
          { id: 2176627, name: "Café cremoso", price: 0 },
          { id: 6352098, name: "Frapê de Abacaxi", price: 0 },
          { id: 9037942, name: "Torta de Limão", price: 0 }
        ]
      },
      {
        id: 1443011,
        name: "Qual o Sabor da Fibra?",
        min: 1,
        max: 1,
        options: [
          { id: 5840599, name: "Fibra de Manga", price: 0 },
          { id: 5840600, name: "Fibra de Uva", price: 0 }
        ]
      },
      {
        id: 578349,
        name: "Algum adicional?",
        min: 0,
        max: 5,
        options: [
          { id: 2176636, name: "Fibra de Manga", price: 7 },
          { id: 2176637, name: "Fibra de Uva", price: 7 },
          { id: 2176638, name: "Colágeno", price: 9 },
          { id: 2176639, name: "Proteina Crocante (3g)", price: 9 },
          { id: 2361661, name: "Proteina em Pó (5g)", price: 9 }
        ]
      },
      {
        id: 578350,
        name: "Gostaria cobertura?",
        min: 0,
        max: 1,
        options: [
          { id: 2176642, name: "Coco Ralado", price: 0 },
          { id: 2176643, name: "Canela em pó", price: 0 },
          { id: 2176644, name: "Xerem de Amendoim", price: 0 }
        ]
      }
    ]
  },
  {
    id: 2487360,
    name: "Shake Trufado (+ 2 chás)",
    group_name: "Shakes",
    description: "Delicioso Shake Proteico, com apenas 250 kcal, 23g de proteina, alto teor de fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Ideal para substituir uma refeição de maneira super prática e matar aquela vontade de comer doce sem culpa! Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    price: 36,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/2487970/picture/large/260408202459",
    optionGroups: [
      {
        id: 578345,
        name: "Qual o sabor do seu shake?",
        min: 1,
        max: 3,
        options: [
          { id: 2176617, name: "Chocolate", price: 0 },
          { id: 2176621, name: "Doce de Leite", price: 0 },
          { id: 2176622, name: "Cookies'n'cream", price: 0 },
          { id: 2176623, name: "Coco", price: 0 },
          { id: 2176624, name: "Baunilha", price: 0 },
          { id: 2176625, name: "Morango", price: 0 },
          { id: 2176626, name: "Banana Caramelizada", price: 0 },
          { id: 2176627, name: "Café cremoso", price: 0 },
          { id: 6352098, name: "Frapê de Abacaxi", price: 0 },
          { id: 9037942, name: "Torta de Limão", price: 0 }
        ]
      },
      {
        id: 578352,
        name: "Qual o sabor da trufa?",
        min: 1,
        max: 1,
        options: [
          { id: 2176648, name: "Trufa de Beijinho", price: 0 },
          { id: 2176649, name: "Trufa de Churros", price: 0 },
          { id: 2176650, name: "Trufa de Doce de Leite", price: 0 },
          { id: 2176651, name: "Trufa de Chocolate", price: 0 },
          { id: 2176652, name: "Trufa de Ninho", price: 0 },
          { id: 2176654, name: "Trufa de Banana", price: 0 },
          { id: 2176656, name: "Trufa de Café", price: 0 },
          { id: 2176657, name: "Trufa de Morango", price: 0 },
          { id: 9037941, name: "Torta de Limão", price: 0 }
        ]
      },
      {
        id: 578349,
        name: "Algum adicional?",
        min: 0,
        max: 5,
        options: [
          { id: 2176636, name: "Fibra de Manga", price: 7 },
          { id: 2176637, name: "Fibra de Uva", price: 7 },
          { id: 2176638, name: "Colágeno", price: 9 },
          { id: 2176639, name: "Proteina Crocante (3g)", price: 9 },
          { id: 2361661, name: "Proteina em Pó (5g)", price: 9 }
        ]
      },
      {
        id: 578350,
        name: "Gostaria cobertura?",
        min: 0,
        max: 1,
        options: [
          { id: 2176642, name: "Coco Ralado", price: 0 },
          { id: 2176643, name: "Canela em pó", price: 0 },
          { id: 2176644, name: "Xerem de Amendoim", price: 0 }
        ]
      }
    ]
  },
  {
    id: 2487257,
    name: "Shake com Colágeno (+2 chás)",
    group_name: "Shakes",
    description: "Uma dose diária de beleza. Com delicioso sabor de frutas vermelhas o Shake da Beleza é enriquecido com colágeno Verisol e Whey Protein, vitaminas e minerais essenciais aos cabelos, unhas, pele e ainda combate a celulite e flacidez. Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    price: 36,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/2487867/picture/large/260408202615",
    optionGroups: [
      {
        id: 578345,
        name: "Qual o sabor do seu shake?",
        min: 1,
        max: 3,
        options: [
          { id: 2176617, name: "Chocolate", price: 0 },
          { id: 2176621, name: "Doce de Leite", price: 0 },
          { id: 2176622, name: "Cookies'n'cream", price: 0 },
          { id: 2176623, name: "Coco", price: 0 },
          { id: 2176624, name: "Baunilha", price: 0 },
          { id: 2176625, name: "Morango", price: 0 },
          { id: 2176626, name: "Banana Caramelizada", price: 0 },
          { id: 2176627, name: "Café cremoso", price: 0 },
          { id: 6352098, name: "Frapê de Abacaxi", price: 0 },
          { id: 9037942, name: "Torta de Limão", price: 0 }
        ]
      },
      {
        id: 1407040,
        name: "Gostaria de adicionar fibra?",
        min: 0,
        max: 2,
        options: [
          { id: 5696352, name: "Fibra de Manga", price: 7 },
          { id: 5696353, name: "Fibra de Uva", price: 7 }
        ]
      },
      {
        id: 578350,
        name: "Gostaria cobertura?",
        min: 0,
        max: 1,
        options: [
          { id: 2176642, name: "Coco Ralado", price: 0 },
          { id: 2176643, name: "Canela em pó", price: 0 },
          { id: 2176644, name: "Xerem de Amendoim", price: 0 }
        ]
      }
    ]
  },
  {
    id: 2487458,
    name: "Barra de Proteina",
    group_name: "Barras de Proteina",
    description: "Deliciosa barra de proteína, ótima para um lanchinho prático, delicioso e proteico. Com 12g de proteína e 130 kcal.",
    price: 16,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/2488068/picture/large/260408202653",
    optionGroups: [
      {
        id: 578399,
        name: "Escolha o sabor da barra",
        min: 1,
        max: 1,
        options: [
          { id: 2176701, name: "Chocolate com Amendoim", price: 0 },
          { id: 2176702, name: "Frutas Vermelhas com Iogurte", price: 0 },
          { id: 2176703, name: "Citrus Lemon", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8021469,
    name: "Slimday Tradicional",
    group_name: "SLIMDAY - Kit Detox",
    description: "Sua alimentação completa do café da manhã ao jantar – prática, saudável e pronta para consumo!\r\n\r\nComposto por 8 etapas para ajudar na sua rotina de alimentação equilibrada, somando apenas 808 kcal.\r\n✓ SHOT MATINAL: Fibra líquida com Guaraná\r\n✓ CAFÉ DA MANHÃ: Waffle ou Muffin Proteico\r\n✓ POWERDRINK: Colágeno, Whey Protein, Chá Verde e fibras\r\n✓ ALMOÇO: Fibra líquida + Pudim Proteico\r\n✓ TARDE: Chá Verde hidratante\r\n✓ SECA BARRIGA: Proteína, fibras e chá verde\r\n✓ JANTAR: Sopa Lowcarb (Creme Verde ou Frango com legumes)",
    price: 159,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8028983/picture/large/260408202726",
    optionGroups: [
      {
        id: 578410,
        name: "Opção do Café da Manhã",
        min: 1,
        max: 1,
        options: [
          { id: 2176801, name: "Waffle Proteico", price: 0 },
          { id: 2176802, name: "Muffin Proteico", price: 0 }
        ]
      },
      {
        id: 578411,
        name: "Opção do Jantar (Sopa)",
        min: 1,
        max: 1,
        options: [
          { id: 2176811, name: "Creme Verde Lowcarb", price: 0 },
          { id: 2176812, name: "Frango com Legumes", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8021498,
    name: "Slimday Gold",
    group_name: "SLIMDAY - Kit Detox",
    description: "O Kit SlimDay Gold é a versão turbinada do tradicional: inclui 8 itens prontos para consumo + 1 barra de proteína + 1 dose de chá detox + 1 dose de proteína crocante, somando cerca de 950 kcal no total.\r\n\r\nInclui:\r\nShot Matinal, Waffle/Muffin Proteico, Powerdrink, Fibra Líquida, Pudim Proteico, Chá Verde, Mix Proteico e Sopa Low Carb.\r\n\r\n+ EXTRAS GOLD:\r\n• 1 Barra de Proteína\r\n• 1 Dose Chá Detox\r\n• 1 Dose Proteína Crocante",
    price: 179,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8029012/picture/large/260408202736",
    optionGroups: [
      {
        id: 578410,
        name: "Opção do Café da Manhã",
        min: 1,
        max: 1,
        options: [
          { id: 2176801, name: "Waffle Proteico", price: 0 },
          { id: 2176802, name: "Muffin Proteico", price: 0 }
        ]
      },
      {
        id: 578411,
        name: "Opção do Jantar (Sopa)",
        min: 1,
        max: 1,
        options: [
          { id: 2176811, name: "Creme Verde Lowcarb", price: 0 },
          { id: 2176812, name: "Frango com Legumes", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8015949,
    name: "Shake Herbalife Nutrition Sabores - 550g",
    group_name: "Produtos a Pronta Entrega",
    description: "Fórmula 1 é um shake nutricional desenvolvido para programa de gerenciamento de peso e dieta nutritiva saudável. Fornece proteínas de alto valor biológico, fibras e 23 vitaminas e minerais com alto teor nutricional.",
    price: 246,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8023460/picture/large/260408202943",
    optionGroups: [
      {
        id: 578420,
        name: "Escolha o sabor da embalagem de 550g",
        min: 1,
        max: 1,
        options: [
          { id: 2176901, name: "Doce de Leite", price: 0 },
          { id: 2176902, name: "Chocolate Cremoso", price: 0 },
          { id: 2176903, name: "Cookies & Cream", price: 0 },
          { id: 2176904, name: "Morango Cremoso", price: 0 },
          { id: 2176905, name: "Baunilha Cremoso", price: 0 },
          { id: 2176906, name: "Banana Caramelizada", price: 0 },
          { id: 2176907, name: "Coco", price: 0 },
          { id: 2176908, name: "Café Cremoso", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8018579,
    name: 'Chá Herbal Concentrate | "Chá Verde"',
    group_name: "Produtos a Pronta Entrega",
    description: "Chá à base de Chá Verde, Chá Preto, Hibisco, Cardamomo e Malva. Ajuda na sensação de disposição e vitalidade com cafeína natural de efeito termogênico. Alternativa saudável a refrigerantes e sucos industrializados.",
    price: 364,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8026092/picture/large/260408203020",
    optionGroups: [
      {
        id: 578430,
        name: "Tamanho / Sabor",
        min: 1,
        max: 1,
        options: [
          { id: 2176921, name: "Original 102g (rende 204 doses)", price: 0 },
          { id: 2176922, name: "Limão 102g (rende 204 doses)", price: 0 },
          { id: 2176923, name: "Laranja e Especiarias 102g", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8018650,
    name: 'Chá NRG | "Chá Guaraná"',
    group_name: "Produtos a Pronta Entrega",
    description: "Perfeito para quem busca mais disposição e foco mental. Com guaraná natural em pó, auxilia a hidratação e pode ser saboreado quente ou gelado.",
    price: 252,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8026163/picture/large/260408203045",
    optionGroups: [
      {
        id: 578435,
        name: "Formato / Tamanho",
        min: 1,
        max: 1,
        options: [
          { id: 2176931, name: "Pó Solúvel 100g (rende 200 doses)", price: 0 },
          { id: 2176932, name: "Tabletes de Guaraná (60 tabletes)", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8021086,
    name: "Nutrev 672g",
    group_name: "Produtos a Pronta Entrega",
    description: "NutreV é uma bebida vegetal fortificada com vitaminas e minerais. Saudável alternativa ao leite para quem tem intolerância a lactose, com 30% do cálcio diário e baixo teor de gordura.",
    price: 79,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8028601/picture/large/260408203058",
    optionGroups: []
  },
  {
    id: 8139176,
    name: "Proteina em Pó",
    group_name: "Produtos a Pronta Entrega",
    description: "Protein Powder de sabor neutro para adicionar em shakes, sucos ou receitas. Fornece 5g de proteína isolada de soja e soro do leite por porção, com apenas 22 kcal.",
    price: 221,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8146851/picture/large/260408203121",
    optionGroups: []
  },
  {
    id: 8018681,
    name: "Fiber Concentrate | Fibra Líquida",
    group_name: "Produtos a Pronta Entrega",
    description: "Mistura concentrada refrescante de fibra solúvel de milho que auxilia no funcionamento do intestino. Fornece 3g de fibra por porção com apenas 6 a 8 kcal.",
    price: 206,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8026194/picture/large/260408203152",
    optionGroups: [
      {
        id: 578440,
        name: "Escolha o sabor da Fibra Líquida",
        min: 1,
        max: 1,
        options: [
          { id: 2176941, name: "Manga", price: 0 },
          { id: 2176942, name: "Uva", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8020910,
    name: "Barra de Proteina Sabores (Caixa com 7 un)",
    group_name: "Produtos a Pronta Entrega",
    description: "Caixa com 7 barras de 35g cada. 10g de proteína de alto valor biológico e 140 calorias para lanches práticos e saudáveis.",
    price: 110,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8028424/picture/large/260408203210",
    optionGroups: [
      {
        id: 578445,
        name: "Escolha o sabor da caixa",
        min: 1,
        max: 1,
        options: [
          { id: 2176951, name: "Chocolate Peanut (Amendoim)", price: 0 },
          { id: 2176952, name: "Citrus Lemon", price: 0 },
          { id: 2176953, name: "Frutas Vermelhas & Iogurte", price: 0 }
        ]
      }
    ]
  },
  {
    id: 8021567,
    name: "Multivitaminas e Minerais 90 Tabletes",
    group_name: "Produtos a Pronta Entrega",
    description: "Suplemento com 12 vitaminas e 10 minerais que auxiliam no atendimento das necessidades nutricionais diárias e reforço do sistema imunológico.",
    price: 122,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8029081/picture/large/260408203221",
    optionGroups: []
  },
  {
    id: 10362746,
    name: "Shape Control: Morosil™ e Cromo",
    group_name: "Produtos a Pronta Entrega",
    description: "Combina Morosil™ (extrato de laranja moro) e Cromo para otimizar o metabolismo de gorduras e carboidratos, auxiliando na redução de medidas.",
    price: 338,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/10374079/picture/large/260408203236",
    optionGroups: []
  },
  {
    id: 8021370,
    name: "Liftoff Energético Sachês (15 un)",
    group_name: "Produtos a Pronta Entrega",
    description: "Blend efervescente de cafeína e taurina com vitaminas do complexo B, C e Biotina. Zero açúcar e baixa caloria para energia imediata e foco.",
    price: 196,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8028884/picture/large/260408203250",
    optionGroups: []
  },
  {
    id: 8018855,
    name: "Fiber Powder 275g - Fibra em pó",
    group_name: "Produtos a Pronta Entrega",
    description: "Fibra solúvel neutra com 4g de fibra por porção e apenas 5 kcal. Dissolve facilmente sem alterar o sabor de bebidas ou alimentos.",
    price: 243,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8026369/picture/large/260408203303",
    optionGroups: []
  },
  {
    id: 8021642,
    name: "Herbalifeline 90 Cápsulas (Ômega 3)",
    group_name: "Produtos a Pronta Entrega",
    description: "Cápsulas de óleo de peixe de alta pureza com Ômega-3 (EPA e DHA) e Vitamina E. Auxilia na manutenção dos níveis de triglicerídeos.",
    price: 281,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8029156/picture/large/260408203316",
    optionGroups: []
  },
  {
    id: 8021724,
    name: "Xtra-Cal 60 Tabletes (Cálcio + Vitamina D)",
    group_name: "Produtos a Pronta Entrega",
    description: "Fórmula de suporte ósseo com cálcio, vitamina D e magnésio para absorção eficiente pelo corpo humano.",
    price: 109,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8029238/picture/large/260408203327",
    optionGroups: []
  },
  {
    id: 8265659,
    name: "Desodorante Antitranspirante Chá Verde",
    group_name: "Produtos a Pronta Entrega",
    description: "Proteção 24 horas contra odores corporais com frescor e suavidade do extrato de chá verde. Hidratação suave.",
    price: 30,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8273487/picture/large/260408203334",
    optionGroups: []
  },
  {
    id: 8265708,
    name: "Beauty Booster Colágeno Frutas Vermelhas 240g",
    group_name: "Produtos a Pronta Entrega",
    description: "Colágeno Verisol® clinicamente estudado com Whey Protein, vitaminas A, C, D, E e Biotina. Suporte à elasticidade da pele e redução de celulite.",
    price: 301,
    image: "https://www.goomer.app/webmenu/espaco-vida-saudavel-chacara-cachoeira/product/8273536/picture/large/260408203350",
    optionGroups: []
  }
];
