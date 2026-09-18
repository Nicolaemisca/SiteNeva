import { createClient } from "@supabase/supabase-js";

// Client service_role : contourne RLS, gère les comptes (auth.users) via
// l'API Admin. Ne JAMAIS importer ce fichier depuis un composant client ou
// exposer sa sortie au navigateur — réservé aux server actions de
// src/app/actions/utilisateurs.ts, chacune protégée par requireAdmin().
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
