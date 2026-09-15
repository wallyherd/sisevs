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
