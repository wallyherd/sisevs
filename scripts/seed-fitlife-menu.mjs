import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pabftlpmwfkttzlfywyi.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_KEY) {
  console.error("ERRO: Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || "dummy-key");

export const ESTABELECIMENTO_INFO = {
  nome: "FITLIFE - Espaço Vida Saudável",
  slogan: "Escolhas de hoje, mais saúde para amanhã",
  descricao: "Shakes proteicos, sopas funcionais, bebidas energéticas, lanches e pizzas proteicas, saladas e protocolos de nutrição.",
  endereco: "FitLife - Espaço Vida Saudável",
  telefone: "(67) 99157-9701",
  instagram: "@fitlife_espaco_vida_saudavel",
  logo: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&auto=format&fit=crop&q=80",
};

export const CATEGORIAS_LISTA = [
  "Shakes",
  "Sopas",
  "Bebidas Geladas",
  "Bebidas Funcionais",
  "Vitaminas",
  "Lanches Salgados",
  "Crepiocas & Tapiocas",
  "Pizzas Proteicas",
  "Saladas",
  "Lanches Doces",
  "Cápsulas Potencializadoras",
  "Pacotes & Protocolos",
];

export const SABORES_SHAKE = [
  "Abacaxi",
  "Banana",
  "Baunilha",
  "Café Cremoso",
  "Chocolate",
  "Cookies",
  "Doce de Leite",
  "Maracujá",
  "Limão",
  "Morango",
  "Paçoca",
];

export const ADICIONAIS_LISTA = [
  { nome: "Dose de Colágeno", preco: 8.0 },
  { nome: "Amendoim", preco: 1.0 },
  { nome: "Coco Ralado", preco: 1.0 },
  { nome: "Canela em Pó", preco: 1.0 },
  { nome: "Protein Crunch", preco: 8.0 },
  { nome: "Whey Protein", preco: 7.0 },
  { nome: "Dose Extra Fiber Concentrate", preco: 7.0 },
  { nome: "Proteína Extra", preco: 7.0 },
  { nome: "Fibra em Pó", preco: 7.0 },
];

export const TODOS_PRODUTOS = [
  // ── SHAKES (Cardapio 1: pág 3 & Cardapio 2: pág 1) ──
  {
    nome: "Shake Tradicional + 2 Chás Incluso",
    categoria: "Shakes",
    preco: 25.0,
    custo: 8.0,
    descricao: "Refeição nutricional completa: Shake cremoso (apenas 200 kcal, 20g de proteína, 23 vitaminas e minerais, 22g carboidratos). Temos opção zero lactose. Acompanha 2 chás inclusos (01 chá energético NRG + 01 chá diurético Herbal Concentrate).",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shake Trufado + 2 Chás Incluso",
    categoria: "Shakes",
    preco: 30.0,
    custo: 10.0,
    descricao: "Irresistível, cremoso e inesquecível. Borda especial com creme à base de shake + proteína + sabor da sua escolha. 300 kcal | 25g de proteína | 23 vitaminas e minerais | 27,5g de carboidratos. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "taça",
    imagem: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shake Petit Gateau + 2 Chás Incluso",
    categoria: "Shakes",
    preco: 34.0,
    custo: 12.0,
    descricao: "Deliciosa combinação quente e fria com até 2 sabores. 275 kcal | 28g de proteína | 23 vitaminas e minerais | 24,5g carboidratos. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "taça",
    imagem: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shake de Limão + 2 Chás Incluso (Simples)",
    categoria: "Shakes",
    preco: 32.0,
    custo: 10.0,
    descricao: "Shake refrescante de limão com apenas 200 kcal, 20g de proteína, 23 vitaminas e minerais. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    permite_sabor: false,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shake de Limão + 2 Chás Incluso (Trufado)",
    categoria: "Shakes",
    preco: 35.0,
    custo: 12.0,
    descricao: "Shake refrescante de limão na versão trufada com borda especial de creme proteico. Temos opção zero lactose. Acompanha 2 chás inclusos.",
    permite_sabor: false,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "taça",
    imagem: "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=500&auto=format&fit=crop&q=80",
  },

  // ── SOPAS (Cardapio 1: pág 5 & Cardapio 2: pág 2) ──
  {
    nome: "Sopa Frango com Legumes + 2 Chás Incluso",
    categoria: "Sopas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Refeição salgada quentinha e nutritiva. 91 kcal | 5g de proteína | 13 vitaminas e minerais | 16g de Carboidratos. Acompanha 2 chás inclusos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "tigela",
    imagem: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Nutri Soup Legumes e Verduras + 2 Chás Incluso",
    categoria: "Sopas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Nutri Soup cremosa e revigorante. 60,67 kcal | 6g de proteína | 23 vitaminas e minerais | 6,67g de Carboidratos. Acompanha 2 chás inclusos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "tigela",
    imagem: "https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Sopa Proteica (Ovos / Frango Desfiado)",
    categoria: "Sopas",
    preco: 30.0,
    custo: 9.0,
    descricao: "Sopa quente proteica reforçada com ovos frescos ou frango desfiado.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "tigela",
    imagem: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
  },

  // ── BEBIDAS GELADAS & SUCOS (Cardapio 2: pág 1) ──
  {
    nome: "Água sem Gás",
    categoria: "Bebidas Geladas",
    preco: 5.0,
    custo: 1.5,
    descricao: "Água mineral natural sem gás 500ml bem gelada.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "garrafa",
    imagem: "https://images.unsplash.com/photo-1559839914-ba2ae647c003?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Água com Gás",
    categoria: "Bebidas Geladas",
    preco: 6.0,
    custo: 2.0,
    descricao: "Água mineral natural gaseificada 500ml bem gelada.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "garrafa",
    imagem: "https://images.unsplash.com/photo-1559839914-ba2ae647c003?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Coca Zero",
    categoria: "Bebidas Geladas",
    preco: 6.0,
    custo: 3.0,
    descricao: "Refrigerante Coca-Cola Sem Açúcar lata 350ml gelada.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "lata",
    imagem: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Sprite Zero",
    categoria: "Bebidas Geladas",
    preco: 6.0,
    custo: 3.0,
    descricao: "Refrigerante Sprite Sem Açúcar lata 350ml gelada.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "lata",
    imagem: "https://images.unsplash.com/photo-1625772299848-391b6a87d7b3?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Guaraná Zero",
    categoria: "Bebidas Geladas",
    preco: 5.0,
    custo: 2.5,
    descricao: "Refrigerante Guaraná Antarctica Zero Açúcar lata 350ml gelada.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "lata",
    imagem: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Suco Detox (Abacaxi, Gengibre, Maçã e Couve)",
    categoria: "Bebidas Geladas",
    preco: 20.0,
    custo: 5.0,
    descricao: "Suco detox natural: abacaxi, gengibre, maçã e couve. Revigorante, diurético e antioxidante.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Suco da Beleza",
    categoria: "Bebidas Geladas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Suco especial com colágeno Verisol e antioxidantes para a pele, cabelos e unhas.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Hyper Drink Pré-Treino",
    categoria: "Bebidas Geladas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Fórmula de pré-treino para aceleração do metabolismo, energia explosiva, concentração, imunidade e saciedade.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
  },

  // ── BEBIDAS FUNCIONAIS & CHÁS (Cardapio 1: pág 6, 11) ──
  {
    nome: "Chá NRG (Guaraná / Natural)",
    categoria: "Bebidas Funcionais",
    preco: 14.0,
    custo: 3.5,
    descricao: "Chá energizante à base de guaraná natural em pó. Apenas 0,8g de carboidratos. Sabores: Natural ou Guaraná.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Chá Verde Herbal Concentrate",
    categoria: "Bebidas Funcionais",
    preco: 14.0,
    custo: 3.5,
    descricao: "Chá termogênico acelerador de metabolismo com ação antioxidante. Apenas 1,2g de carboidratos. Sabores: Natural, Laranja com Especiarias, Canela.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Liftoff",
    categoria: "Bebidas Funcionais",
    preco: 14.0,
    custo: 4.0,
    descricao: "Bebida energética efervescente com cafeína natural, taurina e complexo de vitaminas B e C. 15 kcal | 4g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shot Matinal Detox",
    categoria: "Bebidas Funcionais",
    preco: 15.0,
    custo: 4.0,
    descricao: "Fibras concentradas + bebida energética natural do guaraná. 5,35 kcal | 2,13g carboidrato | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Shot Matinal Fortalecimento Imunológico",
    categoria: "Bebidas Funcionais",
    preco: 18.0,
    custo: 5.0,
    descricao: "NRG + fiber concentrate + chá verde + 5000mg de glutamina pura. 30,34 kcal | 3,33g carboidratos | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Seca Barriga",
    categoria: "Bebidas Funcionais",
    preco: 20.0,
    custo: 6.0,
    descricao: "Combinação potente de Fiber Concentrate + Nutrev + Chá Verde termogênico. 144,74 kcal | 11,16g proteína | 20,53g carboidratos | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Bebida da Beleza Funcional",
    categoria: "Bebidas Funcionais",
    preco: 19.0,
    custo: 5.5,
    descricao: "Colágeno hidrolisado com whey + chá verde + fiber concentrate + NRG. 31,84 kcal | 4,2g proteína | 3,68g carboidratos | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Sunset Drink",
    categoria: "Bebidas Funcionais",
    preco: 22.0,
    custo: 6.0,
    descricao: "2x Fiber Concentrate + Chá Verde. 15,68 kcal | 3,86g carboidratos | 4g fibras. Efeito desinchaço e regulador intestinal.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1536935338788-846bb9981813?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Dose de CR7 Drive",
    categoria: "Bebidas Funcionais",
    preco: 8.5,
    custo: 2.5,
    descricao: "Bebida hidroeletrolítica desenvolvida para hidratar e repor sais minerais rapidamente. 50 kcal | 13g carboidrato.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Power Drink (Levanta Defunto)",
    categoria: "Bebidas Funcionais",
    preco: 27.0,
    custo: 8.0,
    descricao: "CR7 Drive + Chá Verde + NRG + Fiber Concentrate. Dose máxima de vitalidade e foco. 60,34 kcal | 26,33g carboidratos | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "garrafa",
    imagem: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Fiber Concentrate (Dose Pronta)",
    categoria: "Bebidas Funcionais",
    preco: 7.0,
    custo: 2.0,
    descricao: "Dose de fibra líquida solúvel. Sabores: Uva, Manga, Limão com mel. 5,34 kcal | 1,33g carboidratos | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Whey Protein (Dose Pronta)",
    categoria: "Bebidas Funcionais",
    preco: 15.0,
    custo: 4.5,
    descricao: "Whey Protein 3W (Isolado, Concentrado e Hidrolisado). 128 kcal | 25g de proteína | 3,3g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Suco Verde Funcional",
    categoria: "Bebidas Funcionais",
    preco: 20.0,
    custo: 5.0,
    descricao: "Maçã, couve, cenoura, gengibre e chá verde. 44 kcal | 1,4g proteína | 1,6g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Suco Detox Funcional",
    categoria: "Bebidas Funcionais",
    preco: 10.0,
    custo: 3.0,
    descricao: "Suco funcional diurético de baixas calorias. Sabores: Uva, Manga ou Limão com Mel. 5,34 kcal | 2g fibras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Turbo Beach",
    categoria: "Bebidas Funcionais",
    preco: 20.0,
    custo: 5.5,
    descricao: "Liftoff + CR7 Drive. Hidroeletrolítico e energia imediata desenvolvido para atletas de beach tennis e treino intenso. 65 kcal | 17g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Hype Drink",
    categoria: "Bebidas Funcionais",
    preco: 25.0,
    custo: 7.0,
    descricao: "Liftoff + CR7 Drive formulado para redefinir clareza mental, foco, concentração e queima calórica. 117 kcal | 139mg cafeína | 138mg taurina.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
  },

  // ── VITAMINAS (Cardapio 2: pág 1) ──
  {
    nome: "Vitamina de Banana com Maçã",
    categoria: "Vitaminas",
    preco: 15.0,
    custo: 4.5,
    descricao: "Vitamina nutritiva batida na hora com banana fresca, maçã selecionada e base cremosa saudável.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Vitamina de Banana, Maçã e Mamão",
    categoria: "Vitaminas",
    preco: 16.9,
    custo: 5.0,
    descricao: "Vitamina cremosa e balanceada com mix de banana, maçã e mamão rico em fibras e vitaminas essenciais.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "copo",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },

  // ── LANCHES SALGADOS PROTEICOS (Cardapio 1: pág 8 & Cardapio 2: pág 2) ──
  {
    nome: "Pães de Queijo Proteico (4 und)",
    categoria: "Lanches Salgados",
    preco: 16.0,
    custo: 5.0,
    descricao: "Porção com 4 unidades quentinhas e crocantes. 382,4 kcal | 24,16g de proteína | 10,6g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "porção",
    imagem: "https://images.unsplash.com/photo-1598142981358-164421b212f4?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pães de Queijo c/ Goiabada Proteico (4 und)",
    categoria: "Lanches Salgados",
    preco: 16.0,
    custo: 5.0,
    descricao: "Porção com 4 unidades crocantes com recheio de goiabada. 382,4 kcal | 24,16g de proteína | 10,6g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "porção",
    imagem: "https://images.unsplash.com/photo-1598142981358-164421b212f4?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kibe Proteico",
    categoria: "Lanches Salgados",
    preco: 12.0,
    custo: 3.5,
    descricao: "Kibe assado artesanal saudável e protéico. 176,35 kcal | 16g de proteína | 19,2g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Empadinha de Frango Proteica (4 und)",
    categoria: "Lanches Salgados",
    preco: 15.0,
    custo: 4.5,
    descricao: "Porção com 4 empadinhas com massa protéica fina e frango desfiado suculento. 320,27 kcal | 33,74g proteína | 18,67g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "porção",
    imagem: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Coxinha de Batata Doce Proteica",
    categoria: "Lanches Salgados",
    preco: 12.0,
    custo: 3.5,
    descricao: "Coxinha assada sem glúten feita com batata doce e frango desfiado. 111,29 kcal | 12,73g proteína | 10,78g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Misto Quente",
    categoria: "Lanches Salgados",
    preco: 13.9,
    custo: 4.0,
    descricao: "Misto quente tostado no pão artesanal com queijo derretido e presunto.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pão com Ovo e Queijo",
    categoria: "Lanches Salgados",
    preco: 15.0,
    custo: 4.5,
    descricao: "Pão quentinho prensado com ovos frescos feitos na hora e queijo derretido.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Ovos Mexidos com Torrada e Frutas",
    categoria: "Lanches Salgados",
    preco: 20.0,
    custo: 6.0,
    descricao: "Café da manhã ou lanche reforçado: ovos mexidos cremosos acompanhados de torradas integrais e porção de frutas frescas.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "prato",
    imagem: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500&auto=format&fit=crop&q=80",
  },

  // ── CREPIOCAS & TAPIOCAS (Cardapio 2: pág 2) ──
  {
    nome: "Crepioca de Frango com Catupiry",
    categoria: "Crepiocas & Tapiocas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Crepioca proteica fininha recheada com frango desfiado temperado e Catupiry cremoso.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Crepioca de Presunto e Queijo",
    categoria: "Crepiocas & Tapiocas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Crepioca proteica quentinha com fatias de presunto magro e bastante queijo derretido.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Tapioca Tradicional (Mussarela, Tomate e Orégano)",
    categoria: "Crepiocas & Tapiocas",
    preco: 25.0,
    custo: 6.5,
    descricao: "Tapioca crocante recheada com mussarela derretida, tomates frescos e toque aromático de orégano.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Tapioca de Frango com Catupiry",
    categoria: "Crepiocas & Tapiocas",
    preco: 25.0,
    custo: 7.0,
    descricao: "Tapioca tradicional recheada com frango desfiado bem temperado e Catupiry.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Tapioca de Doce de Leite",
    categoria: "Crepiocas & Tapiocas",
    preco: 25.0,
    custo: 6.5,
    descricao: "Tapioca doce especial generosamente recheada com doce de leite cremoso.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&auto=format&fit=crop&q=80",
  },

  // ── PIZZAS PROTEICAS (Cardapio 1: pág 9) ──
  {
    nome: "Pizza Proteica de Frango",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "Massa proteica assada com frango desfiado suculento, queijo e cebola roxa. 329,03 kcal | 28,47g proteína | 18,6g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pizza Proteica Marguerita",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "Massa protéica leve com queijo derretido, fatias de tomate fresco e manjericão. 312,4 kcal | 25,26g proteína | 18,6g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pizza Proteica de Chocolate",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "Massa proteica coberta com delicioso creme de chocolate saudável. 380,4 kcal | 25,76g proteína | 25,6g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pizza Proteica Prestígio",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "Combinação irresistível de chocolate proteico com coco ralado fresco. 409,90 kcal | 26,06g proteína | 27,4g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pizza Proteica Romeu e Julieta",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "O casamento perfeito de queijo derretido com goiabada em versão saudável. 412 kcal | 25,46g proteína | 44,24g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pizza Proteica Sensação",
    categoria: "Pizzas Proteicas",
    preco: 24.0,
    custo: 7.0,
    descricao: "Creme de chocolate protéico com morangos frescos fatiados por cima. 384,1 kcal | 25,87g proteína | 26,42g carboidratos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=500&auto=format&fit=crop&q=80",
  },

  // ── SALADAS (Cardapio 2: pág 2) ──
  {
    nome: "Salada da Casa Tradicional",
    categoria: "Saladas",
    preco: 30.0,
    custo: 9.0,
    descricao: "Leve, completa e nutritiva. Mix fresco de folhas verdes, legumes selecionados, 1 proteína (frango desfiado/tiras) e molho da casa light.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "prato",
    imagem: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Salada Mista",
    categoria: "Saladas",
    preco: 35.0,
    custo: 11.0,
    descricao: "Refeição completa e revigorante. Mix de folhas nobres e legumes, acompanhada de 2 tipos de proteínas e molho da casa light.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "prato",
    imagem: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },

  // ── LANCHES DOCES PROTEICOS (Cardapio 1: pág 10) ──
  {
    nome: "Bolinho de Shake (4 und)",
    categoria: "Lanches Doces",
    preco: 18.0,
    custo: 5.0,
    descricao: "Porção com 4 unidades de muffins protéicos feitos à base de shake. 312,30 kcal | 27,56g proteína | 26,6g carboidrato.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "porção",
    imagem: "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pão de Mel Proteico",
    categoria: "Lanches Doces",
    preco: 6.0,
    custo: 2.0,
    descricao: "Delicioso pão de mel fit com 140 kcal | 7,14g proteína | 2,85g carboidratos. Opções de recheio: Doce de Leite, Morango, Chocolate, Paçoca, Coco, Baunilha, etc.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Brigadeiro Proteico (1 unid)",
    categoria: "Lanches Doces",
    preco: 6.0,
    custo: 2.0,
    descricao: "Brigadeiro proteico gourmet feito com cacau nobre e proteínas. 55,87 kcal | 5,19g proteína | 6,3g carboidrato.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Donuts Proteico (1 unid)",
    categoria: "Lanches Doces",
    preco: 8.0,
    custo: 2.5,
    descricao: "Donut assado saudável com cobertura fit proteica. 86 kcal | 4g proteína | 9g carboidrato | 4g gorduras.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Waffle Proteico",
    categoria: "Lanches Doces",
    preco: 15.0,
    custo: 4.5,
    descricao: "Waffle quentinho crocante por fora e macio por dentro feito com massa protéica rica em nutrientes. 216,4 kcal | 18,16g proteína | 18g carboidrato.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Barra de Proteína",
    categoria: "Lanches Doces",
    preco: 15.0,
    custo: 6.0,
    descricao: "Barra proteica com 12g de proteína e 136 kcal. Sabores: Limão, Peanut & Vanilla Almond.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1622484216850-256d95aa0891?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Bolo de Pote Proteico",
    categoria: "Lanches Doces",
    preco: 24.0,
    custo: 8.0,
    descricao: "Bolo de pote gourmet fit. 164,07 kcal | 14,27g proteína | 15,3g carboidrato. Sabores: Chocolate, Sensação, Oreo fit, Abacaxi gelado, Mousse de Maracujá, Banoffee, Paçoca, Doce de leite, Beijinho, Prestígio, etc.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pote",
    imagem: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&auto=format&fit=crop&q=80",
  },

  // ── CÁPSULAS POTENCIALIZADORAS (Cardapio 1: pág 12) ──
  {
    nome: "Cápsulas de Multivitaminas (2 und)",
    categoria: "Cápsulas Potencializadoras",
    preco: 5.0,
    custo: 1.5,
    descricao: "2 cápsulas com 12 vitaminas e 10 minerais que auxiliam no fortalecimento do sistema imunológico e vitalidade.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Cápsulas de Fiberbond (3 und)",
    categoria: "Cápsulas Potencializadoras",
    preco: 5.0,
    custo: 1.5,
    descricao: "3 cápsulas com fibras de aveia e beterraba que auxiliam na redução da absorção de gorduras (inibidor de apetite natural).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Xtra-Cal (2 und)",
    categoria: "Cápsulas Potencializadoras",
    preco: 5.0,
    custo: 1.5,
    descricao: "2 cápsulas de cálcio, magnésio e vitamina D para suporte ósseo, dental e muscular.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "dose",
    imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Ômega 3 (1 und)",
    categoria: "Cápsulas Potencializadoras",
    preco: 4.0,
    custo: 1.2,
    descricao: "1 cápsula concentrada de óleo de peixe com 54% das necessidades diárias de vitamina E e ácidos graxos essenciais.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "unidade",
    imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kit Mini Lipo (p/ 10 Dias)",
    categoria: "Cápsulas Potencializadoras",
    preco: 340.0,
    custo: 120.0,
    descricao: "Protocolo completo para perder até 10cm de barriga: 3 cápsulas de ômega 3 + 2 cápsulas de cálcio no café, almoço e jantar por 10 dias (R$ 34,00 por dia).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "kit",
    imagem: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80",
  },

  // ── PACOTES & PROTOCOLOS (Cardapio 1: pág 7, 13) ──
  {
    nome: "Pacote 10 Acessos (Ganhe +1)",
    categoria: "Pacotes & Protocolos",
    preco: 250.0,
    custo: 80.0,
    descricao: "Compre 1 pacote com 10 acessos de shakes tradicionais + 2 chás e ganhe +1 acesso grátis (total de 11 acessos completos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pacote 20 Acessos (Ganhe +3)",
    categoria: "Pacotes & Protocolos",
    preco: 500.0,
    custo: 160.0,
    descricao: "Compre 1 pacote com 20 acessos de shakes tradicionais + 2 chás e ganhe +3 acessos grátis (total de 23 acessos completos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pacote 30 Acessos (Ganhe +5)",
    categoria: "Pacotes & Protocolos",
    preco: 750.0,
    custo: 240.0,
    descricao: "Compre 1 pacote com 30 acessos de shakes tradicionais + 2 chás e ganhe +5 acessos grátis (total de 35 acessos completos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pacote 10 Acessos Trufados (Ganhe +1)",
    categoria: "Pacotes & Protocolos",
    preco: 300.0,
    custo: 100.0,
    descricao: "Compre 1 pacote com 10 acessos de shakes trufados com borda especial + 2 chás e ganhe +1 acesso grátis (total de 11 acessos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pacote 20 Acessos Trufados (Ganhe +3)",
    categoria: "Pacotes & Protocolos",
    preco: 600.0,
    custo: 200.0,
    descricao: "Compre 1 pacote com 20 acessos de shakes trufados + 2 chás e ganhe +3 acessos grátis (total de 23 acessos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Pacote 30 Acessos Trufados (Ganhe +5)",
    categoria: "Pacotes & Protocolos",
    preco: 900.0,
    custo: 300.0,
    descricao: "Compre 1 pacote com 30 acessos de shakes trufados + 2 chás e ganhe +5 acessos grátis (total de 35 acessos).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "pacote",
    imagem: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kit Afine (Slim Day)",
    categoria: "Pacotes & Protocolos",
    preco: 115.0,
    custo: 45.0,
    descricao: "Kit de desintoxicação e afunilamento de medidas da linha Slim Day.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "kit",
    imagem: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kit Slim Day (1 Dia)",
    categoria: "Pacotes & Protocolos",
    preco: 150.0,
    custo: 55.0,
    descricao: "Alimentação e nutrição inteligente para 1 dia completo: 8 refeições e bebidas detox preparadas e prontas para consumo.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "kit",
    imagem: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kit Slim Day (3 Dias)",
    categoria: "Pacotes & Protocolos",
    preco: 250.0,
    custo: 90.0,
    descricao: "Kit Detox programado para 3 dias com nutrição completa e chás funcionais para desinchar e secar com equilíbrio.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "kit",
    imagem: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Kit Slim Day (6 Dias)",
    categoria: "Pacotes & Protocolos",
    preco: 415.0,
    custo: 150.0,
    descricao: "Programa intensivo Detox de 6 dias para resultados expressivos na redução de medidas e inchaço.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "kit",
    imagem: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Protocolo de Emagrecimento 30 Dias",
    categoria: "Pacotes & Protocolos",
    preco: 549.0,
    custo: 200.0,
    descricao: "Módulos de acompanhamento e nutrição completa com resultado estimado de -3kg a -15kg (Módulos a partir de 3x R$ 183,00).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "protocolo",
    imagem: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
  },
  {
    nome: "Protocolo de Emagrecimento 90 Dias",
    categoria: "Pacotes & Protocolos",
    preco: 2811.6,
    custo: 900.0,
    descricao: "Transformação corporal completa de 90 dias com acompanhamento e resultado estimado de -5kg a -30kg (Módulos a partir de 12x R$ 234,30).",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
    unidade_medida: "protocolo",
    imagem: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=80",
  },
];

async function seedFitlife() {
  console.log("=== INICIANDO ATUALIZAÇÃO DO CARDÁPIO FITLIFE ===");

  // 1. Atualizar dados da loja
  const { data: configRows } = await supabase.from("configuracoes_loja").select("id").limit(1);
  if (configRows && configRows.length > 0) {
    await supabase.from("configuracoes_loja").update({
      nome_loja: ESTABELECIMENTO_INFO.nome,
      endereco: ESTABELECIMENTO_INFO.endereco,
      telefone: ESTABELECIMENTO_INFO.telefone,
    }).eq("id", configRows[0].id);
    console.log("✓ Configuração da loja atualizada para FITLIFE");
  }

  // 2. Limpar referências antigas em pedido_itens para desvincular produtos antigos
  await supabase.from("pedido_itens").update({ produto_id: null }).neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Desvinculados produtos antigos de pedido_itens");

  // 3. Deletar vínculos de produtos
  await supabase.from("produto_sabores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("produto_adicionais").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  console.log("✓ Removidos produto_sabores e produto_adicionais antigos");

  // 4. Deletar produtos antigos
  const { error: errDelProds } = await supabase.from("produtos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (errDelProds) console.error("Erro ao deletar produtos antigos:", errDelProds.message);
  else console.log("✓ Produtos antigos removidos do banco com sucesso");

  // 5. Inserir/Atualizar Categorias
  const mapCategorias = new Map();
  for (const catNome of CATEGORIAS_LISTA) {
    let { data: cat } = await supabase
      .from("categorias_produtos")
      .select("id, nome")
      .eq("nome", catNome)
      .maybeSingle();

    if (!cat) {
      const { data: novaCat, error: errC } = await supabase
        .from("categorias_produtos")
        .insert({ nome: catNome, ativo: true })
        .select()
        .single();
      if (errC) console.error("Erro ao criar categoria:", catNome, errC.message);
      cat = novaCat;
    } else {
      await supabase.from("categorias_produtos").update({ ativo: true }).eq("id", cat.id);
    }
    if (cat) mapCategorias.set(catNome, cat.id);
  }
  // Desativar categorias que não pertencem ao novo cardápio
  const { data: todasCats } = await supabase.from("categorias_produtos").select("id, nome");
  for (const c of todasCats || []) {
    if (!CATEGORIAS_LISTA.includes(c.nome)) {
      await supabase.from("categorias_produtos").update({ ativo: false }).eq("id", c.id);
    }
  }
  console.log(`✓ ${mapCategorias.size} categorias configuradas no banco`);

  // 6. Inserir/Atualizar Sabores
  const mapSabores = new Map();
  for (const sabNome of SABORES_SHAKE) {
    let { data: sab } = await supabase
      .from("sabores")
      .select("id, nome")
      .eq("nome", sabNome)
      .maybeSingle();

    if (!sab) {
      const { data: novoSab, error: errS } = await supabase
        .from("sabores")
        .insert({ nome: sabNome, ativo: true })
        .select()
        .single();
      if (errS) console.error("Erro ao criar sabor:", sabNome, errS.message);
      sab = novoSab;
    } else {
      await supabase.from("sabores").update({ ativo: true }).eq("id", sab.id);
    }
    if (sab) mapSabores.set(sabNome, sab.id);
  }
  console.log(`✓ ${mapSabores.size} sabores configurados`);

  // 7. Inserir/Atualizar Adicionais
  const mapAdicionais = new Map();
  for (const ad of ADICIONAIS_LISTA) {
    let { data: adi } = await supabase
      .from("adicionais")
      .select("id, nome")
      .eq("nome", ad.nome)
      .maybeSingle();

    if (!adi) {
      const { data: novoAdi, error: errA } = await supabase
        .from("adicionais")
        .insert({ nome: ad.nome, preco: ad.preco, ativo: true })
        .select()
        .single();
      if (errA) console.error("Erro ao criar adicional:", ad.nome, errA.message);
      adi = novoAdi;
    } else {
      await supabase.from("adicionais").update({ preco: ad.preco, ativo: true }).eq("id", adi.id);
    }
    if (adi) mapAdicionais.set(ad.nome, adi.id);
  }
  console.log(`✓ ${mapAdicionais.size} adicionais configurados`);

  // 8. Inserir Novos Produtos
  let totalProdutosInseridos = 0;
  for (const p of TODOS_PRODUTOS) {
    const catId = mapCategorias.get(p.categoria) || null;
    const { data: novoProduto, error: errP } = await supabase
      .from("produtos")
      .insert({
        nome: p.nome,
        descricao: p.descricao,
        categoria_id: catId,
        preco: p.preco,
        custo: p.custo,
        ativo: true,
        aparece_no_pedido: true,
        envia_para_cozinha: p.envia_para_cozinha,
        produto_fechado: p.produto_fechado,
        permite_sabor: p.permite_sabor,
        permite_adicionais: p.permite_adicionais,
      })
      .select()
      .single();

    if (errP) {
      console.error("Erro ao inserir produto:", p.nome, errP.message);
    } else if (novoProduto) {
      totalProdutosInseridos++;
      const prodId = novoProduto.id;

      // Associar sabores aos shakes
      if (p.permite_sabor && p.categoria === "Shakes") {
        for (const saborId of mapSabores.values()) {
          try {
            await supabase.from("produto_sabores").insert({ produto_id: prodId, sabor_id: saborId });
          } catch {}
        }
      }

      // Associar adicionais aos shakes
      if (p.permite_adicionais) {
        for (const adicionalId of mapAdicionais.values()) {
          try {
            await supabase.from("produto_adicionais").insert({ produto_id: prodId, adicional_id: adicionalId });
          } catch {}
        }
      }
    }
  }
  console.log(`✓ ${totalProdutosInseridos} produtos inseridos com sucesso na tabela produtos!`);

  // 9. Inserir/Atualizar Estoque (estoque_itens)
  console.log("=== SINCRONIZANDO ESTOQUE COM OS PRODUTOS DOS CARDÁPIOS ===");
  // Limpar estoque atual se necessário
  let totalEstoque = 0;
  for (const p of TODOS_PRODUTOS) {
    let { data: itemEstoque } = await supabase
      .from("estoque_itens")
      .select("id, nome")
      .eq("nome", p.nome)
      .maybeSingle();

    if (!itemEstoque) {
      const { data: criado, error: errEst } = await supabase
        .from("estoque_itens")
        .insert({
          nome: p.nome,
          categoria: p.categoria,
          unidade_medida: p.unidade_medida || "unidade",
          quantidade_atual: 20, // estoque inicial abastecido
          estoque_minimo: 5,
          custo_unitario: p.custo,
          ativo: true,
          fornecedor: "FitLife Nutrição & Distribuição",
        })
        .select()
        .single();

      if (errEst) console.error("Erro ao criar estoque para:", p.nome, errEst.message);
      else totalEstoque++;
    } else {
      await supabase
        .from("estoque_itens")
        .update({
          categoria: p.categoria,
          unidade_medida: p.unidade_medida || "unidade",
          custo_unitario: p.custo,
          ativo: true,
        })
        .eq("id", itemEstoque.id);
      totalEstoque++;
    }
  }

  // Adicionar também insumos/adicionais essenciais no estoque
  const INSUMOS_ESTOQUE = [
    { nome: "Pó Nutricional Shake (Diversos Sabores)", categoria: "Insumos FitLife", unidade: "pote", qtd: 30, min: 5, custo: 120 },
    { nome: "Proteína Protein Powder (Neutro)", categoria: "Insumos FitLife", unidade: "pote", qtd: 15, min: 3, custo: 90 },
    { nome: "Chá NRG Guaraná em Pó", categoria: "Insumos FitLife", unidade: "pote", qtd: 20, min: 5, custo: 85 },
    { nome: "Chá Herbal Concentrate Chá Verde", categoria: "Insumos FitLife", unidade: "pote", qtd: 20, min: 5, custo: 95 },
    { nome: "Fiber Concentrate (Fibra Líquida Uva/Manga)", categoria: "Insumos FitLife", unidade: "garrafa", qtd: 15, min: 3, custo: 80 },
    { nome: "Colágeno Hidrolisado Verisol", categoria: "Insumos FitLife", unidade: "pote", qtd: 10, min: 2, custo: 110 },
    { nome: "CR7 Drive Hidroeletrolítico", categoria: "Insumos FitLife", unidade: "pote", qtd: 12, min: 3, custo: 75 },
    { nome: "Copos Térmicos Descartáveis 500ml", categoria: "Embalagens", unidade: "pacote", qtd: 100, min: 20, custo: 25 },
    { nome: "Canudos Biodegradáveis", categoria: "Embalagens", unidade: "pacote", qtd: 50, min: 10, custo: 15 },
    { nome: "Tigelas Térmicas para Sopa", categoria: "Embalagens", unidade: "pacote", qtd: 50, min: 10, custo: 30 },
  ];

  for (const insumo of INSUMOS_ESTOQUE) {
    let { data: existeInsumo } = await supabase.from("estoque_itens").select("id").eq("nome", insumo.nome).maybeSingle();
    if (!existeInsumo) {
      await supabase.from("estoque_itens").insert({
        nome: insumo.nome,
        categoria: insumo.categoria,
        unidade_medida: insumo.unidade,
        quantidade_atual: insumo.qtd,
        estoque_minimo: insumo.min,
        custo_unitario: insumo.custo,
        ativo: true,
        fornecedor: "FitLife Matriz",
      });
      totalEstoque++;
    }
  }

  console.log(`✓ Total de ${totalEstoque} itens gerenciados no estoque!`);
  console.log("=== FINALIZADO COM SUCESSO ===");
}

seedFitlife();
