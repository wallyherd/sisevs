import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, perfil, loading } = useAuth();
  const navigate = useNavigate();

  const [tempoExcedido, setTempoExcedido] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTempoExcedido(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if ((!loading && !user) || (tempoExcedido && !user)) {
      navigate({ to: "/auth", replace: true });
    }
  }, [user, loading, tempoExcedido, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Carregando FitLife SisEVS...</span>
          {tempoExcedido && !user && (
            <a
              href="/auth"
              className="text-xs text-emerald-600 hover:underline mt-2 font-medium"
            >
              Clique aqui para ir para a tela de Login →
            </a>
          )}
        </div>
      </div>
    );
  }

  // Se o usuário estiver suspenso por um administrador
  if (perfil && perfil.ativo === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
        <div className="max-w-md w-full bg-card p-6 rounded-2xl border border-destructive/20 shadow-lg text-center space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="size-6" />
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">Acesso Suspenso</h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              O acesso desta conta foi suspenso temporariamente por um administrador do sistema.
              Entre em contato com o responsável pelo estabelecimento para solicitar a reativação.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="text-xs"
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
