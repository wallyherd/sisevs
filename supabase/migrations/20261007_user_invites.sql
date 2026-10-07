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
