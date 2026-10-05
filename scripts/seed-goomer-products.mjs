import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://pabftlpmwfkttzlfywyi.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SERVICE_KEY) {
  console.error("ERRO: Defina a variável de ambiente SUPABASE_SERVICE_ROLE_KEY antes de rodar este script.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY || "dummy-key");

const ESTABELECIMENTO = {
  nome: "Espaço Vida Saudável Chácara Cachoeira",
  endereco: "Rua Jeribá, 325, sala 43 - Chácara Cachoeira, Campo Grande - MS",
  telefone: "(67) 99157-9701",
  logo_url: "https://static.goomer.app/stores/64935/products/mobile_menu/templates/94005/logo_v1653398689.png",
};

const CATEGORIAS = [
  "Shakes",
  "Barras de Proteina",
  "SLIMDAY - Kit Detox",
  "Produtos a Pronta Entrega",
];

const SABORES = [
  "Chocolate",
  "Doce de Leite",
  "Cookies'n'cream",
  "Coco",
  "Baunilha",
  "Morango",
  "Banana Caramelizada",
  "Café cremoso",
  "Frapê de Abacaxi",
  "Torta de Limão",
];

const ADICIONAIS = [
  { nome: "Fibra de Manga", preco: 7.0 },
  { nome: "Fibra de Uva", preco: 7.0 },
  { nome: "Colágeno", preco: 9.0 },
  { nome: "Proteina Crocante (3g)", preco: 9.0 },
  { nome: "Proteina em Pó (5g)", preco: 9.0 },
];

const PRODUTOS = [
  {
    nome: "Shake Tradicional ( + 2 chás)",
    categoria: "Shakes",
    preco: 27.0,
    descricao: "Delicioso Shake Proteico, com apenas 210 kcal, 20g de proteina, alto teor de fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Shake com Fibra (+ 2 chás)",
    categoria: "Shakes",
    preco: 34.0,
    descricao: "Delicioso Shake Proteico, com apenas 210 kcal, 20g de proteina, mais 6g fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Shake Trufado (+ 2 chás)",
    categoria: "Shakes",
    preco: 36.0,
    descricao: "Delicioso Shake Proteico, com apenas 250 kcal, 23g de proteina, alto teor de fibras, e com todas as 23 vitaminas e minerais necessárias para fortalecer nosso organismo. Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Shake com Colágeno (+2 chás)",
    categoria: "Shakes",
    preco: 36.0,
    descricao: "Uma dose diária de beleza. Com delicioso sabor de frutas vermelhas o Shake da Beleza é enriquecido com colágeno Verisol e Whey Protein, vitaminas e minerais essenciais aos cabelos, unhas, pele e ainda combate a celulite e flacidez. Acompanha chás que auxiliam a te dar mais energia e disposição, acelerar o metabolismo, quebra de gordura e diurético.",
    permite_sabor: true,
    permite_adicionais: true,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Barra de Proteina",
    categoria: "Barras de Proteina",
    preco: 16.0,
    descricao: "Deliciosa barra de proteína, ótima para um lanchinho prático, delicioso e proteico. Com 12g de proteína e 130 kcal.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Slimday Tradicional",
    categoria: "SLIMDAY - Kit Detox",
    preco: 159.0,
    descricao: "Sua alimentação completa do café da manhã ao jantar – prática, saudável e pronta para consumo!\r\nComposto por 8 etapas para ajudar na sua rotina equilibrada, somando apenas 808 kcal.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Slimday Gold",
    categoria: "SLIMDAY - Kit Detox",
    preco: 179.0,
    descricao: "O Kit SlimDay Gold é a versão turbinada do tradicional: inclui 8 itens prontos para consumo + 1 barra de proteína + 1 dose de chá detox + 1 dose de proteína crocante, somando cerca de 950 kcal.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: true,
    produto_fechado: false,
  },
  {
    nome: "Shake Herbalife Nutrition Sabores - 550g",
    categoria: "Produtos a Pronta Entrega",
    preco: 246.0,
    descricao: "Fórmula 1 é um shake nutricional desenvolvido para gerenciamento de peso e dieta saudável. 23 vitaminas e minerais com alto valor biológico.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: 'Chá Herbal Concentrate | "Chá Verde"',
    categoria: "Produtos a Pronta Entrega",
    preco: 364.0,
    descricao: "Chá à base de Chá Verde, Chá Preto, Hibisco, Cardamomo e Malva. Efeito termogênico e vitalidade.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: 'Chá NRG | "Chá Guaraná"',
    categoria: "Produtos a Pronta Entrega",
    preco: 252.0,
    descricao: "Ajuda no estado de concentração e alerta com guaraná natural em pó. Pode ser saboreado quente ou gelado.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Nutrev 672g",
    categoria: "Produtos a Pronta Entrega",
    preco: 79.0,
    descricao: "NutreV é uma bebida vegetal enriquecida com vitaminas e minerais, alternativa saudável e sem lactose ao leite.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Proteina em Pó",
    categoria: "Produtos a Pronta Entrega",
    preco: 221.0,
    descricao: "Protein Powder de sabor neutro com 5g de proteína por porção. Livre de gorduras e açúcares.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Fiber Concentrate | Fibra Líquida",
    categoria: "Produtos a Pronta Entrega",
    preco: 206.0,
    descricao: "Mistura concentrada de fibra solúvel para bom funcionamento intestinal. Apenas 6 a 8 kcal por porção.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Barra de Proteina Sabores (Caixa com 7 un)",
    categoria: "Produtos a Pronta Entrega",
    preco: 110.0,
    descricao: "Caixa com 7 barras de 35g cada. 10g de proteínas e cerca de 140 calorias por porção.",
    permite_sabor: true,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Multivitaminas e Minerais 90 Tabletes",
    categoria: "Produtos a Pronta Entrega",
    preco: 122.0,
    descricao: "Suplemento com 12 vitaminas e 10 minerais que auxiliam no fortalecimento da imunidade e vitalidade diária.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Shape Control: Morosil™ e Cromo",
    categoria: "Produtos a Pronta Entrega",
    preco: 338.0,
    descricao: "Combinação potente de Morosil (extrato de laranja moro) e Cromo para auxílio na redução de medidas e metabolismo lipídico.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Liftoff Energético Sachês (15 un)",
    categoria: "Produtos a Pronta Entrega",
    preco: 196.0,
    descricao: "Bebida energética efervescente com cafeína, taurina e vitaminas do complexo B e C. Zero açúcar.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Fiber Powder 275g - Fibra em pó",
    categoria: "Produtos a Pronta Entrega",
    preco: 243.0,
    descricao: "Fibra em pó neutra solúvel que não altera o sabor dos alimentos ou bebidas. Apenas 5 kcal.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Herbalifeline 90 Cápsulas (Ômega 3)",
    categoria: "Produtos a Pronta Entrega",
    preco: 281.0,
    descricao: "Cápsulas de óleo de peixe concentrado com Ômega-3 e Vitamina E antioxidante. Sem sabor residual de peixe.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Xtra-Cal 60 Tabletes (Cálcio + Vitamina D)",
    categoria: "Produtos a Pronta Entrega",
    preco: 109.0,
    descricao: "Suplemento de cálcio, vitamina D e magnésio para suporte ósseo e dental.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Desodorante Antitranspirante Chá Verde",
    categoria: "Produtos a Pronta Entrega",
    preco: 30.0,
    descricao: "24 horas de proteção suave e refrescante com extrato de chá verde.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
  {
    nome: "Beauty Booster Colágeno Frutas Vermelhas 240g",
    categoria: "Produtos a Pronta Entrega",
    preco: 301.0,
    descricao: "Colágeno Verisol® de alta absorção com Whey Protein, vitaminas A, C, D, E e Biotina para pele, unhas e cabelos.",
    permite_sabor: false,
    permite_adicionais: false,
    envia_para_cozinha: false,
    produto_fechado: true,
  },
];

async function seed() {
  console.log("Iniciando população dos dados do Goomer no Supabase...");

  // 1. Configurações da Loja
  const { data: configExistente } = await supabase.from("configuracoes_loja").select("id").limit(1);
  if (!configExistente || configExistente.length === 0) {
    const { error: errConf } = await supabase.from("configuracoes_loja").insert({
      nome_loja: ESTABELECIMENTO.nome,
      endereco: ESTABELECIMENTO.endereco,
      telefone: ESTABELECIMENTO.telefone,
      logo_url: ESTABELECIMENTO.logo_url,
    });
    console.log("Configurações da loja inseridas:", errConf ? errConf.message : "OK");
  } else {
    await supabase.from("configuracoes_loja").update({
      nome_loja: ESTABELECIMENTO.nome,
      endereco: ESTABELECIMENTO.endereco,
      telefone: ESTABELECIMENTO.telefone,
      logo_url: ESTABELECIMENTO.logo_url,
    }).eq("id", configExistente[0].id);
    console.log("Configurações da loja atualizadas.");
  }

  // 2. Categorias
  const mapCategorias = new Map();
  for (const catNome of CATEGORIAS) {
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
    }
    if (cat) mapCategorias.set(catNome, cat.id);
  }
  console.log("Categorias configuradas:", mapCategorias.size);

  // 3. Sabores
  const mapSabores = new Map();
  for (const sabNome of SABORES) {
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
    }
    if (sab) mapSabores.set(sabNome, sab.id);
  }
  console.log("Sabores configurados:", mapSabores.size);

  // 4. Adicionais
  const mapAdicionais = new Map();
  for (const ad of ADICIONAIS) {
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
    }
    if (adi) mapAdicionais.set(ad.nome, adi.id);
  }
  console.log("Adicionais configurados:", mapAdicionais.size);

  // 5. Produtos
  let totalInseridos = 0;
  for (const p of PRODUTOS) {
    const catId = mapCategorias.get(p.categoria) || null;

    let { data: prodExistente } = await supabase
      .from("produtos")
      .select("id, nome")
      .eq("nome", p.nome)
      .maybeSingle();

    let prodId = prodExistente?.id;

    if (!prodExistente) {
      const { data: novoProduto, error: errP } = await supabase
        .from("produtos")
        .insert({
          nome: p.nome,
          descricao: p.descricao,
          categoria_id: catId,
          preco: p.preco,
          custo: 0,
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
      } else {
        prodId = novoProduto.id;
        totalInseridos++;
      }
    } else {
      await supabase
        .from("produtos")
        .update({
          descricao: p.descricao,
          categoria_id: catId,
          preco: p.preco,
          ativo: true,
          aparece_no_pedido: true,
          envia_para_cozinha: p.envia_para_cozinha,
          produto_fechado: p.produto_fechado,
          permite_sabor: p.permite_sabor,
          permite_adicionais: p.permite_adicionais,
        })
        .eq("id", prodId);
    }

    // Associa sabores se for shake
    if (prodId && p.permite_sabor && p.categoria === "Shakes") {
      for (const saborId of mapSabores.values()) {
        try {
          await supabase.from("produto_sabores").upsert({
            produto_id: prodId,
            sabor_id: saborId,
          });
        } catch {
          // ignora duplicidade
        }
      }
    }

    // Associa adicionais se permitir
    if (prodId && p.permite_adicionais) {
      for (const adicionalId of mapAdicionais.values()) {
        try {
          await supabase.from("produto_adicionais").upsert({
            produto_id: prodId,
            adicional_id: adicionalId,
          });
        } catch {
          // ignora duplicidade
        }
      }
    }
  }

  console.log(`Concluído! ${totalInseridos} produtos novos inseridos.`);
}

seed();
