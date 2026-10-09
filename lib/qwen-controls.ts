import {qwenDownloadMessage, type QwenDownloadConsent, type QwenDownloadOffer,
  type QwenDownloadProgress, type createQwenDownloader} from './qwen-download';

type Client = Pick<ReturnType<typeof createQwenDownloader>, 'offer' | 'status' | 'download' | 'remove'>;
export type QwenControlState = {
  phase: 'idle' | 'checking' | 'confirming' | 'downloading' | 'cancelling' | 'deleting';
  enabled: boolean; downloaded: boolean; consent: QwenDownloadConsent | null;
  progress: QwenDownloadProgress | null; message: string; error: boolean;
};

// Owns a single optional file operation. No preference change or status check
// can authorize a network request. The UI must first open the exact offer and
// then confirm it; Off consumes the pending consent and aborts an active job.
export function createQwenControls(client: Client, modelId: string, enabled: boolean) {
  const offer: QwenDownloadOffer = client.offer(modelId);
  let state: QwenControlState = {phase: 'idle', enabled, downloaded: false,
    consent: null, progress: null, message: '', error: false};
  let disposed = false, busy = false, abort: AbortController | null = null;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<QwenControlState>) => {
    if (disposed) return;
    state = {...state, ...patch};
    for (const listener of listeners) listener();
  };
  const getSnapshot = () => state;
  const subscribe = (listener: () => void) => {listeners.add(listener); return () => {listeners.delete(listener)}};
  const report = (error: unknown) => publish({message: qwenDownloadMessage(error), error: true});
  async function refresh() {
    if (disposed || busy || state.phase === 'confirming') return;
    busy = true; publish({phase: 'checking', message: '', error: false});
    try {publish({downloaded: !!await client.status(modelId)})} catch (error) {report(error)}
    finally {busy = false; publish({phase: 'idle'})}
  }
  function requestDownload() {
    if (disposed || busy || !state.enabled || state.downloaded) return;
    // Capture the full immutable offer here, never accept a DOM-supplied ID,
    // size or manifest. Confirm checks it again against the current client.
    publish({phase: 'confirming', consent: Object.freeze({modelId: offer.modelId,
      fingerprint: offer.fingerprint, downloadBytes: offer.downloadBytes}), message: '', error: false});
  }
  function dismissConsent() {if (!busy) publish({phase: 'idle', consent: null})}
  async function confirmDownload() {
    if (disposed || busy || !state.enabled || state.phase !== 'confirming' || !state.consent) return;
    const consent = state.consent, current = client.offer(modelId);
    if (consent.modelId !== current.modelId || consent.fingerprint !== current.fingerprint ||
        consent.downloadBytes !== current.downloadBytes) {
      publish({phase: 'idle', consent: null, error: true, message: 'The model files changed. Review the current download size and confirm again.'});
      return;
    }
    busy = true; abort = new AbortController();
    publish({phase: 'downloading', consent: null, progress: null, message: '', error: false});
    let lastProgress = 0;
    try {
      const result = await client.download(consent, {signal: abort.signal, onProgress: progress => {
        const now = Date.now();
        if (state.phase === 'cancelling') return;
        if (progress.phase !== state.progress?.phase || now - lastProgress >= 150 || progress.phase === 'complete') {
          lastProgress = now; publish({progress});
        }
      }});
      // A commit can finish immediately before cancellation. Report the actual
      // files rather than incorrectly claiming they were deleted by Off.
      publish({downloaded: true, message: result.cleanupPending
        ? 'Files downloaded. Some old files still need cleanup; choose Check files to retry.'
        : state.enabled ? 'Files downloaded and checked. The assistant is not running yet.'
          : 'Files downloaded before cancellation completed. The assistant is off; you can delete the files.', error: result.cleanupPending});
    } catch (error) {report(error)}
    finally {abort = null; busy = false; publish({phase: 'idle', progress: null})}
  }
  function cancel() {
    if (!abort || disposed) return;
    publish({phase: 'cancelling', message: 'Stopping the download and removing incomplete files…', error: false});
    abort.abort();
  }
  function setEnabled(value: boolean) {
    if (disposed || state.enabled === value) return;
    publish({enabled: value, consent: null, ...(state.phase === 'confirming' ? {phase: 'idle' as const} : {})});
    if (!value) cancel();
  }
  async function remove() {
    if (disposed || busy || state.phase === 'confirming') return;
    busy = true; publish({phase: 'deleting', message: '', error: false});
    try {
      await client.remove(modelId);
      publish({downloaded: false, message: 'Model files deleted. Your workouts and preferences are unchanged.'});
    } catch (error) {
      // Deletion may have unpublished the model before cleanup failed. Never
      // leave a stale "downloaded" indicator in that case.
      publish({downloaded: false}); report(error);
    } finally {busy = false; publish({phase: 'idle'})}
  }
  function dispose() {disposed = true; abort?.abort(); listeners.clear()}
  return {offer, getSnapshot, subscribe, refresh, requestDownload, dismissConsent,
    confirmDownload, cancel, setEnabled, remove, dispose};
}
export type QwenControls = ReturnType<typeof createQwenControls>;
