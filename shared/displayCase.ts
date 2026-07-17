/**
 * E3 — display casing for vehicle makes / models / trims.
 *
 * The DMS feed ships SHOUTING or lowercase values ("LEXUS", "SLK350",
 * "gs 350"), and naive titleCase() renders "Slk350", "Mkz", "Cx-3".
 * This module produces showroom-correct display strings:
 *
 *   slk350        → SLK350        mkz          → MKZ
 *   cx-3          → CX-3          gs 350       → GS 350
 *   328i          → 328i          f-150        → F-150
 *   ecoboost premium → Ecoboost Premium
 *
 * Rules, in order per token:
 *   1. FORCED dictionary hit (whole value first, then per token).
 *   2. digits + short letter suffix (328i, 535d, 340xi) → keep the
 *      BMW-style lowercase suffix.
 *   3. mixed letters+digits (slk350, qx60, sr5) → UPPERCASE.
 *   4. otherwise Title Case the word.
 *
 * Slugs are NOT affected — vehicleSlug() lowercases everything anyway,
 * so applying this at the feed boundary can never move a URL.
 *
 * dedupeTrim() kills the "Boxster Boxster" class: DC sometimes repeats
 * the model inside the trim field.
 */

const FORCED: Record<string, string> = {
  // Makes that titleCase mangles
  bmw: "BMW",
  gmc: "GMC",
  mini: "MINI",
  ram: "RAM",
  // Whole-value compounds (checked before token split)
  "cr-v": "CR-V",
  "hr-v": "HR-V",
  "cr-z": "CR-Z",
  "mx-5": "MX-5",
  "fr-s": "FR-S",
  "ex-l": "EX-L",
  // Letter-only model/trim acronyms (alphanumeric rule can't catch these)
  cx: "CX",
  mdx: "MDX",
  rdx: "RDX",
  tlx: "TLX",
  ilx: "ILX",
  tsx: "TSX",
  nsx: "NSX",
  zdx: "ZDX",
  tl: "TL",
  rl: "RL",
  tt: "TT",
  wrx: "WRX",
  sti: "STI",
  brz: "BRZ",
  xv: "XV",
  gti: "GTI",
  gli: "GLI",
  mkz: "MKZ",
  mkc: "MKC",
  mkx: "MKX",
  mks: "MKS",
  mkt: "MKT",
  srx: "SRX",
  ats: "ATS",
  cts: "CTS",
  xts: "XTS",
  dts: "DTS",
  sts: "STS",
  cla: "CLA",
  cls: "CLS",
  gla: "GLA",
  glb: "GLB",
  glc: "GLC",
  gle: "GLE",
  gls: "GLS",
  glk: "GLK",
  amg: "AMG",
  sl: "SL",
  slk: "SLK",
  slc: "SLC",
  clk: "CLK",
  gs: "GS",
  es: "ES",
  is: "IS",
  ls: "LS",
  rc: "RC",
  nx: "NX",
  rx: "RX",
  gx: "GX",
  lx: "LX",
  ux: "UX",
  ct: "CT",
  ss: "SS",
  hhr: "HHR",
  trd: "TRD",
  svt: "SVT",
  gt: "GT",
  rt: "RT",
  sel: "SEL",
  sle: "SLE",
  slt: "SLT",
  ltz: "LTZ",
  lt: "LT",
  le: "LE",
  se: "SE",
  xle: "XLE",
  xse: "XSE",
  ex: "EX",
  dx: "DX",
  si: "Si",
  phev: "PHEV",
  ev: "EV",
  hse: "HSE",
  awd: "AWD",
  fwd: "FWD",
  rwd: "RWD",
  "4wd": "4WD",
  suv: "SUV",
};

/** BMW-style digits+suffix: 328i, 535d, 340xi — suffix stays lowercase. */
const DIGITS_SUFFIX = /^(\d+)([a-z]{1,2})$/i;

function caseToken(tok: string): string {
  if (!tok) return tok;
  const lower = tok.toLowerCase();
  const forced = FORCED[lower];
  if (forced) return forced;
  const bmwStyle = DIGITS_SUFFIX.exec(tok);
  if (bmwStyle) return `${bmwStyle[1]}${bmwStyle[2].toLowerCase()}`;
  if (/[a-z]/i.test(tok) && /\d/.test(tok)) return tok.toUpperCase();
  return tok.charAt(0).toUpperCase() + tok.slice(1).toLowerCase();
}

/** Showroom-correct casing for a make, model, or trim string. */
export function displayCase(value: string): string {
  const v = (value ?? "").trim();
  if (!v) return "";
  const whole = FORCED[v.toLowerCase()];
  if (whole) return whole;
  // Split on spaces, hyphens, and slashes, preserving the separators.
  return v
    .split(/(\s+|-|\/)/)
    .map((part) => (/^(\s+|-|\/)$/.test(part) ? part : caseToken(part)))
    .join("")
    .replace(/\s+/g, " ");
}

/**
 * Drop the model name when Dealer Center repeats it inside the trim —
 * "Boxster" + "Boxster" → "", "Boxster" + "Boxster S" → "S". Prevents
 * the "Boxster Boxster" display class everywhere model+trim concatenate.
 */
export function dedupeTrim(model: string, trim: string): string {
  const t = (trim ?? "").trim();
  if (!t) return "";
  const m = (model ?? "").trim().toLowerCase();
  if (!m) return t;
  const tl = t.toLowerCase();
  if (tl === m) return "";
  if (tl.startsWith(m + " ")) return t.slice(m.length + 1).trim();
  return t;
}
