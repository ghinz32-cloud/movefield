// Build identity only: workout rules and portable record formats stay shared.
declare const __MOVEFIELD_APP_VARIANT__: string;
export const isGrizzly = typeof __MOVEFIELD_APP_VARIANT__ === 'string'
  ? __MOVEFIELD_APP_VARIANT__ === 'grizzly'
  : typeof process !== 'undefined' && process.env.EXPO_PUBLIC_APP_VARIANT === 'grizzly';
export const brand = isGrizzly ? {
  name: 'Grizzly Fitness',
  tagline: 'Your den. Your next strong day.',
  description: 'Plan your training, log each workout and follow your progress.',
  ink: '#24221d', accent: '#f5cb79',
} as const : {
  name: 'Movefield',
  tagline: 'Your training, day by day.',
  description: 'Plan your training, log each workout and follow your progress.',
  ink: '#132325',
  accent: '#d8f36a',
} as const;

/** Separate app ownership; never rename crypto format identifiers. */
export const nativeStorageKey = (key: string) => isGrizzly ? 'grizzly-fitness.' + key : key;
