import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Plus,
  ChefHat,
  Users,
  Package,
  Boxes,
  Sparkles,
  Wallet,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Leaf,
  Menu,
  Receipt,
  Banknote,
  Blocks,
  ShieldCheck,
  ChevronRight,
  User,
  MessageSquareText,
  Copy,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { GlobalSearch } from "./global-search";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  financeiroOnly?: boolean;
  mobilePrimary?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Operação",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, mobilePrimary: true },
      { to: "/pedidos", label: "Comandas", icon: Receipt, mobilePrimary: true },
      { to: "/cozinha", label: "Cozinha", icon: ChefHat, mobilePrimary: true },
    ],
  },
  {
    title: "Catálogo & Clientes",
    items: [
      { to: "/produtos", label: "Produtos", icon: Package },
      { to: "/estoque", label: "Estoque", icon: Boxes },
      { to: "/composicao", label: "Composição", icon: Blocks, adminOnly: true },
      { to: "/crm", label: "CRM & WhatsApp", icon: MessageSquareText },
      { to: "/clientes", label: "Clientes", icon: Users },
    ],
  },
  {
    title: "Gestão & Finanças",
    items: [
      { to: "/caixa", label: "Caixa", icon: Banknote },
      { to: "/financeiro", label: "Financeiro", icon: Wallet, financeiroOnly: true },
      { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
      { to: "/auditoria", label: "Auditoria", icon: ShieldCheck, adminOnly: true },
      { to: "/usuarios", label: "Usuários & Equipe", icon: Users, adminOnly: true },
      { to: "/configuracoes", label: "Configurações", icon: Settings, adminOnly: true },
    ],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, perfil, isAdmin, podeFinanceiro } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [moreOpen, setMoreOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const filterItem = (item: NavItem) => {
    if (!perfil) return false;
    const role = perfil.role;
    
    if (role === "admin") return true;
    if (role === "gerente") return !item.adminOnly;
    
    if (role === "cozinha") {
      return item.to === "/cozinha";
    }
    
    if (role === "caixa") {
      return ["/caixa", "/financeiro", "/relatorios"].includes(item.to);
    }
    
    // Funcionario (default fallback)
    if (item.adminOnly) return false;
    if (item.financeiroOnly) return false;
    const gestaoRoutes = ["/caixa", "/financeiro", "/relatorios", "/auditoria", "/usuarios", "/configuracoes"];
    if (gestaoRoutes.includes(item.to)) return false;
    
    return true;
  };

  // Filtragem dos grupos para esconder grupos vazios
  const visibleGroups = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(filterItem)
  })).filter(g => g.items.length > 0);

  const allVisibleItems = visibleGroups.flatMap((g) => g.items);
  const mobilePrimary = allVisibleItems.filter((n) => n.mobilePrimary).slice(0, 4);
  const moreItems = allVisibleItems.filter((n) => !mobilePrimary.includes(n));

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen flex bg-background text-foreground selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col text-sidebar-foreground border-r border-sidebar-border bg-sidebar">
        {/* Brand Header */}
        <div className="px-5 h-16 flex items-center gap-3 border-b border-sidebar-border">
          <div className="size-10 rounded-xl overflow-hidden bg-white/95 p-1 border border-emerald-500/30 flex items-center justify-center shadow-md shadow-emerald-950/40">
            <img src="/logo.png" alt="FitLife" className="size-full object-contain" />
          </div>
          <div className="leading-none">
            <div className="font-heading font-semibold text-base tracking-tight text-white flex items-center gap-1.5">
              FitLife
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-sidebar-foreground/50 mt-1">Espaço Vida Saudável</div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => {
            const visibleGroupItems = group.items.filter(filterItem);
            if (visibleGroupItems.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-1.5">
                  {group.title}
                </div>
                {visibleGroupItems.map((item) => {
                  const active = isActive(pathname, item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to as any}
                      className={
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 " +
                        (active
                          ? "bg-sidebar-accent text-white font-semibold shadow-xs"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white")
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-emerald-400" />
                      )}
                      <Icon
                        className={
                          "size-4 shrink-0 transition-colors " +
                          (active ? "text-emerald-400" : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80")
                        }
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent/60 text-left transition-colors group">
                <div className="relative size-8 rounded-lg overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Avatar" className="size-full object-cover" />
                  ) : (
                    (perfil?.nome ?? "U").slice(0, 2).toUpperCase()
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-400 border-2 border-sidebar" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{perfil?.nome ?? "Usuário"}</div>
                  <div className="text-[11px] text-sidebar-foreground/50 capitalize truncate">
                    {perfil?.role ?? "Operador"}
                  </div>
                </div>
                <ChevronRight className="size-4 text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60 transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground truncate">
                {perfil?.email || user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/perfil" className="cursor-pointer flex items-center">
                  <User className="mr-2 size-4 text-emerald-500" /> Meu Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 size-4" /> Sair da conta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-md flex items-center justify-between gap-4 px-4 md:px-8">
          {/* Mobile menu trigger */}
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 text-sidebar-foreground border-sidebar-border bg-sidebar flex flex-col">
                <div className="px-5 h-16 flex items-center gap-3 border-b border-sidebar-border">
                  <div className="size-10 rounded-xl overflow-hidden bg-white/95 p-1 border border-emerald-500/30 flex items-center justify-center shadow-md">
                    <img src="/logo.png" alt="FitLife" className="size-full object-contain" />
                  </div>
                  <div>
                    <div className="font-heading font-semibold text-white text-base leading-none">FitLife</div>
                    <div className="text-[10px] text-sidebar-foreground/50 mt-1">Espaço Vida Saudável</div>
                  </div>
                </div>
                <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
                  {NAV_GROUPS.map((group) => {
                    const visibleGroupItems = group.items.filter(filterItem);
                    if (visibleGroupItems.length === 0) return null;
                    return (
                      <div key={group.title} className="space-y-1">
                        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-foreground/40 mb-1">
                          {group.title}
                        </div>
                        {visibleGroupItems.map((item) => {
                          const Icon = item.icon;
                          const active = isActive(pathname, item.to);
                          return (
                            <Link
                              key={item.to}
                              to={item.to as any}
                              className={
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium " +
                                (active ? "bg-sidebar-accent text-white" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50")
                              }
                            >
                              <Icon className="size-4" /> {item.label}
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            {/* Quick Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 h-9 px-3 rounded-lg bg-secondary hover:bg-muted text-muted-foreground text-xs font-normal border border-border transition-all duration-150 w-64 md:w-80"
            >
              <Search className="size-3.5 shrink-0" />
              <span className="truncate">Buscar comandas, clientes, produtos...</span>
              <kbd className="ml-auto text-[10px] font-semibold bg-background px-1.5 py-0.5 rounded border border-border shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <div className="hidden md:flex items-center gap-1">
                <Button variant="outline" size="sm" asChild className="h-9">
                  <a href="/cardapio" target="_blank" rel="noopener noreferrer">
                    <Smartphone className="size-4 mr-2" />
                    Cardápio
                  </a>
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + '/cardapio');
                  toast.success('Link do cardápio copiado!');
                }} title="Copiar link do cardápio genérico">
                  <Copy className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 max-w-[1440px] w-full mx-auto min-w-0">
          {children}
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-sidebar text-sidebar-foreground border-t border-sidebar-border">
          <div className="grid grid-cols-5">
            {mobilePrimary.map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as any}
                  className={
                    "flex flex-col items-center justify-center py-2.5 text-[11px] gap-1 " +
                    (active ? "text-emerald-400 font-semibold" : "text-sidebar-foreground/60")
                  }
                >
                  <Icon className="size-5" />
                  <span className="truncate max-w-full px-1">{item.label.split(" ")[0]}</span>
                </Link>
              );
            })}
            <button
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center py-2.5 text-[11px] gap-1 text-sidebar-foreground/60"
            >
              <Menu className="size-5" />
              <span>Mais</span>
            </button>
          </div>
        </nav>

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl">
            <div className="grid grid-cols-3 gap-3 py-2">
              <Link
                to="/perfil"
                onClick={() => setMoreOpen(false)}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-muted text-foreground transition-colors"
              >
                <User className="size-5 text-emerald-600" />
                <span className="text-xs text-center font-medium">Meu Perfil</span>
              </Link>
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to as any}
                    onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-secondary hover:bg-muted text-foreground transition-colors"
                  >
                    <Icon className="size-5 text-emerald-600" />
                    <span className="text-xs text-center font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
              >
                <LogOut className="size-5" />
                <span className="text-xs font-medium">Sair</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>

        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

        {/* Quick Actions FAB */}
        <div className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function QuickActions() {
  const { podeFinanceiro } = useAuth();
  
  const handleCopyCardapio = () => {
    const url = `${window.location.origin}/cardapio`;
    navigator.clipboard.writeText(url);
    toast.success("Link do cardápio copiado!");
  };
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" className="size-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30">
          <Plus className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Criar Rápido
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/pedidos/novo" className="cursor-pointer">Nova comanda</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/clientes" className="cursor-pointer">Novo cliente</Link>
        </DropdownMenuItem>
        {podeFinanceiro && (
          <DropdownMenuItem asChild>
            <Link to="/financeiro" className="cursor-pointer">Lançamento financeiro</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/estoque" className="cursor-pointer">Movimentar estoque</Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Cardápio Digital
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/cardapio" target="_blank" className="cursor-pointer">Visualizar cardápio</a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyCardapio} className="cursor-pointer">
          Copiar link para enviar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
