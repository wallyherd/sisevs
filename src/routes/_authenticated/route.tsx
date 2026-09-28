import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
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

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
