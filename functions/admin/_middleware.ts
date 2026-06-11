/**
 * Gate for the /admin/* HTML pages.
 *
 * Runs before the static admin assets are served. If the request has no
 * valid admin session cookie, we serve the login page instead of the real
 * admin UI. Once the user logs in (POST /api/admin/login sets the cookie),
 * a reload passes this check and the real page is served via next().
 *
 * The admin DATA is independently protected: every /api/admin/* handler
 * calls requireAdmin(), so even a cached/leaked HTML shell can fetch nothing
 * without the cookie.
 */
import { AdminAuthEnv, verifySession, loginPageResponse } from "../_lib/admin-auth";

export const onRequest: PagesFunction<AdminAuthEnv> = async (ctx) => {
  if (await verifySession(ctx.request, ctx.env)) {
    return ctx.next();
  }
  return loginPageResponse();
};
