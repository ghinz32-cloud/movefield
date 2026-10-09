import {QwenDownloadError, type QwenDownloadOffer} from './qwen-download';

export const QWEN_RUNTIME_FILE_LIMIT = 64 * 1024 * 1024;
type Open = (path: string) => AsyncIterable<Uint8Array>;

// Used only inside the dedicated worker, while withCachedModel owns the model
// lock. There is deliberately no network implementation or secondary cache.
// Every Response is created AFTER the downloader's iterator verifies its hash.
export function createQwenRuntimeCache(offer: QwenDownloadOffer, open: Open) {
  const denied = () => new QwenDownloadError('manifest', 'The assistant requested a file outside its verified local model.');
  const urlOf = (input: RequestInfo | URL) => input instanceof Request ? input.url : String(input);
  async function fetchLocal(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = urlOf(input), asset = offer.assets.find(file => file.url === url);
    const method = init?.method ?? (input instanceof Request ? input.method : 'GET');
    if (!asset || method !== 'GET' || init?.body != null || init?.headers != null ||
        (input instanceof Request && [...input.headers].length > 0)) throw denied();
    const signal = init?.signal ?? (input instanceof Request ? input.signal : null);
    if (signal?.aborted) throw new QwenDownloadError('cancelled', 'Assistant stopped.');
    if (asset.bytes > QWEN_RUNTIME_FILE_LIMIT) throw new QwenDownloadError('unsupported', 'This model file exceeds the assistant’s loading limit.');
    const bytes = new Uint8Array(asset.bytes);
    let offset = 0;
    for await (const piece of open(asset.path)) {
      if (signal?.aborted) throw new QwenDownloadError('cancelled', 'Assistant stopped.');
      if (!(piece instanceof Uint8Array) || piece.length === 0 || offset + piece.length > bytes.length) {
        throw new QwenDownloadError('integrity', 'A local model file is damaged. Delete and download the files again.');
      }
      bytes.set(piece, offset); offset += piece.length;
    }
    if (offset !== asset.bytes) throw new QwenDownloadError('integrity', 'A local model file is incomplete.');
    return new Response(bytes.buffer, {headers: {'Content-Length': String(bytes.length),
      'Content-Type': asset.path.endsWith('.json') ? 'application/json' : 'application/octet-stream'}});
  }
  const cache = {
    // WebLLM's Cache API adapter calls match/add/match. match resolves directly
    // from the verified store, so Cache.add never performs a hidden fetch.
    match: (input: RequestInfo | URL) => fetchLocal(input),
    add: async (input: RequestInfo | URL) => {await (await fetchLocal(input)).arrayBuffer()},
    keys: async () => offer.assets.map(file => new Request(file.url)),
    put: async () => {throw denied()}, delete: async () => {throw denied()},
    addAll: async () => {throw denied()}, matchAll: async () => {throw denied()},
  };
  const caches = {
    open: async (scope: string) => {
      if (!['webllm/model', 'webllm/config', 'webllm/wasm'].includes(scope)) throw denied();
      return cache;
    },
  };
  async function file(path: string): Promise<ArrayBuffer> {
    const asset = offer.assets.find(item => item.path === path);
    if (!asset) throw denied();
    return (await fetchLocal(asset.url)).arrayBuffer();
  }
  return {fetch: fetchLocal, caches, file};
}
