import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cible de redirection du lien magique (cahier §2 "lien magique envoyé par
// email") et du lien "mot de passe oublié". Échange le code contre une
// session puis renvoie vers l'accueil, ou vers "next" si fourni (ex.
// /reinitialiser-mot-de-passe) — seul un chemin interne est accepté, jamais
// une URL absolue, pour ne pas ouvrir de redirection arbitraire.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const destination = next && next.startsWith("/") ? next : "/";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(`${origin}${destination}`);
}
