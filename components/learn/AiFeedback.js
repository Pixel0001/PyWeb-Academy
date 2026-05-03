'use client'

import { useState } from 'react'

/**
 * Afișare feedback AI „Mr. PyWeb" pentru o problemă CODING.
 * Props:
 *   data: { aiGrade, aiDetect, aiPenaltyApplied, usage }
 *     - aiGrade: { grade, finalGrade, reasoning, rubric: {correctness, style, efficiency} }
 *     - aiDetect: { isAi, score, reason }
 *     - aiPenaltyApplied: number
 *     - usage: { used, limit, remaining }
 */
export default function AiFeedback({ data, onClose, onRetry }) {
  const [showDetails, setShowDetails] = useState(false)
  if (!data) return null

  const { aiGrade, aiDetect, aiPenaltyApplied, usage } = data
  const grade = aiGrade?.finalGrade ?? aiGrade?.grade ?? 0
  const passed = grade >= 60

  const gradeColor =
    grade >= 90 ? 'from-emerald-500 to-green-600'
    : grade >= 75 ? 'from-blue-500 to-cyan-600'
    : grade >= 60 ? 'from-yellow-500 to-amber-600'
    : 'from-red-500 to-rose-600'

  const gradeEmoji = grade >= 90 ? '🌟' : grade >= 75 ? '👏' : grade >= 60 ? '👍' : '💪'

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-lg overflow-hidden">
      {/* Header — Mr. PyWeb */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xl shadow-md">
          🐍
        </div>
        <div className="flex-1">
          <div className="text-white font-bold text-sm">Mr. PyWeb</div>
          <div className="text-blue-100 text-xs">Profesorul tău AI · PyWeb Academy</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl leading-none px-2"
            aria-label="Închide"
          >×</button>
        )}
      </div>

      {/* Avertisment AI detection */}
      {aiDetect?.isAi && (
        <div className="bg-red-50 border-b-2 border-red-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1 text-sm">
              <div className="font-bold text-red-800">Cod generat de AI detectat</div>
              <div className="text-red-700 mt-1">
                {aiDetect.reason || 'Codul tău pare scris de un AI, nu de tine.'}
              </div>
              <div className="text-red-900 font-semibold mt-2">
                Penalizare: <span className="text-lg">−{aiPenaltyApplied} puncte</span>
              </div>
              <div className="text-red-600 text-xs mt-1">
                Scor încredere AI: {aiDetect.score}/100
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notă */}
      <div className="px-4 py-4 flex items-center gap-4">
        <div className={`shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${gradeColor} text-white flex flex-col items-center justify-center shadow-md`}>
          <div className="text-3xl font-black leading-none">{grade}</div>
          <div className="text-xs opacity-90">/100</div>
        </div>
        <div className="flex-1">
          <div className="text-2xl">{gradeEmoji}</div>
          <div className={`font-bold text-sm ${passed ? 'text-green-700' : 'text-red-700'}`}>
            {passed ? 'Bravo, ai trecut!' : 'Mai ai puțin — încearcă din nou!'}
          </div>
          {aiDetect?.isAi && aiGrade?.grade !== grade && (
            <div className="text-xs text-gray-500 mt-1">
              Notă inițială: {aiGrade.grade} · Penalizare: −{aiPenaltyApplied}
            </div>
          )}
        </div>
      </div>

      {/* Feedback principal */}
      {aiGrade?.reasoning && (
        <div className="px-4 pb-3">
          <div className="bg-white rounded-xl border border-blue-100 p-3 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {aiGrade.reasoning}
          </div>
        </div>
      )}

      {/* Rubric detaliat */}
      {aiGrade?.rubric && (
        <div className="px-4 pb-3">
          <button
            onClick={() => setShowDetails(s => !s)}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <span>{showDetails ? '▼' : '▶'}</span>
            Detalii barem
          </button>
          {showDetails && (
            <div className="mt-2 grid grid-cols-3 gap-2">
              <RubricBox label="Corectitudine" value={aiGrade.rubric.correctness} icon="✅" />
              <RubricBox label="Stil" value={aiGrade.rubric.style} icon="✨" />
              <RubricBox label="Eficiență" value={aiGrade.rubric.efficiency} icon="⚡" />
            </div>
          )}
        </div>
      )}

      {/* Footer — quota + acțiuni */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs">
        <div className="text-gray-600">
          Verificări AI rămase azi: <span className="font-bold text-gray-900">{usage?.remaining ?? '—'}/{usage?.limit ?? '—'}</span>
        </div>
        {onRetry && !passed && (
          <button
            onClick={onRetry}
            className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Mai încearcă
          </button>
        )}
      </div>
    </div>
  )
}

function RubricBox({ label, value, icon }) {
  const v = typeof value === 'number' ? value : 0
  const color = v >= 80 ? 'bg-green-100 text-green-800' : v >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
  return (
    <div className={`rounded-lg p-2 text-center ${color}`}>
      <div className="text-lg">{icon}</div>
      <div className="text-[10px] font-semibold uppercase opacity-75">{label}</div>
      <div className="text-base font-bold">{v}</div>
    </div>
  )
}
