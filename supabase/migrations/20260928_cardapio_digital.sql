-- ==============================================================================
-- SisEVS FitLife - Cardápio Digital Público & Criação de Pedidos Online
-- Permite leitura de catálogo por clientes anônimos e envio de pedidos no sistema EVS
-- ==============================================================================

-- 1. CONCEDER ACESSO DE LEITURA AO CATÁLOGO PARA CLIENTES (ANON & AUTHENTICATED)
GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT SELECT ON public.categorias_produtos TO anon, authenticated;
GRANT SELECT ON public.sabores TO anon, authenticated;
GRANT SELECT ON public.adicionais TO anon, authenticated;
GRANT SELECT ON public.produto_sabores TO anon, authenticated;
GRANT SELECT ON public.produto_adicionais TO anon, authenticated;
GRANT SELECT ON public.configuracoes_loja TO anon, authenticated;

-- Políticas de RLS para leitura pública do catálogo
DROP POLICY IF EXISTS "Anon: ler produtos ativos" ON public.produtos;
CREATE POLICY "Anon: ler produtos ativos" ON public.produtos
  FOR SELECT TO anon
  USING (ativo = true AND aparece_no_pedido = true);

DROP POLICY IF EXISTS "Anon: ler categorias ativas" ON public.categorias_produtos;
CREATE POLICY "Anon: ler categorias ativas" ON public.categorias_produtos
  FOR SELECT TO anon
  USING (ativo = true);

DROP POLICY IF EXISTS "Anon: ler sabores ativos" ON public.sabores;
CREATE POLICY "Anon: ler sabores ativos" ON public.sabores
  FOR SELECT TO anon
  USING (ativo = true);

DROP POLICY IF EXISTS "Anon: ler adicionais ativos" ON public.adicionais;
CREATE POLICY "Anon: ler adicionais ativos" ON public.adicionais
  FOR SELECT TO anon
  USING (ativo = true);

DROP POLICY IF EXISTS "Anon: ler produto_sabores" ON public.produto_sabores;
CREATE POLICY "Anon: ler produto_sabores" ON public.produto_sabores
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon: ler produto_adicionais" ON public.produto_adicionais;
CREATE POLICY "Anon: ler produto_adicionais" ON public.produto_adicionais
  FOR SELECT TO anon
  USING (true);

DROP POLICY IF EXISTS "Anon: ler configuracoes_loja" ON public.configuracoes_loja;
CREATE POLICY "Anon: ler configuracoes_loja" ON public.configuracoes_loja
  FOR SELECT TO anon
  USING (true);

-- 2. FUNÇÃO RPC PARA LANÇAR PEDIDOS DO CARDÁPIO DIGITAL NO SISTEMA EVS
-- Executa com SECURITY DEFINER para permitir que o cliente envie o pedido de forma atômica e segura.
CREATE OR REPLACE FUNCTION public.criar_pedido_cardapio(
  _cliente_nome text,
  _cliente_telefone text DEFAULT NULL,
  _tipo_entrega text DEFAULT 'local', -- 'local', 'balcao', 'delivery'
  _mesa text DEFAULT NULL,
  _endereco text DEFAULT NULL,
  _observacoes text DEFAULT NULL,
  _itens jsonb DEFAULT '[]'::jsonb
) RETURNS public.pedidos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _cid uuid := NULL;
  _tel_limpo text;
  _obs_comanda text := '';
  p public.pedidos;
  item_record record;
  pr public.produtos;
  _qtd numeric;
  _sabor text;
  _adicionais jsonb;
  _item_obs text;
  _rodada int := 1;
BEGIN
  -- 1. Higienização de dados do cliente
  _tel_limpo := NULLIF(regexp_replace(COALESCE(_cliente_telefone, ''), '\D', '', 'g'), '');
  _cliente_nome := COALESCE(NULLIF(TRIM(_cliente_nome), ''), 'Cliente Cardápio');

  -- 2. Identificar ou criar cliente no cadastro do EVS
  IF _tel_limpo IS NOT NULL THEN
    SELECT id INTO _cid FROM public.clientes WHERE telefone = _tel_limpo LIMIT 1;
    IF _cid IS NULL THEN
      INSERT INTO public.clientes (nome, telefone, observacoes, por_quem_veio)
      VALUES (_cliente_nome, _tel_limpo, 'Cadastrado via Cardápio Digital', 'Cardápio Digital')
      ON CONFLICT (telefone) DO UPDATE SET nome = EXCLUDED.nome
      RETURNING id INTO _cid;
    ELSE
      UPDATE public.clientes SET nome = _cliente_nome WHERE id = _cid;
    END IF;
  ELSE
    INSERT INTO public.clientes (nome, observacoes, por_quem_veio)
    VALUES (_cliente_nome, 'Pedido rápido via Cardápio Digital (sem telefone)', 'Cardápio Digital')
    RETURNING id INTO _cid;
  END IF;

  -- 3. Formatar observações do pedido com dados de entrega/mesa
  IF _tipo_entrega = 'local' THEN
    _obs_comanda := '[Consumo no Local' || CASE WHEN _mesa IS NOT NULL AND _mesa <> '' THEN ' - Mesa ' || _mesa ELSE '' END || '] ';
  ELSIF _tipo_entrega = 'delivery' THEN
    _obs_comanda := '[Entrega / Delivery' || CASE WHEN _endereco IS NOT NULL AND _endereco <> '' THEN ' - Endereço: ' || _endereco ELSE '' END || '] ';
  ELSE
    _obs_comanda := '[Retirada no Balcão] ';
  END IF;

  IF _observacoes IS NOT NULL AND TRIM(_observacoes) <> '' THEN
    _obs_comanda := _obs_comanda || TRIM(_observacoes);
  END IF;

  -- 4. Criar o pedido (comanda aberta) no sistema EVS
  INSERT INTO public.pedidos (
    cliente_id,
    usuario_id,
    tipo_registro,
    status_comanda,
    status_pedido,
    status_pagamento,
    aberta_em,
    data_hora,
    cliente_nome_rapido,
    cliente_telefone_rapido,
    observacoes
  ) VALUES (
    _cid,
    auth.uid(),
    'comanda',
    'em_consumo',
    'recebido',
    'pendente',
    now(),
    now(),
    _cliente_nome,
    _tel_limpo,
    _obs_comanda
  ) RETURNING * INTO p;

  -- 5. Inserir itens do pedido
  FOR item_record IN SELECT * FROM jsonb_to_recordset(_itens) AS x(
    produto_id uuid,
    quantidade numeric,
    sabor text,
    adicionais jsonb,
    observacoes text
  )
  LOOP
    SELECT * INTO pr FROM public.produtos WHERE id = item_record.produto_id;
    IF FOUND THEN
      _qtd := COALESCE(item_record.quantidade, 1);
      _sabor := NULLIF(TRIM(item_record.sabor), '');
      _adicionais := COALESCE(item_record.adicionais, '[]'::jsonb);
      _item_obs := NULLIF(TRIM(item_record.observacoes), '');

      INSERT INTO public.pedido_itens (
        pedido_id,
        produto_id,
        nome_produto,
        quantidade,
        preco_unitario,
        custo_unitario,
        sabor,
        adicionais,
        observacoes,
        status_preparo,
        envia_para_cozinha,
        enviado_cozinha_em,
        rodada
      ) VALUES (
        p.id,
        pr.id,
        pr.nome,
        _qtd,
        pr.preco,
        pr.custo,
        _sabor,
        _adicionais,
        _item_obs,
        'novo',
        pr.envia_para_cozinha,
        CASE WHEN pr.envia_para_cozinha THEN now() ELSE NULL END,
        _rodada
      );
    END IF;
  END LOOP;

  -- 6. Recalcular os totais do pedido
  PERFORM public.recalc_pedido_totais(p.id);

  -- 7. Registrar auditoria
  BEGIN
    PERFORM public.log_audit(
      'pedido_cardapio_digital',
      'pedido',
      p.id,
      'Novo pedido #' || p.numero || ' realizado pelo Cardápio Digital por ' || _cliente_nome,
      _obs_comanda,
      NULL
    );
  EXCEPTION WHEN OTHERS THEN
    -- Não aborta caso a tabela de auditoria tenha restrições
    NULL;
  END;

  -- 8. Retornar pedido atualizado
  SELECT * INTO p FROM public.pedidos WHERE id = p.id;
  RETURN p;
END;
$$;

-- Conceder permissão de execução da função para anon e autenticados
GRANT EXECUTE ON FUNCTION public.criar_pedido_cardapio(text, text, text, text, text, text, jsonb) TO anon, authenticated;
