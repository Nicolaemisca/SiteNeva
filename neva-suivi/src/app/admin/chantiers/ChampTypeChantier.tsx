"use client";

import { useState, type CSSProperties } from "react";

const styleChamp: CSSProperties = {
  fontSize: "1.1rem",
  padding: "0.75rem",
  minHeight: 44,
  borderRadius: 8,
  border: "1px solid #ccc",
  width: "100%",
};

// Le budget d'heures n'a de sens qu'au forfait (contrainte DB
// budget_heures_seulement_si_forfait) : masqué plutôt que simplement
// désactivé pour ne pas laisser croire qu'une valeur régie serait prise
// en compte.
export function ChampTypeChantier({
  typeInitial,
  budgetHeuresInitial,
}: {
  typeInitial: string;
  budgetHeuresInitial: string;
}) {
  const [type, setType] = useState(typeInitial === "forfait" ? "forfait" : "regie");

  return (
    <>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        <span>Type</span>
        <select
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
          style={styleChamp}
        >
          <option value="regie">Régie</option>
          <option value="forfait">Forfait</option>
        </select>
      </label>

      {type === "forfait" && (
        <label style={{ display: "grid", gap: "0.25rem" }}>
          <span>Budget d&apos;heures (forfait)</span>
          <input
            name="budget_heures"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            defaultValue={budgetHeuresInitial}
            style={styleChamp}
          />
        </label>
      )}
    </>
  );
}
