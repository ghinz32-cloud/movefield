export * from "./evidence-sources-runtime.js";

/** Creator routines and exercise datasets are separate from scientific studies. */
export function isProgramSource(id: string): boolean {
  return id.startsWith('src-') || /EXPERT|EXERCISE-DATA/.test(id);
}
