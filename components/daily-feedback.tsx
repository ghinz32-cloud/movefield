"use client";
import {useEffect, useRef, useState} from 'react';
import {Button} from './ui/button';
import {type State, type Workout} from '@/lib/training';
import {cloudAccount, cloudRequest} from '@/lib/cloud-client';

type Feedback = {requestId: string; workoutId: string; status: 'pending' | 'processing' | 'complete' | 'failed'; feedback?: string; retryAfterMs?: number; error?: string};
async function feedbackId(accountId: string, workout: Workout): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(['movefield-daily-feedback-v1', accountId, workout.id, workout.finishedAt])))).slice(0, 16);
  bytes[6] = (bytes[6] & 15) | 128; bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function validFeedback(value: Feedback, id: string, workoutId: string): void {
  if (!value || value.requestId !== id || value.workoutId !== workoutId || !['pending', 'processing', 'complete', 'failed'].includes(value.status)) throw new Error('The feedback response did not match this workout. Nothing was displayed.');
  if (value.status === 'complete' && (typeof value.feedback !== 'string' || !value.feedback.trim() || value.feedback.length > 600)) throw new Error('The backend has not saved usable feedback.');
}
function pause(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const stop = () => { clearTimeout(timer); signal.removeEventListener('abort', stop); reject(new Error('Feedback check cancelled.')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, milliseconds);
    signal.addEventListener('abort', stop, {once: true}); if (signal.aborted) stop();
  });
}
export function DailyFeedback({state, saved}: {state: State; saved: boolean}) {
  const workout = state.history.filter(value => value.finishedAt && value.sets.some(set => set.done)).sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0) || a.id.localeCompare(b.id))[0];
  const eligible = !!workout && state.profile.age >= 18 && workout.symptom === 'no' && !state.hold && !workout.demo;
  const scope = JSON.stringify([workout ?? null, state.profile, state.hold, saved]);
  const [message, setMessage] = useState(''), [feedback, setFeedback] = useState(''), [busy, setBusy] = useState(false), [resultScope, setResultScope] = useState(scope);
  const controller = useRef<AbortController | null>(null), mounted = useRef(true), currentScope = useRef(scope);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; controller.current?.abort(); }; }, []);
  useEffect(() => { currentScope.current = scope; return () => controller.current?.abort(); }, [scope]);
  async function run() {
    if (!mounted.current || currentScope.current !== scope || !workout || !eligible || !saved || controller.current) return;
    const abort = new AbortController(); controller.current = abort; setResultScope(scope); setBusy(true); setFeedback(''); setMessage('Checking your account…');
    const current = () => mounted.current && currentScope.current === scope && !abort.signal.aborted;
    try {
      const account = await cloudAccount(abort.signal);
      if (!account.feedbackAvailable) throw new Error('Daily AI feedback is unavailable until the backend model credentials are configured. Your workout is saved locally.');
      if (!current()) return;
      const id = await feedbackId(account.userId, workout);
      if (!current()) return;
      const metrics = workout.sets.filter(set => set.done).map(set => ({exerciseId: set.exerciseId, set: set.set, reps: set.reps, kg: set.kg,
        ...(set.rir == null ? {} : {rir: set.rir}), ...(set.metrics?.durationSeconds === undefined ? {} : {durationSeconds: set.metrics.durationSeconds}), ...(set.metrics?.distanceM === undefined ? {} : {distanceM: set.metrics.distanceM})}));
      let result = await cloudRequest<Feedback>('/api/daily-feedback', {requestId: id, workoutId: workout.id, completedAt: new Date(workout.finishedAt!).toISOString(), metrics, consent: true, symptom: 'no', adult: true}, abort.signal, account.userId);
      const deadline = Date.now() + 120_000;
      validFeedback(result, id, workout.id);
      while (result.status !== 'complete' && Date.now() < deadline) {
        if (!current()) return;
        if (result.status === 'failed') throw new Error('The backend could not complete this feedback request. Your workout remains saved.');
        setMessage('Your saved workout is queued for feedback. Waiting for the backend to save its response…');
        const delay = Number.isFinite(result.retryAfterMs) ? Math.min(15_000, Math.max(1_000, result.retryAfterMs!)) : 2_000;
        await pause(Math.min(delay, Math.max(1, deadline - Date.now())), abort.signal);
        if (!current()) return;
        const latestAccount = await cloudAccount(abort.signal);
        if (latestAccount.userId !== account.userId) throw new Error('Your signed-in account changed. Request feedback again for the current account.');
        result = await cloudRequest<Feedback>('/api/daily-feedback?id=' + encodeURIComponent(id), undefined, abort.signal, account.userId);
        validFeedback(result, id, workout.id);
      }
      if (result.status !== 'complete') throw new Error('The backend has not saved feedback yet. Check again later.');
      if (current()) { setFeedback(result.feedback!); setMessage('Feedback saved by the backend. Your training targets remain unchanged.'); }
    } catch (error) { if (current()) setMessage(error instanceof Error ? error.message : 'Feedback is unavailable. Your workout remains saved.'); }
    finally { if (controller.current === abort) { controller.current = null; if (mounted.current) setBusy(false); } }
  }
  const visible = resultScope === scope && eligible && saved, pending = visible && busy;
  return <section className="card"><h2>Daily workout feedback</h2><p className="muted">With your approval, send only the completed set metrics from your latest workout to your account’s backend for AI feedback. This feedback request sends no names, notes, or full training history.</p><p className="small-copy">For adults reporting no pain or concerns. Feedback appears after the server saves it and never changes your plan automatically.</p><Button disabled={!eligible || !saved || pending} onClick={() => void run()}>{pending ? 'Waiting for saved feedback…' : 'Request feedback for latest workout'}</Button>{pending && <Button variant="outline" onClick={() => controller.current?.abort()}>Stop checking</Button>}{!saved && <p className="small-copy">Finish saving locally before requesting feedback.</p>}{visible && message && <p role="status">{message}</p>}{visible && feedback && <p className="feedback-copy">{feedback}</p>}</section>;
}
