import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { brl, num } from "@/lib/format";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ChefHat,
  Receipt,
  TrendingUp,
  Wallet,
  AlertTriangle,
  Sparkles,
  Users,
  Trophy,
  CreditCard,
  PiggyBank,
  ArrowDownRight,
  ArrowUpRight,
  Lock,
  Unlock,
  ChevronRight,
  Clock,
  CircleDot,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { rangeFor, type Periodo } from "@/lib/relatorios";

export const Route = createFileRoute("/_authenticated/")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard Geral — FitLife SisEVS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { perfil, podeFinanceiro, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [custom, setCustom] = useState({ de: "", ate: "" });
  const { ini, fim, label } = rangeFor(periodo, custom);
  const [faturamentoOpen, setFaturamentoOpen] = useState(false);

  // Redirecionar funcionário para Comandas
  useEffect(() => {
    if (perfil && perfil.role === "funcionario") {
      navigate({ to: "/pedidos" as any, replace: true });
    }
  }, [perfil, navigate]);

  const { data: pedidos = [] } = useQuery({
    queryKey: ["dash-pedidos", periodo, custom.de, custom.ate],
    queryFn: async () => {
      const { data } = await supabase
        .from("pedidos")
        .select(
          "id,numero,total,valor_pago,valor_pendente,custo_total,lucro_estimado,forma_pagamento,status_pedido,status_pagamento,status_comanda,data_hora,desconto"
        )
        .gte("data_hora", ini.toISOString())
        .lte("data_hora", fim.toISOString());
      return data ?? [];
    },
  });

  const { data: lancs = [] } = useQuery({
    queryKey: ["dash-fin", periodo, custom.de, custom.ate],
    queryFn: async () => {
      const { data } = await supabase
        .from("financeiro_lancamentos")
        .select("tipo,valor,forma_pagamento,categoria,status,data")
        .eq("status", "ativo")
        .gte("data", ini.toISOString().slice(0, 10))
        .lte("data", fim.toISOString().slice(0, 10));
      return data ?? [];
    },
  });

  const { data: caixa } = useQuery({
    queryKey: ["dash-caixa-aberto"],
    queryFn: async () =>
      (await supabase.from("caixas").select("*").eq("status", "aberto").maybeSingle()).data,
  });

  const validos = pedidos.filter(
    (p: any) => p.status_pedido !== "cancelado" && p.status_comanda !== "cancelada"
  );
  const pagas = validos.filter((p: any) => p.status_pagamento === "pago");
  const parciais = validos.filter((p: any) => p.status_pagamento === "parcial");
  const pendentes = validos.filter((p: any) => p.status_pagamento === "pendente");
  const abertas = validos.filter((p: any) => ["aberta", "em_consumo"].includes(p.status_comanda));
  const aguardandoPag = validos.filter((p: any) => p.status_comanda === "aguardando_pagamento");
  const canceladas = pedidos.filter(
    (p: any) => p.status_pedido === "cancelado" || p.status_comanda === "cancelada"
  );

  const faturamento =
    pagas.reduce((s: number, p: any) => s + Number(p.total), 0) +
    parciais.reduce((s: number, p: any) => s + Number(p.valor_pago || 0), 0);
  const aReceber =
    pendentes.reduce((s: number, p: any) => s + Number(p.total), 0) +
    parciais.reduce((s: number, p: any) => s + Number(p.valor_pendente || 0), 0);
  const lucro = pagas.reduce((s: number, p: any) => s + Number(p.lucro_estimado), 0);
  const ticket = pagas.length
    ? pagas.reduce((s: number, p: any) => s + Number(p.total), 0) / pagas.length
    : 0;

  const entradas = lancs
    .filter((l: any) => l.tipo === "entrada")
    .reduce((s: number, l: any) => s + Number(l.valor), 0);
  const saidas = lancs
    .filter((l: any) => l.tipo === "saida")
    .reduce((s: number, l: any) => s + Number(l.valor), 0);
  const saldo = entradas - saidas;

  const formas = ["pix", "dinheiro", "debito", "credito"] as const;
  const porForma = formas.map((fp) => ({
    nome: fp.charAt(0).toUpperCase() + fp.slice(1),
    valor: lancs
      .filter((l: any) => l.tipo === "entrada" && l.forma_pagamento === fp)
      .reduce((a: number, l: any) => a + Number(l.valor), 0),
  }));

  const { data: topProdutos = [] } = useQuery({
    queryKey: ["dash-top-prod"],
    queryFn: async () =>
      (await supabase.from("vw_produtos_mais_vendidos").select("*").limit(7)).data ?? [],
  });
  const { data: topClientes = [] } = useQuery({
    queryKey: ["dash-top-cli"],
    queryFn: async () =>
      (await supabase.from("vw_clientes_top").select("*").limit(6)).data ?? [],
  });
  const { data: alertas = [] } = useQuery({
    queryKey: ["dash-alertas"],
    queryFn: async () =>
      (
        await supabase
          .from("vw_estoque_alertas")
          .select("*")
          .in("alerta", ["abaixo_minimo", "em_falta", "vencido", "proximo_vencimento"])
          .limit(8)
      ).data ?? [],
  });

  // Cozinha: itens hoje
  const { data: cozItens = [] } = useQuery({
    queryKey: ["dash-cozinha"],
    queryFn: async () => {
      const hojeIni = startOfDay(new Date()).toISOString();
      const { data } = await supabase
        .from("pedido_itens")
        .select(
          "id,status_preparo,enviado_cozinha_em,pronto_em,nome_produto,pedido:pedidos!inner(numero,data_hora)"
        )
        .eq("envia_para_cozinha", true)
        .gte("pedido.data_hora", hojeIni)
        .order("enviado_cozinha_em", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });
  const cozNovos = cozItens.filter((i: any) => i.status_preparo === "novo").length;
  const cozPreparo = cozItens.filter((i: any) => i.status_preparo === "em_preparo").length;
  const cozProntos = cozItens.filter((i: any) => i.status_preparo === "pronto").length;
  const cozTempos = cozItens
    .filter((i: any) => i.enviado_cozinha_em && i.pronto_em)
    .map(
      (i: any) =>
        (new Date(i.pronto_em).getTime() - new Date(i.enviado_cozinha_em).getTime()) / 60000
    );
  const cozTempoMedio = cozTempos.length
    ? cozTempos.reduce((a: number, b: number) => a + b, 0) / cozTempos.length
    : 0;

  // série diária últimos 14 dias
  const { data: serie = [] } = useQuery({
    queryKey: ["dash-serie"],
    queryFn: async () => {
      const ini14 = startOfDay(subDays(new Date(), 13));
      const { data } = await supabase
        .from("pedidos")
        .select("data_hora,total,valor_pago,status_pagamento,status_pedido")
        .gte("data_hora", ini14.toISOString());
      const dias: Record<string, number> = {};
      for (let i = 13; i >= 0; i--) dias[format(subDays(new Date(), i), "dd/MM")] = 0;
      (data ?? []).forEach((p: any) => {
        if (p.status_pedido === "cancelado") return;
        const d = format(new Date(p.data_hora), "dd/MM");
        if (!(d in dias)) return;
        if (p.status_pagamento === "pago") dias[d] += Number(p.total);
        else if (p.status_pagamento === "parcial") dias[d] += Number(p.valor_pago || 0);
      });
      return Object.entries(dias).map(([dia, total]) => ({ dia, total }));
    },
  });

  const chartPalette = ["#059669", "#d97706", "#10b981", "#0284c7", "#f43f5e"];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              Olá, {perfil?.nome?.split(" ")[0] ?? "equipe"}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao Vivo
            </span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            Visão Geral • {label} • {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Period Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
            <TabsList className="bg-secondary/80 border border-border/70 p-1 rounded-xl h-auto">
              <TabsTrigger value="hoje" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Hoje</TabsTrigger>
              <TabsTrigger value="ontem" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Ontem</TabsTrigger>
              <TabsTrigger value="semana" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Semana</TabsTrigger>
              <TabsTrigger value="mes" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Mês</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">7d</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">30d</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs px-3 py-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
          {periodo === "custom" && (
            <div className="flex gap-2 items-center bg-card p-1.5 rounded-xl border border-border shadow-xs">
              <Input
                type="date"
                value={custom.de}
                onChange={(e) => setCustom({ ...custom, de: e.target.value })}
                className="h-8 text-xs w-32"
              />
              <span className="text-xs text-muted-foreground">até</span>
              <Input
                type="date"
                value={custom.ate}
                onChange={(e) => setCustom({ ...custom, ate: e.target.value })}
                className="h-8 text-xs w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Faturamento popup */}
      <FaturamentoDialog
        open={faturamentoOpen}
        onClose={() => setFaturamentoOpen(false)}
        pagas={pagas}
        parciais={parciais}
        faturamento={faturamento}
      />

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Faturamento Confirmado"
          value={brl(faturamento)}
          icon={TrendingUp}
          theme="emerald"
          badge="Vendas Concluídas"
          onClick={() => setFaturamentoOpen(true)}
        />
        <Kpi
          title="Valores a Receber"
          value={brl(aReceber)}
          icon={Wallet}
          theme="amber"
          badge="Pendentes / Parciais"
        />
        <Kpi
          title="Ticket Médio"
          value={brl(ticket)}
          icon={Receipt}
          theme="teal"
          badge={`${pagas.length} pedidos pagos`}
        />
        {podeFinanceiro ? (
          <Kpi
            title="Lucro Estimado"
            value={brl(lucro)}
            icon={PiggyBank}
            theme="gold"
            badge="Margem de Contribuição"
          />
        ) : (
          <Kpi
            title="Total de Comandas"
            value={num(pagas.length)}
            icon={Receipt}
            theme="gold"
            badge="Operação do Turno"
          />
        )}
      </div>

      {/* Financial KPIs (If Authorized) */}
      {podeFinanceiro && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Kpi
            title="Entradas Lançadas"
            value={brl(entradas)}
            icon={ArrowUpRight}
            theme="emerald"
          />
          <Kpi
            title="Saídas do Período"
            value={brl(saidas)}
            icon={ArrowDownRight}
            theme="rose"
          />
          <Kpi
            title="Saldo Operacional"
            value={brl(saldo)}
            icon={Wallet}
            theme={saldo >= 0 ? "emerald" : "rose"}
          />
          <Kpi
            title={caixa ? "Status do Caixa: Aberto" : "Status do Caixa: Fechado"}
            value={
              caixa
                ? brl(
                    Number(caixa.valor_inicial) +
                      Number(caixa.total_dinheiro) +
                      Number(caixa.total_reforcos) -
                      Number(caixa.total_sangrias) -
                      Number(caixa.total_saidas)
                  )
                : "Caixa Inativo"
            }
            icon={caixa ? Unlock : Lock}
            theme={caixa ? "teal" : "slate"}
          />
        </div>
      )}

      {/* Operational Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MiniStat label="Abertas" value={abertas.length} dotColor="bg-emerald-500" />
        <MiniStat label="Aguardando Pagto" value={aguardandoPag.length} dotColor="bg-amber-500" />
        <MiniStat label="Pagas" value={pagas.length} dotColor="bg-teal-500" />
        <MiniStat label="Parciais" value={parciais.length} dotColor="bg-sky-500" />
        <MiniStat label="Canceladas" value={canceladas.length} dotColor="bg-rose-500" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (14 days) */}
        <Card className="lg:col-span-2 border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-base md:text-lg font-semibold">
                  Evolução de Vendas
                </CardTitle>
                <CardDescription className="text-xs">
                  Faturamento diário confirmado nos últimos 14 dias
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={serie} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis
                  dataKey="dia"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  stroke="var(--border)"
                  tickLine={false}
                  tickFormatter={(v) => `R$${v}`}
                />
                <Tooltip
                  formatter={(v: any) => [brl(Number(v)), "Vendas"]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#059669"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTotal)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Methods Distribution */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base md:text-lg font-semibold">
              Formas de Pagamento
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição por meio de recebimento
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={porForma.filter((f) => f.valor > 0)}
                  dataKey="valor"
                  nameKey="nome"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  cornerRadius={4}
                >
                  {porForma.map((_, i) => (
                    <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [brl(Number(v)), "Total"]}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(value) => <span className="text-foreground/80 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Trophy className="size-4" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base font-semibold">
                    Produtos Mais Vendidos
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Itens com maior saída no período
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topProdutos.map((p: any) => ({
                  nome: (p.nome_produto ?? "?").slice(0, 20),
                  qtd: Number(p.qtd_vendida),
                }))}
                layout="vertical"
                margin={{ left: 10, right: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.6} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis
                  dataKey="nome"
                  type="category"
                  tick={{ fontSize: 11 }}
                  stroke="var(--muted-foreground)"
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="qtd" fill="#059669" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Clients */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="size-4" />
              </div>
              <div>
                <CardTitle className="font-heading text-base font-semibold">
                  Principais Clientes
                </CardTitle>
                <CardDescription className="text-xs">
                  Clientes com maior recorrência e volume
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!topClientes.length ? (
              <Empty>Nenhum dado de cliente encontrado.</Empty>
            ) : (
              <ul className="divide-y divide-border/60">
                {topClientes.map((c: any) => (
                  <li key={c.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {(c.nome ?? "?").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate">{c.nome}</div>
                        <div className="text-xs text-muted-foreground">{num(c.qtd_pedidos)} pedidos concluídos</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {brl(c.total_gasto)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Operational Highlights: Kitchen, Stock, Open Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kitchen Status */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ChefHat className="size-4" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base font-semibold">Cozinha Hoje</CardTitle>
                  <CardDescription className="text-xs">Fila e tempo de preparo</CardDescription>
                </div>
              </div>
              <Link to="/cozinha" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                Abrir <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-center">
                <div className="text-lg font-bold text-foreground">{cozNovos}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase">Novos</div>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-center">
                <div className="text-lg font-bold text-amber-600">{cozPreparo}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase">Preparo</div>
              </div>
              <div className="p-2.5 rounded-lg bg-secondary/80 border border-border text-center">
                <div className="text-lg font-bold text-emerald-600">{cozProntos}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase">Prontos</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/40 p-2 rounded-lg">
              <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> Tempo médio:</span>
              <span className="font-semibold text-foreground">{cozTempoMedio.toFixed(1)} min</span>
            </div>

            <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {cozItens.slice(0, 5).map((i: any) => (
                <li key={i.id} className="flex items-center justify-between text-xs rounded-lg bg-secondary/60 px-2.5 py-1.5 border border-border/50">
                  <span className="truncate font-medium">#{i.pedido?.numero} • {i.nome_produto}</span>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {i.status_preparo}
                  </Badge>
                </li>
              ))}
              {!cozItens.length && <li className="text-xs text-muted-foreground py-3 text-center">Nenhum pedido na fila.</li>}
            </ul>
          </CardContent>
        </Card>

        {/* Stock Alerts */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base font-semibold">Alertas de Estoque</CardTitle>
                  <CardDescription className="text-xs">Itens críticos ou em baixa</CardDescription>
                </div>
              </div>
              <Link to="/estoque" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                Estoque <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!alertas.length ? (
              <Empty>Todos os insumos em nível seguro.</Empty>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {alertas.map((a: any) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg bg-secondary/60 p-2.5 gap-2 border border-border/50 text-xs">
                    <span className="font-medium truncate">{a.nome}</span>
                    <AlertaBadge tipo={a.alerta} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Open Orders */}
        <Card className="border-border/80 shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="size-4" />
                </div>
                <div>
                  <CardTitle className="font-heading text-base font-semibold">Comandas em Aberto</CardTitle>
                  <CardDescription className="text-xs">Consumo ativo no salão</CardDescription>
                </div>
              </div>
              <Link to="/pedidos" className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-0.5">
                Comandas <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!abertas.length && !aguardandoPag.length ? (
              <Empty>Nenhuma comanda aberta no momento.</Empty>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {[...abertas, ...aguardandoPag].slice(0, 6).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between rounded-lg bg-secondary/60 p-2.5 border border-border/50 text-xs">
                    <span className="font-semibold text-foreground">Comanda #{p.numero}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {p.status_comanda}
                      </Badge>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {brl(p.total)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  title,
  value,
  icon: Icon,
  theme,
  badge,
  onClick,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: "emerald" | "gold" | "amber" | "teal" | "rose" | "slate";
  badge?: string;
  onClick?: () => void;
}) {
  const styles = {
    emerald: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    gold: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    amber: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    teal: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    rose: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    slate: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  };

  return (
    <Card
      className={"border-border/80 shadow-xs hover:border-emerald-500/40 transition-colors" + (onClick ? " cursor-pointer" : "")}
      onClick={onClick}
    >
      <CardContent className="p-4 md:p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide truncate">
            {title}
          </span>
          <div className={`size-8 rounded-lg flex items-center justify-center border shrink-0 ${styles[theme]}`}>
            <Icon className="size-4" />
          </div>
        </div>
        <div>
          <div className="text-xl md:text-2xl font-heading font-bold text-foreground tracking-tight truncate tabular-nums">
            {value}
          </div>
          {badge && (
            <div className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
              {badge}
            </div>
          )}
          {onClick && (
            <div className="text-[10px] text-emerald-600 font-semibold mt-1">Clique para detalhar →</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FaturamentoDialog({
  open, onClose, pagas, parciais, faturamento,
}: {
  open: boolean;
  onClose: () => void;
  pagas: any[];
  parciais: any[];
  faturamento: number;
}) {
  const hoje = startOfDay(new Date());
  const pagasHoje = pagas.filter((p: any) => new Date(p.data_hora) >= hoje);
  const parciaisHoje = parciais.filter((p: any) => new Date(p.data_hora) >= hoje);
  const faturamentoHoje =
    pagasHoje.reduce((s: number, p: any) => s + Number(p.total), 0) +
    parciaisHoje.reduce((s: number, p: any) => s + Number(p.valor_pago || 0), 0);

  const todos = [
    ...pagasHoje.map((p: any) => ({ ...p, _tipo: "pago" })),
    ...parciaisHoje.map((p: any) => ({ ...p, _tipo: "parcial" })),
  ].sort((a: any, b: any) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            Faturamento Confirmado — Hoje
          </DialogTitle>
          <DialogDescription>
            Vendas pagas e parciais registradas hoje ({format(new Date(), "dd/MM/yyyy")}).
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between items-center text-sm px-1 py-2 border-b border-border">
          <span className="text-muted-foreground font-medium">{todos.length} pedido{todos.length !== 1 ? "s" : ""}</span>
          <span className="text-xl font-bold text-emerald-600">{brl(faturamentoHoje)}</span>
        </div>
        <div className="overflow-y-auto flex-1 pr-1">
          {todos.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Nenhum pagamento hoje.</div>
          ) : (
            <ul className="divide-y divide-border/60">
              {todos.map((p: any) => {
                const valor = p._tipo === "pago" ? Number(p.total) : Number(p.valor_pago || 0);
                return (
                  <li key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        #{p.numero}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">
                          {format(new Date(p.data_hora), "HH:mm")}
                          {p.forma_pagamento && <span className="text-muted-foreground font-normal"> · {p.forma_pagamento}</span>}
                        </div>
                        {p._tipo === "parcial" && (
                          <div className="text-[10px] text-amber-600 font-semibold uppercase">Parcial</div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-foreground tabular-nums">{brl(valor)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniStat({ label, value, dotColor }: { label: string; value: number; dotColor: string }) {
  return (
    <Card className="border-border/80 shadow-xs">
      <CardContent className="p-3 text-center flex flex-col items-center justify-center">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`size-2 rounded-full ${dotColor}`} />
          <span className="text-xl font-heading font-bold text-foreground tabular-nums">{num(value)}</span>
        </div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground truncate max-w-full">
          {label}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertaBadge({ tipo }: { tipo: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    vencido: { label: "Vencido", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
    em_falta: { label: "Em falta", cls: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
    proximo_vencimento: { label: "Próx. Vencimento", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    abaixo_minimo: { label: "Abaixo do Mínimo", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  };
  const c = cfg[tipo] ?? { label: tipo, cls: "bg-secondary text-foreground" };
  return <Badge variant="outline" className={`${c.cls} text-[10px] font-semibold uppercase`}>{c.label}</Badge>;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-muted-foreground py-8 text-center">{children}</div>;
}
