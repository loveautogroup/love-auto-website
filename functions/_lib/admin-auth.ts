/**
 * Code-based admin authentication for the /admin pages and /api/admin/* APIs.
 *
 * Replaces the (never-configured) Cloudflare Access gate. A single admin
 * password logs in; success sets an HMAC-signed, httpOnly, Secure,
 * SameSite=Strict session cookie. Every admin API verifies that cookie;
 * the /admin/* HTML is gated by functions/admin/_middleware.ts.
 *
 * Required Pages env vars (Production + Preview):
 *   ADMIN_PASSWORD     the login password (choose a strong one)
 *   ADMIN_AUTH_SECRET  random 32+ char string used to sign session cookies
 *
 * Fails CLOSED: if ADMIN_AUTH_SECRET is unset, every session check fails
 * (403/redirect to login), so a misconfig never silently opens admin.
 */

export interface AdminAuthEnv {
  ADMIN_PASSWORD?: string;
  ADMIN_AUTH_SECRET?: string;
}

export const SESSION_COOKIE = "__Secure-lag_admin";
export const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

// ---- base64url helpers ----
function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlEncodeStr(s: string): string {
  return b64urlEncode(new TextEncoder().encode(s));
}
function b64urlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(b64url.length / 4) * 4,
    "="
  );
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Constant-time compare of two equal-length strings. */
export function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** Build a signed session token: base64url(payload).base64url(hmac). */
export async function signSession(env: AdminAuthEnv): Promise<string> {
  if (!env.ADMIN_AUTH_SECRET) throw new Error("ADMIN_AUTH_SECRET unset");
  const payload = JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS });
  const payloadB64 = b64urlEncodeStr(payload);
  const key = await importHmacKey(env.ADMIN_AUTH_SECRET);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadB64))
  );
  return `${payloadB64}.${b64urlEncode(sig)}`;
}

/** Verify the session cookie on a request. Returns true iff valid + unexpired. */
export async function verifySession(request: Request, env: AdminAuthEnv): Promise<boolean> {
  if (!env.ADMIN_AUTH_SECRET) return false; // fail closed
  const cookie = request.headers.get("Cookie") ?? "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (!m) return false;
  const token = m[1];
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payloadB64, sigB64] = parts;
  let sig: Uint8Array;
  try {
    sig = b64urlToBytes(sigB64);
  } catch {
    return false;
  }
  const key = await importHmacKey(env.ADMIN_AUTH_SECRET);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sig,
    new TextEncoder().encode(payloadB64)
  );
  if (!ok) return false;
  try {
    const payload = JSON.parse(new TextDecoder().decode(b64urlToBytes(payloadB64)));
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
      return false;
    }
  } catch {
    return false;
  }
  return true;
}

/** Set-Cookie header value for a fresh session. */
export function sessionSetCookie(token: string): string {
  return `${SESSION_COOKIE}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}`;
}

/** Set-Cookie header value that clears the session. */
export function sessionClearCookie(): string {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

/**
 * Gate an admin API handler. Returns a 401 Response when not authenticated,
 * else null (proceed). Use at the top of every /api/admin/* handler.
 */
export async function requireAdmin(
  request: Request,
  env: AdminAuthEnv
): Promise<Response | null> {
  if (await verifySession(request, env)) return null;
  return new Response(JSON.stringify({ error: "Unauthenticated. Admin login required." }), {
    status: 401,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** Minimal login page served to unauthenticated /admin/* visitors. */
export function loginPageResponse(error?: string): Response {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin Login — Love Auto Group</title>
<style>
  :root { color-scheme: dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
    background:#0a0a0a; color:#fff; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  .card { width:320px; padding:32px 28px; background:#151515; border:1px solid #262626; border-radius:14px; }
  h1 { font-size:18px; margin:0 0 4px; letter-spacing:.02em; }
  p { font-size:13px; color:#9ca3af; margin:0 0 20px; }
  label { font-size:11px; text-transform:uppercase; letter-spacing:.08em; color:#9ca3af; }
  input { width:100%; box-sizing:border-box; margin:6px 0 16px; padding:11px 12px; border-radius:9px;
    border:1px solid #333; background:#0f0f0f; color:#fff; font-size:15px; }
  button { width:100%; padding:11px; border:0; border-radius:9px; background:#dc2626; color:#fff;
    font-size:15px; font-weight:600; cursor:pointer; }
  button:disabled { opacity:.6; cursor:default; }
  .err { color:#f87171; font-size:13px; min-height:18px; margin-top:10px; }
</style></head>
<body><form class="card" id="f">
  <h1>Love Auto Group</h1><p>Admin sign in</p>
  <label for="p">Password</label>
  <input id="p" type="password" autocomplete="current-password" autofocus>
  <button id="b" type="submit">Sign in</button>
  <div class="err" id="e">${error ? error.replace(/</g, "&lt;") : ""}</div>
<script>
  const f=document.getElementById('f'),b=document.getElementById('b'),e=document.getElementById('e');
  f.addEventListener('submit',async ev=>{ev.preventDefault();b.disabled=true;e.textContent='';
    try{const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({password:document.getElementById('p').value})});
      if(r.ok){location.reload();}else{const j=await r.json().catch(()=>({}));
        e.textContent=j.error||'Sign in failed';b.disabled=false;}}
    catch(_){e.textContent='Network error';b.disabled=false;}});
</script>
</form></body></html>`;
  return new Response(html, {
    status: error ? 401 : 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
