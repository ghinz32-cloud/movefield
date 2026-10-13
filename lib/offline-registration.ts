type OfflineCallbacks = {
  onReady: () => void;
  onUpdateWaiting: (waiting: boolean) => void;
  onError: () => void;
};

/** Observe this app's exact registration, without activating over an open workout. */
export function watchOfflineApp(container: ServiceWorkerContainer, scriptURL: string, callbacks: OfflineCallbacks) {
  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  let readyReported = false;
  const observed = new Set<ServiceWorker>();

  const refresh = () => {
    if (disposed || !registration) return;
    const {active, waiting, installing} = registration;
    for (const worker of [active, waiting, installing]) {
      if (worker && !observed.has(worker)) {
        observed.add(worker);
        worker.addEventListener('statechange', refresh);
      }
    }
    // An initial install is not an update, even while it is activating.
    callbacks.onUpdateWaiting(!!active && active.state === 'activated' &&
      !!waiting && waiting !== active && waiting.state === 'installed');
    if (active?.state === 'activated' && !readyReported) {
      readyReported = true;
      callbacks.onReady();
    } else if (!active && [...observed].some(worker => worker.state === 'redundant') && !installing && !waiting) {
      callbacks.onError();
    }
  };

  void container.register(scriptURL, {updateViaCache: 'none'}).then(value => {
    if (disposed) return;
    registration = value;
    registration.addEventListener('updatefound', refresh);
    container.addEventListener('controllerchange', refresh);
    refresh();
  }).catch(() => { if (!disposed) callbacks.onError(); });

  return () => {
    disposed = true;
    registration?.removeEventListener('updatefound', refresh);
    container.removeEventListener('controllerchange', refresh);
    for (const worker of observed) worker.removeEventListener('statechange', refresh);
    observed.clear();
  };
}
