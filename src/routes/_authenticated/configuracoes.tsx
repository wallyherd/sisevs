import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Settings, Save, Users, CreditCard, Percent, Calculator, Sparkles, ShieldCheck } from "lucide-react";
import { brl } from "@/lib/format";
import { ConfiguracaoCartao, CONFIG_CARTAO_DEFAULT } from "@/hooks/use-config-loja";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.user) throw redirect({ to: "/auth" });
      const user = s.session.user;
      if (user.email === "whdourado@gmail.com" || user.user_metadata?.role === "admin") return;
      const { data: perfil } = await supabase.from("users_profiles").select("role").eq("user_id", user.id).maybeSingle();
      if (!perfil || perfil.role !== "admin") throw redirect({ to: "/" });
    } catch (err) {
      if ((err as any)?.to) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  head: () => ({ meta: [{ title: "Configurações — FitLife" }] }),
  component: ConfiguracoesPage,
});

const FORMAS = ["pix", "dinheiro", "debito", "credito"] as const;

function ConfiguracoesPage() {
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Settings className="size-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Configurações</h1>
      </div>
      <Tabs defaultValue="loja">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 max-w-xl">
          <TabsTrigger value="loja">Loja</TabsTrigger>
          <TabsTrigger value="operacao">Operação</TabsTrigger>
          <TabsTrigger value="cartao" className="flex items-center gap-1.5">
            <CreditCard className="size-3.5" /> Cartão & Taxas
          </TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
        </TabsList>
        <TabsContent value="loja" className="mt-4"><LojaForm /></TabsContent>
        <TabsContent value="operacao" className="mt-4"><OperacaoForm /></TabsContent>
        <TabsContent value="cartao" className="mt-4"><CartaoForm /></TabsContent>
        <TabsContent value="usuarios" className="mt-4"><UsuariosLista /></TabsContent>
      </Tabs>
    </>
  );
}

function useConfig() {
  return useQuery({
    queryKey: ["config-loja"],
    queryFn: async () => {
      const { data } = await supabase.from("configuracoes_loja").select("*").limit(1).maybeSingle();
      return data as any;
    },
  });
}

function LojaForm() {
  const qc = useQueryClient();
  const { data: cfg } = useConfig();
  const [f, setF] = useState<any>({
    nome_loja: "", logo_url: "", cnpj: "", endereco: "", telefone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cfg) setF({
      nome_loja: cfg.nome_loja ?? "",
      logo_url: cfg.logo_url ?? "",
      cnpj: cfg.cnpj ?? "",
      endereco: cfg.endereco ?? "",
      telefone: cfg.telefone ?? "",
    });
  }, [cfg?.id]);

  async function salvar() {
    if (!cfg?.id) return;
    setSaving(true);
    const { error } = await supabase.from("configuracoes_loja").update({
      nome_loja: f.nome_loja || null, logo_url: f.logo_url || null,
      cnpj: f.cnpj || null, endereco: f.endereco || null, telefone: f.telefone || null,
    }).eq("id", cfg.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Dados da loja salvos"); qc.invalidateQueries({ queryKey: ["config-loja"] }); }
  }

  return (
    <Card className="p-5 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Label>Nome da loja</Label><Input value={f.nome_loja} onChange={e => setF({ ...f, nome_loja: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Logo (URL)</Label><Input value={f.logo_url} onChange={e => setF({ ...f, logo_url: e.target.value })} placeholder="https://..." /></div>
        <div><Label>CNPJ</Label><Input value={f.cnpj} onChange={e => setF({ ...f, cnpj: e.target.value })} /></div>
        <div><Label>Telefone</Label><Input value={f.telefone} onChange={e => setF({ ...f, telefone: e.target.value })} /></div>
        <div className="sm:col-span-2"><Label>Endereço</Label><Input value={f.endereco} onChange={e => setF({ ...f, endereco: e.target.value })} /></div>
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={salvar} disabled={saving}><Save className="size-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </Card>
  );
}

function OperacaoForm() {
  const qc = useQueryClient();
  const { data: cfg } = useConfig();
  const [permitirNeg, setPermitirNeg] = useState(false);
  const [dias, setDias] = useState(7);
  const [formas, setFormas] = useState<string[]>([...FORMAS]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cfg) {
      setPermitirNeg(!!cfg.permitir_estoque_negativo);
      setDias(Number(cfg.dias_alerta_vencimento ?? 7));
      const ativas = Array.isArray(cfg.formas_pagamento_ativas) ? cfg.formas_pagamento_ativas : [...FORMAS];
      setFormas(ativas);
    }
  }, [cfg?.id]);

  function toggleForma(f: string) {
    setFormas((prev) => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  }

  async function salvar() {
    if (!cfg?.id) return;
    setSaving(true);
    const { error } = await supabase.from("configuracoes_loja").update({
      permitir_estoque_negativo: permitirNeg,
      dias_alerta_vencimento: dias,
      formas_pagamento_ativas: formas,
    }).eq("id", cfg.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Operação salva"); qc.invalidateQueries({ queryKey: ["config-loja"] }); }
  }

  return (
    <Card className="p-5 max-w-2xl space-y-5">
      <div>
        <div className="font-semibold mb-2">Formas de pagamento ativas</div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FORMAS.map((f) => (
            <label key={f} className="flex items-center gap-2 border border-border rounded-lg p-2 cursor-pointer hover:bg-muted/50">
              <Switch checked={formas.includes(f)} onCheckedChange={() => toggleForma(f)} />
              <span className="capitalize text-sm">{f}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">Aparece no fechamento de comanda e em saídas financeiras.</p>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="font-semibold">Permitir estoque negativo</div>
          <div className="text-xs text-muted-foreground">Se desligado, a baixa falha quando não há saldo suficiente.</div>
        </div>
        <Switch checked={permitirNeg} onCheckedChange={setPermitirNeg} />
      </div>

      <div className="border-t border-border pt-4">
        <Label>Dias para alerta de vencimento</Label>
        <Input type="number" min={1} max={90} value={dias} onChange={e => setDias(Number(e.target.value))} className="max-w-[120px]" />
        <p className="text-xs text-muted-foreground mt-1">Itens com validade dentro deste prazo aparecem como alerta.</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={salvar} disabled={saving}><Save className="size-4 mr-1" /> {saving ? "Salvando..." : "Salvar"}</Button>
      </div>
    </Card>
  );
}

// ─────────────────────────── CONFIGURAÇÃO DE CARTÃO ───────────────────────────

function CartaoForm() {
  const qc = useQueryClient();
  const { data: cfg } = useConfig();
  const [f, setF] = useState<ConfiguracaoCartao>(CONFIG_CARTAO_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [valorSimulacao, setValorSimulacao] = useState("100.00");
  const [parcelasSimuladas, setParcelasSimuladas] = useState("3");

  useEffect(() => {
    if (cfg?.configuracao_cartao && typeof cfg.configuracao_cartao === "object") {
      setF({ ...CONFIG_CARTAO_DEFAULT, ...cfg.configuracao_cartao });
    } else if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("fitlife_config_cartao");
        if (local) setF({ ...CONFIG_CARTAO_DEFAULT, ...JSON.parse(local) });
      } catch {}
    }
  }, [cfg?.id]);

  async function salvar() {
    setSaving(true);
    // Persistência local imediata
    if (typeof window !== "undefined") {
      localStorage.setItem("fitlife_config_cartao", JSON.stringify(f));
    }

    if (cfg?.id) {
      const { error } = await supabase
        .from("configuracoes_loja")
        .update({ configuracao_cartao: f })
        .eq("id", cfg.id);

      if (error && !error.message.includes("configuracao_cartao")) {
        toast.error(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
    toast.success("Configurações do cartão salvas com sucesso!");
    qc.invalidateQueries({ queryKey: ["config-loja"] });
  }

  // Cálculos da simulação
  const vSim = Math.max(0, parseFloat(valorSimulacao) || 0);
  const nParc = Math.max(1, parseInt(parcelasSimuladas) || 1);

  // Débito
  const taxaDebitoReais = (vSim * f.taxa_debito) / 100;
  const liquidoDebito = Math.max(0, vSim - taxaDebitoReais);

  // Crédito à vista
  const taxaCreditoVistaReais = (vSim * f.taxa_credito_vista) / 100;
  const liquidoCreditoVista = Math.max(0, vSim - taxaCreditoVistaReais);

  // Parcelado
  const taxaParceladoPct = f.taxa_credito_vista + (nParc > 1 ? (nParc - 1) * f.taxa_por_parcela : 0);
  const taxaParceladoReais = (vSim * taxaParceladoPct) / 100;
  const liquidoParcelado = Math.max(0, vSim - taxaParceladoReais);
  const parcelaLoja = nParc > 0 ? vSim / nParc : vSim;
  const valorClienteParcelado = f.repassar_taxa_cliente ? vSim * (1 + taxaParceladoPct / 100) : vSim;
  const parcelaCliente = nParc > 0 ? valorClienteParcelado / nParc : valorClienteParcelado;

  return (
    <div className="space-y-5 max-w-3xl">
      <Card className="p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-primary" />
            <div>
              <h2 className="font-heading font-bold text-base">Configurações de Cartão (Débito & Crédito)</h2>
              <p className="text-xs text-muted-foreground">
                Defina as taxas, parcelamentos e regras da sua maquininha de cartão.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Aceitar Cartão</Label>
            <Switch
              checked={f.habilitado}
              onCheckedChange={(v) => setF({ ...f, habilitado: v })}
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs">Maquininha / Operadora Principal</Label>
            <Select
              value={f.operadora_principal}
              onValueChange={(v) => setF({ ...f, operadora_principal: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mercado Pago">Mercado Pago (Point)</SelectItem>
                <SelectItem value="Stone">Stone</SelectItem>
                <SelectItem value="PagBank">PagBank / PagSeguro</SelectItem>
                <SelectItem value="Ton">Ton</SelectItem>
                <SelectItem value="Cielo">Cielo</SelectItem>
                <SelectItem value="Rede">Rede</SelectItem>
                <SelectItem value="Outra">Outra Maquininha</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Prazo de Recebimento</Label>
            <Select
              value={f.dias_recebimento}
              onValueChange={(v) => setF({ ...f, dias_recebimento: v })}
            >
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="D+0">D+0 (Na hora)</SelectItem>
                <SelectItem value="D+1">D+1 (1 dia útil)</SelectItem>
                <SelectItem value="D+14">D+14 (14 dias)</SelectItem>
                <SelectItem value="D+30">D+30 (30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Taxas Base */}
        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-border">
          <div>
            <Label className="text-xs font-semibold">Taxa do Débito (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={f.taxa_debito}
                onChange={(e) => setF({ ...f, taxa_debito: parseFloat(e.target.value) || 0 })}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Taxa padrão cobrada pela maquininha em vendas no débito.</p>
          </div>

          <div>
            <Label className="text-xs font-semibold">Taxa do Crédito à Vista (%)</Label>
            <div className="relative mt-1">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={f.taxa_credito_vista}
                onChange={(e) => setF({ ...f, taxa_credito_vista: parseFloat(e.target.value) || 0 })}
                className="pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Taxa cobrada em vendas no crédito em 1x.</p>
          </div>
        </div>

        {/* Parcelamento */}
        <div className="pt-2 border-t border-border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-semibold text-sm">Permitir Parcelamento no Crédito</Label>
              <p className="text-xs text-muted-foreground">Habilita divisão do pagamento em compras com cartão de crédito.</p>
            </div>
            <Switch
              checked={f.permitir_parcelamento}
              onCheckedChange={(v) => setF({ ...f, permitir_parcelamento: v })}
            />
          </div>

          {f.permitir_parcelamento && (
            <div className="grid sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-muted/30 border border-border">
              <div>
                <Label className="text-xs">Máximo de Parcelas</Label>
                <Select
                  value={String(f.max_parcelas)}
                  onValueChange={(v) => setF({ ...f, max_parcelas: parseInt(v) || 6 })}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>Até {n}x</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Taxa por Parcela Adicional (%)</Label>
                <div className="relative mt-1">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={f.taxa_por_parcela}
                    onChange={(e) => setF({ ...f, taxa_por_parcela: parseFloat(e.target.value) || 0 })}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">%</span>
                </div>
              </div>

              <div>
                <Label className="text-xs">Valor Mínimo da Parcela (R$)</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={f.valor_minimo_parcela}
                  onChange={(e) => setF({ ...f, valor_minimo_parcela: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </div>

        {/* Quem paga as taxas */}
        <div className="pt-2 border-t border-border space-y-2">
          <Label className="font-semibold text-xs block">Repasse de Taxas da Maquininha</Label>
          <div className="grid sm:grid-cols-2 gap-2">
            <label
              className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                !f.repassar_taxa_cliente
                  ? "bg-primary/5 border-primary text-foreground font-semibold"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name="repassar_taxa"
                checked={!f.repassar_taxa_cliente}
                onChange={() => setF({ ...f, repassar_taxa_cliente: false })}
                className="mt-0.5"
              />
              <div>
                <div>Estabelecimento Assume as Taxas</div>
                <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                  O cliente paga o valor original e a taxa é descontada do faturamento da loja.
                </div>
              </div>
            </label>

            <label
              className={`p-3 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-2.5 ${
                f.repassar_taxa_cliente
                  ? "bg-primary/5 border-primary text-foreground font-semibold"
                  : "bg-background border-border text-muted-foreground hover:bg-muted/40"
              }`}
            >
              <input
                type="radio"
                name="repassar_taxa"
                checked={f.repassar_taxa_cliente}
                onChange={() => setF({ ...f, repassar_taxa_cliente: true })}
                className="mt-0.5"
              />
              <div>
                <div>Repassar Taxas para o Cliente</div>
                <div className="text-[11px] font-normal text-muted-foreground mt-0.5">
                  O sistema calcula o acréscimo das taxas e soma no total a ser cobrado do cliente.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={salvar} disabled={saving} className="bg-primary">
            <Save className="size-4 mr-1.5" />
            {saving ? "Salvando configurações..." : "Salvar Configurações do Cartão"}
          </Button>
        </div>
      </Card>

      {/* Simulador Interativo */}
      <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 space-y-4">
        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400">
          <Calculator className="size-5" />
          <h3 className="font-heading font-bold text-sm">Simulador em Tempo Real</h3>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 items-end">
          <div>
            <Label className="text-xs">Valor da Venda para Simulação (R$)</Label>
            <Input
              type="number"
              step="1"
              value={valorSimulacao}
              onChange={(e) => setValorSimulacao(e.target.value)}
              className="mt-1 bg-background"
            />
          </div>
          <div>
            <Label className="text-xs">Simular Parcelamento em</Label>
            <Select value={parcelasSimuladas} onValueChange={setParcelasSimuladas}>
              <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: f.max_parcelas }, (_, i) => i + 1).map((n) => (
                  <SelectItem key={n} value={String(n)}>{n}x</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Débito */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Débito ({f.taxa_debito}%)</span>
            <div className="text-base font-bold text-primary">{brl(liquidoDebito)}</div>
            <div className="text-[11px] text-muted-foreground">Taxa: −{brl(taxaDebitoReais)}</div>
          </div>

          {/* Crédito à vista */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">Crédito 1x ({f.taxa_credito_vista}%)</span>
            <div className="text-base font-bold text-primary">{brl(liquidoCreditoVista)}</div>
            <div className="text-[11px] text-muted-foreground">Taxa: −{brl(taxaCreditoVistaReais)}</div>
          </div>

          {/* Crédito parcelado */}
          <div className="p-3 rounded-xl bg-background border border-border space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase">
              Crédito em {nParc}x ({taxaParceladoPct.toFixed(2)}%)
            </span>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400">
              {nParc}x de {brl(parcelaCliente)}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {f.repassar_taxa_cliente
                ? `Total cliente: ${brl(valorClienteParcelado)}`
                : `Loja recebe: ${brl(liquidoParcelado)}`}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function UsuariosLista() {
  const qc = useQueryClient();
  const { data: users = [] } = useQuery({
    queryKey: ["users-profiles"],
    queryFn: async () => (await supabase.from("users_profiles").select("*").order("nome")).data ?? [],
  });

  async function alterar(id: string, patch: any) {
    const { error } = await supabase.from("users_profiles").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["users-profiles"] }); }
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Users className="size-4 text-primary" />
        <span className="font-semibold">Usuários ({users.length})</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-muted-foreground border-b border-border bg-muted/30">
            <tr><th className="text-left py-2 px-3">Nome</th><th className="text-left">E-mail</th><th>Papel</th><th>Ver financeiro</th><th>Ativo</th></tr>
          </thead>
          <tbody>
            {users.map((u: any) => (
              <tr key={u.id} className="border-b border-border">
                <td className="px-3 py-2 font-medium">{u.nome}</td>
                <td className="text-muted-foreground">{u.email}</td>
                <td className="text-center">
                  <Badge variant={u.role === "admin" ? "default" : "secondary"} className="cursor-pointer"
                    onClick={() => alterar(u.id, { role: u.role === "admin" ? "funcionario" : "admin" })}>
                    {u.role}
                  </Badge>
                </td>
                <td className="text-center"><Switch checked={u.pode_ver_financeiro} onCheckedChange={(v) => alterar(u.id, { pode_ver_financeiro: v })} /></td>
                <td className="text-center"><Switch checked={u.ativo} onCheckedChange={(v) => alterar(u.id, { ativo: v })} /></td>
              </tr>
            ))}
            {users.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Sem usuários cadastrados.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 text-xs text-muted-foreground border-t border-border">
        Clique no papel para alternar entre admin e funcionário. Funcionário não acessa Configurações, Financeiro (sem permissão) nem cadastros de produto/composição.
      </div>
    </Card>
  );
}
