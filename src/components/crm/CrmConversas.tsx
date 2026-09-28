import { useState, useRef, useEffect } from "react";
import { Conversa, Mensagem } from "@/types/crm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Send,
  Search,
  Bot,
  UserCheck,
  CheckCheck,
  Check,
  ExternalLink,
  Sparkles,
  Phone,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface CrmConversasProps {
  conversas: Conversa[];
  onEnviarMensagem: (conversaId: string, texto: string) => Promise<void>;
  onAlternarEstadoAtendimento: (conversaId: string, novoEstado: "bot" | "humano") => void;
}

export function CrmConversas({
  conversas,
  onEnviarMensagem,
  onAlternarEstadoAtendimento,
}: CrmConversasProps) {
  const [busca, setBusca] = useState("");
  const [conversaAtivaId, setConversaAtivaId] = useState<string>(conversas[0]?.id || "");
  const [textoEnvio, setTextoEnvio] = useState("");
  const [enviando, setEnviando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversaAtiva = conversas.find((c) => c.id === conversaAtivaId) || conversas[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversaAtiva?.mensagens]);

  const conversasFiltradas = conversas.filter((c) => {
    if (!busca) return true;
    const b = busca.toLowerCase();
    return (
      (c.nome && c.nome.toLowerCase().includes(b)) ||
      c.telefone.includes(b)
    );
  });

  const enviar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!conversaAtiva || !textoEnvio.trim()) return;

    setEnviando(true);
    try {
      await onEnviarMensagem(conversaAtiva.id, textoEnvio.trim());
      setTextoEnvio("");
    } finally {
      setEnviando(false);
    }
  };

  const enviarFraseRapida = async (frase: string) => {
    if (!conversaAtiva) return;
    await onEnviarMensagem(conversaAtiva.id, frase);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-210px)] min-h-[500px]">
      {/* Coluna Esquerda: Lista de Conversas */}
      <Card className="md:col-span-4 flex flex-col p-3 border-border/80 bg-card overflow-hidden">
        <div className="pb-3 border-b border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-sm flex items-center gap-1.5 text-foreground">
              <MessageSquare className="size-4 text-primary" /> Conversas WhatsApp
            </h3>
            <Badge variant="outline" className="text-[10px] px-1.5">
              {conversasFiltradas.length} ativas
            </Badge>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por contato ou telefone..."
              className="pl-8 text-xs h-8 bg-background"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        {/* Lista com Scroll */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40 mt-2 pr-0.5">
          {conversasFiltradas.map((c) => {
            const isAtiva = c.id === conversaAtiva?.id;
            const ultimaMsg = c.mensagens && c.mensagens.length > 0 ? c.mensagens[c.mensagens.length - 1] : null;

            return (
              <div
                key={c.id}
                onClick={() => setConversaAtivaId(c.id)}
                className={`p-2.5 rounded-lg cursor-pointer transition-colors text-xs flex flex-col gap-1 ${
                  isAtiva
                    ? "bg-primary/10 border-l-3 border-primary"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground truncate max-w-[170px]">
                    {c.nome || c.telefone}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                      c.estado === "humano"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                    }`}
                  >
                    {c.estado === "humano" ? <UserCheck className="size-2.5" /> : <Bot className="size-2.5" />}
                    {c.estado === "humano" ? "Humano" : "Robô"}
                  </span>
                </div>

                <div className="text-[11px] text-muted-foreground truncate">
                  {ultimaMsg ? ultimaMsg.corpo : c.telefone}
                </div>
              </div>
            );
          })}

          {conversasFiltradas.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhuma conversa encontrada.
            </div>
          )}
        </div>
      </Card>

      {/* Coluna Direita: Janela de Atendimento do Chat */}
      <Card className="md:col-span-8 flex flex-col p-0 border-border/80 bg-card overflow-hidden">
        {conversaAtiva ? (
          <>
            {/* Header da Conversa */}
            <div className="p-3 border-b border-border/60 flex items-center justify-between flex-wrap gap-2 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                  {(conversaAtiva.nome || conversaAtiva.telefone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground flex items-center gap-2">
                    {conversaAtiva.nome || "Cliente"}
                    <span className="text-[11px] text-muted-foreground font-normal">
                      ({conversaAtiva.telefone})
                    </span>
                  </h4>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    Status do atendimento:{" "}
                    <strong>{conversaAtiva.estado === "humano" ? "Atendimento Humano" : "Robô Automático"}</strong>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onAlternarEstadoAtendimento(
                      conversaAtiva.id,
                      conversaAtiva.estado === "humano" ? "bot" : "humano"
                    )
                  }
                  className="text-xs h-8 gap-1.5"
                >
                  {conversaAtiva.estado === "humano" ? (
                    <>
                      <Bot className="size-3.5 text-emerald-600" />
                      <span>Ativar Robô</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5 text-amber-600" />
                      <span>Assumir Atendimento</span>
                    </>
                  )}
                </Button>

                <a
                  href={`https://wa.me/55${conversaAtiva.telefone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center size-8 rounded-md border text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  title="Abrir no WhatsApp Web externo"
                >
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </div>

            {/* Balões de Mensagem */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10 dark:bg-background/40"
            >
              {(conversaAtiva.mensagens || []).map((msg) => {
                const isSaida = msg.direcao === "saida";

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isSaida ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-2xs leading-relaxed whitespace-pre-wrap ${
                        isSaida
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-muted text-foreground border border-border/60 rounded-tl-xs"
                      }`}
                    >
                      {msg.corpo}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground px-1">
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isSaida && (
                        <span>
                          {msg.status === "lida" ? (
                            <CheckCheck className="size-3 text-emerald-500 inline" />
                          ) : (
                            <Check className="size-3 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {(!conversaAtiva.mensagens || conversaAtiva.mensagens.length === 0) && (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  Nenhuma mensagem trocada ainda nesta conversa.
                </div>
              )}
            </div>

            {/* Respostas Rápidas / Sugestões para o EVS */}
            <div className="px-3 py-1.5 border-t border-border/40 bg-card flex items-center gap-1.5 overflow-x-auto text-[11px]">
              <span className="text-muted-foreground flex items-center gap-1 shrink-0 font-medium">
                <Sparkles className="size-3 text-gold" /> Respostas rápidas:
              </span>
              <button
                type="button"
                onClick={() =>
                  enviarFraseRapida(
                    "Olá! Hoje no EVS temos Shakes nos sabores Sensação, Doce de Leite e Cookies. Qual você gostaria de provar?"
                  )
                }
                className="px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground shrink-0 border transition-colors"
              >
                Cardápio do Dia
              </button>
              <button
                type="button"
                onClick={() =>
                  enviarFraseRapida(
                    "Nosso horário de funcionamento é de segunda a sexta, das 07h às 14h e das 17h às 20h. Te esperamos!"
                  )
                }
                className="px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground shrink-0 border transition-colors"
              >
                Horário EVS
              </button>
              <button
                type="button"
                onClick={() =>
                  enviarFraseRapida(
                    "Gostaria de agendar uma avaliação de Bioimpedância gratuita conosco esta semana?"
                  )
                }
                className="px-2 py-0.5 rounded-full bg-secondary hover:bg-secondary/80 text-foreground shrink-0 border transition-colors"
              >
                Convite Bioimpedância
              </button>
            </div>

            {/* Campo de Envio de Mensagem */}
            <form onSubmit={enviar} className="p-3 border-t border-border/60 flex items-center gap-2 bg-card">
              <Input
                placeholder="Digite sua mensagem para o cliente..."
                value={textoEnvio}
                onChange={(e) => setTextoEnvio(e.target.value)}
                className="text-xs h-10 bg-background"
                disabled={enviando}
              />
              <Button
                type="submit"
                size="sm"
                disabled={enviando || !textoEnvio.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4 gap-1.5"
              >
                <Send className="size-4" />
                <span>Enviar</span>
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <MessageSquare className="size-10 mb-2 opacity-30" />
            <p className="text-xs">Selecione uma conversa ao lado para ver o histórico e responder.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
