export interface CedeaoCurrency {
  code: string;
  name: string;
  symbol: string;
  countries: string[];
  rateToXof: number;
}

export const CEDEAO_CURRENCIES: CedeaoCurrency[] = [
  { code: "XOF", name: "Franc CFA UEMOA",    symbol: "FCFA", countries: ["BJ","TG","CI","SN","ML","BF","NE","GW"],   rateToXof: 1 },
  { code: "XAF", name: "Franc CFA CEMAC",    symbol: "FCFA", countries: ["CM","CF","CG","GA","GQ","TD"],              rateToXof: 1 },
  { code: "GHS", name: "Cédi ghanéen",        symbol: "GH₵",  countries: ["GH"],                                       rateToXof: 60 },
  { code: "NGN", name: "Naira nigérian",       symbol: "₦",    countries: ["NG"],                                       rateToXof: 0.5 },
  { code: "GMD", name: "Dalasi gambien",       symbol: "D",    countries: ["GM"],                                       rateToXof: 11 },
  { code: "SLE", name: "Leone sierra-léonais", symbol: "Le",   countries: ["SL"],                                       rateToXof: 0.03 },
  { code: "LRD", name: "Dollar libérien",      symbol: "L$",   countries: ["LR"],                                       rateToXof: 3.5 },
  { code: "CVE", name: "Escudo cap-verdien",   symbol: "Esc",  countries: ["CV"],                                       rateToXof: 6 },
  { code: "GNF", name: "Franc guinéen",        symbol: "FG",   countries: ["GN"],                                       rateToXof: 0.08 },
  { code: "MRU", name: "Ouguiya mauritanien",  symbol: "UM",   countries: ["MR"],                                       rateToXof: 17 },
];

export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  BJ: "XOF", TG: "XOF", CI: "XOF", SN: "XOF", ML: "XOF", BF: "XOF", NE: "XOF", GW: "XOF",
  CM: "XAF", CF: "XAF", CG: "XAF", GA: "XAF", GQ: "XAF", TD: "XAF",
  GH: "GHS",
  NG: "NGN",
  GM: "GMD",
  SL: "SLE",
  LR: "LRD",
  CV: "CVE",
  GN: "GNF",
  MR: "MRU",
};

export function getCurrencyByCode(code: string): CedeaoCurrency {
  return CEDEAO_CURRENCIES.find(c => c.code === code) ?? CEDEAO_CURRENCIES[0];
}

export function getCurrencyForCountry(countryCode: string): CedeaoCurrency {
  const code = CURRENCY_BY_COUNTRY[countryCode] ?? "XOF";
  return getCurrencyByCode(code);
}

export function formatAmount(amount: number, currencyCode: string): string {
  const currency = getCurrencyByCode(currencyCode);
  const locale = ["NGN", "GHS"].includes(currencyCode) ? "en-GH" : "fr-FR";
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
  if (currencyCode === "XOF" || currencyCode === "XAF") {
    return `${formatted} FCFA`;
  }
  return `${formatted} ${currency.symbol}`;
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const from = getCurrencyByCode(fromCurrency);
  const to = getCurrencyByCode(toCurrency);
  const inXof = amount * from.rateToXof;
  return inXof / to.rateToXof;
}
