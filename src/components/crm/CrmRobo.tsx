import { useState } from "react";
import { Fluxo, Passo, Opcao } from "@/types/crm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Bot,
  Plus,
  Play,
  Pause,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CrmRoboProps {
  fluxos: Fluxo[];
}

export function CrmRobo({ fluxos }: CrmRoboProps) {
  const [fluxosState, setFluxosState] = useState<Fluxo[]>(fluxos);
  const [modalNovo, setModalNovo] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoGatilho, setNovoGatilho] = useState<"primeira_mensagem" | "palavra_chave">("palavra_chave");
  const [novoGatilhoValor, setNovoGatilhoValor] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");

  const toggleAtivo = (id: string) => {
    setFluxosState((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ativo: !f.ativo } : f))
    );
    toast.success("Status do fluxo atualizado!");
  };

  const salvarNovoFluxo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoConteudo.trim()) {
      toast.error("Preencha o nome e a resposta automática");
      return;
    }

    const novo: Fluxo = {
      id: "fluxo-" + Date.now(),
      nome: novoNome.trim(),
      ativo: true,
      gatilho_tipo: novoGatilho,
      gatilho_valor: novoGatilho === "palavra_chave" ? novoGatilhoValor.trim() : null,
      passos: [
        {
          id: "passo-" + Date.now(),
          fluxo_id: "fluxo-" + Date.now(),
          chave: "inicio",
          tipo: "mensagem",
          conteudo: novoConteudo.trim(),
          posicao: 1,
        },
      ],
    };

    setFluxosState((prev) => [novo, ...prev]);
    toast.success("Novo fluxo automático criado!");
    setModalNovo(false);
    setNovoNome("");
    setNovoConteudo("");
    setNovoGatilhoValor("");
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border/80">
        <div>
          <h3 className="font-heading font-bold text-base flex items-center gap-2 text-foreground">
            <Bot className="size-5 text-primary" /> Robô de Atendimento & Fluxos EVS
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure respostas automáticas de boas-vindas, envio do cardápio de shakes e horários no WhatsApp.
          </p>
        </div>

        <Button
          onClick={() => setModalNovo(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 gap-1.5 shrink-0"
        >
          <Plus className="size-4" /> Novo Fluxo
        </Button>
      </div>

      {/* Cards de Fluxos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fluxosState.map((fluxo) => {
          const primeiroPasso = fluxo.passos?.[0];

          return (
            <Card key={fluxo.id} className="p-4 bg-card border-border/80 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                    {fluxo.nome}
                  </h4>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Gatilho:{" "}
                    <span className="font-medium text-foreground">
                      {fluxo.gatilho_tipo === "primeira_mensagem"
                        ? "Primeira mensagem recebida de novo contato"
                        : `Palavra-chave contém: "${fluxo.gatilho_valor || ""}"`}
                    </span>
                  </div>
                </div>

                <Button
                  variant={fluxo.ativo ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAtivo(fluxo.id)}
                  className={`text-[11px] h-7 px-2.5 ${
                    fluxo.ativo
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "text-muted-foreground"
                  }`}
                >
                  {fluxo.ativo ? "Ativo" : "Pausado"}
                </Button>
              </div>

              {primeiroPasso && (
                <div className="p-3 bg-muted/40 rounded-lg border text-xs whitespace-pre-wrap leading-relaxed text-foreground/90 font-sans">
                  {primeiroPasso.conteudo}
                </div>
              )}

              {primeiroPasso?.opcoes && primeiroPasso.opcoes.length > 0 && (
                <div className="pt-2 border-t flex flex-wrap gap-1.5">
                  <span className="text-[10px] text-muted-foreground w-full font-semibold">
                    Opções interativas do menu:
                  </span>
                  {primeiroPasso.opcoes.map((op) => (
                    <span
                      key={op.id}
                      className="text-[10px] px-2 py-0.5 bg-secondary text-secondary-foreground rounded-md border font-medium"
                    >
                      {op.rotulo}
                    </span>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal Novo Fluxo */}
      <Dialog open={modalNovo} onOpenChange={setModalNovo}>
        <DialogContent className="max-w-md">
          <form onSubmit={salvarNovoFluxo}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-primary font-heading">
                <Bot className="size-5" /> Criar Fluxo Automático
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-3 text-xs">
              <div>
                <Label htmlFor="fl-nome" className="text-xs">Nome do Fluxo *</Label>
                <Input
                  id="fl-nome"
                  placeholder="Ex: Resposta Automática Cardápio"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="fl-gatilho" className="text-xs">Quando disparar?</Label>
                <select
                  id="fl-gatilho"
                  value={novoGatilho}
                  onChange={(e) => setNovoGatilho(e.target.value as any)}
                  className="w-full mt-1 border rounded-md px-2.5 py-1.5 bg-background text-xs"
                >
                  <option value="palavra_chave">Quando o cliente enviar palavra-chave</option>
                  <option value="primeira_mensagem">Na primeira mensagem de qualquer novo contato</option>
                </select>
              </div>

              {novoGatilho === "palavra_chave" && (
                <div>
                  <Label htmlFor="fl-palavra" className="text-xs">Palavra-chave ativadora (separadas por vírgula):</Label>
                  <Input
                    id="fl-palavra"
                    placeholder="cardapio, sabores, shake, menu"
                    value={novoGatilhoValor}
                    onChange={(e) => setNovoGatilhoValor(e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="fl-resp" className="text-xs">Resposta Automática do Robô *</Label>
                <Textarea
                  id="fl-resp"
                  placeholder="Olá! Hoje temos Shakes incríveis nos sabores Sensação, Morango, Chocolate Belga e Coco com Canela. Também temos Chá Turbo e Waffle Proteico!"
                  value={novoConteudo}
                  onChange={(e) => setNovoConteudo(e.target.value)}
                  className="mt-1 resize-none"
                  rows={4}
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-2 border-t">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalNovo(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Salvar Fluxo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
