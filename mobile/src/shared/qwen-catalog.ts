import manifest from './qwen-assets.json';
import evaluation from './qwen-evaluation-lock.json';

export type QwenAsset = {path: string; url: string; bytes: number; sha256: string; verification: string};
export type QwenCandidate = {
  id: string; label: string; platform: 'web' | 'android'; parametersB: number;
  runtime: string; runtimeVersion: string; backend: string; modelRevision: string;
  repository: string; modelId?: string; wasmRevision?: string;
  assets: QwenAsset[]; downloadBytes: number; qualification: 'not-tested';
  contextTokens?: number; requiredFeatures?: string[]; vendorEstimatedVramMB?: number;
};
// This catalog is artifact metadata. It cannot assert that any phone/browser passes.
export const qwenCandidates = manifest.models as QwenCandidate[];
export const QWEN_EVALUATION_VERSION = evaluation.evaluationVersion;
export const QWEN_EVALUATION_FINGERPRINTS = {
  corpusSha256: evaluation.corpusSha256, contractSha256: evaluation.contractSha256, suiteSha256: evaluation.suiteSha256,
};
export type QwenQualification = {
  modelId: string; modelRevision: string; runtimeVersion: string; backend: string;
  deviceFingerprint: string; appBuild: string; evaluationVersion: string;
  corpusSha256: string; contractSha256: string; suiteSha256: string;
  contextTokens: number;
  accuracyPassed: boolean; safetyPassed: boolean; interruptionPassed: boolean;
  completedCycles: number; peakAppBytes: number; measuredBudgetBytes: number;
  p95GenerationMs: number; coldLoadMs: number;
};
export type QwenDevice = {platform: 'web' | 'android'; deviceFingerprint: string; appBuild: string; contextTokens: number};

// Deliberate product acceptance limits, not vendor claims or physiological rules.
// Advertised RAM, phone age and model file size cannot substitute for these measurements.
export function qwenQualificationPasses(model: QwenCandidate, device: QwenDevice, measured: QwenQualification): boolean {
  const positive = [measured.peakAppBytes, measured.measuredBudgetBytes, measured.p95GenerationMs, measured.coldLoadMs];
  return model.platform === device.platform && measured.modelId === model.id &&
    measured.modelRevision === model.modelRevision && measured.runtimeVersion === model.runtimeVersion &&
    measured.backend === model.backend && !!device.deviceFingerprint && !!device.appBuild &&
    measured.deviceFingerprint === device.deviceFingerprint && measured.appBuild === device.appBuild &&
    Number.isSafeInteger(device.contextTokens) && device.contextTokens > 0 &&
    measured.contextTokens === device.contextTokens && !!model.contextTokens && device.contextTokens <= model.contextTokens &&
    measured.evaluationVersion === QWEN_EVALUATION_VERSION &&
    measured.corpusSha256 === QWEN_EVALUATION_FINGERPRINTS.corpusSha256 &&
    measured.contractSha256 === QWEN_EVALUATION_FINGERPRINTS.contractSha256 &&
    measured.suiteSha256 === QWEN_EVALUATION_FINGERPRINTS.suiteSha256 && measured.accuracyPassed === true &&
    measured.safetyPassed === true && measured.interruptionPassed === true &&
    Number.isSafeInteger(measured.completedCycles) && measured.completedCycles >= 3 &&
    positive.every(value => Number.isFinite(value) && value > 0) &&
    measured.peakAppBytes <= measured.measuredBudgetBytes && measured.p95GenerationMs <= 30_000 &&
    measured.coldLoadMs <= 120_000;
}

export function chooseQualifiedQwen(choice: 'auto' | 'off' | string, device: QwenDevice, records: QwenQualification[]): QwenCandidate | null {
  if (choice === 'off') return null;
  const available = qwenCandidates.filter(model => records.some(record => qwenQualificationPasses(model, device, record)));
  if (choice !== 'auto') return available.find(model => model.id === choice) ?? null;
  return [...available].sort((a, b) => b.parametersB - a.parametersB || a.downloadBytes - b.downloadBytes)[0] ?? null;
}
