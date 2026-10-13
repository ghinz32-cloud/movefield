import {readSavedState} from './saved-data';
import {assertStoredTextCapacity, MAX_SAVED_STATE_CHARS} from './record-capacity';

export {assertStoredTextCapacity, assertHistoryHeadCapacity, SavedStateCapacityError, MAX_SAVED_STATE_CHARS,
  MAX_SAVED_STATE_BYTES, MAX_HISTORY_HEAD_CHARS, MAX_HISTORY_HEAD_BYTES, MAX_TRANSFER_FILE_BYTES, utf8TextBytes} from './record-capacity';

// This named path is limited to full saved profiles and reviewed compatible
// transfers. Ordinary untrusted small JSON keeps parseSafeJson's 5M default.
export function readStoredSavedState(raw: string): ReturnType<typeof readSavedState> {
  assertStoredTextCapacity(raw);
  return readSavedState(raw, {maxChars: MAX_SAVED_STATE_CHARS});
}
