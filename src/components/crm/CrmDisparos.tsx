import { useState } from "react";
import { DisparoCampanha, ColunaCrm, CartaoCrm } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Megaphone,
  Plus,
  Play,
  Clock,
  CheckCircle,
  Users,
  ShieldCheck,
  Send,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface CrmDisparosProps {
  campanhas: DisparoCampanha[];
  colunas: ColunaCrm[];
  cartoes: CartaoCrm[];
  onCriarCampanha: (
    nome: string,
    mensagem: string,
    alvos: Array<{ telefone: string; nome?: string }>,
    intervaloSegundos?: number
  ) => void;
}

export function CrmDisparos({
  campanhas,
  colunas,
  cartoes,
  onCriarCampanha,
}: CrmDisparosProps) {
  const [modalNova, setModalNova] = useState(false);
  const [nome, setNome] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [intervalo, setIntervalo] = useState(20);
  const [origem, setOrigem] = useState<"coluna_crm" | "todos_leads" | "manual">("coluna_crm");
  const [colunaId, setColunaId] = useState<string>(colunas[0]?.id || "");
  const [listaManual, setListaManual] = useState("");

  // Calcula alvos
  const alvosCalculados = () => {
    if (origem === "coluna_crm") {
      return cartoes
        .filter((c) => c.coluna_id === colunaId && c.contato_telefone)
        .map((c) => ({ telefone: c.contato_telefone!, nome: c.contato_nome || undefined }));
    }
    if (origem === "todos_leads") {
      return cartoes
        .filter((c) => c.contato_telefone)
        .map((c) => ({ telefone: c.contato_telefone!, nome: c.contato_nome || undefined }));
    }
    return listaManual
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.replace(/\D/g, "").length >= 10)
      .map((l) => ({ telefone: l.replace(/\D/g, "") }));
  };

  const totalAlvos = alvosCalculados().length;

  const salvarCampanha = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !mensagem.trim()) {
      toast.error("Preencha o nome e o texto da mensagem");
      return;
    }

    const alvos = alvosCalculados();
    if (alvos.length === 0) {
      toast.error("Nenhum contato com telefone válido foi encontrado para este disparo");
      return;
    }

    onCriarCampanha(nome.trim(), mensagem.trim(), alvos, intervalo);
    setModalNova(false);
    setNome("");
    setMensagem("");
    setListaManual("");
  };

  return (
    <div className="space-y-4">
      {/* Top Banner com Ação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/80">
        <div>
          <h3 className="font-heading font-bold text-base flex items-center gap-2 text-foreground">
            <Megaphone className="size-5 text-primary" /> Disparos e Campanhas em Massa
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Envie comunicados, novidades de sabores, convites de pesagem e promoções segmentadas pelo WhatsApp.
          </p>
        </div>

        <Button
          onClick={() => setModalNova(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 gap-1.5 shrink-0"
        >
          <Plus className="size-4" /> Nova Campanha
        </Button>
      </div>

      {/* Dicas de Segurança Anti-Bloqueio */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
        <ShieldCheck className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        <span>
          <strong>Proteção de Envio:</strong> Os disparos respeitam um intervalo seguro entre mensagens (padrão 20 segundos) para proteger o número do WhatsApp contra bloqueios e spam.
        </span>
      </div>

      {/* Lista de Campanhas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {campanhas.map((camp) => (
          <Card key={camp.id} className="p-4 bg-card border-border/80 hover:border-primary/40 transition-colors">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-xs text-foreground line-clamp-1">{camp.nome}</h4>
                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300">
                  <CheckCircle className="size-3 mr-1" /> Concluído
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground line-clamp-3 bg-muted/30 p-2.5 rounded-lg border text-[11px] leading-relaxed">
                {camp.mensagem}
              </p>

              <div className="pt-2 border-t flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="size-3.5" />
                  <strong>{camp.total_alvos}</strong> alvos
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  {camp.intervalo_segundos}s intervalo
                </span>
              </div>
            </div>
          </Card>
        ))}

        {campanhas.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
            <Megaphone className="size-8 mx-auto mb-2 opacity-30" />
            Nenhuma campanha disparada ainda. Clique em "Nova Campanha" para criar seu primeiro envio em lote.
          </div>
        )}
      </div>

      {/* Modal Criar Campanha */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="max-w-md">
          <form onSubmit={salvarCampanha}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-heading">
                <Megaphone className="size-5" /> Criar Disparo WhatsApp
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label htmlFor="camp-nome" className="text-xs">Nome da Campanha *</Label>
                <Input
                  id="camp-nome"
                  placeholder="Ex: Sabor Sensação da Semana / Convite Avaliação"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="camp-origem" className="text-xs">Público Alvo (Destinatários)</Label>
                <select
                  id="camp-origem"
                  value={origem}
                  onChange={(e) => setOrigem(e.target.value as any)}
                  className="w-full mt-1 border rounded-md px-2.5 py-1.5 bg-background text-xs"
                >
                  <option value="coluna_crm">Leads de uma Etapa do Funil CRM</option>
                  <option value="todos_leads">Todos os Leads com Telefone no Funil</option>
                  <option value="manual">Digitar / Colar Telefones Manualmente</option>
                </select>
              </div>

              {origem === "coluna_crm" && (
                <div>
                  <Label htmlFor="camp-col" className="text-xs">Etapa Selecionada:</Label>
                  <select
                    id="camp-col"
                    value={colunaId}
                    onChange={(e) => setColunaId(e.target.value)}
                    className="w-full mt-1 border rounded-md px-2.5 py-1.5 bg-background text-xs"
                  >
                    {colunas.map((col) => (
                      <SelectItemOrOption key={col.id} value={col.id} label={col.nome} />
                    ))}
                  </select>
                </div>
              )}

              {origem === "manual" && (
                <div>
                  <Label htmlFor="camp-manual" className="text-xs">Cole os números (um por linha):</Label>
                  <Textarea
                    id="camp-manual"
                    placeholder="11999998888&#10;11988887777"
                    value={listaManual}
                    onChange={(e) => setListaManual(e.target.value)}
                    className="mt-1 font-mono text-xs"
                    rows={3}
                  />
                </div>
              )}

              <div className="p-2.5 bg-muted/40 rounded-lg flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Contatos válidos encontrados:</span>
                <Badge variant="secondary" className="font-bold">
                  {totalAlvos} contatos
                </Badge>
              </div>

              <div>
                <Label htmlFor="camp-msg" className="text-xs">Texto da Mensagem *</Label>
                <Textarea
                  id="camp-msg"
                  placeholder="Olá! Hoje no EVS estamos com sabor especial de Shake Sensação. Venha tomar o seu no almoço!"
                  value={mensagem}
                  onChange={(e) => setMensagem(e.target.value)}
                  className="mt-1 resize-none"
                  rows={4}
                  required
                />
              </div>

              <div>
                <Label htmlFor="camp-intervalo" className="text-xs">Intervalo de Segurança entre Envios (segundos)</Label>
                <Input
                  id="camp-intervalo"
                  type="number"
                  min={10}
                  max={120}
                  value={intervalo}
                  onChange={(e) => setIntervalo(Number(e.target.value))}
                  className="mt-1"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 block">
                  Recomendado: 20 segundos para evitar bloqueios.
                </span>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNova(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={totalAlvos === 0}
                className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
              >
                <Send className="size-3.5" /> Disparar Campanha
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SelectItemOrOption({ value, label }: { value: string; label: string }) {
  return <option value={value}>{label}</option>;
}
