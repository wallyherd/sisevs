-- 1. Adicionar papel 'cliente' no enum app_role (ignora se já existir usando um bloco DO)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'app_role' AND e.enumlabel = 'cliente') THEN
    ALTER TYPE public.app_role ADD VALUE 'cliente';
  END IF;
END
$$;

-- 2. Adicionar coluna auth_user_id na tabela clientes para vincular a conta de auth
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Criar constraint UNIQUE para garantir que 1 usuário de auth só tenha 1 registro de cliente
-- Pode falhar se já houver lixo, mas em um sistema novo é tranquilo. Se falhar, a gente trata.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_auth_user_id_key'
  ) THEN
    ALTER TABLE public.clientes ADD CONSTRAINT clientes_auth_user_id_key UNIQUE (auth_user_id);
  END IF;
END $$;

-- 4. Atualizar o Trigger de Criação de Usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.raw_user_meta_data->>'is_cliente' = 'true' THEN
    -- Inserir o perfil como 'cliente'
    INSERT INTO public.users_profiles (user_id, nome, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
      NEW.email,
      'cliente'::public.app_role
    );

    -- Inserir ou atualizar na tabela de clientes usando o telefone como chave
    IF NEW.raw_user_meta_data->>'telefone' IS NOT NULL THEN
      INSERT INTO public.clientes (nome, telefone, auth_user_id, por_quem_veio)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        NEW.raw_user_meta_data->>'telefone',
        NEW.id,
        'Cardápio Digital'
      )
      ON CONFLICT (telefone) DO UPDATE SET 
        auth_user_id = EXCLUDED.auth_user_id,
        nome = CASE WHEN public.clientes.nome = 'Cliente Cardápio' OR public.clientes.nome IS NULL THEN EXCLUDED.nome ELSE public.clientes.nome END;
    ELSE
      -- Se não tiver telefone (o que não deve acontecer no nosso fluxo, mas por garantia)
      INSERT INTO public.clientes (nome, auth_user_id, por_quem_veio)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
        NEW.id,
        'Cardápio Digital'
      );
    END IF;
  ELSE
    -- Comportamento original para funcionários/admins
    INSERT INTO public.users_profiles (user_id, nome, email, role)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
      NEW.email,
      CASE WHEN (SELECT COUNT(*) FROM public.users_profiles) = 0 THEN 'admin'::public.app_role ELSE 'funcionario'::public.app_role END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Atualizar as políticas da tabela clientes para que o próprio cliente possa ver e atualizar seus dados
DROP POLICY IF EXISTS "Cliente: ler seus proprios dados" ON public.clientes;
CREATE POLICY "Cliente: ler seus proprios dados" ON public.clientes FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Cliente: atualizar seus proprios dados" ON public.clientes;
CREATE POLICY "Cliente: atualizar seus proprios dados" ON public.clientes FOR UPDATE TO authenticated USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());
