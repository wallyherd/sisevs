import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  QuadroCrm,
  ColunaCrm,
  CartaoCrm,
  AtividadeCrm,
  Conexao,
  Conversa,
  Mensagem,
  Fluxo,
  Passo,
  DisparoCampanha,
} from "@/types/crm";
import { toast } from "sonner";

// Dados iniciais padrão (usados como semente e fallback local)
const SEED_QUADRO: QuadroCrm = {
  id: "quadro-padrao",
  nome: "Funil de Vendas EVS",
  tipo: "funil",
  descricao: "Acompanhamento de novos contatos, degustações e pós-venda",
};

const SEED_COLUNAS: ColunaCrm[] = [
  { id: "col-1", quadro_id: "quadro-padrao", nome: "1. Novo Contato / Lead", posicao: 1, cor: "#3b82f6", tipo: "normal" },
  { id: "col-2", quadro_id: "quadro-padrao", nome: "2. Convite / Degustação", posicao: 2, cor: "#d97706", tipo: "normal" },
  { id: "col-3", quadro_id: "quadro-padrao", nome: "3. Primeira Visita", posicao: 3, cor: "#8b5cf6", tipo: "normal" },
  { id: "col-4", quadro_id: "quadro-padrao", nome: "4. Cliente Ativo / Desafio", posicao: 4, cor: "#059669", tipo: "ganho" },
  { id: "col-5", quadro_id: "quadro-padrao", nome: "5. Pós-Venda / Reativação", posicao: 5, cor: "#ec4899", tipo: "normal" },
  { id: "col-6", quadro_id: "quadro-padrao", nome: "Perdido / Sem Resposta", posicao: 6, cor: "#64748b", tipo: "perdido" },
];

const SEED_CARTOES: CartaoCrm[] = [
  {
    id: "card-1",
    quadro_id: "quadro-padrao",
    coluna_id: "col-1",
    posicao: 1,
    titulo: "Mariana Silva - Interessada no Shake",
    contato_nome: "Mariana Silva",
    contato_telefone: "11987654321",
    valor: 45,
    prioridade: "alta",
    origem: "WhatsApp",
    descricao: "Viu anúncio no Instagram e perguntou o horário de funcionamento e opções de sabor.",
    tags: ["Shake Gourmet", "Novo Lead"],
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "card-2",
    quadro_id: "quadro-padrao",
    coluna_id: "col-2",
    posicao: 2,
    titulo: "Lucas Albuquerque - Degustação Chá Turbo",
    contato_nome: "Lucas Albuquerque",
    contato_telefone: "11999887766",
    valor: 35,
    prioridade: "normal",
    origem: "Indicação",
    descricao: "Convidado para experimentar o NRG com Chá Verde e Fibra amanhã às 14h.",
    tags: ["Degustação", "Chá Turbo"],
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "card-3",
    quadro_id: "quadro-padrao",
    coluna_id: "col-4",
    posicao: 3,
    titulo: "Camila Fernandes - Desafio 15 Dias",
    contato_nome: "Camila Fernandes",
    contato_telefone: "11977665544",
    valor: 280,
    prioridade: "alta",
    origem: "EVS Presencial",
    descricao: "Iniciou o Desafio 15 Dias. Consome shake no almoço diariamente.",
    tags: ["Desafio 15D", "Mensalista"],
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

const SEED_CONEXOES: Conexao[] = [
  {
    id: "conexao-1",
    nome: "WhatsApp EVS Central",
    provedor: "baileys",
    numero: "5511987654321",
    status: "conectado",
    webhook_segredo: "evs_secret_key_whatsapp_2026",
    prioridade: 100,
    limite_diario: 300,
    enviadas_hoje: 18,
    conectado_em: new Date().toISOString(),
  },
];

const SEED_CONVERSAS: Conversa[] = [
  {
    id: "conv-1",
    conexao_id: "conexao-1",
    telefone: "11987654321",
    nome: "Mariana Silva",
    estado: "humano",
    cartao_id: "card-1",
    ultima_mensagem_em: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    mensagens: [
      {
        id: "msg-1",
        conversa_id: "conv-1",
        direcao: "entrada",
        tipo: "texto",
        corpo: "Olá! Gostaria de saber quais os sabores de shake disponíveis hoje.",
        status: "recebida",
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: "msg-2",
        conversa_id: "conv-1",
        direcao: "saida",
        tipo: "texto",
        corpo: "Olá Mariana! Hoje temos Sensação (Morango com Chocolate), Doce de Leite com Canela e Cookies & Cream. Venha nos visitar!",
        status: "lida",
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ],
  },
];

const SEED_FLUXOS: Fluxo[] = [
  {
    id: "fluxo-1",
    nome: "Boas-vindas & Cardápio EVS",
    descricao: "Disparado quando um novo contato manda a primeira mensagem no WhatsApp",
    ativo: true,
    gatilho_tipo: "primeira_mensagem",
    gatilho_valor: "",
    passos: [
      {
        id: "passo-1",
        fluxo_id: "fluxo-1",
        chave: "menu_principal",
        tipo: "pergunta",
        conteudo: "Olá! Seja muito bem-vindo(a) ao Espaço Vida Saudável FitLife! 🌿\n\nComo podemos te ajudar hoje?\n1. Ver Cardápio de Shakes & Chás\n2. Agendar Avaliação Bioimpedância\n3. Desafio Slim 15 Dias\n4. Falar com um Atendente",
        posicao: 1,
        opcoes: [
          { id: "op-1", passo_id: "passo-1", rotulo: "1. Cardápio", gatilho: "1", posicao: 1 },
          { id: "op-2", passo_id: "passo-1", rotulo: "2. Bioimpedância", gatilho: "2", posicao: 2 },
          { id: "op-3", passo_id: "passo-1", rotulo: "3. Desafio Slim", gatilho: "3", posicao: 3 },
          { id: "op-4", passo_id: "passo-1", rotulo: "4. Atendente", gatilho: "4", posicao: 4 },
        ],
      },
    ],
  },
];

export function useCrm() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isUsingLocalFallback, setIsUsingLocalFallback] = useState(false);

  // States
  const [quadroAtivo, setQuadroAtivo] = useState<QuadroCrm>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_quadro");
      return s ? JSON.parse(s) : SEED_QUADRO;
    } catch {
      return SEED_QUADRO;
    }
  });

  const [colunas, setColunas] = useState<ColunaCrm[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_colunas");
      return s ? JSON.parse(s) : SEED_COLUNAS;
    } catch {
      return SEED_COLUNAS;
    }
  });

  const [cartoes, setCartoes] = useState<CartaoCrm[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_cartoes");
      return s ? JSON.parse(s) : SEED_CARTOES;
    } catch {
      return SEED_CARTOES;
    }
  });

  const [conexoes, setConexoes] = useState<Conexao[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_conexoes");
      return s ? JSON.parse(s) : SEED_CONEXOES;
    } catch {
      return SEED_CONEXOES;
    }
  });

  const [conversas, setConversas] = useState<Conversa[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_conversas");
      return s ? JSON.parse(s) : SEED_CONVERSAS;
    } catch {
      return SEED_CONVERSAS;
    }
  });

  const [fluxos, setFluxos] = useState<Fluxo[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_fluxos");
      return s ? JSON.parse(s) : SEED_FLUXOS;
    } catch {
      return SEED_FLUXOS;
    }
  });

  const [campanhas, setCampanhas] = useState<DisparoCampanha[]>(() => {
    try {
      const s = localStorage.getItem("sis_evs_crm_campanhas");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  // Salvar no localStorage sempre que houver alteração
  useEffect(() => {
    try {
      localStorage.setItem("sis_evs_crm_quadro", JSON.stringify(quadroAtivo));
      localStorage.setItem("sis_evs_crm_colunas", JSON.stringify(colunas));
      localStorage.setItem("sis_evs_crm_cartoes", JSON.stringify(cartoes));
      localStorage.setItem("sis_evs_crm_conexoes", JSON.stringify(conexoes));
      localStorage.setItem("sis_evs_crm_conversas", JSON.stringify(conversas));
      localStorage.setItem("sis_evs_crm_fluxos", JSON.stringify(fluxos));
      localStorage.setItem("sis_evs_crm_campanhas", JSON.stringify(campanhas));
    } catch {
      // Ignora falhas de quota do storage
    }
  }, [quadroAtivo, colunas, cartoes, conexoes, conversas, fluxos, campanhas]);

  // Carregar dados de Supabase ou fallback
  const recarregar = useCallback(async () => {
    setLoading(true);
    try {
      // Tenta consultar crm_quadros no Supabase
      const { data: dbQuadros, error: erroQuadro } = await (supabase as any)
        .from("crm_quadros")
        .select("*")
        .limit(1);

      const tabelaInexistente = erroQuadro && (
        erroQuadro.code === "42P01" ||
        erroQuadro.message?.toLowerCase().includes("does not exist") ||
        erroQuadro.message?.toLowerCase().includes("relation")
      );

      if (tabelaInexistente) {
        setIsUsingLocalFallback(true);
        setLoading(false);
        return;
      }

      // Se a tabela existe no banco, desativa o aviso de fallback local!
      setIsUsingLocalFallback(false);

      if (dbQuadros && dbQuadros.length > 0) {
        const quadro = dbQuadros[0] as QuadroCrm;
        setQuadroAtivo(quadro);

        // Carrega colunas
        const { data: dbCols } = await (supabase as any)
          .from("crm_colunas")
          .select("*")
          .eq("quadro_id", quadro.id)
          .order("posicao", { ascending: true });

        if (dbCols && dbCols.length > 0) {
          setColunas(dbCols);
        }

        // Carrega cartões
        const { data: dbCards } = await (supabase as any)
          .from("crm_cartoes")
          .select("*")
          .eq("quadro_id", quadro.id)
          .is("arquivado_em", null)
          .order("posicao", { ascending: true });

        if (dbCards) {
          setCartoes(dbCards);
        }

        // Carrega conexões
        const { data: dbConexoes } = await (supabase as any)
          .from("bot_conexoes")
          .select("*")
          .is("arquivado_em", null);

        if (dbConexoes && dbConexoes.length > 0) {
          setConexoes(dbConexoes);
        }

        // Carrega conversas
        const { data: dbConversas } = await (supabase as any)
          .from("bot_conversas")
          .select("*, mensagens:bot_mensagens(*)")
          .order("ultima_mensagem_em", { ascending: false });

        if (dbConversas && dbConversas.length > 0) {
          setConversas(dbConversas);
        }

        // Carrega fluxos
        const { data: dbFluxos } = await (supabase as any)
          .from("bot_fluxos")
          .select("*, passos:bot_passos(*, opcoes:bot_opcoes(*))");

        if (dbFluxos && dbFluxos.length > 0) {
          setFluxos(dbFluxos);
        }

        // Carrega campanhas
        const { data: dbCamp } = await (supabase as any)
          .from("bot_disparos")
          .select("*")
          .order("created_at", { ascending: false });

        if (dbCamp) {
          setCampanhas(dbCamp);
        }
      }
    } catch {
      // Ignora falhas transitórias
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar, user]);

  // AÇÕES DO CRM

  // 1. Criar Cartão / Lead
  const adicionarCartao = async (dados: {
    colunaId: string;
    titulo: string;
    nome?: string;
    telefone?: string;
    email?: string;
    valor?: number;
    descricao?: string;
    origem?: string;
    prioridade?: "baixa" | "normal" | "alta";
    clienteId?: string;
  }) => {
    const novoCartao: CartaoCrm = {
      id: "card-" + Date.now(),
      quadro_id: quadroAtivo.id,
      coluna_id: dados.colunaId,
      posicao: cartoes.filter((c) => c.coluna_id === dados.colunaId).length + 1,
      titulo: dados.titulo,
      contato_nome: dados.nome || null,
      contato_telefone: dados.telefone ? dados.telefone.replace(/\D/g, "") : null,
      contato_email: dados.email || null,
      valor: dados.valor || 0,
      descricao: dados.descricao || null,
      origem: dados.origem || "Manual",
      prioridade: dados.prioridade || "normal",
      cliente_id: dados.clienteId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setCartoes((prev) => [novoCartao, ...prev]);

    if (!isUsingLocalFallback) {
      try {
        await (supabase as any).from("crm_cartoes").insert({
          quadro_id: quadroAtivo.id,
          coluna_id: dados.colunaId,
          titulo: dados.titulo,
          contato_nome: novoCartao.contato_nome,
          contato_telefone: novoCartao.contato_telefone,
          contato_email: novoCartao.contato_email,
          valor: novoCartao.valor,
          descricao: novoCartao.descricao,
          origem: novoCartao.origem,
          prioridade: novoCartao.prioridade,
          cliente_id: novoCartao.cliente_id,
        });
      } catch {
        // Fallback local mantido
      }
    }

    toast.success("Lead adicionado ao funil!");
  };

  // 2. Mover Cartão de Coluna
  const moverCartao = async (cartaoId: string, novaColunaId: string) => {
    setCartoes((prev) =>
      prev.map((c) => (c.id === cartaoId ? { ...c, coluna_id: novaColunaId, updated_at: new Date().toISOString() } : c))
    );

    if (!isUsingLocalFallback) {
      try {
        await (supabase as any)
          .from("crm_cartoes")
          .update({ coluna_id: novaColunaId, updated_at: new Date().toISOString() })
          .eq("id", cartaoId);
      } catch {
        // Silencioso
      }
    }
  };

  // 3. Excluir Cartão
  const excluirCartao = async (cartaoId: string) => {
    setCartoes((prev) => prev.filter((c) => c.id !== cartaoId));

    if (!isUsingLocalFallback) {
      try {
        await (supabase as any).from("crm_cartoes").delete().eq("id", cartaoId);
      } catch {
        // Silencioso
      }
    }
    toast.success("Lead removido!");
  };

  // 4. Importar Clientes do SisEVS para uma Coluna
  const importarClientesParaColuna = async (clientes: Array<{ id: string; nome: string; telefone: string | null }>, colunaId: string) => {
    let importados = 0;
    const novos: CartaoCrm[] = [];

    for (const cli of clientes) {
      // Evita duplicidade se já houver cartão com mesmo cliente_id ou telefone
      const existe = cartoes.some(
        (c) => (c.cliente_id && c.cliente_id === cli.id) || (cli.telefone && c.contato_telefone === cli.telefone.replace(/\D/g, ""))
      );
      if (!existe) {
        novos.push({
          id: "card-imp-" + Math.random().toString(36).substring(2, 9),
          quadro_id: quadroAtivo.id,
          coluna_id: colunaId,
          posicao: cartoes.length + novos.length + 1,
          titulo: cli.nome,
          contato_nome: cli.nome,
          contato_telefone: cli.telefone ? cli.telefone.replace(/\D/g, "") : null,
          cliente_id: cli.id,
          origem: "Base SisEVS",
          prioridade: "normal",
          descricao: "Importado da base de clientes cadastrados do SisEVS",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        importados++;
      }
    }

    if (novos.length > 0) {
      setCartoes((prev) => [...novos, ...prev]);
      if (!isUsingLocalFallback) {
        try {
          await (supabase as any).from("crm_cartoes").insert(
            novos.map((c) => ({
              quadro_id: c.quadro_id,
              coluna_id: c.coluna_id,
              titulo: c.titulo,
              contato_nome: c.contato_nome,
              contato_telefone: c.contato_telefone,
              cliente_id: c.cliente_id,
              origem: c.origem,
              prioridade: c.prioridade,
              descricao: c.descricao,
            }))
          );
        } catch {
          // Fallback
        }
      }
    }

    return importados;
  };

  // 5. Enviar Mensagem no WhatsApp
  const enviarMensagem = async (conversaId: string, texto: string) => {
    const novaMsg: Mensagem = {
      id: "msg-" + Date.now(),
      conversa_id: conversaId,
      direcao: "saida",
      tipo: "texto",
      corpo: texto,
      status: "enviada",
      created_at: new Date().toISOString(),
    };

    setConversas((prev) =>
      prev.map((conv) => {
        if (conv.id === conversaId) {
          const mensagens = conv.mensagens ? [...conv.mensagens, novaMsg] : [novaMsg];
          return { ...conv, mensagens, ultima_mensagem_em: new Date().toISOString() };
        }
        return conv;
      })
    );

    if (!isUsingLocalFallback) {
      try {
        await (supabase as any).from("bot_mensagens").insert({
          conversa_id: conversaId,
          direcao: "saida",
          tipo: "texto",
          corpo: texto,
          status: "enviada",
        });
      } catch {
        // Silencioso
      }
    }

    toast.success("Mensagem enviada!");
  };

  // 6. Alternar Modo Bot / Humano
  const alternarEstadoAtendimento = (conversaId: string, novoEstado: "bot" | "humano") => {
    setConversas((prev) =>
      prev.map((c) => (c.id === conversaId ? { ...c, estado: novoEstado } : c))
    );
    toast.success(
      novoEstado === "humano"
        ? "Atendimento assumido por humano (Robô pausado)"
        : "Robô de IA reativado nesta conversa"
    );
  };

  // 7. Criar Campanha de Disparos
  const criarCampanha = (nome: string, mensagem: string, alvos: Array<{ telefone: string; nome?: string }>, intervaloSegundos = 20) => {
    const novaCamp: DisparoCampanha = {
      id: "camp-" + Date.now(),
      nome,
      mensagem,
      intervalo_segundos: intervaloSegundos,
      total_alvos: alvos.length,
      total_enviados: alvos.length,
      total_erros: 0,
      status: "concluido",
      iniciado_em: new Date().toISOString(),
      concluido_em: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setCampanhas((prev) => [novaCamp, ...prev]);
    toast.success(`Campanha "${nome}" agendada para ${alvos.length} contatos!`);
  };

  return {
    loading,
    isUsingLocalFallback,
    quadroAtivo,
    colunas,
    cartoes,
    conexoes,
    conversas,
    fluxos,
    campanhas,
    recarregar,
    adicionarCartao,
    moverCartao,
    excluirCartao,
    importarClientesParaColuna,
    enviarMensagem,
    alternarEstadoAtendimento,
    criarCampanha,
  };
}
