import {MLCEngine} from '@mlc-ai/web-llm';
import {Tokenizer} from '@mlc-ai/web-tokenizers';
import {createBrowserQwenStore} from './browser-qwen-cache';
import {createQwenDownloader, QwenDownloadError} from './qwen-download';
import {qwenCandidates} from './qwen-catalog';
import {QWEN_BROWSER_MODEL_ID} from './qwen-network-policy';
import {GROUNDING_PROMPT} from './fitness-grounding';
import {createQwenRuntimeCache} from './qwen-runtime-cache';
import {QWEN_DEMO_POLICY, type QwenWorkerRequest} from './qwen-demo';

// A bounded evidence-selection task, never a general chat or an engine edit.
// Static imports are bundled into this same-origin worker. Runtime asset
// requests and Cache API calls are replaced before WebLLM is instantiated.
type GPU = {requestAdapter(): Promise<{features: {has(feature: string): boolean}} | null>};
// This project also compiles Cloudflare types; keep browser worker capabilities
// explicit instead of combining conflicting DOM and WebWorker global libs.
type BrowserWorkerScope = {isSecureContext: boolean; indexedDB: IDBFactory;
  navigator: Pick<Navigator, 'locks' | 'storage'> & {gpu?: GPU};
  onmessage: ((event: MessageEvent<QwenWorkerRequest>) => Promise<void>) | null;
  postMessage(value: unknown): void; close(): void};
const scope = globalThis as unknown as BrowserWorkerScope;
let started = false;
scope.onmessage = async (event: MessageEvent<QwenWorkerRequest>) => {
  if (started) return;
  const message = event.data;
  if (!message || message.policy !== QWEN_DEMO_POLICY || message.request?.system !== GROUNDING_PROMPT ||
      typeof message.request.user !== 'string' || message.request.user.length > 6000 ||
      !/^[A-Za-z0-9_-]{8,100}$/.test(message.request.requestId)) return;
  started = true;
  const {request} = message;
  const send = (value: object) => scope.postMessage({policy: QWEN_DEMO_POLICY, requestId: request.requestId, ...value});
  const owned: {engine: MLCEngine | null; tokenizer: Tokenizer | null} = {engine: null, tokenizer: null};
  try {
    const gpu = scope.navigator.gpu;
    if (!scope.isSecureContext || !gpu) throw new QwenDownloadError('unsupported', 'WebGPU unavailable');
    const adapter = await gpu.requestAdapter();
    if (!adapter?.features.has('shader-f16')) throw new QwenDownloadError('unsupported', 'shader-f16 unavailable');
    const model = qwenCandidates.find(candidate => candidate.id === QWEN_BROWSER_MODEL_ID)!;
    const store = createBrowserQwenStore({indexedDB: scope.indexedDB, keyRange: IDBKeyRange,
      locks: scope.navigator.locks, random: length => crypto.getRandomValues(new Uint8Array(length)),
      estimate: () => scope.navigator.storage.estimate()});
    const client = createQwenDownloader({models: [model], store,
      fetchAsset: async () => {throw new QwenDownloadError('network', 'Runtime network requests are disabled')}});
    const signal = new AbortController().signal;
    const offer = client.offer(model.id);
    await client.withCachedModel(model.id, signal, async open => {
      const local = createQwenRuntimeCache(offer, open);
      Object.defineProperty(scope, 'fetch', {value: local.fetch, configurable: true});
      Object.defineProperty(scope, 'caches', {value: local.caches, configurable: true});
      // Exact raw ChatML prompt with thinking disabled. Text completion avoids
      // undocumented chat-template transformations in the token preflight.
      const prompt = `<|im_start|>system\n${request.system}<|im_end|>\n<|im_start|>user\n${request.user}<|im_end|>\n<|im_start|>assistant\n<think>\n\n</think>\n\n`;
      const loadStarted = performance.now();
      owned.tokenizer = await Tokenizer.fromJSON(await local.file('tokenizer.json'));
      // WebLLM text completion encodes this one string without chat prefixes.
      const inputTokens = owned.tokenizer.encode(prompt).length;
      const contextTokens = Math.min(model.contextTokens ?? 0, 1024), maxTokens = 192;
      if (inputTokens + maxTokens > contextTokens) {send({type: 'error', code: 'context'}); return}
      owned.tokenizer.dispose(); owned.tokenizer = null;
      const wasm = offer.assets.find(asset => asset.path.endsWith('.wasm'))!;
      const engine = owned.engine = new MLCEngine({appConfig: {cacheBackend: 'cache', model_list: [{
        model: `https://huggingface.co/${model.repository}/resolve/${model.modelRevision}/`,
        model_id: model.modelId!, model_lib: wasm.url, required_features: model.requiredFeatures,
      }]}, logLevel: 'SILENT', initProgressCallback: progress => send({type: 'progress', phase: 'loading', progress: progress.progress})});
      await engine.reload(model.modelId!, {context_window_size: contextTokens});
      const loadMs = performance.now() - loadStarted;
      send({type: 'progress', phase: 'generating', progress: 0});
      const generationStarted = performance.now();
      const result = await engine.completions.create({model: model.modelId!, prompt, stream: false,
        max_tokens: maxTokens, temperature: 0, top_p: 1, seed: 0, stop: ['<|im_end|>']});
      // Actual runtime token counts must agree with the tokenizer preflight.
      // No raw response or prompt is logged or stored.
      if (result.usage?.prompt_tokens !== inputTokens || !result.usage.completion_tokens ||
          result.choices[0]?.finish_reason !== 'stop') throw new Error('Incomplete result');
      const reply = result.choices[0]?.text;
      if (typeof reply !== 'string' || reply.length > 2048) throw new Error('Invalid result');
      const generationMs = performance.now() - generationStarted;
      await engine.unload(); owned.engine = null;
      send({type: 'result', reply, metrics: {inputTokens, outputTokens: result.usage.completion_tokens,
        loadMs, generationMs, contextTokens}});
    });
  } catch (error) {
    send({type: 'error', code: error instanceof QwenDownloadError ? error.code : 'runtime'});
  } finally {
    owned.tokenizer?.dispose();
    try {await owned.engine?.unload()} catch {}
    scope.close();
  }
};
