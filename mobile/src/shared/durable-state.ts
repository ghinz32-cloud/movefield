/** A single writer for staged input and commit-before-display commands. */
export function createDurableState<T>(options: {
  initial: T;
  validate: (value: T) => T;
  write: (value: T) => Promise<void>;
  publish: (value: T) => void;
  status: (status: 'saving' | 'saved' | 'failed', error?: unknown) => void;
}) {
  let current = options.validate(options.initial);
  let tail: Promise<void> = Promise.resolve();
  let revision = 0;
  let committing = false;

  function enqueue(next: T) {
    const version = ++revision;
    options.status('saving');
    const operation = tail.catch(() => undefined).then(() => options.write(next));
    tail = operation;
    // Attach a rejection handler even when a caller is intentionally staging input.
    void operation.then(() => {
      if (version === revision) options.status('saved');
    }, error => {
      if (version === revision) options.status('failed', error);
    });
    return operation;
  }

  return {
    get: () => current,
    busy: () => committing,
    flush: () => tail,
    /** Hydration/mode switches do not write or announce a save. */
    replace(next: T) {
      if (committing) throw new Error('Wait for the current save to finish.');
      current = options.validate(next);
      options.publish(current);
    },
    /** Input remains visible on failure; this is not a durability acknowledgment. */
    stage(reduce: (value: T) => T) {
      if (committing) return false;
      const next = options.validate(reduce(current));
      current = next;
      options.publish(next);
      void enqueue(next).catch(() => undefined);
      return true;
    },
    /** Complete commands publish only after the underlying write succeeds. */
    async commit(reduce: (value: T) => T) {
      if (committing) return false;
      committing = true;
      try {
        const next = options.validate(reduce(current));
        await enqueue(next);
        current = next;
        options.publish(next);
        return true;
      } finally {
        committing = false;
      }
    },
  };
}
