import { NextResponse, type NextRequest } from "next/server";
import ExcelJS from "exceljs";
import { requireAdmin } from "@/lib/auth/requireAdmin";

type LigneSaisie = {
  id: string;
  date: string;
  heures: number | string;
  description: string | null;
  materiel: string | null;
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
    .select("id, date, heures, description, materiel, chantiers(nom), users(nom)")
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

  const classeur = new ExcelJS.Workbook();
  const feuille = classeur.addWorksheet("Saisies");
  feuille.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Chantier", key: "chantier", width: 28 },
    { header: "Personne", key: "personne", width: 22 },
    { header: "Heures", key: "heures", width: 10 },
    { header: "Description", key: "description", width: 40 },
    { header: "Matériel", key: "materiel", width: 30 },
  ];
  feuille.getRow(1).font = { bold: true };

  for (const s of saisies) {
    feuille.addRow({
      date: s.date,
      chantier: s.chantiers?.nom ?? "",
      personne: s.users?.nom ?? "",
      heures: Number(s.heures),
      description: s.description ?? "",
      materiel: s.materiel ?? "",
    });
  }

  const totalHeures = saisies.reduce((somme, s) => somme + Number(s.heures), 0);
  const ligneTotal = feuille.addRow({ chantier: "Total", heures: totalHeures });
  ligneTotal.font = { bold: true };

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
