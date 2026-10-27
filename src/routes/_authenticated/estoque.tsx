import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/use-auth";
import { useConfigLoja } from "@/hooks/use-config-loja";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Pencil,
  ArrowDown,
  ArrowUp,
  AlertTriangle,
  History,
  Search,
  Layers,
  Save,
  Check,
  X,
  Loader2,
  SlidersHorizontal,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({ meta: [{ title: "Estoque — FitLife" }] }),
  component: EstoquePage,
});

type Item = {
  id: string; nome: string; categoria: string | null; quantidade_atual: number;
  unidade_medida: string; estoque_minimo: number; custo_unitario: number;
  fornecedor: string | null; validade: string | null; ativo: boolean;
};

const UNIDADES = ["unidade","pote","sachê","dose","caixa","pacote","g","kg","l","ml"];
const CATEGORIAS = ["Insumos Herbalife","Embalagens","Ingredientes","Outros"];

type Filtro = "todos" | "baixo" | "zerado" | "vencendo" | "vencido" | "ativos" | "inativos";

function EstoquePage() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const { diasAlertaVencimento } = useConfigLoja();
  const [editar, setEditar] = useState<Item | null>(null);
  const [novo, setNovo] = useState(false);
  const [edicaoLote, setEdicaoLote] = useState(false);
  const [movItem, setMovItem] = useState<Item | null>(null);
  const [histItem, setHistItem] = useState<Item | null>(null);

  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<string>("todas");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const { data: itens = [] } = useQuery({
    queryKey: ["estoque"],
    queryFn: async () => {
      const { data } = await supabase.from("estoque_itens").select("*").order("nome");
      return (data ?? []) as Item[];
    },
  });

  const categoriasDisponiveis = useMemo(() => {
    const setCats = new Set<string>();
    CATEGORIAS.forEach((c) => setCats.add(c));
    itens.forEach((i) => {
      if (i.categoria) setCats.add(i.categoria);
    });
    return Array.from(setCats).sort();
  }, [itens]);

  const contagemPorCategoria = useMemo(() => {
    const map: Record<string, number> = {};
    itens.forEach((i) => {
      const cat = i.categoria || "Outros";
      map[cat] = (map[cat] || 0) + 1;
    });
    return map;
  }, [itens]);

  const limiteVenc = diasAlertaVencimento * 24 * 3600 * 1000;
  const agora = Date.now();

  const isBaixo = (i: Item) => i.estoque_minimo > 0 && Number(i.quantidade_atual) <= Number(i.estoque_minimo) && Number(i.quantidade_atual) > 0;
  const isZerado = (i: Item) => Number(i.quantidade_atual) <= 0;
  const isVencendo = (i: Item) => {
    if (!i.validade) return false;
    const diff = new Date(i.validade).getTime() - agora;
    return diff >= 0 && diff <= limiteVenc;
  };
  const isVencido = (i: Item) => i.validade ? new Date(i.validade).getTime() < agora : false;

  const baixo = itens.filter(isBaixo);
  const vencendo = itens.filter(isVencendo);
  const vencido = itens.filter(isVencido);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (q && !i.nome.toLowerCase().includes(q)) return false;
      if (categoria !== "todas" && (i.categoria ?? "") !== categoria) return false;
      switch (filtro) {
        case "baixo": return isBaixo(i);
        case "zerado": return isZerado(i);
        case "vencendo": return isVencendo(i);
        case "vencido": return isVencido(i);
        case "ativos": return i.ativo;
        case "inativos": return !i.ativo;
        default: return true;
      }
    });
  }, [itens, busca, categoria, filtro, diasAlertaVencimento]);

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Package className="size-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Estoque</h1>
        </div>
        <div className="flex items-center gap-2">
          {perfil?.role === "admin" && (
            <Button
              variant="outline"
              onClick={() => setEdicaoLote(true)}
              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
            >
              <Layers className="size-4" /> Edição em Lote
            </Button>
          )}
          <Button onClick={() => setNovo(true)} className="bg-gold text-gold-foreground hover:bg-gold/90">
            <Plus className="size-4 mr-1" /> Novo item
          </Button>
        </div>
      </div>

      {(baixo.length > 0 || vencendo.length > 0 || vencido.length > 0) && (
        <Card className="p-3 mb-4 border-amber-500/40 bg-amber-500/5">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-1">
            <AlertTriangle className="size-4" /><span className="font-semibold">Alertas</span>
          </div>
          {baixo.length > 0 && <div className="text-sm">{baixo.length} item(ns) abaixo do mínimo</div>}
          {vencendo.length > 0 && <div className="text-sm">{vencendo.length} item(ns) vencendo em até {diasAlertaVencimento} dias</div>}
          {vencido.length > 0 && <div className="text-sm text-red-600">{vencido.length} item(ns) vencido(s)</div>}
        </Card>
      )}

      {/* ── Barra de Filtro Rápido por Categorias ── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <button
          type="button"
          onClick={() => setCategoria("todas")}
          className={
            "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border " +
            (categoria === "todas"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground")
          }
        >
          <span>Todas Categorias</span>
          <Badge
            variant="secondary"
            className={
              "px-1.5 py-0 text-[10px] font-semibold h-4 " +
              (categoria === "todas" ? "bg-primary-foreground/20 text-primary-foreground" : "")
            }
          >
            {itens.length}
          </Badge>
        </button>

        {categoriasDisponiveis.map((cat) => {
          const qtd = contagemPorCategoria[cat] || 0;
          const ativo = categoria === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoria(cat)}
              className={
                "px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 border " +
                (ativo
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground")
              }
            >
              <span>{cat}</span>
              <Badge
                variant="secondary"
                className={
                  "px-1.5 py-0 text-[10px] font-semibold h-4 " +
                  (ativo ? "bg-primary-foreground/20 text-primary-foreground" : "")
                }
              >
                {qtd}
              </Badge>
            </button>
          );
        })}
      </div>

      <Card className="p-3 mb-4 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-xs">Buscar</Label>
          <div className="relative">
            <Search className="size-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome do item..." className="pl-8" />
          </div>
        </div>
        <div className="min-w-[160px]">
          <Label className="text-xs">Categoria</Label>
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categoriasDisponiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px]">
          <Label className="text-xs">Filtro</Label>
          <Select value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="baixo">Estoque baixo</SelectItem>
              <SelectItem value="zerado">Estoque zerado</SelectItem>
              <SelectItem value="vencendo">Vencendo (≤ {diasAlertaVencimento} dias)</SelectItem>
              <SelectItem value="vencido">Vencido</SelectItem>
              <SelectItem value="ativos">Ativos</SelectItem>
              <SelectItem value="inativos">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border">
            <tr><th className="text-left py-2">Item</th><th className="text-left">Categoria</th><th className="text-right">Qtd atual</th><th className="text-right">Mínimo</th><th className="text-right">Custo un.</th><th className="text-left">Validade</th><th></th></tr>
          </thead>
          <tbody>
            {filtrados.map((i) => {
              const ok = i.estoque_minimo === 0 || i.quantidade_atual > i.estoque_minimo;
              const vence = isVencendo(i);
              const venceu = isVencido(i);
              return (
                <tr key={i.id} className={"border-b border-border hover:bg-muted/40 " + (i.ativo ? "" : "opacity-60")}>
                  <td className="py-2 font-medium">{i.nome} {!i.ativo && <Badge variant="outline" className="ml-1 text-xs">inativo</Badge>}</td>
                  <td className="text-muted-foreground">{i.categoria ?? "—"}</td>
                  <td className="text-right">
                    <span className={ok ? "" : "text-amber-600 font-semibold"}>{i.quantidade_atual} {i.unidade_medida}</span>
                  </td>
                  <td className="text-right text-muted-foreground">{i.estoque_minimo > 0 ? `${i.estoque_minimo} ${i.unidade_medida}` : "—"}</td>
                  <td className="text-right">{brl(i.custo_unitario)}</td>
                  <td className={venceu ? "text-red-600 font-semibold" : vence ? "text-amber-600" : ""}>
                    {i.validade ? new Date(i.validade).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setMovItem(i)}><ArrowUp className="size-4 text-green-600" /></Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setHistItem(i)}><History className="size-4" /></Button>
                    {perfil?.role === "admin" && <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditar(i)}><Pencil className="size-4" /></Button>}
                  </td>
                </tr>
              );
            })}
            {filtrados.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Nenhum item encontrado.</td></tr>}
          </tbody>
        </table>
      </div>

      {(novo || editar) && (
        <ItemForm
          item={editar}
          categoriasDisponiveis={categoriasDisponiveis}
          onClose={() => { setNovo(false); setEditar(null); qc.invalidateQueries({ queryKey: ["estoque"] }); }}
          onMovimentar={(it) => { setEditar(null); setNovo(false); setMovItem(it); }}
        />
      )}
      {movItem && <MovDialog item={movItem} onClose={() => { setMovItem(null); qc.invalidateQueries({ queryKey: ["estoque"] }); }} />}
      {histItem && <HistDialog item={histItem} onClose={() => setHistItem(null)} />}

      {/* Modal de Edição em Lote */}
      <EdicaoLoteDialog
        open={edicaoLote}
        onClose={() => setEdicaoLote(false)}
        itens={itens}
        categoriasDisponiveis={categoriasDisponiveis}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["estoque"] })}
      />
    </>
  );
}

const UNIDADES_INTEIRAS = new Set(["unidade","caixa","pacote","pote","sachê"]);

function ItemForm({ item, categoriasDisponiveis, onClose, onMovimentar }: { item: Item | null; categoriasDisponiveis: string[]; onClose: () => void; onMovimentar: (item: Item) => void }) {
  const isNew = !item;
  const [f, setF] = useState({
    nome: item?.nome ?? "", categoria: item?.categoria ?? "Insumos Herbalife",
    novaCategoria: "", // Campo para nova categoria
    quantidade_inicial: 0, unidade_medida: item?.unidade_medida ?? "unidade",
    estoque_minimo: item?.estoque_minimo ?? 0, custo_unitario: item?.custo_unitario ?? 0,
    fornecedor: item?.fornecedor ?? "", validade: item?.validade ?? "", ativo: item?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (!f.nome.trim()) { toast.error("Nome obrigatório"); return; }
    setSaving(true);

    const categoriaFinal = f.categoria === "outra" && f.novaCategoria.trim() ? f.novaCategoria.trim() : (f.categoria === "outra" ? "Outros" : f.categoria);

    if (item) {
      // edição: NÃO atualiza quantidade
      const payload = {
        nome: f.nome, categoria: categoriaFinal, unidade_medida: f.unidade_medida,
        estoque_minimo: f.estoque_minimo, custo_unitario: f.custo_unitario,
        fornecedor: f.fornecedor || null, validade: f.validade || null, ativo: f.ativo,
      };
      const { error } = await supabase.from("estoque_itens").update(payload).eq("id", item.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Item atualizado"); onClose();
      return;
    }

    // novo item: cria com quantidade 0 e registra entrada inicial via RPC
    const { data: created, error: e1 } = await supabase.from("estoque_itens").insert({
      nome: f.nome, categoria: categoriaFinal, unidade_medida: f.unidade_medida,
      estoque_minimo: f.estoque_minimo, custo_unitario: f.custo_unitario,
      fornecedor: f.fornecedor || null, validade: f.validade || null, ativo: f.ativo,
      quantidade_atual: 0,
    }).select("id").single();
    if (e1 || !created) { setSaving(false); toast.error(e1?.message ?? "Erro ao criar item"); return; }

    if (f.quantidade_inicial > 0) {
      const { error: e2 } = await supabase.rpc("registrar_entrada_estoque", {
        _item_id: created.id, _quantidade: f.quantidade_inicial,
        _observacoes: "Entrada inicial (cadastro do item)",
      });
      if (e2) { setSaving(false); toast.error("Item criado mas falha ao registrar entrada: " + e2.message); return; }
    }
    setSaving(false);
    toast.success("Item cadastrado"); onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle></DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2"><Label>Nome *</Label><Input value={f.nome} onChange={e => setF({ ...f, nome: e.target.value })} /></div>
          <div><Label>Categoria</Label>
            <Select value={f.categoria} onValueChange={v => setF({ ...f, categoria: v, novaCategoria: "" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categoriasDisponiveis.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="outra">+ Nova Categoria...</SelectItem>
              </SelectContent>
            </Select>
            {f.categoria === "outra" && (
              <Input
                className="mt-2"
                placeholder="Nome da categoria"
                value={f.novaCategoria}
                onChange={e => setF({ ...f, novaCategoria: e.target.value })}
                autoFocus
              />
            )}
          </div>
          <div><Label>Unidade</Label>
            <Select value={f.unidade_medida} onValueChange={v => setF({ ...f, unidade_medida: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{UNIDADES.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {isNew ? (
            <div>
              <Label>Quantidade inicial</Label>
              <Input type="number" step="0.01" value={f.quantidade_inicial} onChange={e => setF({ ...f, quantidade_inicial: Number(e.target.value) })} />
              <p className="text-xs text-muted-foreground mt-1">Registrada como entrada no histórico.</p>
            </div>
          ) : (
            <div>
              <Label>Quantidade atual</Label>
              <Input value={`${item!.quantidade_atual} ${item!.unidade_medida}`} disabled readOnly />
              <p className="text-xs text-muted-foreground mt-1">Para alterar a quantidade, use Movimentar estoque.</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onMovimentar(item!)}>
                <ArrowUp className="size-4 mr-1" /> Movimentar estoque
              </Button>
            </div>
          )}
          <div>
            <Label>Estoque mínimo</Label>
            <Input
              type="number"
              inputMode={UNIDADES_INTEIRAS.has(f.unidade_medida) ? "numeric" : "decimal"}
              step={UNIDADES_INTEIRAS.has(f.unidade_medida) ? "1" : "0.01"}
              min="0"
              placeholder="Ex: 5"
              value={f.estoque_minimo}
              onChange={e => setF({ ...f, estoque_minimo: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground mt-1">Em {f.unidade_medida}.</p>
          </div>
          <div><Label>Custo unitário (R$)</Label><Input type="number" step="0.01" value={f.custo_unitario} onChange={e => setF({ ...f, custo_unitario: Number(e.target.value) })} /></div>
          <div><Label>Validade</Label><Input type="date" value={f.validade ?? ""} onChange={e => setF({ ...f, validade: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Fornecedor</Label><Input value={f.fornecedor ?? ""} onChange={e => setF({ ...f, fornecedor: e.target.value })} /></div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input id="ativo" type="checkbox" checked={f.ativo} onChange={e => setF({ ...f, ativo: e.target.checked })} />
            <Label htmlFor="ativo">Item ativo</Label>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const qc = useQueryClient();
  const [tipo, setTipo] = useState<"entrada" | "saida">("entrada");
  const [tipoMov, setTipoMov] = useState("compra");
  const [qtd, setQtd] = useState(0);
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  async function salvar() {
    if (qtd <= 0) { toast.error("Quantidade > 0"); return; }
    if (tipo === "saida" && !motivo.trim()) { toast.error("Motivo obrigatório para saída/ajuste"); return; }
    setSaving(true);

    if (tipo === "entrada") {
      const { error } = await supabase.rpc("registrar_entrada_estoque", {
        _item_id: item.id, _quantidade: qtd,
        _observacoes: motivo || tipoMov,
      });
      if (error) { setSaving(false); toast.error(error.message); return; }
    } else {
      const { error } = await supabase.rpc("registrar_saida_manual_estoque", {
        _item_id: item.id, _quantidade: qtd,
        _tipo_movimentacao: tipoMov, _motivo: motivo,
      });
      if (error) { setSaving(false); toast.error(error.message); return; }
    }
    // Força refetch imediato antes de fechar para a listagem refletir o novo saldo
    await qc.invalidateQueries({ queryKey: ["estoque"], refetchType: "active" });
    await qc.invalidateQueries({ queryKey: ["mov", item.id], refetchType: "active" });
    setSaving(false);
    toast.success("Movimentação registrada");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Movimentar {item.nome}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Tabs value={tipo} onValueChange={(v) => setTipo(v as any)}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="entrada"><ArrowUp className="size-4 mr-1 text-green-600" /> Entrada</TabsTrigger>
              <TabsTrigger value="saida"><ArrowDown className="size-4 mr-1 text-red-600" /> Saída/Ajuste</TabsTrigger>
            </TabsList>
            <TabsContent value="entrada" className="space-y-3 mt-3">
              <Select value={tipoMov} onValueChange={setTipoMov}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="ajuste">Ajuste positivo</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="saida" className="space-y-3 mt-3">
              <Select value={tipoMov} onValueChange={setTipoMov}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ajuste">Ajuste negativo</SelectItem>
                  <SelectItem value="perda">Perda</SelectItem>
                  <SelectItem value="uso_interno">Uso interno</SelectItem>
                  <SelectItem value="vencimento">Vencimento</SelectItem>
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
          <div><Label>Quantidade ({item.unidade_medida})</Label><Input type="number" step="0.01" value={qtd} onChange={e => setQtd(Number(e.target.value))} /></div>
          <div><Label>Motivo / observação {tipo === "saida" && <span className="text-destructive">*</span>}</Label><Textarea value={motivo} onChange={e => setMotivo(e.target.value)} placeholder={tipo === "saida" ? "Obrigatório descrever o motivo" : "Opcional"} /></div>
          <div className="text-sm text-muted-foreground">Saldo atual: <span className="font-semibold">{item.quantidade_atual}</span> → Após: <span className="font-semibold">{tipo === "entrada" ? Number(item.quantidade_atual) + qtd : Number(item.quantidade_atual) - qtd}</span></div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Confirmar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HistDialog({ item, onClose }: { item: Item; onClose: () => void }) {
  const { data: movs = [] } = useQuery({
    queryKey: ["mov", item.id],
    queryFn: async () => {
      const { data } = await supabase.from("estoque_movimentacoes").select("*").eq("item_id", item.id).order("created_at", { ascending: false }).limit(80);
      return data ?? [];
    },
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Histórico — {item.nome}</DialogTitle></DialogHeader>
        <ul className="max-h-96 overflow-y-auto divide-y divide-border text-sm">
          {movs.map((m: any) => (
            <li key={m.id} className="py-2 flex justify-between gap-2">
              <div>
                <div className="font-medium flex items-center gap-2">
                  {m.tipo === "entrada" ? <ArrowUp className="size-4 text-green-600" /> : <ArrowDown className="size-4 text-red-600" />}
                  {m.tipo_movimentacao ?? m.tipo}
                </div>
                <div className="text-xs text-muted-foreground">{m.motivo}</div>
                <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("pt-BR")}</div>
              </div>
              <Badge variant="outline" className={m.tipo === "entrada" ? "text-green-600" : "text-red-600"}>
                {m.tipo === "entrada" ? "+" : "−"}{m.quantidade}
              </Badge>
            </li>
          ))}
          {movs.length === 0 && <li className="text-center py-6 text-muted-foreground">Sem movimentações.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────── EDIÇÃO EM LOTE ───────────────────────────

function EdicaoLoteDialog({
  open,
  onClose,
  itens,
  categoriasDisponiveis,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  itens: Item[];
  categoriasDisponiveis: string[];
  onSuccess: () => void;
}) {
  const [edited, setEdited] = useState<
    Record<
      string,
      {
        categoria: string;
        quantidade_atual: number;
        estoque_minimo: number;
        custo_unitario: number;
        ativo: boolean;
      }
    >
  >({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [buscaLote, setBuscaLote] = useState("");
  const [categoriaLote, setCategoriaLote] = useState("todas");
  const [saving, setSaving] = useState(false);

  // Ações em massa
  const [massaCategoria, setMassaCategoria] = useState("");
  const [massaEstoqueMin, setMassaEstoqueMin] = useState("");

  useEffect(() => {
    if (open) {
      const initial: Record<
        string,
        {
          categoria: string;
          quantidade_atual: number;
          estoque_minimo: number;
          custo_unitario: number;
          ativo: boolean;
        }
      > = {};
      itens.forEach((it) => {
        initial[it.id] = {
          categoria: it.categoria || "Outros",
          quantidade_atual: Number(it.quantidade_atual) || 0,
          estoque_minimo: Number(it.estoque_minimo) || 0,
          custo_unitario: Number(it.custo_unitario) || 0,
          ativo: it.ativo,
        };
      });
      setEdited(initial);
      setSelectedIds(new Set());
      setBuscaLote("");
      setCategoriaLote("todas");
      setMassaCategoria("");
      setMassaEstoqueMin("");
    }
  }, [open, itens]);

  const itensFiltrados = useMemo(() => {
    const q = buscaLote.trim().toLowerCase();
    return itens.filter((it) => {
      if (q && !it.nome.toLowerCase().includes(q)) return false;
      const currentCat = edited[it.id]?.categoria ?? it.categoria ?? "Outros";
      if (categoriaLote !== "todas" && currentCat !== categoriaLote) return false;
      return true;
    });
  }, [itens, buscaLote, categoriaLote, edited]);

  function isLinhaAlterada(it: Item) {
    const cur = edited[it.id];
    if (!cur) return false;
    return (
      (cur.categoria || "Outros") !== (it.categoria || "Outros") ||
      cur.quantidade_atual !== Number(it.quantidade_atual) ||
      cur.estoque_minimo !== Number(it.estoque_minimo) ||
      cur.custo_unitario !== Number(it.custo_unitario) ||
      cur.ativo !== it.ativo
    );
  }

  const totalModificados = useMemo(() => {
    return itens.filter(isLinhaAlterada).length;
  }, [itens, edited]);

  function handleSelectAll() {
    if (selectedIds.size === itensFiltrados.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(itensFiltrados.map((i) => i.id)));
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateField(id: string, field: string, value: any) {
    setEdited((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {
          categoria: "Outros",
          quantidade_atual: 0,
          estoque_minimo: 0,
          custo_unitario: 0,
          ativo: true,
        }),
        [field]: value,
      },
    }));
  }

  function aplicarCategoriaEmMassa() {
    if (!massaCategoria || selectedIds.size === 0) {
      toast.error("Selecione itens e uma categoria para aplicar");
      return;
    }
    setEdited((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], categoria: massaCategoria };
        }
      });
      return next;
    });
    toast.success(`Categoria "${massaCategoria}" aplicada a ${selectedIds.size} item(ns)!`);
  }

  function aplicarEstoqueMinEmMassa() {
    const val = Number(massaEstoqueMin);
    if (isNaN(val) || val < 0 || selectedIds.size === 0) {
      toast.error("Informe um estoque mínimo válido (≥ 0) e selecione itens");
      return;
    }
    setEdited((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], estoque_minimo: val };
        }
      });
      return next;
    });
    toast.success(`Estoque mínimo ${val} aplicado a ${selectedIds.size} item(ns)!`);
  }

  function aplicarStatusEmMassa(novoStatus: boolean) {
    if (selectedIds.size === 0) {
      toast.error("Selecione itens para alterar o status");
      return;
    }
    setEdited((prev) => {
      const next = { ...prev };
      selectedIds.forEach((id) => {
        if (next[id]) {
          next[id] = { ...next[id], ativo: novoStatus };
        }
      });
      return next;
    });
    toast.success(`${novoStatus ? "Ativados" : "Desativados"} ${selectedIds.size} item(ns)!`);
  }

  async function salvarTudo() {
    const alterados = itens.filter(isLinhaAlterada);
    if (alterados.length === 0) {
      toast.info("Nenhuma alteração pendente");
      onClose();
      return;
    }

    setSaving(true);
    let sucessos = 0;
    let erros = 0;

    for (const it of alterados) {
      const cur = edited[it.id];
      const payload: any = {
        categoria: cur.categoria,
        quantidade_atual: cur.quantidade_atual,
        estoque_minimo: cur.estoque_minimo,
        custo_unitario: cur.custo_unitario,
        ativo: cur.ativo,
      };

      const { error } = await supabase.from("estoque_itens").update(payload).eq("id", it.id);
      if (error) {
        console.error("Erro no lote item:", it.nome, error);
        erros++;
      } else {
        sucessos++;
      }
    }

    setSaving(false);
    if (erros > 0) {
      toast.warning(`${sucessos} itens atualizados, mas ${erros} apresentaram erro.`);
    } else {
      toast.success(`${sucessos} itens do estoque atualizados com sucesso!`);
    }
    onSuccess();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !saving && onClose()}>
      <DialogContent className="max-w-5xl w-full max-h-[92vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-primary" />
              <DialogTitle className="text-xl">Edição em Lote do Estoque</DialogTitle>
            </div>
            {totalModificados > 0 && (
              <Badge variant="secondary" className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                {totalModificados} item(ns) modificado(s)
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Edite múltiplos produtos de uma vez em formato de planilha ou aplique valores em massa para os itens selecionados. As alterações só são gravadas ao clicar em "Salvar Alterações".
          </DialogDescription>
        </DialogHeader>

        {/* Barra de Filtros Internos da Edição */}
        <div className="flex flex-wrap items-center gap-2 py-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={buscaLote}
              onChange={(e) => setBuscaLote(e.target.value)}
              placeholder="Filtrar produtos por nome..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="w-[180px]">
            <Select value={categoriaLote} onValueChange={setCategoriaLote}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas Categorias</SelectItem>
                {categoriasDisponiveis.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Barra de Ações Rápidas em Massa para os Selecionados */}
        {selectedIds.size > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-2.5 flex flex-wrap gap-2 items-center text-xs animate-in fade-in-50 duration-200">
            <span className="font-semibold text-primary">
              {selectedIds.size} selecionado(s):
            </span>

            {/* Aplicar Categoria */}
            <div className="flex items-center gap-1.5 border-l border-primary/20 pl-2">
              <Select value={massaCategoria} onValueChange={setMassaCategoria}>
                <SelectTrigger className="h-7 text-xs w-36 bg-background"><SelectValue placeholder="Definir categoria" /></SelectTrigger>
                <SelectContent>
                  {categoriasDisponiveis.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={aplicarCategoriaEmMassa}>
                Aplicar
              </Button>
            </div>

            {/* Aplicar Estoque Mínimo */}
            <div className="flex items-center gap-1.5 border-l border-primary/20 pl-2">
              <Input
                type="number"
                min="0"
                step="1"
                placeholder="Mínimo"
                value={massaEstoqueMin}
                onChange={(e) => setMassaEstoqueMin(e.target.value)}
                className="h-7 text-xs w-20 bg-background"
              />
              <Button size="sm" variant="secondary" className="h-7 text-xs px-2" onClick={aplicarEstoqueMinEmMassa}>
                Aplicar
              </Button>
            </div>

            {/* Aplicar Status */}
            <div className="flex items-center gap-1 border-l border-primary/20 pl-2">
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => aplicarStatusEmMassa(true)}>
                Ativar
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => aplicarStatusEmMassa(false)}>
                Desativar
              </Button>
            </div>
          </div>
        )}

        {/* Tabela Planilha de Edição */}
        <div className="flex-1 overflow-auto border border-border rounded-lg min-h-[260px] max-h-[50vh] relative">
          <table className="w-full text-xs">
            <thead className="bg-muted/80 text-muted-foreground uppercase sticky top-0 z-10 border-b border-border backdrop-blur-sm">
              <tr>
                <th className="py-2 px-3 text-center w-10">
                  <Checkbox
                    checked={itensFiltrados.length > 0 && selectedIds.size === itensFiltrados.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecionar todos os produtos"
                  />
                </th>
                <th className="text-left py-2 px-3 min-w-[180px]">Produto</th>
                <th className="text-left py-2 px-2 min-w-[160px]">Categoria</th>
                <th className="text-right py-2 px-2 min-w-[120px]">Qtd Atual</th>
                <th className="text-right py-2 px-2 min-w-[110px]">Estoque Mín.</th>
                <th className="text-right py-2 px-2 min-w-[110px]">Custo Un. (R$)</th>
                <th className="text-center py-2 px-2 min-w-[80px]">Ativo</th>
                <th className="text-center py-2 px-2 w-16">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {itensFiltrados.map((it) => {
                const cur = edited[it.id] ?? {
                  categoria: it.categoria || "Outros",
                  quantidade_atual: it.quantidade_atual,
                  estoque_minimo: it.estoque_minimo,
                  custo_unitario: it.custo_unitario,
                  ativo: it.ativo,
                };
                const alterada = isLinhaAlterada(it);
                const selecionada = selectedIds.has(it.id);

                return (
                  <tr
                    key={it.id}
                    className={
                      "transition-colors " +
                      (alterada
                        ? "bg-amber-500/10 dark:bg-amber-500/15"
                        : selecionada
                        ? "bg-primary/5"
                        : "hover:bg-muted/40")
                    }
                  >
                    {/* Checkbox */}
                    <td className="py-1.5 px-3 text-center">
                      <Checkbox
                        checked={selecionada}
                        onCheckedChange={() => toggleSelect(it.id)}
                        aria-label={`Selecionar ${it.nome}`}
                      />
                    </td>

                    {/* Nome */}
                    <td className="py-1.5 px-3 font-medium">
                      <div className="truncate max-w-[220px]" title={it.nome}>
                        {it.nome}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {it.unidade_medida}
                      </div>
                    </td>

                    {/* Categoria */}
                    <td className="py-1.5 px-2">
                      <Select
                        value={cur.categoria || "Outros"}
                        onValueChange={(v) => updateField(it.id, "categoria", v)}
                      >
                        <SelectTrigger className="h-7 text-xs w-full bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categoriasDisponiveis.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Quantidade Atual */}
                    <td className="py-1.5 px-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="any"
                          value={cur.quantidade_atual}
                          onChange={(e) => updateField(it.id, "quantidade_atual", parseFloat(e.target.value) || 0)}
                          className="h-7 text-xs w-20 text-right font-medium tabular-nums bg-background"
                        />
                      </div>
                    </td>

                    {/* Estoque Mínimo */}
                    <td className="py-1.5 px-2 text-right">
                      <Input
                        type="number"
                        step="any"
                        min="0"
                        value={cur.estoque_minimo}
                        onChange={(e) => updateField(it.id, "estoque_minimo", parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs w-20 text-right tabular-nums bg-background"
                      />
                    </td>

                    {/* Custo Unitário */}
                    <td className="py-1.5 px-2 text-right">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cur.custo_unitario}
                        onChange={(e) => updateField(it.id, "custo_unitario", parseFloat(e.target.value) || 0)}
                        className="h-7 text-xs w-24 text-right tabular-nums bg-background"
                      />
                    </td>

                    {/* Ativo */}
                    <td className="py-1.5 px-2 text-center">
                      <Switch
                        checked={cur.ativo}
                        onCheckedChange={(v) => updateField(it.id, "ativo", v)}
                        aria-label="Ativo/Inativo"
                      />
                    </td>

                    {/* Status Badge */}
                    <td className="py-1.5 px-2 text-center">
                      {alterada ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white shadow-xs">
                          Modificado
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {itensFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhum produto corresponde aos filtros da edição.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Edição em Lote */}
        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between sm:justify-between w-full">
          <div className="text-xs text-muted-foreground">
            {totalModificados > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                {totalModificados} produto(s) com alterações não salvas
              </span>
            ) : (
              <span>Nenhum produto alterado</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={saving} onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={salvarTudo}
              disabled={saving || totalModificados === 0}
              className="bg-primary shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-1.5" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="size-4 mr-1.5" /> Salvar {totalModificados > 0 ? `(${totalModificados})` : ""}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

