/**
 * Utilități pentru Problem Bank System
 */

import crypto from 'crypto'

/**
 * Generează un token random pentru link-ul public al unui set
 */
export function generateAccessToken() {
  return crypto.randomBytes(16).toString('base64url')
}

/**
 * Normalizează un răspuns text pentru comparație: trim, lowercase, normalize whitespace
 */
function normalize(s) {
  if (s === null || s === undefined) return ''
  return String(s).trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Verifică automat răspunsul elevului în funcție de tipul problemei.
 * @param {Object} problem - obiectul Problem din DB
 * @param {string} answer - răspunsul elevului
 * @returns {{ isCorrect: boolean, normalizedAnswer: string }}
 */
export function verifyAnswer(problem, answer) {
  const normalizedAnswer = normalize(answer)

  if (!problem) return { isCorrect: false, normalizedAnswer }

  switch (problem.type) {
    case 'MULTIPLE_CHOICE': {
      // correctAnswer poate fi index ("0") sau textul opțiunii
      const correct = normalize(problem.correctAnswer)
      if (correct === normalizedAnswer) return { isCorrect: true, normalizedAnswer }
      // încercăm și mapping prin index
      const idx = parseInt(problem.correctAnswer, 10)
      if (!isNaN(idx) && problem.options?.[idx]) {
        return { isCorrect: normalize(problem.options[idx]) === normalizedAnswer, normalizedAnswer }
      }
      return { isCorrect: false, normalizedAnswer }
    }
    case 'SHORT_ANSWER':
    case 'INPUT_OUTPUT': {
      return {
        isCorrect: normalize(problem.correctAnswer) === normalizedAnswer,
        normalizedAnswer,
      }
    }
    case 'CODING': {
      // MVP: verificăm dacă output-ul (last line strip) match-uiește correctAnswer
      // sau dacă codul conține correctAnswer ca substring (fallback)
      const expected = normalize(problem.correctAnswer)
      if (!expected) return { isCorrect: false, normalizedAnswer }
      return {
        isCorrect: normalizedAnswer.includes(expected) || expected === normalizedAnswer,
        normalizedAnswer,
      }
    }
    default:
      return { isCorrect: false, normalizedAnswer }
  }
}

/**
 * Selectează random N probleme dintr-o listă, evitând cele recent rezolvate.
 * Distribuie pe dificultăți dacă se specifică `mix`.
 *
 * @param {Object[]} candidates - probleme candidat (deja filtrate pe topic etc.)
 * @param {Object} opts
 * @param {number} opts.count - câte probleme vrem
 * @param {Set<string>} [opts.recentProblemIds] - ID-uri rezolvate recent (de evitat)
 * @param {{ EASY?: number, MEDIUM?: number, HARD?: number }} [opts.mix] - mix dificultăți
 * @returns {Object[]} probleme selectate
 */
export function smartRandomSelect(candidates, { count, recentProblemIds = new Set(), mix } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return []

  // Separăm preferate (nerezolvate recent) vs "fallback"
  const fresh = candidates.filter(p => !recentProblemIds.has(p.id))
  const stale = candidates.filter(p => recentProblemIds.has(p.id))

  const pickFrom = (arr, n) => {
    const copy = [...arr]
    const out = []
    while (out.length < n && copy.length > 0) {
      const idx = Math.floor(Math.random() * copy.length)
      out.push(copy.splice(idx, 1)[0])
    }
    return out
  }

  // Cu mix: extragem din fiecare bucket pe rând
  if (mix && Object.values(mix).some(v => v > 0)) {
    const buckets = {
      EASY: fresh.filter(p => p.difficulty === 'EASY'),
      MEDIUM: fresh.filter(p => p.difficulty === 'MEDIUM'),
      HARD: fresh.filter(p => p.difficulty === 'HARD'),
    }
    const result = []
    for (const diff of ['EASY', 'MEDIUM', 'HARD']) {
      const want = mix[diff] || 0
      result.push(...pickFrom(buckets[diff], want))
    }
    // Dacă nu avem destule, completăm din rest
    if (result.length < count) {
      const remaining = fresh.filter(p => !result.includes(p))
      result.push(...pickFrom(remaining, count - result.length))
    }
    if (result.length < count) {
      result.push(...pickFrom(stale.filter(p => !result.includes(p)), count - result.length))
    }
    return result.slice(0, count)
  }

  // Fără mix: random simplu, întâi fresh apoi stale
  const result = pickFrom(fresh, count)
  if (result.length < count) {
    result.push(...pickFrom(stale, count - result.length))
  }
  return result
}

/**
 * Calculează statistici de tracking pentru un elev.
 * @param {Object[]} attempts - listă de ProblemAttempt cu include problem
 * @returns {{ total, correct, accuracy, byTopic: { topic, total, correct, accuracy }[], weakTopics: string[] }}
 */
export function computeStudentStats(attempts) {
  const total = attempts.length
  const correct = attempts.filter(a => a.isCorrect).length
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

  const byTopicMap = new Map()
  for (const a of attempts) {
    const topic = a.problem?.topic || 'unknown'
    const cur = byTopicMap.get(topic) || { topic, total: 0, correct: 0 }
    cur.total += 1
    if (a.isCorrect) cur.correct += 1
    byTopicMap.set(topic, cur)
  }
  const byTopic = [...byTopicMap.values()].map(t => ({
    ...t,
    accuracy: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
  }))

  // Slabe = topic-uri cu cel puțin 2 încercări și accuracy < 60%
  const weakTopics = byTopic
    .filter(t => t.total >= 2 && t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map(t => t.topic)

  return { total, correct, accuracy, byTopic, weakTopics }
}

/**
 * Sugerează nivelul de dificultate următor în funcție de istoric.
 * Reguli:
 *  - 3 EASY consecutive corecte → MEDIUM
 *  - 3 MEDIUM consecutive corecte → HARD
 *  - 2 greșeli consecutive la HARD → MEDIUM
 *  - 2 greșeli consecutive la MEDIUM → EASY
 *  - altfel: rămâne pe nivelul curent
 *
 * @param {Array} recentAttempts - lista de attempts/submissions ordonate desc după dată
 *                                  fiecare element trebuie să aibă { isCorrect, problem: { difficulty } }
 * @param {string} currentDifficulty - 'EASY' | 'MEDIUM' | 'HARD'
 * @returns {{ next: string, reason: string }}
 */
export function suggestNextDifficulty(recentAttempts = [], currentDifficulty = 'EASY') {
  const sameLevel = recentAttempts.filter(a => a.problem?.difficulty === currentDifficulty).slice(0, 5)

  // 3 consecutive corecte la nivelul curent → urcă
  const last3 = sameLevel.slice(0, 3)
  if (last3.length === 3 && last3.every(a => a.isCorrect)) {
    if (currentDifficulty === 'EASY') return { next: 'MEDIUM', reason: '3 EASY corecte consecutiv → trecem la MEDIUM' }
    if (currentDifficulty === 'MEDIUM') return { next: 'HARD', reason: '3 MEDIUM corecte consecutiv → trecem la HARD' }
  }

  // 2 consecutive greșite → coboară
  const last2 = sameLevel.slice(0, 2)
  if (last2.length === 2 && last2.every(a => !a.isCorrect)) {
    if (currentDifficulty === 'HARD') return { next: 'MEDIUM', reason: '2 HARD greșite → revenim la MEDIUM' }
    if (currentDifficulty === 'MEDIUM') return { next: 'EASY', reason: '2 MEDIUM greșite → revenim la EASY' }
  }

  return { next: currentDifficulty, reason: 'Continuă pe același nivel' }
}

/**
 * Generează un slug URL-friendly dintr-un titlu.
 */
export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

