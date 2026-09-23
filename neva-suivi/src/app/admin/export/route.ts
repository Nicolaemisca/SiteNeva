import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth/requireAdmin";

type LigneSaisie = {
  id: string;
  date: string;
  heures: number | string;
  description: string | null;
  materiel: string | null;
  chantier_id: string;
  user_id: string;
  chantiers: { nom: string } | null;
  users: { nom: string } | null;
};

// Mêmes filtres que /admin/saisies, appliqués côté serveur (pas d'export
// "tout" masqué derrière un filtre vide côté client). non_exportees=1
// (cahier consigne 13) restreint aux saisies jamais encore exportées —
// c'est ce que pose le bouton "Exporter" par défaut sur /admin/saisies.
export async function GET(request: NextRequest) {
  const { supabase } = await requireAdmin();

  const { searchParams } = new URL(request.url);
  const chantierId = searchParams.get("chantier_id");
  const userId = searchParams.get("user_id");
  const du = searchParams.get("du");
  const au = searchParams.get("au");
  const nonExporteesUniquement = searchParams.get("non_exportees") === "1";

  let requete = supabase
    .from("saisies")
    .select("id, date, heures, description, materiel, chantier_id, user_id, chantiers(nom), users(nom)")
    .order("date", { ascending: false });

  if (chantierId) requete = requete.eq("chantier_id", chantierId);
  if (userId) requete = requete.eq("user_id", userId);
  if (du) requete = requete.gte("date", du);
  if (au) requete = requete.lte("date", au);
  if (nonExporteesUniquement) requete = requete.is("exportee_le", null);

  const { data, error } = await requete;

  if (error) {
    return NextResponse.json({ erreur: error.message }, { status: 500 });
  }

  const saisies = (data ?? []) as unknown as LigneSaisie[];

  // Tarif horaire admin-only (cahier consigne 17, migration 0010) : lu ici
  // uniquement pour calculer le montant à facturer, jamais exposé côté
  // technicien — cette route est déjà protégée par requireAdmin() plus haut.
  const { data: tarifs } = await supabase.from("tarifs_horaires").select("user_id, tarif_horaire");
  const tarifParUtilisateur = new Map((tarifs ?? []).map((t) => [t.user_id as string, Number(t.tarif_horaire)]));

  function montant(s: LigneSaisie): number | null {
    const tarif = tarifParUtilisateur.get(s.user_id);
    return tarif != null ? Number(s.heures) * tarif : null;
  }

  const classeur = new ExcelJS.Workbook();

  const feuilleDetail = classeur.addWorksheet("Saisies");
  feuilleDetail.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Chantier", key: "chantier", width: 28 },
    { header: "Personne", key: "personne", width: 22 },
    { header: "Heures", key: "heures", width: 10 },
    { header: "Tarif (€/h)", key: "tarif", width: 12 },
    { header: "Montant (€)", key: "montant", width: 12 },
    { header: "Description", key: "description", width: 40 },
    { header: "Matériel", key: "materiel", width: 30 },
  ];
  feuilleDetail.getRow(1).font = { bold: true };

  for (const s of saisies) {
    feuilleDetail.addRow({
      date: s.date,
      chantier: s.chantiers?.nom ?? "",
      personne: s.users?.nom ?? "",
      heures: Number(s.heures),
      tarif: tarifParUtilisateur.get(s.user_id) ?? "",
      montant: montant(s) ?? "",
      description: s.description ?? "",
      materiel: s.materiel ?? "",
    });
  }

  const totalHeures = saisies.reduce((somme, s) => somme + Number(s.heures), 0);
  const totalMontant = saisies.reduce((somme, s) => somme + (montant(s) ?? 0), 0);
  const ligneTotalDetail = feuilleDetail.addRow({ chantier: "Total", heures: totalHeures, montant: totalMontant });
  ligneTotalDetail.font = { bold: true };

  // Récapitulatif par personne et par chantier (cahier consigne 17) :
  // c'est ce tableau, pas le détail ligne à ligne, qui part tel quel au
  // client pour accord de facturation.
  type CleGroupe = string; // `${chantier_id}::${user_id}`
  const groupes = new Map<CleGroupe, { chantierNom: string; personneNom: string; heures: number; montant: number | null }>();

  for (const s of saisies) {
    const cle: CleGroupe = `${s.chantier_id}::${s.user_id}`;
    const existant = groupes.get(cle);
    const montantLigne = montant(s);
    groupes.set(cle, {
      chantierNom: s.chantiers?.nom ?? "",
      personneNom: s.users?.nom ?? "",
      heures: (existant?.heures ?? 0) + Number(s.heures),
      montant: montantLigne == null ? existant?.montant ?? null : (existant?.montant ?? 0) + montantLigne,
    });
  }

  const lignesRecap = [...groupes.values()].sort(
    (a, b) => a.chantierNom.localeCompare(b.chantierNom) || a.personneNom.localeCompare(b.personneNom)
  );

  const feuilleRecap = classeur.addWorksheet("Récapitulatif facturation");
  feuilleRecap.columns = [
    { header: "Chantier", key: "chantier", width: 28 },
    { header: "Personne", key: "personne", width: 22 },
    { header: "Heures", key: "heures", width: 10 },
    { header: "Montant (€)", key: "montant", width: 14 },
  ];
  feuilleRecap.getRow(1).font = { bold: true };

  for (const ligne of lignesRecap) {
    feuilleRecap.addRow({
      chantier: ligne.chantierNom,
      personne: ligne.personneNom,
      heures: ligne.heures,
      montant: ligne.montant ?? "Tarif non défini",
    });
  }

  const ligneTotalRecap = feuilleRecap.addRow({ chantier: "Total", heures: totalHeures, montant: totalMontant });
  ligneTotalRecap.font = { bold: true };

  const buffer = await classeur.xlsx.writeBuffer();

  // Marque les saisies incluses (cahier consigne 13) une fois le fichier
  // effectivement généré — jamais avant, pour ne pas marquer un export qui
  // aurait échoué en cours de génération.
  if (saisies.length > 0) {
    await supabase
      .from("saisies")
      .update({ exportee_le: new Date().toISOString() })
      .in(
        "id",
        saisies.map((s) => s.id)
      );
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="saisies.xlsx"',
    },
  });
}
