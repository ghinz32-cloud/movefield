// Reads a goal typed in the person's own words and suggests one of the app's goals.
// Deterministic keyword rules only. Nothing is applied until the person chooses it.
// Each suggestion lists the words that matched, so the person can see why it was suggested.

export type GoalReading = {
  goal: string;
  label: string;
  matched: string[];
  alternatives: {goal: string; label: string; short: string}[];
  hint?: string;
};

const LABELS: Record<string, string> = {
  hybrid: 'Hybrid · strength plus running',
  powerbuilding: 'Powerbuilding · strength and muscle',
  powerlifting: 'Powerlifting · squat, bench, deadlift',
  sport: 'Sport performance',
  running: 'Start running',
  calisthenics: 'Calisthenics',
  hypertrophy: 'Build muscle',
  strength: 'Strength',
  general: 'General fitness',
};

// Resolution order: the first matching goal wins. More specific goals come first, so "run and lift" is hybrid, not running.
// Short names for sentences such as "Also mentioned: running."
const SHORT: Record<string, string> = {hybrid: 'hybrid training', powerbuilding: 'powerbuilding', powerlifting: 'powerlifting', sport: 'sport', running: 'running', calisthenics: 'calisthenics', hypertrophy: 'building muscle', strength: 'strength', general: 'general fitness'};

const ORDER = ['hybrid', 'powerbuilding', 'sport', 'powerlifting', 'running', 'calisthenics', 'hypertrophy', 'strength', 'general'];

const RULES: Record<string, RegExp> = {
  hybrid: /\bhybrid\b|\b(run\w*|jog\w*|5k|10k|marathon)\b[^.]*\b(lift\w*|strength|strong\w*|weights?|gym)\b|\b(lift\w*|strength|strong\w*|weights?|gym)\b[^.]*\b(run\w*|jog\w*|5k|10k|marathon)\b/i,
  powerbuilding: /\bpower\s?build\w*|\bstrength and (size|muscle|mass|hypertrophy)\b|\b(size|muscle|mass|hypertrophy) and strength\b/i,
  powerlifting: /\bpower\s?lift\w*|\bsquats?\b|\bbench(\s?press)?\b|\bdeadlifts?\b|\bsbd\b|\b1\s?rm\b|\bone[- ]rep max\b|\bmax strength\b|\bcompetition\b|\bmeet\b/i,
  sport: /\bsports?\b|\b(football|soccer|basketball|baseball|softball|hockey|lacrosse|volleyball|tennis|golf|wrestl\w*|cross country|sprint\w*|swim\w*|cheer|gymnast\w*|athlet\w*|agility)\b|\b(jump higher|vertical|dunk)\b/i,
  running: /\b(run|runs|running|runner|jog|jogging|5k|10k|half marathon|marathon|c25k|couch to 5k)\b/i,
  calisthenics: /\bcalisthen\w*|\bbodyweight\b|\bbody weight\b|\b(pull|chin)[- ]?ups?\b|\bmuscle[- ]?ups?\b|\bpush[- ]?ups?\b|\bhandstands?\b|\bplanche\b|\bfront lever\b|\bstreet ?workout\b/i,
  hypertrophy: /\bmuscles?\b|\bbodybuild\w*|\bbody build\w*|\bhypertroph\w*|\bbigger\b|\bbulk\w*|\bmass\b|\bphysique\b|\bgrow\w*|\baesthetic\w*|\btoned?\b|\bsize\b/i,
  strength: /\bstrength\b|\bstronger\b|\bstrong\b|\bheavier\b/i,
  general: /\bgeneral\b|\bfitness\b|\bhealthy\b|\bhealth\b|\bactive\b|\benergy\b|\bstamina\b|\bendurance\b|\bconditioning\b|\bweight loss\b|\blose weight\b|\bfat loss\b|\bfeel better\b|\bmobility\b|\bbeginner\b/i,
};

const JUMP = /\bjump\w*|\bvertical\b|\bdunk\w*/i;

// Phrases that match a rule but are not about the goal, such as "run" inside "running shoes" or "size" in "size chart".
const IGNORED = /\b(running shoes?|size chart)\b/gi;

export function readGoal(text: string): GoalReading | null {
  const clean = text.slice(0, 300).replace(IGNORED, ' ').trim();
  if (!clean) return null;
  const hits: Record<string, string[]> = {};
  for (const goal of ORDER) {
    const pattern = new RegExp(RULES[goal].source, 'gi');
    const words = [...clean.matchAll(pattern)].map(m => m[0].toLowerCase().trim()).filter(Boolean);
    if (words.length) hits[goal] = [...new Set(words)];
  }
  const found = ORDER.filter(goal => hits[goal]);
  if (!found.length) return null;
  const [goal, ...rest] = found;
  const hint = JUMP.test(clean) ? 'Jump practice is a separate training focus. Add it in the next step if you want it.' : undefined;
  return {
    goal,
    label: LABELS[goal],
    matched: hits[goal],
    alternatives: rest.map(g => ({goal: g, label: LABELS[g], short: SHORT[g]})),
    hint,
  };
}

export const goalLabel = (goal: string) => LABELS[goal] ?? goal;
