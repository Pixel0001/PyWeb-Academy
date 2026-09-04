/**
 * Încarcă .env.local pentru scripturile rulate din linia de comandă.
 *
 * Next.js citește singur .env.local, dar `node scripts/…` nu — ar vedea
 * variabilele ca nesetate și ar crede că n-ai cheie. Folosim încărcătorul
 * oficial din Next (@next/env), ca ordinea fișierelor să fie exact aceeași
 * ca în aplicație: .env.local → .env.development → .env
 *
 * Se importă PRIMUL în orice script care are nevoie de chei:
 *     import './_env.mjs'
 */

// @next/env e CommonJS — se importă prin default, nu prin export numit.
import nextEnv from '@next/env'

const { loadEnvConfig } = nextEnv

// Al treilea argument e logger-ul: îi tăiem `info` ca să nu scuipe
// „Loaded env from …" peste rezultatele testelor.
loadEnvConfig(process.cwd(), true, { info: () => {}, error: console.error })
