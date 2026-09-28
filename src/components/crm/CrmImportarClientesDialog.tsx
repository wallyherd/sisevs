import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ColunaCrm } from "@/types/crm";
import { Users, Search, Download } from "lucide-react";
import { toast } from "sonner";

interface CrmImportarClientesDialogProps {
  open: boolean;
  onClose: () => void;
  colunas: ColunaCrm[];
  colunaPadraoId?: string;
  onImportar: (clientes: Array<{ id: string; nome: string; telefone: string | null }>, colunaId: string) => Promise<number>;
}

export function CrmImportarClientesDialog({
  open,
  onClose,
  colunas,
  colunaPadraoId,
  onImportar,
}: CrmImportarClientesDialogProps) {
  const [busca, setBusca] = useState("");
  const [colunaDestino, setColunaDestino] = useState<string>(colunaPadraoId || colunas[0]?.id || "");
  const [selecionados, setSelecionados] = useState<Record<string, boolean>>({});
  const [importando, setImportando] = useState(false);

  // Busca lista de clientes reais cadastrados no SisEVS
  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes-crm-import", busca],
    queryFn: async () => {
      let q = supabase.from("clientes").select("id, nome, telefone, quem_indicou").order("nome").limit(100);
      if (busca) q = q.or(`nome.ilike.%${busca}%,telefone.ilike.%${busca}%`);
      const { data } = await q;
      return (data ?? []) as Array<{ id: string; nome: string; telefone: string | null; quem_indicou: string | null }>;
    },
    enabled: open,
  });

  const todosSelecionados = clientes.length > 0 && clientes.every((c) => selecionados[c.id]);

  const toggleTodos = () => {
    if (todosSelecionados) {
      setSelecionados({});
    } else {
      const novo: Record<string, boolean> = {};
      clientes.forEach((c) => {
        novo[c.id] = true;
      });
      setSelecionados(novo);
    }
  };

  const handleImportar = async () => {
    const escolhidos = clientes.filter((c) => selecionados[c.id]);
    if (escolhidos.length === 0) {
      toast.error("Selecione ao menos um cliente para importar");
      return;
    }
    if (!colunaDestino) {
      toast.error("Selecione a etapa do funil de destino");
      return;
    }

    setImportando(true);
    try {
      const qtd = await onImportar(escolhidos, colunaDestino);
      toast.success(`${qtd} cliente(s) importado(s) para o Funil com sucesso!`);
      onClose();
    } catch {
      toast.error("Erro ao importar clientes");
    } finally {
      setImportando(false);
    }
  };

  const totalMarcados = Object.values(selecionados).filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Users className="size-5" />
            <DialogTitle>Importar Clientes do SisEVS para o Funil</DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Selecione clientes já cadastrados no SisEVS para virarem cartões no CRM Kanban.
          </p>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Etapa de Destino no Funil:</label>
              <Select value={colunaDestino} onValueChange={setColunaDestino}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a coluna..." />
                </SelectTrigger>
                <SelectContent>
                  {colunas.map((col) => (
                    <SelectItem key={col.id} value={col.id}>
                      {col.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground mb-1 block">Buscar cliente:</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou telefone..."
                  className="pl-8 text-xs"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs px-1 text-muted-foreground pt-1 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={todosSelecionados} onCheckedChange={toggleTodos} />
              <span>Selecionar todos ({clientes.length})</span>
            </label>
            <span>{totalMarcados} selecionado(s)</span>
          </div>

          <div className="flex-1 overflow-y-auto border rounded-lg divide-y max-h-[300px]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Carregando clientes do SisEVS...</div>
            ) : clientes.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">Nenhum cliente encontrado.</div>
            ) : (
              clientes.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/50 cursor-pointer text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Checkbox
                      checked={!!selecionados[c.id]}
                      onCheckedChange={(ch) =>
                        setSelecionados((prev) => ({ ...prev, [c.id]: !!ch }))
                      }
                    />
                    <div className="truncate">
                      <div className="font-semibold text-foreground truncate">{c.nome}</div>
                      <div className="text-[11px] text-muted-foreground">{c.telefone || "Sem telefone"}</div>
                    </div>
                  </div>
                  {c.quem_indicou && (
                    <span className="text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full shrink-0">
                      Indicação: {c.quem_indicou}
                    </span>
                  )}
                </label>
              ))
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t mt-3 flex justify-between sm:justify-between items-center w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={importando}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleImportar}
            disabled={importando || totalMarcados === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5"
          >
            <Download className="size-4" />
            Importar {totalMarcados > 0 ? `(${totalMarcados})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
