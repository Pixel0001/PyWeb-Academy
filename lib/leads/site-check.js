/**
 * Verificarea site-ului unei firme → coloanele CALITATE_SITE și OBSERVATII_SITE.
 *
 * Regulile se aplică ÎN ORDINEA de mai jos. Prima care se potrivește câștigă:
 *
 *   LIPSA            websiteUri lipsește complet
 *   DOAR_SOCIAL      link către facebook / instagram / ok.ru / vk.com / linktr.ee
 *   NECLAR           site protejat de roboți (Cloudflare, DDoS-Guard...), 401/403/429/503,
 *                    pagină „Just a moment…", conexiune tăiată sau timeout — poate merge
 *                    perfect pentru un om, dar serverul nostru (în afara țării) nu-l vede
 *   MORT             domeniu inexistent, conexiune refuzată, 404/410, 5xx de la server
 *   FARA_HTTPS       merge doar pe http://, sau certificat SSL invalid / expirat
 *   NEADAPTAT_MOBIL  HTML-ul nu conține <meta name="viewport">
 *   LENT             răspunsul complet durează peste 3 secunde
 *   OK               nimic din cele de mai sus
 *
 * Descărcăm DOAR documentul HTML — nicio imagine, niciun asset.
 */

import tls from 'tls'
import http from 'http'
import https from 'https'
import zlib from 'zlib'
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

  // Timeout — l-am impus noi cu AbortController. Multe site-uri protejate
  // nu răspund deloc serverelor din afara țării, deci nu-l declarăm mort.
  if (nume === 'AbortError' || nume === 'TimeoutError') {
    return {
      calitate: 'NECLAR',
      motiv: `nu răspunde în ${V.timeoutMs / 1000}s verificării automate (poate blochează serverele din străinătate)`,
    }
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
    // ECONNRESET și timeout-urile sunt tratate mai jos ca NECLAR
    EHOSTUNREACH: 'server inaccesibil',
    ENETUNREACH: 'rețea inaccesibilă',
  }
  if (coduriConexiune[cod]) {
    return { calitate: 'MORT', motiv: coduriConexiune[cod] }
  }

  // Conexiune tăiată sau fără răspuns — tipic pentru firewall-uri anti-roboți
  const coduriNeclare = {
    ECONNRESET: 'conexiunea a fost tăiată de server (posibil protecție anti-roboți)',
    ETIMEDOUT: `nu răspunde în ${V.timeoutMs / 1000}s verificării automate`,
    UND_ERR_CONNECT_TIMEOUT: `nu răspunde în ${V.timeoutMs / 1000}s verificării automate`,
    UND_ERR_HEADERS_TIMEOUT: `nu răspunde în ${V.timeoutMs / 1000}s verificării automate`,
    UND_ERR_SOCKET: 'conexiunea a fost tăiată de server (posibil protecție anti-roboți)',
  }
  if (coduriNeclare[cod]) {
    return { calitate: 'NECLAR', motiv: coduriNeclare[cod] }
  }

  return {
    calitate: 'MORT',
    motiv: `cerere eșuată (${cod || err?.message || 'eroare necunoscută'})`,
  }
}

// ============================================================
// PROTECȚII ANTI-ROBOȚI
// ============================================================

/**
 * Antetele unui Chrome real. A doua încercare le folosește pe toate — unele
 * firewall-uri lasă să treacă un browser „complet" dar opresc o cerere simplă.
 */
const ANTETE_BROWSER = {
  'User-Agent': V.userAgent,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ro-RO,ro;q=0.9,ru;q=0.8,en-US;q=0.7,en;q=0.6',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Ch-Ua': '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
}

/**
 * Cerere „ca un browser", prin http/https brut.
 *
 * fetch-ul din Node trimite mereu `sec-fetch-mode: cors`, oricât i-ai cere
 * altceva — iar unele firewall-uri recunosc robotul exact după asta. Aici
 * antetele pleacă exact cum le scriem. Întoarce un obiect cu aceeași formă ca
 * răspunsul lui fetch (status, headers.get, body.cancel, text), ca restul
 * verificării să nu știe diferența.
 */
function cerereBrut(url, semnal) {
  return new Promise((resolve, reject) => {
    const adresa = new URL(url)
    const modul = adresa.protocol === 'https:' ? https : http

    const req = modul.request(adresa, { method: 'GET', headers: ANTETE_BROWSER, signal: semnal }, (res) => {
      const codare = String(res.headers['content-encoding'] || '').toLowerCase()
      const flux =
        codare === 'gzip'
          ? res.pipe(zlib.createGunzip())
          : codare === 'deflate'
            ? res.pipe(zlib.createInflate())
            : codare === 'br'
              ? res.pipe(zlib.createBrotliDecompress())
              : res

      resolve({
        status: res.statusCode,
        headers: {
          get(nume) {
            const v = res.headers[nume.toLowerCase()]
            return Array.isArray(v) ? v.join(', ') : (v ?? null)
          },
        },
        body: { cancel: async () => res.destroy() },
        text: () =>
          new Promise((gata) => {
            const bucati = []
            let total = 0
            let terminat = false
            const termina = () => {
              if (terminat) return
              terminat = true
              gata(new TextDecoder('utf-8', { fatal: false }).decode(Buffer.concat(bucati)))
            }
            flux.on('data', (bucata) => {
              bucati.push(bucata)
              total += bucata.length
              if (total >= V.maxHtmlBytes) {
                termina()
                res.destroy()
              }
            })
            flux.on('end', termina)
            flux.on('error', termina)
            res.on('close', termina)
          }),
      })
    })

    req.on('error', reject)
    req.end()
  })
}

/** Ce protecție stă în fața site-ului, după antetele răspunsului. */
function protectie(raspuns) {
  const h = raspuns.headers
  const server = (h.get('server') || '').toLowerCase()
  if (h.get('cf-ray') || h.get('cf-mitigated') || server.includes('cloudflare')) return 'Cloudflare'
  if (server.includes('ddos-guard')) return 'DDoS-Guard'
  if (h.get('x-sucuri-id') || server.includes('sucuri')) return 'Sucuri'
  if (h.get('x-iinfo') || h.get('x-cdn') === 'Incapsula') return 'Imperva'
  if (server.includes('akamai') || h.get('x-akamai-transformed')) return 'Akamai'
  if (h.get('x-qrator') || server.includes('qrator')) return 'Qrator'
  if (server.includes('variti')) return 'Variti'
  return null
}

// Statusuri care înseamnă „nu te las să intri", nu „nu exist"
const STATUSURI_BLOCAJ = [401, 403, 405, 406, 429, 503]

/** Răspunsul e un refuz de acces (anti-roboți / geo-blocare), nu un site căzut? */
function esteBlocaj(raspuns) {
  if (raspuns.headers.get('cf-mitigated')) return true
  if (STATUSURI_BLOCAJ.includes(raspuns.status)) return true
  // 4xx cu o protecție în față — tot refuz de acces, nu pagină lipsă
  return raspuns.status >= 400 && raspuns.status < 500 && raspuns.status !== 404 && raspuns.status !== 410 && Boolean(protectie(raspuns))
}

/** Pagina primită e o pagină de verificare („Just a moment…"), nu site-ul firmei? */
function estePaginaDeVerificare(html) {
  if (!html) return false
  const titlu = (/<title[^>]*>([\s\S]{0,200}?)<\/title>/i.exec(html)?.[1] || '').trim().toLowerCase()
  if (
    /^(just a moment|attention required|access denied|checking your browser|please wait|ddos-guard|один момент|доступ запрещ|verifying you are human|security check)/.test(
      titlu
    )
  ) {
    return true
  }
  return /_cf_chl_opt|\/cdn-cgi\/challenge-platform|cf-browser-verification|ddos-guard\.net\/|sucuri_cloudproxy_js|__qrator|captcha-delivery\.com/i.test(
    html.slice(0, 50000)
  )
}

/** Verdictul NECLAR, cu motivul în cuvinte. */
function neclar(motiv, urlFinal, inceput) {
  return {
    calitate: 'NECLAR',
    observatii: `${motiv} — verifică-l de mână, poate merge perfect`,
    urlFinal,
    durataMs: Date.now() - inceput,
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
async function cerere(url, semnal, caBrowser = false) {
  if (caBrowser) return cerereBrut(url, semnal)
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
async function urmeazaRedirecturi(urlStart, semnal, caBrowser = false) {
  let url = urlStart
  let redirectari = 0

  while (true) {
    const raspuns = await cerere(url, semnal, caBrowser)
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
    let eroare = null

    // Cererea principală — exact adresa listată de Google, cu tot bugetul de timp.
    try {
      rezultat = await urmeazaRedirecturi(url.toString(), controler.signal)
    } catch (err) {
      eroare = err
    }

    // A doua încercare, ca un browser complet: după o conexiune tăiată sau un
    // refuz de acces. Unele firewall-uri opresc doar cererile „simple".
    const deReincercat =
      (eroare && clasificaEroare(eroare).calitate === 'NECLAR') ||
      (rezultat && !rezultat.preaMulteRedirecturi && esteBlocaj(rezultat.raspuns))

    if (deReincercat && !controler.signal.aborted) {
      try {
        const aDoua = await urmeazaRedirecturi(url.toString(), controler.signal, true)
        if (rezultat) {
          try {
            await rezultat.raspuns.body?.cancel()
          } catch {}
        }
        rezultat = aDoua
        eroare = null
      } catch (err2) {
        if (!rezultat) eroare = err2
      }
    }

    if (eroare) {
      const c = clasificaEroare(eroare)

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

      // Conexiune tăiată / fără răspuns — nu știm sigur că e mort
      if (c.calitate === 'NECLAR') return neclar(c.motiv, url.toString(), inceput)

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

    // ── NECLAR — refuz de acces (anti-roboți / geo-blocare), nu site căzut ──
    if (esteBlocaj(raspuns)) {
      try {
        await raspuns.body?.cancel()
      } catch {}
      const cine = protectie(raspuns)
      return neclar(
        `${cine ? `protejat de ${cine}` : 'acces refuzat verificării automate'} (status ${raspuns.status})`,
        urlFinal,
        inceput
      )
    }

    // ── Regula 3: MORT — status 4xx / 5xx ────────────────────────────
    if (raspuns.status >= 400) {
      try {
        await raspuns.body?.cancel()
      } catch {}
      // 520–530 de la Cloudflare = serverul real al firmei e căzut
      const origineCazuta =
        raspuns.status >= 520 && raspuns.status <= 530 && protectie(raspuns) === 'Cloudflare'
      return {
        calitate: 'MORT',
        observatii: origineCazuta
          ? `serverul din spatele Cloudflare nu răspunde (eroare ${raspuns.status})`
          : `status ${raspuns.status}${redirectari ? ` după ${redirectari} redirect-uri` : ''}`,
        urlFinal,
        durataMs: Date.now() - inceput,
      }
    }

    // Citim HTML-ul (cu plafon de mărime) — abia acum putem măsura „răspunsul complet".
    const html = await citesteHtml(raspuns)
    const durataMs = Date.now() - inceput

    if (estePaginaDeVerificare(html)) {
      const cine = protectie(raspuns)
      return neclar(`${cine || 'site-ul'} cere o verificare „ești om?"`, urlFinal, inceput)
    }

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
    if (c.calitate === 'NECLAR') return neclar(c.motiv, url.toString(), inceput)
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
