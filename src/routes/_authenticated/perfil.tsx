import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User,
  KeyRound,
  Shield,
  Upload,
  CheckCircle2,
  Lock,
  Mail,
  Calendar,
  Save,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { handleError } from "@/lib/errors";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({ meta: [{ title: "Meu Perfil — FitLife SisEVS" }] }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, perfil, isAdmin, podeFinanceiro } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);

  // Estados para alteração de senha
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    if (perfil?.nome) {
      setNome(perfil.nome);
    } else if (user?.user_metadata?.nome) {
      setNome(user.user_metadata.nome);
    }
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [perfil, user]);

  // Manipular upload de imagem local
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      toast.success("Foto selecionada! Clique em 'Salvar Dados' para confirmar.");
    };
    reader.readAsDataURL(file);
  }

  // Salvar alterações no perfil
  async function handleSalvarPerfil(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!nome.trim()) {
      toast.error("O nome não pode ficar vazio.");
      return;
    }

    setSalvandoPerfil(true);
    try {
      // 1. Atualiza user_metadata no Auth do Supabase
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          nome: nome.trim(),
          avatar_url: avatarUrl,
        },
      });
      if (authError) throw authError;

      // 2. Atualiza a tabela pública users_profiles
      const { error: profileError } = await supabase
        .from("users_profiles")
        .update({
          nome: nome.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      toast.success("Perfil atualizado com sucesso!");
    } catch (err) {
      handleError(err, "Erro ao atualizar perfil");
    } finally {
      setSalvandoPerfil(false);
    }
  }

  // Alterar senha do usuário
  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas digitadas não coincidem.");
      return;
    }

    setSalvandoSenha(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      if (error) throw error;

      toast.success("Senha alterada com sucesso!");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err) {
      handleError(err, "Erro ao alterar senha");
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold tracking-tight text-foreground">
            Meu Perfil
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-1">
            Gerencie suas informações pessoais, foto de exibição e credenciais de segurança.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-xs font-semibold gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Conta Ativa
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Overview */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-border/80 shadow-xs text-center p-6 space-y-4">
            <div className="relative mx-auto size-28 rounded-2xl overflow-hidden border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-md">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={nome || "Avatar"}
                  className="size-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold font-heading">
                  {(nome || "U").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <h2 className="font-heading font-bold text-lg text-foreground truncate">
                {nome || perfil?.nome || (user?.user_metadata?.nome as string) || "Usuário"}
              </h2>
              <p className="text-xs text-muted-foreground truncate">{perfil?.email || user?.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <Badge variant={isAdmin ? "default" : "secondary"} className={`text-[11px] uppercase font-bold tracking-wider ${isAdmin ? "bg-emerald-600 text-white" : ""}`}>
                {isAdmin ? "Administrador" : "Funcionário"}
              </Badge>
              {podeFinanceiro && (
                <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30">
                  Acesso Financeiro
                </Badge>
              )}
            </div>

            <div className="pt-4 border-t border-border flex flex-col gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full text-xs gap-1.5 h-9"
              >
                <Upload className="size-3.5" /> Alterar Foto
              </Button>
              {avatarUrl && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAvatarUrl(null);
                    toast.info("Foto removida. Salve para confirmar.");
                  }}
                  className="w-full text-xs text-destructive hover:text-destructive h-8"
                >
                  <Trash2 className="size-3.5 mr-1" /> Remover Foto
                </Button>
              )}
            </div>
          </Card>

          {/* Account Details Card */}
          <Card className="border-border/80 shadow-xs p-5 space-y-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-semibold text-foreground pb-2 border-b border-border">
              <Shield className="size-4 text-emerald-600" /> Detalhes da Conta
            </div>
            <div className="flex justify-between py-1">
              <span>Tipo de Acesso:</span>
              <span className="font-semibold text-foreground capitalize">
                {isAdmin ? "Administrador" : (perfil?.role || "Operador")}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Status no Sistema:</span>
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Ativo
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Cadastrado em:</span>
              <span className="font-medium text-foreground">
                {perfil?.created_at ? format(new Date(perfil.created_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
              </span>
            </div>
          </Card>
        </div>

        {/* Right Column: Edit Info & Password Change */}
        <div className="md:col-span-2 space-y-6">
          {/* Card: Personal Information */}
          <Card className="border-border/80 shadow-xs">
            <form onSubmit={handleSalvarPerfil}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <User className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-base font-semibold">
                      Informações Pessoais
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Atualize seu nome de exibição e preferências.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nome" className="text-xs font-semibold">Nome Completo</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">E-mail Cadastrado</Label>
                  <div className="relative">
                    <Input
                      id="email"
                      value={perfil?.email || user?.email || ""}
                      disabled
                      className="h-10 text-sm bg-muted/60 text-muted-foreground pr-10"
                    />
                    <Mail className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    O e-mail é utilizado como identificador de login no sistema.
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/80 flex justify-end">
                <Button
                  type="submit"
                  disabled={salvandoPerfil}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-9 shadow-xs"
                >
                  <Save className="size-3.5" />
                  {salvandoPerfil ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </CardFooter>
            </form>
          </Card>

          {/* Card: Security & Change Password */}
          <Card className="border-border/80 shadow-xs">
            <form onSubmit={handleAlterarSenha}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                    <KeyRound className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="font-heading text-base font-semibold">
                      Segurança e Senha
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Altere sua senha de acesso ao FitLife SisEVS.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="novaSenha" className="text-xs font-semibold">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="novaSenha"
                        type={mostrarSenha ? "text" : "password"}
                        value={novaSenha}
                        onChange={(e) => setNovaSenha(e.target.value)}
                        placeholder="Mínimo 6 dígitos"
                        minLength={6}
                        required
                        className="h-10 text-sm pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarSenha(!mostrarSenha)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {mostrarSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmarSenha" className="text-xs font-semibold">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmarSenha"
                      type={mostrarSenha ? "text" : "password"}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      minLength={6}
                      required
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-secondary/50 border border-border/60 text-xs text-muted-foreground space-y-1">
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <Lock className="size-3 text-emerald-600" /> Dica de segurança:
                  </div>
                  <p>Escolha uma senha forte combinando letras, números e símbolos especiais para proteger suas operações.</p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 border-t border-border/80 flex justify-end">
                <Button
                  type="submit"
                  disabled={salvandoSenha || !novaSenha}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-1.5 h-9 shadow-xs"
                >
                  <KeyRound className="size-3.5" />
                  {salvandoSenha ? "Atualizando..." : "Atualizar Senha"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
