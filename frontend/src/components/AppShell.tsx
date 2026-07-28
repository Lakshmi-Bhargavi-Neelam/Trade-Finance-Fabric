import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, FilePlus2, FileStack, Ship, Landmark, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { RoleSwitcher } from "./RoleSwitcher";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/lcs", label: "All LCs", icon: FileStack, exact: false, match: (p: string) => p === "/lcs" || (p.startsWith("/lcs/") && !p.endsWith("/new")) },
  { to: "/lcs/new", label: "Create LC", icon: FilePlus2, exact: true },
];

const quickActions = [
  { to: "/queue/documents", label: "Upload Documents", icon: Ship },
  { to: "/queue/customs", label: "Customs Queue", icon: ShieldCheck },
  { to: "/queue/bank", label: "Bank Queue", icon: Landmark },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (item: (typeof nav)[number]) =>
    item.match ? item.match(pathname) : item.exact ? pathname === item.to : pathname.startsWith(item.to);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-6 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-accent flex items-center justify-center">
              <span className="font-bold text-sidebar-primary-foreground">TF</span>
            </div>
            <div>
              <div className="font-semibold text-sm tracking-tight">TradeFinance</div>
              <div className="text-[11px] text-sidebar-foreground/60">Fabric Ledger</div>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 pb-2">Workspace</div>
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                isActive(item)
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}

          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 px-3 pt-6 pb-2">Actions</div>
          {quickActions.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === item.to
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="rounded-lg bg-sidebar-accent/50 p-3">
            <div className="text-[11px] text-sidebar-foreground/60">Channel</div>
            <div className="text-xs font-mono text-sidebar-foreground">tradefinancechannel</div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-sidebar-foreground/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              3 peers online
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-card/60 backdrop-blur flex items-center justify-between px-4 lg:px-8">
          <div>
            <div className="text-xs text-muted-foreground">Letter of Credit lifecycle</div>
            <div className="text-sm font-medium">Hyperledger Fabric · Multi-org shared ledger</div>
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
