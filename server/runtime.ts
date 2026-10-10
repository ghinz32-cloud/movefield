import { env, waitUntil } from "cloudflare:workers";
import { handleBackendRequest } from "./api";

export function backendRoute(request: Request): Promise<Response> {
  return handleBackendRequest(request, env, waitUntil);
}
