/**
 * Fisher-Yates shuffle for unbiased random ordering.
 * Shared utility — used by scoring.ts (exam selection) and useSpacedRepetition.ts (practice selection).
 */
export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
