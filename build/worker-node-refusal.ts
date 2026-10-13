// The tokenizer package includes unreachable Node environment branches. A
// browser worker has no Node loader or filesystem; refuse either explicitly.
export function createRequire():never {throw Error('Node loading is unavailable in the browser model worker.');}
export function fileURLToPath():never {throw Error('Node filesystem paths are unavailable in the browser model worker.');}
