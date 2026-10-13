"use client";
import {useEffect, useRef, useState, useSyncExternalStore} from 'react';
import {Button} from './ui/button';
import {Input} from './ui/input';
import type {State} from '@/lib/training';
import type {BrowserCloudSync} from '@/lib/browser-cloud-sync';

export function AccountSync({service, state, saved, onUseRemote, onQueueCurrent}: {service: BrowserCloudSync; state: State; saved: boolean; onUseRemote: (state: State) => Promise<void>; onQueueCurrent: () => void}) {
  const status = useSyncExternalStore(service.subscribe, service.getSnapshot, service.getSnapshot);
  const [password, setPassword] = useState(''), [message, setMessage] = useState(''), [remote, setRemote] = useState<State | null>(null), [review, setReview] = useState(false), [processing, setProcessing] = useState(false);
  const operation = useRef(false), generation = useRef(0), mounted = useRef(true), active = useRef(false), current = useRef({saved, state});
  useEffect(() => { current.current = {saved, state}; active.current = status.active; }, [saved, state, status.active]);
  useEffect(() => {
    mounted.current = true;
    const reconnect = () => void service.flush(); window.addEventListener('online', reconnect); const timer = setInterval(reconnect, 15_000);
    return () => { mounted.current = false; if (operation.current || !active.current) service.disconnect(); window.removeEventListener('online', reconnect); clearInterval(timer); };
  }, [service]);
  async function unlock() {
    if (!mounted.current || operation.current || !current.current.saved || current.current.state.active) return;
    operation.current = true; const token = ++generation.current; setProcessing(true); setMessage('');
    try {
      const next = await service.unlock(password);
      if (!mounted.current || token !== generation.current) return;
      setPassword(''); setRemote(next); setReview(true);
    } catch (error) { if (mounted.current && token === generation.current) setMessage(error instanceof Error ? error.message : 'Account services are unavailable.'); }
    finally { if (token === generation.current) { operation.current = false; if (mounted.current) setProcessing(false); } }
  }
  async function select(useRemote: boolean) {
    if (!mounted.current || operation.current || !review || !current.current.saved || current.current.state.active) return;
    operation.current = true; const token = ++generation.current; setProcessing(true); setMessage('');
    try {
      const chosen = useRemote && remote ? remote : current.current.state;
      if (useRemote && remote) await onUseRemote(remote);
      if (!mounted.current || token !== generation.current) return;
      await service.activate(chosen);
      if (!mounted.current || token !== generation.current) return;
      setReview(false); setRemote(null); onQueueCurrent();
    } catch (error) { if (mounted.current && token === generation.current) setMessage(error instanceof Error ? error.message : 'Account sync could not be enabled.'); }
    finally { if (token === generation.current) { operation.current = false; if (mounted.current) setProcessing(false); } }
  }
  function cancel() {
    generation.current++; operation.current = false; service.disconnect();
    onQueueCurrent();
    if (mounted.current) { setProcessing(false); setReview(false); setRemote(null); setPassword(''); setMessage('Account sync is off. Any chosen training already saved on this device is retained.'); }
  }
  const disabled = !saved || !!state.active || status.busy || processing;
  return <section className="card"><h2>Encrypted account sync</h2><p className="muted">Sync is optional. On the authenticated hosted app, an account password encrypts each record before it leaves this device. Keep that password for your other browsers. It stays in memory only while this session is unlocked.</p><p className="small-copy">The public Pages prototype and phone app keep local records until their account authentication is configured. Existing transfer files continue to work.</p>{!status.active && !review && <><label className="field">Account encryption password<Input type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} maxLength={1024}/></label><div className="button-row"><Button disabled={disabled || password.length < 12} onClick={() => void unlock()}>Unlock account sync</Button><a className="text-link" href="/signin-with-chatgpt?return_to=%2F" target="_top">Sign in on the hosted app</a></div></>}{review && <><p>{remote ? `Account copy: ${remote.history.length} workouts. This device: ${state.history.length} workouts. Choose which copy to keep before syncing. Your choice replaces previously queued changes for this account.` : 'The account has no saved snapshot yet.'}</p><div className="button-row">{remote && <Button disabled={disabled} onClick={() => void select(true)}>Use reviewed account copy</Button>}<Button disabled={disabled} variant="outline" onClick={() => void select(false)}>Keep this device’s copy and sync</Button><Button variant="ghost" onClick={cancel}>Cancel</Button></div></>}{status.active && <div className="button-row"><Button disabled={status.busy} onClick={() => void service.flush()}>Retry queued sync</Button><Button variant="outline" onClick={cancel}>Lock account sync</Button></div>}<p role="status">{message || status.message}</p>{!saved && <p className="small-copy">Confirm local saving before enabling sync.</p>}</section>;
}
