import React, {useEffect, useRef, useState} from 'react';
import {AppState, Pressable, Text, View} from 'react-native';
import {useNativeAppearance} from './appearance';
import {nativeQwenFiles} from './qwen-file-cache';
import type {NativeQwenOffer, NativeQwenProgress, NativeQwenReceipt} from './shared/qwen-native-files';

const MODEL = 'native-qwen3-0.6b';
const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Model files could not be opened. Retry when device storage is available.';
function FileButton({label, onPress, disabled = false}: {label: string; onPress: () => void; disabled?: boolean}) {
  const {p, colors: c, fonts} = useNativeAppearance();
  return <Pressable accessibilityRole="button" accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={{minHeight:48,padding:12,borderWidth:1,borderColor:c.line,borderRadius:10,opacity:disabled ? 0.55 : 1}}><Text style={{color:c.ink,fontSize:16*p.textSize/100,lineHeight:24*p.textSize/100,fontFamily:fonts ? 'Inter' : undefined}}>{label}</Text></Pressable>;
}

export function NativeModelFiles({off = false}: {off?: boolean}) {
  const {p, colors: c, fonts} = useNativeAppearance();
  const [expanded, setExpanded] = useState(false), [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [receipt, setReceipt] = useState<NativeQwenReceipt | null>(null);
  const [review, setReview] = useState<NativeQwenOffer | null>(null), [deleteReview, setDeleteReview] = useState<number | null>(null);
  const [progress, setProgress] = useState<NativeQwenProgress | null>(null), [message, setMessage] = useState('');
  const epoch = useRef(0), busyNow = useRef(false), active = useRef<AbortController | null>(null);
  const liveReview = useRef<NativeQwenOffer | null>(null), liveDelete = useRef<number | null>(null);
  const consentSerial = useRef(0), offNow = useRef(off);
  const alive = useRef(true);
  useEffect(() => {
    const generation = epoch, request = active;
    const lifetime = alive, downloadConsent = liveReview, deletionConsent = liveDelete;
    lifetime.current = true;
    const subscription = AppState.addEventListener('change', state => {if (state !== 'active') active.current?.abort();});
    return () => {subscription.remove(); lifetime.current = false; downloadConsent.current = null; deletionConsent.current = null; generation.current++; request.current?.abort();};
  }, []);
  useEffect(() => {
    offNow.current = off;
    if (off) {
      liveReview.current = null; active.current?.abort();
      const run = epoch.current;
      void Promise.resolve().then(() => {if (run === epoch.current && offNow.current) setReview(null);});
    }
  }, [off]);
  const text = {color: c.ink, fontSize: 16 * p.textSize / 100, lineHeight: 24 * p.textSize / 100, fontFamily: fonts ? 'Inter' : undefined};
  const cancel = () => {epoch.current++; active.current?.abort(); active.current = null; liveReview.current = null; liveDelete.current = null; busyNow.current = false; setBusy(false); setDownloading(false); setProgress(null); setReview(null); setDeleteReview(null); setMessage('Cancellation requested. A finished download may already be saved. Check saved files before retrying.');};
  const checkFiles = () => {
    if (!alive.current || busyNow.current) return;
    liveReview.current = null; liveDelete.current = null; busyNow.current = true; setBusy(true); setReview(null); setDeleteReview(null); setMessage('Checking saved model files…');
    const run = ++epoch.current;
    void Promise.resolve().then(() => nativeQwenFiles().status(MODEL)).then(saved => {
      if (run !== epoch.current) return;
      setReceipt(saved); setMessage(saved ? 'Model files are saved. Inference is not connected.' : 'No native model files are saved.');
    }).catch(error => {if (run === epoch.current) setMessage(messageFor(error));}).finally(() => {if (run === epoch.current) {busyNow.current = false; setBusy(false);}});
  };
  const toggle = () => {
    if (!alive.current) return;
    if (expanded) {cancel(); setExpanded(false); return;}
    setExpanded(true); checkFiles();
  };
  const reviewDownload = () => {
    if (!alive.current || offNow.current || busyNow.current) return;
    try {const offered = nativeQwenFiles().offer(MODEL), frozen = Object.freeze({...offered, assets: Object.freeze(offered.assets.map(asset => Object.freeze({...asset})))}); liveReview.current = frozen; liveDelete.current = null; setReview(frozen); setDeleteReview(null); setMessage('Review this optional download before confirming.');}
    catch (error) {setMessage(messageFor(error));}
  };
  const download = () => {
    if (!alive.current || offNow.current || busyNow.current || !review || liveReview.current !== review) return;
    if (AppState.currentState && AppState.currentState !== 'active') {setMessage('Keep the app open while downloading model files.'); return;}
    const consent = {modelId: review.modelId, fingerprint: review.fingerprint, downloadBytes: review.downloadBytes};
    liveReview.current = null;
    const controller = new AbortController(), run = ++epoch.current;
    active.current = controller; busyNow.current = true; setBusy(true); setDownloading(true); setReview(null); setMessage('Preparing model files…');
    void Promise.resolve().then(() => nativeQwenFiles().download(consent, {signal: controller.signal, onProgress: value => {
      if (run === epoch.current && !controller.signal.aborted) setProgress(value);
    }})).then(result => {
      if (run !== epoch.current) return;
      if (controller.signal.aborted) {setMessage('Cancellation requested. A finished download may already be saved. Check saved files before retrying.'); return;}
      setReceipt(result.receipt); setMessage(result.cleanupPending ? 'Files verified and saved. Old-file cleanup will retry. Inference is not connected.' : 'Files verified and saved. Inference is not connected.');
    }).catch(error => {if (run === epoch.current) setMessage(messageFor(error));}).finally(() => {
      if (run === epoch.current) {active.current = null; busyNow.current = false; setBusy(false); setDownloading(false); setProgress(null);}
    });
  };
  const remove = () => {
    if (!alive.current || busyNow.current || !deleteReview || liveDelete.current !== deleteReview) return;
    liveDelete.current = null;
    const run = ++epoch.current; busyNow.current = true; setBusy(true); setDeleteReview(null); setMessage('Deleting model files…');
    void Promise.resolve().then(() => nativeQwenFiles().remove(MODEL)).then(result => {
      if (run === epoch.current) {setReceipt(null); setMessage(result.cleanupPending ? 'Saved model files retired. Incomplete files will be removed when their transfer stops; close and reopen the app if it does not stop. Your training records are kept.' : 'Native model files deleted. Your training records are kept.');}
    }).catch(async error => {
      if (run !== epoch.current) return;
      setMessage(messageFor(error));
      // Deletion may have retired the pointer before file cleanup failed.
      // Reconcile local status so the old receipt is not treated as saved.
      try {const saved = await nativeQwenFiles().status(MODEL); if (run === epoch.current) setReceipt(saved);} catch { /* Keep the cleanup error visible. */ }
    }).finally(() => {if (run === epoch.current) {busyNow.current = false; setBusy(false);}});
  };
  return <View style={{gap:12}}>
    <FileButton label={expanded ? 'Close native model files' : 'Native model files · optional'} onPress={toggle}/>
    {expanded && <>
      <Text style={text}>Files only: no native AI model is connected. Downloads are optional; your workouts work without them. These public model files are kept separately from your training and may need downloading again if the phone clears its cache.</Text>
      {off && <Text style={text}>The assistant preference is Off. Saved files are kept; downloads are paused.</Text>}
      <Text accessibilityLiveRegion="polite" style={text}>{message}</Text>
      {!busy && <FileButton label="Check saved model files" onPress={checkFiles}/>}
      {progress && <Text accessibilityLiveRegion="polite" style={text}>{progress.phase} · {progress.receivedBytes.toLocaleString()} / {progress.totalBytes.toLocaleString()} bytes · {progress.verifiedFiles} / {progress.totalFiles} files verified</Text>}
      {!busy && <FileButton label={receipt ? 'Review file verification or replacement' : 'Review optional Qwen3 0.6B download'} onPress={reviewDownload} disabled={off}/>}
      {review && !off && <>
        <Text style={text}>{review.label} · {review.downloadBytes.toLocaleString()} bytes ({(review.downloadBytes / 1_000_000).toFixed(1)} MB). Three publisher files are downloaded and checked before saving. This does not enable inference.</Text>
        <Text style={text}>Allow about {((review.downloadBytes * 2.1 + 16 * 1024 * 1024) / 1_000_000_000).toFixed(1)} GB of free space for these files and temporary download space. Keep the app open; interrupted downloads may need restarting.</Text>
        <Text selectable style={{...text,fontSize:12 * p.textSize / 100}}>Manifest: {review.fingerprint}</Text>
        <FileButton label="Confirm model-file download" onPress={download} disabled={busy}/>
        <FileButton label="Cancel download review" onPress={() => {liveReview.current = null; setReview(null);}}/>
      </>}
      {downloading && <FileButton label="Cancel download" onPress={cancel}/>}
      {!busy && <FileButton label="Review deleting native model files" onPress={() => {const token = ++consentSerial.current; liveDelete.current = token; liveReview.current = null; setDeleteReview(token); setReview(null);}}/>}
      {deleteReview && !busy && <>
        <Text style={text}>Delete these optional model files? Training, backups and preferences are kept.</Text>
        <FileButton label="Confirm delete model files" onPress={remove}/>
        <FileButton label="Keep model files" onPress={() => {liveDelete.current = null; setDeleteReview(null);}}/>
      </>}
    </>}
  </View>;
}
