const fs=require('node:fs'),path=require('node:path');
const {root,fingerprints}=require('./lib/fitness-evaluation.cjs');
const suite=JSON.parse(fs.readFileSync(path.join(root,'docs/evals/qwen-fitness-v1.json'),'utf8'));
// Records the exact authored corpus, contract implementation and held-out suite. No model is qualified here.
fs.writeFileSync(path.join(root,'lib/qwen-evaluation-lock.json'),JSON.stringify({schema:1,evaluationVersion:suite.version,
 corpusVersion:suite.corpusVersion,policy:suite.policy,...fingerprints()},null,2)+'\n');
console.log('Saved evaluation fingerprints. All previous measurements require a matching fingerprint.');
