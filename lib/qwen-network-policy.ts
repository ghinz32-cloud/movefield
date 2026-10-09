import policy from './qwen-network-policy.json';

export const QWEN_BROWSER_MODEL_ID = policy.modelId;
export const QWEN_BROWSER_MODEL_IDS=Object.freeze([policy.modelId,...policy.models.map(model=>model.modelId)]);
const assets=Object.freeze([policy,...policy.models].flatMap(model=>model.assets));
// Exact versioned publisher files plus the CDN paths observed with HEAD.
// No wildcard host, remote API, account endpoint, or WASM execution allowance.
export const QWEN_CONNECT_SOURCES = Object.freeze([...new Set(assets.flatMap(a => [a.url, a.finalUrl]))]);
export function qwenAssetRequestAllowed(url: string): boolean {
  return assets.some(asset => asset.url === url);
}
export function qwenAssetResponseAllowed(requestUrl: string, responseUrl: string): boolean {
  const asset = assets.find(file => file.url === requestUrl);
  if (!asset) return false;
  try {
    const final = new URL(responseUrl);
    if (final.protocol !== 'https:' || final.username || final.password || final.hash) return false;
    // Signed CDN and publisher query strings are transient. Accept their exact
    // observed origin/path only, and still require the pinned file hash.
    const path = final.origin + final.pathname;
    return path === asset.url || path === asset.finalUrl;
  } catch {return false}
}
