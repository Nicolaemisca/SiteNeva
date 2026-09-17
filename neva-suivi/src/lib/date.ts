// Fuseau Europe/Brussels, pas UTC (cahier §7) : une date de saisie ou "aujourd'hui"
// calculée côté serveur doit rester stable quel que soit le fuseau du
// serveur d'exécution.
export function dateDuJourBelge(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Brussels" });
}
