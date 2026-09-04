/**
 * Verificarea site-ului unei firme → coloanele CALITATE_SITE și OBSERVATII_SITE.
 *
 * Regulile se aplică ÎN ORDINEA de mai jos. Prima care se potrivește câștigă:
 *
 *   LIPSA            websiteUri lipsește complet
 *   DOAR_SOCIAL      link către facebook / instagram / ok.ru / vk.com / linktr.ee
 *   MORT             DNS invalid, timeout peste 10s, sau status 4xx / 5xx
 *   FARA_HTTPS       merge doar pe http://, sau certificat SSL invalid / expirat
 *   NEADAPTAT_MOBIL  HTML-ul nu conține <meta name="viewport">
 *   LENT             răspunsul complet durează peste 3 secunde
 *   OK               nimic din cele de mai sus
 *
 * Descărcăm DOAR documentul HTML — nicio imagine, niciun asset.
 */

import tls from 'tls'
import { CONFIG } from './config.js'

const V = CONFIG.verificareSite

// ============================================================
// AJUTOARE
// ============================================================

/**
 * Domeniile care înseamnă „nu are site propriu, doar pagină de social".
 * Exportată pentru că e folosită și la filtrarea firmelor fără telefon:
 * o firmă fără număr, dar cu pagină de Facebook, tot e un lead — îi scriu.
 *
 * @returns {string|null} domeniul social găsit, sau null
 */
export function esteSocial(url) {
  if (!url) return null
  let gazda
  try {
    gazda = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
  return V.domeniiSociale.find((d) => gazda === d || gazda.endsWith(`.${d}`)) || null
}

/**
 * Traduce o eroare de rețea în motivul exact, în cuvinte,
 * plus verdictul corespunzător (MORT sau FARA_HTTPS).
 */
function clasificaEroare(err) {
  const cod = err?.cause?.code || err?.code || ''
  const nume = err?.name || ''

  // Timeout — l-am impus noi cu AbortController
  if (nume === 'AbortError' || nume === 'TimeoutError') {
    return { calitate: 'MORT', motiv: `nu răspunde în ${V.timeoutMs / 1000}s (timeout)` }
  }

  // Certificat SSL — regula spune FARA_HTTPS, nu MORT
  const coduriCert = {
    CERT_HAS_EXPIRED: 'certificat SSL expirat',
    CERT_NOT_YET_VALID: 'certificat SSL încă nevalabil',
    DEPTH_ZERO_SELF_SIGNED_CERT: 'certificat SSL auto-semnat',
    SELF_SIGNED_CERT_IN_CHAIN: 'certificat SSL auto-semnat în lanț',
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'certificat SSL neverificabil',
    ERR_TLS_CERT_ALTNAME_INVALID: 'certificat SSL emis pentru alt domeniu',
    ERR_SSL_WRONG_VERSION_NUMBER: 'SSL configurat greșit pe server',
    ERR_SSL_SSLV3_ALERT_HANDSHAKE_FAILURE: 'handshake SSL eșuat',
    UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 'certificat SSL cu lanț incomplet',
  }
  if (coduriCert[cod]) {
    return { calitate: 'FARA_HTTPS', motiv: coduriCert[cod], esteCert: true }
  }

  // DNS
  if (cod === 'ENOTFOUND' || cod === 'EAI_AGAIN') {
    return { calitate: 'MORT', motiv: 'domeniu inexistent (DNS nu rezolvă)' }
  }

  // Conexiune
  const coduriConexiune = {
    ECONNREFUSED: 'serverul refuză conexiunea',
    ECONNRESET: 'conexiune întreruptă de server',
    EHOSTUNREACH: 'server inaccesibil',
    ENETUNREACH: 'rețea inaccesibilă',
    ETIMEDOUT: `nu răspunde în ${V.timeoutMs / 1000}s (timeout)`,
    UND_ERR_CONNECT_TIMEOUT: `nu răspunde în ${V.timeoutMs / 1000}s (timeout)`,
    UND_ERR_HEADERS_TIMEOUT: `nu răspunde în ${V.timeoutMs / 1000}s (timeout)`,
  }
  if (coduriConexiune[cod]) {
    return { calitate: 'MORT', motiv: coduriConexiune[cod] }
  }

  return {
    calitate: 'MORT',
    motiv: `cerere eșuată (${cod || err?.message || 'eroare necunoscută'})`,
  }
}

/**
 * Când certificatul e invalid, ne conectăm o dată pe TCP ca să citim data
 * exactă de expirare — ca să pot scrie „certificat expirat în 2023",
 * nu doar „certificat invalid".
 */
async function citesteDataCertificat(gazda) {
  return new Promise((resolve) => {
    let gata = false
    let socket = null

    const termina = (valoare) => {
      if (gata) return
      gata = true
      try {
        socket?.destroy()
      } catch {}
      resolve(valoare)
    }

    try {
      socket = tls.connect(
        { host: gazda, port: 443, servername: gazda, rejectUnauthorized: false, timeout: 5000 },
        () => {
          const cert = socket.getPeerCertificate()
          termina(cert?.valid_to ? new Date(cert.valid_to) : null)
        }
      )
      socket.on('error', () => termina(null))
      socket.on('timeout', () => termina(null))
    } catch {
      termina(null)
    }

    setTimeout(() => termina(null), 5000)
  })
}

/**
 * O singură cerere HTTP, fără urmărire automată a redirect-urilor
 * (le urmărim manual ca să le putem număra și ca să vedem destinația finală).
 */
async function cerere(url, semnal) {
  return fetch(url, {
    method: 'GET',
    redirect: 'manual',
    signal: semnal,
    headers: {
      'User-Agent': V.userAgent,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ro-RO,ro;q=0.9,en;q=0.8',
    },
  })
}

/** Citește corpul răspunsului, dar nu mai mult de `maxHtmlBytes`. */
async function citesteHtml(raspuns) {
  const tip = raspuns.headers.get('content-type') || ''
  // Nu descărcăm decât documente text (fără PDF-uri, imagini etc.)
  if (tip && !/text\/html|application\/xhtml|text\/plain/i.test(tip)) return ''

  const cititor = raspuns.body?.getReader?.()
  if (!cititor) return (await raspuns.text()).slice(0, V.maxHtmlBytes)

  const bucati = []
  let total = 0
  while (total < V.maxHtmlBytes) {
    const { done, value } = await cititor.read()
    if (done) break
    bucati.push(Buffer.from(value))
    total += value.length
  }
  try {
    await cititor.cancel()
  } catch {}

  return new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(bucati))
}

/**
 * Urmărește lanțul de redirect-uri (maxim `redirectMax`) pornind de la `urlStart`.
 */
async function urmeazaRedirecturi(urlStart, semnal) {
  let url = urlStart
  let redirectari = 0

  while (true) {
    const raspuns = await cerere(url, semnal)
    const status = raspuns.status

    const esteRedirect = status >= 300 && status < 400 && raspuns.headers.get('location')
    if (!esteRedirect) {
      return { raspuns, urlFinal: url, redirectari }
    }

    if (redirectari >= V.redirectMax) {
      return { raspuns, urlFinal: url, redirectari, preaMulteRedirecturi: true }
    }

    // Location poate fi relativ — îl rezolvăm față de URL-ul curent.
    const destinatie = new URL(raspuns.headers.get('location'), url).toString()
    try {
      await raspuns.body?.cancel()
    } catch {}

    url = destinatie
    redirectari++
  }
}

/**
 * Probă scurtă: răspunde domeniul pe https?
 *
 * @returns {Promise<string|null|''>}
 *   `null`  → https merge (site-ul NU e „doar http")
 *   `''`    → https nu merge, fără un motiv anume de certificat
 *   `text`  → https nu merge din cauza certificatului (motivul, în cuvinte)
 */
async function probeazaHttps(urlFinalObj, semnalGlobal) {
  const urlHttps = new URL(urlFinalObj.toString())
  urlHttps.protocol = 'https:'

  const controlerProba = new AbortController()
  const cronometru = setTimeout(() => controlerProba.abort(), 3000)
  try {
    const proba = await urmeazaRedirecturi(
      urlHttps.toString(),
      AbortSignal.any([semnalGlobal, controlerProba.signal])
    )
    try {
      await proba.raspuns.body?.cancel()
    } catch {}

    // Domeniul are SSL funcțional DOAR dacă pe https ajungem la conținut fără
    // să fim aruncați înapoi pe http. Un site care redirecționează https → http
    // rămâne, practic, un site fără https.
    const aRamasPeHttps = proba.urlFinal.startsWith('https:')
    return aRamasPeHttps && proba.raspuns.status < 400 ? null : ''
  } catch (err) {
    const c = clasificaEroare(err)
    return c.esteCert ? c.motiv : ''
  } finally {
    clearTimeout(cronometru)
  }
}

// ============================================================
// VERIFICAREA PROPRIU-ZISĂ
// ============================================================

/**
 * Verifică un singur site și întoarce verdictul + motivul în cuvinte.
 *
 * @param {string|null} siteUrl  websiteUri de la Google (poate lipsi)
 * @returns {Promise<{ calitate: string, observatii: string, urlFinal: string|null, durataMs: number|null }>}
 */
export async function verificaSite(siteUrl) {
  // ── Regula 1: LIPSA ────────────────────────────────────────────────
  if (!siteUrl || !siteUrl.trim()) {
    return {
      calitate: 'LIPSA',
      observatii: 'nu are niciun site în Google Maps',
      urlFinal: null,
      durataMs: null,
    }
  }

  let url
  try {
    url = new URL(siteUrl.trim())
  } catch {
    return {
      calitate: 'MORT',
      observatii: `adresă invalidă: ${siteUrl}`,
      urlFinal: null,
      durataMs: null,
    }
  }

  // ── Regula 2: DOAR_SOCIAL ──────────────────────────────────────────
  const social = esteSocial(url.toString())
  if (social) {
    return {
      calitate: 'DOAR_SOCIAL',
      observatii: `nu are site, doar pagină de ${social}`,
      urlFinal: url.toString(),
      durataMs: null,
    }
  }

  // Timeout global pentru tot lanțul de cereri al acestui site.
  const controler = new AbortController()
  const cronometruTimeout = setTimeout(() => controler.abort(), V.timeoutMs)
  const inceput = Date.now()

  try {

    let rezultat = null

    // Cererea principală — exact adresa listată de Google, cu tot bugetul de timp.
    try {
      rezultat = await urmeazaRedirecturi(url.toString(), controler.signal)
    } catch (err) {
      const c = clasificaEroare(err)

      // ── Regula 4 (parțial): certificat SSL invalid / expirat ──────
      if (c.esteCert) {
        let motiv = c.motiv
        const dataExpirare = await citesteDataCertificat(url.hostname)
        if (dataExpirare && !Number.isNaN(dataExpirare.getTime())) {
          const anul = dataExpirare.getFullYear()
          motiv =
            dataExpirare < new Date()
              ? `certificat SSL expirat în ${anul}`
              : `${c.motiv} (valabil până în ${anul})`
        }
        return {
          calitate: 'FARA_HTTPS',
          observatii: motiv,
          urlFinal: url.toString(),
          durataMs: Date.now() - inceput,
        }
      }

      // ── Regula 3: MORT ───────────────────────────────────────────
      return {
        calitate: 'MORT',
        observatii: c.motiv,
        urlFinal: url.toString(),
        durataMs: Date.now() - inceput,
      }
    }

    const { raspuns, urlFinal, redirectari, preaMulteRedirecturi } = rezultat
    const urlFinalObj = new URL(urlFinal)

    // Redirect către o rețea socială → tot DOAR_SOCIAL (regula 2, aplicată destinației finale)
    const socialFinal = esteSocial(urlFinal)
    if (socialFinal) {
      const cale =
        urlFinalObj.hostname.replace(/^www\./, '') + urlFinalObj.pathname.replace(/\/$/, '')
      return {
        calitate: 'DOAR_SOCIAL',
        observatii: `site-ul redirecționează către ${cale}`,
        urlFinal,
        durataMs: Date.now() - inceput,
      }
    }

    if (preaMulteRedirecturi) {
      return {
        calitate: 'MORT',
        observatii: `buclă de redirect-uri (peste ${V.redirectMax})`,
        urlFinal,
        durataMs: Date.now() - inceput,
      }
    }

    // ── Regula 3: MORT — status 4xx / 5xx ────────────────────────────
    if (raspuns.status >= 400) {
      try {
        await raspuns.body?.cancel()
      } catch {}
      return {
        calitate: 'MORT',
        observatii: `status ${raspuns.status}${redirectari ? ` după ${redirectari} redirect-uri` : ''}`,
        urlFinal,
        durataMs: Date.now() - inceput,
      }
    }

    // Citim HTML-ul (cu plafon de mărime) — abia acum putem măsura „răspunsul complet".
    const html = await citesteHtml(raspuns)
    const durataMs = Date.now() - inceput

    // ── Regula 4: FARA_HTTPS — destinația finală rămâne pe http:// ───
    //
    // Multe firme sunt listate în Maps cu http://, dar site-ul redirecționează
    // singur spre https — pe acelea nu le acuzăm degeaba. Așa că, doar dacă am
    // rămas pe http, mai dăm o probă scurtă pe https ca să vedem dacă domeniul
    // chiar nu are SSL. Proba are buget mic (3s), ca să nu întârzie rularea.
    if (urlFinalObj.protocol === 'http:') {
      const motivCert = await probeazaHttps(urlFinalObj, controler.signal)

      // Proba a mers → site-ul suportă https, deci nu e „doar http". Mergem mai departe.
      if (motivCert !== null) {
        const detaliu = motivCert ? `, iar pe https: ${motivCert}` : ''
        return {
          calitate: 'FARA_HTTPS',
          observatii: `merge doar pe http://, fără certificat SSL valid${detaliu}`,
          urlFinal,
          durataMs,
        }
      }
    }

    // ── Regula 5: NEADAPTAT_MOBIL — lipsește <meta name="viewport"> ──
    const areViewport = /<meta[^>]+name\s*=\s*["']?viewport["']?/i.test(html)
    if (!areViewport) {
      return {
        calitate: 'NEADAPTAT_MOBIL',
        observatii: 'site-ul nu are meta viewport — nu se vede corect pe telefon',
        urlFinal,
        durataMs,
      }
    }

    // ── Regula 6: LENT ───────────────────────────────────────────────
    if (durataMs > V.pragLentMs) {
      return {
        calitate: 'LENT',
        observatii: `se încarcă în ${(durataMs / 1000).toFixed(1)}s (peste ${V.pragLentMs / 1000}s)`,
        urlFinal,
        durataMs,
      }
    }

    // ── Regula 7: OK ─────────────────────────────────────────────────
    return {
      calitate: 'OK',
      observatii: `site funcțional, se încarcă în ${(durataMs / 1000).toFixed(1)}s`,
      urlFinal,
      durataMs,
    }
  } catch (err) {
    const c = clasificaEroare(err)
    return {
      calitate: c.calitate,
      observatii: c.motiv,
      urlFinal: url.toString(),
      durataMs: Date.now() - inceput,
    }
  } finally {
    clearTimeout(cronometruTimeout)
  }
}

/**
 * Verifică mai multe site-uri în paralel, cu maximum `concurenta` cereri simultane.
 *
 * @param {Array<{ placeId: string, siteUrl: string|null }>} leaduri
 * @param {(gata: number, total: number) => void} [onProgres]
 * @returns {Promise<Map<string, object>>} placeId → rezultatul verificării
 */
export async function verificaSiteuri(leaduri, onProgres) {
  const rezultate = new Map()
  const limita = V.concurenta
  let index = 0
  let gata = 0

  async function lucrator() {
    while (index < leaduri.length) {
      const i = index++
      const lead = leaduri[i]
      try {
        rezultate.set(lead.placeId, await verificaSite(lead.siteUrl))
      } catch (err) {
        // Plasă de siguranță — un site stricat nu trebuie să oprească rularea.
        rezultate.set(lead.placeId, {
          calitate: 'MORT',
          observatii: `verificare eșuată: ${err.message?.slice(0, 120)}`,
          urlFinal: lead.siteUrl,
          durataMs: null,
        })
      }
      gata++
      onProgres?.(gata, leaduri.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(limita, leaduri.length) }, lucrator))
  return rezultate
}
