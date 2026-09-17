// Crée ou met à jour les comptes (cahier §2 : pas d'inscription libre, c'est
// la seule voie de création). Idempotent : relancer ce script pour ajouter
// un associé n'échoue pas sur les comptes déjà créés — un compte existant
// est retrouvé par email, jamais recréé ni redéfini son mot de passe.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis (.env.local).");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Ajouter une ligne par associé pour les prochains lancements. Le mot de
// passe temporaire n'est utilisé qu'à la création : relancer le script ne
// réinitialise jamais le mot de passe d'un compte existant.
const comptes = [
  { email: "info@neva-energy.be", nom: "Nicolae (pro)", role: "admin", motDePasseTemporaire: "ChangeMoi123!" },
  { email: "nicolas89m@yahoo.com", nom: "Nicolae (perso)", role: "technicien", motDePasseTemporaire: "ChangeMoi123!" },
];

async function trouverUtilisateurParEmail(email) {
  // L'API Admin ne propose pas de recherche par email : à ce volume de
  // comptes (quelques associés), lister et filtrer reste largement suffisant.
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
}

for (const compte of comptes) {
  let userId;

  const { data, error } = await supabase.auth.admin.createUser({
    email: compte.email,
    password: compte.motDePasseTemporaire,
    email_confirm: true,
    user_metadata: { nom: compte.nom },
  });

  if (error) {
    // Compte déjà créé lors d'un lancement précédent : ce n'est pas une
    // erreur, on récupère juste son id pour synchroniser le rôle.
    const dejaExistant = /already.*registered|already.*exists/i.test(error.message);
    if (!dejaExistant) {
      console.error(`Échec création ${compte.email} :`, error.message);
      continue;
    }

    const existant = await trouverUtilisateurParEmail(compte.email);
    if (!existant) {
      console.error(`${compte.email} annoncé existant par l'API mais introuvable, à vérifier manuellement.`);
      continue;
    }
    userId = existant.id;
    console.log(`Compte déjà existant : ${compte.email} (inchangé)`);
  } else {
    userId = data.user.id;
    console.log(`Compte créé : ${compte.email}`);
  }

  // Le trigger on_auth_user_created crée la ligne public.users avec
  // role='technicien' par défaut à la création ; on aligne toujours le rôle
  // ici, y compris sur un compte déjà existant (relancer le script après
  // avoir changé un rôle dans cette liste doit le refléter en base).
  const { error: updateError } = await supabase
    .from("users")
    .update({ role: compte.role })
    .eq("id", userId);

  if (updateError) {
    console.error(`Échec synchronisation du rôle pour ${compte.email} :`, updateError.message);
    continue;
  }

  console.log(`Rôle synchronisé : ${compte.email} -> ${compte.role}`);
}
