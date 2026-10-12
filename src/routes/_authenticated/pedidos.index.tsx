import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { Plus, Receipt, ChevronRight, Clock, Users, QrCode, Trash2, CheckCircle2, Smartphone, Banknote, CreditCard, Wallet, Edit2 } from "lucide-react";
import { STATUS_COMANDA_COLOR, STATUS_COMANDA_LABEL } from "@/lib/pedido-fluxo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useConfigLoja } from "@/hooks/use-config-loja";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/pedidos/")({
  head: () => ({ meta: [{ title: "Comandas — FitLife" }] }),
  component: ComandasListPage,
});

const FILTROS = [
  { key: "abertas", label: "Em aberto" },
  { key: "pagas", label: "Pagas" },
  { key: "canceladas", label: "Canceladas" },
  { key: "todas", label: "Todas" },
] as const;

function ComandasListPage() {
  const qc = useQueryClient();
  const [abaAtiva, setAbaAtiva] = useState("comandas");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["key"]>("abertas");
  const [mesaAtivaId, setMesaAtivaId] = useState<string | null>(null);
  const [editandoMesa, setEditandoMesa] = useState<any>(null);
  const [novaMesaOpen, setNovaMesaOpen] = useState(false);
  const { isAdmin, user } = useAuth();

  const { data: comandas = [] } = useQuery({
    queryKey: ["comandas-list", filtro],
    queryFn: async () => {
      let q = supabase.from("pedidos")
        .select("id,numero,aberta_em,data_hora,total,status_comanda,forma_pagamento,cliente:clientes(nome),cliente_nome_rapido")
        .order("aberta_em", { ascending: false, nullsFirst: false })
        .limit(200);
      if (filtro === "abertas") q = q.in("status_comanda", ["aberta", "em_consumo", "aguardando_pagamento"]);
      if (filtro === "pagas") q = q.eq("status_comanda", "paga");
      if (filtro === "canceladas") q = q.eq("status_comanda", "cancelada");
      const { data } = await q;
      return data ?? [];
    },
  });

  useEffect(() => {
    const ch = supabase.channel("comandas-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => {
        qc.invalidateQueries({ queryKey: ["comandas-list"] });
        qc.invalidateQueries({ queryKey: ["mesas-list"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "mesas" }, () => {
        qc.invalidateQueries({ queryKey: ["mesas-list"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const { data: mesas = [] } = useQuery({
    queryKey: ["mesas-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("mesas")
        .select("*, pedidos(id, total, status_comanda)")
        .order("numero", { ascending: true });
      return data ?? [];
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Receipt className="size-6 text-primary" />
          <h1 className="text-2xl font-heading font-bold">Comandas & Mesas</h1>
        </div>
        <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90">
          <Link to="/pedidos/novo"><Plus className="mr-1 size-4" /> Abrir...</Link>
        </Button>
      </div>

      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="space-y-4">
        <TabsList>
          <TabsTrigger value="comandas">Comandas Avulsas</TabsTrigger>
          <TabsTrigger value="mesas">Mesas</TabsTrigger>
        </TabsList>

        <TabsContent value="comandas" className="space-y-4">
          <div className="flex gap-1 mb-3 flex-wrap">
        {FILTROS.map((f) => (
          <Button key={f.key} size="sm" variant={filtro === f.key ? "default" : "outline"} onClick={() => setFiltro(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-2">
        {comandas.map((c: any) => {
          const nome = c.cliente?.nome ?? c.cliente_nome_rapido ?? "Consumidor balcão";
          const status = c.status_comanda as string;
          return (
            <Link key={c.id} to={"/pedidos/$id" as any} params={{ id: c.id } as any}>
              <Card className="p-3 flex items-center justify-between gap-3 flex-wrap hover:border-primary transition-colors">
                <div className="flex-1 min-w-[180px]">
                  <div className="font-bold">#{c.numero} <span className="text-sm font-normal text-muted-foreground">— {nome}</span></div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" /> {new Date(c.aberta_em ?? c.data_hora).toLocaleString("pt-BR")}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className={STATUS_COMANDA_COLOR[status] ?? ""}>{STATUS_COMANDA_LABEL[status] ?? status}</Badge>
                  <div className="font-semibold text-primary">{brl(c.total)}</div>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          );
        })}
        {comandas.length === 0 && <p className="text-center py-12 text-muted-foreground">Nenhuma comanda neste filtro.</p>}
      </div>
      </TabsContent>

      <TabsContent value="mesas" className="space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">Gestão de Mesas</h2>
          {(isAdmin || user?.user_metadata?.role === 'gerente') && (
            <Button size="sm" onClick={() => { setEditandoMesa(null); setNovaMesaOpen(true); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-1 size-4" /> Nova Mesa
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {mesas.map((m: any) => {
            const ocupada = m.status === 'ocupada';
            const comandasAtivas = (m.pedidos ?? []).filter((p: any) => ['aberta', 'em_consumo', 'aguardando_pagamento'].includes(p.status_comanda));
            const totalMesa = comandasAtivas.reduce((s: number, p: any) => s + Number(p.total), 0);
            
            return (
              <Card key={m.id} className={"p-3 flex flex-col justify-between transition-colors relative " + (ocupada ? "border-primary/50 bg-primary/5" : "hover:border-border/80 opacity-70")}>
                
                {!ocupada && (isAdmin || user?.user_metadata?.role === 'gerente') && (
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <button onClick={() => setEditandoMesa(m)} className="p-1.5 text-muted-foreground hover:text-primary transition-colors bg-white/80 rounded-full shadow-2xs border" title="Editar nome"><Edit2 className="size-3" /></button>
                    <button onClick={async () => {
                      if (!confirm(`Excluir a mesa ${m.numero}?`)) return;
                      const { error } = await supabase.from('mesas').delete().eq('id', m.id);
                      if (error) toast.error("Erro ao excluir mesa: " + error.message);
                      else toast.success("Mesa excluída!");
                    }} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors bg-white/80 rounded-full shadow-2xs border" title="Excluir"><Trash2 className="size-3" /></button>
                  </div>
                )}

                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-lg">{m.numero}</div>
                  {ocupada ? <Badge className="bg-primary">Ocupada</Badge> : <Badge variant="outline" className="mr-10">Livre</Badge>}
                </div>
                
                {ocupada ? (
                  <div className="space-y-1 mt-auto">
                    <div className="text-xs text-muted-foreground line-clamp-1">{m.responsavel_nome ?? "Sem responsável"}</div>
                    <div className="text-xs font-medium text-primary flex justify-between">
                      <span>{comandasAtivas.length} comanda(s)</span>
                      <span>{brl(totalMesa)}</span>
                    </div>
                    <Button variant="secondary" size="sm" className="w-full mt-2" onClick={() => setMesaAtivaId(m.id)}>
                      Ver / Gerenciar
                    </Button>
                  </div>
                ) : (
                  <div className="mt-auto space-y-2">
                    <div className="text-xs text-muted-foreground text-center py-2">Mesa disponível</div>
                    <Button size="sm" className="w-full bg-gold hover:bg-gold/90 text-gold-foreground" onClick={() => setMesaAtivaId(m.id)}>
                      Abrir Mesa
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
          {mesas.length === 0 && <p className="text-center py-12 text-muted-foreground col-span-full">Nenhuma mesa cadastrada. Cadastre no banco de dados.</p>}
        </div>
      </TabsContent>
      </Tabs>

      {mesaAtivaId && <MesaDialog mesa={mesas.find((m: any) => m.id === mesaAtivaId)} onClose={() => setMesaAtivaId(null)} />}
      
      {(novaMesaOpen || editandoMesa) && (
        <NovaMesaDialog 
          mesa={editandoMesa} 
          onClose={() => { setNovaMesaOpen(false); setEditandoMesa(null); }} 
        />
      )}
    </>
  );
}

function NovaMesaDialog({ mesa, onClose }: { mesa?: any, onClose: () => void }) {
  const [numero, setNumero] = useState(mesa?.numero || "");
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  async function salvar() {
    if (!numero.trim()) { toast.error("Informe o número/nome da mesa"); return; }
    setSaving(true);
    let error;
    if (mesa) {
      const { error: err } = await supabase.from("mesas").update({ numero: numero.trim() }).eq("id", mesa.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("mesas").insert([{ numero: numero.trim() }]);
      error = err;
    }
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(mesa ? "Mesa atualizada!" : "Mesa criada!");
    qc.invalidateQueries({ queryKey: ["mesas-list"] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{mesa ? "Editar Mesa" : "Nova Mesa"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Identificação da Mesa</Label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ex: Mesa 04" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


function MesaDialog({ mesa, onClose }: { mesa: any, onClose: () => void }) {
  const [fecharMesaOpen, setFecharMesaOpen] = useState(false);
  const qc = useQueryClient();

  if (!mesa) return null;
  const ocupada = mesa.status === 'ocupada';
  const comandasAtivas = (mesa.pedidos ?? []).filter((p: any) => ['aberta', 'em_consumo', 'aguardando_pagamento'].includes(p.status_comanda));
  const totalMesa = comandasAtivas.reduce((s: number, p: any) => s + Number(p.total), 0);

  return (
    <>
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center pr-4">
            <span>{mesa.numero}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" asChild>
                <a href={`/cardapio?mesa=${mesa.id}`} target="_blank">Cardápio (QR)</a>
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-muted-foreground">Status</div>
              <div className="font-semibold">{ocupada ? "Ocupada" : "Livre"}</div>
            </div>
            {ocupada && (
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total da mesa</div>
                <div className="font-bold text-lg text-primary">{brl(totalMesa)}</div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-sm">Comandas da Mesa ({comandasAtivas.length})</div>
            {comandasAtivas.length > 0 ? (
              <div className="divide-y border rounded-lg">
                {comandasAtivas.map((p: any) => (
                  <div key={p.id} className="flex justify-between items-center p-3 hover:bg-muted/50">
                    <span className="font-medium">#{p.id.split('-')[0]}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{brl(p.total)}</span>
                      <Button size="sm" variant="secondary" asChild>
                        <Link to={"/pedidos/$id" as any} params={{ id: p.id } as any}>Abrir</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground bg-muted/20 rounded-lg">
                Nenhuma comanda aberta nesta mesa.
              </div>
            )}
          </div>

          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground" asChild>
              <Link to="/pedidos/novo" search={{ mesa: mesa.id } as any}>
                <Plus className="size-4 mr-2" /> Nova Comanda
              </Link>
            </Button>
            {ocupada && comandasAtivas.length > 0 && (
              <Button className="flex-1" variant="default" onClick={() => setFecharMesaOpen(true)}>
                Fechar Mesa ({brl(totalMesa)})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    {fecharMesaOpen && (
      <FecharMesaDialog 
        mesaId={mesa.id} 
        numero={mesa.numero} 
        subtotal={totalMesa} 
        onClose={() => setFecharMesaOpen(false)} 
        onClosed={() => { setFecharMesaOpen(false); onClose(); qc.invalidateQueries({ queryKey: ["mesas-list"] }); }} 
      />
    )}
    </>
  );
}

// ─────────────────────────── FECHAR MESA ───────────────────────────

type Forma = "pix" | "dinheiro" | "debito" | "credito";
const FORMAS: { value: Forma; label: string; icon: any }[] = [
  { value: "pix", label: "Pix", icon: Smartphone },
  { value: "dinheiro", label: "Dinheiro", icon: Banknote },
  { value: "debito", label: "Débito", icon: CreditCard },
  { value: "credito", label: "Crédito", icon: Wallet },
];

type Linha = { id: string; forma: Forma; valor: string; recebido: string; obs: string };

function FecharMesaDialog({ mesaId, numero, subtotal, onClose, onClosed }: {
  mesaId: string; numero: string; subtotal: number;
  onClose: () => void; onClosed: () => void;
}) {
  const { formasAtivas } = useConfigLoja();
  const formasDisponiveis = useMemo(
    () => FORMAS.filter(f => formasAtivas.length === 0 || formasAtivas.includes(f.value)),
    [formasAtivas]
  );
  const formaPadrao: Forma = (formasDisponiveis[0]?.value ?? "pix");
  const [linhas, setLinhas] = useState<Linha[]>([
    { id: crypto.randomUUID(), forma: formaPadrao, valor: "", recebido: "", obs: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const restanteAntes = subtotal;
  const somaNovos = linhas.reduce((s, l) => s + (Number(l.valor) || 0), 0);
  const restanteApos = Math.max(restanteAntes - somaNovos, 0);
  const trocoTotal = linhas.reduce((s, l) => {
    const v = Number(l.valor) || 0;
    const r = Number(l.recebido) || 0;
    return s + (l.forma === "dinheiro" && r > v ? r - v : 0);
  }, 0);

  function preencherRestante(idx: number) {
    setLinhas(arr => arr.map((l, i) => i === idx ? { ...l, valor: restanteAntes.toFixed(2) } : l));
  }

  function adicionar() {
    setLinhas(arr => [...arr, { id: crypto.randomUUID(), forma: formaPadrao, valor: "", recebido: "", obs: "" }]);
  }

  function remover(id: string) {
    setLinhas(arr => arr.filter(l => l.id !== id));
  }

  async function registrar() {
    const pagamentos = linhas
      .filter(l => Number(l.valor) > 0)
      .map(l => ({
        forma: l.forma,
        valor: Number(l.valor),
        valor_recebido: l.forma === "dinheiro" && Number(l.recebido) > 0 ? Number(l.recebido) : Number(l.valor),
        observacoes: l.obs || undefined,
      }));
    if (pagamentos.length === 0) { toast.error("Adicione ao menos um pagamento."); return; }
    if (Math.abs(somaNovos - restanteAntes) > 0.005) {
      toast.error(`Soma dos pagamentos (${brl(somaNovos)}) não bate com o restante (${brl(restanteAntes)})`);
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc("registrar_pagamento_mesa", {
      _mesa_id: mesaId,
      _pagamentos: pagamentos as any,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${numero} paga — pagamento registrado no Caixa.`);
    onClosed();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Fechar {numero}</DialogTitle>
          <DialogDescription>
            Registre o pagamento do valor total ({brl(subtotal)}). Isso fechará todas as comandas abertas na mesa.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/20 p-3 text-sm flex items-center justify-between">
            <div>
              <div className="text-muted-foreground">Total da mesa</div>
              <div className="text-lg font-bold text-foreground">{brl(restanteAntes)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Formas de pagamento</Label>
              <Button variant="outline" size="sm" onClick={adicionar} className="h-7 text-xs">
                <Plus className="mr-1 size-3" /> Dividir pagamento
              </Button>
            </div>

            {linhas.map((l, i) => (
              <div key={l.id} className="grid grid-cols-12 gap-2 items-start relative border border-border p-3 rounded-lg">
                <div className="col-span-12 sm:col-span-4 space-y-1.5">
                  <Label className="text-xs">Forma</Label>
                  <Select value={l.forma} onValueChange={(v: Forma) => setLinhas(arr => arr.map(x => x.id === l.id ? { ...x, forma: v, recebido: "" } : x))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {formasDisponiveis.map(f => (
                        <SelectItem key={f.value} value={f.value}>
                          <div className="flex items-center"><f.icon className="size-4 mr-2 text-muted-foreground" /> {f.label}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6 sm:col-span-3 space-y-1.5">
                  <Label className="text-xs">Valor R$</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" value={l.valor} onChange={(e) => setLinhas(arr => arr.map(x => x.id === l.id ? { ...x, valor: e.target.value } : x))} />
                    <button onClick={() => preencherRestante(i)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground">MAX</button>
                  </div>
                </div>
                {l.forma === "dinheiro" && (
                  <div className="col-span-6 sm:col-span-3 space-y-1.5">
                    <Label className="text-xs text-emerald-600">Recebido (Troco)</Label>
                    <Input type="number" step="0.01" value={l.recebido} onChange={(e) => setLinhas(arr => arr.map(x => x.id === l.id ? { ...x, recebido: e.target.value } : x))} />
                  </div>
                )}
                <div className={"col-span-12 space-y-1.5 " + (l.forma === "dinheiro" ? "sm:col-span-2" : "sm:col-span-4")}>
                  <Label className="text-xs opacity-70">Obs.</Label>
                  <Input value={l.obs} onChange={(e) => setLinhas(arr => arr.map(x => x.id === l.id ? { ...x, obs: e.target.value } : x))} placeholder="Ex: Pix esposa..." />
                </div>
                {linhas.length > 1 && (
                  <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 size-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => remover(l.id)}>
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-lg bg-primary/5 p-4 border border-primary/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Soma informada:</span>
              <span className={"font-semibold " + (Math.abs(somaNovos - restanteAntes) < 0.005 ? "text-green-600" : somaNovos > restanteAntes ? "text-red-500" : "text-amber-500")}>
                {brl(somaNovos)}
              </span>
            </div>
            {restanteApos > 0.005 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Faltando pagar:</span><span className="font-bold">{brl(restanteApos)}</span>
              </div>
            )}
            {trocoTotal > 0.005 && (
              <div className="flex justify-between text-sm text-emerald-600 pt-2 border-t border-emerald-600/20">
                <span>Troco a devolver (Dinheiro):</span><span className="font-bold">{brl(trocoTotal)}</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button
            className="bg-gold text-gold-foreground hover:bg-gold/90"
            disabled={saving || Math.abs(somaNovos - restanteAntes) > 0.005}
            onClick={() => registrar()}
          >
            <CheckCircle2 className="size-4 mr-1" /> {saving ? "Registrando..." : "Confirmar Pagamento da Mesa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
