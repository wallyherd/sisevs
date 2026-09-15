import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { data } = await supabase.auth.getSession();
      if (!data?.session?.user) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.session.user };
    } catch (err) {
      if ((err as any)?.to) throw err; // Re-throw TanStack redirect
      throw redirect({ to: "/auth" });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Carregando FitLife SisEVS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
