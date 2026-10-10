import { ApiError } from "./contracts";
export type BackendEnvironment = { DB?: D1Database; MOVEFIELD_TRUST_SITES_AUTH?: string; MOVEFIELD_AI_BASE_URL?: string; MOVEFIELD_AI_API_KEY?: string; MOVEFIELD_AI_MODEL?: string };
export function requireOwner(request: Request, environment: BackendEnvironment): string {
  if (environment.MOVEFIELD_TRUST_SITES_AUTH !== "1") throw new ApiError(503, "account_backend_unavailable");
  if (request.headers.has("authorization")) throw new ApiError(401, "native_auth_unavailable");
  if (request.headers.get("x-movefield-client") !== "web") throw new ApiError(403, "web_client_required");
  const url = new URL(request.url); const origin = request.headers.get("origin"); const site = request.headers.get("sec-fetch-site");
  if ((origin && origin !== url.origin) || (site && site !== "same-origin")) throw new ApiError(403, "cross_origin_denied");
  if (request.method !== "GET" && origin !== url.origin) throw new ApiError(403, "same_origin_required");
  const owner = request.headers.get("oai-authenticated-user-id"); const email = request.headers.get("oai-authenticated-user-email");
  if (!owner || owner.length > 256 || /[\s\u0000-\u001f\u007f]/u.test(owner) || !email || email.length > 320) throw new ApiError(401, "sign_in_required");
  if (["GET", "POST"].includes(request.method) && ["/api/sync", "/api/daily-feedback", "/api/workout-coaching"].includes(url.pathname)) {
    const expected = request.headers.get("x-movefield-expected-account");
    if (!expected) throw new ApiError(403, "account_binding_required");
    // This precondition only rejects a changed signed-in account. The trusted
    // ingress owner remains the sole identity used for every database action.
    if (expected !== owner) throw new ApiError(401, "account_changed");
  }
  return owner;
}
export function requireDatabase(environment: BackendEnvironment): D1DatabaseSession {
  if (!environment.DB) throw new ApiError(503, "account_backend_unavailable");
  return environment.DB.withSession("first-primary");
}
