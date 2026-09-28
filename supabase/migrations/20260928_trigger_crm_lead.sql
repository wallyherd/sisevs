-- ==============================================================================
-- SisEVS FitLife - Integração Automática de Novos Clientes no CRM
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.tg_cliente_novo_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quadro_id uuid;
  v_coluna_id uuid;
BEGIN
  -- Tentar encontrar o quadro principal (Funil)
  SELECT id INTO v_quadro_id FROM public.crm_quadros ORDER BY created_at ASC LIMIT 1;
  
  -- Se não existir quadro, não faz nada
  IF v_quadro_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Tentar encontrar a primeira coluna (ex: Lead / Novo Contato)
  SELECT id INTO v_coluna_id FROM public.crm_colunas 
  WHERE quadro_id = v_quadro_id 
  ORDER BY posicao ASC LIMIT 1;

  IF v_coluna_id IS NOT NULL THEN
    -- Inserir o novo cliente como um cartão no CRM
    INSERT INTO public.crm_cartoes (
      quadro_id,
      coluna_id,
      titulo,
      contato_nome,
      contato_telefone,
      cliente_id,
      origem,
      prioridade
    ) VALUES (
      v_quadro_id,
      v_coluna_id,
      NEW.nome,
      NEW.nome,
      NEW.telefone,
      NEW.id,
      COALESCE(NEW.por_quem_veio, 'Automático - Novo Cliente'),
      'normal'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Criar a trigger para ser acionada sempre que um cliente for inserido
DROP TRIGGER IF EXISTS trg_novo_cliente_crm ON public.clientes;
CREATE TRIGGER trg_novo_cliente_crm
AFTER INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.tg_cliente_novo_crm();
