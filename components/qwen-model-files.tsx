"use client";
import {useEffect, useState, useSyncExternalStore} from 'react';
import {useAppPreferences} from '@/components/app-preferences';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription} from '@/components/ui/dialog';
import {AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction} from '@/components/ui/alert-dialog';
import {createBrowserQwenStore, browserQwenDownloadSupport} from '@/lib/browser-qwen-cache';
import {qwenCandidates} from '@/lib/qwen-catalog';
import {createQwenDownloader, qwenDownloadMessage} from '@/lib/qwen-download';
import {createQwenControls, type QwenControls} from '@/lib/qwen-controls';
import {fetchQwenAsset, QWEN_BROWSER_MODEL_ID} from '@/lib/qwen-network';

const formatBytes = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;
type Connection = {controls: QwenControls} | {reason: string};

// Loaded only when the user opens Manage model files. The lazy boundary keeps
// model metadata, hashing and storage code out of the initial workout bundle.
export default function QwenModelFiles({onRemove}:{onRemove?:()=>void}={}) {
  const {p} = useAppPreferences();
  const [connection, setConnection] = useState<Connection | null>(null);
  useEffect(() => {
    const reason = browserQwenDownloadSupport();
    let controls: QwenControls | undefined;
    if (reason) {queueMicrotask(() => setConnection({reason})); return}
    try {
      const client = createQwenDownloader({models: qwenCandidates.filter(m => m.id === QWEN_BROWSER_MODEL_ID),
        store: createBrowserQwenStore(), fetchAsset: fetchQwenAsset});
      // The child applies the live preference, including cross-tab Off changes,
      // before a user can confirm a download. No model starts here.
      controls = createQwenControls(client, QWEN_BROWSER_MODEL_ID, false);
      const live = controls;
      queueMicrotask(() => setConnection({controls: live}));
    } catch (error) {queueMicrotask(() => setConnection({reason: qwenDownloadMessage(error)}))}
    return () => controls?.dispose();
  }, []);
  if (!connection) return <p role="status" className="small-copy">Checking local model storage…</p>;
  if ('reason' in connection) return <div className="qwen-files"><p role="status" className="notice warning">{connection.reason}</p>
    <p className="small-copy">Plans and workout tracking remain available. No files were requested.</p></div>;
  return <FileControls controls={connection.controls} enabled={p.model !== 'off'} onRemove={onRemove}/>;
}

function FileControls({controls, enabled,onRemove}: {controls: QwenControls; enabled: boolean;onRemove?:()=>void}) {
  const state = useSyncExternalStore(controls.subscribe, controls.getSnapshot, controls.getSnapshot);
  const {update, saveError} = useAppPreferences();
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => {controls.setEnabled(enabled)}, [controls, enabled]);
  useEffect(() => {
    void controls.refresh();
    const check = () => {if (document.visibilityState === 'visible') void controls.refresh()};
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    return () => {window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check)};
  }, [controls]);
  const busy = !['idle', 'confirming'].includes(state.phase);
  const progress = state.progress;
  const percent = progress ? Math.min(100, 100 * progress.receivedBytes / progress.totalBytes) : 0;
  return <div className="qwen-files">
    <div className="qwen-file-heading"><div><h3>Qwen3 0.6B</h3><p className="small-copy">{formatBytes(controls.offer.downloadBytes)} · {controls.offer.downloadBytes.toLocaleString('en-US')} bytes</p></div>
      <span className="qwen-file-status">{state.downloaded ? 'Downloaded · sample ready to try' : 'Not downloaded'}</span></div>
    <p className="small-copy">The browser demo uses this model. Larger models need testing before they are offered. File size does not tell us how much memory the assistant needs.</p>
    {busy && <div className="qwen-download-progress" aria-busy="true"><Progress value={percent} aria-label="Model download" aria-valuetext={state.phase === 'downloading' ? `${percent.toFixed(0)}% downloaded` : state.phase}/>
      <p role="status">{state.phase === 'checking' ? 'Checking downloaded files…' : state.phase === 'deleting' ? 'Deleting model files…' : state.phase === 'cancelling' ? 'Cancelling and cleaning up…' : progress?.phase === 'verifying' ? 'Checking file integrity…' : progress?.phase === 'committing' ? 'Saving checked files…' : 'Downloading model files…'}</p>
      {progress && <p className="small-copy">{formatBytes(progress.receivedBytes)} of {formatBytes(progress.totalBytes)} · {progress.verifiedFiles} of {progress.totalFiles} files checked</p>}</div>}
    <div className="button-row qwen-file-actions">
      {state.phase === 'downloading' || state.phase === 'cancelling' ? <Button variant="outline" disabled={state.phase === 'cancelling'} onClick={controls.cancel}>Cancel download</Button> : <Button disabled={busy || !enabled || !state.enabled || state.downloaded} onClick={controls.requestDownload}>{state.error ? 'Review and retry download' : 'Review download'}</Button>}
      <Button variant="outline" disabled={busy} onClick={() => void controls.refresh()}>Check files</Button>
      <Button variant="outline" disabled={busy} onClick={() => setDeleteOpen(true)}>Delete model files</Button>
      {enabled && <Button variant="ghost" onClick={() => {controls.setEnabled(false); update({model: 'off'})}}>Turn assistant off</Button>}
    </div>
    {!enabled && <p role="status" className="small-copy">Assistant is off. Downloads stay off until you change the preference above. Existing files can still be deleted.</p>}
    {state.message && <p role={state.error ? 'alert' : 'status'} className={state.error ? 'notice warning' : 'small-copy'}>{state.message}</p>}
    {saveError && <p role="alert" className="notice warning">{saveError}</p>}
    <p className="small-copy">Files stay in this browser and may be cleared by its storage policy. Deleting model files leaves workout records intact.</p>
    <Dialog open={state.phase === 'confirming' && !!state.consent && enabled} onOpenChange={open => {if (!open) controls.dismissConsent()}}>
      <DialogContent className="qwen-consent-dialog"><DialogHeader><DialogTitle>Download Qwen3 0.6B files?</DialogTitle><DialogDescription>
        {formatBytes(controls.offer.downloadBytes)} ({controls.offer.downloadBytes.toLocaleString('en-US')} bytes) for this browser. After downloading, open the Qwen sample in Coaching to run it explicitly. Downloading does not start the model.
      </DialogDescription></DialogHeader>
        <p>Downloads use Hugging Face’s public file service and GitHub’s public file service. They see your network address. Workout records are not sent.</p>
        <p>Use a connection with enough data and leave this view open. You can cancel. If you leave, the download stops and incomplete files are removed before another attempt.</p>
        <p className="small-copy">Files are pinned to a specific version and checked against their sizes and SHA-256 hashes. Browser storage may need extra space while saving.</p>
        <div className="button-row qwen-file-actions"><Button variant="outline" onClick={controls.dismissConsent}>Keep files undownloaded</Button>
          <Button disabled={!enabled || !state.enabled} onClick={() => void controls.confirmDownload()}>Download {formatBytes(controls.offer.downloadBytes)}</Button></div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}><AlertDialogContent className="qwen-consent-dialog"><AlertDialogHeader>
      <AlertDialogTitle>Delete Qwen3 0.6B files?</AlertDialogTitle><AlertDialogDescription>Remove this model’s downloaded and incomplete files from this browser. Your workouts and preferences are kept. Downloading it again needs another confirmation.</AlertDialogDescription>
    </AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep model files</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={() => {onRemove?.();void controls.remove()}}>Delete model files</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
