import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface PerfilUsuario {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  role: "admin" | "funcionario" | "cliente";
  pode_ver_financeiro: boolean;
  ativo: boolean;
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
        if (data.session?.user) {
          await loadPerfil(data.session.user);
        }
      } catch (err) {
        console.error("[useAuth] Erro ao obter sessão:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        await loadPerfil(sess.user);
      } else {
        setPerfil(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function loadPerfil(currentUser: User) {
    try {
      // 1. Tenta carregar por user_id
      let { data } = await supabase
        .from("users_profiles")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      // 2. Se não encontrou por user_id, busca por email para recuperar vínculos antigos
      if (!data && currentUser.email) {
        const { data: byEmail } = await supabase
          .from("users_profiles")
          .select("*")
          .eq("email", currentUser.email)
          .maybeSingle();

        if (byEmail) {
          data = byEmail;
          // Corrige user_id no banco se estiver diferente
          if (byEmail.user_id !== currentUser.id) {
            await supabase
              .from("users_profiles")
              .update({ user_id: currentUser.id })
              .eq("id", byEmail.id);
          }
        }
      }

      // 3. Se ainda assim não existe registro, cria perfil automaticamente
      if (!data && currentUser.email) {
        const isMaster = currentUser.email === "whdourado@gmail.com";
        const metaRole = (currentUser.user_metadata?.role as "admin" | "funcionario" | "cliente") || (isMaster ? "admin" : "funcionario");
        const metaNome = (currentUser.user_metadata?.nome as string) || currentUser.email.split("@")[0];

        const { data: created } = await supabase
          .from("users_profiles")
          .upsert({
            user_id: currentUser.id,
            email: currentUser.email,
            nome: metaNome,
            role: metaRole,
            pode_ver_financeiro: isMaster || metaRole === "admin",
            ativo: true,
          })
          .select()
          .maybeSingle();

        if (created) data = created;
      }

      if (data) {
        setPerfil(data as PerfilUsuario);
      }
    } catch (err) {
      console.error("[useAuth] Erro ao carregar perfil:", err);
    }
  }

  // Identificação infalível de privilégios de administrador
  const isMasterAdmin = user?.email === "whdourado@gmail.com";
  const metaRole = (user?.user_metadata?.role as "admin" | "funcionario" | "cliente" | undefined) ||
                   (user?.app_metadata?.role as "admin" | "funcionario" | "cliente" | undefined);
  
  const role: "admin" | "funcionario" | "cliente" =
    perfil?.role ||
    metaRole ||
    (isMasterAdmin ? "admin" : "funcionario");

  const isAdmin = role === "admin" || isMasterAdmin;
  const podeFinanceiro =
    isAdmin ||
    perfil?.pode_ver_financeiro === true ||
    user?.user_metadata?.pode_ver_financeiro === true;

  // Garante que o perfil retornado contenha dados utilizáveis mesmo antes do carregamento assíncrono
  const perfilEfetivo: PerfilUsuario | null = perfil
    ? {
        ...perfil,
        role,
        nome: perfil.nome || (user?.user_metadata?.nome as string) || (user?.email?.split("@")[0] ?? "Usuário"),
        pode_ver_financeiro: podeFinanceiro,
      }
    : user
    ? {
        id: user.id,
        user_id: user.id,
        nome: (user.user_metadata?.nome as string) || (user.email?.split("@")[0] ?? "Usuário"),
        email: user.email ?? null,
        role,
        pode_ver_financeiro: podeFinanceiro,
        ativo: true,
      }
    : null;

  return {
    session,
    user,
    perfil: perfilEfetivo,
    loading,
    isAdmin,
    podeFinanceiro,
  };
}
