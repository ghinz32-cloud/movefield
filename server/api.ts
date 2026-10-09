import { requireDatabase, requireOwner, type BackendEnvironment } from "./auth";
import { ApiError, jsonResponse } from "./contracts";
import { feedbackStatus, providerAvailable, requestFeedback } from "./feedback";
import { accountRevision, pullSync, pushSync } from "./sync";
import { coachingStatus, postCoaching } from "./coaching";

export async function handleBackendRequest(request: Request, environment: BackendEnvironment, schedule: (promise: Promise<unknown>) => void): Promise<Response> {
  try {
    const owner = requireOwner(request, environment);
    const db = requireDatabase(environment);
    const pathname = new URL(request.url).pathname;
    if (pathname === "/api/account" && request.method === "GET") return jsonResponse({ userId: owner, syncAvailable: true,
      feedbackAvailable: providerAvailable(environment), coachingAvailable: providerAvailable(environment), nativeAuthAvailable: false, revision: await accountRevision(db, owner) });
    if (pathname === "/api/sync") {
      if (request.method === "GET") return await pullSync(request, db, owner);
      if (request.method === "POST") return await pushSync(request, db, owner);
    }
    if (pathname === "/api/daily-feedback") {
      if (request.method === "GET") return await feedbackStatus(request, db, owner, environment, schedule);
      if (request.method === "POST") return await requestFeedback(request, db, owner, environment, schedule);
    }
    if (pathname === "/api/workout-coaching") {
      if (request.method === "GET") return await coachingStatus(request, db, owner, environment, schedule);
      if (request.method === "POST") return await postCoaching(request, db, owner, environment, schedule);
    }
    throw new ApiError(405, "method_not_allowed");
  } catch (error) {
    if (error instanceof ApiError) return jsonResponse({ error: error.code }, error.status);
    // Driver and provider errors may contain secrets or user data; never return or log them.
    return jsonResponse({ error: "backend_temporarily_unavailable" }, 503);
  }
}
