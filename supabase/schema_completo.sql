-- =========================================================
-- ESQUEMA CONSOLIDADO SUPABASE SisEVS
-- =========================================================

-- >>> MIGRATION: 20260623184033_6af3b5a4-1ec9-4af6-8070-d720721cdf90.sql <<<

-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.app_role AS ENUM ('admin','funcionario');
CREATE TYPE public.forma_pagamento AS ENUM ('pix','dinheiro','debito','credito');
CREATE TYPE public.status_pagamento AS ENUM ('pago','pendente','cancelado');
CREATE TYPE public.status_pedido AS ENUM ('em_preparo','pronto','entregue','cancelado');
CREATE TYPE public.tipo_mov_estoque AS ENUM ('entrada','saida','ajuste','perda','vencimento','uso_interno');
CREATE TYPE public.status_entrega_kit AS ENUM ('pendente','em_producao','entregue','cancelado');
CREATE TYPE public.tipo_financeiro AS ENUM ('entrada','saida');

-- =========================================================
-- UTILS: updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- USERS PROFILES
-- =========================================================
CREATE TABLE public.users_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  email TEXT,
  role public.app_role NOT NULL DEFAULT 'funcionario',
  pode_ver_financeiro BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users_profiles TO authenticated;
GRANT ALL ON public.users_profiles TO service_role;
ALTER TABLE public.users_profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_users_profiles_updated_at BEFORE UPDATE ON public.users_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.users_profiles WHERE user_id = _user_id AND role = _role AND ativo = true);
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin');
$$;

CREATE OR REPLACE FUNCTION public.pode_financeiro()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users_profiles
    WHERE user_id = auth.uid() AND ativo = true
      AND (role = 'admin' OR pode_ver_financeiro = true)
  );
$$;

-- RLS users_profiles
CREATE POLICY "Auth: ler perfis" ON public.users_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Self: atualizar próprio perfil" ON public.users_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND role = (SELECT role FROM public.users_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Admin: tudo em perfis" ON public.users_profiles FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Auto-criar perfil ao registrar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users_profiles (user_id, nome, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    CASE WHEN (SELECT COUNT(*) FROM public.users_profiles) = 0 THEN 'admin'::public.app_role ELSE 'funcionario'::public.app_role END
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- CLIENTES
-- =========================================================
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT UNIQUE,
  data_nascimento DATE,
  por_quem_veio TEXT,
  quem_indicou TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_clientes_updated_at BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "Auth: ler clientes" ON public.clientes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: inserir clientes" ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth: atualizar clientes" ON public.clientes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin: excluir clientes" ON public.clientes FOR DELETE TO authenticated USING (public.is_admin());

-- RPC upsert por telefone
CREATE OR REPLACE FUNCTION public.upsert_cliente(
  _nome TEXT,
  _telefone TEXT,
  _data_nascimento DATE DEFAULT NULL,
  _por_quem_veio TEXT DEFAULT NULL,
  _quem_indicou TEXT DEFAULT NULL,
  _observacoes TEXT DEFAULT NULL
) RETURNS public.clientes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.clientes;
BEGIN
  IF _telefone IS NULL OR _telefone = '' THEN
    INSERT INTO public.clientes(nome, telefone, data_nascimento, por_quem_veio, quem_indicou, observacoes)
    VALUES (_nome, NULL, _data_nascimento, _por_quem_veio, _quem_indicou, _observacoes)
    RETURNING * INTO c;
  ELSE
    INSERT INTO public.clientes(nome, telefone, data_nascimento, por_quem_veio, quem_indicou, observacoes)
    VALUES (_nome, _telefone, _data_nascimento, _por_quem_veio, _quem_indicou, _observacoes)
    ON CONFLICT (telefone) DO UPDATE SET
      nome = EXCLUDED.nome,
      data_nascimento = COALESCE(EXCLUDED.data_nascimento, public.clientes.data_nascimento),
      por_quem_veio = COALESCE(EXCLUDED.por_quem_veio, public.clientes.por_quem_veio),
      quem_indicou = COALESCE(EXCLUDED.quem_indicou, public.clientes.quem_indicou),
      observacoes = COALESCE(EXCLUDED.observacoes, public.clientes.observacoes),
      updated_at = now()
    RETURNING * INTO c;
  END IF;
  RETURN c;
END;
$$;
GRANT EXECUTE ON FUNCTION public.upsert_cliente(TEXT,TEXT,DATE,TEXT,TEXT,TEXT) TO authenticated;

-- =========================================================
-- CATEGORIAS, SABORES, ADICIONAIS
-- =========================================================
CREATE TABLE public.categorias_produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categorias_produtos TO authenticated;
GRANT ALL ON public.categorias_produtos TO service_role;
ALTER TABLE public.categorias_produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler categorias" ON public.categorias_produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar categorias" ON public.categorias_produtos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.sabores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sabores TO authenticated;
GRANT ALL ON public.sabores TO service_role;
ALTER TABLE public.sabores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler sabores" ON public.sabores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar sabores" ON public.sabores FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.adicionais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL UNIQUE,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.adicionais TO authenticated;
GRANT ALL ON public.adicionais TO service_role;
ALTER TABLE public.adicionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler adicionais" ON public.adicionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar adicionais" ON public.adicionais FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- PRODUTOS
-- =========================================================
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria_id UUID REFERENCES public.categorias_produtos(id) ON DELETE SET NULL,
  descricao TEXT,
  preco NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  lucro NUMERIC(10,2) GENERATED ALWAYS AS (preco - custo) STORED,
  controla_estoque BOOLEAN NOT NULL DEFAULT false,
  estoque_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
  aparece_no_pedido BOOLEAN NOT NULL DEFAULT true,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_produtos_updated_at BEFORE UPDATE ON public.produtos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Auth: ler produtos" ON public.produtos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar produtos" ON public.produtos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.produto_sabores (
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  sabor_id UUID NOT NULL REFERENCES public.sabores(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, sabor_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_sabores TO authenticated;
GRANT ALL ON public.produto_sabores TO service_role;
ALTER TABLE public.produto_sabores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler produto_sabores" ON public.produto_sabores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar produto_sabores" ON public.produto_sabores FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.produto_adicionais (
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  adicional_id UUID NOT NULL REFERENCES public.adicionais(id) ON DELETE CASCADE,
  PRIMARY KEY (produto_id, adicional_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_adicionais TO authenticated;
GRANT ALL ON public.produto_adicionais TO service_role;
ALTER TABLE public.produto_adicionais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler produto_adicionais" ON public.produto_adicionais FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar produto_adicionais" ON public.produto_adicionais FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- ESTOQUE
-- =========================================================
CREATE TABLE public.estoque_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT,
  quantidade_atual NUMERIC(12,3) NOT NULL DEFAULT 0,
  unidade_medida TEXT NOT NULL DEFAULT 'un',
  estoque_minimo NUMERIC(12,3) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  fornecedor TEXT,
  validade DATE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_itens TO authenticated;
GRANT ALL ON public.estoque_itens TO service_role;
ALTER TABLE public.estoque_itens ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_estoque_itens_updated_at BEFORE UPDATE ON public.estoque_itens FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Auth: ler estoque" ON public.estoque_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: atualizar estoque" ON public.estoque_itens FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin: inserir estoque" ON public.estoque_itens FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admin: excluir estoque" ON public.estoque_itens FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.estoque_movimentacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  tipo public.tipo_mov_estoque NOT NULL,
  quantidade NUMERIC(12,3) NOT NULL,
  custo_unitario NUMERIC(10,2),
  motivo TEXT,
  pedido_id UUID,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estoque_movimentacoes TO authenticated;
GRANT ALL ON public.estoque_movimentacoes TO service_role;
ALTER TABLE public.estoque_movimentacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler movs estoque" ON public.estoque_movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: inserir movs estoque" ON public.estoque_movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admin: gerenciar movs estoque" ON public.estoque_movimentacoes FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.produto_composicao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  estoque_item_id UUID NOT NULL REFERENCES public.estoque_itens(id) ON DELETE CASCADE,
  quantidade_por_unidade NUMERIC(12,3) NOT NULL DEFAULT 0,
  UNIQUE (produto_id, estoque_item_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.produto_composicao TO authenticated;
GRANT ALL ON public.produto_composicao TO service_role;
ALTER TABLE public.produto_composicao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler composicao" ON public.produto_composicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar composicao" ON public.produto_composicao FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- =========================================================
-- PEDIDOS
-- =========================================================
CREATE SEQUENCE IF NOT EXISTS public.pedidos_numero_seq START 1000;

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL DEFAULT nextval('public.pedidos_numero_seq') UNIQUE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  lucro_estimado NUMERIC(10,2) NOT NULL DEFAULT 0,
  forma_pagamento public.forma_pagamento,
  status_pagamento public.status_pagamento NOT NULL DEFAULT 'pendente',
  status_pedido public.status_pedido NOT NULL DEFAULT 'em_preparo',
  observacoes TEXT,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_pedidos_updated_at BEFORE UPDATE ON public.pedidos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Auth: ler pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: inserir pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth: atualizar pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin: excluir pedidos" ON public.pedidos FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id) ON DELETE SET NULL,
  nome_produto TEXT NOT NULL,
  quantidade NUMERIC(10,2) NOT NULL DEFAULT 1,
  preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  sabor TEXT,
  adicionais JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth: ler pedido_itens" ON public.pedido_itens FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: gerenciar pedido_itens" ON public.pedido_itens FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Recalcular totais do pedido a partir dos itens
CREATE OR REPLACE FUNCTION public.tg_pedido_item_calc_subtotal()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE add_total NUMERIC(10,2) := 0;
BEGIN
  IF NEW.adicionais IS NOT NULL THEN
    SELECT COALESCE(SUM((a->>'preco')::numeric), 0) INTO add_total
    FROM jsonb_array_elements(NEW.adicionais) a;
  END IF;
  NEW.subtotal := (NEW.preco_unitario + add_total) * NEW.quantidade;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pi_subtotal BEFORE INSERT OR UPDATE ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_item_calc_subtotal();

CREATE OR REPLACE FUNCTION public.recalc_pedido_totais(_pedido_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE _sub NUMERIC(10,2); _custo NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(subtotal),0), COALESCE(SUM(custo_unitario * quantidade),0)
    INTO _sub, _custo FROM public.pedido_itens WHERE pedido_id = _pedido_id;
  UPDATE public.pedidos
     SET subtotal = _sub, total = _sub, custo_total = _custo,
         lucro_estimado = _sub - _custo, updated_at = now()
   WHERE id = _pedido_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.tg_pedido_itens_recalc()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.recalc_pedido_totais(OLD.pedido_id);
    RETURN OLD;
  ELSE
    PERFORM public.recalc_pedido_totais(NEW.pedido_id);
    RETURN NEW;
  END IF;
END;
$$;
CREATE TRIGGER trg_pi_recalc_ai AFTER INSERT OR UPDATE OR DELETE ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_itens_recalc();

-- Baixa automática de estoque quando item de pedido inserido (via composicao)
CREATE OR REPLACE FUNCTION public.tg_pedido_item_baixa_estoque()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  IF NEW.produto_id IS NULL THEN RETURN NEW; END IF;
  FOR r IN SELECT pc.estoque_item_id, pc.quantidade_por_unidade
           FROM public.produto_composicao pc WHERE pc.produto_id = NEW.produto_id
  LOOP
    UPDATE public.estoque_itens
       SET quantidade_atual = quantidade_atual - (r.quantidade_por_unidade * NEW.quantidade)
     WHERE id = r.estoque_item_id;
    INSERT INTO public.estoque_movimentacoes(item_id, tipo, quantidade, motivo, pedido_id)
    VALUES (r.estoque_item_id, 'saida', r.quantidade_por_unidade * NEW.quantidade, 'Pedido #' || NEW.pedido_id, NEW.pedido_id);
  END LOOP;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pi_baixa_estoque AFTER INSERT ON public.pedido_itens
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_item_baixa_estoque();

-- =========================================================
-- FINANCEIRO
-- =========================================================
CREATE TABLE public.meu_slim_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome_cliente TEXT NOT NULL,
  telefone TEXT,
  tipo_kit TEXT NOT NULL,
  data_venda DATE NOT NULL DEFAULT CURRENT_DATE,
  data_prevista_entrega DATE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 0,
  custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  lucro NUMERIC(10,2) GENERATED ALWAYS AS (valor - custo) STORED,
  forma_pagamento public.forma_pagamento,
  status_pagamento public.status_pagamento NOT NULL DEFAULT 'pendente',
  status_entrega public.status_entrega_kit NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meu_slim_vendas TO authenticated;
GRANT ALL ON public.meu_slim_vendas TO service_role;
ALTER TABLE public.meu_slim_vendas ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_meu_slim_updated_at BEFORE UPDATE ON public.meu_slim_vendas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Auth: ler meu_slim" ON public.meu_slim_vendas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth: inserir meu_slim" ON public.meu_slim_vendas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth: atualizar meu_slim" ON public.meu_slim_vendas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin: excluir meu_slim" ON public.meu_slim_vendas FOR DELETE TO authenticated USING (public.is_admin());

CREATE TABLE public.financeiro_lancamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.tipo_financeiro NOT NULL,
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  forma_pagamento public.forma_pagamento,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  meu_slim_venda_id UUID REFERENCES public.meu_slim_vendas(id) ON DELETE CASCADE,
  observacoes TEXT,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financeiro_lancamentos TO authenticated;
GRANT ALL ON public.financeiro_lancamentos TO service_role;
ALTER TABLE public.financeiro_lancamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Financeiro: ler" ON public.financeiro_lancamentos FOR SELECT TO authenticated USING (public.pode_financeiro());
CREATE POLICY "Financeiro: inserir" ON public.financeiro_lancamentos FOR INSERT TO authenticated WITH CHECK (public.pode_financeiro());
CREATE POLICY "Admin: gerenciar financeiro" ON public.financeiro_lancamentos FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Gera/atualiza lançamento financeiro de pedido pago
CREATE OR REPLACE FUNCTION public.tg_pedido_financeiro()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status_pagamento = 'pago' AND NEW.status_pedido <> 'cancelado' THEN
    IF NOT EXISTS (SELECT 1 FROM public.financeiro_lancamentos WHERE pedido_id = NEW.id) THEN
      INSERT INTO public.financeiro_lancamentos(tipo, categoria, descricao, valor, forma_pagamento, data, pedido_id, usuario_id)
      VALUES ('entrada','Venda - Pedido','Pedido #' || NEW.numero, NEW.total, NEW.forma_pagamento, NEW.data_hora::date, NEW.id, NEW.usuario_id);
    ELSE
      UPDATE public.financeiro_lancamentos
         SET valor = NEW.total, forma_pagamento = NEW.forma_pagamento
       WHERE pedido_id = NEW.id;
    END IF;
  ELSIF NEW.status_pedido = 'cancelado' OR NEW.status_pagamento = 'cancelado' THEN
    DELETE FROM public.financeiro_lancamentos WHERE pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pedido_financeiro AFTER INSERT OR UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_financeiro();

-- Reverter estoque ao cancelar pedido
CREATE OR REPLACE FUNCTION public.tg_pedido_cancelado_reverte_estoque()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD;
BEGIN
  IF NEW.status_pedido = 'cancelado' AND OLD.status_pedido <> 'cancelado' THEN
    FOR r IN SELECT pi.produto_id, pi.quantidade
             FROM public.pedido_itens pi WHERE pi.pedido_id = NEW.id
    LOOP
      IF r.produto_id IS NOT NULL THEN
        UPDATE public.estoque_itens ei
           SET quantidade_atual = ei.quantidade_atual + (pc.quantidade_por_unidade * r.quantidade)
          FROM public.produto_composicao pc
         WHERE pc.produto_id = r.produto_id AND pc.estoque_item_id = ei.id;
        INSERT INTO public.estoque_movimentacoes(item_id, tipo, quantidade, motivo, pedido_id)
        SELECT pc.estoque_item_id, 'entrada', pc.quantidade_por_unidade * r.quantidade,
               'Reversão pedido cancelado #' || NEW.numero, NEW.id
          FROM public.produto_composicao pc WHERE pc.produto_id = r.produto_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_pedido_cancel_reverte AFTER UPDATE OF status_pedido ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_cancelado_reverte_estoque();

-- Financeiro automático Meu Slim
CREATE OR REPLACE FUNCTION public.tg_meu_slim_financeiro()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status_pagamento = 'pago' THEN
    IF NOT EXISTS (SELECT 1 FROM public.financeiro_lancamentos WHERE meu_slim_venda_id = NEW.id) THEN
      INSERT INTO public.financeiro_lancamentos(tipo, categoria, descricao, valor, forma_pagamento, data, meu_slim_venda_id, usuario_id)
      VALUES ('entrada','Venda - Meu Slim', NEW.tipo_kit || ' - ' || NEW.nome_cliente, NEW.valor, NEW.forma_pagamento, NEW.data_venda, NEW.id, NEW.usuario_id);
    ELSE
      UPDATE public.financeiro_lancamentos SET valor = NEW.valor, forma_pagamento = NEW.forma_pagamento WHERE meu_slim_venda_id = NEW.id;
    END IF;
  ELSIF NEW.status_pagamento = 'cancelado' THEN
    DELETE FROM public.financeiro_lancamentos WHERE meu_slim_venda_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_meu_slim_financeiro AFTER INSERT OR UPDATE ON public.meu_slim_vendas
FOR EACH ROW EXECUTE FUNCTION public.tg_meu_slim_financeiro();

-- =========================================================
-- CONFIGURACOES LOJA
-- =========================================================
CREATE TABLE public.configuracoes_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_loja TEXT NOT NULL DEFAULT 'FitLife',
  logo_url TEXT,
  cnpj TEXT,
  endereco TEXT,
  telefone TEXT,
  estoque_minimo_padrao NUMERIC(10,2) NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.configuracoes_loja TO authenticated;
GRANT ALL ON public.configuracoes_loja TO service_role;
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_config_updated_at BEFORE UPDATE ON public.configuracoes_loja FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE POLICY "Auth: ler config" ON public.configuracoes_loja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin: gerenciar config" ON public.configuracoes_loja FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

INSERT INTO public.configuracoes_loja (nome_loja) VALUES ('FitLife');

-- =========================================================
-- VIEWS
-- =========================================================
CREATE OR REPLACE VIEW public.vw_produtos_mais_vendidos AS
SELECT pi.produto_id, pi.nome_produto,
       SUM(pi.quantidade)::numeric AS qtd_vendida,
       SUM(pi.subtotal)::numeric AS total_vendido
FROM public.pedido_itens pi
JOIN public.pedidos p ON p.id = pi.pedido_id
WHERE p.status_pedido <> 'cancelado'
GROUP BY pi.produto_id, pi.nome_produto
ORDER BY qtd_vendida DESC;

CREATE OR REPLACE VIEW public.vw_clientes_top AS
SELECT c.id, c.nome, c.telefone,
       COUNT(p.id) AS qtd_pedidos,
       COALESCE(SUM(p.total),0) AS total_gasto,
       MAX(p.data_hora) AS ultima_compra
FROM public.clientes c
LEFT JOIN public.pedidos p ON p.cliente_id = c.id AND p.status_pedido <> 'cancelado'
GROUP BY c.id
ORDER BY total_gasto DESC;

CREATE OR REPLACE VIEW public.vw_estoque_alertas AS
SELECT ei.*,
  CASE
    WHEN ei.validade IS NOT NULL AND ei.validade < CURRENT_DATE THEN 'vencido'
    WHEN ei.quantidade_atual <= 0 THEN 'em_falta'
    WHEN ei.validade IS NOT NULL AND ei.validade <= CURRENT_DATE + INTERVAL '7 days' THEN 'proximo_vencimento'
    WHEN ei.quantidade_atual <= ei.estoque_minimo THEN 'abaixo_minimo'
    ELSE 'ok'
  END AS alerta
FROM public.estoque_itens ei
WHERE ei.ativo = true;

CREATE OR REPLACE VIEW public.vw_clientes_inativos_30dias AS
SELECT c.id, c.nome, c.telefone, MAX(p.data_hora) AS ultima_compra
FROM public.clientes c
LEFT JOIN public.pedidos p ON p.cliente_id = c.id AND p.status_pedido <> 'cancelado'
GROUP BY c.id
HAVING MAX(p.data_hora) IS NULL OR MAX(p.data_hora) < now() - INTERVAL '30 days';

GRANT SELECT ON public.vw_produtos_mais_vendidos TO authenticated;
GRANT SELECT ON public.vw_clientes_top TO authenticated;
GRANT SELECT ON public.vw_estoque_alertas TO authenticated;
GRANT SELECT ON public.vw_clientes_inativos_30dias TO authenticated;

-- Realtime para cozinha
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_itens;


-- >>> MIGRATION: 20260623184051_db64ef79-616a-4d31-86b9-513cf1bd3186.sql <<<

ALTER VIEW public.vw_produtos_mais_vendidos SET (security_invoker = on);
ALTER VIEW public.vw_clientes_top SET (security_invoker = on);
ALTER VIEW public.vw_estoque_alertas SET (security_invoker = on);
ALTER VIEW public.vw_clientes_inativos_30dias SET (security_invoker = on);


-- >>> MIGRATION: 20260623190146_492b8514-fe28-4724-90c5-b4712fe32d09.sql <<<

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER TABLE public.pedido_itens REPLICA IDENTITY FULL;
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.pedido_itens; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;


-- >>> MIGRATION: 20260623191915_d03a82dd-b926-4404-b6cf-1e2bf6a3457d.sql <<<

ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'recebido' BEFORE 'em_preparo';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'na_cozinha' BEFORE 'pronto';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'em_producao' BEFORE 'pronto';
ALTER TYPE public.status_pedido ADD VALUE IF NOT EXISTS 'em_entrega' BEFORE 'entregue';


-- >>> MIGRATION: 20260623191950_30888b5a-8fb9-411e-93c3-471d7ecbb15b.sql <<<

-- Default: pedido entra no sistema como 'recebido'
ALTER TABLE public.pedidos ALTER COLUMN status_pedido SET DEFAULT 'recebido'::public.status_pedido;

-- Atualiza gatilho financeiro: só lança quando pedido foi entregue e está pago
CREATE OR REPLACE FUNCTION public.tg_pedido_financeiro()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status_pagamento = 'pago' AND NEW.status_pedido = 'entregue' THEN
    IF NOT EXISTS (SELECT 1 FROM public.financeiro_lancamentos WHERE pedido_id = NEW.id) THEN
      INSERT INTO public.financeiro_lancamentos(tipo, categoria, descricao, valor, forma_pagamento, data, pedido_id, usuario_id)
      VALUES ('entrada','Venda - Pedido','Pedido #' || NEW.numero, NEW.total, NEW.forma_pagamento, NEW.data_hora::date, NEW.id, NEW.usuario_id);
    ELSE
      UPDATE public.financeiro_lancamentos
         SET valor = NEW.total, forma_pagamento = NEW.forma_pagamento
       WHERE pedido_id = NEW.id;
    END IF;
  ELSIF NEW.status_pedido = 'cancelado' OR NEW.status_pagamento = 'cancelado' THEN
    DELETE FROM public.financeiro_lancamentos WHERE pedido_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;


-- >>> MIGRATION: 20260629205043_01dbda2e-3653-49f7-b8c1-e7af82c6fd32.sql <<<

-- 1) Garantir que NÃO existe trigger de baixa automática ao inserir item de pedido.
-- (A função existe, mas se algum dia for atrelada, garantimos remoção do trigger.)
DROP TRIGGER IF EXISTS tg_pedido_item_baixa_estoque ON public.pedido_itens;

-- 2) Pedidos: novos campos de controle de baixa, pagamento e cancelamento
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS estoque_baixado BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS estoque_baixado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pago_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS baixado_por UUID,
  ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS valor_recebido NUMERIC(10,2);

-- 3) Financeiro: rastreabilidade e estornos
ALTER TABLE public.financeiro_lancamentos
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ativo',
  ADD COLUMN IF NOT EXISTS referencia_tipo TEXT,
  ADD COLUMN IF NOT EXISTS referencia_id UUID,
  ADD COLUMN IF NOT EXISTS estorno_de UUID REFERENCES public.financeiro_lancamentos(id);

-- 4) Movimentações de estoque: motivo descritivo
ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS tipo_movimentacao TEXT;

-- 5) Recriar trigger financeiro: paga = entra no financeiro (não exige "entregue")
CREATE OR REPLACE FUNCTION public.tg_pedido_financeiro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status_pagamento = 'pago' AND COALESCE(OLD.status_pagamento,'pendente') <> 'pago' THEN
    IF NOT EXISTS (SELECT 1 FROM public.financeiro_lancamentos WHERE pedido_id = NEW.id AND status='ativo') THEN
      INSERT INTO public.financeiro_lancamentos(tipo, categoria, descricao, valor, forma_pagamento, data, pedido_id, usuario_id, status, referencia_tipo, referencia_id)
      VALUES ('entrada','Venda FitLife','Pedido #' || NEW.numero, NEW.total, NEW.forma_pagamento, COALESCE(NEW.pago_em, now())::date, NEW.id, COALESCE(NEW.baixado_por, NEW.usuario_id), 'ativo','pedido', NEW.id);
    END IF;
  ELSIF (NEW.status_pedido = 'cancelado' OR NEW.status_pagamento = 'cancelado')
        AND (COALESCE(OLD.status_pedido,'') <> 'cancelado' AND COALESCE(OLD.status_pagamento,'') <> 'cancelado') THEN
    UPDATE public.financeiro_lancamentos SET status='estornado' WHERE pedido_id = NEW.id AND status='ativo';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS tg_pedidos_financeiro ON public.pedidos;
CREATE TRIGGER tg_pedidos_financeiro
AFTER UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.tg_pedido_financeiro();

-- 6) Função: confirmar pagamento (baixa financeiro + estoque, idempotente)
CREATE OR REPLACE FUNCTION public.confirmar_pagamento_pedido(
  _pedido_id UUID,
  _forma_pagamento forma_pagamento,
  _valor_recebido NUMERIC DEFAULT NULL,
  _observacoes TEXT DEFAULT NULL
) RETURNS public.pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p public.pedidos;
  r RECORD;
  _uid UUID := auth.uid();
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p.status_pedido = 'cancelado' THEN RAISE EXCEPTION 'Pedido cancelado'; END IF;
  IF p.status_pagamento = 'pago' THEN
    RETURN p; -- idempotente
  END IF;

  UPDATE public.pedidos
     SET status_pagamento = 'pago',
         forma_pagamento = _forma_pagamento,
         pago_em = now(),
         baixado_por = _uid,
         valor_recebido = COALESCE(_valor_recebido, total),
         observacoes = COALESCE(NULLIF(_observacoes,''), observacoes)
   WHERE id = _pedido_id
   RETURNING * INTO p;

  -- Baixa de estoque por composição (apenas se ainda não baixado)
  IF NOT p.estoque_baixado THEN
    FOR r IN
      SELECT pc.estoque_item_id, SUM(pc.quantidade_por_unidade * pi.quantidade) AS qtd
        FROM public.pedido_itens pi
        JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
       WHERE pi.pedido_id = _pedido_id
       GROUP BY pc.estoque_item_id
    LOOP
      UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual - r.qtd WHERE id = r.estoque_item_id;
      INSERT INTO public.estoque_movimentacoes(item_id, tipo, tipo_movimentacao, quantidade, motivo, pedido_id, usuario_id)
      VALUES (r.estoque_item_id, 'saida','venda', r.qtd, 'Baixa por pedido #' || p.numero, p.id, _uid);
    END LOOP;
    UPDATE public.pedidos SET estoque_baixado = true, estoque_baixado_em = now() WHERE id = _pedido_id RETURNING * INTO p;
  END IF;

  RETURN p;
END;
$$;

-- 7) Função: cancelar pedido (devolve estoque + estorna financeiro)
CREATE OR REPLACE FUNCTION public.cancelar_pedido(
  _pedido_id UUID,
  _motivo TEXT DEFAULT NULL
) RETURNS public.pedidos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p public.pedidos;
  r RECORD;
  _uid UUID := auth.uid();
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p.status_pedido = 'cancelado' THEN RETURN p; END IF;

  -- Devolve estoque se houve baixa
  IF p.estoque_baixado THEN
    FOR r IN
      SELECT pc.estoque_item_id, SUM(pc.quantidade_por_unidade * pi.quantidade) AS qtd
        FROM public.pedido_itens pi
        JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
       WHERE pi.pedido_id = _pedido_id
       GROUP BY pc.estoque_item_id
    LOOP
      UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual + r.qtd WHERE id = r.estoque_item_id;
      INSERT INTO public.estoque_movimentacoes(item_id, tipo, tipo_movimentacao, quantidade, motivo, pedido_id, usuario_id)
      VALUES (r.estoque_item_id, 'entrada','devolucao', r.qtd, 'Devolução por cancelamento do pedido #' || p.numero, p.id, _uid);
    END LOOP;
  END IF;

  UPDATE public.pedidos
     SET status_pedido = 'cancelado',
         status_pagamento = CASE WHEN status_pagamento='pago' THEN 'cancelado'::status_pagamento ELSE status_pagamento END,
         cancelado_em = now(),
         motivo_cancelamento = _motivo,
         estoque_baixado = false
   WHERE id = _pedido_id
   RETURNING * INTO p;

  RETURN p;
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirmar_pagamento_pedido(UUID, forma_pagamento, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_pedido(UUID, TEXT) TO authenticated;

-- 8) Despesas: cadastro manual entra direto via financeiro_lancamentos (tipo='saida').
-- Garantir índices úteis
CREATE INDEX IF NOT EXISTS idx_fin_data ON public.financeiro_lancamentos(data DESC);
CREATE INDEX IF NOT EXISTS idx_fin_tipo_status ON public.financeiro_lancamentos(tipo, status);
CREATE INDEX IF NOT EXISTS idx_pedidos_status_pag ON public.pedidos(status_pagamento);
CREATE INDEX IF NOT EXISTS idx_pedidos_data ON public.pedidos(data_hora DESC);
CREATE INDEX IF NOT EXISTS idx_estoque_mov_item ON public.estoque_movimentacoes(item_id, created_at DESC);


-- >>> MIGRATION: 20260629212740_6cff6b5b-6662-475d-a2a3-a8a5bb58eebe.sql <<<

-- ========== PRODUTOS ==========
ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS envia_para_cozinha boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS produto_fechado boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permite_sabor boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permite_adicionais boolean NOT NULL DEFAULT false;

-- Backfill permite_sabor / permite_adicionais a partir das tabelas de vínculo existentes
UPDATE public.produtos p SET permite_sabor = true
  WHERE EXISTS (SELECT 1 FROM public.produto_sabores ps WHERE ps.produto_id = p.id);
UPDATE public.produtos p SET permite_adicionais = true
  WHERE EXISTS (SELECT 1 FROM public.produto_adicionais pa WHERE pa.produto_id = p.id);

-- ========== PEDIDOS / COMANDAS ==========
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS tipo_registro text NOT NULL DEFAULT 'comanda',
  ADD COLUMN IF NOT EXISTS status_comanda text NOT NULL DEFAULT 'aberta',
  ADD COLUMN IF NOT EXISTS aberta_em timestamptz,
  ADD COLUMN IF NOT EXISTS fechada_em timestamptz,
  ADD COLUMN IF NOT EXISTS cliente_nome_rapido text,
  ADD COLUMN IF NOT EXISTS cliente_telefone_rapido text,
  ADD COLUMN IF NOT EXISTS troco numeric(10,2);

-- Backfill: linhas antigas
UPDATE public.pedidos SET aberta_em = COALESCE(aberta_em, data_hora);
UPDATE public.pedidos
   SET status_comanda = CASE
     WHEN status_pagamento = 'pago' THEN 'paga'
     WHEN status_pedido = 'cancelado' THEN 'cancelada'
     ELSE 'aberta'
   END
 WHERE status_comanda = 'aberta';
UPDATE public.pedidos SET fechada_em = pago_em WHERE fechada_em IS NULL AND pago_em IS NOT NULL;

-- ========== PEDIDO_ITENS ==========
ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS status_preparo text NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS envia_para_cozinha boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enviado_cozinha_em timestamptz,
  ADD COLUMN IF NOT EXISTS preparo_iniciado_em timestamptz,
  ADD COLUMN IF NOT EXISTS pronto_em timestamptz,
  ADD COLUMN IF NOT EXISTS entregue_em timestamptz,
  ADD COLUMN IF NOT EXISTS cancelado_em timestamptz,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento text,
  ADD COLUMN IF NOT EXISTS observacoes_cozinha text,
  ADD COLUMN IF NOT EXISTS rodada int NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_pi_status_preparo ON public.pedido_itens(status_preparo);
CREATE INDEX IF NOT EXISTS idx_pedidos_status_comanda ON public.pedidos(status_comanda);

-- Remover trigger antigo de baixa de estoque ao inserir item — baixa só no pagamento
DROP TRIGGER IF EXISTS trg_pi_baixa_estoque ON public.pedido_itens;

-- ========== RPC: abrir_comanda ==========
CREATE OR REPLACE FUNCTION public.abrir_comanda(
  _cliente_id uuid DEFAULT NULL,
  _cliente_nome text DEFAULT NULL,
  _cliente_telefone text DEFAULT NULL,
  _observacoes text DEFAULT NULL
) RETURNS public.pedidos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.pedidos;
BEGIN
  INSERT INTO public.pedidos(
    cliente_id, usuario_id, tipo_registro, status_comanda, status_pedido,
    status_pagamento, aberta_em, data_hora,
    cliente_nome_rapido, cliente_telefone_rapido, observacoes
  ) VALUES (
    _cliente_id, auth.uid(), 'comanda', 'aberta', 'recebido',
    'pendente', now(), now(),
    NULLIF(_cliente_nome,''), NULLIF(_cliente_telefone,''), NULLIF(_observacoes,'')
  ) RETURNING * INTO p;
  RETURN p;
END;
$$;

-- ========== RPC: adicionar_item_comanda ==========
CREATE OR REPLACE FUNCTION public.adicionar_item_comanda(
  _pedido_id uuid,
  _produto_id uuid,
  _quantidade numeric DEFAULT 1,
  _sabor text DEFAULT NULL,
  _adicionais jsonb DEFAULT '[]'::jsonb,
  _observacoes text DEFAULT NULL
) RETURNS public.pedido_itens
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  pr public.produtos;
  ped public.pedidos;
  it public.pedido_itens;
  _rodada int;
BEGIN
  SELECT * INTO ped FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF ped.status_comanda IN ('paga','cancelada') THEN
    RAISE EXCEPTION 'Comanda já fechada (%) — não é possível adicionar itens', ped.status_comanda;
  END IF;

  SELECT * INTO pr FROM public.produtos WHERE id = _produto_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  SELECT COALESCE(MAX(rodada),0) + 1 INTO _rodada
    FROM public.pedido_itens WHERE pedido_id = _pedido_id;

  INSERT INTO public.pedido_itens(
    pedido_id, produto_id, nome_produto, quantidade, preco_unitario, custo_unitario,
    sabor, adicionais, observacoes,
    status_preparo, envia_para_cozinha, enviado_cozinha_em, rodada
  ) VALUES (
    _pedido_id, _produto_id, pr.nome, _quantidade, pr.preco, pr.custo,
    NULLIF(_sabor,''), COALESCE(_adicionais,'[]'::jsonb), NULLIF(_observacoes,''),
    'novo', pr.envia_para_cozinha,
    CASE WHEN pr.envia_para_cozinha THEN now() ELSE NULL END,
    _rodada
  ) RETURNING * INTO it;

  -- Marca comanda como "em_consumo" assim que recebe o primeiro item
  IF ped.status_comanda = 'aberta' THEN
    UPDATE public.pedidos SET status_comanda = 'em_consumo' WHERE id = _pedido_id;
  END IF;

  RETURN it;
END;
$$;

-- ========== RPC: cancelar_item_comanda ==========
CREATE OR REPLACE FUNCTION public.cancelar_item_comanda(
  _item_id uuid,
  _motivo text DEFAULT NULL
) RETURNS public.pedido_itens
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it public.pedido_itens; ped public.pedidos;
BEGIN
  SELECT * INTO it FROM public.pedido_itens WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  SELECT * INTO ped FROM public.pedidos WHERE id = it.pedido_id;
  IF ped.status_comanda IN ('paga','cancelada') THEN
    RAISE EXCEPTION 'Comanda já fechada — não é possível alterar itens';
  END IF;

  IF it.status_preparo = 'novo' THEN
    -- Pode remover sem fricção
    DELETE FROM public.pedido_itens WHERE id = _item_id;
    it.status_preparo := 'cancelado';
    RETURN it;
  ELSE
    IF _motivo IS NULL OR _motivo = '' THEN
      RAISE EXCEPTION 'Motivo obrigatório para cancelar item já em preparo';
    END IF;
    UPDATE public.pedido_itens
       SET status_preparo = 'cancelado',
           cancelado_em = now(),
           motivo_cancelamento = _motivo
     WHERE id = _item_id
     RETURNING * INTO it;
    -- Recalcula totais (sem o item cancelado)
    PERFORM public.recalc_pedido_totais(it.pedido_id);
    RETURN it;
  END IF;
END;
$$;

-- Ajusta recalc para ignorar itens cancelados
CREATE OR REPLACE FUNCTION public.recalc_pedido_totais(_pedido_id uuid)
 RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE _sub NUMERIC(10,2); _custo NUMERIC(10,2); _desc NUMERIC(10,2);
BEGIN
  SELECT COALESCE(SUM(subtotal),0), COALESCE(SUM(custo_unitario * quantidade),0)
    INTO _sub, _custo
    FROM public.pedido_itens
   WHERE pedido_id = _pedido_id AND status_preparo <> 'cancelado';
  SELECT COALESCE(desconto,0) INTO _desc FROM public.pedidos WHERE id = _pedido_id;
  UPDATE public.pedidos
     SET subtotal = _sub,
         total = GREATEST(_sub - COALESCE(_desc,0), 0),
         custo_total = _custo,
         lucro_estimado = GREATEST(_sub - COALESCE(_desc,0),0) - _custo,
         updated_at = now()
   WHERE id = _pedido_id;
END;
$$;

-- ========== RPC: fechar_comanda ==========
CREATE OR REPLACE FUNCTION public.fechar_comanda(
  _pedido_id uuid,
  _forma_pagamento forma_pagamento,
  _valor_recebido numeric DEFAULT NULL,
  _desconto numeric DEFAULT 0,
  _observacoes text DEFAULT NULL
) RETURNS public.pedidos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.pedidos;
  r RECORD;
  _uid uuid := auth.uid();
  _troco numeric;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda = 'paga' THEN RETURN p; END IF;
  IF p.status_comanda = 'cancelada' THEN RAISE EXCEPTION 'Comanda cancelada'; END IF;

  -- Aplica desconto e recalcula totais
  UPDATE public.pedidos SET desconto = COALESCE(_desconto,0) WHERE id = _pedido_id;
  PERFORM public.recalc_pedido_totais(_pedido_id);
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id;

  _troco := CASE WHEN _valor_recebido IS NOT NULL AND _valor_recebido > p.total
                 THEN _valor_recebido - p.total ELSE 0 END;

  UPDATE public.pedidos
     SET status_pagamento = 'pago',
         status_comanda = 'paga',
         status_pedido = 'entregue',
         forma_pagamento = _forma_pagamento,
         pago_em = now(),
         fechada_em = now(),
         baixado_por = _uid,
         valor_recebido = COALESCE(_valor_recebido, total),
         troco = _troco,
         observacoes = COALESCE(NULLIF(_observacoes,''), observacoes)
   WHERE id = _pedido_id
   RETURNING * INTO p;

  -- Baixa de estoque por composição (apenas itens não cancelados)
  IF NOT p.estoque_baixado THEN
    FOR r IN
      SELECT pc.estoque_item_id, SUM(pc.quantidade_por_unidade * pi.quantidade) AS qtd
        FROM public.pedido_itens pi
        JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
       WHERE pi.pedido_id = _pedido_id AND pi.status_preparo <> 'cancelado'
       GROUP BY pc.estoque_item_id
    LOOP
      UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual - r.qtd WHERE id = r.estoque_item_id;
      INSERT INTO public.estoque_movimentacoes(item_id, tipo, tipo_movimentacao, quantidade, motivo, pedido_id, usuario_id)
      VALUES (r.estoque_item_id, 'saida','venda', r.qtd, 'Baixa por comanda #' || p.numero, p.id, _uid);
    END LOOP;
    UPDATE public.pedidos SET estoque_baixado = true, estoque_baixado_em = now() WHERE id = _pedido_id RETURNING * INTO p;
  END IF;

  RETURN p;
END;
$$;

-- ========== RPC: avancar_item_preparo ==========
CREATE OR REPLACE FUNCTION public.avancar_item_preparo(_item_id uuid, _novo_status text)
RETURNS public.pedido_itens
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it public.pedido_itens;
BEGIN
  IF _novo_status NOT IN ('em_preparo','pronto','entregue') THEN
    RAISE EXCEPTION 'Status inválido: %', _novo_status;
  END IF;
  UPDATE public.pedido_itens
     SET status_preparo = _novo_status,
         preparo_iniciado_em = CASE WHEN _novo_status = 'em_preparo' AND preparo_iniciado_em IS NULL THEN now() ELSE preparo_iniciado_em END,
         pronto_em = CASE WHEN _novo_status = 'pronto' AND pronto_em IS NULL THEN now() ELSE pronto_em END,
         entregue_em = CASE WHEN _novo_status = 'entregue' AND entregue_em IS NULL THEN now() ELSE entregue_em END
   WHERE id = _item_id
   RETURNING * INTO it;
  RETURN it;
END;
$$;

GRANT EXECUTE ON FUNCTION public.abrir_comanda(uuid,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.adicionar_item_comanda(uuid,uuid,numeric,text,jsonb,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancelar_item_comanda(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fechar_comanda(uuid,forma_pagamento,numeric,numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.avancar_item_preparo(uuid,text) TO authenticated;


-- >>> MIGRATION: 20260629214341_d6aa8c02-6d12-4a20-badd-ebd9c7ebbe23.sql <<<

-- 1) Corrige trigger financeiro: tratar INSERT (OLD null) sem cast vazio em enum
CREATE OR REPLACE FUNCTION public.tg_pedido_financeiro()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Pagamento confirmado: cria lançamento se ainda não houver
  IF NEW.status_pagamento = 'pago'
     AND (TG_OP = 'INSERT' OR OLD.status_pagamento IS DISTINCT FROM 'pago') THEN
    IF NOT EXISTS (SELECT 1 FROM public.financeiro_lancamentos
                   WHERE pedido_id = NEW.id AND status='ativo') THEN
      INSERT INTO public.financeiro_lancamentos(
        tipo, categoria, descricao, valor, forma_pagamento, data,
        pedido_id, usuario_id, status, referencia_tipo, referencia_id
      ) VALUES (
        'entrada','Venda FitLife','Pedido #' || NEW.numero,
        NEW.total, NEW.forma_pagamento,
        COALESCE(NEW.pago_em, now())::date,
        NEW.id, COALESCE(NEW.baixado_por, NEW.usuario_id),
        'ativo','pedido', NEW.id
      );
    END IF;
  -- Cancelamento: estorna lançamentos ativos
  ELSIF TG_OP = 'UPDATE'
        AND (NEW.status_pedido = 'cancelado' OR NEW.status_pagamento = 'cancelado')
        AND (OLD.status_pedido IS DISTINCT FROM 'cancelado'
             AND OLD.status_pagamento IS DISTINCT FROM 'cancelado') THEN
    UPDATE public.financeiro_lancamentos SET status='estornado'
     WHERE pedido_id = NEW.id AND status='ativo';
  END IF;
  RETURN NEW;
END $$;

-- 2) Novo valor de enum
ALTER TYPE public.status_pagamento ADD VALUE IF NOT EXISTS 'parcial';

-- 3) Colunas extras em pedidos / financeiro
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS valor_pago numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_pendente numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS caixa_id uuid;

ALTER TABLE public.financeiro_lancamentos
  ADD COLUMN IF NOT EXISTS caixa_id uuid,
  ADD COLUMN IF NOT EXISTS data_lancamento timestamptz NOT NULL DEFAULT now();

-- 4) Tabela pedido_pagamentos
CREATE TABLE IF NOT EXISTS public.pedido_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  forma_pagamento forma_pagamento NOT NULL,
  valor numeric(10,2) NOT NULL CHECK (valor > 0),
  valor_recebido numeric(10,2),
  troco numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'confirmado', -- confirmado | estornado
  observacoes text,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  caixa_id uuid,
  financeiro_lancamento_id uuid REFERENCES public.financeiro_lancamentos(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pp_pedido ON public.pedido_pagamentos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pp_caixa ON public.pedido_pagamentos(caixa_id);
GRANT SELECT, INSERT, UPDATE ON public.pedido_pagamentos TO authenticated;
GRANT ALL ON public.pedido_pagamentos TO service_role;
ALTER TABLE public.pedido_pagamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pp_select" ON public.pedido_pagamentos;
DROP POLICY IF EXISTS "pp_admin" ON public.pedido_pagamentos;
DROP POLICY IF EXISTS "pp_insert" ON public.pedido_pagamentos;
CREATE POLICY "pp_select" ON public.pedido_pagamentos FOR SELECT TO authenticated USING (true);
CREATE POLICY "pp_insert" ON public.pedido_pagamentos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "pp_admin"  ON public.pedido_pagamentos FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_pp_updated_at BEFORE UPDATE ON public.pedido_pagamentos FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5) Tabela caixas
CREATE TABLE IF NOT EXISTS public.caixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'aberto', -- aberto | fechado | divergente
  aberto_em timestamptz NOT NULL DEFAULT now(),
  fechado_em timestamptz,
  valor_inicial numeric(10,2) NOT NULL DEFAULT 0,
  valor_dinheiro_informado numeric(10,2),
  valor_dinheiro_esperado numeric(10,2),
  diferenca numeric(10,2),
  total_pix numeric(10,2) NOT NULL DEFAULT 0,
  total_dinheiro numeric(10,2) NOT NULL DEFAULT 0,
  total_debito numeric(10,2) NOT NULL DEFAULT 0,
  total_credito numeric(10,2) NOT NULL DEFAULT 0,
  total_entradas numeric(10,2) NOT NULL DEFAULT 0,
  total_saidas numeric(10,2) NOT NULL DEFAULT 0,
  total_sangrias numeric(10,2) NOT NULL DEFAULT 0,
  total_reforcos numeric(10,2) NOT NULL DEFAULT 0,
  saldo_final numeric(10,2),
  usuario_abertura_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_fechamento_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  observacoes_abertura text,
  observacoes_fechamento text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_caixa_aberto ON public.caixas(status) WHERE status='aberto';
GRANT SELECT, INSERT, UPDATE ON public.caixas TO authenticated;
GRANT ALL ON public.caixas TO service_role;
ALTER TABLE public.caixas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "caixa_select" ON public.caixas;
DROP POLICY IF EXISTS "caixa_admin" ON public.caixas;
CREATE POLICY "caixa_select" ON public.caixas FOR SELECT TO authenticated USING (true);
CREATE POLICY "caixa_admin" ON public.caixas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE TRIGGER trg_caixas_updated_at BEFORE UPDATE ON public.caixas FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 6) Tabela caixa_movimentacoes
CREATE TABLE IF NOT EXISTS public.caixa_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caixa_id uuid NOT NULL REFERENCES public.caixas(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- abertura | fechamento | sangria | reforco | entrada | saida
  valor numeric(10,2) NOT NULL DEFAULT 0,
  descricao text,
  forma_pagamento forma_pagamento,
  financeiro_lancamento_id uuid REFERENCES public.financeiro_lancamentos(id) ON DELETE SET NULL,
  pedido_id uuid REFERENCES public.pedidos(id) ON DELETE SET NULL,
  pedido_pagamento_id uuid REFERENCES public.pedido_pagamentos(id) ON DELETE SET NULL,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cm_caixa ON public.caixa_movimentacoes(caixa_id);
GRANT SELECT, INSERT ON public.caixa_movimentacoes TO authenticated;
GRANT ALL ON public.caixa_movimentacoes TO service_role;
ALTER TABLE public.caixa_movimentacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cm_select" ON public.caixa_movimentacoes;
DROP POLICY IF EXISTS "cm_insert" ON public.caixa_movimentacoes;
DROP POLICY IF EXISTS "cm_admin" ON public.caixa_movimentacoes;
CREATE POLICY "cm_select" ON public.caixa_movimentacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cm_insert" ON public.caixa_movimentacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "cm_admin"  ON public.caixa_movimentacoes FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- FK pedidos.caixa_id (criada fora do CREATE TABLE por causa do IF NOT EXISTS)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pedidos_caixa_id_fkey') THEN
    ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_caixa_id_fkey
      FOREIGN KEY (caixa_id) REFERENCES public.caixas(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='pedido_pagamentos_caixa_id_fkey') THEN
    ALTER TABLE public.pedido_pagamentos ADD CONSTRAINT pedido_pagamentos_caixa_id_fkey
      FOREIGN KEY (caixa_id) REFERENCES public.caixas(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='financeiro_caixa_id_fkey') THEN
    ALTER TABLE public.financeiro_lancamentos ADD CONSTRAINT financeiro_caixa_id_fkey
      FOREIGN KEY (caixa_id) REFERENCES public.caixas(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 7) RPC abrir_caixa
CREATE OR REPLACE FUNCTION public.abrir_caixa(_valor_inicial numeric DEFAULT 0, _observacoes text DEFAULT NULL)
RETURNS public.caixas LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.caixas; _uid uuid := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.caixas WHERE status='aberto') THEN
    RAISE EXCEPTION 'Já existe um caixa aberto';
  END IF;
  INSERT INTO public.caixas(valor_inicial, usuario_abertura_id, observacoes_abertura)
  VALUES (COALESCE(_valor_inicial,0), _uid, NULLIF(_observacoes,''))
  RETURNING * INTO c;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id)
  VALUES (c.id, 'abertura', c.valor_inicial, 'Abertura de caixa', _uid);
  RETURN c;
END $$;

-- 8) RPC registrar_sangria / reforco
CREATE OR REPLACE FUNCTION public.registrar_sangria(_valor numeric, _motivo text)
RETURNS public.caixa_movimentacoes LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.caixas; m public.caixa_movimentacoes;
BEGIN
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id, forma_pagamento)
  VALUES (c.id, 'sangria', _valor, COALESCE(NULLIF(_motivo,''),'Sangria'), auth.uid(), 'dinheiro')
  RETURNING * INTO m;
  UPDATE public.caixas SET total_sangrias = total_sangrias + _valor WHERE id = c.id;
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_reforco(_valor numeric, _motivo text)
RETURNS public.caixa_movimentacoes LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.caixas; m public.caixa_movimentacoes;
BEGIN
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id, forma_pagamento)
  VALUES (c.id, 'reforco', _valor, COALESCE(NULLIF(_motivo,''),'Reforço'), auth.uid(), 'dinheiro')
  RETURNING * INTO m;
  UPDATE public.caixas SET total_reforcos = total_reforcos + _valor WHERE id = c.id;
  RETURN m;
END $$;

-- 9) RPC fechar_caixa
CREATE OR REPLACE FUNCTION public.fechar_caixa(_valor_dinheiro numeric, _observacoes text DEFAULT NULL)
RETURNS public.caixas LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.caixas; _esp numeric; _dif numeric; _st text; _uid uuid := auth.uid();
BEGIN
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  IF NOT (public.is_admin() OR public.pode_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para fechar caixa';
  END IF;

  _esp := c.valor_inicial + c.total_dinheiro + c.total_reforcos - c.total_sangrias - c.total_saidas;
  _dif := COALESCE(_valor_dinheiro,0) - _esp;
  _st  := CASE WHEN abs(_dif) < 0.005 THEN 'fechado' ELSE 'divergente' END;

  UPDATE public.caixas
     SET status = _st,
         fechado_em = now(),
         valor_dinheiro_informado = COALESCE(_valor_dinheiro,0),
         valor_dinheiro_esperado = _esp,
         diferenca = _dif,
         saldo_final = _esp,
         usuario_fechamento_id = _uid,
         observacoes_fechamento = NULLIF(_observacoes,'')
   WHERE id = c.id
   RETURNING * INTO c;

  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id)
  VALUES (c.id, 'fechamento', COALESCE(_valor_dinheiro,0),
          'Fechamento de caixa (esperado ' || _esp::text || ', diferença ' || _dif::text || ')', _uid);
  RETURN c;
END $$;

-- 10) Helper: atualiza totais do caixa para uma forma de pagamento
CREATE OR REPLACE FUNCTION public._caixa_acumula(_caixa_id uuid, _forma forma_pagamento, _valor numeric)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF _caixa_id IS NULL THEN RETURN; END IF;
  UPDATE public.caixas SET
    total_pix      = total_pix      + CASE WHEN _forma='pix'      THEN _valor ELSE 0 END,
    total_dinheiro = total_dinheiro + CASE WHEN _forma='dinheiro' THEN _valor ELSE 0 END,
    total_debito   = total_debito   + CASE WHEN _forma='debito'   THEN _valor ELSE 0 END,
    total_credito  = total_credito  + CASE WHEN _forma='credito'  THEN _valor ELSE 0 END,
    total_entradas = total_entradas + _valor
  WHERE id = _caixa_id;
END $$;

-- 11) RPC registrar_pagamento_comanda — único, misto e parcial
CREATE OR REPLACE FUNCTION public.registrar_pagamento_comanda(
  _pedido_id uuid,
  _pagamentos jsonb  -- [{ "forma":"pix","valor":30,"valor_recebido":30,"observacoes":"" }, ...]
) RETURNS public.pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  p public.pedidos;
  pg jsonb;
  _forma forma_pagamento;
  _valor numeric;
  _recebido numeric;
  _troco numeric;
  _obs text;
  _total_novo numeric := 0;
  _ja_pago numeric;
  _restante numeric;
  _uid uuid := auth.uid();
  _caixa uuid;
  _lanc uuid;
  _novo_pp uuid;
  _r record;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda='cancelada' OR p.status_pedido='cancelado' THEN
    RAISE EXCEPTION 'Comanda cancelada';
  END IF;
  IF p.status_pagamento='pago' THEN RETURN p; END IF;

  -- Garante totais atualizados
  PERFORM public.recalc_pedido_totais(_pedido_id);
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id;

  SELECT COALESCE(SUM(valor),0) INTO _ja_pago
    FROM public.pedido_pagamentos WHERE pedido_id=_pedido_id AND status='confirmado';
  _restante := p.total - _ja_pago;
  IF _restante <= 0 THEN
    UPDATE public.pedidos SET status_pagamento='pago', valor_pago=_ja_pago, valor_pendente=0,
      status_comanda='paga', pago_em = COALESCE(pago_em, now()), fechada_em = COALESCE(fechada_em, now())
     WHERE id=_pedido_id RETURNING * INTO p;
    RETURN p;
  END IF;

  SELECT id INTO _caixa FROM public.caixas WHERE status='aberto' LIMIT 1;

  -- Itera pagamentos
  FOR pg IN SELECT * FROM jsonb_array_elements(_pagamentos)
  LOOP
    _forma   := (pg->>'forma')::forma_pagamento;
    _valor   := COALESCE((pg->>'valor')::numeric, 0);
    _recebido:= COALESCE(NULLIF(pg->>'valor_recebido','')::numeric, _valor);
    _obs     := NULLIF(pg->>'observacoes','');
    IF _valor <= 0 THEN CONTINUE; END IF;
    -- Limita o último pagamento ao restante (evita exceder em formas não-dinheiro)
    IF _valor > (_restante - _total_novo) AND _forma <> 'dinheiro' THEN
      _valor := _restante - _total_novo;
      IF _valor <= 0 THEN CONTINUE; END IF;
    END IF;
    _troco := CASE WHEN _forma='dinheiro' AND _recebido > _valor THEN _recebido - _valor ELSE 0 END;

    INSERT INTO public.pedido_pagamentos(pedido_id, forma_pagamento, valor, valor_recebido, troco,
                                         observacoes, usuario_id, caixa_id, status)
    VALUES (_pedido_id, _forma, _valor, _recebido, _troco, _obs, _uid, _caixa, 'confirmado')
    RETURNING id INTO _novo_pp;

    INSERT INTO public.financeiro_lancamentos(
      tipo, categoria, descricao, valor, forma_pagamento, data, data_lancamento,
      pedido_id, usuario_id, status, referencia_tipo, referencia_id, caixa_id
    ) VALUES (
      'entrada','Venda FitLife','Pedido #' || p.numero || COALESCE(' • '||_obs,''),
      _valor, _forma, now()::date, now(),
      _pedido_id, _uid, 'ativo', 'pedido_pagamento', _novo_pp, _caixa
    ) RETURNING id INTO _lanc;

    UPDATE public.pedido_pagamentos SET financeiro_lancamento_id=_lanc WHERE id=_novo_pp;

    PERFORM public._caixa_acumula(_caixa, _forma, _valor);
    INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, forma_pagamento,
                                           financeiro_lancamento_id, pedido_id, pedido_pagamento_id, usuario_id)
    VALUES (_caixa, 'entrada', _valor, 'Pagamento pedido #'||p.numero, _forma,
            _lanc, _pedido_id, _novo_pp, _uid);

    _total_novo := _total_novo + _valor;
  END LOOP;

  -- Atualiza pedido
  SELECT COALESCE(SUM(valor),0) INTO _ja_pago
    FROM public.pedido_pagamentos WHERE pedido_id=_pedido_id AND status='confirmado';
  _restante := GREATEST(p.total - _ja_pago, 0);

  IF _restante <= 0.005 THEN
    UPDATE public.pedidos
       SET status_pagamento='pago',
           status_comanda='paga',
           status_pedido='entregue',
           forma_pagamento = (SELECT forma_pagamento FROM public.pedido_pagamentos
                              WHERE pedido_id=_pedido_id ORDER BY valor DESC LIMIT 1),
           valor_pago=_ja_pago,
           valor_pendente=0,
           valor_recebido=_ja_pago,
           pago_em=now(),
           fechada_em=now(),
           caixa_id = COALESCE(caixa_id, _caixa),
           baixado_por = _uid
     WHERE id=_pedido_id RETURNING * INTO p;

    -- Baixa de estoque (se ainda não baixado)
    IF NOT p.estoque_baixado THEN
      FOR _r IN
        SELECT pc.estoque_item_id, SUM(pc.quantidade_por_unidade * pi.quantidade) AS qtd
          FROM public.pedido_itens pi
          JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
         WHERE pi.pedido_id = _pedido_id AND pi.status_preparo <> 'cancelado'
         GROUP BY pc.estoque_item_id
      LOOP
        UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual - _r.qtd WHERE id = _r.estoque_item_id;
        INSERT INTO public.estoque_movimentacoes(item_id, tipo, tipo_movimentacao, quantidade, motivo, pedido_id, usuario_id)
        VALUES (_r.estoque_item_id, 'saida','venda', _r.qtd, 'Baixa por pedido #'||p.numero, p.id, _uid);
      END LOOP;
      UPDATE public.pedidos SET estoque_baixado=true, estoque_baixado_em=now()
        WHERE id=_pedido_id RETURNING * INTO p;
    END IF;
  ELSE
    UPDATE public.pedidos
       SET status_pagamento='parcial',
           status_comanda='aguardando_pagamento',
           valor_pago=_ja_pago,
           valor_pendente=_restante,
           caixa_id = COALESCE(caixa_id, _caixa)
     WHERE id=_pedido_id RETURNING * INTO p;
  END IF;

  RETURN p;
END $$;

-- 12) RPC estornar_lancamento (apenas admin)
CREATE OR REPLACE FUNCTION public.estornar_lancamento(_lancamento_id uuid, _motivo text)
RETURNS public.financeiro_lancamentos LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.financeiro_lancamentos; novo public.financeiro_lancamentos;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode estornar'; END IF;
  IF _motivo IS NULL OR _motivo='' THEN RAISE EXCEPTION 'Motivo obrigatório'; END IF;
  SELECT * INTO l FROM public.financeiro_lancamentos WHERE id=_lancamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;
  IF l.status='estornado' THEN RETURN l; END IF;

  UPDATE public.financeiro_lancamentos SET status='estornado' WHERE id=_lancamento_id;
  INSERT INTO public.financeiro_lancamentos(
    tipo, categoria, descricao, valor, forma_pagamento, data, data_lancamento,
    pedido_id, usuario_id, status, referencia_tipo, referencia_id, estorno_de, caixa_id, observacoes
  ) VALUES (
    CASE WHEN l.tipo='entrada' THEN 'saida'::tipo_financeiro ELSE 'entrada'::tipo_financeiro END,
    'Estorno', 'Estorno: ' || l.descricao, l.valor, l.forma_pagamento, now()::date, now(),
    l.pedido_id, auth.uid(), 'ativo', 'estorno', l.id, l.id, l.caixa_id, _motivo
  ) RETURNING * INTO novo;
  RETURN novo;
END $$;

-- 13) Permissões nas funções
GRANT EXECUTE ON FUNCTION public.abrir_caixa(numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fechar_caixa(numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_sangria(numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_reforco(numeric,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_pagamento_comanda(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.estornar_lancamento(uuid,text) TO authenticated;


-- >>> MIGRATION: 20260629215937_a4571936-2bb3-4cbf-ab90-f385b4a0a246.sql <<<

-- ============ COLUNAS ============
ALTER TABLE public.estoque_itens
  ADD COLUMN IF NOT EXISTS data_ultima_compra date,
  ADD COLUMN IF NOT EXISTS observacoes text,
  ADD COLUMN IF NOT EXISTS alerta_vencimento_dias integer NOT NULL DEFAULT 15;

ALTER TABLE public.estoque_movimentacoes
  ADD COLUMN IF NOT EXISTS pedido_item_id uuid,
  ADD COLUMN IF NOT EXISTS produto_id uuid,
  ADD COLUMN IF NOT EXISTS quantidade_anterior numeric(12,3),
  ADD COLUMN IF NOT EXISTS quantidade_posterior numeric(12,3);

ALTER TABLE public.produto_composicao
  ADD COLUMN IF NOT EXISTS unidade_medida text,
  ADD COLUMN IF NOT EXISTS obrigatorio boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.pedido_itens
  ADD COLUMN IF NOT EXISTS estoque_baixado boolean NOT NULL DEFAULT false;

ALTER TABLE public.configuracoes_loja
  ADD COLUMN IF NOT EXISTS permitir_estoque_negativo boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dias_alerta_vencimento integer NOT NULL DEFAULT 15;

-- ============ TABELA adicional_composicao ============
CREATE TABLE IF NOT EXISTS public.adicional_composicao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  adicional_id uuid REFERENCES public.adicionais(id) ON DELETE CASCADE,
  nome_adicional text,
  estoque_item_id uuid NOT NULL REFERENCES public.estoque_itens(id) ON DELETE RESTRICT,
  quantidade_utilizada numeric(12,3) NOT NULL DEFAULT 1,
  unidade_medida text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (adicional_id IS NOT NULL OR nome_adicional IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS adicional_composicao_adicional_idx ON public.adicional_composicao(adicional_id);
CREATE INDEX IF NOT EXISTS adicional_composicao_nome_idx ON public.adicional_composicao(lower(nome_adicional));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.adicional_composicao TO authenticated;
GRANT ALL ON public.adicional_composicao TO service_role;
ALTER TABLE public.adicional_composicao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "adicional_composicao_select" ON public.adicional_composicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "adicional_composicao_admin" ON public.adicional_composicao FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP TRIGGER IF EXISTS adicional_composicao_set_updated ON public.adicional_composicao;
CREATE TRIGGER adicional_composicao_set_updated BEFORE UPDATE ON public.adicional_composicao
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS produto_composicao_set_updated ON public.produto_composicao;
CREATE TRIGGER produto_composicao_set_updated BEFORE UPDATE ON public.produto_composicao
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ============ Remove trigger de baixa antiga (baixa no insert do item) ============
DROP TRIGGER IF EXISTS pedido_item_baixa_estoque ON public.pedido_itens;

-- ============ FUNÇÃO: registrar_entrada_estoque ============
CREATE OR REPLACE FUNCTION public.registrar_entrada_estoque(
  _item_id uuid,
  _quantidade numeric,
  _custo_unitario numeric DEFAULT NULL,
  _validade date DEFAULT NULL,
  _fornecedor text DEFAULT NULL,
  _observacoes text DEFAULT NULL
) RETURNS public.estoque_itens
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE it public.estoque_itens; _ant numeric; _uid uuid := auth.uid();
BEGIN
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  SELECT * INTO it FROM public.estoque_itens WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  _ant := it.quantidade_atual;
  UPDATE public.estoque_itens SET
    quantidade_atual = quantidade_atual + _quantidade,
    custo_unitario = COALESCE(_custo_unitario, custo_unitario),
    validade = COALESCE(_validade, validade),
    fornecedor = COALESCE(NULLIF(_fornecedor,''), fornecedor),
    data_ultima_compra = COALESCE(now()::date, data_ultima_compra),
    updated_at = now()
  WHERE id = _item_id RETURNING * INTO it;

  INSERT INTO public.estoque_movimentacoes(
    item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior,
    custo_unitario, motivo, usuario_id
  ) VALUES (
    _item_id, 'entrada', 'compra', _quantidade, _ant, it.quantidade_atual,
    _custo_unitario, COALESCE(NULLIF(_observacoes,''),'Entrada de estoque'), _uid
  );
  RETURN it;
END $fn$;

-- ============ FUNÇÃO: registrar_saida_manual_estoque ============
CREATE OR REPLACE FUNCTION public.registrar_saida_manual_estoque(
  _item_id uuid,
  _quantidade numeric,
  _tipo_movimentacao text,
  _motivo text DEFAULT NULL
) RETURNS public.estoque_movimentacoes
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE it public.estoque_itens; m public.estoque_movimentacoes; _ant numeric; _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode registrar saída/perda/ajuste'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _tipo_movimentacao NOT IN ('saida_manual','ajuste','perda','vencimento','uso_interno') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', _tipo_movimentacao;
  END IF;
  SELECT * INTO it FROM public.estoque_itens WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  _ant := it.quantidade_atual;
  UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual - _quantidade, updated_at = now()
    WHERE id = _item_id RETURNING * INTO it;
  INSERT INTO public.estoque_movimentacoes(
    item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior, motivo, usuario_id
  ) VALUES (
    _item_id, 'saida', _tipo_movimentacao, _quantidade, _ant, it.quantidade_atual, _motivo, _uid
  ) RETURNING * INTO m;
  RETURN m;
END $fn$;

-- ============ FUNÇÃO: baixar_estoque_comanda ============
CREATE OR REPLACE FUNCTION public.baixar_estoque_comanda(
  _pedido_id uuid,
  _forcar boolean DEFAULT false
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE
  p public.pedidos;
  cfg public.configuracoes_loja;
  _uid uuid := auth.uid();
  _consumo jsonb := '{}'::jsonb;
  _insuf jsonb := '[]'::jsonb;
  r record;
  add_el jsonb;
  qtd numeric;
  _ant numeric;
  _posterior numeric;
  _key text;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.estoque_baixado THEN RETURN jsonb_build_object('ok',true,'ja_baixado',true); END IF;
  IF p.status_pagamento <> 'pago' THEN
    RAISE EXCEPTION 'Comanda não está paga — não pode baixar estoque';
  END IF;

  -- Composição de produtos (itens não cancelados, produto com controla_estoque)
  FOR r IN
    SELECT pc.estoque_item_id AS item_id,
           SUM(pc.quantidade_utilizada * pi.quantidade)::numeric AS qtd,
           pi.id AS pedido_item_id,
           pi.produto_id AS produto_id
      FROM public.pedido_itens pi
      JOIN public.produtos pr ON pr.id = pi.produto_id
      JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
     WHERE pi.pedido_id = _pedido_id
       AND pi.status_preparo <> 'cancelado'
       AND COALESCE(pr.controla_estoque,true) = true
       AND COALESCE(pc.ativo,true) = true
     GROUP BY pc.estoque_item_id, pi.id, pi.produto_id
  LOOP
    _key := r.item_id::text;
    _consumo := jsonb_set(_consumo, ARRAY[_key],
      to_jsonb( COALESCE((_consumo->>_key)::numeric,0) + r.qtd ));
  END LOOP;

  -- Composição de adicionais (jsonb adicionais por item)
  FOR r IN
    SELECT pi.id AS pedido_item_id, pi.quantidade AS qtd_item, pi.adicionais AS adds
      FROM public.pedido_itens pi
     WHERE pi.pedido_id = _pedido_id
       AND pi.status_preparo <> 'cancelado'
       AND jsonb_array_length(COALESCE(pi.adicionais,'[]'::jsonb)) > 0
  LOOP
    FOR add_el IN SELECT value FROM jsonb_array_elements(r.adds)
    LOOP
      FOR _ant, _posterior, qtd, _key IN
        SELECT NULL::numeric, NULL::numeric,
               (ac.quantidade_utilizada * r.qtd_item)::numeric,
               ac.estoque_item_id::text
          FROM public.adicional_composicao ac
         WHERE ac.ativo = true
           AND (
             (add_el ? 'id' AND ac.adicional_id = (add_el->>'id')::uuid)
             OR (add_el ? 'nome' AND lower(ac.nome_adicional) = lower(add_el->>'nome'))
           )
      LOOP
        _consumo := jsonb_set(_consumo, ARRAY[_key],
          to_jsonb( COALESCE((_consumo->>_key)::numeric,0) + qtd ));
      END LOOP;
    END LOOP;
  END LOOP;

  -- Verifica estoque insuficiente
  SELECT * INTO cfg FROM public.configuracoes_loja LIMIT 1;
  FOR _key, qtd IN SELECT k, (v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v)
  LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id = _key::uuid;
    IF _ant IS NULL THEN CONTINUE; END IF;
    IF _ant < qtd THEN
      _insuf := _insuf || jsonb_build_object('item_id',_key,'disponivel',_ant,'necessario',qtd);
    END IF;
  END LOOP;

  IF jsonb_array_length(_insuf) > 0 AND NOT _forcar
     AND NOT COALESCE(cfg.permitir_estoque_negativo,false) THEN
    RETURN jsonb_build_object('ok',false,'insuficientes',_insuf);
  END IF;

  -- Aplica baixa
  FOR _key, qtd IN SELECT k, (v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v)
  LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id = _key::uuid FOR UPDATE;
    IF _ant IS NULL THEN CONTINUE; END IF;
    _posterior := _ant - qtd;
    UPDATE public.estoque_itens SET quantidade_atual = _posterior, updated_at = now()
      WHERE id = _key::uuid;
    INSERT INTO public.estoque_movimentacoes(
      item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior,
      motivo, pedido_id, usuario_id
    ) VALUES (
      _key::uuid, 'saida','venda', qtd, _ant, _posterior,
      'Baixa por comanda #' || p.numero, p.id, _uid
    );
  END LOOP;

  UPDATE public.pedidos
     SET estoque_baixado = true, estoque_baixado_em = now(), baixado_por = COALESCE(baixado_por,_uid)
   WHERE id = _pedido_id;
  UPDATE public.pedido_itens SET estoque_baixado = true
   WHERE pedido_id = _pedido_id AND status_preparo <> 'cancelado';

  RETURN jsonb_build_object('ok',true,'insuficientes',_insuf);
END $fn$;

-- ============ FUNÇÃO: devolver_estoque_comanda ============
CREATE OR REPLACE FUNCTION public.devolver_estoque_comanda(
  _pedido_id uuid, _motivo text DEFAULT 'Estorno/Cancelamento'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE p public.pedidos; r record; _ant numeric; _post numeric; _uid uuid := auth.uid(); _qtd numeric;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF NOT p.estoque_baixado THEN RETURN jsonb_build_object('ok',true,'nada_a_devolver',true); END IF;

  FOR r IN
    SELECT item_id, SUM(quantidade) AS qtd
      FROM public.estoque_movimentacoes
     WHERE pedido_id = _pedido_id AND tipo='saida' AND tipo_movimentacao='venda'
     GROUP BY item_id
  LOOP
    _qtd := r.qtd;
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id=r.item_id FOR UPDATE;
    IF _ant IS NULL THEN CONTINUE; END IF;
    _post := _ant + _qtd;
    UPDATE public.estoque_itens SET quantidade_atual=_post, updated_at=now() WHERE id=r.item_id;
    INSERT INTO public.estoque_movimentacoes(
      item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior,
      motivo, pedido_id, usuario_id
    ) VALUES (
      r.item_id,'entrada','devolucao', _qtd, _ant, _post,
      _motivo || ' #' || p.numero, p.id, _uid
    );
  END LOOP;

  UPDATE public.pedidos SET estoque_baixado=false WHERE id=_pedido_id;
  UPDATE public.pedido_itens SET estoque_baixado=false WHERE pedido_id=_pedido_id;
  RETURN jsonb_build_object('ok',true);
END $fn$;

-- ============ Atualiza fechar_comanda para usar baixar_estoque_comanda ============
CREATE OR REPLACE FUNCTION public.fechar_comanda(
  _pedido_id uuid, _forma_pagamento forma_pagamento,
  _valor_recebido numeric DEFAULT NULL, _desconto numeric DEFAULT 0,
  _observacoes text DEFAULT NULL
) RETURNS pedidos
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE p public.pedidos; _uid uuid := auth.uid(); _troco numeric;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda = 'paga' THEN RETURN p; END IF;
  IF p.status_comanda = 'cancelada' THEN RAISE EXCEPTION 'Comanda cancelada'; END IF;

  UPDATE public.pedidos SET desconto = COALESCE(_desconto,0) WHERE id = _pedido_id;
  PERFORM public.recalc_pedido_totais(_pedido_id);
  SELECT * INTO p FROM public.pedidos WHERE id = _pedido_id;

  _troco := CASE WHEN _valor_recebido IS NOT NULL AND _valor_recebido > p.total
                 THEN _valor_recebido - p.total ELSE 0 END;

  UPDATE public.pedidos
     SET status_pagamento='pago', status_comanda='paga', status_pedido='entregue',
         forma_pagamento=_forma_pagamento, pago_em=now(), fechada_em=now(), baixado_por=_uid,
         valor_recebido=COALESCE(_valor_recebido, total), troco=_troco,
         observacoes=COALESCE(NULLIF(_observacoes,''), observacoes)
   WHERE id=_pedido_id RETURNING * INTO p;

  PERFORM public.baixar_estoque_comanda(_pedido_id, false);
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id;
  RETURN p;
END $fn$;

-- ============ Atualiza registrar_pagamento_comanda para usar baixar_estoque_comanda ============
CREATE OR REPLACE FUNCTION public.registrar_pagamento_comanda(_pedido_id uuid, _pagamentos jsonb)
 RETURNS pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE
  p public.pedidos; pg jsonb;
  _forma forma_pagamento; _valor numeric; _recebido numeric; _troco numeric; _obs text;
  _total_novo numeric := 0; _ja_pago numeric; _restante numeric;
  _uid uuid := auth.uid(); _caixa uuid; _lanc uuid; _novo_pp uuid;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda='cancelada' OR p.status_pedido='cancelado' THEN RAISE EXCEPTION 'Comanda cancelada'; END IF;
  IF p.status_pagamento='pago' THEN RETURN p; END IF;

  PERFORM public.recalc_pedido_totais(_pedido_id);
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id;
  SELECT COALESCE(SUM(valor),0) INTO _ja_pago FROM public.pedido_pagamentos WHERE pedido_id=_pedido_id AND status='confirmado';
  _restante := p.total - _ja_pago;
  IF _restante <= 0 THEN
    UPDATE public.pedidos SET status_pagamento='pago', valor_pago=_ja_pago, valor_pendente=0,
      status_comanda='paga', pago_em=COALESCE(pago_em,now()), fechada_em=COALESCE(fechada_em,now())
     WHERE id=_pedido_id RETURNING * INTO p;
    PERFORM public.baixar_estoque_comanda(_pedido_id, false);
    SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id;
    RETURN p;
  END IF;

  SELECT id INTO _caixa FROM public.caixas WHERE status='aberto' LIMIT 1;

  FOR pg IN SELECT * FROM jsonb_array_elements(_pagamentos) LOOP
    _forma := (pg->>'forma')::forma_pagamento;
    _valor := COALESCE((pg->>'valor')::numeric, 0);
    _recebido := COALESCE(NULLIF(pg->>'valor_recebido','')::numeric, _valor);
    _obs := NULLIF(pg->>'observacoes','');
    IF _valor <= 0 THEN CONTINUE; END IF;
    IF _valor > (_restante - _total_novo) AND _forma <> 'dinheiro' THEN
      _valor := _restante - _total_novo;
      IF _valor <= 0 THEN CONTINUE; END IF;
    END IF;
    _troco := CASE WHEN _forma='dinheiro' AND _recebido > _valor THEN _recebido - _valor ELSE 0 END;

    INSERT INTO public.pedido_pagamentos(pedido_id, forma_pagamento, valor, valor_recebido, troco,
      observacoes, usuario_id, caixa_id, status)
    VALUES (_pedido_id, _forma, _valor, _recebido, _troco, _obs, _uid, _caixa, 'confirmado')
    RETURNING id INTO _novo_pp;

    INSERT INTO public.financeiro_lancamentos(
      tipo, categoria, descricao, valor, forma_pagamento, data, data_lancamento,
      pedido_id, usuario_id, status, referencia_tipo, referencia_id, caixa_id
    ) VALUES ('entrada','Venda FitLife','Pedido #' || p.numero || COALESCE(' • '||_obs,''),
      _valor, _forma, now()::date, now(), _pedido_id, _uid, 'ativo','pedido_pagamento', _novo_pp, _caixa)
    RETURNING id INTO _lanc;

    UPDATE public.pedido_pagamentos SET financeiro_lancamento_id=_lanc WHERE id=_novo_pp;
    PERFORM public._caixa_acumula(_caixa, _forma, _valor);
    INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, forma_pagamento,
      financeiro_lancamento_id, pedido_id, pedido_pagamento_id, usuario_id)
    VALUES (_caixa, 'entrada', _valor, 'Pagamento pedido #'||p.numero, _forma,
      _lanc, _pedido_id, _novo_pp, _uid);
    _total_novo := _total_novo + _valor;
  END LOOP;

  SELECT COALESCE(SUM(valor),0) INTO _ja_pago FROM public.pedido_pagamentos
    WHERE pedido_id=_pedido_id AND status='confirmado';
  _restante := GREATEST(p.total - _ja_pago, 0);

  IF _restante <= 0.005 THEN
    UPDATE public.pedidos
       SET status_pagamento='pago', status_comanda='paga', status_pedido='entregue',
           forma_pagamento=(SELECT forma_pagamento FROM public.pedido_pagamentos
                            WHERE pedido_id=_pedido_id ORDER BY valor DESC LIMIT 1),
           valor_pago=_ja_pago, valor_pendente=0, valor_recebido=_ja_pago,
           pago_em=now(), fechada_em=now(), caixa_id=COALESCE(caixa_id,_caixa), baixado_por=_uid
     WHERE id=_pedido_id RETURNING * INTO p;
    PERFORM public.baixar_estoque_comanda(_pedido_id, false);
    SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id;
  ELSE
    UPDATE public.pedidos
       SET status_pagamento='parcial', status_comanda='aguardando_pagamento',
           valor_pago=_ja_pago, valor_pendente=_restante, caixa_id=COALESCE(caixa_id,_caixa)
     WHERE id=_pedido_id RETURNING * INTO p;
  END IF;
  RETURN p;
END $fn$;

-- ============ Atualiza cancelar_pedido para usar devolver_estoque_comanda ============
CREATE OR REPLACE FUNCTION public.cancelar_pedido(_pedido_id uuid, _motivo text DEFAULT NULL)
 RETURNS pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $fn$
DECLARE p public.pedidos;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p.status_pedido='cancelado' THEN RETURN p; END IF;

  IF p.estoque_baixado THEN
    PERFORM public.devolver_estoque_comanda(_pedido_id, 'Cancelamento');
  END IF;

  UPDATE public.pedidos
     SET status_pedido='cancelado',
         status_pagamento = CASE WHEN status_pagamento='pago' THEN 'cancelado'::status_pagamento ELSE status_pagamento END,
         status_comanda='cancelada',
         cancelado_em=now(), motivo_cancelamento=_motivo
   WHERE id=_pedido_id RETURNING * INTO p;
  RETURN p;
END $fn$;


-- >>> MIGRATION: 20260629223248_587f140f-0a92-4150-a0fc-ac7df29dfdbc.sql <<<
CREATE OR REPLACE FUNCTION public.baixar_estoque_comanda(_pedido_id uuid, _forcar boolean DEFAULT false)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p public.pedidos;
  cfg public.configuracoes_loja;
  _uid uuid := auth.uid();
  _consumo jsonb := '{}'::jsonb;
  _insuf jsonb := '[]'::jsonb;
  r record;
  add_el jsonb;
  qtd numeric;
  _ant numeric;
  _posterior numeric;
  _key text;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.estoque_baixado THEN RETURN jsonb_build_object('ok',true,'ja_baixado',true); END IF;
  IF p.status_pagamento <> 'pago' THEN
    RAISE EXCEPTION 'Comanda não está paga — não pode baixar estoque';
  END IF;

  FOR r IN
    SELECT pc.estoque_item_id AS item_id,
           SUM(pc.quantidade_por_unidade * pi.quantidade)::numeric AS qtd,
           pi.id AS pedido_item_id,
           pi.produto_id AS produto_id
      FROM public.pedido_itens pi
      JOIN public.produtos pr ON pr.id = pi.produto_id
      JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
     WHERE pi.pedido_id = _pedido_id
       AND pi.status_preparo <> 'cancelado'
       AND COALESCE(pr.controla_estoque,true) = true
       AND COALESCE(pc.ativo,true) = true
     GROUP BY pc.estoque_item_id, pi.id, pi.produto_id
  LOOP
    _key := r.item_id::text;
    _consumo := jsonb_set(_consumo, ARRAY[_key],
      to_jsonb( COALESCE((_consumo->>_key)::numeric,0) + r.qtd ));
  END LOOP;

  FOR r IN
    SELECT pi.id AS pedido_item_id, pi.quantidade AS qtd_item, pi.adicionais AS adds
      FROM public.pedido_itens pi
     WHERE pi.pedido_id = _pedido_id
       AND pi.status_preparo <> 'cancelado'
       AND jsonb_array_length(COALESCE(pi.adicionais,'[]'::jsonb)) > 0
  LOOP
    FOR add_el IN SELECT value FROM jsonb_array_elements(r.adds)
    LOOP
      FOR _ant, _posterior, qtd, _key IN
        SELECT NULL::numeric, NULL::numeric,
               (ac.quantidade_utilizada * r.qtd_item)::numeric,
               ac.estoque_item_id::text
          FROM public.adicional_composicao ac
         WHERE ac.ativo = true
           AND (
             (add_el ? 'id' AND ac.adicional_id = (add_el->>'id')::uuid)
             OR (add_el ? 'nome' AND lower(ac.nome_adicional) = lower(add_el->>'nome'))
           )
      LOOP
        _consumo := jsonb_set(_consumo, ARRAY[_key],
          to_jsonb( COALESCE((_consumo->>_key)::numeric,0) + qtd ));
      END LOOP;
    END LOOP;
  END LOOP;

  SELECT * INTO cfg FROM public.configuracoes_loja LIMIT 1;
  FOR _key, qtd IN SELECT k, (v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v)
  LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id = _key::uuid;
    IF _ant IS NULL THEN CONTINUE; END IF;
    IF _ant < qtd THEN
      _insuf := _insuf || jsonb_build_object('item_id',_key,'disponivel',_ant,'necessario',qtd);
    END IF;
  END LOOP;

  IF jsonb_array_length(_insuf) > 0 AND NOT _forcar
     AND NOT COALESCE(cfg.permitir_estoque_negativo,false) THEN
    RETURN jsonb_build_object('ok',false,'insuficientes',_insuf);
  END IF;

  FOR _key, qtd IN SELECT k, (v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v)
  LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id = _key::uuid FOR UPDATE;
    IF _ant IS NULL THEN CONTINUE; END IF;
    _posterior := _ant - qtd;
    UPDATE public.estoque_itens SET quantidade_atual = _posterior, updated_at = now()
      WHERE id = _key::uuid;
    INSERT INTO public.estoque_movimentacoes(
      item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior,
      motivo, pedido_id, usuario_id
    ) VALUES (
      _key::uuid, 'saida','venda', qtd, _ant, _posterior,
      'Baixa por comanda #' || p.numero, p.id, _uid
    );
  END LOOP;

  UPDATE public.pedidos
     SET estoque_baixado = true, estoque_baixado_em = now(), baixado_por = COALESCE(baixado_por,_uid)
   WHERE id = _pedido_id;
  UPDATE public.pedido_itens SET estoque_baixado = true
   WHERE pedido_id = _pedido_id AND status_preparo <> 'cancelado';

  RETURN jsonb_build_object('ok',true,'insuficientes',_insuf);
END $function$;

-- >>> MIGRATION: 20260629225321_fbe09494-4ff6-4709-9f0d-e5406dd502ca.sql <<<

-- 1. Configurações da loja
ALTER TABLE public.configuracoes_loja
  ADD COLUMN IF NOT EXISTS formas_pagamento_ativas jsonb NOT NULL DEFAULT '["pix","dinheiro","debito","credito"]'::jsonb,
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS telefone text;

-- Garante uma linha
INSERT INTO public.configuracoes_loja (nome_loja)
SELECT 'FitLife' WHERE NOT EXISTS (SELECT 1 FROM public.configuracoes_loja);

-- 2. Reabertura de comanda
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS reaberta_em timestamptz,
  ADD COLUMN IF NOT EXISTS reaberta_por uuid,
  ADD COLUMN IF NOT EXISTS motivo_reabertura text;

-- 3. Drop fluxo antigo de pagamento
DROP FUNCTION IF EXISTS public.confirmar_pagamento_pedido(uuid, forma_pagamento, numeric, text);

-- 4. RPC reabrir_comanda (admin only)
CREATE OR REPLACE FUNCTION public.reabrir_comanda(_pedido_id uuid, _motivo text)
RETURNS public.pedidos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE p public.pedidos;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administrador pode reabrir comanda';
  END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) = 0 THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda <> 'paga' THEN
    RAISE EXCEPTION 'Só é possível reabrir uma comanda paga (status atual: %)', p.status_comanda;
  END IF;

  -- Devolve estoque se foi baixado
  IF p.estoque_baixado THEN
    PERFORM public.devolver_estoque_comanda(_pedido_id, 'Reabertura: ' || _motivo);
  END IF;

  -- Estorna lançamentos financeiros ativos vinculados
  UPDATE public.financeiro_lancamentos
     SET status='estornado',
         observacoes = COALESCE(observacoes,'') || E'\n[Estornado por reabertura] ' || _motivo
   WHERE pedido_id = _pedido_id AND status='ativo';

  -- Cancela pagamentos confirmados
  UPDATE public.pedido_pagamentos
     SET status='cancelado'
   WHERE pedido_id = _pedido_id AND status='confirmado';

  UPDATE public.pedidos
     SET status_comanda='em_consumo',
         status_pagamento='pendente',
         status_pedido='recebido',
         pago_em=NULL,
         fechada_em=NULL,
         valor_pago=0,
         valor_pendente=total,
         valor_recebido=NULL,
         troco=0,
         reaberta_em=now(),
         reaberta_por=auth.uid(),
         motivo_reabertura=_motivo
   WHERE id=_pedido_id
   RETURNING * INTO p;
  RETURN p;
END $$;

-- 5. RPC cancelar_lancamento_financeiro
CREATE OR REPLACE FUNCTION public.cancelar_lancamento_financeiro(_id uuid, _motivo text)
RETURNS public.financeiro_lancamentos
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE l public.financeiro_lancamentos;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administrador pode cancelar lançamento';
  END IF;
  IF _motivo IS NULL OR length(trim(_motivo))=0 THEN
    RAISE EXCEPTION 'Motivo é obrigatório';
  END IF;
  UPDATE public.financeiro_lancamentos
     SET status='cancelado',
         observacoes = COALESCE(observacoes,'') || E'\n[Cancelado] ' || _motivo
   WHERE id=_id AND status='ativo'
   RETURNING * INTO l;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento não encontrado ou já cancelado'; END IF;
  RETURN l;
END $$;

-- 6. Bloqueia DELETE direto em financeiro via revoke
REVOKE DELETE ON public.financeiro_lancamentos FROM authenticated, anon;


-- >>> MIGRATION: 20260629230644_612bab9f-924a-44b3-927b-2cc92a563d4d.sql <<<

CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  usuario_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  usuario_nome text,
  acao text NOT NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  descricao text,
  motivo text,
  metadata jsonb
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin lê auditoria" ON public.audit_log;
DROP POLICY IF EXISTS "Sistema insere auditoria" ON public.audit_log;
CREATE POLICY "Admin lê auditoria" ON public.audit_log
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Sistema insere auditoria" ON public.audit_log
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entidade ON public.audit_log(entidade, entidade_id);

CREATE OR REPLACE FUNCTION public.log_audit(
  _acao text, _entidade text, _entidade_id uuid,
  _descricao text DEFAULT NULL, _motivo text DEFAULT NULL, _metadata jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _nome text;
BEGIN
  SELECT nome INTO _nome FROM public.users_profiles WHERE user_id = auth.uid() LIMIT 1;
  INSERT INTO public.audit_log(usuario_id, usuario_nome, acao, entidade, entidade_id, descricao, motivo, metadata)
  VALUES (auth.uid(), _nome, _acao, _entidade, _entidade_id, _descricao, _motivo, _metadata);
END $$;

CREATE OR REPLACE FUNCTION public.reabrir_comanda(_pedido_id uuid, _motivo text)
RETURNS public.pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.pedidos;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode reabrir comanda'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) = 0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.status_comanda <> 'paga' THEN
    RAISE EXCEPTION 'Só é possível reabrir uma comanda paga (status atual: %)', p.status_comanda;
  END IF;
  IF p.estoque_baixado THEN
    PERFORM public.devolver_estoque_comanda(_pedido_id, 'Reabertura: ' || _motivo);
  END IF;
  UPDATE public.financeiro_lancamentos
     SET status='estornado',
         observacoes = COALESCE(observacoes,'') || E'\n[Estornado por reabertura] ' || _motivo
   WHERE pedido_id = _pedido_id AND status='ativo';
  UPDATE public.pedido_pagamentos SET status='cancelado'
   WHERE pedido_id = _pedido_id AND status='confirmado';
  UPDATE public.pedidos
     SET status_comanda='em_consumo', status_pagamento='pendente', status_pedido='recebido',
         pago_em=NULL, fechada_em=NULL, valor_pago=0, valor_pendente=total,
         valor_recebido=NULL, troco=0,
         reaberta_em=now(), reaberta_por=auth.uid(), motivo_reabertura=_motivo
   WHERE id=_pedido_id RETURNING * INTO p;
  PERFORM public.log_audit('reabrir_comanda','pedido',p.id,'Comanda #'||p.numero||' reaberta',_motivo,NULL);
  RETURN p;
END $$;

CREATE OR REPLACE FUNCTION public.cancelar_pedido(_pedido_id uuid, _motivo text DEFAULT NULL)
RETURNS public.pedidos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.pedidos;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Pedido não encontrado'; END IF;
  IF p.status_pedido='cancelado' THEN RETURN p; END IF;
  IF _motivo IS NULL OR length(trim(_motivo))=0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  IF p.estoque_baixado THEN
    PERFORM public.devolver_estoque_comanda(_pedido_id, 'Cancelamento');
  END IF;
  UPDATE public.pedidos
     SET status_pedido='cancelado',
         status_pagamento = CASE WHEN status_pagamento='pago' THEN 'cancelado'::status_pagamento ELSE status_pagamento END,
         status_comanda='cancelada', cancelado_em=now(), motivo_cancelamento=_motivo
   WHERE id=_pedido_id RETURNING * INTO p;
  PERFORM public.log_audit('cancelar_pedido','pedido',p.id,'Pedido #'||p.numero,_motivo,NULL);
  RETURN p;
END $$;

CREATE OR REPLACE FUNCTION public.cancelar_lancamento_financeiro(_id uuid, _motivo text)
RETURNS public.financeiro_lancamentos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.financeiro_lancamentos;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode cancelar lançamento'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo))=0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  UPDATE public.financeiro_lancamentos
     SET status='cancelado',
         observacoes = COALESCE(observacoes,'') || E'\n[Cancelado] ' || _motivo
   WHERE id=_id AND status='ativo' RETURNING * INTO l;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento não encontrado ou já cancelado'; END IF;
  PERFORM public.log_audit('cancelar_lancamento','financeiro',l.id,l.descricao,_motivo,
    jsonb_build_object('valor',l.valor,'tipo',l.tipo));
  RETURN l;
END $$;

CREATE OR REPLACE FUNCTION public.estornar_lancamento(_lancamento_id uuid, _motivo text)
RETURNS public.financeiro_lancamentos LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.financeiro_lancamentos; novo public.financeiro_lancamentos;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode estornar'; END IF;
  IF _motivo IS NULL OR _motivo='' THEN RAISE EXCEPTION 'Motivo obrigatório'; END IF;
  SELECT * INTO l FROM public.financeiro_lancamentos WHERE id=_lancamento_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;
  IF l.status='estornado' THEN RETURN l; END IF;
  UPDATE public.financeiro_lancamentos SET status='estornado' WHERE id=_lancamento_id;
  INSERT INTO public.financeiro_lancamentos(
    tipo, categoria, descricao, valor, forma_pagamento, data, data_lancamento,
    pedido_id, usuario_id, status, referencia_tipo, referencia_id, estorno_de, caixa_id, observacoes
  ) VALUES (
    CASE WHEN l.tipo='entrada' THEN 'saida'::tipo_financeiro ELSE 'entrada'::tipo_financeiro END,
    'Estorno', 'Estorno: ' || l.descricao, l.valor, l.forma_pagamento, now()::date, now(),
    l.pedido_id, auth.uid(), 'ativo', 'estorno', l.id, l.id, l.caixa_id, _motivo
  ) RETURNING * INTO novo;
  PERFORM public.log_audit('estornar_lancamento','financeiro',l.id,'Estorno: '||l.descricao,_motivo,
    jsonb_build_object('valor',l.valor,'estorno_id',novo.id));
  RETURN novo;
END $$;

DROP FUNCTION IF EXISTS public.registrar_saida_manual_estoque(uuid, numeric, text, text);
CREATE FUNCTION public.registrar_saida_manual_estoque(
  _item_id uuid, _quantidade numeric, _tipo_movimentacao text, _motivo text
) RETURNS public.estoque_movimentacoes
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE it public.estoque_itens; m public.estoque_movimentacoes; _ant numeric; _uid uuid := auth.uid();
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Apenas administrador pode registrar saída/perda/ajuste'; END IF;
  IF _quantidade IS NULL OR _quantidade <= 0 THEN RAISE EXCEPTION 'Quantidade inválida'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo)) = 0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  IF _tipo_movimentacao NOT IN ('saida_manual','ajuste','perda','vencimento','uso_interno') THEN
    RAISE EXCEPTION 'Tipo de movimentação inválido: %', _tipo_movimentacao;
  END IF;
  SELECT * INTO it FROM public.estoque_itens WHERE id = _item_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Item não encontrado'; END IF;
  _ant := it.quantidade_atual;
  UPDATE public.estoque_itens SET quantidade_atual = quantidade_atual - _quantidade, updated_at = now()
    WHERE id = _item_id RETURNING * INTO it;
  INSERT INTO public.estoque_movimentacoes(
    item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior, motivo, usuario_id
  ) VALUES (
    _item_id, 'saida', _tipo_movimentacao, _quantidade, _ant, it.quantidade_atual, _motivo, _uid
  ) RETURNING * INTO m;
  PERFORM public.log_audit('estoque_saida_manual','estoque_item',_item_id,
    it.nome||' '||_tipo_movimentacao||' '||_quantidade::text,_motivo,
    jsonb_build_object('anterior',_ant,'posterior',it.quantidade_atual));
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_sangria(_valor numeric, _motivo text)
RETURNS public.caixa_movimentacoes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.caixas; m public.caixa_movimentacoes;
BEGIN
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo))=0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id, forma_pagamento)
  VALUES (c.id, 'sangria', _valor, _motivo, auth.uid(), 'dinheiro') RETURNING * INTO m;
  UPDATE public.caixas SET total_sangrias = total_sangrias + _valor WHERE id = c.id;
  PERFORM public.log_audit('sangria','caixa',c.id,'Sangria R$ '||_valor::text,_motivo,
    jsonb_build_object('valor',_valor));
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.registrar_reforco(_valor numeric, _motivo text)
RETURNS public.caixa_movimentacoes LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.caixas; m public.caixa_movimentacoes;
BEGIN
  IF _valor IS NULL OR _valor <= 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF _motivo IS NULL OR length(trim(_motivo))=0 THEN RAISE EXCEPTION 'Motivo é obrigatório'; END IF;
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id, forma_pagamento)
  VALUES (c.id, 'reforco', _valor, _motivo, auth.uid(), 'dinheiro') RETURNING * INTO m;
  UPDATE public.caixas SET total_reforcos = total_reforcos + _valor WHERE id = c.id;
  PERFORM public.log_audit('reforco','caixa',c.id,'Reforço R$ '||_valor::text,_motivo,
    jsonb_build_object('valor',_valor));
  RETURN m;
END $$;

CREATE OR REPLACE FUNCTION public.abrir_caixa(_valor_inicial numeric DEFAULT 0, _observacoes text DEFAULT NULL)
RETURNS public.caixas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.caixas; _uid uuid := auth.uid();
BEGIN
  IF EXISTS (SELECT 1 FROM public.caixas WHERE status='aberto') THEN
    RAISE EXCEPTION 'Já existe um caixa aberto';
  END IF;
  INSERT INTO public.caixas(valor_inicial, usuario_abertura_id, observacoes_abertura)
  VALUES (COALESCE(_valor_inicial,0), _uid, NULLIF(_observacoes,'')) RETURNING * INTO c;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id)
  VALUES (c.id, 'abertura', c.valor_inicial, 'Abertura de caixa', _uid);
  PERFORM public.log_audit('abrir_caixa','caixa',c.id,'Abertura R$ '||c.valor_inicial::text,NULL,NULL);
  RETURN c;
END $$;

CREATE OR REPLACE FUNCTION public.fechar_caixa(_valor_dinheiro numeric, _observacoes text DEFAULT NULL)
RETURNS public.caixas LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.caixas; _esp numeric; _dif numeric; _st text; _uid uuid := auth.uid();
BEGIN
  SELECT * INTO c FROM public.caixas WHERE status='aberto' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Nenhum caixa aberto'; END IF;
  IF NOT (public.is_admin() OR public.pode_financeiro()) THEN
    RAISE EXCEPTION 'Sem permissão para fechar caixa';
  END IF;
  _esp := c.valor_inicial + c.total_dinheiro + c.total_reforcos - c.total_sangrias - c.total_saidas;
  _dif := COALESCE(_valor_dinheiro,0) - _esp;
  _st  := CASE WHEN abs(_dif) < 0.005 THEN 'fechado' ELSE 'divergente' END;
  UPDATE public.caixas
     SET status = _st, fechado_em = now(),
         valor_dinheiro_informado = COALESCE(_valor_dinheiro,0),
         valor_dinheiro_esperado = _esp, diferenca = _dif, saldo_final = _esp,
         usuario_fechamento_id = _uid, observacoes_fechamento = NULLIF(_observacoes,'')
   WHERE id = c.id RETURNING * INTO c;
  INSERT INTO public.caixa_movimentacoes(caixa_id, tipo, valor, descricao, usuario_id)
  VALUES (c.id, 'fechamento', COALESCE(_valor_dinheiro,0),
          'Fechamento (esperado '||_esp::text||', diferença '||_dif::text||')', _uid);
  PERFORM public.log_audit('fechar_caixa','caixa',c.id,
    'Fechamento '||_st,_observacoes,
    jsonb_build_object('esperado',_esp,'informado',_valor_dinheiro,'diferenca',_dif));
  RETURN c;
END $$;


-- >>> MIGRATION: 20260630183147_25f0405b-2acf-4712-a4ee-01270dfc2242.sql <<<
CREATE OR REPLACE FUNCTION public.adicionar_item_comanda(
  _pedido_id uuid,
  _produto_id uuid,
  _quantidade numeric DEFAULT 1,
  _sabor text DEFAULT NULL,
  _adicionais jsonb DEFAULT '[]'::jsonb,
  _observacoes text DEFAULT NULL,
  _envia_para_cozinha boolean DEFAULT NULL
)
RETURNS pedido_itens
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  pr public.produtos;
  ped public.pedidos;
  it public.pedido_itens;
  _rodada int;
  _envia boolean;
BEGIN
  SELECT * INTO ped FROM public.pedidos WHERE id = _pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF ped.status_comanda IN ('paga','cancelada') THEN
    RAISE EXCEPTION 'Comanda já fechada (%) — não é possível adicionar itens', ped.status_comanda;
  END IF;

  SELECT * INTO pr FROM public.produtos WHERE id = _produto_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produto não encontrado'; END IF;

  _envia := COALESCE(_envia_para_cozinha, pr.envia_para_cozinha);

  SELECT COALESCE(MAX(rodada),0) + 1 INTO _rodada
    FROM public.pedido_itens WHERE pedido_id = _pedido_id;

  INSERT INTO public.pedido_itens(
    pedido_id, produto_id, nome_produto, quantidade, preco_unitario, custo_unitario,
    sabor, adicionais, observacoes,
    status_preparo, envia_para_cozinha, enviado_cozinha_em, rodada
  ) VALUES (
    _pedido_id, _produto_id, pr.nome, _quantidade, pr.preco, pr.custo,
    NULLIF(_sabor,''), COALESCE(_adicionais,'[]'::jsonb), NULLIF(_observacoes,''),
    'novo', _envia,
    CASE WHEN _envia THEN now() ELSE NULL END,
    _rodada
  ) RETURNING * INTO it;

  IF ped.status_comanda = 'aberta' THEN
    UPDATE public.pedidos SET status_comanda = 'em_consumo' WHERE id = _pedido_id;
  END IF;

  RETURN it;
END;
$function$;

-- >>> MIGRATION: 20260630201731_cbd7faf6-1148-4175-9e72-46f5b1a2598c.sql <<<

ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS estoque_item_id uuid REFERENCES public.estoque_itens(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS estoque_quantidade_por_unidade numeric NOT NULL DEFAULT 1;

-- Auto-vínculo por nome exato (case-insensitive)
UPDATE public.produtos p
   SET estoque_item_id = ei.id, estoque_quantidade_por_unidade = 1, controla_estoque = true
  FROM public.estoque_itens ei
 WHERE p.estoque_item_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM public.produto_composicao pc WHERE pc.produto_id = p.id)
   AND lower(trim(ei.nome)) = lower(trim(p.nome));

-- Casos por prefixo
UPDATE public.produtos p SET estoque_item_id = ei.id, estoque_quantidade_por_unidade=1, controla_estoque=true
  FROM public.estoque_itens ei
 WHERE p.estoque_item_id IS NULL
   AND ((p.nome ILIKE 'Muffin%' AND ei.nome ILIKE 'Muffin')
     OR (p.nome ILIKE 'Waffle%' AND ei.nome ILIKE 'Waffle')
     OR (p.nome ILIKE 'Pão de Queijo%' AND ei.nome ILIKE 'Pão de queijo')
     OR (p.nome ILIKE 'Bolo de Pote%' AND ei.nome ILIKE 'Bolo de pote')
     OR (p.nome ILIKE 'Empadinha%' AND ei.nome ILIKE 'Empadinha')
     OR (p.nome ILIKE 'Brigadeiro%' AND ei.nome ILIKE 'Brigadeiro%')
     OR (p.nome ILIKE 'Pão de Mel%' AND ei.nome ILIKE 'Pão de mel'));

CREATE OR REPLACE FUNCTION public.baixar_estoque_comanda(_pedido_id uuid, _forcar boolean DEFAULT false)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  p public.pedidos;
  cfg public.configuracoes_loja;
  _uid uuid := auth.uid();
  _consumo jsonb := '{}'::jsonb;
  _insuf jsonb := '[]'::jsonb;
  r record; add_el jsonb;
  qtd numeric; _ant numeric; _posterior numeric; _key text;
BEGIN
  SELECT * INTO p FROM public.pedidos WHERE id=_pedido_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Comanda não encontrada'; END IF;
  IF p.estoque_baixado THEN RETURN jsonb_build_object('ok',true,'ja_baixado',true); END IF;
  IF p.status_pagamento <> 'pago' THEN RAISE EXCEPTION 'Comanda não está paga — não pode baixar estoque'; END IF;

  -- (a) Composição
  FOR r IN
    SELECT pc.estoque_item_id AS item_id, SUM(pc.quantidade_por_unidade * pi.quantidade)::numeric AS qtd
      FROM public.pedido_itens pi
      JOIN public.produtos pr ON pr.id = pi.produto_id
      JOIN public.produto_composicao pc ON pc.produto_id = pi.produto_id
     WHERE pi.pedido_id = _pedido_id AND pi.status_preparo <> 'cancelado'
       AND COALESCE(pr.controla_estoque,true)=true AND COALESCE(pc.ativo,true)=true
     GROUP BY pc.estoque_item_id
  LOOP
    _key := r.item_id::text;
    _consumo := jsonb_set(_consumo, ARRAY[_key], to_jsonb(COALESCE((_consumo->>_key)::numeric,0) + r.qtd));
  END LOOP;

  -- (b) Vínculo direto (quando sem composição)
  FOR r IN
    SELECT pr.estoque_item_id AS item_id,
           SUM(COALESCE(pr.estoque_quantidade_por_unidade,1) * pi.quantidade)::numeric AS qtd
      FROM public.pedido_itens pi
      JOIN public.produtos pr ON pr.id = pi.produto_id
     WHERE pi.pedido_id = _pedido_id AND pi.status_preparo <> 'cancelado'
       AND COALESCE(pr.controla_estoque,true)=true AND pr.estoque_item_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM public.produto_composicao pc
                        WHERE pc.produto_id = pr.id AND COALESCE(pc.ativo,true)=true)
     GROUP BY pr.estoque_item_id
  LOOP
    _key := r.item_id::text;
    _consumo := jsonb_set(_consumo, ARRAY[_key], to_jsonb(COALESCE((_consumo->>_key)::numeric,0) + r.qtd));
  END LOOP;

  -- (c) Adicionais
  FOR r IN
    SELECT pi.quantidade AS qtd_item, pi.adicionais AS adds
      FROM public.pedido_itens pi
     WHERE pi.pedido_id = _pedido_id AND pi.status_preparo <> 'cancelado'
       AND jsonb_array_length(COALESCE(pi.adicionais,'[]'::jsonb)) > 0
  LOOP
    FOR add_el IN SELECT value FROM jsonb_array_elements(r.adds) LOOP
      FOR qtd, _key IN
        SELECT (ac.quantidade_utilizada * r.qtd_item)::numeric, ac.estoque_item_id::text
          FROM public.adicional_composicao ac
         WHERE ac.ativo=true AND (
           (add_el ? 'id' AND ac.adicional_id = (add_el->>'id')::uuid)
           OR (add_el ? 'nome' AND lower(ac.nome_adicional) = lower(add_el->>'nome'))
         )
      LOOP
        _consumo := jsonb_set(_consumo, ARRAY[_key], to_jsonb(COALESCE((_consumo->>_key)::numeric,0) + qtd));
      END LOOP;
    END LOOP;
  END LOOP;

  SELECT * INTO cfg FROM public.configuracoes_loja LIMIT 1;
  FOR _key, qtd IN SELECT k,(v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v) LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id=_key::uuid;
    IF _ant IS NULL THEN CONTINUE; END IF;
    IF _ant < qtd THEN
      _insuf := _insuf || jsonb_build_object('item_id',_key,'disponivel',_ant,'necessario',qtd);
    END IF;
  END LOOP;

  IF jsonb_array_length(_insuf) > 0 AND NOT _forcar
     AND NOT COALESCE(cfg.permitir_estoque_negativo,false) THEN
    RETURN jsonb_build_object('ok',false,'insuficientes',_insuf);
  END IF;

  FOR _key, qtd IN SELECT k,(v)::numeric FROM jsonb_each_text(_consumo) AS j(k,v) LOOP
    SELECT quantidade_atual INTO _ant FROM public.estoque_itens WHERE id=_key::uuid FOR UPDATE;
    IF _ant IS NULL THEN CONTINUE; END IF;
    _posterior := _ant - qtd;
    UPDATE public.estoque_itens SET quantidade_atual=_posterior, updated_at=now() WHERE id=_key::uuid;
    INSERT INTO public.estoque_movimentacoes(
      item_id, tipo, tipo_movimentacao, quantidade, quantidade_anterior, quantidade_posterior,
      motivo, pedido_id, usuario_id
    ) VALUES (
      _key::uuid,'saida','venda', qtd, _ant, _posterior,
      'Baixa por venda — comanda #' || p.numero, p.id, _uid
    );
  END LOOP;

  UPDATE public.pedidos SET estoque_baixado=true, estoque_baixado_em=now(),
         baixado_por=COALESCE(baixado_por,_uid) WHERE id=_pedido_id;
  UPDATE public.pedido_itens SET estoque_baixado=true
   WHERE pedido_id=_pedido_id AND status_preparo <> 'cancelado';

  RETURN jsonb_build_object('ok',true,'insuficientes',_insuf);
END $function$;




-- =========================================================
-- DESATIVAR CONFIRMAÇÃO DE E-MAIL NO SUPABASE
-- =========================================================

-- 1. Auto-confirmar qualquer usuário futuro via trigger no banco
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS trg_auto_confirm_user ON auth.users;
CREATE TRIGGER trg_auto_confirm_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_user();

-- 2. Confirmar imediatamente todos os usuários que já foram criados
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;



-- >>> MIGRATION: 20261007_user_invites.sql <<<
CREATE TABLE public.user_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  role public.app_role NOT NULL DEFAULT 'funcionario',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  utilizado BOOLEAN NOT NULL DEFAULT false
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_invites TO authenticated;
GRANT SELECT ON public.user_invites TO anon;

ALTER TABLE public.user_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin pode gerenciar convites" ON public.user_invites FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "Anon pode ler convites" ON public.user_invites FOR SELECT TO anon USING (true);
CREATE POLICY "Auth pode ler convites" ON public.user_invites FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth pode atualizar convites" ON public.user_invites FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


-- >>> MIGRATION: 20261007_new_roles.sql <<<
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cozinha';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'caixa';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gerente';
- -   M i g r a t i o n :   2 0 2 6 1 0 0 9 _ m e s a s . s q l  
 - -   A d i c i o n a   a   e s t r u t u r a   d e   m e s a s   e   v � � n c u l o   c o m   c o m a n d a s .  
  
 C R E A T E   T A B L E   p u b l i c . m e s a s   (  
         i d   U U I D   P R I M A R Y   K E Y   D E F A U L T   g e n _ r a n d o m _ u u i d ( ) ,  
         n u m e r o   T E X T   N O T   N U L L   U N I Q U E ,   - -   e x :   " M e s a   1 " ,   " 0 1 "  
         s t a t u s   T E X T   N O T   N U L L   D E F A U L T   ' l i v r e ' ,   - -   ' l i v r e ' ,   ' o c u p a d a '  
         a b e r t a _ e m   T I M E S T A M P T Z ,  
         r e s p o n s a v e l _ n o m e   T E X T ,  
         h a s h _ q r   T E X T   N O T   N U L L   U N I Q U E   D E F A U L T   e n c o d e ( g e n _ r a n d o m _ b y t e s ( 8 ) ,   ' h e x ' ) ,  
         c r e a t e d _ a t   T I M E S T A M P T Z   N O T   N U L L   D E F A U L T   N O W ( )  
 ) ;  
  
 - -   A d i c i o n a   m e s a _ i d   e m   p e d i d o s  
 A L T E R   T A B L E   p u b l i c . p e d i d o s   A D D   C O L U M N   m e s a _ i d   U U I D   R E F E R E N C E S   p u b l i c . m e s a s ( i d )   O N   D E L E T E   S E T   N U L L ;  
  
 - -   A t u a l i z a r   R P C   d e   a b r i r _ c o m a n d a   p a r a   a c e i t a r   _ m e s a _ i d  
 C R E A T E   O R   R E P L A C E   F U N C T I O N   p u b l i c . a b r i r _ c o m a n d a (  
     _ c l i e n t e _ i d   U U I D   D E F A U L T   N U L L ,  
     _ c l i e n t e _ n o m e   T E X T   D E F A U L T   N U L L ,  
     _ c l i e n t e _ t e l e f o n e   T E X T   D E F A U L T   N U L L ,  
     _ o b s e r v a c o e s   T E X T   D E F A U L T   N U L L ,  
     _ m e s a _ i d   U U I D   D E F A U L T   N U L L  
 )  
 R E T U R N S   p u b l i c . p e d i d o s  
 L A N G U A G E   p l p g s q l  
 S E C U R I T Y   D E F I N E R  
 A S   $ $  
 D E C L A R E  
     v _ c l i e n t e _ i d   U U I D   : =   _ c l i e n t e _ i d ;  
     v _ p e d i d o   p u b l i c . p e d i d o s ;  
 B E G I N  
     - -   S e   n � � o   m a n d o u   I D   m a s   m a n d o u   n o m e / t e l e f o n e   ( C l i e n t e   r � � p i d o / B a l c � � o ) ,   c r i a   o u   a c h a  
     I F   v _ c l i e n t e _ i d   I S   N U L L   A N D   ( _ c l i e n t e _ n o m e   I S   N O T   N U L L   O R   _ c l i e n t e _ t e l e f o n e   I S   N O T   N U L L )   T H E N  
         I F   _ c l i e n t e _ t e l e f o n e   I S   N O T   N U L L   T H E N  
             S E L E C T   i d   I N T O   v _ c l i e n t e _ i d   F R O M   p u b l i c . c l i e n t e s   W H E R E   t e l e f o n e   =   _ c l i e n t e _ t e l e f o n e   L I M I T   1 ;  
         E N D   I F ;  
          
         I F   v _ c l i e n t e _ i d   I S   N U L L   T H E N  
             I N S E R T   I N T O   p u b l i c . c l i e n t e s   ( n o m e ,   t e l e f o n e )  
             V A L U E S   ( C O A L E S C E ( _ c l i e n t e _ n o m e ,   ' C o n s u m i d o r ' ) ,   _ c l i e n t e _ t e l e f o n e )  
             R E T U R N I N G   i d   I N T O   v _ c l i e n t e _ i d ;  
         E N D   I F ;  
     E N D   I F ;  
  
     - -   I n s e r e   o   p e d i d o   ( c o m a n d a   v a z i a )  
     I N S E R T   I N T O   p u b l i c . p e d i d o s   (  
         c l i e n t e _ i d ,    
         o b s e r v a c o e s ,  
         s t a t u s _ c o m a n d a ,    
         s t a t u s _ p a g a m e n t o ,    
         s t a t u s _ p r e p a r o ,  
         m e s a _ i d  
     )  
     V A L U E S   (  
         v _ c l i e n t e _ i d ,  
         _ o b s e r v a c o e s ,  
         ' a b e r t a ' ,  
         ' p e n d e n t e ' ,  
         ' n o v o ' ,  
         _ m e s a _ i d  
     )  
     R E T U R N I N G   *   I N T O   v _ p e d i d o ;  
  
     - -   S e   f o i   a s s o c i a d o   a   u m a   m e s a ,   g a r a n t i r   q u e   a   m e s a   c o n s t e   c o m o   o c u p a d a  
     I F   _ m e s a _ i d   I S   N O T   N U L L   T H E N  
         U P D A T E   p u b l i c . m e s a s    
         S E T   s t a t u s   =   ' o c u p a d a ' ,  
                 a b e r t a _ e m   =   C O A L E S C E ( a b e r t a _ e m ,   N O W ( ) ) ,  
                 r e s p o n s a v e l _ n o m e   =   C O A L E S C E ( r e s p o n s a v e l _ n o m e ,   v _ p e d i d o . c l i e n t e _ n o m e )   - -   p s e u d o   l � � g i c a ;   a j u s t a d a   d e p o i s  
         W H E R E   i d   =   _ m e s a _ i d   A N D   s t a t u s   =   ' l i v r e ' ;  
     E N D   I F ;  
  
     R E T U R N   v _ p e d i d o ;  
 E N D ;  
 $ $ ;  
 