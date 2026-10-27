import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FormaPagamento = "pix" | "dinheiro" | "debito" | "credito";
const TODAS: FormaPagamento[] = ["pix", "dinheiro", "debito", "credito"];

export type ConfiguracaoCartao = {
  habilitado: boolean;
  operadora_principal: string;
  taxa_debito: number;
  taxa_credito_vista: number;
  permitir_parcelamento: boolean;
  max_parcelas: number;
  taxa_por_parcela: number;
  valor_minimo_parcela: number;
  repassar_taxa_cliente: boolean;
  dias_recebimento: string;
  observacoes_cartao?: string;
};

export const CONFIG_CARTAO_DEFAULT: ConfiguracaoCartao = {
  habilitado: true,
  operadora_principal: "Mercado Pago",
  taxa_debito: 1.99,
  taxa_credito_vista: 3.49,
  permitir_parcelamento: true,
  max_parcelas: 6,
  taxa_por_parcela: 1.49,
  valor_minimo_parcela: 25,
  repassar_taxa_cliente: false,
  dias_recebimento: "D+1",
  observacoes_cartao: "",
};

export function useConfigLoja() {
  const { data } = useQuery({
    queryKey: ["config-loja"],
    queryFn: async () => {
      const { data } = await supabase
        .from("configuracoes_loja")
        .select("*")
        .limit(1)
        .maybeSingle();
      return data as any;
    },
    staleTime: 60_000,
  });

  const diasAlertaVencimento = Number(data?.dias_alerta_vencimento ?? 7);
  const formasAtivas = (Array.isArray(data?.formas_pagamento_ativas)
    ? (data!.formas_pagamento_ativas as string[])
    : TODAS) as FormaPagamento[];

  // Obter configurações do cartão do banco de dados ou fallback do localStorage
  let configCartao: ConfiguracaoCartao = CONFIG_CARTAO_DEFAULT;
  if (data?.configuracao_cartao && typeof data.configuracao_cartao === "object") {
    configCartao = { ...CONFIG_CARTAO_DEFAULT, ...data.configuracao_cartao };
  } else if (typeof window !== "undefined") {
    try {
      const salvo = localStorage.getItem("fitlife_config_cartao");
      if (salvo) configCartao = { ...CONFIG_CARTAO_DEFAULT, ...JSON.parse(salvo) };
    } catch {
      // fallback default
    }
  }

  return { diasAlertaVencimento, formasAtivas, configCartao, raw: data };
}
