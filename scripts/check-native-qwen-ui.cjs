const assert = require('node:assert/strict');
const path = require('node:path');
const {createHookHarness, createTsxLoader} = require('./lib/component-hook-harness.cjs');
const repo = process.argv[2] || path.resolve(__dirname, '..');
const file = path.join(repo, 'mobile/src/model-files.tsx');
const MODEL = 'native-qwen3-0.6b';
const fingerprint = 'a'.repeat(64);
const makeOffer = () => ({modelId: MODEL, label: 'Qwen3 0.6B publisher files', fingerprint, downloadBytes: 1200,
  assets: ['weights.gguf', 'tokenizer.json', 'config.json'].map((path, index) => ({path, bytes: 400, sha256: String(index + 1).repeat(64), url: 'https://publisher.example/' + path}))});
const receipt = () => ({version: 1, modelId: MODEL, fingerprint, attempt: 'verified-attempt', downloadBytes: 1200,
  assets: makeOffer().assets.map(({path, bytes, sha256}) => ({path, bytes, sha256}))});
const progress = (receivedBytes = 400) => ({phase: 'downloading', modelId: MODEL, path: 'weights.gguf', receivedBytes,
  totalBytes: 1200, verifiedFiles: 0, totalFiles: 3});
function deferred() { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return {promise, resolve, reject}; }
let checks = 0;
const scenarios = [];
const failures = [];
const same = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };
const ok = (value, message) => { assert.ok(value, message); checks++; };
async function scenario(name, run) {
  scenarios.push(name);
  try { await run(); console.log('PASS ' + name); }
  catch (error) { failures.push({name, error: error.message}); console.error('FAIL ' + name + ': ' + error.message); }
}
function button(h, label) {
  const node = h.find(node => node.props.label === label && typeof node.props.onPress === 'function');
  assert.ok(node, 'Actual rendered action: ' + label);
  return node;
}
async function press(h, label) { button(h, label).props.onPress(); await h.settle(); }
function stateCells(h) { return h.cells.filter(cell => cell?.kind === 'state').map(cell => structuredClone(cell.value)); }
async function mount(options = {}) {
  const h = createHookHarness(), downloads = [], calls = [], background = [];
  const readText = h.text;
  h.text = () => readText().replace(/\s+/g, ' ').trim();
  let offered = makeOffer(), reported = options.saved ? receipt() : null, profileAccesses = 0, subscriptionRemoved = false;
  const client = {
    status: async model => { calls.push(['status', model]); if (options.statusError) throw options.statusError; return options.statusTask ? options.statusTask.promise : reported; },
    offer: model => { calls.push(['offer', model]); if (options.offerError) throw options.offerError; return offered; },
    download: (consent, settings) => {
      const task = deferred(); downloads.push({consent: structuredClone(consent), settings, task}); calls.push(['download', consent.modelId]); return task.promise;
    },
    remove: async model => { calls.push(['remove', model]); if (options.removeError) throw options.removeError; return options.removeTask ? options.removeTask.promise : {cleanupPending: false}; },
    withVerifiedPaths: () => { throw Error('UI must not invoke model inference'); },
  };
  const overrides = {
    react: h.react, 'react/jsx-runtime': h.runtime,
    'react-native': {View: 'View', Text: 'Text', Pressable: 'Pressable',
      AppState: {addEventListener: (name, listener) => { same(name, 'change', 'UI watches app lifecycle only'); background.push(listener); return {remove: () => { subscriptionRemoved = true; }}; }}},
    './appearance': {useNativeAppearance: () => ({p: {textSize: 100}, colors: {ink: '#123', line: '#ddd'}, fonts: false})},
    './qwen-file-cache': {nativeQwenFiles: () => client},
    './storage': new Proxy({}, {get() { profileAccesses++; throw Error('Model files must not read or write training storage'); }}),
  };
  const loader = createTsxLoader(repo, overrides), component = loader.load(file).NativeModelFiles;
  await h.mount(component, {off: options.off ?? false});
  return {h, calls, downloads, offered, setOffer: value => { offered = value; }, setReportedReceipt: value => { reported = value; }, background,
    setOff: async value => h.mount(component, {off: value}), get profileAccesses() { return profileAccesses; },
    get subscriptionRemoved() { return subscriptionRemoved; }};
}
async function start(f) {
  await press(f.h, 'Native model files · optional');
  await press(f.h, 'Review optional Qwen3 0.6B download');
  const confirm = button(f.h, 'Confirm model-file download').props.onPress;
  confirm(); await f.h.settle();
  return {confirm, download: f.downloads.at(-1)};
}
async function success(f, index = 0, cleanupPending = false) {
  f.downloads[index].task.resolve({receipt: receipt(), reused: false, cleanupPending}); await f.h.settle();
}

(async () => {
  await scenario('Mount/open/status/review perform no implicit download or profile access', async () => {
    const f = await mount(); same(f.calls, [], 'collapsed mount does not initialize native files');
    await press(f.h, 'Native model files · optional');
    same(f.calls, [['status', MODEL]], 'opening performs only local status lookup');
    ok(f.h.text().includes('Inference is not connected') || f.h.text().includes('no native AI model is connected'), 'UI describes files-only capability');
    await press(f.h, 'Review optional Qwen3 0.6B download');
    same(f.downloads.length, 0, 'reviewing metadata does not start a download');
    ok(f.h.text().includes('1,200 bytes') && f.h.text().includes(fingerprint), 'review displays exact size and manifest fingerprint');
    same(f.profileAccesses, 0, 'model file control does not access training storage');
    f.h.unmount(); same(f.subscriptionRemoved, true, 'unmount removes app-state listener');
  });

  await scenario('Review consent is deeply frozen and repeated confirmation starts only one request', async () => {
    const f = await mount(); await press(f.h, 'Native model files · optional'); await press(f.h, 'Review optional Qwen3 0.6B download');
    const reviewed = f.h.cells.find(cell => cell?.kind === 'state' && cell.value?.fingerprint)?.value;
    ok(Object.isFrozen(reviewed) && Object.isFrozen(reviewed.assets) && reviewed.assets.every(Object.isFrozen), 'UI freezes an independent reviewed offer and assets');
    f.offered.modelId = 'unreviewed-model'; f.offered.fingerprint = 'b'.repeat(64); f.offered.downloadBytes = 9999; f.offered.assets[0].bytes = 9999;
    const confirm = button(f.h, 'Confirm model-file download').props.onPress;
    confirm(); confirm(); await f.h.settle();
    same(f.downloads.length, 1, 'synchronous repeated confirmation starts only one download');
    same(f.downloads[0].consent, {modelId: MODEL, fingerprint, downloadBytes: 1200}, 'request uses only the exact reviewed consent tuple');
    f.downloads[0].settings.onProgress(progress()); await f.h.settle();
    ok(f.h.text().includes('400 / 1,200 bytes'), 'real callback renders download progress');
    await success(f);
    ok(f.h.text().includes('Files verified and saved. Inference is not connected.'), 'successful save keeps inference explicitly unconnected');
    same(f.profileAccesses, 0, 'download confirmation does not read/write profile'); f.h.unmount();
  });

  await scenario('A canceled review invalidates its retained confirmation callback', async () => {
    const f = await mount(); await press(f.h, 'Native model files · optional'); await press(f.h, 'Review optional Qwen3 0.6B download');
    const stale = button(f.h, 'Confirm model-file download').props.onPress;
    await press(f.h, 'Cancel download review'); stale(); await f.h.settle();
    same(f.downloads.length, 0, 'canceled consent cannot start a later retained confirmation'); f.h.unmount();
  });

  await scenario('A replacement review cannot authorize an older different confirmation tuple', async () => {
    const f = await mount(); await press(f.h, 'Native model files · optional'); await press(f.h, 'Review optional Qwen3 0.6B download');
    const stale = button(f.h, 'Confirm model-file download').props.onPress;
    await press(f.h, 'Cancel download review');
    f.setOffer({...makeOffer(), fingerprint: 'c'.repeat(64), downloadBytes: 2400});
    await press(f.h, 'Review optional Qwen3 0.6B download'); stale(); await f.h.settle();
    same(f.downloads.length, 0, 'current review cannot reactivate a canceled older consent');
    await press(f.h, 'Confirm model-file download');
    same(f.downloads[0].consent, {modelId: MODEL, fingerprint: 'c'.repeat(64), downloadBytes: 2400}, 'current confirmation uses current displayed exact tuple');
    await success(f); f.h.unmount();
  });

  await scenario('Completed confirmation cannot restart a download without a new review', async () => {
    const f = await mount(), {confirm} = await start(f); await success(f); confirm(); await f.h.settle();
    same(f.downloads.length, 1, 'finished consent remains consumed after busy flag clears'); f.h.unmount();
  });

  await scenario('Off blocks review and invalidates an already reviewed confirmation', async () => {
    const f = await mount({off: true}); await press(f.h, 'Native model files · optional');
    const disabled = button(f.h, 'Review optional Qwen3 0.6B download'); same(disabled.props.disabled, true, 'Off disables review action');
    disabled.props.onPress(); await f.h.settle(); same(f.calls.filter(call => call[0] === 'offer').length, 0, 'disabled callback guard performs no offer lookup');
    await f.setOff(false); await press(f.h, 'Review optional Qwen3 0.6B download');
    const stale = button(f.h, 'Confirm model-file download').props.onPress;
    await f.setOff(true); stale(); await f.h.settle();
    same(f.downloads.length, 0, 'switching Off invalidates earlier confirmation'); f.h.unmount();
  });

  for (const action of ['Cancel download', 'Close native model files']) {
    await scenario(action + ' suppresses late progress/results and supports a new explicit retry', async () => {
      const f = await mount(), {download} = await start(f);
      await press(f.h, action); same(download.settings.signal.aborted, true, 'user cancellation aborts underlying request');
      const before = stateCells(f.h);
      download.settings.onProgress(progress(1199)); download.task.resolve({receipt: receipt(), reused: false, cleanupPending: false}); await f.h.settle();
      same(stateCells(f.h), before, 'late canceled callbacks cannot change visible state or receipts');
      if (action.startsWith('Close')) await press(f.h, 'Native model files · optional');
      await press(f.h, 'Review optional Qwen3 0.6B download'); await press(f.h, 'Confirm model-file download');
      same(f.downloads.length, 2, 'retry requires fresh explicit review and confirmation'); await success(f, 1); f.h.unmount();
    });
  }

  await scenario('Unmount aborts request and suppresses every late state update', async () => {
    const f = await mount(), {download} = await start(f); f.h.unmount();
    same(download.settings.signal.aborted, true, 'unmount aborts active request'); const before = stateCells(f.h);
    download.settings.onProgress(progress(1199)); download.task.resolve({receipt: receipt(), reused: false, cleanupPending: true}); await f.h.settle();
    same(stateCells(f.h), before, 'unmounted progress/result cannot update component state');
  });

  for (const cause of ['background', 'off']) {
    await scenario(cause + ' aborts an active request without accepting a late successful receipt', async () => {
      const f = await mount(), {download} = await start(f);
      if (cause === 'background') f.background[0]('background'); else await f.setOff(true);
      same(download.settings.signal.aborted, true, 'lifecycle/preference change aborts active request');
      download.settings.onProgress(progress(1199)); await success(f);
      ok(!f.h.text().includes('Files verified and saved'), 'late aborted result cannot imply verified saved files');
      ok(!f.h.find(node => node.props.label === 'Review file verification or replacement'), 'aborted operation cannot create a verified saved-file receipt'); f.h.unmount();
    });
  }

  await scenario('Late status after close cannot install a stale receipt', async () => {
    const statusTask = deferred(), f = await mount({statusTask}); await press(f.h, 'Native model files · optional');
    await press(f.h, 'Close native model files'); const before = stateCells(f.h);
    statusTask.resolve(receipt()); await f.h.settle(); same(stateCells(f.h), before, 'closed status result cannot change saved-file state'); f.h.unmount();
  });

  await scenario('Explicit status recheck identifies already finished files after cancellation without retrying network', async () => {
    const f = await mount(), {download} = await start(f); await press(f.h, 'Cancel download');
    download.task.resolve({receipt: receipt(), reused: false, cleanupPending: false}); await f.h.settle();
    ok(f.h.text().includes('A finished download may already be saved'), 'cancellation copy acknowledges an already committed download');
    f.setReportedReceipt(receipt()); await press(f.h, 'Check saved model files');
    ok(f.h.text().includes('Model files are saved. Inference is not connected.'), 'explicit local status check reports complete saved-file truth');
    same(f.calls.filter(call => call[0] === 'status').length, 2, 'explicit recheck invokes only local status');
    same(f.downloads.length, 1, 'status check never retries or downloads implicitly');
    ok(f.h.find(node => node.props.label === 'Review deleting native model files'), 'confirmed local receipt exposes deletion review'); f.h.unmount();
  });

  await scenario('Download/offer/status errors remain visible and never claim success', async () => {
    const f = await mount(), {download} = await start(f); download.task.reject(Error('Publisher file failed verification')); await f.h.settle();
    ok(f.h.text().includes('Publisher file failed verification'), 'download failure is visible');
    ok(!f.h.text().includes('Files verified and saved'), 'failed download never reports verified storage');
    same(f.downloads.length, 1, 'failure does not retry automatically');
    await press(f.h, 'Review optional Qwen3 0.6B download'); await press(f.h, 'Confirm model-file download'); same(f.downloads.length, 2, 'fresh consent enables user retry'); await success(f, 1, true);
    ok(f.h.text().includes('Old-file cleanup will retry'), 'committed result distinguishes pending cleanup'); f.h.unmount();
    for (const options of [{statusError: Error('Model cache unavailable')}, {offerError: Error('Manifest unavailable')}]) {
      const broken = await mount(options); await press(broken.h, 'Native model files · optional');
      if (options.offerError) await press(broken.h, 'Review optional Qwen3 0.6B download');
      ok(broken.h.text().includes((options.statusError || options.offerError).message), 'metadata/storage error remains visible');
      same(broken.downloads.length, 0, 'metadata/storage failure does not trigger network'); broken.h.unmount();
    }
  });

  await scenario('Deleting files requires explicit confirmation, preserves profile isolation and saved status on failure', async () => {
    const f = await mount({saved: true, removeError: Error('Model deletion could not finish')}); await press(f.h, 'Native model files · optional');
    await press(f.h, 'Review deleting native model files'); same(f.calls.filter(call => call[0] === 'remove').length, 0, 'review alone cannot delete files');
    await press(f.h, 'Keep model files'); same(f.calls.filter(call => call[0] === 'remove').length, 0, 'Keep cannot delete files');
    await press(f.h, 'Review deleting native model files'); const confirm = button(f.h, 'Confirm delete model files').props.onPress; confirm(); confirm(); await f.h.settle();
    same(f.calls.filter(call => call[0] === 'remove'), [['remove', MODEL]], 'synchronous repeated delete confirmation invokes only model-file removal');
    ok(f.h.text().includes('Model deletion could not finish'), 'delete error remains visible');
    ok(f.h.find(node => node.props.label === 'Review deleting native model files'), 'delete failure retains previously reported receipt rather than claiming deletion');
    same(f.profileAccesses, 0, 'delete never accesses training records'); f.h.unmount();
  });

  await scenario('Keep model files invalidates a retained stale delete confirmation', async () => {
    const f = await mount({saved: true}); await press(f.h, 'Native model files · optional'); await press(f.h, 'Review deleting native model files');
    const stale = button(f.h, 'Confirm delete model files').props.onPress; await press(f.h, 'Keep model files'); stale(); await f.h.settle();
    same(f.calls.filter(call => call[0] === 'remove').length, 0, 'declined deletion cannot execute through an old confirmation callback'); f.h.unmount();
  });

  await scenario('Successful explicit deletion clears only model status and consumes confirmation', async () => {
    const f = await mount({saved: true}); await press(f.h, 'Native model files · optional'); await press(f.h, 'Review deleting native model files');
    const confirm = button(f.h, 'Confirm delete model files').props.onPress; confirm(); await f.h.settle();
    same(f.calls.filter(call => call[0] === 'remove'), [['remove', MODEL]], 'explicit confirmation removes only the requested model files');
    ok(f.h.text().includes('Native model files deleted. Your training records are kept.'), 'successful deletion reports its file-only scope');
    ok(f.h.find(node => node.props.label === 'Review optional Qwen3 0.6B download'), 'successful deletion returns to the no-saved-receipt review action');
    same(f.profileAccesses, 0, 'successful deletion does not access training/profile storage');
    confirm(); await f.h.settle(); same(f.calls.filter(call => call[0] === 'remove').length, 1, 'successful destructive consent remains consumed'); f.h.unmount();
  });

  await scenario('Committed deletion with pending temporary cleanup reports retired files accurately', async () => {
    const removeTask = deferred(), f = await mount({saved: true, removeTask});
    await press(f.h, 'Native model files · optional'); await press(f.h, 'Review deleting native model files'); await press(f.h, 'Confirm delete model files');
    removeTask.resolve({cleanupPending: true}); await f.h.settle();
    ok(f.h.text().includes('Saved model files retired') && f.h.text().includes('Incomplete files will be removed'), 'pending cleanup is distinguished from completely deleted files');
    ok(f.h.find(node => node.props.label === 'Review optional Qwen3 0.6B download'), 'retired saved receipt is cleared even while temporary cleanup remains');
    same(f.profileAccesses, 0, 'temporary cleanup never accesses training records'); f.h.unmount();
  });

  await scenario('Unreadable local model status still permits explicit file-only deletion recovery', async () => {
    const f = await mount({statusError: Error('Saved model metadata is damaged')}); await press(f.h, 'Native model files · optional');
    ok(f.h.text().includes('Saved model metadata is damaged'), 'status corruption remains visible');
    await press(f.h, 'Review deleting native model files'); same(f.calls.filter(call => call[0] === 'remove').length, 0, 'corrupt status still requires explicit deletion confirmation');
    await press(f.h, 'Confirm delete model files');
    same(f.calls.filter(call => call[0] === 'remove'), [['remove', MODEL]], 'explicit recovery reaches model cache deletion despite unreadable metadata');
    ok(f.h.text().includes('Native model files deleted'), 'successful recovery deletion is visible');
    same(f.profileAccesses, 0, 'model metadata recovery never accesses profile storage'); f.h.unmount();
  });

  for (const kind of ['download', 'delete']) {
    await scenario('Unmount revokes retained ' + kind + ' review confirmation before a request starts', async () => {
      const f = await mount({saved: kind === 'delete'}); await press(f.h, 'Native model files · optional');
      await press(f.h, kind === 'download' ? 'Review optional Qwen3 0.6B download' : 'Review deleting native model files');
      const stale = button(f.h, kind === 'download' ? 'Confirm model-file download' : 'Confirm delete model files').props.onPress;
      f.h.unmount(); const calls = [...f.calls]; stale(); await f.h.settle();
      same(f.calls, calls, 'unmounted confirmation cannot access model client');
      same(f.downloads.length, 0, 'unmounted review cannot create a network request');
    });
  }

  console.log(`${failures.length ? 'FAIL' : 'PASS'} native Qwen UI: ${scenarios.length - failures.length}/${scenarios.length} scenarios, ${checks} assertions (actual compiled TSX callbacks; mocked file client/native hooks, not physical-device or inference acceptance)`);
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
