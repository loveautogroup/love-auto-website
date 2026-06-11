/**
 * Cloudflare Zero Trust Access — JWT verification (defense in depth).
 *
 * The admin Pages Functions sit behind a Cloudflare Access application, but
 * relying on the *presence* of the `cf-access-jwt-assertion` header is NOT
 * authentication — any caller can set that header to an arbitrary value. If
 * the Access app is ever misconfigured to cover only the `/admin/*` HTML
 * pages and not `/api/admin/*`, the request reaches the Function directly
 * and a presence-only check returns 200.
 *
 * This module cryptographically verifies the Access JWT against the team's
 * public keys (JWKS), and validates `aud` and `exp`. It is dependency-free
 * (uses the Workers WebCrypto API) so it runs in any Pages Function.
 *
 * Required Pages env vars (Production + Preview):
 *   CF_ACCESS_TEAM_DOMAIN  e.g. "loveauto.cloudflareaccess.com"  (no scheme)
 *   CF_ACCESS_AUD          the Application Audience (AUD) tag from the Access app
 *
 * Fails CLOSED: if either var is unset, verification throws → 403.
 */

export interface AccessEnv {
  CF_ACCESS_TEAM_DOMAIN?: string;
  CF_ACCESS_AUD?: string;
}

export interface AccessIdentity {
  email: string;
  sub: string;
}

/** Thrown on any verification failure. Callers map this to a 403. */
export class AccessDenied extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessDenied";
  }
}

interface Jwk {
  kid: string;
  kty: string;
  alg?: string;
  use?: string;
  n: string;
  e: string;
}

// In-isolate JWKS cache (Pages isolates are short-lived; this just avoids a
// refetch within a single invocation burst).
let jwksCache: { domain: string; keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000; // 1 hour

function b64urlToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(b64url.length / 4) * 4,
    "="
  );
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlDecodeJson(b64url: string): any {
  const bytes = b64urlToUint8(b64url);
  return JSON.parse(new TextDecoder().decode(bytes));
}

async function getJwks(teamDomain: string): Promise<Jwk[]> {
  if (
    jwksCache &&
    jwksCache.domain === teamDomain &&
    Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS
  ) {
    return jwksCache.keys;
  }
  const url = `https://${teamDomain}/cdn-cgi/access/certs`;
  const res = await fetch(url, { cf: { cacheTtl: 3600 } as any });
  if (!res.ok) {
    throw new AccessDenied(`JWKS fetch failed (${res.status})`);
  }
  const data = (await res.json()) as { keys?: Jwk[] };
  if (!data.keys || data.keys.length === 0) {
    throw new AccessDenied("JWKS empty");
  }
  jwksCache = { domain: teamDomain, keys: data.keys, fetchedAt: Date.now() };
  return data.keys;
}

/**
 * Verify the Access JWT from the request. Returns the identity on success,
 * throws AccessDenied on any failure. Map the throw to a 403 response.
 */
export async function verifyAccessJwt(
  request: Request,
  env: AccessEnv
): Promise<AccessIdentity> {
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN;
  const aud = env.CF_ACCESS_AUD;
  if (!teamDomain || !aud) {
    // Fail closed — never allow access when the verifier isn't configured.
    throw new AccessDenied("Access verification not configured");
  }

  const token = request.headers.get("cf-access-jwt-assertion");
  if (!token) throw new AccessDenied("Missing Access assertion");

  const parts = token.split(".");
  if (parts.length !== 3) throw new AccessDenied("Malformed JWT");
  const [headerB64, payloadB64, sigB64] = parts;

  let header: { kid?: string; alg?: string };
  let payload: { aud?: string | string[]; exp?: number; iss?: string; email?: string; sub?: string };
  try {
    header = b64urlDecodeJson(headerB64);
    payload = b64urlDecodeJson(payloadB64);
  } catch {
    throw new AccessDenied("Unparseable JWT");
  }

  if (header.alg !== "RS256") throw new AccessDenied(`Unexpected alg ${header.alg}`);
  if (!header.kid) throw new AccessDenied("Missing kid");

  // Audience check (aud may be string or array).
  const audOk = Array.isArray(payload.aud)
    ? payload.aud.includes(aud)
    : payload.aud === aud;
  if (!audOk) throw new AccessDenied("aud mismatch");

  // Issuer check (Access tokens are issued by the team domain).
  if (payload.iss && payload.iss !== `https://${teamDomain}`) {
    throw new AccessDenied("iss mismatch");
  }

  // Expiry check (exp is seconds since epoch).
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) throw new AccessDenied("Token expired");

  // Find the signing key and verify the signature.
  const keys = await getJwks(teamDomain);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) throw new AccessDenied("Signing key not found");

  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true } as JsonWebKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = b64urlToUint8(sigB64);
  const valid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    sig,
    signed
  );
  if (!valid) throw new AccessDenied("Bad signature");

  return { email: payload.email ?? "unknown", sub: payload.sub ?? "" };
}

/** Helper: run the verifier and return a 403 Response on failure, else null. */
export async function denyIfNoAccess(
  request: Request,
  env: AccessEnv
): Promise<Response | null> {
  try {
    await verifyAccessJwt(request, env);
    return null;
  } catch (e) {
    const msg = e instanceof AccessDenied ? e.message : "Forbidden";
    return new Response(JSON.stringify({ error: `Forbidden: ${msg}` }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
}
