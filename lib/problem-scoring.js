// Sistem de punctaj degresiv pentru problemele din lecții
//
// Reguli:
// - MULTIPLE_CHOICE cu N opțiuni: N încercări, formula liniară: 100 → 0
//   ex: 4 opțiuni → 100, 67, 33, 0
//   ex: 5 opțiuni → 100, 75, 50, 25, 0
//   ex: 3 opțiuni → 100, 50, 0
//   ex: 2 opțiuni → 100, 0
// - Toate celelalte tipuri (SHORT_ANSWER, INPUT_OUTPUT, CODING): 3 încercări → 100, 50, 0
// - Hint apăsat: −10p din scorul final, o singură utilizare per problemă
// - „Vezi rezolvarea": forțează 0p, blochează problema (nu se mai poate reîncerca)

export function getMaxAttempts(problem) {
  if (!problem) return 3
  if (problem.type === 'MULTIPLE_CHOICE') {
    const n = Array.isArray(problem.options) ? problem.options.length : 4
    return Math.max(2, n)
  }
  return 3
}

export function gradeForAttempt(attemptNumber, maxAttempts) {
  if (maxAttempts <= 1) return attemptNumber === 1 ? 100 : 0
  if (attemptNumber < 1) return 100
  if (attemptNumber >= maxAttempts) return 0
  // distribuție liniară: 100 la încercarea 1, 0 la maxAttempts
  return Math.max(0, Math.round(100 * (maxAttempts - attemptNumber) / (maxAttempts - 1)))
}

export function applyHintPenalty(grade, hintUsed) {
  if (!hintUsed) return grade
  return Math.max(0, grade - 10)
}
