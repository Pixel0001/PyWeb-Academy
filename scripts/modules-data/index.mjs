// Aggregator pentru toate modulele de învățare
import { pythonModule } from './python.mjs'
import { javascriptModule } from './javascript.mjs'
import { htmlModule } from './html.mjs'
import { cssModule } from './css.mjs'
import { pythonMetodicaPatch } from './python-metodica.mjs'
import { javascriptMetodicaPatch } from './javascript-metodica.mjs'

// Aplică un patch (din metodici) peste un modul:
//  - appendTheory[slug]   → concatenează la final de theory
//  - appendProblems[slug] → concatenează la final de problems
//  - newLessons[]         → inserează după lecția cu afterSlug
function applyPatch(mod, patch) {
  if (!patch) return mod
  let lessons = mod.lessons.map((l) => {
    const out = { ...l }
    if (patch.appendTheory && patch.appendTheory[l.slug]) {
      out.theory = (l.theory || '') + patch.appendTheory[l.slug]
    }
    if (patch.appendProblems && patch.appendProblems[l.slug]) {
      out.problems = [...(l.problems || []), ...patch.appendProblems[l.slug]]
    }
    return out
  })
  for (const nl of patch.newLessons || []) {
    const { afterSlug, ...lesson } = nl
    const idx = lessons.findIndex((l) => l.slug === afterSlug)
    if (idx >= 0) lessons.splice(idx + 1, 0, lesson)
    else lessons.push(lesson)
  }
  return { ...mod, lessons }
}

const enrichedPython = applyPatch(pythonModule, pythonMetodicaPatch)
const enrichedJavascript = applyPatch(javascriptModule, javascriptMetodicaPatch)

export const allModules = [enrichedPython, enrichedJavascript, htmlModule, cssModule]
