import { createFileRoute } from "@tanstack/react-router";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Package, Tag, Sparkles, ShieldOff, LayoutGrid, List, ChefHat } from "lucide-react";

export const Route = createFileRoute("/_authenticated/produtos")({
  head: () => ({ meta: [{ title: "Produtos — FitLife" }] }),
  component: ProdutosPage,
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

function ProdutosPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <>
        <div className="text-center py-16 text-muted-foreground">
          <ShieldOff className="size-12 mx-auto mb-3 opacity-50" />
          <p>Acesso restrito ao administrador.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Package className="size-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Produtos & Cardápio</h1>
      </div>

      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="sabores">Sabores</TabsTrigger>
          <TabsTrigger value="adicionais">Adicionais</TabsTrigger>
        </TabsList>

        <TabsContent value="produtos" className="mt-4"><ProdutosTab /></TabsContent>
        <TabsContent value="categorias" className="mt-4"><CategoriasTab /></TabsContent>
        <TabsContent value="sabores" className="mt-4"><SaboresTab /></TabsContent>
        <TabsContent value="adicionais" className="mt-4"><AdicionaisTab /></TabsContent>
      </Tabs>
    </>
  );
}

// ─────────────────────────── PRODUTOS ───────────────────────────

function ProdutosTab() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Produto | null>(null);
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const [viewMode, setViewMode] = useState<"grade" | "lista">("grade");

  const { data: produtos = [] } = useQuery({
    queryKey: ["produtos-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("*, categoria:categorias_produtos(nome), produto_sabores(sabor_id), produto_adicionais(adicional_id)")
        .order("nome");
      return (data ?? []) as unknown as Produto[];
    },
  });

  const filtrados = useMemo(
    () => produtos.filter((p) => !busca || p.nome.toLowerCase().includes(busca.toLowerCase())),
    [produtos, busca]
  );

  async function excluir(p: Produto) {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    const { error } = await supabase.from("produtos").delete().eq("id", p.id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["produtos-admin"] }); }
  }

  async function toggleField(p: Produto, field: "ativo" | "aparece_no_pedido" | "envia_para_cozinha", val: boolean) {
    const { error } = await supabase.from("produtos").update({ [field]: val }).eq("id", p.id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["produtos-admin"] });
  }

  function novo() { setEditing(null); setOpen(true); }
  function editar(p: Produto) { setEditing(p); setOpen(true); }

  return (
    <>
      <div className="flex gap-2 mb-3 flex-wrap">
        <Input placeholder="Buscar produto..." value={busca} onChange={(e) => setBusca(e.target.value)} className="flex-1 min-w-[180px]" />
        {/* Toggle grade/lista */}
        <div className="flex border border-border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("grade")}
            className={"px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors " +
              (viewMode === "grade" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
            title="Visualizar em grade"
          >
            <LayoutGrid className="size-4" />
            <span className="hidden sm:inline">Grade</span>
          </button>
          <button
            onClick={() => setViewMode("lista")}
            className={"px-3 py-2 flex items-center gap-1.5 text-xs font-medium transition-colors border-l border-border " +
              (viewMode === "lista" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted")}
            title="Visualizar em lista"
          >
            <List className="size-4" />
            <span className="hidden sm:inline">Lista</span>
          </button>
        </div>
        <Button onClick={novo} className="bg-gold text-gold-foreground hover:bg-gold/90 shrink-0">
          <Plus className="size-4 mr-1" /> Novo produto
        </Button>
      </div>

      {viewMode === "grade" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((p) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-start justify-between mb-1">
                <div className="font-heading font-semibold">{p.nome}</div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => editar(p)}><Pencil className="size-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => excluir(p)}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{p.categoria?.nome ?? "Sem categoria"}</div>
              {p.descricao && <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{p.descricao}</p>}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-primary">{brl(p.preco)}</div>
                  <div className="text-xs text-muted-foreground">custo {brl(p.custo)}</div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {!p.ativo && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                  {!p.aparece_no_pedido && <Badge variant="outline" className="text-xs">Oculto</Badge>}
                </div>
              </div>
            </Card>
          ))}
          {filtrados.length === 0 && <p className="text-center col-span-full py-12 text-muted-foreground">Nenhum produto.</p>}
        </div>
      ) : (
        // ── MODO LISTA com edição em lote ──
        <Card className="overflow-hidden">
          {viewMode === "lista" && (
            <div className="bg-muted/50 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
              Alterações de ativo/visível/cozinha são salvas imediatamente. Use o lápis para editar detalhes.
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-2.5 px-4">Produto</th>
                  <th className="text-left px-3">Categoria</th>
                  <th className="text-right px-3">Preço</th>
                  <th className="text-right px-3">Custo</th>
                  <th className="text-center px-3">Ativo</th>
                  <th className="text-center px-3">Aparece</th>
                  <th className="text-center px-3"><ChefHat className="size-3.5 mx-auto" /></th>
                  <th className="px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 px-4">
                      <div className="font-medium">{p.nome}</div>
                      {p.descricao && <div className="text-[11px] text-muted-foreground truncate max-w-[200px]">{p.descricao}</div>}
                    </td>
                    <td className="px-3 text-muted-foreground">{p.categoria?.nome ?? "—"}</td>
                    <td className="px-3 text-right font-semibold text-primary tabular-nums">{brl(p.preco)}</td>
                    <td className="px-3 text-right text-muted-foreground tabular-nums">{brl(p.custo)}</td>
                    <td className="px-3 text-center">
                      <Switch
                        checked={p.ativo}
                        onCheckedChange={(v) => toggleField(p, "ativo", v)}
                        aria-label="Ativo"
                      />
                    </td>
                    <td className="px-3 text-center">
                      <Switch
                        checked={p.aparece_no_pedido}
                        onCheckedChange={(v) => toggleField(p, "aparece_no_pedido", v)}
                        aria-label="Aparece na comanda"
                      />
                    </td>
                    <td className="px-3 text-center">
                      <Switch
                        checked={p.envia_para_cozinha}
                        onCheckedChange={(v) => toggleField(p, "envia_para_cozinha", v)}
                        aria-label="Envia para cozinha"
                      />
                    </td>
                    <td className="px-3">
                      <div className="flex gap-1 justify-end">
                        <Button size="icon" variant="ghost" onClick={() => editar(p)}><Pencil className="size-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => excluir(p)}><Trash2 className="size-4 text-destructive" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-muted-foreground">Nenhum produto.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ProdutoDialog open={open} onOpenChange={setOpen} produto={editing} />
    </>
  );
}

function ProdutoDialog({ open, onOpenChange, produto }: { open: boolean; onOpenChange: (b: boolean) => void; produto: Produto | null }) {
  const qc = useQueryClient();
  const { data: categorias = [] } = useQuery({
    queryKey: ["categorias-all"],
    queryFn: async () => (await supabase.from("categorias_produtos").select("*").order("nome")).data ?? [],
  });
  const { data: sabores = [] } = useQuery({
    queryKey: ["sabores-all"],
    queryFn: async () => (await supabase.from("sabores").select("*").order("nome")).data ?? [],
  });
  const { data: adicionais = [] } = useQuery({
    queryKey: ["adicionais-all"],
    queryFn: async () => (await supabase.from("adicionais").select("*").order("nome")).data ?? [],
  });

  const [form, setForm] = useState({
    nome: "", descricao: "", categoria_id: "", preco: "0", custo: "0",
    ativo: true, aparece_no_pedido: true,
    envia_para_cozinha: true, produto_fechado: false,
    permite_sabor: false, permite_adicionais: false,
    sabores: [] as string[], adicionais: [] as string[],
  });

  function reset() {
    if (produto) {
      setForm({
        nome: produto.nome, descricao: produto.descricao ?? "",
        categoria_id: produto.categoria_id ?? "", preco: String(produto.preco), custo: String(produto.custo),
        ativo: produto.ativo, aparece_no_pedido: produto.aparece_no_pedido,
        envia_para_cozinha: produto.envia_para_cozinha ?? true,
        produto_fechado: produto.produto_fechado ?? false,
        permite_sabor: produto.permite_sabor ?? false,
        permite_adicionais: produto.permite_adicionais ?? false,
        sabores: (produto.produto_sabores ?? []).map((s) => s.sabor_id),
        adicionais: (produto.produto_adicionais ?? []).map((a) => a.adicional_id),
      });
    } else {
      setForm({
        nome: "", descricao: "", categoria_id: "", preco: "0", custo: "0",
        ativo: true, aparece_no_pedido: true,
        envia_para_cozinha: true, produto_fechado: false,
        permite_sabor: false, permite_adicionais: false,
        sabores: [], adicionais: [],
      });
    }
  }

  // sync when dialog opens
  useMemo(() => { if (open) reset(); /* eslint-disable-next-line */ }, [open, produto?.id]);

  async function salvar() {
    if (!form.nome.trim()) { toast.error("Nome obrigatório"); return; }
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao || null,
      categoria_id: form.categoria_id || null,
      preco: Number(form.preco) || 0,
      custo: Number(form.custo) || 0,
      ativo: form.ativo,
      aparece_no_pedido: form.aparece_no_pedido,
      envia_para_cozinha: form.envia_para_cozinha,
      produto_fechado: form.produto_fechado,
      permite_sabor: form.permite_sabor,
      permite_adicionais: form.permite_adicionais,
    };
    let prodId = produto?.id;
    if (produto) {
      const { error } = await supabase.from("produtos").update(payload).eq("id", produto.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from("produtos").insert(payload).select("id").single();
      if (error || !data) { toast.error(error?.message ?? "Erro"); return; }
      prodId = data.id;
    }
    // sync sabores
    await supabase.from("produto_sabores").delete().eq("produto_id", prodId!);
    if (form.sabores.length) {
      await supabase.from("produto_sabores").insert(form.sabores.map((sid) => ({ produto_id: prodId!, sabor_id: sid })));
    }
    // sync adicionais
    await supabase.from("produto_adicionais").delete().eq("produto_id", prodId!);
    if (form.adicionais.length) {
      await supabase.from("produto_adicionais").insert(form.adicionais.map((aid) => ({ produto_id: prodId!, adicional_id: aid })));
    }
    toast.success(produto ? "Atualizado" : "Produto criado");
    qc.invalidateQueries({ queryKey: ["produtos-admin"] });
    qc.invalidateQueries({ queryKey: ["produtos-novo-pedido"] });
    onOpenChange(false);
  }

  function toggleArr(key: "sabores" | "adicionais", id: string) {
    setForm((f) => ({ ...f, [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{produto ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome*</Label><Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} /></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={form.categoria_id || "none"} onValueChange={(v) => setForm({ ...form, categoria_id: v === "none" ? "" : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— sem categoria —</SelectItem>
                  {categorias.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} /></div>
            <div><Label>Custo (R$)</Label><Input type="number" step="0.01" value={form.custo} onChange={(e) => setForm({ ...form, custo: e.target.value })} /></div>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 rounded-lg border border-border p-3">
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.ativo} onCheckedChange={(v) => setForm({ ...form, ativo: v })} /> Ativo</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.aparece_no_pedido} onCheckedChange={(v) => setForm({ ...form, aparece_no_pedido: v })} /> Aparece na comanda</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.envia_para_cozinha} onCheckedChange={(v) => setForm({ ...form, envia_para_cozinha: v })} /> Envia para cozinha</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.produto_fechado} onCheckedChange={(v) => setForm({ ...form, produto_fechado: v })} /> Produto fechado (pronto)</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.permite_sabor} onCheckedChange={(v) => setForm({ ...form, permite_sabor: v })} /> Permite escolher sabor</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={form.permite_adicionais} onCheckedChange={(v) => setForm({ ...form, permite_adicionais: v })} /> Permite adicionais</label>
          </div>

          <div>
            <Label className="mb-1.5 block">Sabores disponíveis</Label>
            <div className="flex flex-wrap gap-1.5">
              {sabores.map((s: any) => (
                <Button key={s.id} type="button" size="sm" variant={form.sabores.includes(s.id) ? "default" : "outline"} onClick={() => toggleArr("sabores", s.id)}>
                  {s.nome}
                </Button>
              ))}
              {sabores.length === 0 && <p className="text-xs text-muted-foreground">Cadastre sabores na aba Sabores.</p>}
            </div>
          </div>
          <div>
            <Label className="mb-1.5 block">Adicionais disponíveis</Label>
            <div className="flex flex-wrap gap-1.5">
              {adicionais.map((a: any) => (
                <Button key={a.id} type="button" size="sm" variant={form.adicionais.includes(a.id) ? "default" : "outline"} onClick={() => toggleArr("adicionais", a.id)}>
                  {a.nome} <span className="ml-1 text-xs opacity-70">+{brl(a.preco)}</span>
                </Button>
              ))}
              {adicionais.length === 0 && <p className="text-xs text-muted-foreground">Cadastre adicionais na aba Adicionais.</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar} className="bg-primary">Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ───────────────── Simple CRUDs (categorias / sabores / adicionais) ─────────────────

function SimpleListCRUD<T extends { id: string; nome: string; ativo: boolean }>({
  table, queryKey, titulo, icone: Icon, extraField,
}: {
  table: "categorias_produtos" | "sabores" | "adicionais";
  queryKey: string;
  titulo: string;
  icone: any;
  extraField?: { key: "preco"; label: string };
}) {
  const qc = useQueryClient();
  const [novo, setNovo] = useState("");
  const [novoExtra, setNovoExtra] = useState("0");
  const { data: lista = [] } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => (await (supabase.from(table) as any).select("*").order("nome")).data ?? [],
  });

  async function adicionar() {
    if (!novo.trim()) return;
    const payload: any = { nome: novo.trim() };
    if (extraField) payload[extraField.key] = Number(novoExtra) || 0;
    const { error } = await (supabase.from(table) as any).insert(payload);
    if (error) toast.error(error.message);
    else { setNovo(""); setNovoExtra("0"); qc.invalidateQueries({ queryKey: [queryKey] }); }
  }
  async function toggleAtivo(item: any) {
    const { error } = await (supabase.from(table) as any).update({ ativo: !item.ativo }).eq("id", item.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: [queryKey] });
  }
  async function renomear(item: any) {
    const novoNome = prompt("Novo nome:", item.nome);
    if (!novoNome) return;
    const { error } = await (supabase.from(table) as any).update({ nome: novoNome.trim() }).eq("id", item.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: [queryKey] });
  }
  async function editarPreco(item: any) {
    const v = prompt("Novo preço (R$):", String(item.preco));
    if (v == null) return;
    const { error } = await (supabase.from(table) as any).update({ preco: Number(v) || 0 }).eq("id", item.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: [queryKey] });
  }
  async function excluir(item: any) {
    if (!confirm(`Excluir "${item.nome}"?`)) return;
    const { error } = await (supabase.from(table) as any).delete().eq("id", item.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: [queryKey] });
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="size-5 text-primary" />
        <h2 className="font-heading font-semibold">{titulo}</h2>
      </div>
      <div className="flex gap-2 mb-4">
        <Input placeholder={"Novo " + titulo.toLowerCase()} value={novo} onChange={(e) => setNovo(e.target.value)} />
        {extraField && <Input type="number" step="0.01" placeholder="0.00" value={novoExtra} onChange={(e) => setNovoExtra(e.target.value)} className="w-28" />}
        <Button onClick={adicionar}><Plus className="size-4 mr-1" /> Adicionar</Button>
      </div>
      <ul className="divide-y divide-border">
        {lista.map((it: any) => (
          <li key={it.id} className="py-2 flex items-center gap-2">
            <div className="flex-1">
              <span className={it.ativo ? "" : "text-muted-foreground line-through"}>{it.nome}</span>
              {extraField && <span className="ml-2 text-sm text-muted-foreground">{brl(it.preco)}</span>}
            </div>
            <Switch checked={it.ativo} onCheckedChange={() => toggleAtivo(it)} />
            <Button size="icon" variant="ghost" onClick={() => renomear(it)}><Pencil className="size-4" /></Button>
            {extraField && <Button size="sm" variant="ghost" onClick={() => editarPreco(it)}>R$</Button>}
            <Button size="icon" variant="ghost" onClick={() => excluir(it)}><Trash2 className="size-4 text-destructive" /></Button>
          </li>
        ))}
        {lista.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nenhum item.</li>}
      </ul>
    </Card>
  );
}

function CategoriasTab() { return <SimpleListCRUD table="categorias_produtos" queryKey="cat-admin" titulo="Categorias" icone={Tag} />; }
function SaboresTab() { return <SimpleListCRUD table="sabores" queryKey="sab-admin" titulo="Sabores" icone={Sparkles} />; }
function AdicionaisTab() { return <SimpleListCRUD table="adicionais" queryKey="add-admin" titulo="Adicionais" icone={Plus} extraField={{ key: "preco", label: "Preço" }} />; }
