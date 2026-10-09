// Same-origin transport only. Authentication is supplied by the hosted ingress.
// Native and static Pages builds never construct trusted identity headers.
export class CloudError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); this.name = 'CloudError'; }
}
export type CloudAccount = {userId: string; syncAvailable: boolean; feedbackAvailable: boolean; nativeAuthAvailable: boolean; revision: number};
const MAX_RESPONSE_BYTES = 1_200_000;
async function responseObject(response: Response): Promise<Record<string, unknown>> {
  const declared = response.headers.get('content-length');
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_RESPONSE_BYTES)) {
    await response.body?.cancel();
    throw new CloudError(502, 'response_too_large', 'The server response was too large. Your local records are retained.');
  }
  if (!response.body) throw new CloudError(502, 'unavailable', 'Account services returned an incomplete response.');
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break; total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new CloudError(502, 'response_too_large', 'The server response was too large. Your local records are retained.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let value: unknown;
  try { value = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
  catch { throw new CloudError(response.status, 'unavailable', 'Account services are unavailable on this host. Your local records are retained.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CloudError(502, 'bad_response', 'The account response was incomplete. Your local records are retained.');
  return value as Record<string, unknown>;
}
export async function cloudRequest<T>(path: string, body?: unknown, signal?: AbortSignal, expectedAccountId?: string): Promise<T> {
  if (!/^\/api\/(account|sync|daily-feedback)(\?|$)/.test(path)) throw new Error('Unsupported account route.');
  const bound = /^\/api\/(sync|daily-feedback)(\?|$)/.test(path);
  if (bound && (!expectedAccountId || !/^[A-Za-z0-9_-]{1,128}$/.test(expectedAccountId))) throw new Error('An authenticated account is required for this request.');
  const controller = new AbortController(), stop = () => controller.abort();
  signal?.addEventListener('abort', stop, {once: true}); if (signal?.aborted) controller.abort();
  const timer = setTimeout(stop, 15_000);
  try {
    const response = await fetch(path, {method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', redirect: 'error',
      headers: {'X-Movefield-Client': 'web', ...(bound ? {'X-Movefield-Expected-Account': expectedAccountId!} : {}), ...(body === undefined ? {} : {'Content-Type': 'application/json'})},
      ...(body === undefined ? {} : {body: JSON.stringify(body)}), signal: controller.signal});
    const value = await responseObject(response);
    if (controller.signal.aborted) throw new DOMException('Account request cancelled.', 'AbortError');
    if (!response.ok) throw new CloudError(response.status, typeof value.error === 'string' ? value.error : 'request_failed',
      response.status === 409 ? 'The account changed on another device. Review it before replacing anything.' : 'The account request did not complete. Your local records are retained.');
    return value as T;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', stop); }
}
export async function cloudAccount(signal?: AbortSignal): Promise<CloudAccount> {
  const value = await cloudRequest<CloudAccount>('/api/account', undefined, signal);
  if (!value || typeof value.userId !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value.userId)
    || typeof value.syncAvailable !== 'boolean' || typeof value.feedbackAvailable !== 'boolean' || typeof value.nativeAuthAvailable !== 'boolean'
    || !Number.isSafeInteger(value.revision) || value.revision < 0) throw new CloudError(502, 'bad_account', 'The account response was incomplete.');
  return value;
}
