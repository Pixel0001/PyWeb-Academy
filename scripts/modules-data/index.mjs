// Aggregator pentru toate modulele de învățare
import { pythonModule } from './python.mjs'
import { javascriptModule } from './javascript.mjs'
import { htmlModule } from './html.mjs'
import { cssModule } from './css.mjs'
import { pythonMetodicaPatch } from './python-metodica.mjs'
import { javascriptMetodicaPatch } from './javascript-metodica.mjs'
import { pythonMetodicaExtraPatch } from './python-metodica-extra.mjs'
import { javascriptMetodicaExtraPatch } from './javascript-metodica-extra.mjs'
// Teorie îmbogățită (stil prietenos pentru elevi 9-10 ani)
import { pythonEnriched } from './python-enriched.mjs'
import { pythonEnrichedPart2 } from './python-enriched-part2.mjs'
import { jsEnriched } from './javascript-enriched.mjs'
import { htmlEnriched } from './html-enriched.mjs'
import { cssEnriched } from './css-enriched.mjs'

// Convertește un dicționar enriched ({ slug: { theory, problems } })
// într-un patch ({ replaceTheory, appendProblems }).
function enrichedToPatch(dict) {
  const replaceTheory = {}
  const appendProblems = {}
  for (const [slug, ent] of Object.entries(dict || {})) {
    if (ent.theory) replaceTheory[slug] = ent.theory
    if (ent.problems && ent.problems.length) appendProblems[slug] = ent.problems
  }
  return { replaceTheory, appendProblems }
}

// Aplică un patch peste un modul:
//  - replaceTheory[slug]  → înlocuiește teoria
//  - appendTheory[slug]   → concatenează la final de theory
//  - appendProblems[slug] → concatenează la final de problems
//  - newLessons[]         → inserează după lecția cu afterSlug
function applyPatch(mod, patch) {
  if (!patch) return mod
  let lessons = mod.lessons.map((l) => {
    const out = { ...l }
    if (patch.replaceTheory && patch.replaceTheory[l.slug]) {
      out.theory = patch.replaceTheory[l.slug]
    }
    if (patch.appendTheory && patch.appendTheory[l.slug]) {
      out.theory = (out.theory || '') + patch.appendTheory[l.slug]
    }
    if (patch.appendProblems && patch.appendProblems[l.slug]) {
      out.problems = [...(out.problems || []), ...patch.appendProblems[l.slug]]
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

// Ordine: base → enriched (înlocuiește teoria) → metodica (adaugă teorie+probleme+lecții noi) → metodica-extra
const enrichedPython = applyPatch(
  applyPatch(
    applyPatch(
      applyPatch(pythonModule, enrichedToPatch({ ...pythonEnriched, ...pythonEnrichedPart2 })),
      pythonMetodicaPatch
    ),
    pythonMetodicaExtraPatch
  ),
  null
)
const enrichedJavascript = applyPatch(
  applyPatch(
    applyPatch(applyPatch(javascriptModule, enrichedToPatch(jsEnriched)), javascriptMetodicaPatch),
    javascriptMetodicaExtraPatch
  ),
  null
)
const enrichedHtml = applyPatch(htmlModule, enrichedToPatch(htmlEnriched))
const enrichedCss = applyPatch(cssModule, enrichedToPatch(cssEnriched))

export const allModules = [enrichedPython, enrichedJavascript, enrichedHtml, enrichedCss]
