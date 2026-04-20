# Merchandising Admin — Cloudflare Setup Guide

One-time configuration in the Cloudflare dashboard before the admin UI
works. Follow the steps below in order. Total time: about 15 minutes.

## 1. Create the KV namespace

This is where the merchandising config lives at runtime.

1. In the Cloudflare dashboard, go to **Workers & Pages → KV**
2. Click **Create a namespace**
3. Name it **`MERCHANDISING`** (exact casing)
4. Copy the **Namespace ID** that appears — you'll paste it into `wrangler.jsonc`
5. Create a second namespace named **`MERCHANDISING_preview`** (for branch previews)
6. Copy the preview Namespace ID too

Paste both IDs into `wrangler.jsonc` at the repo root, replacing the placeholder values:

```jsonc
"kv_namespaces": [
  {
    "binding": "MERCHANDISING",
    "id": "abc123...",          // ← production ID
    "preview_id": "def456..."   // ← preview ID
  }
]
```

Commit that change. Cloudflare will pick it up on the next deploy.

Alternative: bind the namespace through the dashboard UI (**Pages project → Settings → Functions → KV namespace bindings**). Use the same binding name `MERCHANDISING`.

## 2. Turn on Cloudflare Zero Trust Access (free tier)

Access gates the admin page and the admin API without you writing any auth code.

1. Dashboard → **Zero Trust → Access → Applications** → **Add an application**
2. Pick **Self-hosted**
3. **Application name:** Love Auto Group Admin
4. **Session duration:** 24 hours (or whatever feels right)
5. **Application domain:**
   - Subdomain/domain: `loveautogroup.pages.dev` (or your custom domain when live)
   - Path: `admin/*`
6. **Additional domain** (click "Add another domain"):
   - Same domain, path: `api/admin/*`
7. Click **Next**
8. **Policy name:** "Allowed merchandisers"
9. **Rule:** Action = **Allow**, Include = **Emails**
10. Add the emails allowed to sign in:
    - `loveautogroup@gmail.com` (Jeremiah)
    - Jordan's email when he has one
11. Save the policy, save the application

When someone visits `/admin/merchandising`, Cloudflare now intercepts, sends a 6-digit code to their email, and lets them through on success. Sessions last however long you configured.

## 3. Seed the KV namespace (optional — site works without it)

The first time Jordan opens the admin UI, the page loads the build-time config from `src/data/merchandising.ts` as a starting point. When he clicks Save, the config is written to KV. No seeding needed.

If you'd rather pre-seed, via Wrangler CLI:

```bash
wrangler kv:key put --binding=MERCHANDISING "config:v1" "$(cat initial-config.json)"
```

## 4. Verify the setup

1. Push the `feature/vehicle-card-badges` branch and wait for Cloudflare to deploy
2. Open the preview URL, append `/admin/merchandising`
3. Cloudflare Access should ask for your email, then email you a code
4. Enter the code — admin UI loads
5. Toggle a vehicle as featured, click Save — "Saved ✓" should appear within a second
6. Open `/inventory` — the featured vehicle should now be pinned to the top

If anything fails, check:
- **Can't reach /admin:** KV binding missing (Step 1) or CF Access misconfigured (Step 2)
- **401 on Save:** Access is gating the API correctly — this just means your session expired. Refresh.
- **Save succeeds but site doesn't update:** KV cache hasn't expired yet (max 60 seconds). Hard refresh.

## Security posture (for Sam's review later)

- Admin page and API are both behind Cloudflare Zero Trust Access (email allow-list)
- Admin API additionally checks for `cf-access-jwt-assertion` header as defense in depth
- All POST bodies are validated server-side via `functions/_lib/validation.ts` (VIN regex, length caps, enum check)
- Audit trail: every KV write stamps `updatedBy` and `updatedAt` server-side
- KV payload size capped at 64 KB
- `/admin/*` and `/api/admin/*` carry `noindex, nofollow` and `no-store` cache headers
- `robots.txt` disallows `/admin/` and `/api/admin/`
- No customer PII is stored or processed anywhere in this system
- No passwords handled in-app — Cloudflare Access owns auth end-to-end
