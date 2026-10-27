import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import {
  UtensilsCrossed,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Clock,
  Sparkles,
  MapPin,
  Phone,
  LogIn,
  LogOut,
  User,
  Users,
  CheckCircle2,
  ChefHat,
  Receipt,
  MessageCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  CupSoda,
  Cookie,
  Package,
} from "lucide-react";
import {
  ESTABELECIMENTO,
  CATEGORIAS_EVS,
  PRODUTOS_EVS,
  GrupoOpcoes,
} from "@/data/cardapio-data";
import { extrairImagemDeDescricao, limparDescricao } from "@/lib/upload-produto-imagem";

import { z } from "zod";

export const Route = createFileRoute("/cardapio")({
  head: () => ({
    meta: [
      { title: `${ESTABELECIMENTO.nome} — Cardápio Digital & Delivery` },
      { name: "description", content: ESTABELECIMENTO.descricao },
    ],
  }),
  validateSearch: (search) => z.object({ mesa: z.string().optional() }).parse(search),
  component: CardapioDigitalPage,
});

type Categoria = { id: string; nome: string; ativo: boolean };
type Sabor = { id: string; nome: string; ativo: boolean };
type Adicional = { id: string; nome: string; preco: number; ativo: boolean };

type Produto = {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_id: string | null;
  preco: number;
  custo: number;
  ativo: boolean;
  aparece_no_pedido: boolean;
  envia_para_cozinha: boolean;
  produto_fechado: boolean;
  permite_sabor: boolean;
  permite_adicionais: boolean;
  categoria?: { nome: string } | null;
  produto_sabores?: { sabor_id: string }[];
  produto_adicionais?: { adicional_id: string }[];
  imagem_url?: string | null;
  group_name?: string;
  option_groups?: GrupoOpcoes[];
  controla_estoque?: boolean;
  estoque_item_id?: string | null;
  estoque_item?: { quantidade_atual: number } | null;
};

type ItemCarrinho = {
  id: string;
  produto: Produto;
  quantidade: number;
  sabor: string | null;
  adicionais: { nome: string; preco: number }[];
  observacoes: string;
  precoTotalUnitario: number;
};

function CardapioDigitalPage() {
  const qc = useQueryClient();

  // Estados de navegação e filtros
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  // Carrinho e Modais
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [produtoModal, setProdutoModal] = useState<Produto | null>(null);

  // Customização do produto no modal
  const [saborSelecionado, setSaborSelecionado] = useState<string>("");
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<{ nome: string; preco: number }[]>([]);
  const [opcoesPorGrupo, setOpcoesPorGrupo] = useState<Record<number, number[]>>({});
  const [qtdModal, setQtdModal] = useState<number>(1);
  const [obsModal, setObsModal] = useState<string>("");
  // Estados do Cliente & Pedido
  const { mesa: urlMesaId } = Route.useSearch();
  const [tipoEntrega, setTipoEntrega] = useState<"local" | "balcao" | "delivery">(urlMesaId ? "local" : "local");
  const [mesaId, setMesaId] = useState<string>(urlMesaId || "");
  const [modoMesa, setModoMesa] = useState<"junto" | "separado">("separado");
  const [endereco, setEndereco] = useState<string>("");
  const [clienteNome, setClienteNome] = useState<string>("");
  const [clienteTelefone, setClienteTelefone] = useState<string>("");
  const [obsPedido, setObsPedido] = useState<string>("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [detalhesMesa, setDetalhesMesa] = useState<any>(null);

  // Buscar detalhes da mesa se vier na URL
  useEffect(() => {
    if (urlMesaId) {
      (supabase.from("mesas" as any) as any).select("*").eq("id", urlMesaId).single().then(({ data }: any) => {
        if (data) setDetalhesMesa(data);
      });
    }
  }, [urlMesaId]);

  // Pedido Confirmado
  const [pedidoConfirmado, setPedidoConfirmado] = useState<{
    id: string;
    numero: number;
    total: number;
    clienteNome: string;
    itens: ItemCarrinho[];
  } | null>(null);

  // ─────────────────────── AUTENTICAÇÃO DO CLIENTE ───────────────────────
  const [authModalAberto, setAuthModalAberto] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authNome, setAuthNome] = useState("");
  const [authTelefone, setAuthTelefone] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  // Modal de Histórico de Pedidos
  const [historicoAberto, setHistoricoAberto] = useState(false);

  // Verificar sessão do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserSession(data.session?.user ?? null);
      if (data.session?.user) {
        setClienteNome(data.session.user.user_metadata?.nome || "");
        if (data.session.user.user_metadata?.telefone) {
          setClienteTelefone(data.session.user.user_metadata.telefone);
        }
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setUserSession(sess?.user ?? null);
      if (sess?.user) {
        setClienteNome(sess.user.user_metadata?.nome || "");
        if (sess.user.user_metadata?.telefone) {
          setClienteTelefone(sess.user.user_metadata.telefone);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Login / Cadastro
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });

        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        setUserSession(data.user);
        if (data.user?.user_metadata?.nome) {
          setClienteNome(data.user.user_metadata.nome);
        }
        if (data.user?.user_metadata?.telefone) {
          setClienteTelefone(data.user.user_metadata.telefone);
        }
        setAuthModalAberto(false);
      } else {
        const telLimpo = authTelefone.replace(/\D/g, "");
        const { data, error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
          options: {
            data: {
              nome: authNome.trim(),
              telefone: telLimpo,
            },
          },
        });

        if (error) throw error;

        // Sincronizar na tabela clientes do SisEVS para alimentar o CRM/painel
        try {
          const { data: existe } = await supabase
            .from("clientes")
            .select("id")
            .eq("telefone", telLimpo)
            .maybeSingle();

          if (!existe && authNome.trim()) {
            await supabase.from("clientes").insert({
              nome: authNome.trim(),
              telefone: telLimpo || null,
              observacoes: `Cadastrado pelo Cardápio Digital (${authEmail.trim()})`,
            });
          }
        } catch (e) {
          console.warn("Aviso ao sincronizar cliente no CRM:", e);
        }

        if (data?.session) {
          toast.success("Conta criada e conectada com sucesso!");
          setUserSession(data.session.user);
          setClienteNome(authNome.trim());
          setClienteTelefone(telLimpo);
          setAuthModalAberto(false);
        } else {
          // Tentar login direto caso a confirmação não seja necessária
          const { data: loginData } = await supabase.auth.signInWithPassword({
            email: authEmail.trim(),
            password: authPassword,
          });
          if (loginData?.session) {
            toast.success("Conta criada e conectada com sucesso!");
            setUserSession(loginData.session.user);
            setClienteNome(authNome.trim());
            setClienteTelefone(telLimpo);
          } else {
            toast.success("Conta criada com sucesso! Você já pode realizar seus pedidos.");
          }
          setAuthModalAberto(false);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação. Tente novamente.");
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout
  async function handleLogout() {
    await supabase.auth.signOut();
    setUserSession(null);
    setClienteNome("");
    setClienteTelefone("");
    toast.info("Você saiu da sua conta.");
  }

  // 1. Carregar Categorias
  const { data: categoriasBanco = [] } = useQuery({
    queryKey: ["cardapio-categorias"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categorias_produtos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      return (data ?? []) as Categoria[];
    },
  });

  // 2. Carregar Sabores
  const { data: todosSabores = [] } = useQuery({
    queryKey: ["cardapio-sabores"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sabores")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      return (data ?? []) as Sabor[];
    },
  });

  // 3. Carregar Adicionais
  const { data: todosAdicionais = [] } = useQuery({
    queryKey: ["cardapio-adicionais"],
    queryFn: async () => {
      const { data } = await supabase
        .from("adicionais")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      return (data ?? []) as Adicional[];
    },
  });

  // 4. Carregar Produtos Ativos
  const { data: produtosBanco = [], isLoading: carregandoProdutos } = useQuery({
    queryKey: ["cardapio-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categoria:categorias_produtos(nome), produto_sabores(sabor_id), produto_adicionais(adicional_id), estoque_item:estoque_itens(quantidade_atual)")
        .eq("ativo", true)
        .eq("aparece_no_pedido", true)
        .order("nome");

      if (error) {
        console.warn("Aviso ao carregar produtos:", error);
        return [];
      }
      return (data ?? []) as unknown as Produto[];
    },
  });

  // 5. Carregar Histórico de Pedidos do Cliente
  const { data: meusPedidos = [] } = useQuery({
    queryKey: ["meus-pedidos-cardapio", clienteTelefone, userSession?.id],
    enabled: !!(clienteTelefone || userSession),
    queryFn: async () => {
      const telLimpo = clienteTelefone.replace(/\D/g, "");
      let q = supabase
        .from("pedidos")
        .select("id, numero, total, data_hora, status_comanda, status_pedido, status_pagamento, observacoes, itens:pedido_itens(nome_produto, quantidade, sabor, subtotal)")
        .order("data_hora", { ascending: false })
        .limit(10);

      if (userSession?.id) {
        q = q.eq("usuario_id", userSession.id);
      } else if (telLimpo) {
        q = q.eq("cliente_telefone_rapido", telLimpo);
      } else {
        return [];
      }

      const { data } = await q;
      return data ?? [];
    },
  });

  // Catálogo Integrado: banco de dados enriquecido com as imagens e grupos de opções
  const produtos: Produto[] = useMemo(() => {
    const catalogoFormatado: Produto[] = PRODUTOS_EVS.map((p) => ({
      id: `evs-${p.id}`,
      nome: p.name,
      descricao: p.description,
      categoria_id: p.group_name,
      preco: p.price,
      custo: 0,
      ativo: true,
      aparece_no_pedido: true,
      envia_para_cozinha: p.group_name === "Shakes" || p.group_name.includes("SLIMDAY"),
      produto_fechado: p.group_name === "Produtos a Pronta Entrega",
      permite_sabor: p.optionGroups.some((og) => og.name.toLowerCase().includes("sabor")),
      permite_adicionais: p.optionGroups.some(
        (og) => og.name.toLowerCase().includes("adicional") || og.name.toLowerCase().includes("fibra")
      ),
      categoria: { nome: p.group_name },
      group_name: p.group_name,
      imagem_url: p.image,
      option_groups: p.optionGroups,
    }));

    if (!produtosBanco || produtosBanco.length === 0) {
      return catalogoFormatado;
    }

    const doBancoComFotos: Produto[] = produtosBanco.map((pb) => {
      const match = PRODUTOS_EVS.find(
        (p) => p.name.toLowerCase() === pb.nome.toLowerCase() || pb.nome.toLowerCase().includes(p.name.toLowerCase())
      );
      const customImg = (pb as any).imagem_url || extrairImagemDeDescricao(pb.descricao);
      return {
        ...pb,
        descricao: limparDescricao(pb.descricao),
        imagem_url: customImg || match?.image || null,
        option_groups: match?.optionGroups,
        controla_estoque: (pb as any).controla_estoque,
        estoque_item: (pb as any).estoque_item,
      };
    });

    const nomesBanco = new Set(doBancoComFotos.map((p) => p.nome.toLowerCase().trim()));
    const restantes = catalogoFormatado.filter((p) => !nomesBanco.has(p.nome.toLowerCase().trim()));

    return [...doBancoComFotos, ...restantes];
  }, [produtosBanco]);

  // Lista consolidada de categorias
  const categorias = useMemo(() => {
    const setCategorias = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria?.nome) setCategorias.add(p.categoria.nome);
      else if (p.group_name) setCategorias.add(p.group_name);
    });

    if (setCategorias.size === 0) {
      return CATEGORIAS_EVS.map((c) => ({ id: c.nome, nome: c.nome, ativo: true }));
    }

    return Array.from(setCategorias).map((nome) => ({
      id: nome,
      nome,
      ativo: true,
    }));
  }, [produtos]);

  // Filtragem dos Produtos por busca e categoria
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const catNome = p.categoria?.nome || p.group_name || "";
      const matchCategoria = categoriaAtiva === "todos" || catNome === categoriaAtiva || p.categoria_id === categoriaAtiva;
      const matchBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase())) ||
        catNome.toLowerCase().includes(busca.toLowerCase());
      return matchCategoria && matchBusca;
    });
  }, [produtos, categoriaAtiva, busca]);

  // Abertura do Modal de Personalização
  function abrirModalProduto(p: Produto) {
    setProdutoModal(p);
    setQtdModal(1);
    setObsModal("");
    setSaborSelecionado("");
    setAdicionaisSelecionados([]);

    const initOptions: Record<number, number[]> = {};
    if (p.option_groups && p.option_groups.length > 0) {
      p.option_groups.forEach((og) => {
        if (og.min === 1 && og.max === 1 && og.options.length > 0) {
          initOptions[og.id] = [og.options[0].id];
        } else {
          initOptions[og.id] = [];
        }
      });
    }
    setOpcoesPorGrupo(initOptions);
  }

  // Alternar opção dentro de um grupo dinâmico
  function toggleOpcaoGrupo(groupId: number, optionId: number, max: number) {
    setOpcoesPorGrupo((prev) => {
      const atuais = prev[groupId] || [];
      const jaSelecionada = atuais.includes(optionId);

      if (jaSelecionada) {
        return {
          ...prev,
          [groupId]: atuais.filter((id) => id !== optionId),
        };
      }

      if (max === 1) {
        return {
          ...prev,
          [groupId]: [optionId],
        };
      }

      if (atuais.length < max) {
        return {
          ...prev,
          [groupId]: [...atuais, optionId],
        };
      }

      toast.info(`Você já selecionou o limite máximo de ${max} opção(ões) para este item.`);
      return prev;
    });
  }

  // Preço unitário dinâmico no modal
  const precoTotalUnitarioModal = useMemo(() => {
    if (!produtoModal) return 0;

    let somaOpcoes = 0;
    if (produtoModal.option_groups && produtoModal.option_groups.length > 0) {
      produtoModal.option_groups.forEach((group) => {
        const selecionados = opcoesPorGrupo[group.id] || [];
        selecionados.forEach((optId) => {
          const opt = group.options.find((o) => o.id === optId);
          if (opt && opt.price > 0) {
            somaOpcoes += Number(opt.price);
          }
        });
      });
    } else {
      somaOpcoes = adicionaisSelecionados.reduce((acc, a) => acc + Number(a.preco || 0), 0);
    }

    return Number(produtoModal.preco) + somaOpcoes;
  }, [produtoModal, opcoesPorGrupo, adicionaisSelecionados]);

  // Adicionar ao Carrinho
  function adicionarAoCarrinho() {
    if (!produtoModal) return;

    let saborFinal: string | null = null;
    const adicionaisFinais: { nome: string; preco: number }[] = [];

    if (produtoModal.option_groups && produtoModal.option_groups.length > 0) {
      const resumoSabores: string[] = [];

      for (const group of produtoModal.option_groups) {
        const selecionados = opcoesPorGrupo[group.id] || [];

        if (group.min > 0 && selecionados.length < group.min) {
          toast.warning(`Por favor, selecione pelo menos ${group.min} opção(ões) em "${group.name}".`);
          return;
        }

        const nomes = selecionados
          .map((id) => {
            const opt = group.options.find((o) => o.id === id);
            if (!opt) return null;
            if (opt.price > 0) {
              adicionaisFinais.push({ nome: opt.name, preco: opt.price });
            }
            return opt.name;
          })
          .filter(Boolean) as string[];

        if (nomes.length > 0) {
          resumoSabores.push(`${group.name}: ${nomes.join(", ")}`);
        }
      }

      saborFinal = resumoSabores.length > 0 ? resumoSabores.join(" | ") : null;
    } else {
      const saboresDoProduto = todosSabores.filter((s) =>
        produtoModal.produto_sabores?.some((ps) => ps.sabor_id === s.id)
      );
      if (produtoModal.permite_sabor && saboresDoProduto.length > 0 && !saborSelecionado) {
        toast.warning("Por favor, selecione um sabor para este item.");
        return;
      }
      saborFinal = saborSelecionado || null;
      adicionaisFinais.push(...adicionaisSelecionados);
    }

    const novoItem: ItemCarrinho = {
      id: `${produtoModal.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      produto: produtoModal,
      quantidade: qtdModal,
      sabor: saborFinal,
      adicionais: adicionaisFinais,
      observacoes: obsModal.trim(),
      precoTotalUnitario: precoTotalUnitarioModal,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setProdutoModal(null);
    toast.success(`${qtdModal}x ${produtoModal.nome} adicionado à sacola!`);
  }

  function alterarQtdCarrinho(id: string, delta: number) {
    setCarrinho((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const novaQtd = it.quantidade + delta;
            return novaQtd > 0 ? { ...it, quantidade: novaQtd } : null;
          }
          return it;
        })
        .filter(Boolean) as ItemCarrinho[]
    );
  }

  function removerItemCarrinho(id: string) {
    setCarrinho((prev) => prev.filter((it) => it.id !== id));
  }

  const totalItensCarrinho = useMemo(
    () => carrinho.reduce((acc, it) => acc + it.quantidade, 0),
    [carrinho]
  );

  const valorTotalCarrinho = useMemo(
    () => carrinho.reduce((acc, it) => acc + it.precoTotalUnitario * it.quantidade, 0),
    [carrinho]
  );

  // ─────────────────────── SUGESTÕES COMPLEMENTARES (UPSELL / ORDER BUMP) ───────────────────────
  const sugestoesComplementares = useMemo(() => {
    if (carrinho.length === 0) return [];

    const nomesNoCarrinho = new Set(
      carrinho.map((c) => c.produto.nome.toLowerCase().trim())
    );
    const idsNoCarrinho = new Set(carrinho.map((c) => c.produto.id));

    // Produtos disponíveis que:
    // 1. Estão ativos e têm preço de até R$ 10,00
    // 2. Não estão no carrinho
    // 3. Têm estoque disponível
    const disponiveis = produtos.filter((p) => {
      if (!p.ativo) return false;
      if (typeof p.preco !== "number" || p.preco <= 0 || p.preco > 10) return false;

      const nomeLimpo = p.nome.toLowerCase().trim();
      if (nomesNoCarrinho.has(nomeLimpo) || idsNoCarrinho.has(p.id)) return false;

      // Validação de estoque
      if (p.controla_estoque === false) {
        return true;
      }
      if (p.estoque_item) {
        const qtd = Number(p.estoque_item.quantidade_atual);
        return !isNaN(qtd) && qtd > 0;
      }
      if (p.controla_estoque === true) {
        return false;
      }

      return true;
    });

    if (disponiveis.length === 0) return [];

    // Embaralhamento aleatório (Fisher-Yates) para que a sugestão seja variada e dinâmica
    const embaralhados = [...disponiveis];
    for (let i = embaralhados.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [embaralhados[i], embaralhados[j]] = [embaralhados[j], embaralhados[i]];
    }

    return embaralhados.slice(0, 1);
  }, [produtos, carrinho]);

  function gerarFraseSugestao(prod: Produto): string {
    const nomeLower = prod.nome.toLowerCase();
    const precoFormatado = brl(prod.preco);

    if (
      nomeLower.includes("brigadeiro") ||
      nomeLower.includes("pão de mel") ||
      nomeLower.includes("donut") ||
      nomeLower.includes("doce")
    ) {
      return `com mais ${precoFormatado} leve "${prod.nome}". Quer?`;
    }
    if (
      nomeLower.includes("cápsula") ||
      nomeLower.includes("multivitamina") ||
      nomeLower.includes("fiberbond") ||
      nomeLower.includes("ômega") ||
      nomeLower.includes("xtra-cal")
    ) {
      return `Deseja acrescentar "${prod.nome}" por apenas +${precoFormatado} para acompanhar?`;
    }
    if (
      nomeLower.includes("água") ||
      nomeLower.includes("chá") ||
      nomeLower.includes("drink") ||
      nomeLower.includes("suco")
    ) {
      return `Que tal acrescentar "${prod.nome}" por apenas +${precoFormatado} para acompanhar sua refeição?`;
    }
    return `Leve também "${prod.nome}" por apenas +${precoFormatado}. Deseja adicionar?`;
  }

  function adicionarSugestaoAoCarrinho(prod: Produto) {
    const temOpcoesObrigatorias =
      prod.option_groups?.some((og) => og.min > 0) ||
      (prod.permite_sabor && !prod.produto_sabores?.length);

    if (temOpcoesObrigatorias) {
      abrirModalProduto(prod);
      return;
    }

    const novoItem: ItemCarrinho = {
      id: `${prod.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      produto: prod,
      quantidade: 1,
      sabor: null,
      adicionais: [],
      observacoes: "",
      precoTotalUnitario: prod.preco,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    toast.success(`✨ ${prod.nome} adicionado à sacola!`);
  }

  // Pedido WhatsApp
  function pedirPeloWhatsApp() {
    if (carrinho.length === 0) {
      toast.error("Sua sacola está vazia!");
      return;
    }
    if (!clienteNome.trim()) {
      toast.error("Por favor, informe seu nome antes de enviar pelo WhatsApp.");
      return;
    }

    let texto = `*NOVO PEDIDO — ${ESTABELECIMENTO.nome.toUpperCase()}*\n`;
    texto += `═══════════════════════════════\n`;
    texto += `*Cliente:* ${clienteNome.trim()}\n`;
    if (clienteTelefone) texto += `*WhatsApp:* ${clienteTelefone}\n`;
    texto += `*Tipo de Consumo:* ${
      tipoEntrega === "local"
        ? `Consumo no EVS ${(detalhesMesa?.numero || mesaId) ? `(Mesa: ${detalhesMesa?.numero || mesaId})` : ""}`
        : tipoEntrega === "balcao"
          ? "Retirada no Balcão"
          : `Delivery (Endereço: ${endereco || "A combinar"})`
    }\n`;
    texto += `═══════════════════════════════\n\n`;
    texto += `*ITENS DO PEDIDO:*\n`;

    carrinho.forEach((item, idx) => {
      texto += `\n*${idx + 1}. ${item.quantidade}x ${item.produto.nome}* — ${brl(
        item.precoTotalUnitario * item.quantidade
      )}\n`;
      if (item.sabor) texto += `   • ${item.sabor}\n`;
      if (item.adicionais.length > 0) {
        texto += `   • Adicionais: ${item.adicionais
          .map((a) => `${a.nome} (+${brl(a.preco)})`)
          .join(", ")}\n`;
      }
      if (item.observacoes) texto += `   • Obs: "${item.observacoes}"\n`;
    });

    texto += `\n═══════════════════════════════\n`;
    texto += `*TOTAL A PAGAR:* ${brl(valorTotalCarrinho)}\n`;
    if (obsPedido.trim()) texto += `*Observação do Pedido:* ${obsPedido.trim()}\n`;
    texto += `═══════════════════════════════\n`;
    texto += `_Pedido gerado pelo Cardápio Digital SisEVS_`;

    const zapUrl = `https://wa.me/${ESTABELECIMENTO.telefone}?text=${encodeURIComponent(texto)}`;
    window.open(zapUrl, "_blank");

    toast.success("Abrindo WhatsApp com seu pedido formatado!");
  }

  // Submeter Pedido ao Sistema do EVS (Comanda / Cozinha)
  async function finalizarPedido() {
    if (carrinho.length === 0) {
      toast.error("Sua sacola está vazia!");
      return;
    }

    if (!clienteNome.trim()) {
      toast.error("Por favor, informe seu nome.");
      return;
    }

    if (!clienteTelefone.trim() && !userSession) {
      toast.error("Por favor, informe seu WhatsApp para acompanhar o pedido.");
      return;
    }

    if (tipoEntrega === "delivery" && !endereco.trim()) {
      toast.error("Por favor, preencha o endereço para entrega.");
      return;
    }

    setEnviandoPedido(true);

    try {
      const telLimpo = clienteTelefone.replace(/\D/g, "");

      // 1. Vincular ou criar registro na tabela clientes do SisEVS
      let clienteId: string | null = null;
      if (telLimpo) {
        const { data: cliExistente } = await supabase
          .from("clientes")
          .select("id")
          .eq("telefone", telLimpo)
          .maybeSingle();

        if (cliExistente?.id) {
          clienteId = cliExistente.id;
        } else if (clienteNome.trim()) {
          const { data: novoCli } = await supabase
            .from("clientes")
            .insert({
              nome: clienteNome.trim(),
              telefone: telLimpo,
              observacoes: "Cliente registrado pelo Cardápio Digital",
            })
            .select("id")
            .maybeSingle();
          if (novoCli?.id) clienteId = novoCli.id;
        }
      }

      // 2. Preparar observações completas com dados de entrega e consumo
      const obsPartes: string[] = [];
      if (detalhesMesa) {
        obsPartes.push(`Mesa: ${detalhesMesa.numero} (${modoMesa === 'junto' ? 'Na conta da Mesa' : 'Comanda Separada'})`);
      } else if (tipoEntrega === "local") {
        obsPartes.push(`Consumo no EVS${mesaId.trim() ? ` (Mesa: ${mesaId.trim()})` : ""}`);
      } else if (tipoEntrega === "balcao") {
        obsPartes.push("Retirada no Balcão");
      } else if (tipoEntrega === "delivery") {
        obsPartes.push(`Delivery (Endereço: ${endereco.trim()})`);
      }
      if (obsPedido.trim()) {
        obsPartes.push(`Obs: ${obsPedido.trim()}`);
      }
      const obsFinal = obsPartes.join(" | ");

      // 3. Abrir comanda oficial no banco via RPC abrir_comanda
      const { data: comandaAberta, error: comandaError } = await (supabase.rpc as any)("abrir_comanda", {
        _cliente_id: clienteId,
        _cliente_nome: clienteNome.trim(),
        _cliente_telefone: telLimpo || null,
        _observacoes: obsFinal || null,
        _mesa_id: detalhesMesa ? detalhesMesa.id : null
      });

      if (comandaError || !comandaAberta) {
        throw new Error(comandaError?.message || "Não foi possível abrir comanda no sistema.");
      }

      const pedidoId = (comandaAberta as any).id;
      const pedidoNumero = (comandaAberta as any).numero;

      if (clienteNome.trim() && pedidoId) {
        await (supabase.from("pedidos") as any).update({ cliente_nome_rapido: clienteNome.trim() }).eq("id", pedidoId);
      }

      // 4. Adicionar itens à comanda via RPC adicionar_item_comanda
      for (const item of carrinho) {
        let prodIdReal = item.produto.id;
        if (prodIdReal.startsWith("evs-")) {
          const match = produtosBanco.find(
            (pb) => pb.nome.toLowerCase() === item.produto.nome.toLowerCase()
          );
          if (match) prodIdReal = match.id;
        }

        const { error: itemErr } = await (supabase.rpc as any)("adicionar_item_comanda", {
          _pedido_id: pedidoId,
          _produto_id: prodIdReal,
          _quantidade: item.quantidade,
          _sabor: item.sabor || null,
          _adicionais: item.adicionais || [],
          _observacoes: item.observacoes || null,
          _envia_para_cozinha: item.produto.envia_para_cozinha ?? true,
        });

        if (itemErr) {
          console.warn("Aviso ao adicionar item à comanda:", itemErr);
        }
      }

      // 5. Atualizar o estado da tela com a comanda gerada
      setPedidoConfirmado({
        id: pedidoId,
        numero: pedidoNumero,
        total: valorTotalCarrinho,
        clienteNome: clienteNome.trim(),
        itens: [...carrinho],
      });

      setCarrinho([]);
      setCarrinhoAberto(false);
      qc.invalidateQueries({ queryKey: ["cozinha-itens"] });
      qc.invalidateQueries({ queryKey: ["comandas-abertas"] });
      qc.invalidateQueries({ queryKey: ["meus-pedidos-cardapio"] });
      toast.success(`Comanda #${pedidoNumero} aberta e enviada para a equipe do EVS!`);
    } catch (err: any) {
      console.error("Erro ao registrar comanda:", err);
      toast.error(err.message || "Erro ao registrar comanda no sistema.");
    } finally {
      setEnviandoPedido(false);
    }
  }

  function getIconeCategoria(nome: string) {
    const n = nome.toLowerCase();
    if (n.includes("shake")) return <CupSoda className="size-3.5" />;
    if (n.includes("barra")) return <Cookie className="size-3.5" />;
    if (n.includes("slimday") || n.includes("detox")) return <Sparkles className="size-3.5" />;
    return <Package className="size-3.5" />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-emerald-600 selection:text-white relative">
      {/* ─────────────────────── TOPBAR INSTITUCIONAL ─────────────────────── */}
      <div className="bg-emerald-50/70 border-b border-emerald-100/80 px-4 py-2 text-xs text-slate-600 relative z-20">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-semibold text-emerald-800">Aberto agora</span>
            <span className="text-emerald-300 hidden sm:inline">•</span>
            <span className="text-slate-600 hidden sm:inline flex items-center gap-1">
              <Clock className="size-3 text-emerald-600" />
              {ESTABELECIMENTO.horarios}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 truncate max-w-[280px]">
              <MapPin className="size-3 text-emerald-600 shrink-0" />
              {ESTABELECIMENTO.endereco}
            </span>
            <a
              href={`https://wa.me/${ESTABELECIMENTO.telefone}`}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 shrink-0"
            >
              <Phone className="size-3" />
              {ESTABELECIMENTO.telefoneFormatado}
            </a>
          </div>
        </div>
      </div>

      {/* ─────────────────────── CABEÇALHO PRINCIPAL ─────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 transition-all shadow-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          {/* Logo e Nome do Espaço */}
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-2xl bg-emerald-50 border border-emerald-200 p-0.5 shadow-xs overflow-hidden shrink-0">
              <img
                src={ESTABELECIMENTO.logo}
                alt="Logo Espaço Vida Saudável"
                className="w-full h-full object-cover rounded-[14px]"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-heading font-black text-base md:text-lg text-slate-900 tracking-tight leading-tight">
                  {ESTABELECIMENTO.nome}
                </h1>
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold px-2 py-0.5 hidden md:inline-flex">
                  Oficial
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 line-clamp-1 font-medium">
                {ESTABELECIMENTO.slogan}
              </p>
            </div>
          </div>

          {/* Ações Topo: Cadastro / Login, Histórico, Painel e Sacola */}
          <div className="flex items-center gap-2">
            {/* Se o cliente estiver logado */}
            {userSession ? (
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoricoAberto(true)}
                  className="text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5 h-9 rounded-xl shadow-2xs"
                  title="Meus Pedidos Anteriores"
                >
                  <Receipt className="size-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Meus Pedidos</span>
                  {meusPedidos.length > 0 && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {meusPedidos.length}
                    </span>
                  )}
                </Button>

                <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="size-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-[11px]">
                    {(clienteNome || userSession.email || "C")[0].toUpperCase()}
                  </div>
                  <span className="text-slate-700 font-semibold max-w-[120px] truncate">
                    {clienteNome || userSession.email?.split("@")[0]}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-xs text-slate-400 hover:text-rose-600 h-9 px-2 rounded-xl hover:bg-slate-100"
                  title="Sair da Conta"
                >
                  <LogOut className="size-3.5" />
                </Button>
              </div>
            ) : (
              /* Se não estiver logado: Botão Entrar / Criar Conta */
              <Button
                size="sm"
                onClick={() => setAuthModalAberto(true)}
                className="text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 gap-1.5 h-9 rounded-xl shadow-2xs border"
              >
                <LogIn className="size-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Entrar / Criar Conta</span>
                <span className="sm:hidden">Entrar</span>
              </Button>
            )}

            {/* Acesso EVS Administrativo */}
            <Link
              to="/"
              className="text-xs text-slate-600 hover:text-emerald-700 hidden xl:flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-2 rounded-xl hover:border-emerald-300 shadow-2xs transition-all"
            >
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Painel</span>
            </Link>

            {/* Sacola Flutuante / Botão do Topo */}
            <Button
              onClick={() => setCarrinhoAberto(true)}
              className="relative bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-4 gap-2.5 shadow-sm shadow-emerald-700/20 rounded-xl transition-all"
            >
              <ShoppingCart className="size-4" />
              <span>{brl(valorTotalCarrinho)}</span>
              {totalItensCarrinho > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                  {totalItensCarrinho}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ─────────────────────── BARRA DE BUSCA E CATEGORIAS ─────────────────────── */}
      <section className="px-4 lg:px-8 max-w-6xl mx-auto w-full space-y-4 pt-6">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 size-4 text-slate-400" />
          <Input
            placeholder="Buscar por shakes, sabores, morango, colágeno, slimday..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 h-11 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm rounded-2xl focus-visible:ring-emerald-600 shadow-xs"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3.5 top-3.5 text-xs text-slate-500 hover:text-slate-900 font-medium"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Pílulas de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none custom-scrollbar">
          <button
            onClick={() => setCategoriaAtiva("todos")}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
              categoriaAtiva === "todos"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-[1.02]"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
            }`}
          >
            <Sparkles className="size-3.5" />
            <span>Todos os Itens ({produtos.length})</span>
          </button>

          {categorias.map((cat) => {
            const count = produtos.filter((p) => (p.categoria?.nome || p.group_name) === cat.nome).length;
            const selecionada = categoriaAtiva === cat.nome;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.nome)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border flex items-center gap-1.5 ${
                  selecionada
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs scale-[1.02]"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                }`}
              >
                {getIconeCategoria(cat.nome)}
                <span>{cat.nome}</span>
                {count > 0 && (
                  <span
                    className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      selecionada ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── GRID DE PRODUTOS ─────────────────────── */}
      <main className="px-4 lg:px-8 max-w-6xl mx-auto w-full mt-4 mb-20 flex-1">
        {carregandoProdutos ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="size-10 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Carregando cardápio...</span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-white p-8 space-y-3 shadow-xs">
            <UtensilsCrossed className="size-12 mx-auto text-slate-400" />
            <h3 className="text-base font-bold text-slate-800">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não encontramos produtos para "{busca}". Tente outro termo ou selecione uma categoria diferente.
            </p>
            {busca && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBusca("")}
                className="text-xs border-slate-200 bg-white text-slate-700 rounded-xl"
              >
                Limpar Busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {produtosFiltrados.map((p) => {
              const temOpcoes =
                (p.option_groups && p.option_groups.length > 0) ||
                p.permite_sabor ||
                p.permite_adicionais;

              return (
                <Card
                  key={p.id}
                  className="bg-white border-slate-200/80 hover:border-emerald-500/50 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group shadow-xs rounded-2xl"
                >
                  <div>
                    {/* Imagem do Produto */}
                    <div
                      className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 cursor-pointer"
                      onClick={() => abrirModalProduto(p)}
                    >
                      {p.imagem_url ? (
                        <img
                          src={p.imagem_url}
                          alt={p.nome}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                          <CupSoda className="size-10 opacity-50" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-xs">
                        {p.categoria?.nome || p.group_name}
                      </span>

                      {p.envia_para_cozinha && (
                        <span className="absolute top-3 right-3 text-[10px] font-semibold text-amber-800 bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg border border-amber-200/80 flex items-center gap-1 shadow-xs">
                          <ChefHat className="size-3 text-amber-600" /> Preparo na hora
                        </span>
                      )}

                      <div className="absolute bottom-2.5 right-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                        <span className="font-heading font-black text-sm text-emerald-700">
                          {brl(p.preco)}
                        </span>
                      </div>
                    </div>

                    {/* Conteúdo textual */}
                    <div className="p-4 space-y-2">
                      <h3
                        onClick={() => abrirModalProduto(p)}
                        className="font-heading font-bold text-base text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1 cursor-pointer"
                        title={p.nome}
                      >
                        {p.nome}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed min-h-[32px]">
                        {p.descricao || "Nutrição saborosa e balanceada para o seu dia a dia saudável."}
                      </p>

                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        {p.option_groups && p.option_groups.length > 0 ? (
                          p.option_groups.slice(0, 2).map((og) => (
                            <span
                              key={og.id}
                              className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium"
                            >
                              {og.name.replace("Qual o ", "").replace("?", "")}
                            </span>
                          ))
                        ) : (
                          <>
                            {p.permite_sabor && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                Vários Sabores
                              </span>
                            )}
                            {p.permite_adicionais && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                                + Adicionais
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé com Preço e Ação */}
                  <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block leading-tight font-medium">Valor unitário</span>
                      <span className="font-heading font-black text-base text-emerald-700">
                        {brl(p.preco)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => abrirModalProduto(p)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-4 gap-1.5 rounded-xl shadow-xs"
                    >
                      <Plus className="size-3.5" />
                      <span>{temOpcoes ? "Personalizar" : "Adicionar"}</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────────────────────── BARRA FLUTUANTE DE CHECKOUT ─────────────────────── */}
      {carrinho.length > 0 && !carrinhoAberto && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-white/95 border border-slate-200 rounded-2xl p-3.5 shadow-xl shadow-slate-900/10 flex items-center justify-between gap-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-3">
              <div className="relative size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <ShoppingCart className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-amber-400 text-slate-900 font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                  {totalItensCarrinho}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block font-medium">Sacola do pedido</span>
                <span className="text-base font-black text-slate-900 font-heading">{brl(valorTotalCarrinho)}</span>
              </div>
            </div>

            <Button
              onClick={() => setCarrinhoAberto(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-xs"
            >
              <span>Ver Pedido</span>
              <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────── MODAL DE PERSONALIZAÇÃO DO PRODUTO ─────────────────────── */}
      {produtoModal && (
        <Dialog open={!!produtoModal} onOpenChange={() => setProdutoModal(null)}>
          <DialogContent className="max-w-md bg-white border-slate-200 text-slate-800 p-0 overflow-hidden rounded-3xl shadow-2xl max-h-[90vh] flex flex-col">
            <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 shrink-0">
              {produtoModal.imagem_url ? (
                <img
                  src={produtoModal.imagem_url}
                  alt={produtoModal.nome}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                  <CupSoda className="size-12 opacity-40" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

              <span className="absolute top-4 left-4 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-200/80 shadow-xs">
                {produtoModal.categoria?.nome || produtoModal.group_name}
              </span>

              <div className="absolute bottom-3 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-xl border border-slate-200 shadow-xs">
                <span className="font-heading font-black text-base text-emerald-700">
                  {brl(precoTotalUnitarioModal)}
                </span>
              </div>
            </div>

            <DialogHeader className="p-5 pb-2 text-left border-b border-slate-100 shrink-0">
              <DialogTitle className="text-lg font-heading font-extrabold text-slate-900">
                {produtoModal.nome}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar mt-1">
                {produtoModal.descricao || "Nutrição saborosa e balanceada para o seu dia a dia saudável."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              {produtoModal.option_groups && produtoModal.option_groups.length > 0 ? (
                produtoModal.option_groups.map((group) => {
                  const selecionados = opcoesPorGrupo[group.id] || [];

                  return (
                    <div key={group.id} className="space-y-2.5 border-b border-slate-100 pb-4 last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs font-bold text-slate-800">
                            {group.name}
                          </Label>
                          <span className="text-[11px] text-slate-500 block">
                            {group.max > 1
                              ? `Escolha de ${group.min} até ${group.max} opções`
                              : group.min === 1
                                ? "Obrigatório (escolha 1 opção)"
                                : "Opcional (escolha até 1 opção)"}
                          </span>
                        </div>
                        {group.min > 0 && selecionados.length < group.min && (
                          <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Obrigatório
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.options.map((opt) => {
                          const selecionado = selecionados.includes(opt.id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => toggleOpcaoGrupo(group.id, opt.id, group.max)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                                selecionado
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                <div
                                  className={`size-4 rounded-md border flex items-center justify-center shrink-0 ${
                                    selecionado
                                      ? "bg-emerald-600 border-emerald-600 text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {selecionado && <Check className="size-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{opt.name}</span>
                              </div>
                              {opt.price > 0 && (
                                <span className="font-bold text-emerald-700 text-[11px] shrink-0 ml-1">
                                  +{brl(opt.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <>
                  {produtoModal.permite_sabor && todosSabores.length > 0 && (
                    <div className="space-y-2.5">
                      <Label className="text-xs font-bold text-slate-800">Escolha o Sabor</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {todosSabores.map((s) => {
                          const sel = saborSelecionado === s.nome;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSaborSelecionado(s.nome)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between ${
                                sel
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-2xs"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span>{s.nome}</span>
                              {sel && <Check className="size-3.5 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {produtoModal.permite_adicionais && todosAdicionais.length > 0 && (
                    <div className="space-y-2.5 border-t border-slate-100 pt-4">
                      <Label className="text-xs font-bold text-slate-800">Adicionais</Label>
                      <div className="space-y-2">
                        {todosAdicionais.map((ad) => {
                          const sel = adicionaisSelecionados.some((a) => a.nome === ad.nome);
                          return (
                            <button
                              key={ad.id}
                              type="button"
                              onClick={() => {
                                if (sel) {
                                  setAdicionaisSelecionados((prev) => prev.filter((a) => a.nome !== ad.nome));
                                } else {
                                  setAdicionaisSelecionados((prev) => [
                                    ...prev,
                                    { nome: ad.nome, preco: Number(ad.preco) },
                                  ]);
                                }
                              }}
                              className={`w-full p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                                sel
                                  ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold shadow-2xs"
                                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <span>{ad.nome}</span>
                              <span className="text-emerald-700 font-bold">+{brl(ad.preco)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="space-y-1.5 pt-2">
                <Label className="text-xs font-bold text-slate-800">Observações deste item</Label>
                <Textarea
                  placeholder="Ex.: Sem canela, caprichar na calda, gelo extra..."
                  value={obsModal}
                  onChange={(e) => setObsModal(e.target.value)}
                  rows={2}
                  className="bg-white border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus-visible:ring-emerald-600 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-slate-800">Quantidade</span>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQtdModal((q) => Math.max(1, q - 1))}
                    className="size-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-2xs"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="font-bold text-sm text-slate-900 px-2">{qtdModal}</span>
                  <button
                    type="button"
                    onClick={() => setQtdModal((q) => q + 1)}
                    className="size-7 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center justify-center shadow-2xs"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between sm:justify-between w-full shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProdutoModal(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Voltar
              </Button>
              <Button
                onClick={adicionarAoCarrinho}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 h-10 rounded-xl gap-2 shadow-xs"
              >
                <span>Adicionar à Sacola</span>
                <span>•</span>
                <span>{brl(precoTotalUnitarioModal * qtdModal)}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────── GAVETA / DRAWER DO CARRINHO ─────────────────────── */}
      <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md bg-white border-l border-slate-200 text-slate-800 p-0 flex flex-col justify-between shadow-2xl h-full max-h-screen overflow-hidden"
        >
          <SheetHeader className="p-4 sm:p-5 border-b border-slate-100 flex flex-row items-center justify-between space-y-0 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-emerald-600" />
              <SheetTitle className="text-base font-heading font-bold text-slate-900">
                Sua Sacola ({totalItensCarrinho})
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-5 space-y-5 custom-scrollbar min-h-0">
            {carrinho.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <ShoppingCart className="size-12 mx-auto text-slate-300" />
                <p className="text-sm text-slate-500 font-medium">Sua sacola está vazia</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCarrinhoAberto(false)}
                  className="text-xs border-slate-200 text-slate-700 rounded-xl shadow-2xs"
                >
                  Explorar Cardápio
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Itens Selecionados
                  </div>

                  {carrinho.map((it) => (
                    <div
                      key={it.id}
                      className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {it.produto.imagem_url && (
                            <img
                              src={it.produto.imagem_url}
                              alt={it.produto.nome}
                              className="size-12 rounded-xl object-cover shrink-0 border border-slate-200"
                            />
                          )}
                          <div>
                            <h4 className="font-heading font-bold text-sm text-slate-900">{it.produto.nome}</h4>
                            {it.sabor && (
                              <span className="text-xs text-emerald-700 block font-semibold">
                                {it.sabor}
                              </span>
                            )}
                            {it.adicionais.length > 0 && (
                              <span className="text-[11px] text-slate-600 block">
                                + {it.adicionais.map((a) => `${a.nome} (${brl(a.preco)})`).join(", ")}
                              </span>
                            )}
                            {it.observacoes && (
                              <span className="text-[11px] text-slate-500 italic block mt-0.5">
                                Obs: "{it.observacoes}"
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => removerItemCarrinho(it.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/80">
                        <span className="text-xs font-bold text-emerald-700">
                          {brl(it.precoTotalUnitario * it.quantidade)}
                        </span>

                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            onClick={() => alterarQtdCarrinho(it.id, -1)}
                            className="size-6 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-xs font-bold px-1.5 text-slate-800">{it.quantidade}</span>
                          <button
                            onClick={() => alterarQtdCarrinho(it.id, 1)}
                            className="size-6 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center justify-center"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ────────────────── SUGESTÕES COMPLEMENTARES (ORDER BUMP / UPSELL) ────────────────── */}
                {sugestoesComplementares.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                        <Sparkles className="size-3.5 text-amber-500 fill-amber-400" />
                        <span>Sugestão Especial</span>
                      </div>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px] font-bold px-2 py-0.5">
                        ⚡ Oferta rápida
                      </Badge>
                    </div>

                    <div className="space-y-2.5">
                      {sugestoesComplementares.map((sug) => {
                        const frase = gerarFraseSugestao(sug);
                        return (
                          <div
                            key={sug.id}
                            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50/80 via-white to-amber-50/40 border border-emerald-200/90 shadow-2xs space-y-2.5 transition-all hover:border-emerald-300"
                          >
                            <div className="flex items-start gap-3">
                              {sug.imagem_url ? (
                                <img
                                  src={sug.imagem_url}
                                  alt={sug.nome}
                                  className="size-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="size-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                                  <Sparkles className="size-5" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 leading-snug">
                                  {frase}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-bold text-emerald-700">
                                    +{brl(sug.preco)}
                                  </span>
                                  {sug.categoria?.nome && (
                                    <span className="text-[10px] text-slate-500 bg-slate-100/90 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[120px]">
                                      {sug.categoria.nome}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              type="button"
                              size="sm"
                              onClick={() => adicionarSugestaoAoCarrinho(sug)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 rounded-xl gap-1.5 shadow-2xs transition-transform active:scale-[0.99]"
                            >
                              <Plus className="size-3.5" />
                              <span>Sim! Quero adicionar (+{brl(sug.preco)})</span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Tipo de Consumo */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Onde vai consumir?
                  </div>

                  {detalhesMesa ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800">
                        <UtensilsCrossed className="size-4" />
                        <span className="font-semibold text-sm">Você está na {detalhesMesa.numero}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setModoMesa("junto")}
                          className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                            modoMesa === "junto"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <Users className="size-4" />
                          <span>Pagar tudo junto (Mesa)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setModoMesa("separado")}
                          className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                            modoMesa === "separado"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <User className="size-4" />
                          <span>Comanda separada</span>
                        </button>
                      </div>
                      {modoMesa === "junto" && (
                        <p className="text-[11px] text-emerald-700 bg-emerald-50/50 p-2 rounded-lg">
                          Seu pedido será somado na conta geral da mesa. O nome do responsável é obrigatório abaixo.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoEntrega("local")}
                          className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                            tipoEntrega === "local"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <UtensilsCrossed className="size-4" />
                          <span>No EVS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoEntrega("balcao")}
                          className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                            tipoEntrega === "balcao"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <ChefHat className="size-4" />
                          <span>Balcão</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoEntrega("delivery")}
                          className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                            tipoEntrega === "delivery"
                              ? "bg-emerald-50 border-emerald-500 text-emerald-800 font-bold shadow-2xs"
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <MapPin className="size-4" />
                          <span>Entrega</span>
                        </button>
                      </div>

                      {tipoEntrega === "local" && (
                        <div>
                          <Label className="text-xs text-slate-700">Número da Mesa (opcional)</Label>
                          <Input
                            placeholder="Ex.: Mesa 03"
                            value={mesaId}
                            onChange={(e) => setMesaId(e.target.value)}
                            className="bg-white border-slate-200 h-9 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {tipoEntrega === "delivery" && (
                    <div>
                      <Label className="text-xs text-slate-700">Endereço de Entrega</Label>
                      <Input
                        placeholder="Rua, número, complemento, bairro"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="bg-white border-slate-200 h-9 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                      />
                    </div>
                  )}
                </div>

                {/* Identificação do Cliente */}
                <div className="space-y-3 border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Seus Dados
                    </span>
                    {!userSession ? (
                      <button
                        type="button"
                        onClick={() => setAuthModalAberto(true)}
                        className="text-[11px] text-emerald-700 hover:underline font-semibold"
                      >
                        Já tem conta? Entrar
                      </button>
                    ) : (
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="size-3" /> Conectado como {clienteNome || "Cliente"}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <Label className="text-xs text-slate-700">Seu Nome *</Label>
                      <Input
                        placeholder="Ex.: Maria Silva"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        className="bg-white border-slate-200 h-9 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-700">WhatsApp / Telefone *</Label>
                      <Input
                        placeholder="(67) 99999-9999"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        className="bg-white border-slate-200 h-9 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-700">Observações Gerais</Label>
                      <Input
                        placeholder="Instruções para entrega ou pagamento..."
                        value={obsPedido}
                        onChange={(e) => setObsPedido(e.target.value)}
                        className="bg-white border-slate-200 h-9 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rodapé Fixo com Totais e Botões 100% Responsivos e Empilhados Verticalmente */}
          {carrinho.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white/95 backdrop-blur-md space-y-3 w-full shrink-0 shadow-lg">
              <div className="w-full space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-700">{brl(valorTotalCarrinho)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-black text-slate-900 font-heading pt-1 border-t border-slate-200/60">
                  <span>Total do Pedido</span>
                  <span className="text-emerald-700 text-lg">{brl(valorTotalCarrinho)}</span>
                </div>
              </div>

              {/* Botão Principal: WhatsApp */}
              <Button
                onClick={pedirPeloWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-2.5 h-auto rounded-xl flex items-center justify-center gap-2 shadow-sm whitespace-normal text-center leading-snug transition-transform active:scale-[0.99]"
              >
                <MessageCircle className="size-4 shrink-0" />
                <span className="truncate">Pedir pelo WhatsApp ({ESTABELECIMENTO.telefoneFormatado})</span>
              </Button>

              {/* Botão Secundário: Pedir Presencial (Apenas visível quando for "No EVS" ou "Balcão") */}
              {(tipoEntrega === "local" || tipoEntrega === "balcao") && (
                <Button
                  onClick={finalizarPedido}
                  disabled={enviandoPedido}
                  variant="outline"
                  className="w-full border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm py-2.5 h-auto rounded-xl flex items-center justify-center gap-2 shadow-2xs whitespace-normal text-center leading-snug transition-transform active:scale-[0.99]"
                >
                  {enviandoPedido ? (
                    <div className="flex items-center gap-2">
                      <div className="size-3.5 border-2 border-emerald-600 border-t-transparent animate-spin rounded-full" />
                      <span>Enviando para a cozinha...</span>
                    </div>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span className="truncate">Pedir Presencial</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ─────────────────────── MODAL PEDIDO CONFIRMADO ─────────────────────── */}
      {pedidoConfirmado && (
        <Dialog open={!!pedidoConfirmado} onOpenChange={() => setPedidoConfirmado(null)}>
          <DialogContent className="max-w-md bg-white border-emerald-200 text-slate-800 p-6 rounded-3xl text-center shadow-2xl">
            <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-2 animate-bounce shadow-xs">
              <CheckCircle2 className="size-9" />
            </div>

            <DialogHeader className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                Pedido Registrado com Sucesso!
              </span>
              <DialogTitle className="text-2xl font-heading font-black text-slate-900">
                Comanda #{pedidoConfirmado.numero}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Obrigado, <strong className="text-slate-800">{pedidoConfirmado.clienteNome}</strong>! Seu pedido foi encaminhado para a equipe do {ESTABELECIMENTO.nome}.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
                <span>Resumo da Comanda</span>
                <span className="font-bold text-emerald-700">{brl(pedidoConfirmado.total)}</span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1.5 custom-scrollbar text-[11px]">
                {pedidoConfirmado.itens.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-700">
                    <span>
                      {it.quantidade}x {it.produto.nome}
                    </span>
                    <span className="font-semibold text-emerald-700">
                      {brl(it.precoTotalUnitario * it.quantidade)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={() => {
                  const texto = `Olá! Acabei de registrar a comanda #${pedidoConfirmado.numero} no valor de ${brl(
                    pedidoConfirmado.total
                  )} pelo Cardápio Digital. Gostaria de confirmar!`;
                  window.open(
                    `https://wa.me/${ESTABELECIMENTO.telefone}?text=${encodeURIComponent(texto)}`,
                    "_blank"
                  );
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl gap-2 shadow-xs"
              >
                <MessageCircle className="size-4" />
                <span>Confirmar no WhatsApp do EVS</span>
              </Button>

              <Button
                variant="ghost"
                onClick={() => setPedidoConfirmado(null)}
                className="w-full text-xs text-slate-500 hover:text-slate-800"
              >
                Concluir e Voltar ao Cardápio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────── MODAL DE AUTENTICAÇÃO DO CLIENTE ─────────────────────── */}
      {authModalAberto && (
        <Dialog open={authModalAberto} onOpenChange={setAuthModalAberto}>
          <DialogContent className="max-w-sm bg-white border-slate-200 text-slate-800 p-6 rounded-3xl shadow-2xl">
            <DialogHeader className="text-center space-y-1">
              <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-1 shadow-2xs">
                <User className="size-6" />
              </div>
              <DialogTitle className="text-xl font-heading font-black text-slate-900">
                {authMode === "login" ? "Entrar na sua Conta" : "Criar sua Conta no EVS"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Acompanhe o histórico dos seus pedidos, agilize suas compras e salve seus shakes favoritos.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAuth} className="space-y-3.5 mt-3">
              {authMode === "signup" && (
                <>
                  <div>
                    <Label className="text-xs text-slate-700">Nome Completo</Label>
                    <Input
                      required
                      placeholder="Como devemos te chamar?"
                      value={authNome}
                      onChange={(e) => setAuthNome(e.target.value)}
                      className="bg-white border-slate-200 h-10 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-700">WhatsApp / Telefone</Label>
                    <Input
                      required
                      placeholder="(67) 99999-9999"
                      value={authTelefone}
                      onChange={(e) => setAuthTelefone(e.target.value)}
                      className="bg-white border-slate-200 h-10 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs text-slate-700">E-mail</Label>
                <Input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-white border-slate-200 h-10 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-700">Senha</Label>
                <Input
                  required
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-white border-slate-200 h-10 text-xs rounded-xl mt-1 text-slate-900 placeholder:text-slate-400 focus-visible:ring-emerald-600"
                />
              </div>

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-11 rounded-xl mt-2 shadow-xs"
              >
                {authLoading ? "Processando..." : authMode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="text-center pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setAuthMode((m) => (m === "login" ? "signup" : "login"))}
                className="text-xs text-emerald-700 hover:text-emerald-800 transition-colors font-semibold"
              >
                {authMode === "login"
                  ? "Não tem conta? Cadastre-se gratuitamente"
                  : "Já tem conta? Faça login"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────── GAVETA HISTÓRICO DE PEDIDOS ─────────────────────── */}
      <Sheet open={historicoAberto} onOpenChange={setHistoricoAberto}>
        <SheetContent
          side="left"
          className="w-full sm:max-w-md bg-white border-r border-slate-200 text-slate-800 p-0 flex flex-col justify-between shadow-2xl"
        >
          <SheetHeader className="p-5 border-b border-slate-100">
            <SheetTitle className="text-base font-heading font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="size-5 text-emerald-600" />
              <span>Meus Pedidos</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {meusPedidos.length === 0 ? (
              <div className="py-24 text-center space-y-2">
                <Receipt className="size-12 mx-auto text-slate-300" />
                <p className="text-sm font-semibold text-slate-800">Nenhum pedido anterior</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Assim que você fizer um pedido, ele aparecerá aqui com status em tempo real.
                </p>
              </div>
            ) : (
              meusPedidos.map((ped: any) => (
                <div key={ped.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-extrabold text-slate-900 text-sm">
                      Comanda #{ped.numero}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50">
                      {ped.status_comanda === "paga" ? "Finalizada" : "Em preparo / Aberta"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(ped.data_hora).toLocaleString("pt-BR")}
                  </span>
                  <div className="border-t border-slate-200/80 pt-2 space-y-1">
                    {ped.itens?.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-700 text-[11px]">
                        <span>
                          {it.quantidade}x {it.nome_produto}
                          {it.sabor ? ` (${it.sabor})` : ""}
                        </span>
                        <span className="text-emerald-700 font-medium">{brl(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-200/80 pt-2 flex justify-between font-extrabold text-slate-900">
                    <span>Total</span>
                    <span className="text-emerald-700">{brl(ped.total)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
