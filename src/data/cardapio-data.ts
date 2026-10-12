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
  nome: "FITLIFE - Espaço Vida Saudável",
  slogan: "Escolhas de hoje, mais saúde para amanhã",
  descricao: "Shakes proteicos cremosos com chás inclusos, sopas funcionais, bebidas energéticas, lanches e pizzas fit, saladas frescas e protocolos de emagrecimento.",
  endereco: "FitLife - Espaço Vida Saudável",
  cidade: "Campo Grande - MS",
  telefone: "5567991579701",
  telefoneFormatado: "(67) 99157-9701",
  instagram: "@fitlife_espaco_vida_saudavel",
  horarios: "Segunda a Sexta: 07h às 19h05 • Sábado: 08h15 às 12h30",
  logo: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80",
  corDestaque: "#10b981",
};

export const CATEGORIAS_EVS = [
  {
    "id": "shakes",
    "nome": "Shakes",
    "icone": "CupSoda"
  },
  {
    "id": "sopas",
    "nome": "Sopas",
    "icone": "UtensilsCrossed"
  },
  {
    "id": "bebidas-geladas",
    "nome": "Bebidas Geladas",
    "icone": "CupSoda"
  },
  {
    "id": "bebidas-funcionais",
    "nome": "Bebidas Funcionais",
    "icone": "Sparkles"
  },
  {
    "id": "vitaminas",
    "nome": "Vitaminas",
    "icone": "CupSoda"
  },
  {
    "id": "lanches-salgados",
    "nome": "Lanches Salgados",
    "icone": "Cookie"
  },
  {
    "id": "crepiocas-tapiocas",
    "nome": "Crepiocas & Tapiocas",
    "icone": "UtensilsCrossed"
  },
  {
    "id": "pizzas-proteicas",
    "nome": "Pizzas Proteicas",
    "icone": "Cookie"
  },
  {
    "id": "saladas",
    "nome": "Saladas",
    "icone": "Sparkles"
  },
  {
    "id": "lanches-doces",
    "nome": "Lanches Doces",
    "icone": "Cookie"
  },
  {
    "id": "capsulas",
    "nome": "Cápsulas Potencializadoras",
    "icone": "Package"
  },
  {
    "id": "pacotes",
    "nome": "Pacotes & Protocolos",
    "icone": "Package"
  }
];

export const PRODUTOS_EVS: ProdutoItem[] = [
  {
    "id": 100000,
    "name": "Shake Tradicional + 2 Chás Incluso",
    "group_name": "Shakes",
    "description": "Refeição nutricional completa: Shake cremoso (apenas 200 kcal, 20g de proteína, 23 vitaminas e minerais, 22g carboidratos). Temos opção zero lactose. Acompanha 2 chás inclusos (01 chá energético NRG + 01 chá diurético Herbal Concentrate).",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 101,
        "name": "Qual o sabor do seu shake?",
        "min": 1,
        "max": 2,
        "options": [
          {
            "id": 1000,
            "name": "Abacaxi",
            "price": 0
          },
          {
            "id": 1001,
            "name": "Banana",
            "price": 0
          },
          {
            "id": 1002,
            "name": "Baunilha",
            "price": 0
          },
          {
            "id": 1003,
            "name": "Café Cremoso",
            "price": 0
          },
          {
            "id": 1004,
            "name": "Chocolate",
            "price": 0
          },
          {
            "id": 1005,
            "name": "Cookies",
            "price": 0
          },
          {
            "id": 1006,
            "name": "Doce de Leite",
            "price": 0
          },
          {
            "id": 1007,
            "name": "Maracujá",
            "price": 0
          },
          {
            "id": 1008,
            "name": "Limão",
            "price": 0
          },
          {
            "id": 1009,
            "name": "Morango",
            "price": 0
          },
          {
            "id": 1010,
            "name": "Paçoca",
            "price": 0
          }
        ]
      },
      {
        "id": 102,
        "name": "Deseja algum adicional funcional?",
        "min": 0,
        "max": 5,
        "options": [
          {
            "id": 2000,
            "name": "Dose de Colágeno",
            "price": 8
          },
          {
            "id": 2001,
            "name": "Amendoim",
            "price": 1
          },
          {
            "id": 2002,
            "name": "Coco Ralado",
            "price": 1
          },
          {
            "id": 2003,
            "name": "Canela em Pó",
            "price": 1
          },
          {
            "id": 2004,
            "name": "Protein Crunch",
            "price": 8
          },
          {
            "id": 2005,
            "name": "Whey Protein",
            "price": 7
          },
          {
            "id": 2006,
            "name": "Dose Extra Fiber Concentrate",
            "price": 7
          },
          {
            "id": 2007,
            "name": "Proteína Extra",
            "price": 7
          },
          {
            "id": 2008,
            "name": "Fibra em Pó",
            "price": 7
          }
        ]
      },
      {
        "id": 103,
        "name": "Deseja cobertura?",
        "min": 0,
        "max": 1,
        "options": [
          {
            "id": 3001,
            "name": "Coco Ralado",
            "price": 0
          },
          {
            "id": 3002,
            "name": "Canela em pó",
            "price": 0
          },
          {
            "id": 3003,
            "name": "Amendoim triturado",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100001,
    "name": "Shake Trufado + 2 Chás Incluso",
    "group_name": "Shakes",
    "description": "Irresistível, cremoso e inesquecível. Borda especial com creme à base de shake + proteína + sabor da sua escolha. 300 kcal | 25g de proteína | 23 vitaminas e minerais | 27,5g de carboidratos. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    "price": 30,
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 101,
        "name": "Qual o sabor do seu shake?",
        "min": 1,
        "max": 2,
        "options": [
          {
            "id": 1000,
            "name": "Abacaxi",
            "price": 0
          },
          {
            "id": 1001,
            "name": "Banana",
            "price": 0
          },
          {
            "id": 1002,
            "name": "Baunilha",
            "price": 0
          },
          {
            "id": 1003,
            "name": "Café Cremoso",
            "price": 0
          },
          {
            "id": 1004,
            "name": "Chocolate",
            "price": 0
          },
          {
            "id": 1005,
            "name": "Cookies",
            "price": 0
          },
          {
            "id": 1006,
            "name": "Doce de Leite",
            "price": 0
          },
          {
            "id": 1007,
            "name": "Maracujá",
            "price": 0
          },
          {
            "id": 1008,
            "name": "Limão",
            "price": 0
          },
          {
            "id": 1009,
            "name": "Morango",
            "price": 0
          },
          {
            "id": 1010,
            "name": "Paçoca",
            "price": 0
          }
        ]
      },
      {
        "id": 102,
        "name": "Deseja algum adicional funcional?",
        "min": 0,
        "max": 5,
        "options": [
          {
            "id": 2000,
            "name": "Dose de Colágeno",
            "price": 8
          },
          {
            "id": 2001,
            "name": "Amendoim",
            "price": 1
          },
          {
            "id": 2002,
            "name": "Coco Ralado",
            "price": 1
          },
          {
            "id": 2003,
            "name": "Canela em Pó",
            "price": 1
          },
          {
            "id": 2004,
            "name": "Protein Crunch",
            "price": 8
          },
          {
            "id": 2005,
            "name": "Whey Protein",
            "price": 7
          },
          {
            "id": 2006,
            "name": "Dose Extra Fiber Concentrate",
            "price": 7
          },
          {
            "id": 2007,
            "name": "Proteína Extra",
            "price": 7
          },
          {
            "id": 2008,
            "name": "Fibra em Pó",
            "price": 7
          }
        ]
      },
      {
        "id": 103,
        "name": "Deseja cobertura?",
        "min": 0,
        "max": 1,
        "options": [
          {
            "id": 3001,
            "name": "Coco Ralado",
            "price": 0
          },
          {
            "id": 3002,
            "name": "Canela em pó",
            "price": 0
          },
          {
            "id": 3003,
            "name": "Amendoim triturado",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100002,
    "name": "Shake Petit Gateau + 2 Chás Incluso",
    "group_name": "Shakes",
    "description": "Deliciosa combinação quente e fria com até 2 sabores. 275 kcal | 28g de proteína | 23 vitaminas e minerais | 24,5g carboidratos. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    "price": 34,
    "image": "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 101,
        "name": "Qual o sabor do seu shake?",
        "min": 1,
        "max": 2,
        "options": [
          {
            "id": 1000,
            "name": "Abacaxi",
            "price": 0
          },
          {
            "id": 1001,
            "name": "Banana",
            "price": 0
          },
          {
            "id": 1002,
            "name": "Baunilha",
            "price": 0
          },
          {
            "id": 1003,
            "name": "Café Cremoso",
            "price": 0
          },
          {
            "id": 1004,
            "name": "Chocolate",
            "price": 0
          },
          {
            "id": 1005,
            "name": "Cookies",
            "price": 0
          },
          {
            "id": 1006,
            "name": "Doce de Leite",
            "price": 0
          },
          {
            "id": 1007,
            "name": "Maracujá",
            "price": 0
          },
          {
            "id": 1008,
            "name": "Limão",
            "price": 0
          },
          {
            "id": 1009,
            "name": "Morango",
            "price": 0
          },
          {
            "id": 1010,
            "name": "Paçoca",
            "price": 0
          }
        ]
      },
      {
        "id": 102,
        "name": "Deseja algum adicional funcional?",
        "min": 0,
        "max": 5,
        "options": [
          {
            "id": 2000,
            "name": "Dose de Colágeno",
            "price": 8
          },
          {
            "id": 2001,
            "name": "Amendoim",
            "price": 1
          },
          {
            "id": 2002,
            "name": "Coco Ralado",
            "price": 1
          },
          {
            "id": 2003,
            "name": "Canela em Pó",
            "price": 1
          },
          {
            "id": 2004,
            "name": "Protein Crunch",
            "price": 8
          },
          {
            "id": 2005,
            "name": "Whey Protein",
            "price": 7
          },
          {
            "id": 2006,
            "name": "Dose Extra Fiber Concentrate",
            "price": 7
          },
          {
            "id": 2007,
            "name": "Proteína Extra",
            "price": 7
          },
          {
            "id": 2008,
            "name": "Fibra em Pó",
            "price": 7
          }
        ]
      },
      {
        "id": 103,
        "name": "Deseja cobertura?",
        "min": 0,
        "max": 1,
        "options": [
          {
            "id": 3001,
            "name": "Coco Ralado",
            "price": 0
          },
          {
            "id": 3002,
            "name": "Canela em pó",
            "price": 0
          },
          {
            "id": 3003,
            "name": "Amendoim triturado",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100003,
    "name": "Shake de Limão + 2 Chás Incluso (Simples)",
    "group_name": "Shakes",
    "description": "Shake refrescante de limão com apenas 200 kcal, 20g de proteína, 23 vitaminas e minerais. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    "price": 32,
    "image": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 102,
        "name": "Deseja algum adicional funcional?",
        "min": 0,
        "max": 5,
        "options": [
          {
            "id": 2000,
            "name": "Dose de Colágeno",
            "price": 8
          },
          {
            "id": 2001,
            "name": "Amendoim",
            "price": 1
          },
          {
            "id": 2002,
            "name": "Coco Ralado",
            "price": 1
          },
          {
            "id": 2003,
            "name": "Canela em Pó",
            "price": 1
          },
          {
            "id": 2004,
            "name": "Protein Crunch",
            "price": 8
          },
          {
            "id": 2005,
            "name": "Whey Protein",
            "price": 7
          },
          {
            "id": 2006,
            "name": "Dose Extra Fiber Concentrate",
            "price": 7
          },
          {
            "id": 2007,
            "name": "Proteína Extra",
            "price": 7
          },
          {
            "id": 2008,
            "name": "Fibra em Pó",
            "price": 7
          }
        ]
      },
      {
        "id": 103,
        "name": "Deseja cobertura?",
        "min": 0,
        "max": 1,
        "options": [
          {
            "id": 3001,
            "name": "Coco Ralado",
            "price": 0
          },
          {
            "id": 3002,
            "name": "Canela em pó",
            "price": 0
          },
          {
            "id": 3003,
            "name": "Amendoim triturado",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100004,
    "name": "Shake de Limão + 2 Chás Incluso (Trufado)",
    "group_name": "Shakes",
    "description": "Shake refrescante de limão na versão trufada com borda especial de creme proteico. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    "price": 35,
    "image": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 102,
        "name": "Deseja algum adicional funcional?",
        "min": 0,
        "max": 5,
        "options": [
          {
            "id": 2000,
            "name": "Dose de Colágeno",
            "price": 8
          },
          {
            "id": 2001,
            "name": "Amendoim",
            "price": 1
          },
          {
            "id": 2002,
            "name": "Coco Ralado",
            "price": 1
          },
          {
            "id": 2003,
            "name": "Canela em Pó",
            "price": 1
          },
          {
            "id": 2004,
            "name": "Protein Crunch",
            "price": 8
          },
          {
            "id": 2005,
            "name": "Whey Protein",
            "price": 7
          },
          {
            "id": 2006,
            "name": "Dose Extra Fiber Concentrate",
            "price": 7
          },
          {
            "id": 2007,
            "name": "Proteína Extra",
            "price": 7
          },
          {
            "id": 2008,
            "name": "Fibra em Pó",
            "price": 7
          }
        ]
      },
      {
        "id": 103,
        "name": "Deseja cobertura?",
        "min": 0,
        "max": 1,
        "options": [
          {
            "id": 3001,
            "name": "Coco Ralado",
            "price": 0
          },
          {
            "id": 3002,
            "name": "Canela em pó",
            "price": 0
          },
          {
            "id": 3003,
            "name": "Amendoim triturado",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100005,
    "name": "Sopa Frango com Legumes + 2 Chás Incluso",
    "group_name": "Sopas",
    "description": "Refeição salgada quentinha e nutritiva. 91 kcal | 5g de proteína | 13 vitaminas e minerais | 16g de Carboidratos. Acompanha 2 chás inclusos.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100006,
    "name": "Nutri Soup Legumes e Verduras + 2 Chás Incluso",
    "group_name": "Sopas",
    "description": "Nutri Soup cremosa e revigorante. 60,67 kcal | 6g de proteína | 23 vitaminas e minerais | 6,67g de Carboidratos. Acompanha 2 chás inclusos.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100007,
    "name": "Sopa Proteica (Ovos / Frango Desfiado)",
    "group_name": "Sopas",
    "description": "Sopa quente proteica reforçada com ovos frescos ou frango desfiado.",
    "price": 30,
    "image": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100008,
    "name": "Água sem Gás",
    "group_name": "Bebidas Geladas",
    "description": "Água mineral natural sem gás 500ml bem gelada.",
    "price": 5,
    "image": "https://images.unsplash.com/photo-1559839914-ba2ae647c003?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100009,
    "name": "Água com Gás",
    "group_name": "Bebidas Geladas",
    "description": "Água mineral natural gaseificada 500ml bem gelada.",
    "price": 6,
    "image": "https://images.unsplash.com/photo-1559839914-ba2ae647c003?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100010,
    "name": "Coca Zero",
    "group_name": "Bebidas Geladas",
    "description": "Refrigerante Coca-Cola Sem Açúcar lata 350ml gelada.",
    "price": 6,
    "image": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100011,
    "name": "Sprite Zero",
    "group_name": "Bebidas Geladas",
    "description": "Refrigerante Sprite Sem Açúcar lata 350ml gelada.",
    "price": 6,
    "image": "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100012,
    "name": "Guaraná Zero",
    "group_name": "Bebidas Geladas",
    "description": "Refrigerante Guaraná Antarctica Zero Açúcar lata 350ml gelada.",
    "price": 5,
    "image": "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100013,
    "name": "Suco Detox (Abacaxi, Gengibre, Maçã e Couve)",
    "group_name": "Bebidas Geladas",
    "description": "Suco detox natural: abacaxi, gengibre, maçã e couve. Revigorante, diurético e antioxidante.",
    "price": 20,
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100014,
    "name": "Suco da Beleza",
    "group_name": "Bebidas Geladas",
    "description": "Suco especial com colágeno Verisol e antioxidantes para a pele, cabelos e unhas.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100015,
    "name": "Hyper Drink Pré-Treino",
    "group_name": "Bebidas Geladas",
    "description": "Fórmula de pré-treino para aceleração do metabolismo, energia explosiva, concentração, imunidade e saciedade.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100016,
    "name": "Chá NRG (Guaraná / Natural)",
    "group_name": "Bebidas Funcionais",
    "description": "Chá energizante à base de guaraná natural em pó. Apenas 0,8g de carboidratos. Sabores: Natural ou Guaraná.",
    "price": 14,
    "image": "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100017,
    "name": "Chá Verde Herbal Concentrate",
    "group_name": "Bebidas Funcionais",
    "description": "Chá termogênico acelerador de metabolismo com ação antioxidante. Apenas 1,2g de carboidratos. Sabores: Natural, Laranja com Especiarias, Canela.",
    "price": 14,
    "image": "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100018,
    "name": "Liftoff",
    "group_name": "Bebidas Funcionais",
    "description": "Bebida energética efervescente com cafeína natural, taurina e complexo de vitaminas B e C. 15 kcal | 4g carboidratos.",
    "price": 14,
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100019,
    "name": "Shot Matinal Detox",
    "group_name": "Bebidas Funcionais",
    "description": "Fibras concentradas + bebida energética natural do guaraná. 5,35 kcal | 2,13g carboidrato | 2g fibras.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100020,
    "name": "Shot Matinal Fortalecimento Imunológico",
    "group_name": "Bebidas Funcionais",
    "description": "NRG + fiber concentrate + chá verde + 5000mg de glutamina pura. 30,34 kcal | 3,33g carboidratos | 2g fibras.",
    "price": 18,
    "image": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100021,
    "name": "Seca Barriga",
    "group_name": "Bebidas Funcionais",
    "description": "Combinação potente de Fiber Concentrate + Nutrev + Chá Verde termogênico. 144,74 kcal | 11,16g proteína | 20,53g carboidratos | 2g fibras.",
    "price": 20,
    "image": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100022,
    "name": "Bebida da Beleza Funcional",
    "group_name": "Bebidas Funcionais",
    "description": "Colágeno hidrolisado com whey + chá verde + fiber concentrate + NRG. 31,84 kcal | 4,2g proteína | 3,68g carboidratos | 2g fibras.",
    "price": 19,
    "image": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100023,
    "name": "Sunset Drink",
    "group_name": "Bebidas Funcionais",
    "description": "2x Fiber Concentrate + Chá Verde. 15,68 kcal | 3,86g carboidratos | 4g fibras. Efeito desinchaço e regulador intestinal.",
    "price": 22,
    "image": "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100024,
    "name": "Dose de CR7 Drive",
    "group_name": "Bebidas Funcionais",
    "description": "Bebida hidroeletrolítica desenvolvida para hidratar e repor sais minerais rapidamente. 50 kcal | 13g carboidrato.",
    "price": 8.5,
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100025,
    "name": "Power Drink (Levanta Defunto)",
    "group_name": "Bebidas Funcionais",
    "description": "CR7 Drive + Chá Verde + NRG + Fiber Concentrate. Dose máxima de vitalidade e foco. 60,34 kcal | 26,33g carboidratos | 2g fibras.",
    "price": 27,
    "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100026,
    "name": "Fiber Concentrate (Dose Pronta)",
    "group_name": "Bebidas Funcionais",
    "description": "Dose de fibra líquida solúvel. Sabores: Uva, Manga, Limão com mel. 5,34 kcal | 1,33g carboidratos | 2g fibras.",
    "price": 7,
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100027,
    "name": "Whey Protein (Dose Pronta)",
    "group_name": "Bebidas Funcionais",
    "description": "Whey Protein 3W (Isolado, Concentrado e Hidrolisado). 128 kcal | 25g de proteína | 3,3g carboidratos.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100028,
    "name": "Suco Verde Funcional",
    "group_name": "Bebidas Funcionais",
    "description": "Maçã, couve, cenoura, gengibre e chá verde. 44 kcal | 1,4g proteína | 1,6g fibras.",
    "price": 20,
    "image": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100029,
    "name": "Suco Detox Funcional",
    "group_name": "Bebidas Funcionais",
    "description": "Suco funcional diurético de baixas calorias. Sabores: Uva, Manga ou Limão com Mel. 5,34 kcal | 2g fibras.",
    "price": 10,
    "image": "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100030,
    "name": "Turbo Beach",
    "group_name": "Bebidas Funcionais",
    "description": "Liftoff + CR7 Drive. Hidroeletrolítico e energia imediata desenvolvido para atletas de beach tennis e treino intenso. 65 kcal | 17g carboidratos.",
    "price": 20,
    "image": "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100031,
    "name": "Hype Drink",
    "group_name": "Bebidas Funcionais",
    "description": "Liftoff + CR7 Drive formulado para redefinir clareza mental, foco, concentração e queima calórica. 117 kcal | 139mg cafeína | 138mg taurina.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100032,
    "name": "Vitamina de Banana com Maçã",
    "group_name": "Vitaminas",
    "description": "Vitamina nutritiva batida na hora com banana fresca, maçã selecionada e base cremosa saudável.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100033,
    "name": "Vitamina de Banana, Maçã e Mamão",
    "group_name": "Vitaminas",
    "description": "Vitamina cremosa e balanceada com mix de banana, maçã e mamão rico em fibras e vitaminas essenciais.",
    "price": 16.9,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100034,
    "name": "Pães de Queijo Proteico (4 und)",
    "group_name": "Lanches Salgados",
    "description": "Porção com 4 unidades quentinhas e crocantes. 382,4 kcal | 24,16g de proteína | 10,6g carboidratos.",
    "price": 16,
    "image": "https://images.unsplash.com/photo-1598142981358-164421b212f4?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100035,
    "name": "Pães de Queijo c/ Goiabada Proteico (4 und)",
    "group_name": "Lanches Salgados",
    "description": "Porção com 4 unidades crocantes com recheio de goiabada. 382,4 kcal | 24,16g de proteína | 10,6g carboidratos.",
    "price": 16,
    "image": "https://images.unsplash.com/photo-1598142981358-164421b212f4?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100036,
    "name": "Kibe Proteico",
    "group_name": "Lanches Salgados",
    "description": "Kibe assado artesanal saudável e protéico. 176,35 kcal | 16g de proteína | 19,2g carboidratos.",
    "price": 12,
    "image": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100037,
    "name": "Empadinha de Frango Proteica (4 und)",
    "group_name": "Lanches Salgados",
    "description": "Porção com 4 empadinhas com massa protéica fina e frango desfiado suculento. 320,27 kcal | 33,74g proteína | 18,67g carboidratos.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100038,
    "name": "Coxinha de Batata Doce Proteica",
    "group_name": "Lanches Salgados",
    "description": "Coxinha assada sem glúten feita com batata doce e frango desfiado. 111,29 kcal | 12,73g proteína | 10,78g carboidratos.",
    "price": 12,
    "image": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100039,
    "name": "Misto Quente",
    "group_name": "Lanches Salgados",
    "description": "Misto quente tostado no pão artesanal com queijo derretido e presunto.",
    "price": 13.9,
    "image": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100040,
    "name": "Pão com Ovo e Queijo",
    "group_name": "Lanches Salgados",
    "description": "Pão quentinho prensado com ovos frescos feitos na hora e queijo derretido.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100041,
    "name": "Ovos Mexidos com Torrada e Frutas",
    "group_name": "Lanches Salgados",
    "description": "Café da manhã ou lanche reforçado: ovos mexidos cremosos acompanhados de torradas integrais e porção de frutas frescas.",
    "price": 20,
    "image": "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100042,
    "name": "Crepioca de Frango com Catupiry",
    "group_name": "Crepiocas & Tapiocas",
    "description": "Crepioca proteica fininha recheada com frango desfiado temperado e Catupiry cremoso.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100043,
    "name": "Crepioca de Presunto e Queijo",
    "group_name": "Crepiocas & Tapiocas",
    "description": "Crepioca proteica quentinha com fatias de presunto magro e bastante queijo derretido.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100044,
    "name": "Tapioca Tradicional (Mussarela, Tomate e Orégano)",
    "group_name": "Crepiocas & Tapiocas",
    "description": "Tapioca crocante recheada com mussarela derretida, tomates frescos e toque aromático de orégano.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100045,
    "name": "Tapioca de Frango com Catupiry",
    "group_name": "Crepiocas & Tapiocas",
    "description": "Tapioca tradicional recheada com frango desfiado bem temperado e Catupiry.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100046,
    "name": "Tapioca de Doce de Leite",
    "group_name": "Crepiocas & Tapiocas",
    "description": "Tapioca doce especial generosamente recheada com doce de leite cremoso.",
    "price": 25,
    "image": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100047,
    "name": "Pizza Proteica de Frango",
    "group_name": "Pizzas Proteicas",
    "description": "Massa proteica assada com frango desfiado suculento, queijo e cebola roxa. 329,03 kcal | 28,47g proteína | 18,6g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100048,
    "name": "Pizza Proteica Marguerita",
    "group_name": "Pizzas Proteicas",
    "description": "Massa protéica leve com queijo derretido, fatias de tomate fresco e manjericão. 312,4 kcal | 25,26g proteína | 18,6g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100049,
    "name": "Pizza Proteica de Chocolate",
    "group_name": "Pizzas Proteicas",
    "description": "Massa proteica coberta com delicioso creme de chocolate saudável. 380,4 kcal | 25,76g proteína | 25,6g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100050,
    "name": "Pizza Proteica Prestígio",
    "group_name": "Pizzas Proteicas",
    "description": "Combinação irresistível de chocolate proteico com coco ralado fresco. 409,90 kcal | 26,06g proteína | 27,4g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100051,
    "name": "Pizza Proteica Romeu e Julieta",
    "group_name": "Pizzas Proteicas",
    "description": "O casamento perfeito de queijo derretido com goiabada em versão saudável. 412 kcal | 25,46g proteína | 44,24g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100052,
    "name": "Pizza Proteica Sensação",
    "group_name": "Pizzas Proteicas",
    "description": "Creme de chocolate protéico com morangos frescos fatiados por cima. 384,1 kcal | 25,87g proteína | 26,42g carboidratos.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100053,
    "name": "Salada da Casa Tradicional",
    "group_name": "Saladas",
    "description": "Leve, completa e nutritiva. Mix fresco de folhas verdes, legumes selecionados, 1 proteína (frango desfiado/tiras) e molho da casa light.",
    "price": 30,
    "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100054,
    "name": "Salada Mista",
    "group_name": "Saladas",
    "description": "Refeição completa e revigorante. Mix de folhas nobres e legumes, acompanhada de 2 tipos de proteínas e molho da casa light.",
    "price": 35,
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100055,
    "name": "Bolinho de Shake (4 und)",
    "group_name": "Lanches Doces",
    "description": "Porção com 4 unidades de muffins protéicos feitos à base de shake. 312,30 kcal | 27,56g proteína | 26,6g carboidrato.",
    "price": 18,
    "image": "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100056,
    "name": "Pão de Mel Proteico",
    "group_name": "Lanches Doces",
    "description": "Delicioso pão de mel fit com 140 kcal | 7,14g proteína | 2,85g carboidratos. Opções de recheio: Doce de Leite, Morango, Chocolate, Paçoca, Coco, Baunilha, etc.",
    "price": 6,
    "image": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 201,
        "name": "Escolha o recheio do seu Pão de Mel",
        "min": 1,
        "max": 1,
        "options": [
          {
            "id": 4000,
            "name": "Doce de Leite",
            "price": 0
          },
          {
            "id": 4001,
            "name": "Morango",
            "price": 0
          },
          {
            "id": 4002,
            "name": "Paçoca",
            "price": 0
          },
          {
            "id": 4003,
            "name": "Coco",
            "price": 0
          },
          {
            "id": 4004,
            "name": "Cookies",
            "price": 0
          },
          {
            "id": 4005,
            "name": "Café Cremoso",
            "price": 0
          },
          {
            "id": 4006,
            "name": "Maracujá",
            "price": 0
          },
          {
            "id": 4007,
            "name": "Chocolate",
            "price": 0
          },
          {
            "id": 4008,
            "name": "Baunilha",
            "price": 0
          },
          {
            "id": 4009,
            "name": "Abacaxi",
            "price": 0
          },
          {
            "id": 4010,
            "name": "Banana",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100057,
    "name": "Brigadeiro Proteico (1 unid)",
    "group_name": "Lanches Doces",
    "description": "Brigadeiro proteico gourmet feito com cacau nobre e proteínas. 55,87 kcal | 5,19g proteína | 6,3g carboidrato.",
    "price": 6,
    "image": "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100058,
    "name": "Donuts Proteico (1 unid)",
    "group_name": "Lanches Doces",
    "description": "Donut assado saudável com cobertura fit proteica. 86 kcal | 4g proteína | 9g carboidrato | 4g gorduras.",
    "price": 8,
    "image": "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100059,
    "name": "Waffle Proteico",
    "group_name": "Lanches Doces",
    "description": "Waffle quentinho crocante por fora e macio por dentro feito com massa protéica rica em nutrientes. 216,4 kcal | 18,16g proteína | 18g carboidrato.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100060,
    "name": "Barra de Proteína",
    "group_name": "Lanches Doces",
    "description": "Barra proteica com 12g de proteína e 136 kcal. Sabores: Limão, Peanut & Vanilla Almond.",
    "price": 15,
    "image": "https://images.unsplash.com/photo-1622484216850-256d95aa0891?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 401,
        "name": "Escolha o sabor da barra",
        "min": 1,
        "max": 1,
        "options": [
          {
            "id": 6001,
            "name": "Limão",
            "price": 0
          },
          {
            "id": 6002,
            "name": "Peanut (Amendoim)",
            "price": 0
          },
          {
            "id": 6003,
            "name": "Vanilla Almond (Baunilha com Amêndoas)",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100061,
    "name": "Bolo de Pote Proteico",
    "group_name": "Lanches Doces",
    "description": "Bolo de pote gourmet fit. 164,07 kcal | 14,27g proteína | 15,3g carboidrato. Sabores: Chocolate, Sensação, Oreo fit, Abacaxi gelado, Mousse de Maracujá, Banoffee, Paçoca, Doce de leite, Beijinho, Prestígio, etc.",
    "price": 24,
    "image": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
    "optionGroups": [
      {
        "id": 301,
        "name": "Escolha o sabor do Bolo de Pote",
        "min": 1,
        "max": 1,
        "options": [
          {
            "id": 5000,
            "name": "Chocolate",
            "price": 0
          },
          {
            "id": 5001,
            "name": "Sensação",
            "price": 0
          },
          {
            "id": 5002,
            "name": "Oreo Fit",
            "price": 0
          },
          {
            "id": 5003,
            "name": "Abacaxi Gelado",
            "price": 0
          },
          {
            "id": 5004,
            "name": "Mousse de Maracujá",
            "price": 0
          },
          {
            "id": 5005,
            "name": "Banoffee",
            "price": 0
          },
          {
            "id": 5006,
            "name": "Paçoca",
            "price": 0
          },
          {
            "id": 5007,
            "name": "Doce de Leite",
            "price": 0
          },
          {
            "id": 5008,
            "name": "Beijinho",
            "price": 0
          },
          {
            "id": 5009,
            "name": "Prestígio",
            "price": 0
          },
          {
            "id": 5010,
            "name": "Whey Protein",
            "price": 0
          },
          {
            "id": 5011,
            "name": "Merengue de Morango",
            "price": 0
          }
        ]
      }
    ]
  },
  {
    "id": 100062,
    "name": "Cápsulas de Multivitaminas (2 und)",
    "group_name": "Cápsulas Potencializadoras",
    "description": "2 cápsulas com 12 vitaminas e 10 minerais que auxiliam no fortalecimento do sistema imunológico e vitalidade.",
    "price": 5,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100063,
    "name": "Cápsulas de Fiberbond (3 und)",
    "group_name": "Cápsulas Potencializadoras",
    "description": "3 cápsulas com fibras de aveia e beterraba que auxiliam na redução da absorção de gorduras (inibidor de apetite natural).",
    "price": 5,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100064,
    "name": "Xtra-Cal (2 und)",
    "group_name": "Cápsulas Potencializadoras",
    "description": "2 cápsulas de cálcio, magnésio e vitamina D para suporte ósseo, dental e muscular.",
    "price": 5,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100065,
    "name": "Ômega 3 (1 und)",
    "group_name": "Cápsulas Potencializadoras",
    "description": "1 cápsula concentrada de óleo de peixe com 54% das necessidades diárias de vitamina E e ácidos graxos essenciais.",
    "price": 4,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100066,
    "name": "Kit Mini Lipo (p/ 10 Dias)",
    "group_name": "Cápsulas Potencializadoras",
    "description": "Protocolo completo para perder até 10cm de barriga: 3 cápsulas de ômega 3 + 2 cápsulas de cálcio no café, almoço e jantar por 10 dias (R$ 34,00 por dia).",
    "price": 340,
    "image": "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100067,
    "name": "Pacote 10 Acessos (Ganhe +1)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 10 acessos de shakes tradicionais + 2 chás e ganhe +1 acesso grátis (total de 11 acessos completos).",
    "price": 250,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100068,
    "name": "Pacote 20 Acessos (Ganhe +3)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 20 acessos de shakes tradicionais + 2 chás e ganhe +3 acessos grátis (total de 23 acessos completos).",
    "price": 500,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100069,
    "name": "Pacote 30 Acessos (Ganhe +5)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 30 acessos de shakes tradicionais + 2 chás e ganhe +5 acessos grátis (total de 35 acessos completos).",
    "price": 750,
    "image": "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100070,
    "name": "Pacote 10 Acessos Trufados (Ganhe +1)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 10 acessos de shakes trufados com borda especial + 2 chás e ganhe +1 acesso grátis (total de 11 acessos).",
    "price": 300,
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100071,
    "name": "Pacote 20 Acessos Trufados (Ganhe +3)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 20 acessos de shakes trufados + 2 chás e ganhe +3 acessos grátis (total de 23 acessos).",
    "price": 600,
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100072,
    "name": "Pacote 30 Acessos Trufados (Ganhe +5)",
    "group_name": "Pacotes & Protocolos",
    "description": "Compre 1 pacote com 30 acessos de shakes trufados + 2 chás e ganhe +5 acessos grátis (total de 35 acessos).",
    "price": 900,
    "image": "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100073,
    "name": "Kit Afine (Slim Day)",
    "group_name": "Pacotes & Protocolos",
    "description": "Kit de desintoxicação e afunilamento de medidas da linha Slim Day.",
    "price": 115,
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100074,
    "name": "Kit Slim Day (1 Dia)",
    "group_name": "Pacotes & Protocolos",
    "description": "Alimentação e nutrição inteligente para 1 dia completo: 8 refeições e bebidas detox preparadas e prontas para consumo.",
    "price": 150,
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100075,
    "name": "Kit Slim Day (3 Dias)",
    "group_name": "Pacotes & Protocolos",
    "description": "Kit Detox programado para 3 dias com nutrição completa e chás funcionais para desinchar e secar com equilíbrio.",
    "price": 250,
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100076,
    "name": "Kit Slim Day (6 Dias)",
    "group_name": "Pacotes & Protocolos",
    "description": "Programa intensivo Detox de 6 dias para resultados expressivos na redução de medidas e inchaço.",
    "price": 415,
    "image": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100077,
    "name": "Protocolo de Emagrecimento 30 Dias",
    "group_name": "Pacotes & Protocolos",
    "description": "Módulos de acompanhamento e nutrição completa com resultado estimado de -3kg a -15kg (Módulos a partir de 3x R$ 183,00).",
    "price": 549,
    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  },
  {
    "id": 100078,
    "name": "Protocolo de Emagrecimento 90 Dias",
    "group_name": "Pacotes & Protocolos",
    "description": "Transformação corporal completa de 90 dias com acompanhamento e resultado estimado de -5kg a -30kg (Módulos a partir de 12x R$ 234,30).",
    "price": 2811.6,
    "image": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
    "optionGroups": []
  }
];
