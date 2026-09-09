export const ANTIMICROBIAL_DRUGS = [
  "Oxytetracycline",
  "Amoxicillin",
  "Enrofloxacin",
  "Ceftiofur",
  "Sulfadiazine",
];

export function isKnownAntimicrobial(drugName) {
  return ANTIMICROBIAL_DRUGS.some(
    (d) => d.toLowerCase() === String(drugName || "").toLowerCase(),
  );
}
