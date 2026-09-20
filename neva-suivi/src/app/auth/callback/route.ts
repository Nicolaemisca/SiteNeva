import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Callback OAuth/email générique (lien magique retiré — reste utile pour un
// éventuel futur fournisseur OAuth). Le flux "mot de passe oublié" utilise
// sa propre route dédiée, /auth/recuperation, pas celle-ci — voir son
// commentaire pour pourquoi.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}/`);
}
