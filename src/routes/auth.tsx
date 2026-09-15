import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Leaf, ShieldCheck, Zap, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";
import { loginSchema, signupSchema, formatZodError } from "@/lib/validations";
import { handleError } from "@/lib/errors";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.user) throw redirect({ to: "/" });
    } catch (err) {
      if ((err as any)?.to) throw err;
    }
  },
  head: () => ({ meta: [{ title: "Acessar Sistema — FitLife SisEVS" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = mode === "login"
      ? loginSchema.safeParse({ email, password })
      : signupSchema.safeParse({ email, password, nome });
    if (!parsed.success) { toast.error(formatZodError(parsed.error)); return; }
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { nome },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: loginErr } = await supabase.auth.signInWithPassword({ email, password });
          if (loginErr) throw loginErr;
        }
        toast.success("Conta criada com sucesso!");
        navigate({ to: "/" });
      }
    } catch (err) {
      handleError(err, "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-background text-foreground">
      {/* Left Column: Brand Hero & Presentation */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-5 bg-gradient-to-b from-[#061e16] via-[#041610] to-[#020b08] text-white p-12 flex-col justify-between relative overflow-hidden border-r border-[#0e3d2f]">
        {/* Subtle Ambient Glow */}
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        {/* Top Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="size-12 rounded-2xl overflow-hidden bg-white/95 p-1 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <img src="/logo.png" alt="FitLife" className="size-full object-contain" />
          </div>
          <div>
            <div className="font-heading text-lg font-bold tracking-tight text-white flex items-center gap-2">
              FitLife
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                SisEVS
              </span>
            </div>
            <div className="text-xs text-slate-400">Espaço Vida Saudável</div>
          </div>
        </div>

        {/* Center Presentation */}
        <div className="relative z-10 my-auto py-12 space-y-8">
          <div className="space-y-4 max-w-md">
            <h2 className="text-3xl font-heading font-bold text-white leading-tight">
              Controle absoluto do seu espaço com precisão profissional.
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Agilidade nas comandas, integração em tempo real com a cozinha, auditoria minuciosa e fechamento de caixa sem discrepâncias.
            </p>
          </div>

          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-3 text-xs text-slate-200 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
              <Zap className="size-4 text-emerald-400 shrink-0" />
              <span>Fila de preparo e comandas com sincronização instantânea</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
              <BarChart3 className="size-4 text-emerald-400 shrink-0" />
              <span>DRE automático, métricas de faturamento e margem real</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-200 bg-white/5 p-3 rounded-lg border border-white/10 backdrop-blur-sm">
              <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
              <span>Segurança avançada com controle de perfis e permissões</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-6 border-t border-white/10">
          <span>FitLife SisEVS &copy; {new Date().getFullYear()}</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" /> Sistema Operacional
          </span>
        </div>
      </div>

      {/* Right Column: Authentication Card */}
      <div className="lg:col-span-7 xl:col-span-7 flex items-center justify-center p-6 md:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Brand Header */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-2">
            <div className="size-10 rounded-xl overflow-hidden bg-white/95 p-1 border border-emerald-500/30 flex items-center justify-center shadow-md">
              <img src="/logo.png" alt="FitLife" className="size-full object-contain" />
            </div>
            <div>
              <div className="font-heading text-lg font-bold leading-tight">FitLife</div>
              <div className="text-[10px] text-muted-foreground">Espaço Vida Saudável</div>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight">
              {mode === "login" ? "Entrar na sua conta" : "Criar nova conta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Informe suas credenciais para acessar o painel operacional."
                : "Cadastre-se. A primeira conta registrada terá privilégios de administrador."}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs font-semibold">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Carlos Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="h-10 text-sm"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold">E-mail corporativo</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-semibold">Senha de acesso</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="h-10 text-sm"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-sm transition-all"
              disabled={loading}
            >
              {loading ? (
                "Autenticando..."
              ) : mode === "login" ? (
                <>
                  Entrar no Painel <ArrowRight className="size-4" />
                </>
              ) : (
                <>
                  Criar Conta e Acessar <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {/* Switch Mode */}
          <div className="pt-2 text-center text-sm text-muted-foreground border-t border-border">
            {mode === "login" ? (
              <span>
                Primeira vez no sistema?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Criar conta
                </button>
              </span>
            ) : (
              <span>
                Já possui uma conta ativa?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Fazer login
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
