export function formatFCFA(amount: number | undefined | null): string {
  if (amount == null) return "0 FCFA";
  // Space-separated thousands, followed by FCFA
  const formatted = new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount).replace(/,/g, ' ');
  return `${formatted} FCFA`;
}
