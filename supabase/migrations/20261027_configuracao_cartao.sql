-- Migration: Adicionar coluna configuracao_cartao na tabela configuracoes_loja

ALTER TABLE public.configuracoes_loja 
ADD COLUMN IF NOT EXISTS configuracao_cartao JSONB DEFAULT '{
  "habilitado": true,
  "operadora_principal": "Mercado Pago",
  "taxa_debito": 1.99,
  "taxa_credito_vista": 3.49,
  "permitir_parcelamento": true,
  "max_parcelas": 6,
  "taxa_por_parcela": 1.49,
  "valor_minimo_parcela": 25,
  "repassar_taxa_cliente": false,
  "dias_recebimento": "D+1",
  "observacoes_cartao": ""
}'::jsonb;
