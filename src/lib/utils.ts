import type { Question, OptionKey } from '../types'

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

/** Maps display key → original key so answers can be translated back for DB storage */
export type OptionKeyMap = Record<string, string>

/**
 * Shuffle a question's answer options into a random order.
 * Returns the shuffled question and a map to convert display keys back to original keys.
 *
 * Flow:
 * 1. Display shuffled options to the user (A/B/C/D labels stay, content moves)
 * 2. User picks a display key (e.g. "B")
 * 3. For live scoring: compare against shuffled question.answer → correct
 * 4. For DB save: use keyMap to convert "B" → original key (e.g. "D")
 * 5. History loads original JSON + original keys → correct display
 */
export function shuffleQuestionOptions(question: Question): { question: Question; keyMap: OptionKeyMap } {
  const originalKeys = (Object.keys(question.options) as OptionKey[]).filter(
    k => question.options[k] !== undefined
  )

  // Shuffle which original slot goes into each display position
  const shuffledSlots = fisherYatesShuffle(
    originalKeys.map(k => ({ key: k, value: question.options[k] }))
  )

  const newOptions = {} as Record<OptionKey, string>
  const displayToOriginal: OptionKeyMap = {}
  const originalToDisplay: Record<string, string> = {}

  originalKeys.forEach((displayKey, i) => {
    const source = shuffledSlots[i]
    newOptions[displayKey] = source.value
    displayToOriginal[displayKey] = source.key
    originalToDisplay[source.key] = displayKey
  })

  // Remap correct answer(s) from original keys → display keys
  const remap = (key: string) => originalToDisplay[key] || key
  const newAnswer = Array.isArray(question.answer)
    ? question.answer.map(remap)
    : remap(question.answer)

  return {
    question: { ...question, options: newOptions, answer: newAnswer },
    keyMap: displayToOriginal,
  }
}
