export type Guide = { variant: string; summary: string; equipment: string[]; setup: string[]; execution: string[]; finish: string[]; breathing: string[]; commonErrors: string[]; easierOption: string; safety: string; loadConvention: string; sourceURLs: string[]; sourceNote: string; quickCues?: string[]; capability?: string; terms?: {term: string; meaning: string}[]; reviewedAt?: string };
export const guides:Record<string, Guide> = {};
export const media:Record<string, { sourceUrl?: string; videoUrl?: string | null; hasVideo?: boolean; verification?: string }> = {};
let pending:Promise<void>|undefined;
export function loadNativeContent():Promise<void>{
  pending??=Promise.all([import('../assets/content/exercise-guides.json'),import('../assets/content/exercise-content.json')]).then(([g,m])=>{Object.assign(guides,g.default);Object.assign(media,m.default);}).catch(error=>{pending=undefined;throw error});
  return pending;
}
export function safeWebUrl(value?: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
