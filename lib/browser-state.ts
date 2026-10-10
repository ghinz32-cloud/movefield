export const PERSONAL_STATE_KEY = 'training-studio-v2';
export const SAMPLE_STATE_KEY = 'training-studio-sample-v1';

export class StorageConflict extends Error {
  constructor() { super('Your saved profile changed in another tab. Export this window’s work before reloading.'); }
}

/** Called inside the browser's Web Lock, so read/compare/write is one operation. */
export function writeBrowserState(storage: Pick<Storage, 'getItem' | 'setItem'>, key: string, expected: string, next: string) {
  if ((storage.getItem(key) ?? '') !== expected) throw new StorageConflict();
  storage.setItem(key, next); // Quota/security errors propagate to the durability boundary.
  return next;
}
