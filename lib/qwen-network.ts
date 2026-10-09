import {QwenDownloadError, type QwenAssetFetch} from './qwen-download';
import {qwenAssetRequestAllowed, qwenAssetResponseAllowed} from './qwen-network-policy';
export {QWEN_BROWSER_MODEL_ID,QWEN_BROWSER_MODEL_IDS} from './qwen-network-policy';

// The downloader supplies only a pinned public URL and cancellation signal.
// Construct the request here rather than forwarding arbitrary payload/options.
export const fetchQwenAsset: QwenAssetFetch = async (url, init) => {
  if (!qwenAssetRequestAllowed(url) || init.method !== 'GET' || init.body != null ||
      init.headers != null || init.credentials !== 'omit' || init.referrerPolicy !== 'no-referrer') {
    throw new QwenDownloadError('network', 'This model request is outside the verified public file policy. No request was sent.');
  }
  const response = await fetch(url, {method: 'GET', credentials: 'omit', referrerPolicy: 'no-referrer',
    mode: 'cors', cache: 'no-store', redirect: 'follow', signal: init.signal});
  if (!qwenAssetResponseAllowed(url, response.url)) {
    void response.body?.cancel().catch(() => {});
    throw new QwenDownloadError('network', 'The model publisher changed its download destination. No file was accepted; retry after the app’s file policy is updated.');
  }
  return response;
};
