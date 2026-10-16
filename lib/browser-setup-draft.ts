/** A setup window may only replace the exact draft that it opened or last saved. */
export class SetupDraftConflict extends Error {
  constructor() {
    super('Setup changed in another tab. Your answers here have not replaced it. Save a copy of these answers, then reload the latest setup.');
    this.name = 'SetupDraftConflict';
  }
}

type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
export function createBrowserSetupDraft(options: {
  storage: DraftStorage;
  key: string;
  exclusive: (work: () => Promise<void>) => Promise<void>;
  encode: (raw: string) => Promise<string>;
  decode: (raw: string) => Promise<string>;
}) {
  let expected: string | null = null;
  let initialError: unknown;
  try { expected = options.storage.getItem(options.key); } catch (error) { initialError = error; }
  const assertCurrent = () => {
    if (initialError) throw initialError;
    if (options.storage.getItem(options.key) !== expected) throw new SetupDraftConflict();
  };
  return {
    assertCurrent,
    async read() {
      assertCurrent();
      return expected === null ? null : options.decode(expected);
    },
    async write(raw: string) {
      const encoded = await options.encode(raw);
      await options.exclusive(async () => {
        assertCurrent();
        options.storage.setItem(options.key, encoded);
        if (options.storage.getItem(options.key) !== encoded) throw Error('Setup could not be verified after saving. Keep this window open.');
        expected = encoded;
      });
    },
    async clear() {
      await options.exclusive(async () => {
        assertCurrent();
        options.storage.removeItem(options.key);
        if (options.storage.getItem(options.key) !== null) throw Error('The saved setup could not be cleared.');
        expected = null;
      });
    },
  };
}
