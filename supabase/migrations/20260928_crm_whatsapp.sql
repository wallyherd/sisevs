-- ==============================================================================
-- SisEVS FitLife - Módulo CRM Kanban & WhatsApp Robot
-- Tabelas isoladas para não interferir na operação do PDV / Comandas / Estoque
-- ==============================================================================

-- 1. QUADROS DO CRM
CREATE TABLE IF NOT EXISTS public.crm_quadros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Funil de Vendas EVS',
  tipo text NOT NULL DEFAULT 'funil' CHECK (tipo IN ('funil', 'quadro')),
  descricao text,
  arquivado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. COLUNAS DO CRM (Etapas do Funil)
CREATE TABLE IF NOT EXISTS public.crm_colunas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quadro_id uuid NOT NULL REFERENCES public.crm_quadros(id) ON DELETE CASCADE,
  nome text NOT NULL,
  posicao integer NOT NULL DEFAULT 0,
  cor text DEFAULT '#059669',
  tipo text NOT NULL DEFAULT 'normal' CHECK (tipo IN ('normal', 'ganho', 'perdido')),
  limite_cartoes integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CARTÕES DO CRM (Leads e Clientes no Funil)
CREATE TABLE IF NOT EXISTS public.crm_cartoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quadro_id uuid NOT NULL REFERENCES public.crm_quadros(id) ON DELETE CASCADE,
  coluna_id uuid NOT NULL REFERENCES public.crm_colunas(id) ON DELETE CASCADE,
  posicao integer NOT NULL DEFAULT 0,
  titulo text NOT NULL,
  descricao text,
  contato_nome text,
  contato_telefone text,
  contato_email text,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  valor numeric(10,2) DEFAULT 0,
  origem text DEFAULT 'Manual',
  prioridade text NOT NULL DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
  tags text[] DEFAULT '{}',
  vence_em timestamptz,
  arquivado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. ATIVIDADES DO CARTÃO (Histórico de ações, notas e WhatsApp)
CREATE TABLE IF NOT EXISTS public.crm_atividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cartao_id uuid NOT NULL REFERENCES public.crm_cartoes(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'nota' CHECK (tipo IN ('mudanca_coluna', 'whatsapp', 'nota', 'tarefa', 'contato')),
  corpo text,
  de_coluna_id uuid,
  para_coluna_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. CONEXÕES WHATSAPP (Instâncias Baileys)
CREATE TABLE IF NOT EXISTS public.bot_conexoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'WhatsApp Principal EVS',
  provedor text NOT NULL DEFAULT 'baileys',
  numero text,
  status text NOT NULL DEFAULT 'desconectado' CHECK (status IN ('desconectado', 'aguardando_qr', 'conectado', 'erro')),
  status_detalhe text,
  webhook_segredo text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
  conectado_em timestamptz,
  visto_em timestamptz,
  arquivado_em timestamptz,
  prioridade integer NOT NULL DEFAULT 100,
  limite_diario integer DEFAULT 300,
  enviadas_hoje integer NOT NULL DEFAULT 0,
  contador_dia date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 6. CONVERSAS (WhatsApp Inbox)
CREATE TABLE IF NOT EXISTS public.bot_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conexao_id uuid REFERENCES public.bot_conexoes(id) ON DELETE CASCADE,
  telefone text NOT NULL,
  nome text,
  fluxo_id uuid,
  passo_atual_id uuid,
  estado text NOT NULL DEFAULT 'humano' CHECK (estado IN ('bot', 'humano', 'encerrada')),
  cartao_id uuid REFERENCES public.crm_cartoes(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  ultima_mensagem_em timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. MENSAGENS (WhatsApp)
CREATE TABLE IF NOT EXISTS public.bot_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversa_id uuid NOT NULL REFERENCES public.bot_conversas(id) ON DELETE CASCADE,
  direcao text NOT NULL CHECK (direcao IN ('entrada', 'saida')),
  tipo text NOT NULL DEFAULT 'texto' CHECK (tipo IN ('texto', 'imagem', 'audio', 'video', 'documento')),
  corpo text,
  status text NOT NULL DEFAULT 'enviada' CHECK (status IN ('pendente', 'entregue', 'enviada', 'lida', 'erro', 'recebida')),
  agendado_para timestamptz,
  enviado_em timestamptz DEFAULT now(),
  erro_motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. FLUXOS DO ROBÔ (Automação de Respostas e Cardápios)
CREATE TABLE IF NOT EXISTS public.bot_fluxos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  gatilho_tipo text NOT NULL DEFAULT 'primeira_mensagem' CHECK (gatilho_tipo IN ('primeira_mensagem', 'palavra_chave', 'sempre')),
  gatilho_valor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. PASSOS DO FLUXO
CREATE TABLE IF NOT EXISTS public.bot_passos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fluxo_id uuid NOT NULL REFERENCES public.bot_fluxos(id) ON DELETE CASCADE,
  chave text NOT NULL,
  tipo text NOT NULL DEFAULT 'mensagem' CHECK (tipo IN ('mensagem', 'pergunta', 'acao', 'transferir', 'encerrar')),
  conteudo text,
  posicao integer NOT NULL DEFAULT 0,
  proximo_passo_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. OPÇÕES DO PASSO (Menus numéricos / botões)
CREATE TABLE IF NOT EXISTS public.bot_opcoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passo_id uuid NOT NULL REFERENCES public.bot_passos(id) ON DELETE CASCADE,
  rotulo text NOT NULL,
  gatilho text NOT NULL,
  proximo_passo_id uuid,
  posicao integer NOT NULL DEFAULT 0
);

-- 11. DISPAROS EM MASSA (Campanhas WhatsApp)
CREATE TABLE IF NOT EXISTS public.bot_disparos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  mensagem text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'agendado', 'em_andamento', 'concluido', 'cancelado', 'erro')),
  intervalo_segundos integer NOT NULL DEFAULT 20,
  total_alvos integer NOT NULL DEFAULT 0,
  total_enviados integer NOT NULL DEFAULT 0,
  total_erros integer NOT NULL DEFAULT 0,
  iniciado_em timestamptz,
  concluido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. ALVOS DO DISPARO
CREATE TABLE IF NOT EXISTS public.bot_disparo_alvos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disparo_id uuid NOT NULL REFERENCES public.bot_disparos(id) ON DELETE CASCADE,
  telefone text NOT NULL,
  nome text,
  cartao_id uuid REFERENCES public.crm_cartoes(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'erro')),
  enviado_em timestamptz,
  erro_motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- HABILITAR RLS NAS TABELAS
ALTER TABLE public.crm_quadros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_colunas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_cartoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_atividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_conexoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_fluxos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_passos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_opcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_disparos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_disparo_alvos ENABLE ROW LEVEL SECURITY;

-- POLICIES: Acesso total para leitura e manipulação das tabelas do CRM
DO $$ 
BEGIN
  -- crm_quadros
  DROP POLICY IF EXISTS "crm_quadros_auth_all" ON public.crm_quadros;
  CREATE POLICY "crm_quadros_auth_all" ON public.crm_quadros FOR ALL USING (true) WITH CHECK (true);

  -- crm_colunas
  DROP POLICY IF EXISTS "crm_colunas_auth_all" ON public.crm_colunas;
  CREATE POLICY "crm_colunas_auth_all" ON public.crm_colunas FOR ALL USING (true) WITH CHECK (true);

  -- crm_cartoes
  DROP POLICY IF EXISTS "crm_cartoes_auth_all" ON public.crm_cartoes;
  CREATE POLICY "crm_cartoes_auth_all" ON public.crm_cartoes FOR ALL USING (true) WITH CHECK (true);

  -- crm_atividades
  DROP POLICY IF EXISTS "crm_atividades_auth_all" ON public.crm_atividades;
  CREATE POLICY "crm_atividades_auth_all" ON public.crm_atividades FOR ALL USING (true) WITH CHECK (true);

  -- bot_conexoes
  DROP POLICY IF EXISTS "bot_conexoes_auth_all" ON public.bot_conexoes;
  CREATE POLICY "bot_conexoes_auth_all" ON public.bot_conexoes FOR ALL USING (true) WITH CHECK (true);

  -- bot_conversas
  DROP POLICY IF EXISTS "bot_conversas_auth_all" ON public.bot_conversas;
  CREATE POLICY "bot_conversas_auth_all" ON public.bot_conversas FOR ALL USING (true) WITH CHECK (true);

  -- bot_mensagens
  DROP POLICY IF EXISTS "bot_mensagens_auth_all" ON public.bot_mensagens;
  CREATE POLICY "bot_mensagens_auth_all" ON public.bot_mensagens FOR ALL USING (true) WITH CHECK (true);

  -- bot_fluxos
  DROP POLICY IF EXISTS "bot_fluxos_auth_all" ON public.bot_fluxos;
  CREATE POLICY "bot_fluxos_auth_all" ON public.bot_fluxos FOR ALL USING (true) WITH CHECK (true);

  -- bot_passos
  DROP POLICY IF EXISTS "bot_passos_auth_all" ON public.bot_passos;
  CREATE POLICY "bot_passos_auth_all" ON public.bot_passos FOR ALL USING (true) WITH CHECK (true);

  -- bot_opcoes
  DROP POLICY IF EXISTS "bot_opcoes_auth_all" ON public.bot_opcoes;
  CREATE POLICY "bot_opcoes_auth_all" ON public.bot_opcoes FOR ALL USING (true) WITH CHECK (true);

  -- bot_disparos
  DROP POLICY IF EXISTS "bot_disparos_auth_all" ON public.bot_disparos;
  CREATE POLICY "bot_disparos_auth_all" ON public.bot_disparos FOR ALL USING (true) WITH CHECK (true);

  -- bot_disparo_alvos
  DROP POLICY IF EXISTS "bot_disparo_alvos_auth_all" ON public.bot_disparo_alvos;
  CREATE POLICY "bot_disparo_alvos_auth_all" ON public.bot_disparo_alvos FOR ALL USING (true) WITH CHECK (true);
END $$;

-- FUNIL PADRÃO INICIAL PARA O EVS (Se não existir nenhum)
DO $$
DECLARE
  v_quadro_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.crm_quadros LIMIT 1) THEN
    INSERT INTO public.crm_quadros (nome, tipo, descricao)
    VALUES ('Funil de Clientes & Leads EVS', 'funil', 'Acompanhamento de novos contatos, degustações e pós-venda')
    RETURNING id INTO v_quadro_id;

    INSERT INTO public.crm_colunas (quadro_id, nome, posicao, cor, tipo) VALUES
      (v_quadro_id, '1. Novo Contato / Lead', 1, '#3b82f6', 'normal'),
      (v_quadro_id, '2. Convite / Degustação', 2, '#d97706', 'normal'),
      (v_quadro_id, '3. Primeira Visita Feita', 3, '#8b5cf6', 'normal'),
      (v_quadro_id, '4. Cliente Ativo / Desafio', 4, '#059669', 'ganho'),
      (v_quadro_id, '5. Pós-Venda / Reativação', 5, '#ec4899', 'normal'),
      (v_quadro_id, 'Perdido / Sem Resposta', 6, '#64748b', 'perdido');
  END IF;
END $$;
