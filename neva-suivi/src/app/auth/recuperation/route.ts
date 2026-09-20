import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Cible dédiée du lien "mot de passe oublié" (src/app/actions/auth.ts,
// demanderReinitialisationMotDePasse) — route séparée de /auth/callback,
// sans aucun paramètre dans son URL de base. Bug trouvé en testant en
// production : /auth/callback?next=... combiné au ?code= que Supabase
// ajoute lui-même produisait une URL à deux "?" (next=...?code=...),
// rendant "code" illisible côté serveur — exchangeCodeForSession n'était
// jamais appelé, aucune session ne s'établissait, et l'utilisateur
// atterrissait silencieusement sur /login. Une route sans query string de
// base élimine ce risque : Supabase y ajoute son propre ?code= sans
// collision possible.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?erreur=${encodeURIComponent("Lien de réinitialisation invalide ou expiré, redemande-en un.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?erreur=${encodeURIComponent(`Lien invalide ou expiré : ${error.message}`)}`
    );
  }

  return NextResponse.redirect(`${origin}/reinitialiser-mot-de-passe`);
}
