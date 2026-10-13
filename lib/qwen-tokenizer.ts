import type {Tokenizer} from '@mlc-ai/web-tokenizers';

// 0.1.6 declares ESM exports but ships a UMD module. Its browser export is
// globalThis.tokenizers; a named ESM import fails before any model can load.
export async function loadQwenTokenizer(bytes:ArrayBuffer):Promise<Tokenizer>{
 const bundled=await import('@mlc-ai/web-tokenizers');
 // Browser bundlers recognize the UMD branch as CommonJS and expose its
 // exports through default. Unbundled ESM instead uses the browser global.
 const constructor=bundled.Tokenizer||bundled.default?.Tokenizer||(globalThis as unknown as {tokenizers?:{Tokenizer:typeof Tokenizer}}).tokenizers?.Tokenizer;
 if(!constructor)throw Error('The model tokenizer could not open.');
 return constructor.fromJSON(bytes);
}
