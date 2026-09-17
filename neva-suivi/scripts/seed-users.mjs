// Crée les 4 comptes (1 admin + 3 techniciens). À lancer une seule fois,
// en local, avec SUPABASE_SERVICE_ROLE_KEY dans .env.local (jamais commité,
// jamais utilisé côté client). Pas d'inscription libre (cahier §2) : c'est
// la seule voie de création de compte.
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

// Adapter cette liste : emails réels, rôle 'admin' pour le gérant. Le mot
// de passe temporaire doit être changé à la première connexion.
const comptes = [
  { email: "gerant@neva-energy.be", nom: "Gérant", role: "admin", motDePasseTemporaire: "ChangeMoi123!" },
  { email: "technicien1@neva-energy.be", nom: "Technicien 1", role: "technicien", motDePasseTemporaire: "ChangeMoi123!" },
  { email: "technicien2@neva-energy.be", nom: "Technicien 2", role: "technicien", motDePasseTemporaire: "ChangeMoi123!" },
  { email: "technicien3@neva-energy.be", nom: "Technicien 3", role: "technicien", motDePasseTemporaire: "ChangeMoi123!" },
];

for (const compte of comptes) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: compte.email,
    password: compte.motDePasseTemporaire,
    email_confirm: true,
    user_metadata: { nom: compte.nom },
  });

  if (error) {
    console.error(`Échec création ${compte.email} :`, error.message);
    continue;
  }

  // Le trigger on_auth_user_created a déjà créé la ligne public.users avec
  // role='technicien' par défaut ; on l'élève à 'admin' si nécessaire.
  if (compte.role === "admin") {
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: "admin" })
      .eq("id", data.user.id);

    if (updateError) {
      console.error(`Échec passage en admin de ${compte.email} :`, updateError.message);
      continue;
    }
  }

  console.log(`Compte créé : ${compte.email} (${compte.role})`);
}
