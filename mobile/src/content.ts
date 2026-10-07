import guideData from '../assets/content/exercise-guides.json';
import mediaData from '../assets/content/exercise-content.json';
export type Guide = { variant: string; summary: string; equipment: string[]; setup: string[]; execution: string[]; finish: string[]; breathing: string[]; commonErrors: string[]; easierOption: string; safety: string; loadConvention: string; sourceURLs: string[]; sourceNote: string; quickCues?: string[]; capability?: string; terms?: {term: string; meaning: string}[]; reviewedAt?: string };
export const guides = guideData as Record<string, Guide>;
export const media = mediaData as Record<string, { sourceUrl?: string; videoUrl?: string | null; hasVideo?: boolean; verification?: string }>;
export function safeWebUrl(value?: string | null): string | null {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null; } catch { return null; }
}
