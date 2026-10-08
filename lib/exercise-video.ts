// Demonstration links for exercises the person has not done before. Movefield does not host or play video.
// A link goes either to a curated video page (when one is recorded for the exercise) or to the exercise's source page.
// The prompt says which one it is, so nobody is taken to a video they did not expect.
import type {Workout} from './training';

export type DemoLink = {url: string; kind: 'video' | 'source'};
export type DemoMedia = Record<string, {sourceUrl?: string; videoUrl?: string | null}>;

// Only https links without credentials. Anything else is refused.
export function safeWebUrl(value?: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

export function demoLink(exerciseId: string, media: DemoMedia | null | undefined): DemoLink | null {
  const entry = media?.[exerciseId];
  if (!entry) return null;
  const video = safeWebUrl(entry.videoUrl);
  if (video) return {url: video, kind: 'video'};
  const source = safeWebUrl(entry.sourceUrl);
  return source ? {url: source, kind: 'source'} : null;
}

// Exercises in a workout that no saved workout has logged a completed set for, and that the person has not already dismissed.
export function firstTimeExerciseIds(history: Pick<Workout, 'sets'>[], exerciseIds: string[], answered: string[] = []): string[] {
  const done = new Set<string>();
  for (const workout of history) for (const set of workout.sets) if (set.done) done.add(set.exerciseId);
  const dismissed = new Set(answered);
  return [...new Set(exerciseIds)].filter(id => !done.has(id) && !dismissed.has(id));
}
