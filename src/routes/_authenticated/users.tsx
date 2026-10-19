import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { KeyRound, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/AppShell";
import {
  createStaffAccount, deleteStaffAccount, listStaffAccounts, resetStaffPassword,
  type StaffAccount,
} from "@/lib/users.functions";

export const Route = createFileRoute("/_authenticated/users")({
  head: () => ({
    meta: [
      { title: "Staff Accounts · Bethelehem Cleaning Service" },
      { name: "description", content: "Create and manage staff login accounts." },
      { property: "og:title", content: "Staff Accounts · Bethelehem Cleaning Service" },
      { property: "og:description", content: "Create and manage staff login accounts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const fetchAccounts = useServerFn(listStaffAccounts);
  const qc = useQueryClient();
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["staff-accounts"],
    queryFn: async () => {
      try {
        return await fetchAccounts();
      } catch (e) {
        toast.error((e as Error).message);
        return [] as StaffAccount[];
      }
    },
  });

  const [adding, setAdding] = useState(false);
  const [resetting, setResetting] = useState<StaffAccount | null>(null);
  const [removing, setRemoving] = useState<StaffAccount | null>(null);
  const del = useMutation({
    mutationFn: async (userId: string) => deleteStaffAccount({ data: { userId } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["staff-accounts"] }),
  });

  return (
    <>
      <PageHeader title="Staff Accounts" subtitle="Logins for the team. Public sign-up stays off — only you can create accounts.">
        <Button onClick={() => setAdding(true)}><Plus className="mr-1 h-4 w-4" />Add account</Button>
      </PageHeader>

      {!isLoading && accounts.length === 0 && (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center">
          <p className="font-display text-lg font-semibold">No staff accounts yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add one so a team member can sign in.</p>
          <Button className="mt-4" onClick={() => setAdding(true)}><UserPlus className="mr-1 h-4 w-4" />Add your first account</Button>
        </div>
      )}

      <div className="grid gap-3">
        {accounts.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-navy font-display font-bold text-navy-foreground">
                {a.email.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-semibold">{a.email}</p>
                  {a.role === "owner" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                      <ShieldCheck className="h-3 w-3" /> Owner
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Staff</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {a.lastSignInAt
                    ? `Last signed in ${format(new Date(a.lastSignInAt), "MMM d, yyyy")}`
                    : "Never signed in"}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => setResetting(a)}>
                <KeyRound className="mr-1 h-4 w-4" /> Reset password
              </Button>
              {a.role !== "owner" && (
                <Button size="icon" variant="ghost" aria-label="Delete account" className="text-destructive hover:text-destructive" onClick={() => setRemoving(a)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {adding && <AddAccountDialog onClose={() => setAdding(false)} />}

      {resetting && (
        <ResetPasswordDialog
          account={resetting}
          onClose={() => setResetting(null)}
        />
      )}

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {removing?.email}?</AlertDialogTitle>
            <AlertDialogDescription>They will no longer be able to sign in. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!removing) return;
                try {
                  await del.mutateAsync(removing.id);
                  toast.success("Account deleted");
                } catch (e) { toast.error((e as Error).message); }
                setRemoving(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function AddAccountDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const save = useMutation({
    mutationFn: async () => createStaffAccount({ data: { email, password } }),
    onSettled: () => qc.invalidateQueries({ queryKey: ["staff-accounts"] }),
  });

  async function submit() {
    setErr("");
    if (!email.trim()) return setErr("Email is required.");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    try {
      await save.mutateAsync();
      toast.success("Account created");
      onClose();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add staff account</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="ue">Email</Label>
            <Input id="ue" type="email" autoComplete="off" maxLength={255} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="up">Password</Label>
            <Input id="up" type="text" autoComplete="off" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters. Share it with the staff member privately.</p>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Creating…" : "Create account"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ account, onClose }: { account: StaffAccount; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const save = useMutation({
    mutationFn: async () => resetStaffPassword({ data: { userId: account.id, password } }),
  });

  async function submit() {
    setErr("");
    if (password.length < 8) return setErr("Password must be at least 8 characters.");
    try {
      await save.mutateAsync();
      toast.success("Password updated");
      onClose();
    } catch (e) { setErr((e as Error).message); }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Reset password for {account.email}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="rp">New password</Label>
            <Input id="rp" type="text" autoComplete="off" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={save.isPending}>{save.isPending ? "Updating…" : "Update password"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
