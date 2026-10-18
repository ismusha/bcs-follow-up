import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type StaffAccount = {
  id: string;
  email: string;
  role: "owner" | "staff";
  createdAt: string;
  lastSignInAt: string | null;
};

async function requireOwner(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "owner" });
  if (error || !data) throw new Error("Only the owner can manage staff accounts.");
}

async function getAdminClient() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export const listStaffAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<StaffAccount[]> => {
    await requireOwner(context.supabase, context.userId);
    const admin = await getAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw error;
    const { data: roles, error: rolesError } = await admin
      .from("user_roles")
      .select("user_id, role");
    if (rolesError) throw rolesError;
    return data.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      role: (roles?.find((r) => r.user_id === u.id)?.role as "owner" | "staff" | undefined) ?? "staff",
      createdAt: u.created_at,
      lastSignInAt: u.last_sign_in_at ?? null,
    }));
  });

export const createStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ email: z.string().trim().email("Enter a valid email."), password: z.string().min(8, "Password must be at least 8 characters.") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    const admin = await getAdminClient();
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        throw new Error("That email already has an account.");
      }
      throw new Error(error.message);
    }
    return { id: created.user?.id ?? null };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({ userId: z.string().uuid(), password: z.string().min(8, "Password must be at least 8 characters.") })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await requireOwner(context.supabase, context.userId);
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(data.userId, { password: data.password });
    if (error) throw new Error(error.message);
  });

export const deleteStaffAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    if (data.userId === context.userId) throw new Error("You can't delete the account you're signed in with.");
    await requireOwner(context.supabase, context.userId);
    const admin = await getAdminClient();
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
  });

/** Public: tells the login page whether first-time owner setup is still available. */
export const hasAnyAccounts = createServerFn({ method: "GET" }).handler(async () => {
  const admin = await getAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
  if (error) return true; // fail closed — never expose setup mode on uncertainty
  return data.users.length > 0;
});

/** Public first-run action: creates the single owner account, then setup is closed. */
export const createFirstOwner = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({ email: z.string().trim().email("Enter a valid email."), password: z.string().min(8, "Password must be at least 8 characters.") })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const admin = await getAdminClient();
    const { data: existing, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (listError) throw new Error("Could not verify setup status. Try again.");
    if (existing.users.length > 0) throw new Error("Setup is already finished. Please sign in instead.");
    const { error } = await admin.auth.admin.createUser({
      email: data.email.toLowerCase(),
      password: data.password,
      email_confirm: true,
    });
    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        throw new Error("Setup is already finished. Please sign in instead.");
      }
      throw new Error(error.message);
    }
  });
