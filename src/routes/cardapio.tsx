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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  User,
  LogIn,
  LogOut,
  CheckCircle2,
  ChefHat,
  Receipt,
  MessageCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/cardapio")({
  head: () => ({ meta: [{ title: "Cardápio Digital — FitLife SisEVS" }] }),
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
};

type ItemCarrinho = {
  id: string; // id temporário do item no carrinho
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

  // Estados de customização do produto selecionado
  const [saborSelecionado, setSaborSelecionado] = useState<string>("");
  const [adicionaisSelecionados, setAdicionaisSelecionados] = useState<{ nome: string; preco: number }[]>([]);
  const [qtdModal, setQtdModal] = useState<number>(1);
  const [obsModal, setObsModal] = useState<string>("");

  // Estados do Cliente & Pedido
  const [tipoEntrega, setTipoEntrega] = useState<"local" | "balcao" | "delivery">("local");
  const [mesa, setMesa] = useState<string>("");
  const [endereco, setEndereco] = useState<string>("");
  const [clienteNome, setClienteNome] = useState<string>("");
  const [clienteTelefone, setClienteTelefone] = useState<string>("");
  const [obsPedido, setObsPedido] = useState<string>("");
  const [enviandoPedido, setEnviandoPedido] = useState(false);

  // Pedido Confirmado
  const [pedidoConfirmado, setPedidoConfirmado] = useState<{
    id: string;
    numero: number;
    total: number;
    clienteNome: string;
    itens: ItemCarrinho[];
  } | null>(null);

  // Autenticação do Cliente
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

  // 1. Carregar Configurações da Loja (EVS)
  const { data: configLoja } = useQuery({
    queryKey: ["config-loja-publica"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes_loja").select("*").limit(1).maybeSingle();
      return data as any;
    },
  });

  // 2. Carregar Categorias
  const { data: categorias = [] } = useQuery({
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

  // 3. Carregar Sabores
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

  // 4. Carregar Adicionais
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

  // 5. Carregar Produtos Ativos
  const { data: produtos = [], isLoading: carregandoProdutos } = useQuery({
    queryKey: ["cardapio-produtos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("produtos")
        .select("*, categoria:categorias_produtos(nome), produto_sabores(sabor_id), produto_adicionais(adicional_id)")
        .eq("ativo", true)
        .eq("aparece_no_pedido", true)
        .order("nome");

      if (error) {
        console.error("Erro ao carregar produtos:", error);
        return [];
      }
      return (data ?? []) as unknown as Produto[];
    },
  });

  // 6. Carregar Histórico de Pedidos do Cliente
  const { data: meusPedidos = [], refetch: refetchMeusPedidos } = useQuery({
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

  // Filtragem dos Produtos por busca e categoria
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchCategoria = categoriaAtiva === "todos" || p.categoria_id === categoriaAtiva;
      const matchBusca =
        !busca ||
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        (p.descricao && p.descricao.toLowerCase().includes(busca.toLowerCase())) ||
        (p.categoria?.nome && p.categoria.nome.toLowerCase().includes(busca.toLowerCase()));
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
  }

  // Preço unitário dinâmico no modal
  const precoTotalUnitarioModal = useMemo(() => {
    if (!produtoModal) return 0;
    const somaAdicionais = adicionaisSelecionados.reduce((acc, a) => acc + Number(a.preco || 0), 0);
    return Number(produtoModal.preco) + somaAdicionais;
  }, [produtoModal, adicionaisSelecionados]);

  // Adicionar ao Carrinho
  function adicionarAoCarrinho() {
    if (!produtoModal) return;

    // Se o produto permite sabor e existem sabores associados, exigir seleção
    const saboresDoProduto = todosSabores.filter((s) =>
      produtoModal.produto_sabores?.some((ps) => ps.sabor_id === s.id)
    );
    if (produtoModal.permite_sabor && saboresDoProduto.length > 0 && !saborSelecionado) {
      toast.warning("Por favor, selecione um sabor para este item.");
      return;
    }

    const novoItem: ItemCarrinho = {
      id: `${produtoModal.id}-${Date.now()}-${Math.random()}`,
      produto: produtoModal,
      quantidade: qtdModal,
      sabor: saborSelecionado || null,
      adicionais: [...adicionaisSelecionados],
      observacoes: obsModal.trim(),
      precoTotalUnitario: precoTotalUnitarioModal,
    };

    setCarrinho((prev) => [...prev, novoItem]);
    setProdutoModal(null);
    toast.success(`${qtdModal}x ${produtoModal.nome} adicionado à sacola!`);
  }

  // Modificar quantidade no carrinho
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

  // Remover item do carrinho
  function removerItemCarrinho(id: string) {
    setCarrinho((prev) => prev.filter((it) => it.id !== id));
  }

  // Totais do Carrinho
  const totalItensCarrinho = useMemo(
    () => carrinho.reduce((acc, it) => acc + it.quantidade, 0),
    [carrinho]
  );

  const valorTotalCarrinho = useMemo(
    () => carrinho.reduce((acc, it) => acc + it.precoTotalUnitario * it.quantidade, 0),
    [carrinho]
  );

  // Submeter Pedido ao Sistema do EVS
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

    if (tipoEntrega === "local" && !mesa.trim()) {
      toast.warning("Dica: informe o número da mesa caso esteja no espaço.");
    }

    if (tipoEntrega === "delivery" && !endereco.trim()) {
      toast.error("Por favor, preencha o endereço para entrega.");
      return;
    }

    setEnviandoPedido(true);

    try {
      const telLimpo = clienteTelefone.replace(/\D/g, "");

      // Monta os itens no formato json para a RPC
      const itensPayload = carrinho.map((it) => ({
        produto_id: it.produto.id,
        quantidade: it.quantidade,
        sabor: it.sabor || null,
        adicionais: it.adicionais,
        observacoes: it.observacoes || null,
      }));

      // Tenta chamar a RPC `criar_pedido_cardapio`
      const { data: pedidoCriado, error: rpcError } = await supabase.rpc("criar_pedido_cardapio", {
        _cliente_nome: clienteNome.trim(),
        _cliente_telefone: telLimpo,
        _tipo_entrega: tipoEntrega,
        _mesa: tipoEntrega === "local" ? mesa.trim() : null,
        _endereco: tipoEntrega === "delivery" ? endereco.trim() : null,
        _observacoes: obsPedido.trim() || null,
        _itens: itensPayload as any,
      });

      if (!rpcError && pedidoCriado) {
        setPedidoConfirmado({
          id: (pedidoCriado as any).id,
          numero: (pedidoCriado as any).numero,
          total: Number((pedidoCriado as any).total || valorTotalCarrinho),
          clienteNome: clienteNome.trim(),
          itens: [...carrinho],
        });
        setCarrinho([]);
        setCarrinhoAberto(false);
        qc.invalidateQueries({ queryKey: ["cozinha-itens"] });
        qc.invalidateQueries({ queryKey: ["comandas-abertas"] });
        qc.invalidateQueries({ queryKey: ["meus-pedidos-cardapio"] });
        toast.success(`Pedido #${(pedidoCriado as any).numero} enviado com sucesso!`);
        return;
      }

      // Fallback: caso a migration RPC ainda não tenha sido aplicada no Supabase remoto
      console.warn("RPC criar_pedido_cardapio não disponível, usando fallback direto...", rpcError);

      // 1. Cadastra/Atualiza cliente
      let cid: string | null = null;
      try {
        const { data: cData } = await supabase.rpc("upsert_cliente", {
          _nome: clienteNome.trim(),
          _telefone: telLimpo || null as any,
          _observacoes: "Cardápio Digital",
        });
        if (cData) cid = (cData as any).id;
      } catch {
        // segue se falhar
      }

      // 2. Abre a comanda
      const descObs = `[Cardápio: ${tipoEntrega}${mesa ? ` - Mesa ${mesa}` : ""}${endereco ? ` - Endereço: ${endereco}` : ""}] ${obsPedido}`.trim();
      const { data: comandaAberta, error: comandaError } = await supabase.rpc("abrir_comanda", {
        _cliente_id: cid,
        _cliente_nome: clienteNome.trim(),
        _cliente_telefone: telLimpo,
        _observacoes: descObs,
      });

      if (comandaError || !comandaAberta) {
        throw new Error(comandaError?.message || "Não foi possível abrir a comanda no EVS.");
      }

      const pId = (comandaAberta as any).id;
      const pNum = (comandaAberta as any).numero;

      // 3. Adiciona cada item
      for (const item of carrinho) {
        await supabase.rpc("adicionar_item_comanda", {
          _pedido_id: pId,
          _produto_id: item.produto.id,
          _quantidade: item.quantidade,
          _sabor: item.sabor,
          _adicionais: item.adicionais as any,
          _observacoes: item.observacoes || null,
        });
      }

      setPedidoConfirmado({
        id: pId,
        numero: pNum,
        total: valorTotalCarrinho,
        clienteNome: clienteNome.trim(),
        itens: [...carrinho],
      });
      setCarrinho([]);
      setCarrinhoAberto(false);
      qc.invalidateQueries({ queryKey: ["cozinha-itens"] });
      qc.invalidateQueries({ queryKey: ["comandas-abertas"] });
      qc.invalidateQueries({ queryKey: ["meus-pedidos-cardapio"] });
      toast.success(`Pedido #${pNum} enviado com sucesso!`);
    } catch (err: any) {
      console.error("Erro ao enviar pedido:", err);
      toast.error(err?.message || "Erro ao processar pedido. Tente novamente.");
    } finally {
      setEnviandoPedido(false);
    }
  }

  // Autenticação do Cliente
  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthLoading(true);

    try {
      if (authMode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        setUserSession(data.user);
        setClienteNome(data.user?.user_metadata?.nome || authEmail.split("@")[0]);
        if (data.user?.user_metadata?.telefone) {
          setClienteTelefone(data.user.user_metadata.telefone);
        }
        setAuthModalAberto(false);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
          options: {
            data: {
              nome: authNome,
              telefone: authTelefone.replace(/\D/g, ""),
              is_cliente: "true",
            },
          },
        });
        if (error) throw error;
        toast.success("Conta criada com sucesso!");
        if (data.user) {
          setUserSession(data.user);
          setClienteNome(authNome);
          setClienteTelefone(authTelefone);
        }
        setAuthModalAberto(false);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro na autenticação");
    } finally {
      setAuthLoading(false);
    }
  }

  // Logout do Cliente
  async function handleLogout() {
    await supabase.auth.signOut();
    setUserSession(null);
    toast.info("Você saiu da conta.");
  }

  // Mensagem para WhatsApp do EVS
  function abrirWhatsAppConfirmacao() {
    if (!pedidoConfirmado) return;
    const telLoja = configLoja?.telefone?.replace(/\D/g, "") || "5511999999999";
    const textoItens = pedidoConfirmado.itens
      .map(
        (it) =>
          `• ${it.quantidade}x ${it.produto.nome}${it.sabor ? ` (${it.sabor})` : ""}${it.adicionais.length ? ` [+ ${it.adicionais.map((a) => a.nome).join(", ")}]` : ""}`
      )
      .join("\n");

    const msg = `Olá! Acabei de fazer o Pedido #${pedidoConfirmado.numero} pelo Cardápio Digital FitLife.\n\n*Cliente:* ${pedidoConfirmado.clienteNome}\n*Valor Total:* ${brl(pedidoConfirmado.total)}\n\n*Itens:* \n${textoItens}\n\nPoderiam confirmar o recebimento?`;
    window.open(`https://wa.me/${telLoja}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-emerald-500 selection:text-white pb-24">
      {/* ─────────────────────── TOPBAR DO CARDÁPIO ─────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo e Nome da Loja */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-0.5 shadow-md shadow-emerald-950/50 flex items-center justify-center shrink-0">
              <div className="size-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                {configLoja?.logo_url ? (
                  <img src={configLoja.logo_url} alt="Logo" className="size-full object-contain p-1" />
                ) : (
                  <UtensilsCrossed className="size-5 text-emerald-400" />
                )}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-base md:text-lg text-white truncate">
                  {configLoja?.nome_loja || "FitLife"}
                </h1>
                <Badge variant="outline" className="hidden sm:inline-flex text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                  Cardápio Digital
                </Badge>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Espaço Vida Saudável • Pedidos Abertos</span>
              </div>
            </div>
          </div>

          {/* Ações: Usuário e Botão do Carrinho */}
          <div className="flex items-center gap-2.5">
            {/* Usuário / Login */}
            {userSession ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoricoAberto(true)}
                  className="text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 hidden sm:flex items-center gap-1.5"
                >
                  <Receipt className="size-3.5 text-emerald-400" />
                  <span>Meus Pedidos</span>
                </Button>
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                  <div className="size-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                    {clienteNome ? clienteNome.charAt(0).toUpperCase() : <User className="size-3" />}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden md:inline truncate max-w-[120px]">
                    {clienteNome || userSession.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Sair"
                    className="text-slate-400 hover:text-rose-400 p-0.5 transition-colors"
                  >
                    <LogOut className="size-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthModalAberto(true)}
                className="text-xs border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 gap-1.5 h-9"
              >
                <LogIn className="size-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Entrar / Criar Conta</span>
                <span className="sm:hidden">Entrar</span>
              </Button>
            )}

            {/* Link para o Sistema Administrativo caso seja membro da equipe */}
            <Link
              to="/"
              className="text-xs text-slate-400 hover:text-emerald-400 hidden xl:flex items-center gap-1 border border-slate-800/80 px-2.5 py-1.5 rounded-lg hover:border-emerald-500/30 transition-all"
            >
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>Acesso EVS</span>
            </Link>

            {/* Sacola Flutuante / Botão do Topo */}
            <Button
              onClick={() => setCarrinhoAberto(true)}
              className="relative bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 px-3.5 gap-2 shadow-lg shadow-emerald-950/50"
            >
              <ShoppingCart className="size-4" />
              <span className="font-bold">{brl(valorTotalCarrinho)}</span>
              {totalItensCarrinho > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold flex items-center justify-center shadow-md animate-bounce">
                  {totalItensCarrinho}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* ─────────────────────── BANNER HERO ─────────────────────── */}
      <section className="relative px-4 lg:px-8 py-6 max-w-6xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/20 p-6 md:p-8 shadow-xl">
          <div className="max-w-2xl space-y-2.5 relative z-10">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[11px] gap-1 px-2.5 py-0.5">
              <Sparkles className="size-3 text-amber-300" /> Shakes, Chás & Nutrição Funcional
            </Badge>
            <h2 className="text-2xl md:text-3xl font-heading font-extrabold text-white tracking-tight">
              Faça seu pedido online no Espaço Vida Saudável
            </h2>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              Escolha seu shake proteico, selecione seus sabores e adicionais favoritos e envie o pedido diretamente para a cozinha do EVS.
            </p>
          </div>

          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ─────────────────────── BARRA DE BUSCA E CATEGORIAS ─────────────────────── */}
      <section className="px-4 lg:px-8 max-w-6xl mx-auto space-y-4">
        {/* Campo de Busca */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 size-4 text-slate-400" />
          <Input
            placeholder="Buscar por shakes, sabores, chás, waffles..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10 h-10 bg-slate-900/90 border-slate-800 text-slate-100 placeholder:text-slate-500 text-sm rounded-xl focus-visible:ring-emerald-500"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              className="absolute right-3 top-3 text-xs text-slate-400 hover:text-white"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Pílulas de Categorias */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none custom-scrollbar">
          <button
            onClick={() => setCategoriaAtiva("todos")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
              categoriaAtiva === "todos"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
            }`}
          >
            Todos os Produtos ({produtos.length})
          </button>
          {categorias.map((cat) => {
            const count = produtos.filter((p) => p.categoria_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoriaAtiva(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border ${
                  categoriaAtiva === cat.id
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20"
                    : "bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat.nome} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────── GRID DE PRODUTOS ─────────────────────── */}
      <main className="px-4 lg:px-8 max-w-6xl mx-auto mt-6">
        {carregandoProdutos ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3">
            <div className="size-9 rounded-full border-3 border-emerald-500 border-t-transparent animate-spin" />
            <span className="text-xs text-slate-400 font-medium">Carregando cardápio...</span>
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-8 space-y-3">
            <UtensilsCrossed className="size-10 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-300">Nenhum produto encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não encontramos produtos para os filtros selecionados. Tente buscar por outro termo ou selecione outra categoria.
            </p>
            {busca && (
              <Button variant="outline" size="sm" onClick={() => setBusca("")} className="text-xs border-slate-700">
                Limpar Busca
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtosFiltrados.map((p) => {
              const temSabores = (p.produto_sabores?.length || 0) > 0 || p.permite_sabor;
              const temAdicionais = (p.produto_adicionais?.length || 0) > 0 || p.permite_adicionais;

              return (
                <Card
                  key={p.id}
                  className="bg-slate-900/90 border-slate-800/80 hover:border-emerald-500/40 transition-all duration-200 overflow-hidden flex flex-col justify-between group shadow-lg"
                >
                  <div className="p-4 space-y-2.5">
                    {/* Categoria e Tag */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 truncate">
                        {p.categoria?.nome || "EVS Fit"}
                      </span>
                      {p.envia_para_cozinha && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ChefHat className="size-3 text-amber-400" /> Preparo na hora
                        </span>
                      )}
                    </div>

                    {/* Nome do Produto */}
                    <h3 className="font-heading font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                      {p.nome}
                    </h3>

                    {/* Descrição */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">
                      {p.descricao || "Nutrição saborosa e balanceada para o seu dia a dia saudável."}
                    </p>

                    {/* Badges de Customização */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {temSabores && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          Opções de Sabores
                        </span>
                      )}
                      {temAdicionais && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                          + Adicionais
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Rodapé com Preço e Ação */}
                  <div className="p-4 pt-3 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block leading-tight">A partir de</span>
                      <span className="font-heading font-extrabold text-base md:text-lg text-emerald-400">
                        {brl(p.preco)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => abrirModalProduto(p)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-3.5 gap-1.5 rounded-xl shadow-md shadow-emerald-950/60"
                    >
                      <Plus className="size-3.5" />
                      <span>{temSabores || temAdicionais ? "Personalizar" : "Adicionar"}</span>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────────────────────── BARRA FLUTUANTE DE CHECKOUT (MOBILE & DESKTOP) ─────────────────────── */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-40">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-3.5 shadow-2xl shadow-emerald-950/80 flex items-center justify-between gap-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="relative size-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                <ShoppingCart className="size-5" />
                <span className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-slate-950 text-emerald-400 border border-emerald-500 text-[10px] font-extrabold flex items-center justify-center">
                  {totalItensCarrinho}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Total da sacola</span>
                <span className="text-base font-extrabold text-white font-heading">{brl(valorTotalCarrinho)}</span>
              </div>
            </div>

            <Button
              onClick={() => setCarrinhoAberto(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 px-5 rounded-xl gap-2 shadow-lg"
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
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="p-5 pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                  {produtoModal.categoria?.nome || "EVS Fit"}
                </Badge>
                <span className="font-heading font-bold text-base text-emerald-400">
                  {brl(precoTotalUnitarioModal)}
                </span>
              </div>
              <DialogTitle className="text-lg font-heading font-bold text-white mt-1">
                {produtoModal.nome}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400 mt-1">
                {produtoModal.descricao || "Personalize o item com seus sabores e acompanhamentos favoritos."}
              </DialogDescription>
            </DialogHeader>

            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {/* Seleção de Sabor */}
              {produtoModal.permite_sabor && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Escolha o Sabor
                    </Label>
                    <span className="text-[10px] text-amber-400 font-semibold">* Obrigatório</span>
                  </div>

                  {todosSabores.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum sabor cadastrado.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {todosSabores.map((s) => {
                        const selecionado = saborSelecionado === s.nome;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSaborSelecionado(s.nome)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                              selecionado
                                ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-xs"
                                : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            <span className="truncate">{s.nome}</span>
                            {selecionado && <Check className="size-3.5 text-emerald-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Seleção de Adicionais */}
              {produtoModal.permite_adicionais && todosAdicionais.length > 0 && (
                <div className="space-y-2.5 border-t border-slate-800/80 pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Adicionais & Extras
                    </Label>
                    <span className="text-[10px] text-slate-400">Opcional</span>
                  </div>

                  <div className="space-y-2">
                    {todosAdicionais.map((ad) => {
                      const selecionado = adicionaisSelecionados.some((a) => a.nome === ad.nome);
                      return (
                        <button
                          key={ad.id}
                          type="button"
                          onClick={() => {
                            if (selecionado) {
                              setAdicionaisSelecionados((prev) => prev.filter((a) => a.nome !== ad.nome));
                            } else {
                              setAdicionaisSelecionados((prev) => [...prev, { nome: ad.nome, preco: Number(ad.preco) }]);
                            }
                          }}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs font-medium transition-all flex items-center justify-between ${
                            selecionado
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                              : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`size-4 rounded-md border flex items-center justify-center ${selecionado ? "bg-emerald-500 border-emerald-400 text-slate-950" : "border-slate-700"}`}>
                              {selecionado && <Check className="size-3" />}
                            </div>
                            <span>{ad.nome}</span>
                          </div>
                          <span className="font-semibold text-emerald-400">
                            +{brl(ad.preco)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Observações Especiais */}
              <div className="space-y-1.5 border-t border-slate-800/80 pt-4">
                <Label className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Observações para a cozinha
                </Label>
                <Textarea
                  placeholder="Ex.: Sem calda, gelo extra, separar ingredientes..."
                  value={obsModal}
                  onChange={(e) => setObsModal(e.target.value)}
                  rows={2}
                  className="bg-slate-950/80 border-slate-800 text-xs text-slate-100 rounded-xl"
                />
              </div>

              {/* Seletor de Quantidade */}
              <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Quantidade</span>
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setQtdModal((q) => Math.max(1, q - 1))}
                    className="size-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="font-bold text-sm text-white px-2">{qtdModal}</span>
                  <button
                    type="button"
                    onClick={() => setQtdModal((q) => q + 1)}
                    className="size-7 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center transition-colors"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between sm:justify-between w-full">
              <Button variant="ghost" size="sm" onClick={() => setProdutoModal(null)} className="text-xs text-slate-400">
                Cancelar
              </Button>
              <Button
                onClick={adicionarAoCarrinho}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs px-5 h-10 rounded-xl gap-2 shadow-lg"
              >
                <span>Adicionar</span>
                <span>•</span>
                <span>{brl(precoTotalUnitarioModal * qtdModal)}</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────── GAVETA / DRAWER DO CARRINHO ─────────────────────── */}
      <Sheet open={carrinhoAberto} onOpenChange={setCarrinhoAberto}>
        <SheetContent side="right" className="w-full sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 p-0 flex flex-col justify-between">
          {/* Topo do Carrinho */}
          <SheetHeader className="p-5 border-b border-slate-800 flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-5 text-emerald-400" />
              <SheetTitle className="text-base font-heading font-bold text-white">
                Sua Sacola ({totalItensCarrinho})
              </SheetTitle>
            </div>
          </SheetHeader>

          {/* Conteúdo: Itens e Identificação */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
            {carrinho.length === 0 ? (
              <div className="py-24 text-center space-y-3">
                <ShoppingCart className="size-12 mx-auto text-slate-700" />
                <p className="text-sm text-slate-400 font-medium">Sua sacola está vazia</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCarrinhoAberto(false)}
                  className="text-xs border-slate-700 text-slate-300"
                >
                  Explorar Cardápio
                </Button>
              </div>
            ) : (
              <>
                {/* Lista de Itens Adicionados */}
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Itens Selecionados
                  </div>

                  {carrinho.map((it) => (
                    <div
                      key={it.id}
                      className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-heading font-bold text-sm text-white">{it.produto.nome}</h4>
                          {it.sabor && (
                            <span className="text-xs text-emerald-400 block font-medium">
                              Sabor: {it.sabor}
                            </span>
                          )}
                          {it.adicionais.length > 0 && (
                            <span className="text-[11px] text-slate-400 block">
                              + {it.adicionais.map((a) => a.nome).join(", ")}
                            </span>
                          )}
                          {it.observacoes && (
                            <span className="text-[11px] text-slate-400 italic block mt-0.5">
                              Obs: "{it.observacoes}"
                            </span>
                          )}
                        </div>

                        <button
                          onClick={() => removerItemCarrinho(it.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                          title="Remover item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                        <span className="text-xs font-bold text-emerald-400">
                          {brl(it.precoTotalUnitario * it.quantidade)}
                        </span>

                        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => alterarQtdCarrinho(it.id, -1)}
                            className="size-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="text-xs font-bold px-1.5">{it.quantidade}</span>
                          <button
                            onClick={() => alterarQtdCarrinho(it.id, 1)}
                            className="size-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tipo de Consumo / Pedido */}
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Onde vai consumir?
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoEntrega("local")}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-center flex flex-col items-center gap-1 ${
                        tipoEntrega === "local"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
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
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
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
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold"
                          : "bg-slate-950 border-slate-800 text-slate-400"
                      }`}
                    >
                      <MapPin className="size-4" />
                      <span>Entrega</span>
                    </button>
                  </div>

                  {tipoEntrega === "local" && (
                    <div>
                      <Label className="text-xs text-slate-300">Número da Mesa (opcional)</Label>
                      <Input
                        placeholder="Ex.: Mesa 03"
                        value={mesa}
                        onChange={(e) => setMesa(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                      />
                    </div>
                  )}

                  {tipoEntrega === "delivery" && (
                    <div>
                      <Label className="text-xs text-slate-300">Endereço de Entrega</Label>
                      <Input
                        placeholder="Rua, número, complemento, bairro"
                        value={endereco}
                        onChange={(e) => setEndereco(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                      />
                    </div>
                  )}
                </div>

                {/* Identificação do Cliente */}
                <div className="space-y-3 border-t border-slate-800 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Seus Dados
                    </span>
                    {!userSession && (
                      <button
                        type="button"
                        onClick={() => setAuthModalAberto(true)}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Já tem conta? Entrar
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div>
                      <Label className="text-xs text-slate-300">Seu Nome *</Label>
                      <Input
                        placeholder="Como devemos te chamar?"
                        value={clienteNome}
                        onChange={(e) => setClienteNome(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-300">WhatsApp / Telefone *</Label>
                      <Input
                        placeholder="(DDD) 99999-9999"
                        value={clienteTelefone}
                        onChange={(e) => setClienteTelefone(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                      />
                    </div>

                    <div>
                      <Label className="text-xs text-slate-300">Observações Gerais</Label>
                      <Input
                        placeholder="Instruções para entrega ou preparo..."
                        value={obsPedido}
                        onChange={(e) => setObsPedido(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Rodapé e Botão Finalizar */}
          {carrinho.length > 0 && (
            <SheetFooter className="p-5 border-t border-slate-800 bg-slate-950/80 space-y-3 sm:space-y-3">
              <div className="w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Subtotal</span>
                  <span>{brl(valorTotalCarrinho)}</span>
                </div>
                <div className="flex items-center justify-between text-base font-extrabold text-white font-heading">
                  <span>Total do Pedido</span>
                  <span className="text-emerald-400">{brl(valorTotalCarrinho)}</span>
                </div>
              </div>

              <Button
                onClick={finalizarPedido}
                disabled={enviandoPedido}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm h-12 rounded-xl gap-2 shadow-xl shadow-emerald-950/60"
              >
                {enviandoPedido ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-slate-950 border-t-transparent animate-spin rounded-full" />
                    <span>Lançando no EVS...</span>
                  </div>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    <span>Confirmar e Enviar Pedido</span>
                  </>
                )}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* ─────────────────────── MODAL PEDIDO CONFIRMADO COM SUCESSO ─────────────────────── */}
      {pedidoConfirmado && (
        <Dialog open={!!pedidoConfirmado} onOpenChange={() => setPedidoConfirmado(null)}>
          <DialogContent className="max-w-md bg-slate-900 border-emerald-500/30 text-slate-100 p-6 rounded-2xl text-center">
            <div className="size-16 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle2 className="size-9" />
            </div>

            <DialogHeader className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Pedido Lançado com Sucesso!
              </span>
              <DialogTitle className="text-2xl font-heading font-extrabold text-white">
                Comanda #{pedidoConfirmado.numero}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-300">
                Olá, <strong>{pedidoConfirmado.clienteNome}</strong>! Seu pedido já foi recebido e entrou na fila de preparo da cozinha do EVS.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-400 font-semibold border-b border-slate-800 pb-2">
                <span>Resumo do Pedido</span>
                <span className="text-emerald-400 font-bold">{brl(pedidoConfirmado.total)}</span>
              </div>
              <ul className="space-y-1 text-slate-300">
                {pedidoConfirmado.itens.map((it, idx) => (
                  <li key={idx} className="flex justify-between items-center">
                    <span>
                      {it.quantidade}x {it.produto.nome}
                      {it.sabor ? ` (${it.sabor})` : ""}
                    </span>
                    <span className="text-slate-400">{brl(it.precoTotalUnitario * it.quantidade)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                onClick={abrirWhatsAppConfirmacao}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-11 rounded-xl gap-2 shadow-lg"
              >
                <MessageCircle className="size-4" />
                <span>Confirmar / Acompanhar no WhatsApp</span>
              </Button>

              <Button
                variant="outline"
                onClick={() => setPedidoConfirmado(null)}
                className="w-full border-slate-800 hover:bg-slate-800 text-slate-300 text-xs h-9 rounded-xl"
              >
                Fazer Novo Pedido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────── MODAL DE AUTENTICAÇÃO DO CLIENTE ─────────────────────── */}
      {authModalAberto && (
        <Dialog open={authModalAberto} onOpenChange={setAuthModalAberto}>
          <DialogContent className="max-w-sm bg-slate-900 border-slate-800 text-slate-100 p-6 rounded-2xl">
            <DialogHeader className="text-center space-y-1">
              <DialogTitle className="text-lg font-heading font-bold text-white">
                {authMode === "login" ? "Entrar na sua Conta" : "Criar sua Conta no EVS"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Acompanhe o status dos seus pedidos e salve seus shakes prediletos.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAuth} className="space-y-3.5 mt-3">
              {authMode === "signup" && (
                <>
                  <div>
                    <Label className="text-xs text-slate-300">Nome Completo</Label>
                    <Input
                      required
                      placeholder="Seu nome"
                      value={authNome}
                      onChange={(e) => setAuthNome(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-300">WhatsApp / Telefone</Label>
                    <Input
                      required
                      placeholder="(DDD) 99999-9999"
                      value={authTelefone}
                      onChange={(e) => setAuthTelefone(e.target.value)}
                      className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="text-xs text-slate-300">E-mail</Label>
                <Input
                  required
                  type="email"
                  placeholder="seu@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                />
              </div>

              <div>
                <Label className="text-xs text-slate-300">Senha</Label>
                <Input
                  required
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="bg-slate-950 border-slate-800 h-9 text-xs rounded-xl mt-1 text-slate-100"
                />
              </div>

              <Button
                type="submit"
                disabled={authLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-10 rounded-xl mt-2"
              >
                {authLoading ? "Processando..." : authMode === "login" ? "Entrar" : "Criar Conta"}
              </Button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800 mt-2">
              <button
                type="button"
                onClick={() => setAuthMode((m) => (m === "login" ? "signup" : "login"))}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
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
        <SheetContent side="left" className="w-full sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 p-0 flex flex-col justify-between">
          <SheetHeader className="p-5 border-b border-slate-800">
            <SheetTitle className="text-base font-heading font-bold text-white flex items-center gap-2">
              <Receipt className="size-5 text-emerald-400" />
              <span>Histórico de Pedidos</span>
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {meusPedidos.length === 0 ? (
              <div className="py-20 text-center space-y-2">
                <Receipt className="size-10 mx-auto text-slate-700" />
                <p className="text-xs text-slate-400">Nenhum pedido anterior encontrado.</p>
              </div>
            ) : (
              meusPedidos.map((ped: any) => (
                <div key={ped.id} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-bold text-white text-sm">
                      Comanda #{ped.numero}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                      {ped.status_comanda === "paga" ? "Finalizada" : "Em andamento"}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    {new Date(ped.data_hora).toLocaleString("pt-BR")}
                  </span>
                  <div className="border-t border-slate-800/80 pt-2 space-y-1">
                    {ped.itens?.map((it: any, i: number) => (
                      <div key={i} className="flex justify-between text-slate-300 text-[11px]">
                        <span>
                          {it.quantidade}x {it.nome_produto}
                          {it.sabor ? ` (${it.sabor})` : ""}
                        </span>
                        <span className="text-slate-400">{brl(it.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-slate-800/80 pt-1.5 flex justify-between font-bold text-white">
                    <span>Total</span>
                    <span className="text-emerald-400">{brl(ped.total)}</span>
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
