#!/usr/bin/env node
/**
 * esign-live-drill — walk the PUBLIC e-sign flow against production with a
 * throwaway session, then remove it.
 *
 * Why this shape: the admin mint endpoint needs the admin password, which an
 * automated drill must not hold. Instead the drill writes a session directly
 * into the SIGNING namespace with `wrangler` (infrastructure credentials, not
 * a login), using the SAME hash functions the server uses, then exercises
 * every public step exactly as a customer's browser would:
 *
 *   1. GET   -> preview only (needsCode, no documents, no last name)
 *   2. POST  wrong code -> 401 with attempts left
 *   3. POST  right code -> 200 + signer token; GET now returns documents
 *   4. POST  consent with the wrong PDF word -> 400; with OAKS -> consented
 *   5. PATCH a signature WITHOUT the token -> 401; WITH it -> signed, done
 *   6. `wrangler kv key get` -> the record exists, and `wrangler kv key list`
 *      shows NO expiration on it (retained, not expiring)
 *   7. delete the key
 *
 * Usage: node scripts/esign-live-drill.mjs [baseUrl]
 */
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const BASE = process.argv[2] ?? "https://www.loveautogroup.net";
const NS = (() => {
  const cfg = readFileSync(new URL("../wrangler.jsonc", import.meta.url), "utf8");
  const m = cfg.match(/"binding":\s*"SIGNING"[\s\S]*?"id":\s*"([0-9a-f]{32})"/);
  if (!m) throw new Error("SIGNING namespace id not found in wrangler.jsonc");
  return m[1];
})();

const sha = (s) => createHash("sha256").update(s).digest("hex");
const id = randomUUID();
const CODE = "424242";
const doc = { kind: "as-is-disclosure", title: "DRILL — As-Is term", body: "Drill body. Not a real document." };
doc.contentHash = sha(`${doc.kind}\n${doc.title}\n${doc.body ?? ""}`);
const session = {
  id,
  createdAt: new Date().toISOString(),
  createdBy: "esign-live-drill",
  customer: { firstName: "Drill", lastName: "Session", phone: "6305550000" },
  vehicle: "DRILL — not a real deal",
  documents: [doc],
  expiresAt: new Date(Date.now() + 2 * 3600_000).toISOString(),
  status: "created",
  codeHash: sha(`${id}:${CODE}`),
  codeAttempts: 0,
  codeToPhone: "6305550000",
};

function wrangler(...args) {
  return execFileSync("npx", ["wrangler", "kv", "key", ...args, `--namespace-id=${NS}`, "--remote"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
  });
}
async function call(method, path, body, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  return { status: res.status, json, cc: res.headers.get("cache-control") };
}
const results = [];
function check(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

console.log(`drill session ${id} on ${BASE}`);
wrangler("put", `session:${id}`, JSON.stringify(session), "--ttl", "7200");
try {
  // 1. preview only
  let r = await call("GET", `/api/sign/${id}`);
  check("GET without code is a preview", r.status === 200 && r.json.session?.needsCode === true && !r.json.session?.documents && !r.json.session?.customer?.lastName, `${r.status} ${JSON.stringify(r.json.session)}`);
  check("responses are no-store", (r.cc ?? "").includes("no-store"), r.cc);

  // 2. wrong code
  r = await call("POST", `/api/sign/${id}`, { action: "verify-code", code: "000000" });
  check("wrong code -> 401 with attempts left", r.status === 401 && r.json.attemptsLeft === 4, `${r.status} ${r.json.error}`);

  // 3. right code
  r = await call("POST", `/api/sign/${id}`, { action: "verify-code", code: CODE });
  const token = r.json.signerToken;
  check("right code -> 200 + signer token", r.status === 200 && /^[0-9a-f]{64}$/.test(token ?? ""), `${r.status}`);
  const auth = { "X-Signer-Token": token ?? "" };
  r = await call("GET", `/api/sign/${id}`, undefined, auth);
  check("GET with token shows the documents", r.status === 200 && r.json.session?.needsCode === false && r.json.session?.documents?.length === 1, `${r.status}`);
  r = await call("GET", `/api/sign/${id}`);
  check("GET without token is STILL a preview after verification", r.json.session?.needsCode === true);

  // 4. consent
  r = await call("POST", `/api/sign/${id}`, { action: "consent", consent: true, consentVersion: "2026-09-02.2", pdfWord: "maple" }, auth);
  check("wrong PDF word -> 400", r.status === 400, `${r.status} ${r.json.error}`);
  r = await call("POST", `/api/sign/${id}`, { action: "consent", consent: true, consentVersion: "0000-00-00.0", pdfWord: "oaks" }, auth);
  check("stale consent version -> 409", r.status === 409, `${r.status}`);
  r = await call("POST", `/api/sign/${id}`, { action: "consent", consent: true, consentVersion: "2026-09-02.2", pdfWord: "oaks" }, auth);
  check("consent with OAKS -> consented, version + hash recorded", r.status === 200 && r.json.session?.status === "consented" && r.json.session?.consentVersion === "2026-09-02.2" && /^[0-9a-f]{64}$/.test(r.json.session?.consentTextHash ?? ""), `${r.status} ${r.json.error ?? ""}`);

  // 5. sign
  const sig = { kind: "as-is-disclosure", signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", signatureMeta: { strokeCount: 3, canvasWidthCss: 400, canvasHeightCss: 150, capturedAt: new Date().toISOString() } };
  r = await call("PATCH", `/api/sign/${id}`, sig);
  check("PATCH without the token -> 401", r.status === 401, `${r.status}`);
  r = await call("PATCH", `/api/sign/${id}`, { ...sig, kind: "odometer-disclosure" }, auth);
  check("PATCH an odometer disclosure -> refused", r.status === 400, `${r.status}`);
  r = await call("PATCH", `/api/sign/${id}`, sig, auth);
  check("PATCH with the token -> signed, bound to the document hash", r.status === 200 && r.json.done === true && r.json.session?.signedDocuments?.[0]?.documentHash === doc.contentHash, `${r.status} ${r.json.error ?? ""}`);

  // 6. retained
  const listed = JSON.parse(wrangler("list", "--prefix", `session:${id}`).replace(/^[^[]*/, ""));
  const key = listed.find((k) => k.name === `session:${id}`);
  check("completed record exists and carries NO expiration", !!key && key.expiration === undefined, JSON.stringify(key));
  r = await call("GET", `/api/sign/${id}`, undefined, auth);
  check("a completed session reads as signed, not expired", r.status === 200 && r.json.session?.status === "signed", `${r.status}`);
} finally {
  // 7. clean up
  try { wrangler("delete", `session:${id}`); console.log("drill session deleted"); } catch (e) { console.error("CLEANUP FAILED — delete manually:", `session:${id}`, e.message); }
}
const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
