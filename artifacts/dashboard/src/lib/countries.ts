export interface Country {
  code: string;
  name: string;
  flag: string;
  appName: string;
  ifu: string;
  dialCode: string;
  dgi: string;
  currency: string;
}

export const COUNTRIES: Country[] = [
  { code: "BJ", name: "Bénin",          flag: "🇧🇯", appName: "BéninExpense",   ifu: "IFU (13 chiffres)",       dialCode: "+229", dgi: "DGI Bénin / e-MECeF",    currency: "XOF" },
  { code: "TG", name: "Togo",            flag: "🇹🇬", appName: "TogoExpense",    ifu: "NIF (9 chiffres)",        dialCode: "+228", dgi: "OTR Togo",                currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire",   flag: "🇨🇮", appName: "IvoireExpense",  ifu: "NCC (10 chiffres)",       dialCode: "+225", dgi: "DGI Côte d'Ivoire",      currency: "XOF" },
  { code: "SN", name: "Sénégal",         flag: "🇸🇳", appName: "SénégalExpense", ifu: "NINEA (9 chiffres)",      dialCode: "+221", dgi: "DGID Sénégal",            currency: "XOF" },
  { code: "ML", name: "Mali",            flag: "🇲🇱", appName: "MaliExpense",    ifu: "NIF (9 chiffres)",        dialCode: "+223", dgi: "DGI Mali",                currency: "XOF" },
  { code: "BF", name: "Burkina Faso",    flag: "🇧🇫", appName: "BurkinaExpense", ifu: "IFU (9 chiffres)",        dialCode: "+226", dgi: "DGI Burkina",             currency: "XOF" },
  { code: "NE", name: "Niger",           flag: "🇳🇪", appName: "NigerExpense",   ifu: "NIF (13 chiffres)",       dialCode: "+227", dgi: "DGI Niger",               currency: "XOF" },
  { code: "GN", name: "Guinée",          flag: "🇬🇳", appName: "GuinéeExpense",  ifu: "NIF (9 chiffres)",        dialCode: "+224", dgi: "DNI Guinée",              currency: "GNF" },
  { code: "GH", name: "Ghana",           flag: "🇬🇭", appName: "GhanaExpense",   ifu: "TIN (11 chiffres)",       dialCode: "+233", dgi: "GRA Ghana",               currency: "GHS" },
  { code: "NG", name: "Nigeria",         flag: "🇳🇬", appName: "NigeriaExpense", ifu: "TIN (8 chiffres)",        dialCode: "+234", dgi: "FIRS Nigeria",             currency: "NGN" },
  { code: "BR", name: "Brésil",          flag: "🇧🇷", appName: "BrasilExpense",  ifu: "CNPJ",                    dialCode: "+55",  dgi: "Receita Federal",          currency: "XOF" },
  { code: "FR", name: "France",          flag: "🇫🇷", appName: "FranceExpense",  ifu: "SIRET",                   dialCode: "+33",  dgi: "DGFiP France",             currency: "XOF" },
  { code: "OTHER", name: "Autre pays",   flag: "🌍", appName: "Expense",         ifu: "Identifiant fiscal",      dialCode: "+",    dgi: "Autorité fiscale locale",  currency: "XOF" },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

export function getCountry(code: string): Country {
  return COUNTRIES.find(c => c.code === code) ?? DEFAULT_COUNTRY;
}
