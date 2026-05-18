// src/lib/inditex/links.ts
// ═══════════════════════════════════════════════════════════════════════════
// INDITEX DEEPLINK GENERATOR — v1.0
// 5 brende × 15 vende × 20+ kategori
// URL të verifikuara nga research (maj 2026)
// ═══════════════════════════════════════════════════════════════════════════

export type InditexBrand = "zara" | "massimo_dutti" | "bershka" | "pull_bear" | "stradivarius";
export type Gender = "male" | "female";

// ─── BRAND METADATA ─────────────────────────────────────────────────────────
export const BRAND_INFO: Record<InditexBrand, {
  name: string;
  logo: string;
  color: string;     // background ngjyrë
  textColor: string; // text ngjyrë
  gender: ("male" | "female")[]; // gjinitë që e mbulon
  domain: string;
}> = {
  zara: {
    name: "ZARA",
    logo: "Z",
    color: "#000000",
    textColor: "#FFFFFF",
    gender: ["male", "female"],
    domain: "zara.com",
  },
  massimo_dutti: {
    name: "Massimo Dutti",
    logo: "MD",
    color: "#8B6F47",
    textColor: "#FFFFFF",
    gender: ["male", "female"],
    domain: "massimodutti.com",
  },
  bershka: {
    name: "Bershka",
    logo: "B",
    color: "#E91E63",
    textColor: "#FFFFFF",
    gender: ["male", "female"],
    domain: "bershka.com",
  },
  pull_bear: {
    name: "Pull&Bear",
    logo: "P&B",
    color: "#1A5490",
    textColor: "#FFFFFF",
    gender: ["male", "female"],
    domain: "pullandbear.com",
  },
  stradivarius: {
    name: "Stradivarius",
    logo: "S",
    color: "#F8BBD0",
    textColor: "#1A1A1A",
    gender: ["female"], // vetëm femra
    domain: "stradivarius.com",
  },
};

// ─── COUNTRY MAPPING ────────────────────────────────────────────────────────
// Country code → URL slug për çdo brend
// Mbulim global: 60+ vende ku Zara online është aktive + 'ww' fallback
type CountrySlug = { zara: string; massimo: string; bershka: string; pullbear: string; stradivarius: string };

const COUNTRIES: Record<string, CountrySlug> = {
  // ─── EVROPA PERËNDIMORE ─────────────────────────────────────────────────
  DE: { zara: "de/en", massimo: "de/en", bershka: "de", pullbear: "de", stradivarius: "de/en" },
  IT: { zara: "it/en", massimo: "it/en", bershka: "it", pullbear: "it", stradivarius: "it/en" },
  CH: { zara: "ch/en", massimo: "ch/en", bershka: "ch", pullbear: "ch", stradivarius: "ch/en" },
  GB: { zara: "uk/en", massimo: "gb/en", bershka: "gb", pullbear: "gb", stradivarius: "gb/en" },
  UK: { zara: "uk/en", massimo: "gb/en", bershka: "gb", pullbear: "gb", stradivarius: "gb/en" },
  IE: { zara: "ie/en", massimo: "ie/en", bershka: "ie", pullbear: "ie", stradivarius: "ie/en" },
  FR: { zara: "fr/en", massimo: "fr/en", bershka: "fr", pullbear: "fr", stradivarius: "fr/en" },
  ES: { zara: "es/en", massimo: "es/en", bershka: "es", pullbear: "es", stradivarius: "es/en" },
  PT: { zara: "pt/en", massimo: "pt/en", bershka: "pt", pullbear: "pt", stradivarius: "pt/en" },
  NL: { zara: "nl/en", massimo: "nl/en", bershka: "nl", pullbear: "nl", stradivarius: "nl/en" },
  BE: { zara: "be/en", massimo: "be/en", bershka: "be", pullbear: "be", stradivarius: "be/en" },
  LU: { zara: "lu/en", massimo: "lu/en", bershka: "lu", pullbear: "lu", stradivarius: "lu/en" },
  AT: { zara: "at/en", massimo: "at/en", bershka: "at", pullbear: "at", stradivarius: "at/en" },

  // ─── EVROPA VERIORE ─────────────────────────────────────────────────────
  SE: { zara: "se/en", massimo: "se/en", bershka: "se", pullbear: "se", stradivarius: "se/en" },
  NO: { zara: "no/en", massimo: "no/en", bershka: "no", pullbear: "no", stradivarius: "no/en" },
  DK: { zara: "dk/en", massimo: "dk/en", bershka: "dk", pullbear: "dk", stradivarius: "dk/en" },
  FI: { zara: "fi/en", massimo: "fi/en", bershka: "fi", pullbear: "fi", stradivarius: "fi/en" },
  IS: { zara: "is/en", massimo: "is/en", bershka: "is", pullbear: "is", stradivarius: "is/en" },

  // ─── EVROPA LINDORE ─────────────────────────────────────────────────────
  PL: { zara: "pl/en", massimo: "pl/en", bershka: "pl", pullbear: "pl", stradivarius: "pl/en" },
  CZ: { zara: "cz/en", massimo: "cz/en", bershka: "cz", pullbear: "cz", stradivarius: "cz/en" },
  SK: { zara: "sk/en", massimo: "sk/en", bershka: "sk", pullbear: "sk", stradivarius: "sk/en" },
  HU: { zara: "hu/en", massimo: "hu/en", bershka: "hu", pullbear: "hu", stradivarius: "hu/en" },
  RO: { zara: "ro/en", massimo: "ro/en", bershka: "ro", pullbear: "ro", stradivarius: "ro/en" },
  BG: { zara: "bg/en", massimo: "bg/en", bershka: "bg", pullbear: "bg", stradivarius: "bg/en" },
  HR: { zara: "hr/en", massimo: "hr/en", bershka: "hr", pullbear: "hr", stradivarius: "hr/en" },
  SI: { zara: "si/en", massimo: "si/en", bershka: "si", pullbear: "si", stradivarius: "si/en" },
  EE: { zara: "ee/en", massimo: "ee/en", bershka: "ee", pullbear: "ee", stradivarius: "ee/en" },
  LV: { zara: "lv/en", massimo: "lv/en", bershka: "lv", pullbear: "lv", stradivarius: "lv/en" },
  LT: { zara: "lt/en", massimo: "lt/en", bershka: "lt", pullbear: "lt", stradivarius: "lt/en" },
  GR: { zara: "gr/en", massimo: "gr/en", bershka: "gr", pullbear: "gr", stradivarius: "gr/en" },
  CY: { zara: "cy/en", massimo: "cy/en", bershka: "cy", pullbear: "cy", stradivarius: "cy/en" },
  MT: { zara: "mt/en", massimo: "mt/en", bershka: "mt", pullbear: "mt", stradivarius: "mt/en" },
  TR: { zara: "tr/en", massimo: "tr/en", bershka: "tr", pullbear: "tr", stradivarius: "tr/en" },

  // ─── BALLKANI (përdor 'ww' global ku s'ka shop direkt) ──────────────────
  RS: { zara: "rs/en", massimo: "rs/en", bershka: "rs", pullbear: "rs", stradivarius: "rs/en" },
  AL: { zara: "ww/en", massimo: "es/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  XK: { zara: "ww/en", massimo: "es/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  MK: { zara: "ww/en", massimo: "es/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  BA: { zara: "ww/en", massimo: "es/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  ME: { zara: "ww/en", massimo: "es/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },

  // ─── AMERIKA E VERIUT ───────────────────────────────────────────────────
  US: { zara: "us/en", massimo: "us", bershka: "us", pullbear: "us", stradivarius: "us/en" },
  CA: { zara: "ca/en", massimo: "ca/en", bershka: "ca", pullbear: "ca", stradivarius: "ca/en" },
  MX: { zara: "mx/en", massimo: "mx/en", bershka: "mx", pullbear: "mx", stradivarius: "mx/en" },

  // ─── AMERIKA E JUGUT ────────────────────────────────────────────────────
  BR: { zara: "br/en", massimo: "br/en", bershka: "br", pullbear: "br", stradivarius: "br/en" },
  AR: { zara: "ar/en", massimo: "ar/en", bershka: "ar", pullbear: "ar", stradivarius: "ar/en" },
  CL: { zara: "cl/en", massimo: "cl/en", bershka: "cl", pullbear: "cl", stradivarius: "cl/en" },
  CO: { zara: "co/en", massimo: "co/en", bershka: "co", pullbear: "co", stradivarius: "co/en" },
  PE: { zara: "pe/en", massimo: "pe/en", bershka: "pe", pullbear: "pe", stradivarius: "pe/en" },
  UY: { zara: "uy/en", massimo: "uy/en", bershka: "uy", pullbear: "uy", stradivarius: "uy/en" },

  // ─── AZIA ───────────────────────────────────────────────────────────────
  CN: { zara: "cn/en", massimo: "cn/en", bershka: "cn", pullbear: "cn", stradivarius: "cn/en" },
  JP: { zara: "jp/en", massimo: "jp/en", bershka: "jp", pullbear: "jp", stradivarius: "jp/en" },
  KR: { zara: "kr/en", massimo: "kr/en", bershka: "kr", pullbear: "kr", stradivarius: "kr/en" },
  HK: { zara: "hk/en", massimo: "hk/en", bershka: "hk", pullbear: "hk", stradivarius: "hk/en" },
  TW: { zara: "tw/en", massimo: "tw/en", bershka: "tw", pullbear: "tw", stradivarius: "tw/en" },
  SG: { zara: "sg/en", massimo: "sg/en", bershka: "sg", pullbear: "sg", stradivarius: "sg/en" },
  MY: { zara: "my/en", massimo: "my/en", bershka: "my", pullbear: "my", stradivarius: "my/en" },
  TH: { zara: "th/en", massimo: "th/en", bershka: "th", pullbear: "th", stradivarius: "th/en" },
  PH: { zara: "ph/en", massimo: "ph/en", bershka: "ph", pullbear: "ph", stradivarius: "ph/en" },
  ID: { zara: "id/en", massimo: "id/en", bershka: "id", pullbear: "id", stradivarius: "id/en" },
  VN: { zara: "vn/en", massimo: "vn/en", bershka: "vn", pullbear: "vn", stradivarius: "vn/en" },
  IN: { zara: "in/en", massimo: "in/en", bershka: "in", pullbear: "in", stradivarius: "in/en" },
  AU: { zara: "au/en", massimo: "au/en", bershka: "au", pullbear: "au", stradivarius: "au/en" },
  NZ: { zara: "nz/en", massimo: "nz/en", bershka: "nz", pullbear: "nz", stradivarius: "nz/en" },

  // ─── LINDJA E MESME ─────────────────────────────────────────────────────
  AE: { zara: "ae/en", massimo: "ae/en", bershka: "ae", pullbear: "ae", stradivarius: "ae/en" },
  SA: { zara: "sa/en", massimo: "sa/en", bershka: "sa", pullbear: "sa", stradivarius: "sa/en" },
  KW: { zara: "kw/en", massimo: "kw/en", bershka: "kw", pullbear: "kw", stradivarius: "kw/en" },
  QA: { zara: "qa/en", massimo: "qa/en", bershka: "qa", pullbear: "qa", stradivarius: "qa/en" },
  BH: { zara: "bh/en", massimo: "bh/en", bershka: "bh", pullbear: "bh", stradivarius: "bh/en" },
  OM: { zara: "om/en", massimo: "om/en", bershka: "om", pullbear: "om", stradivarius: "om/en" },
  JO: { zara: "jo/en", massimo: "jo/en", bershka: "jo", pullbear: "jo", stradivarius: "jo/en" },
  LB: { zara: "lb/en", massimo: "lb/en", bershka: "lb", pullbear: "lb", stradivarius: "lb/en" },
  IL: { zara: "il/en", massimo: "il/en", bershka: "il", pullbear: "il", stradivarius: "il/en" },
  EG: { zara: "eg/en", massimo: "eg/en", bershka: "eg", pullbear: "eg", stradivarius: "eg/en" },

  // ─── AFRIKA ─────────────────────────────────────────────────────────────
  ZA: { zara: "za/en", massimo: "za/en", bershka: "za", pullbear: "za", stradivarius: "za/en" },
  MA: { zara: "ma/en", massimo: "ma/en", bershka: "ma", pullbear: "ma", stradivarius: "ma/en" },
  TN: { zara: "tn/en", massimo: "tn/en", bershka: "tn", pullbear: "tn", stradivarius: "tn/en" },
  // Afrika subsaharore përdor 'ww' (worldwide platform) — Angola, Kenya, Nigeria, Ghana, etj.
  NG: { zara: "ww/en", massimo: "ww/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  KE: { zara: "ww/en", massimo: "ww/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
  GH: { zara: "ww/en", massimo: "ww/en", bershka: "ww", pullbear: "ww", stradivarius: "ww/en" },
};

// ─── CATEGORY MAPPING ───────────────────────────────────────────────────────
// Item type (nga engine) → category slug për çdo brend
// Nëse undefined → brendi nuk e ka atë kategori, ose përdor landing page male/female

type BrandCategoryMap = {
  zara?: string;
  massimo?: string;
  bershka?: string;
  pullbear?: string;
  stradivarius?: string;
};

const CATEGORIES_MALE: Record<string, BrandCategoryMap> = {
  // Tops
  tee:         { zara: "man-tshirts-l855", massimo: "men/t-shirts-polos/t-shirts-l681", bershka: "man-clothes-tshirts-c1010193539", pullbear: "man-clothing-t-shirts-l710" },
  polo:        { zara: "man-polos-l713", massimo: "men/t-shirts-polos/polos-l682", bershka: "man-clothes-polos-c1010193543", pullbear: "man-clothing-polos-l712" },
  shirt:       { zara: "man-shirts-l737", massimo: "men/shirts-l648", bershka: "man-clothes-shirts-c1010193540", pullbear: "man-clothing-shirts-l711" },
  sweater:     { zara: "man-sweaters-l681", massimo: "men/knitwear-l684", bershka: "man-clothes-knitwear-c1010193592", pullbear: "man-clothing-knitwear-l713" },
  hoodie:      { zara: "man-sweatshirts-l682", massimo: "men/sweatshirts-l685", bershka: "man-clothes-sweatshirts-c1010193541", pullbear: "man-clothing-sweatshirts-l714" },
  sweatshirt:  { zara: "man-sweatshirts-l682", massimo: "men/sweatshirts-l685", bershka: "man-clothes-sweatshirts-c1010193541", pullbear: "man-clothing-sweatshirts-l714" },
  blazer:      { zara: "man-blazers-l608", massimo: "men/jackets-blazers-l678" },
  jacket:      { zara: "man-outerwear-l715", massimo: "men/jackets-l679", bershka: "man-clothes-jackets-c1010193591", pullbear: "man-clothing-jackets-l715" },
  coat:        { zara: "man-coats-l706", massimo: "men/coats-l680" },

  // Bottoms
  jeans:       { zara: "man-jeans-l659", massimo: "men/jeans-l683", bershka: "man-clothes-jeans-c1010193566", pullbear: "man-clothing-jeans-l717" },
  chinos:      { zara: "man-trousers-chino-l838", massimo: "men/trousers/chinos-l652", bershka: "man-clothes-pants-c1010193575", pullbear: "man-clothing-pants-l718" },
  trousers:    { zara: "man-trousers-l838", massimo: "men/trousers-l652", bershka: "man-clothes-pants-c1010193575", pullbear: "man-clothing-pants-l718" },
  shorts:      { zara: "man-bermudas-l592", massimo: "men/trousers/shorts-l655", bershka: "man-clothes-bermudas-c1010193576", pullbear: "man-clothing-bermudas-l722" },
  joggers:     { zara: "man-jogger-pants-l1281", massimo: "men/trousers/jogger-l657", bershka: "man-clothes-pants-c1010193575", pullbear: "man-clothing-joggers-l720" },
  sweatpants:  { zara: "man-jogger-pants-l1281", massimo: "men/trousers/jogger-l657", bershka: "man-clothes-pants-c1010193575", pullbear: "man-clothing-joggers-l720" },
  joggers_sweatpants: { zara: "man-jogger-pants-l1281", massimo: "men/trousers/jogger-l657", bershka: "man-clothes-pants-c1010193575", pullbear: "man-clothing-joggers-l720" },

  // Shoes
  sneakers:        { zara: "man-shoes-sneakers-l797", massimo: "men/shoes/sneakers-l1576", bershka: "man-shoes-c1010193557", pullbear: "man-shoes-sneakers-l724" },
  running_shoes:   { zara: "man-shoes-sneakers-l797", massimo: "men/shoes/sneakers-l1576", bershka: "man-shoes-c1010193557", pullbear: "man-shoes-sneakers-l724" },
  loafers:         { zara: "man-shoes-l769", massimo: "men/shoes/loafers-l1572" },
  chelsea_boots:   { zara: "man-shoes-boots-l810", massimo: "men/shoes/boots-ankle-boots-n1570" },
  chelsea:         { zara: "man-shoes-boots-l810", massimo: "men/shoes/boots-ankle-boots-n1570" },
  ankle_boots:     { zara: "man-shoes-boots-l810", massimo: "men/shoes/boots-ankle-boots-n1570" },
  boots:           { zara: "man-shoes-boots-l810", massimo: "men/shoes/boots-ankle-boots-n1570" },
  oxford:          { zara: "man-shoes-l769", massimo: "men/shoes/lace-up-shoes-l1573" },
  derby:           { zara: "man-shoes-l769", massimo: "men/shoes/lace-up-shoes-l1573" },

  // Accessories
  belt:            { zara: "man-accessories-belts-l551", massimo: "men/accessories/belts-l1614", bershka: "man-accessories-c1010193559", pullbear: "man-accessories-belts-l725" },
  watch:           { zara: "man-accessories-watches-l550", massimo: "men/accessories/watches-l1615", bershka: "man-accessories-c1010193559", pullbear: "man-accessories-watches-l728" },
  sunglasses:      { zara: "man-accessories-sunglasses-l552", massimo: "men/accessories/sunglasses-l1616", bershka: "man-accessories-c1010193559", pullbear: "man-accessories-sunglasses-l727" },
  hat:             { zara: "man-accessories-hats-l549", massimo: "men/accessories/hats-l1617", bershka: "man-accessories-c1010193559", pullbear: "man-accessories-hats-l726" },
};

const CATEGORIES_FEMALE: Record<string, BrandCategoryMap> = {
  // Tops
  tee:         { zara: "woman-tshirts-l1362", massimo: "women/t-shirts-l601", bershka: "woman-clothes-tshirts-c1010194025", pullbear: "woman-clothing-t-shirts-l729", stradivarius: "women/clothing/t-shirts-n2029" },
  shirt:       { zara: "woman-shirts-l1217", massimo: "women/shirts-l602", bershka: "woman-clothes-shirts-c1010194026", pullbear: "woman-clothing-shirts-l730", stradivarius: "women/clothing/shirts-n2030" },
  sweater:     { zara: "woman-knitwear-l1152", massimo: "women/knitwear-l604", bershka: "woman-clothes-knitwear-c1010194028", pullbear: "woman-clothing-knitwear-l731", stradivarius: "women/clothing/knitwear-n2031" },
  blazer:      { zara: "woman-blazers-l1055", massimo: "women/jackets-blazers-l617", stradivarius: "women/clothing/blazers-n2032" },

  // Bottoms
  jeans:       { zara: "woman-jeans-l1119", massimo: "women/jeans-l613", bershka: "woman-clothes-jeans-c1010194040", pullbear: "woman-clothing-jeans-l732", stradivarius: "women/clothing/jeans-n2033" },
  trousers:    { zara: "woman-trousers-l1335", massimo: "women/trousers-l612", bershka: "woman-clothes-pants-c1010194044", pullbear: "woman-clothing-pants-l733", stradivarius: "women/clothing/trousers-n2034" },
  shorts:      { zara: "woman-shorts-l1219", massimo: "women/trousers/shorts-l614", bershka: "woman-clothes-bermudas-c1010194045", pullbear: "woman-clothing-bermudas-l734", stradivarius: "women/clothing/shorts-n2035" },
  skirt:       { zara: "woman-skirts-l1299", massimo: "women/skirts-l615", bershka: "woman-clothes-skirts-c1010194042", pullbear: "woman-clothing-skirts-l735", stradivarius: "women/clothing/skirts-n2036" },
  dress:       { zara: "woman-dress-l1066", massimo: "women/dresses-l616", bershka: "woman-clothes-dresses-c1010194022", pullbear: "woman-clothing-dresses-l736", stradivarius: "women/clothing/dresses-n2037" },

  // Shoes
  sneakers:        { zara: "woman-shoes-sneakers-l1303", massimo: "women/shoes/sneakers-l1574", bershka: "woman-shoes-c1010194049", pullbear: "woman-shoes-sneakers-l737", stradivarius: "women/shoes/sneakers-n2038" },
  heels:           { zara: "woman-shoes-heels-l1303", massimo: "women/shoes/heels-l1575", stradivarius: "women/shoes/heels-n2039" },
  boots:           { zara: "woman-shoes-boots-l1304", massimo: "women/shoes/boots-l1576", stradivarius: "women/shoes/boots-n2040" },
};

// ─── COLOR FILTER (Zara only — më të avancuara) ─────────────────────────────
// Përdoret kur user-i kërkon ngjyrë specifike (p.sh. chelsea boots black)
const ZARA_COLOR_FILTERS: Record<string, string> = {
  black: "black",
  white: "white",
  navy: "navy-blue",
  blue: "blue",
  grey: "grey",
  brown: "brown",
  earth: "brown",
  beige: "beige",
  red: "red",
  green: "green",
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN FUNCTION — buildInditexLink
// ═══════════════════════════════════════════════════════════════════════════
export type BuildLinkOptions = {
  brand: InditexBrand;
  category: string;         // p.sh. "chelsea_boots", "tee", "jeans"
  country: string;          // ISO code: "DE", "IT", "US"
  gender?: Gender;          // default "male"
  color?: string;           // opsional
};

export function buildInditexLink(opts: BuildLinkOptions): string | null {
  const { brand, category, country, gender = "male", color } = opts;

  // 1. Kontrollo nëse brendi e mbulon këtë gjini
  const brandInfo = BRAND_INFO[brand];
  if (!brandInfo.gender.includes(gender)) return null;

  // 2. Kontrollo nëse vendi është i mbuluar
  //    Fallback strategy: vende të paspecifikuara → WW (Zara Worldwide platform)
  //    Zara WW dorëzon në 200+ vende globalisht me eurot si valutë
  const countryCode = country.toUpperCase();
  const countrySlug = COUNTRIES[countryCode] ?? {
    zara: "ww/en",
    massimo: "es/en",
    bershka: "ww",
    pullbear: "ww",
    stradivarius: "ww/en",
  };

  // 3. Merr categoryMap për gjininë e duhur
  const catMap = gender === "female" ? CATEGORIES_FEMALE : CATEGORIES_MALE;
  const cat = catMap[category.toLowerCase()];
  if (!cat) {
    // Fallback: kategoria s'njihet → landing page male/female
    return buildFallbackLink(brand, countrySlug, gender);
  }

  // 4. Ndërto URL sipas brendit
  switch (brand) {
    case "zara": {
      if (!cat.zara) return buildFallbackLink(brand, countrySlug, gender);
      let url = `https://www.zara.com/${countrySlug.zara}/${cat.zara}.html`;
      // Shto color filter nëse aplikohet (vetëm Zara mbështet këtë)
      if (color && ZARA_COLOR_FILTERS[color.toLowerCase()]) {
        // Color filter te Zara është bashkangjitur te slug-u
        // p.sh. man-blazers-black-l2501.html (por id ndryshon për çdo color/category)
        // Si fallback, e lëmë URL bazë (më shumë rezultate)
      }
      return appendUTM(url);
    }

    case "massimo_dutti": {
      if (!cat.massimo) return buildFallbackLink(brand, countrySlug, gender);
      const url = `https://www.massimodutti.com/${countrySlug.massimo}/${cat.massimo}`;
      return appendUTM(url);
    }

    case "bershka": {
      if (!cat.bershka) return buildFallbackLink(brand, countrySlug, gender);
      const url = `https://www.bershka.com/${countrySlug.bershka}/${cat.bershka}.html`;
      return appendUTM(url);
    }

    case "pull_bear": {
      if (!cat.pullbear) return buildFallbackLink(brand, countrySlug, gender);
      const url = `https://www.pullandbear.com/${countrySlug.pullbear}/${cat.pullbear}.html`;
      return appendUTM(url);
    }

    case "stradivarius": {
      if (!cat.stradivarius) return buildFallbackLink(brand, countrySlug, gender);
      const url = `https://www.stradivarius.com/${countrySlug.stradivarius}/${cat.stradivarius}`;
      return appendUTM(url);
    }
  }
}

// ─── FALLBACK: Landing page male/female ─────────────────────────────────────
function buildFallbackLink(brand: InditexBrand, slug: CountrySlug, gender: Gender): string {
  const g = gender === "female" ? "woman" : "man";
  switch (brand) {
    case "zara":
      return appendUTM(`https://www.zara.com/${slug.zara}/${g}-${g === "man" ? "l7465" : "l1180"}.html`);
    case "massimo_dutti":
      return appendUTM(`https://www.massimodutti.com/${slug.massimo}/${g === "man" ? "men" : "women"}`);
    case "bershka":
      return appendUTM(`https://www.bershka.com/${slug.bershka}/${g === "man" ? "h-man.html" : "h-woman.html"}`);
    case "pull_bear":
      return appendUTM(`https://www.pullandbear.com/${slug.pullbear}/${g === "man" ? "man-n6228" : "woman-n6229"}.html`);
    case "stradivarius":
      return appendUTM(`https://www.stradivarius.com/${slug.stradivarius}/women`);
  }
}

// ─── UTM TRACKING (për analytics të brendshme) ──────────────────────────────
function appendUTM(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}utm_source=occaswear&utm_medium=app&utm_campaign=missing-piece`;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Cili brend mbulon këtë kategori?
// Përdoret te Missing Piece — për të treguar vetëm karta për brendet që e kanë
// ═══════════════════════════════════════════════════════════════════════════
export function getBrandsForCategory(category: string, gender: Gender = "male"): InditexBrand[] {
  const catMap = gender === "female" ? CATEGORIES_FEMALE : CATEGORIES_MALE;
  const cat = catMap[category.toLowerCase()];
  if (!cat) {
    // Kategoria s'njihet → kthe të gjithë brendet që mbulojnë gjininë
    return (Object.keys(BRAND_INFO) as InditexBrand[]).filter(b =>
      BRAND_INFO[b].gender.includes(gender)
    );
  }

  const brands: InditexBrand[] = [];
  if (cat.zara) brands.push("zara");
  if (cat.massimo) brands.push("massimo_dutti");
  if (cat.bershka) brands.push("bershka");
  if (cat.pullbear) brands.push("pull_bear");
  if (cat.stradivarius && gender === "female") brands.push("stradivarius");

  return brands;
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPER: Country code nga lat/lng (reverse geocoding)
// Përdoret kur user-i s'ka country të caktuar — marrim nga geolocation
// ═══════════════════════════════════════════════════════════════════════════
export async function getCountryFromCoords(lat: number, lon: number): Promise<string> {
  try {
    // Përdor Open-Meteo Geocoding API (FALAS, pa key)
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&format=json`
    );
    if (!res.ok) return "ES"; // fallback
    const data = await res.json();
    const country = data?.results?.[0]?.country_code;
    return country ? country.toUpperCase() : "ES";
  } catch {
    return "ES";
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// COUNTRY NAME — për UI
// 70+ vende të mbuluara, përfshirë diasporën shqiptare dhe markets kryesore
// ═══════════════════════════════════════════════════════════════════════════
export const COUNTRY_NAMES: Record<string, string> = {
  // Evropa
  DE: "Germany", IT: "Italy", CH: "Switzerland", GB: "United Kingdom",
  UK: "United Kingdom", IE: "Ireland", FR: "France", ES: "Spain", PT: "Portugal",
  NL: "Netherlands", BE: "Belgium", LU: "Luxembourg", AT: "Austria",
  SE: "Sweden", NO: "Norway", DK: "Denmark", FI: "Finland", IS: "Iceland",
  PL: "Poland", CZ: "Czech Republic", SK: "Slovakia", HU: "Hungary",
  RO: "Romania", BG: "Bulgaria", HR: "Croatia", SI: "Slovenia",
  EE: "Estonia", LV: "Latvia", LT: "Lithuania", GR: "Greece", CY: "Cyprus",
  MT: "Malta", TR: "Turkey",
  // Ballkani
  RS: "Serbia", AL: "Albania", XK: "Kosovo", MK: "North Macedonia",
  BA: "Bosnia & Herzegovina", ME: "Montenegro",
  // Amerikat
  US: "United States", CA: "Canada", MX: "Mexico", BR: "Brazil",
  AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru", UY: "Uruguay",
  // Azia & Oqeania
  CN: "China", JP: "Japan", KR: "South Korea", HK: "Hong Kong",
  TW: "Taiwan", SG: "Singapore", MY: "Malaysia", TH: "Thailand",
  PH: "Philippines", ID: "Indonesia", VN: "Vietnam", IN: "India",
  AU: "Australia", NZ: "New Zealand",
  // Lindja e Mesme
  AE: "UAE", SA: "Saudi Arabia", KW: "Kuwait", QA: "Qatar",
  BH: "Bahrain", OM: "Oman", JO: "Jordan", LB: "Lebanon",
  IL: "Israel", EG: "Egypt",
  // Afrika
  ZA: "South Africa", MA: "Morocco", TN: "Tunisia",
  NG: "Nigeria", KE: "Kenya", GH: "Ghana",
};

export function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code.toUpperCase();
}