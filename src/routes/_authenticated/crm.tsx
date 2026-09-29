import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCrm } from "@/hooks/use-crm";
import { CrmKanban } from "@/components/crm/CrmKanban";
import { CrmConversas } from "@/components/crm/CrmConversas";
import { CrmDisparos } from "@/components/crm/CrmDisparos";
import { CrmRobo } from "@/components/crm/CrmRobo";
import { CrmConexao } from "@/components/crm/CrmConexao";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MessageSquareText,
  Kanban,
  Megaphone,
  Bot,
  QrCode,
  Info,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/crm")({
  head: () => ({ meta: [{ title: "CRM & WhatsApp — FitLife" }] }),
  component: CrmPage,
});

function CrmPage() {
  const [abaAtiva, setAbaAtiva] = useState("funil");
  const [mostrarAvisoSql, setMostrarAvisoSql] = useState(true);
  const [copiadoSql, setCopiadoSql] = useState(false);

  const {
    loading,
    isUsingLocalFallback,
    colunas,
    cartoes,
    conexoes,
    conversas,
    fluxos,
    campanhas,
    recarregar,
    adicionarCartao,
    moverCartao,
    excluirCartao,
    importarClientesParaColuna,
    enviarMensagem,
    alternarEstadoAtendimento,
    criarCampanha,
  } = useCrm();

  const totalConversasNaoLidas = conversas.filter((c) => c.estado === "humano").length;

  const copiarCaminhoSql = () => {
    navigator.clipboard.writeText("supabase/migrations/20260928_crm_whatsapp.sql");
    setCopiadoSql(true);
    toast.success("Caminho do arquivo SQL copiado! Basta rodar no SQL Editor do Supabase.");
    setTimeout(() => setCopiadoSql(false), 2000);
  };

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Cabeçalho da Página */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquareText className="size-5" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">CRM & WhatsApp</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Funil de vendas, atendimento automatizado e relacionamento com os clientes do FitLife EVS.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={recarregar}
            className="text-xs h-8 gap-1.5"
            disabled={loading}
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Atualizar</span>
          </Button>
        </div>
      </div>

      {/* Aviso Opcional para Execução do SQL no Supabase */}
      {isUsingLocalFallback && mostrarAvisoSql && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <Info className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              O CRM está funcionando em modo local. Para persistir no seu banco Supabase, criamos o script em{" "}
              <code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded font-mono text-[11px]">
                supabase/migrations/20260928_crm_whatsapp.sql
              </code>
              .
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={copiarCaminhoSql}
              className="text-[11px] h-7 px-2 border-amber-300 dark:border-amber-700 bg-amber-100/50 dark:bg-amber-900/30 gap-1"
            >
              {copiadoSql ? <Check className="size-3 text-emerald-600" /> : <Copy className="size-3" />}
              Copiar arquivo
            </Button>
            <button
              onClick={() => setMostrarAvisoSql(false)}
              className="text-muted-foreground hover:text-foreground text-xs px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navegação por Abas do CRM */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full min-w-0">
        <TabsList className="bg-muted/70 p-1 rounded-xl h-10 w-full sm:w-auto flex overflow-x-auto justify-start">
          <TabsTrigger value="funil" className="text-xs gap-1.5 data-[state=active]:bg-card font-medium">
            <Kanban className="size-3.5" />
            <span>Funil de Leads</span>
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {cartoes.length}
            </Badge>
          </TabsTrigger>

          <TabsTrigger value="conversas" className="text-xs gap-1.5 data-[state=active]:bg-card font-medium">
            <MessageSquareText className="size-3.5" />
            <span>Conversas WhatsApp</span>
            {totalConversasNaoLidas > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 h-4 bg-emerald-600 text-white font-bold">
                {totalConversasNaoLidas}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger value="disparos" className="text-xs gap-1.5 data-[state=active]:bg-card font-medium">
            <Megaphone className="size-3.5" />
            <span>Disparos & Campanhas</span>
          </TabsTrigger>

          <TabsTrigger value="robo" className="text-xs gap-1.5 data-[state=active]:bg-card font-medium">
            <Bot className="size-3.5" />
            <span>Robô de IA & Menus</span>
          </TabsTrigger>

          <TabsTrigger value="conexao" className="text-xs gap-1.5 data-[state=active]:bg-card font-medium">
            <QrCode className="size-3.5" />
            <span>Conexão WhatsApp</span>
            {conexoes.some((c) => c.status === "conectado") && (
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 w-full min-w-0">
          <TabsContent value="funil" className="m-0 w-full min-w-0 focus-visible:outline-hidden">
            <CrmKanban
              colunas={colunas}
              cartoes={cartoes}
              onAdicionarCartao={adicionarCartao}
              onMoverCartao={moverCartao}
              onExcluirCartao={excluirCartao}
              onImportarClientes={importarClientesParaColuna}
              onIrParaConversa={(tel) => {
                setAbaAtiva("conversas");
              }}
            />
          </TabsContent>

          <TabsContent value="conversas" className="m-0 focus-visible:outline-hidden">
            <CrmConversas
              conversas={conversas}
              onEnviarMensagem={enviarMensagem}
              onAlternarEstadoAtendimento={alternarEstadoAtendimento}
            />
          </TabsContent>

          <TabsContent value="disparos" className="m-0 focus-visible:outline-hidden">
            <CrmDisparos
              campanhas={campanhas}
              colunas={colunas}
              cartoes={cartoes}
              onCriarCampanha={criarCampanha}
            />
          </TabsContent>

          <TabsContent value="robo" className="m-0 focus-visible:outline-hidden">
            <CrmRobo fluxos={fluxos} />
          </TabsContent>

          <TabsContent value="conexao" className="m-0 focus-visible:outline-hidden">
            <CrmConexao conexoes={conexoes} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
