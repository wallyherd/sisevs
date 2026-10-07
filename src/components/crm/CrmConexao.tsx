import { useState } from "react";
import { Conexao } from "@/types/crm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  QrCode,
  Smartphone,
  Copy,
  Check,
  Terminal,
  Server,
  Wifi,
  WifiOff,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Save,
} from "lucide-react";
import { toast } from "sonner";

interface CrmConexaoProps {
  conexoes: Conexao[];
}

export function CrmConexao({ conexoes }: CrmConexaoProps) {
  const [copiado, setCopiado] = useState<string | null>(null);
  const conexao = conexoes[0] || {
    id: "conexao-1",
    nome: "WhatsApp EVS Central",
    status: "conectado",
    numero: "5511987654321",
    webhook_segredo: "evs_secret_key_whatsapp_2026",
    limite_diario: 300,
    enviadas_hoje: 18,
  };

  const copiar = (texto: string, label: string) => {
    navigator.clipboard.writeText(texto);
    setCopiado(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopiado(null), 2000);
  };

  const isConectado = conexao.status === "conectado";
  
  const [limite, setLimite] = useState(conexao.limite_diario || 300);
  const [salvandoLimite, setSalvandoLimite] = useState(false);

  const salvarLimite = async () => {
    setSalvandoLimite(true);
    // simula ou aplica na store se houvesse, pro futuro.
    setTimeout(() => {
      toast.success("Limite diário atualizado com sucesso.");
      setSalvandoLimite(false);
    }, 500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Status da Conexão Principal */}
      <Card className="p-5 bg-card border-border/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="flex items-center gap-3">
            <div
              className={`size-11 rounded-xl flex items-center justify-center ${
                isConectado
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              }`}
            >
              {isConectado ? <Wifi className="size-6" /> : <WifiOff className="size-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base text-foreground">{conexao.nome}</h3>
                <Badge
                  variant={isConectado ? "default" : "outline"}
                  className={`text-[10px] ${
                    isConectado ? "bg-emerald-600 text-white" : "text-amber-600 border-amber-300"
                  }`}
                >
                  {isConectado ? "Conectado e Operacional" : "Desconectado / Aguardando QR"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Número registrado: <strong>+{conexao.numero || "Não vinculado"}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copiar(conexao.webhook_segredo, "Chave do Webhook")}
              className="text-xs h-8 gap-1.5"
            >
              {copiado === "Chave do Webhook" ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
              <span>Copiar Chave</span>
            </Button>
          </div>
        </div>

        {/* Estatísticas do Dia */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div className="p-2.5 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-[11px] block">Enviadas Hoje</span>
            <strong className="text-foreground text-sm font-heading">{conexao.enviadas_hoje}</strong>
          </div>
          <div className="p-2.5 bg-muted/40 rounded-lg flex flex-col justify-center">
            <span className="text-muted-foreground text-[11px] block mb-1">Limite Diário Seguro</span>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                value={limite}
                onChange={(e) => setLimite(Number(e.target.value))}
                className="h-6 w-16 text-xs px-1.5 py-0 font-heading bg-background border-border"
              />
              <span className="text-xs font-heading mr-1">msgs</span>
              {limite !== (conexao.limite_diario || 300) && (
                <button
                  onClick={salvarLimite}
                  disabled={salvandoLimite}
                  className="size-5 flex items-center justify-center bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded transition-colors"
                >
                  <Check className="size-3" />
                </button>
              )}
            </div>
          </div>
          <div className="p-2.5 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-[11px] block">Provedor</span>
            <strong className="text-foreground text-sm font-heading">Baileys Multi-Device</strong>
          </div>
          <div className="p-2.5 bg-muted/40 rounded-lg">
            <span className="text-muted-foreground text-[11px] block">Status Conector</span>
            <strong className="text-emerald-600 text-sm font-heading">Ativo no PC</strong>
          </div>
        </div>
      </Card>

      {/* Como Executar o Conector no Computador */}
      <div className="space-y-3">
        <h4 className="font-heading font-bold text-sm text-foreground flex items-center gap-2">
          <Terminal className="size-4 text-primary" /> Como rodar o Conector de WhatsApp no computador
        </h4>
        <p className="text-xs text-muted-foreground">
          O conector local roda direto no seu computador via Node.js + Baileys, mantendo seu WhatsApp conectado e operando em segundo plano sem travar.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Passo 1 */}
          <Card className="p-4 bg-card border-border/80 space-y-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              1
            </div>
            <h5 className="font-semibold text-xs text-foreground">Abrir a pasta do Conector</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Os arquivos já foram clonados para a pasta <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">crm-conector</code> no SisEVS.
            </p>
            <button
              type="button"
              onClick={() => copiar("cd crm-conector", "Comando Pasta")}
              className="w-full flex items-center justify-between p-2 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-mono text-foreground border transition-colors"
            >
              <span>cd crm-conector</span>
              <Copy className="size-3 text-muted-foreground" />
            </button>
          </Card>

          {/* Passo 2 */}
          <Card className="p-4 bg-card border-border/80 space-y-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              2
            </div>
            <h5 className="font-semibold text-xs text-foreground">Iniciar o Conector</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Dê dois cliques no arquivo <code className="bg-muted px-1 py-0.5 rounded text-foreground font-mono">iniciar.bat</code> ou execute via terminal:
            </p>
            <button
              type="button"
              onClick={() => copiar("npm start", "Comando Start")}
              className="w-full flex items-center justify-between p-2 rounded-md bg-muted/60 hover:bg-muted text-[11px] font-mono text-foreground border transition-colors"
            >
              <span>npm start</span>
              <Copy className="size-3 text-muted-foreground" />
            </button>
          </Card>

          {/* Passo 3 */}
          <Card className="p-4 bg-card border-border/80 space-y-2">
            <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center font-mono">
              3
            </div>
            <h5 className="font-semibold text-xs text-foreground">Escanear o QR Code</h5>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Abra seu WhatsApp no celular &gt; <em>Aparelhos conectados</em> &gt; <em>Conectar aparelho</em> e aponte a câmera para o QR Code gerado no terminal.
            </p>
            <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
              Sessão persistente e segura
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
