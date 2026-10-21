import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Eye, LayoutDashboard, LogIn, Menu, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/AppShell";
import { AppointmentEditorProvider } from "@/components/AppointmentEditor";
import { ReadOnlyProvider } from "@/lib/readonly";

const NAV = [
  { to: "/view/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/view/schedule", label: "Cleaning Schedule", icon: ClipboardList },
  { to: "/view/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/view/cleaners", label: "Cleaners", icon: Users },
] as const;

/** Public read-only shell: same pages as staff, no edit controls, no sign-in. */
export function ViewerShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
        <p className="flex items-center gap-2 px-3 text-xs text-sidebar-foreground/70"><Eye className="h-3.5 w-3.5" /> View only — nothing can be changed here</p>
        <Link
          to="/auth"
          className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogIn className="h-[18px] w-[18px]" /> Staff sign in
        </Link>
      </div>
    </div>
  );

  return (
    <ReadOnlyProvider>
      <AppointmentEditorProvider readOnly>
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
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full bg-sky-soft px-3 py-1 text-xs font-semibold text-primary sm:inline-flex">
                <Eye className="h-3.5 w-3.5" /> View only
              </span>
              <Button asChild variant="outline" size="sm">
                <Link to="/auth"><LogIn className="mr-1 h-4 w-4" /> Staff sign in</Link>
              </Button>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 py-6 pb-24 lg:px-8">{children}</main>
        </div>
      </AppointmentEditorProvider>
    </ReadOnlyProvider>
  );
}
