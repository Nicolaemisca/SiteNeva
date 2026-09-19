import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rafraîchit la session Supabase à chaque requête et protège les routes qui
// ne sont pas /login ou /auth/callback. Sans ce proxy, une session expirée
// resterait invisible côté Server Components jusqu'au prochain appel client —
// on redirige donc ici, avant le rendu.
//
// Consigne 7 (session persistante sur mobile) : ce mécanisme suffit déjà, pas
// de client-side (aucun composant n'utilise src/lib/supabase/client.ts — tout
// passe par ce proxy + les Server Actions), donc pas de minuteur JS qui
// s'arrête quand l'onglet est en arrière-plan ou l'app fermée. Le cookie de
// session est signé et écrit par @supabase/ssr avec une durée de vie de 400
// jours par défaut (DEFAULT_COOKIE_OPTIONS, pas modifiée ici) : getUser()
// ci-dessous échange automatiquement le refresh_token contre un nouveau
// jeton dès qu'il détecte l'access_token expiré, à chaque requête — vérifié
// en corrompant manuellement un jeton d'accès en session (script conservé
// dans l'historique de conversation) : la session a survécu, avec un nouveau
// jeton valide réécrit dans le cookie. Reste hors du code : les réglages
// Supabase Dashboard → Authentication → Sessions ("Time-box user sessions",
// "Inactivity timeout") peuvent forcer une déconnexion même avec ce
// mécanisme correct — à laisser désactivés/larges pour cet usage.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth/callback");

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Un compte désactivé par l'admin (consigne 3 : "ne peut plus se
  // connecter") doit perdre l'accès immédiatement, pas seulement à la
  // prochaine tentative de connexion — vérifié à chaque requête plutôt qu'à
  // la seule connexion, pour couvrir une session déjà ouverte.
  if (user && !isPublicRoute) {
    const { data: profil } = await supabase.from("users").select("actif").eq("id", user.id).single();

    if (profil && !profil.actif) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("erreur", "Ce compte a été désactivé.");
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  // logo.png/icon*.png/apple-icon.png/manifest.webmanifest doivent rester
  // accessibles sans session : le logo doit s'afficher sur /login lui-même,
  // et le manifest/les icônes sont récupérés par le navigateur/l'OS (favicon,
  // "ajouter à l'écran d'accueil") sans cookie d'authentification.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|logo.png|icon.png|apple-icon.png|icon-192.png|icon-512.png).*)",
  ],
};
