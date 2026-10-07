import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, PerfilUsuario } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  UserCheck,
  UserX,
  Wallet,
  Clock,
  AlertTriangle,
  RefreshCw,
  Mail,
  User,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/usuarios")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    try {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session?.user) throw redirect({ to: "/auth" });
      const user = s.session.user;
      if (user.email === "whdourado@gmail.com" || user.user_metadata?.role === "admin") return;
      const { data: perfil } = await supabase
        .from("users_profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!perfil || perfil.role !== "admin") throw redirect({ to: "/" });
    } catch (err) {
      if ((err as any)?.to) throw err;
      throw redirect({ to: "/auth" });
    }
  },
  head: () => ({ meta: [{ title: "Usuários & Equipe — FitLife" }] }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [busca, setBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState<"todos" | "admin" | "funcionario">("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativos" | "suspensos">("todos");

  // Modal de confirmação de ação crítica
  const [confirmModal, setConfirmModal] = useState<{
    tipo: "suspender" | "reativar" | "promover_admin" | "remover_admin";
    usuario: PerfilUsuario;
  } | null>(null);

  // Modal para convidar usuário
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNome, setInviteNome] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "funcionario">("funcionario");
  const [isInviting, setIsInviting] = useState(false);

  const { data: usuarios = [], isLoading, refetch } = useQuery({
    queryKey: ["users-profiles-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users_profiles")
        .select("*")
        .order("role", { ascending: true })
        .order("nome", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar lista de usuários: " + error.message);
        return [];
      }
      return (data ?? []) as PerfilUsuario[];
    },
  });

  // Atualizar propriedades do usuário
  async function atualizarUsuario(id: string, patch: Partial<PerfilUsuario>, msgSucesso: string) {
    const { error } = await supabase
      .from("users_profiles")
      .update(patch)
      .eq("id", id);

    if (error) {
      toast.error(`Erro ao atualizar: ${error.message}`);
    } else {
      toast.success(msgSucesso);
      qc.invalidateQueries({ queryKey: ["users-profiles-admin"] });
      qc.invalidateQueries({ queryKey: ["users-profiles"] });
    }
  }

  // Executar ação confirmada
  async function handleConfirmAction() {
    if (!confirmModal) return;
    const { tipo, usuario } = confirmModal;

    if (tipo === "suspender") {
      await atualizarUsuario(
        usuario.id,
        { ativo: false },
        `Acesso de ${usuario.nome} suspenso com sucesso!`
      );
    } else if (tipo === "reativar") {
      await atualizarUsuario(
        usuario.id,
        { ativo: true },
        `Acesso de ${usuario.nome} reativado!`
      );
    } else if (tipo === "promover_admin") {
      await atualizarUsuario(
        usuario.id,
        { role: "admin", pode_ver_financeiro: true },
        `${usuario.nome} agora é um Administrador!`
      );
    } else if (tipo === "remover_admin") {
      await atualizarUsuario(
        usuario.id,
        { role: "funcionario" },
        `Permissões de administrador de ${usuario.nome} revogadas.`
      );
    }

    setConfirmModal(null);
  }

  async function handleInviteUser(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail || !inviteNome) return;
    setIsInviting(true);
    
    // Inserir na tabela user_invites
    const { error } = await supabase.from("user_invites").insert({
      email: inviteEmail.trim().toLowerCase(),
      nome: inviteNome.trim(),
      role: inviteRole,
      created_by: currentUser?.id,
    });
    
    setIsInviting(false);
    
    if (error) {
      if (error.code === '23505') {
        toast.error("Já existe um convite ou usuário com este e-mail.");
      } else {
        toast.error("Erro ao gerar convite: " + error.message);
      }
    } else {
      toast.success("Usuário cadastrado com sucesso! Ele já pode acessar o sistema usando este e-mail para criar a senha.");
      setInviteModalOpen(false);
      setInviteEmail("");
      setInviteNome("");
      setInviteRole("funcionario");
    }
  }

  // Estatísticas
  const totalUsuarios = usuarios.length;
  const totalAdmins = usuarios.filter((u) => u.role === "admin").length;
  const totalAtivos = usuarios.filter((u) => u.ativo !== false).length;
  const totalSuspensos = usuarios.filter((u) => u.ativo === false).length;

  // Filtragem
  const usuariosFiltrados = usuarios.filter((u) => {
    const matchesBusca =
      !busca ||
      u.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (u.email && u.email.toLowerCase().includes(busca.toLowerCase()));

    const matchesRole =
      filtroRole === "todos" || u.role === filtroRole;

    const matchesStatus =
      filtroStatus === "todos" ||
      (filtroStatus === "ativos" && u.ativo !== false) ||
      (filtroStatus === "suspensos" && u.ativo === false);

    return matchesBusca && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <ShieldCheck className="size-5" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Gestão de Usuários & Equipe</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie quem tem acesso ao sistema, promova administradores e controle o status de cada membro da equipe.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs h-9 gap-1.5"
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar Lista</span>
          </Button>
          <Button
            size="sm"
            onClick={() => setInviteModalOpen(true)}
            className="text-xs h-9 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <UserCheck className="size-3.5" />
            <span>Cadastrar Novo Membro</span>
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <Card className="p-3.5 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total de Membros</span>
            <Users className="size-4 text-primary" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground mt-1">{totalUsuarios}</div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Cadastrados no sistema</span>
        </Card>

        <Card className="p-3.5 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Administradores</span>
            <Shield className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-heading font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalAdmins}</div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Acesso irrestrito a configurações</span>
        </Card>

        <Card className="p-3.5 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Membros Ativos</span>
            <UserCheck className="size-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-heading font-bold text-foreground mt-1">{totalAtivos}</div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Podem fazer login normalmente</span>
        </Card>

        <Card className="p-3.5 bg-card border-border/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Acessos Suspensos</span>
            <UserX className="size-4 text-destructive" />
          </div>
          <div className={`text-2xl font-heading font-bold mt-1 ${totalSuspensos > 0 ? "text-destructive" : "text-muted-foreground"}`}>
            {totalSuspensos}
          </div>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">Bloqueados de entrar no sistema</span>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="p-3.5 bg-card border-border/80">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              className="pl-8 text-xs h-9 bg-background"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filtroRole}
              onChange={(e) => setFiltroRole(e.target.value as any)}
              className="text-xs border rounded-md px-2.5 py-1.5 bg-background text-foreground h-9"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="admin">Apenas Administradores</option>
              <option value="funcionario">Apenas Funcionários</option>
            </select>

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as any)}
              className="text-xs border rounded-md px-2.5 py-1.5 bg-background text-foreground h-9"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativos">Apenas Ativos</option>
              <option value="suspensos">Apenas Suspensos</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de Usuários */}
      <div className="space-y-3">
        {usuariosFiltrados.map((u) => {
          const isMe = currentUser?.id === u.user_id;
          const isAdmin = u.role === "admin";
          const isAtivo = u.ativo !== false;

          return (
            <Card
              key={u.id}
              className={`p-4 bg-card border transition-all ${
                !isAtivo
                  ? "border-destructive/30 bg-destructive/5 opacity-80"
                  : isAdmin
                    ? "border-primary/40 shadow-2xs"
                    : "border-border/80"
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                {/* Dados do Usuário */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`size-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border ${
                      !isAtivo
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : isAdmin
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-secondary text-secondary-foreground border-border"
                    }`}
                  >
                    {u.nome.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm text-foreground truncate">{u.nome}</h3>
                      {isMe && (
                        <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.2 rounded-full font-bold">
                          Você
                        </span>
                      )}
                      <Badge
                        variant={isAdmin ? "default" : "secondary"}
                        className={`text-[10px] gap-1 ${
                          isAdmin
                            ? "bg-emerald-600 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {isAdmin ? <ShieldCheck className="size-3" /> : <User className="size-3" />}
                        {isAdmin ? "Administrador" : "Funcionário"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isAtivo
                            ? "text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
                            : "text-destructive border-destructive/40 bg-destructive/10"
                        }`}
                      >
                        {isAtivo ? "Ativo" : "Acesso Suspenso"}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground" />
                        {u.email || "Sem e-mail"}
                      </span>
                      {u.pode_ver_financeiro && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Wallet className="size-3" /> Acesso Financeiro Liberado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ações Administrativas */}
                <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-border/40">
                  {/* Switch Ver Financeiro */}
                  {!isAdmin && (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer px-2 py-1 rounded-md hover:bg-muted/40 transition-colors">
                      <Switch
                        checked={u.pode_ver_financeiro}
                        disabled={isMe || !isAtivo}
                        onCheckedChange={(v) =>
                          atualizarUsuario(
                            u.id,
                            { pode_ver_financeiro: v },
                            v ? `Acesso financeiro concedido a ${u.nome}` : `Acesso financeiro revogado de ${u.nome}`
                          )
                        }
                      />
                      <span>Financeiro</span>
                    </label>
                  )}

                  {/* Botão Conceder / Revogar Admin */}
                  {isAdmin ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isMe}
                      onClick={() =>
                        setConfirmModal({
                          tipo: "remover_admin",
                          usuario: u,
                        })
                      }
                      title={isMe ? "Você não pode remover seu próprio papel de administrador" : "Rebaixar para funcionário"}
                      className="text-xs h-8 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                    >
                      Remover Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!isAtivo}
                      onClick={() =>
                        setConfirmModal({
                          tipo: "promover_admin",
                          usuario: u,
                        })
                      }
                      className="text-xs h-8 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 gap-1"
                    >
                      <Shield className="size-3.5" />
                      <span>Tornar Admin</span>
                    </Button>
                  )}

                  {/* Botão Suspender / Reativar */}
                  {isAtivo ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isMe}
                      onClick={() =>
                        setConfirmModal({
                          tipo: "suspender",
                          usuario: u,
                        })
                      }
                      title={isMe ? "Você não pode suspender sua própria conta" : "Suspender acesso deste membro"}
                      className="text-xs h-8 gap-1"
                    >
                      <UserX className="size-3.5" />
                      <span>Suspender</span>
                    </Button>
                  ) : (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() =>
                        setConfirmModal({
                          tipo: "reativar",
                          usuario: u,
                        })
                      }
                      className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    >
                      <UserCheck className="size-3.5" />
                      <span>Reativar Acesso</span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {usuariosFiltrados.length === 0 && (
          <div className="py-16 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
            <Users className="size-8 mx-auto mb-2 opacity-30" />
            Nenhum usuário encontrado com os filtros aplicados.
          </div>
        )}
      </div>

      {/* Modal de Confirmação para Ações Críticas */}
      {confirmModal && (
        <Dialog open={!!confirmModal} onOpenChange={() => setConfirmModal(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 text-destructive font-heading font-bold text-base">
                <AlertTriangle className="size-5" />
                <DialogTitle>Confirmar Alteração de Acesso</DialogTitle>
              </div>
            </DialogHeader>

            <div className="py-3 text-xs text-muted-foreground space-y-2 leading-relaxed">
              {confirmModal.tipo === "suspender" && (
                <p>
                  Você tem certeza que deseja <strong>suspender o acesso de {confirmModal.usuario.nome}</strong>?
                  O usuário será imediatamente desconectado e ficará impedido de visualizar ou operar qualquer área do SisEVS.
                </p>
              )}

              {confirmModal.tipo === "reativar" && (
                <p>
                  Deseja <strong>reativar o acesso de {confirmModal.usuario.nome}</strong>?
                  O membro voltará a ter permissão de login no sistema.
                </p>
              )}

              {confirmModal.tipo === "promover_admin" && (
                <p>
                  Deseja <strong>conceder permissão de Administrador para {confirmModal.usuario.nome}</strong>?
                  Ele terá acesso total a configurações, gestão de estoque, controle financeiro e administração de outros usuários.
                </p>
              )}

              {confirmModal.tipo === "remover_admin" && (
                <p>
                  Deseja <strong>remover as permissões de Administrador de {confirmModal.usuario.nome}</strong>?
                  Ele passará a operar como funcionário padrão e perderá acesso a configurações sensíveis.
                </p>
              )}
            </div>

            <DialogFooter className="pt-2 border-t flex justify-between sm:justify-between items-center w-full">
              <Button variant="outline" size="sm" onClick={() => setConfirmModal(null)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                variant={confirmModal.tipo === "suspender" || confirmModal.tipo === "remover_admin" ? "destructive" : "default"}
                onClick={handleConfirmAction}
                className={confirmModal.tipo === "reativar" || confirmModal.tipo === "promover_admin" ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
              >
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      {/* Modal de Convite (Cadastro Inicial) */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent className="max-w-md">
          <form onSubmit={handleInviteUser}>
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Membro</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adicione um novo membro informando o <strong>e-mail</strong> e <strong>nome</strong>. O sistema irá gerar um acesso e no primeiro login, o próprio funcionário definirá sua senha pessoal.
              </p>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Nome Completo</label>
                <Input
                  value={inviteNome}
                  onChange={(e) => setInviteNome(e.target.value)}
                  placeholder="Ex: João da Silva"
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">E-mail Corporativo</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="text-sm h-10"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Cargo de Acesso</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as "admin" | "funcionario")}
                  className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="funcionario">Funcionário (Acesso restrito)</option>
                  <option value="admin">Administrador (Acesso total)</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setInviteModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isInviting}>
                {isInviting ? "Cadastrando..." : "Cadastrar Membro"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
