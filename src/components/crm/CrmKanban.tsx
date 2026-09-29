import { useState } from "react";
import { ColunaCrm, CartaoCrm } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { CrmImportarClientesDialog } from "./CrmImportarClientesDialog";
import {
  Plus,
  Search,
  MessageCircle,
  Phone,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Users,
  DollarSign,
  Tag,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface CrmKanbanProps {
  colunas: ColunaCrm[];
  cartoes: CartaoCrm[];
  onAdicionarCartao: (dados: {
    colunaId: string;
    titulo: string;
    nome?: string;
    telefone?: string;
    valor?: number;
    descricao?: string;
    origem?: string;
    prioridade?: "baixa" | "normal" | "alta";
  }) => Promise<void>;
  onMoverCartao: (cartaoId: string, novaColunaId: string) => Promise<void>;
  onExcluirCartao: (cartaoId: string) => Promise<void>;
  onImportarClientes: (
    clientes: Array<{ id: string; nome: string; telefone: string | null }>,
    colunaId: string
  ) => Promise<number>;
  onIrParaConversa?: (telefone: string) => void;
}

export function CrmKanban({
  colunas,
  cartoes,
  onAdicionarCartao,
  onMoverCartao,
  onExcluirCartao,
  onImportarClientes,
  onIrParaConversa,
}: CrmKanbanProps) {
  const [busca, setBusca] = useState("");
  const [modalNovo, setModalNovo] = useState(false);
  const [colunaSelecionada, setColunaSelecionada] = useState<string>(colunas[0]?.id || "");
  const [modalImportar, setModalImportar] = useState(false);
  const [cartaoDetalhe, setCartaoDetalhe] = useState<CartaoCrm | null>(null);

  // Form states
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novaPrioridade, setNovaPrioridade] = useState<"baixa" | "normal" | "alta">("normal");
  const [novaDescricao, setNovaDescricao] = useState("");
  const [novaOrigem, setNovaOrigem] = useState("WhatsApp");

  const abrirNovoParaColuna = (colunaId: string) => {
    setColunaSelecionada(colunaId);
    setNovoTitulo("");
    setNovoNome("");
    setNovoTelefone("");
    setNovoValor("");
    setNovaPrioridade("normal");
    setNovaDescricao("");
    setNovaOrigem("WhatsApp");
    setModalNovo(true);
  };

  const salvarNovoLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoTitulo.trim()) {
      toast.error("Informe o título do lead ou interesse");
      return;
    }

    await onAdicionarCartao({
      colunaId: colunaSelecionada,
      titulo: novoTitulo.trim(),
      nome: novoNome.trim() || undefined,
      telefone: novoTelefone.trim() || undefined,
      valor: novoValor ? parseFloat(novoValor.replace(",", ".")) : 0,
      prioridade: novaPrioridade,
      descricao: novaDescricao.trim() || undefined,
      origem: novaOrigem,
    });

    setModalNovo(false);
  };

  // Filtragem
  const cartoesFiltrados = cartoes.filter((c) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(b) ||
      (c.contato_nome && c.contato_nome.toLowerCase().includes(b)) ||
      (c.contato_telefone && c.contato_telefone.includes(b)) ||
      (c.origem && c.origem.toLowerCase().includes(b))
    );
  });

  // Totalizador de Leads e Valor em Funil
  const totalLeads = cartoesFiltrados.length;
  const valorTotalFunil = cartoesFiltrados.reduce((acc, cur) => acc + (cur.valor || 0), 0);

  return (
    <div className="space-y-4">
      {/* Barra Superior com Métricas e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/80 shadow-xs">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por lead, nome ou telefone..."
              className="pl-8 text-xs h-9 bg-background"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="bg-secondary px-2.5 py-1 rounded-md">
              Total: <strong className="text-foreground">{totalLeads}</strong> leads
            </span>
            <span className="bg-secondary px-2.5 py-1 rounded-md">
              Valor Previsto: <strong className="text-emerald-600">{brl(valorTotalFunil)}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalImportar(true)}
            className="text-xs h-9 border-dashed border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
          >
            <Users className="size-3.5 mr-1 text-emerald-600" />
            Importar Clientes SisEVS
          </Button>
          <Button
            size="sm"
            onClick={() => abrirNovoParaColuna(colunas[0]?.id || "")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9"
          >
            <Plus className="size-4 mr-1" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Colunas do Funil (Kanban com scroll horizontal) */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
        {colunas.map((coluna, colIdx) => {
          const cartoesDaColuna = cartoesFiltrados.filter((c) => c.coluna_id === coluna.id);
          const totalValorColuna = cartoesDaColuna.reduce((acc, cur) => acc + (cur.valor || 0), 0);
          const proximaColuna = colunas[colIdx + 1];
          const colunaAnterior = colunas[colIdx - 1];

          return (
            <div
              key={coluna.id}
              className="flex flex-col bg-muted/40 rounded-xl border border-border/80 p-3 w-[280px] shrink-0"
            >
              {/* Cabeçalho da Coluna */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: coluna.cor || "#059669" }}
                  />
                  <h3 className="font-semibold text-xs text-foreground truncate" title={coluna.nome}>
                    {coluna.nome}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-bold">
                    {cartoesDaColuna.length}
                  </Badge>
                </div>
              </div>

              {totalValorColuna > 0 && (
                <div className="text-[11px] text-muted-foreground font-medium mb-2 px-1">
                  Total: <span className="text-foreground font-semibold">{brl(totalValorColuna)}</span>
                </div>
              )}

              {/* Botão Rápido de Adicionar na Coluna */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => abrirNovoParaColuna(coluna.id)}
                className="w-full text-xs h-7 text-muted-foreground hover:text-foreground hover:bg-card border border-dashed border-border/70 mb-2 justify-start px-2 font-normal"
              >
                <Plus className="size-3 mr-1" />
                Adicionar lead
              </Button>

              {/* Lista de Cartões da Coluna */}
              <div className="space-y-2 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {cartoesDaColuna.map((cartao) => {
                  const prioridadeColor =
                    cartao.prioridade === "alta"
                      ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200"
                      : cartao.prioridade === "baixa"
                        ? "bg-slate-50 text-slate-600 dark:bg-slate-900 dark:text-slate-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200";

                  return (
                    <Card
                      key={cartao.id}
                      onClick={() => setCartaoDetalhe(cartao)}
                      className="p-3 bg-card border-border/80 hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all cursor-pointer group relative"
                    >
                      <div className="space-y-2">
                        {/* Título e Prioridade */}
                        <div className="flex items-start justify-between gap-1.5">
                          <h4 className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                            {cartao.titulo}
                          </h4>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full uppercase font-bold shrink-0 border ${prioridadeColor}`}>
                            {cartao.prioridade}
                          </span>
                        </div>

                        {/* Nome do Contato e Origem */}
                        {(cartao.contato_nome || cartao.origem) && (
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="truncate">{cartao.contato_nome || "Sem nome"}</span>
                            {cartao.origem && (
                              <span className="text-[10px] bg-secondary px-1.5 py-0.2 rounded text-muted-foreground shrink-0">
                                {cartao.origem}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Valor Estimado */}
                        {cartao.valor ? (
                          <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                            <DollarSign className="size-3" />
                            {brl(cartao.valor)}
                          </div>
                        ) : null}

                        {/* Ações do Rodapé do Cartão */}
                        <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-1" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            {cartao.contato_telefone && (
                              <a
                                href={`https://wa.me/55${cartao.contato_telefone.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Abrir WhatsApp"
                                className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              >
                                <MessageCircle className="size-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => onExcluirCartao(cartao.id)}
                              title="Excluir"
                              className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-0.5">
                            {colunaAnterior && (
                              <button
                                onClick={() => onMoverCartao(cartao.id, colunaAnterior.id)}
                                title={`Voltar para: ${colunaAnterior.nome}`}
                                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
                              >
                                <ChevronLeft className="size-3.5" />
                              </button>
                            )}
                            {proximaColuna && (
                              <button
                                onClick={() => onMoverCartao(cartao.id, proximaColuna.id)}
                                title={`Avançar para: ${proximaColuna.nome}`}
                                className="p-1 rounded-md text-primary font-bold hover:bg-primary/10 flex items-center gap-0.5 text-[10px]"
                              >
                                <span>Avançar</span>
                                <ChevronRight className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}

                {cartoesDaColuna.length === 0 && (
                  <div className="py-6 text-center text-[11px] text-muted-foreground border border-dashed rounded-lg">
                    Nenhum lead nesta etapa
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Novo Lead */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-md">
          <form onSubmit={salvarNovoLead}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-heading">
                <Plus className="size-5" /> Novo Lead no Funil
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label htmlFor="lead-titulo" className="text-xs">Título / Interesse *</Label>
                <Input
                  id="lead-titulo"
                  placeholder="Ex: Shake Sensação + Desafio 15 Dias"
                  value={novoTitulo}
                  onChange={(e) => setNovoTitulo(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="lead-nome" className="text-xs">Nome do Contato</Label>
                  <Input
                    id="lead-nome"
                    placeholder="Nome completo ou apelido"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-tel" className="text-xs">WhatsApp / Telefone</Label>
                  <Input
                    id="lead-tel"
                    placeholder="11999998888"
                    value={novoTelefone}
                    onChange={(e) => setNovoTelefone(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="lead-valor" className="text-xs">Valor Previsto (R$)</Label>
                  <Input
                    id="lead-valor"
                    placeholder="0,00"
                    value={novoValor}
                    onChange={(e) => setNovoValor(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lead-prio" className="text-xs">Prioridade</Label>
                  <select
                    id="lead-prio"
                    value={novaPrioridade}
                    onChange={(e) => setNovaPrioridade(e.target.value as any)}
                    className="w-full mt-1 border rounded-md px-2 py-1.5 bg-background text-xs"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="lead-origem" className="text-xs">Origem</Label>
                  <select
                    id="lead-origem"
                    value={novaOrigem}
                    onChange={(e) => setNovaOrigem(e.target.value)}
                    className="w-full mt-1 border rounded-md px-2 py-1.5 bg-background text-xs"
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Presencial">Presencial</option>
                    <option value="Base SisEVS">Base SisEVS</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="lead-desc" className="text-xs">Observações / Detalhes</Label>
                <Textarea
                  id="lead-desc"
                  placeholder="Informações sobre o contato, metas de emagrecimento, preferências de sabor..."
                  value={novaDescricao}
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovo(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Salvar Lead
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes do Lead */}
      {cartaoDetalhe && (
        <Dialog open={!!cartaoDetalhe} onOpenChange={() => setCartaoDetalhe(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="font-heading text-lg font-bold text-foreground">
                  {cartaoDetalhe.titulo}
                </DialogTitle>
                <Badge variant="outline" className="uppercase text-[10px]">
                  {cartaoDetalhe.prioridade}
                </Badge>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-muted/30 p-3 rounded-lg border">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Contato</span>
                  <strong className="text-foreground text-xs">{cartaoDetalhe.contato_nome || "Não informado"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Telefone</span>
                  {cartaoDetalhe.contato_telefone ? (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <strong className="text-foreground text-xs">{cartaoDetalhe.contato_telefone}</strong>
                      <a
                        href={`https://wa.me/55${cartaoDetalhe.contato_telefone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <MessageCircle className="size-3.5" />
                      </a>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Sem telefone</span>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Valor Estimado</span>
                  <strong className="text-emerald-600 text-xs">{brl(cartaoDetalhe.valor || 0)}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Origem</span>
                  <span className="text-foreground text-xs">{cartaoDetalhe.origem || "Manual"}</span>
                </div>
              </div>

              {cartaoDetalhe.descricao && (
                <div>
                  <span className="text-muted-foreground block text-[11px] mb-1">Observações</span>
                  <p className="p-2.5 bg-muted/20 rounded-md border text-muted-foreground leading-relaxed">
                    {cartaoDetalhe.descricao}
                  </p>
                </div>
              )}

              {/* Mover de Coluna Rápido */}
              <div>
                <span className="text-muted-foreground block text-[11px] mb-1">Mover para outra etapa</span>
                <div className="flex flex-wrap gap-1.5">
                  {colunas.map((c) => (
                    <Button
                      key={c.id}
                      variant={c.id === cartaoDetalhe.coluna_id ? "default" : "outline"}
                      size="sm"
                      className="text-[11px] h-7 px-2"
                      onClick={() => {
                        onMoverCartao(cartaoDetalhe.id, c.id);
                        setCartaoDetalhe({ ...cartaoDetalhe, coluna_id: c.id });
                      }}
                    >
                      {c.nome}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t flex justify-between sm:justify-between items-center w-full">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1 text-xs"
                onClick={() => {
                  onExcluirCartao(cartaoDetalhe.id);
                  setCartaoDetalhe(null);
                }}
              >
                <Trash2 className="size-3.5" /> Excluir
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCartaoDetalhe(null)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Importação de Clientes SisEVS */}
      <CrmImportarClientesDialog
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        colunas={colunas}
        onImportar={onImportarClientes}
      />
    </div>
  );
}
