import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, Plus, Sparkles, UserPlus, Users, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppointmentEditorProvider, useAppointmentEditor } from "@/components/AppointmentEditor";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/schedule", label: "Cleaning Schedule", icon: ClipboardList },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/cleaners", label: "Cleaners", icon: Users },
  { to: "/users", label: "Staff Accounts", icon: UserPlus },
] as const;

export function Brand({ light }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky text-navy">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="leading-tight">
        <p className={cn("font-display text-sm font-bold tracking-wide", light ? "text-navy-foreground" : "text-foreground")}>BETHELEHEM</p>
        <p className={cn("text-[10px] font-semibold uppercase tracking-[0.2em]", light ? "text-sky" : "text-muted-foreground")}>Cleaning Service</p>
      </div>
    </div>
  );
}

function NewButton({ className }: { className?: string }) {
  const { open } = useAppointmentEditor();
  return (
    <Button onClick={() => open()} className={className}>
      <Plus className="mr-1 h-4 w-4" /> New Assignment
    </Button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useRouteContext({ from: "/_authenticated" });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar p-4 text-sidebar-foreground">
      <div className="flex items-center justify-between px-2 py-2">
        <Brand light />
        <button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button>
      </div>
      <nav className="mt-8 grid gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          >
            <Icon className="h-[18px] w-[18px]" /> {label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto border-t border-sidebar-border pt-4">
        <p className="truncate px-3 text-xs text-sidebar-foreground/70">{user.email}</p>
        <button onClick={signOut} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
          <LogOut className="h-[18px] w-[18px]" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <AppointmentEditorProvider>
      <div className="min-h-screen lg:pl-64">
        <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">{sidebar}</aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-navy/50" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72">{sidebar}</aside>
          </div>
        )}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
            <div className="lg:hidden"><Brand /></div>
          </div>
          <NewButton className="hidden sm:inline-flex" />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:px-8">{children}</main>
        <div className="fixed bottom-4 right-4 z-30 sm:hidden"><NewButton className="h-12 rounded-full shadow-lg" /></div>
      </div>
    </AppointmentEditorProvider>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
