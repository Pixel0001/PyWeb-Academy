/**
 * Operațiunile pe care le facem cu Apollo, în ordinea firească a fluxului:
 *
 *   1. CĂUTARE   — găsești oameni după titlu, țară, mărimea firmei... (GRATIS)
 *   2. ENRICH    — afli emailul real (1 credit de persoană)
 *   3. SECVENȚĂ  — îi bagi într-o secvență, Apollo trimite emailurile
 *   4. SĂNĂTATE  — urmărești mailbox-urile ca să nu-ți arzi domeniul
 *
 * Ce e important de reținut despre costuri:
 *   - căutarea NU consumă credite și întoarce date mascate (fără email);
 *   - enrich-ul consumă 1 credit pentru email, +8 pentru telefon mobil
 *     (de aceea telefonul e oprit implicit în config).
 */

import { apollo, CONFIG } from './client.js'

// ============================================================
// 1. CĂUTAREA
// ============================================================

/**
 * Caută persoane în baza Apollo. Gratuit.
 *
 * Răspunsul e MASCAT intenționat de Apollo: numele de familie apare tăiat, iar
 * emailul lipsește — primești doar `has_email: true/false`. Emailul adevărat
 * se află abia la enrich.
 *
 * @param {object} filtre  vezi `normalizeazaFiltre`
 * @param {number} pagina
 */
export async function cautaPersoane(filtre = {}, pagina = 1) {
  const corp = {
    ...normalizeazaFiltre(filtre),
    page: pagina,
    per_page: CONFIG.cautare.perPagina,
  }

  const r = await apollo('/mixed_people/api_search', { metoda: 'POST', corp })

  const persoane = (r?.people || []).map(mapeazaPersoana)
  const perPagina = CONFIG.cautare.perPagina

  // Apollo nu întoarce un obiect `pagination` la acest endpoint, ci
  // `total_entries` la rădăcină — și de multe ori vine 0 chiar dacă sunt
  // rezultate. Așa că nu ne bazăm pe el: dacă pagina e plină, presupunem că
  // mai există. Mai bine „cel puțin atâtea" decât un zero mincinos.
  const totalRaportat = Number(r?.total_entries) || 0
  const maiSuntPagini = persoane.length === perPagina

  return {
    persoane,
    paginare: {
      pagina,
      perPagina,
      total: totalRaportat,
      totalEsteExact: totalRaportat > 0,
      maiSuntPagini,
    },
  }
}

/**
 * Curăță filtrele venite din interfață: scoatem ce e gol, ca să nu trimitem
 * Apollo parametri fără valoare (răspunde cu 422).
 */
export function normalizeazaFiltre(filtre) {
  const curate = {}

  const liste = [
    'person_titles',
    'person_seniorities',
    'person_locations',
    'organization_locations',
    'q_organization_domains_list',
    'organization_num_employees_ranges',
    'organization_industry_tag_ids',
  ]

  for (const cheie of liste) {
    const valoare = filtre[cheie]
    if (Array.isArray(valoare) && valoare.length) {
      curate[cheie] = valoare.filter((v) => String(v).trim())
    }
  }

  if (filtre.q_keywords?.trim()) curate.q_keywords = filtre.q_keywords.trim()
  if (filtre.q_person_name?.trim()) curate.q_person_name = filtre.q_person_name.trim()
  if (filtre.include_similar_titles === false) curate.include_similar_titles = false

  return curate
}

/**
 * Din răspunsul Apollo păstrăm doar ce ne trebuie, cu nume în română.
 *
 * Atenție la ce NU vine de la căutare: Apollo ascunde intenționat valorile și
 * trimite doar steaguri `has_*`. Nu primim nici emailul, nici domeniul, nici
 * orașul, nici mărimea firmei — doar confirmarea că datele EXISTĂ. Toate apar
 * abia după enrich, care costă credite. De asta lista de căutare arată sărac:
 * așa o dă Apollo, nu e o scăpare de-a noastră.
 */
function mapeazaPersoana(p) {
  const org = p.organization || {}
  const areTelefon = p.has_direct_phone === true || p.has_direct_phone === 'Yes'

  return {
    apolloPersonId: p.id,
    prenume: p.first_name || null,
    // Numele de familie vine mascat („Zo***i"). Cel real apare la enrich.
    numeFamilie: p.last_name || p.last_name_obfuscated || null,
    numeMascat: !p.last_name,
    titlu: p.title || null,
    companie: org.name || null,
    actualizatLa: p.last_refreshed_at || null,

    // Ce vom obține dacă plătim enrich-ul
    areEmail: Boolean(p.has_email),
    areTelefon,
    areOras: Boolean(p.has_city),
    areTara: Boolean(p.has_country),
    areIndustrie: Boolean(org.has_industry),
    areNrAngajati: Boolean(org.has_employee_count),

    // Se completează la enrich
    email: null,
    domeniu: null,
    oras: null,
    tara: null,
    companieMarime: null,
    industrie: null,
    linkedinUrl: null,
  }
}

// ============================================================
// 2. ENRICH
// ============================================================

/**
 * Află emailurile reale. AICI se consumă creditele.
 *
 * Apollo acceptă maximum 10 persoane per apel, așa că spargem în loturi.
 * Trimitem doar persoane despre care căutarea a spus `has_email: true` —
 * altfel plătim un credit ca să aflăm că nu există email.
 *
 * @param {Array<{apolloPersonId: string, prenume, numeFamilie, domeniu}>} persoane
 * @returns {Promise<{ imbogatite: Map, crediteEstimate: number, erori: string[] }>}
 */
export async function imbogateste(persoane) {
  const imbogatite = new Map()
  const erori = []
  let crediteEstimate = 0

  const marime = Math.min(CONFIG.enrich.marimeLot || 10, 10) // Apollo: max 10
  const loturi = []
  for (let i = 0; i < persoane.length; i += marime) {
    loturi.push(persoane.slice(i, i + marime))
  }

  for (const [idx, lot] of loturi.entries()) {
    try {
      const r = await apollo('/people/bulk_match', {
        metoda: 'POST',
        corp: {
          reveal_personal_emails: CONFIG.enrich.revealEmailuriPersonale !== false,
          reveal_phone_number: CONFIG.enrich.revealTelefon === true,
          details: lot.map((p) => ({
            id: p.apolloPersonId,
            first_name: p.prenume || undefined,
            last_name: p.numeFamilie || undefined,
            domain: p.domeniu || undefined,
          })),
        },
      })

      for (const gasit of r?.matches || []) {
        if (!gasit?.id) continue

        const email = gasit.email || null
        // Apollo taxează doar dacă chiar a găsit ceva.
        if (email) crediteEstimate += CONFIG.enrich.crediteEstimatePerContact || 1

        imbogatite.set(gasit.id, {
          email,
          emailStatus: gasit.email_status || null,
          telefon: gasit.phone_numbers?.[0]?.sanitized_number || null,
          numeFamilie: gasit.last_name || null,
          titlu: gasit.title || null,
          linkedinUrl: gasit.linkedin_url || null,
          companie: gasit.organization?.name || null,
          domeniu: gasit.organization?.primary_domain || null,
        })
      }
    } catch (err) {
      erori.push(`lot ${idx + 1}: ${err.message}`)
    }
  }

  return { imbogatite, crediteEstimate, erori }
}

// ============================================================
// 3. CONTACTE ȘI SECVENȚE
// ============================================================

/**
 * Creează contactul în Apollo (sau îl găsește, dacă există deja).
 *
 * Într-o secvență nu poți băga o „persoană" din baza Apollo — îți trebuie un
 * „contact", adică o înregistrare în CRM-ul tău. Asta face funcția.
 */
export async function creeazaContact(persoana) {
  const r = await apollo('/contacts', {
    metoda: 'POST',
    corp: {
      first_name: persoana.prenume || undefined,
      last_name: persoana.numeFamilie || undefined,
      email: persoana.email,
      title: persoana.titlu || undefined,
      organization_name: persoana.companie || undefined,
      website_url: persoana.domeniu ? `https://${persoana.domeniu}` : undefined,
    },
  })

  return r?.contact?.id || null
}

/** Secvențele existente în contul Apollo. */
export async function listeazaSecvente() {
  const r = await apollo('/emailer_campaigns/search', {
    metoda: 'POST',
    corp: { per_page: 50, page: 1 },
  })

  return (r?.emailer_campaigns || []).map((s) => ({
    id: s.id,
    nume: s.name,
    activa: Boolean(s.active),
    arhivata: Boolean(s.archived),
    nrPasi: s.num_steps ?? null,
    maxEmailuriPeZi: s.max_emails_per_day ?? null,
    ultimaFolosire: s.last_used_at || null,
    creataLa: s.created_at || null,
  }))
}

/**
 * Bagă contactele într-o secvență. De aici încolo Apollo trimite emailurile.
 *
 * `mailboxIds` poate fi o listă: Apollo rotește adresele între contacte, ceea
 * ce împrăștie volumul și menține fiecare mailbox sub limita lui zilnică.
 *
 * @param {string} secventaId
 * @param {string[]} contactIds
 * @param {string[]} mailboxIds  de pe ce adrese pleacă (una sau mai multe)
 */
export async function adaugaInSecventa(secventaId, contactIds, mailboxIds) {
  if (!contactIds?.length) throw new Error('Niciun contact de adăugat')
  if (!mailboxIds?.length) throw new Error('Alege cel puțin o adresă de expediere')

  const maxim = CONFIG.secvente.maxContactePeAdaugare || 100
  if (contactIds.length > maxim) {
    throw new Error(`Prea multe contacte odată (${contactIds.length}). Maximum ${maxim}.`)
  }

  const r = await apollo(`/emailer_campaigns/${secventaId}/add_contact_ids`, {
    metoda: 'POST',
    query: {
      emailer_campaign_id: secventaId,
      contact_ids: contactIds,
      send_email_from_email_account_id: mailboxIds,
    },
  })

  return {
    adaugate: r?.contacts?.length ?? contactIds.length,
    raspuns: r,
  }
}

// ============================================================
// 4. SĂNĂTATEA MAILBOX-URILOR
// ============================================================

/**
 * Mailbox-urile conectate, cu starea lor de sănătate.
 *
 * Asta e partea de care depinde tot: dacă un mailbox începe să dea bounce-uri
 * sau ajunge în spam, campaniile trebuie oprite ÎNAINTE să-ți arzi domeniul.
 * Un domeniu ars nu se mai repară ușor — pierzi și emailurile normale.
 */
export async function listeazaMailboxuri() {
  const r = await apollo('/email_accounts')

  return (r?.email_accounts || []).map((c) => {
    const d = c.deliverability_score || {}

    const rate = {
      livrare: procent(d.avg_delivered_rate),
      deschidere: procent(d.avg_open_rate),
      raspuns: procent(d.avg_reply_rate),
      click: procent(d.avg_click_rate),
      bounce: procent(d.avg_hard_bounce_rate),
      spam: procent(d.avg_spam_block_rate),
      dezabonare: procent(d.avg_unsubscribe_rate),
    }

    const trimiseZilnicMediu = Math.round(d.avg_daily_sent || 0)
    const limitaZilnica = c.email_daily_threshold ?? null

    return {
      id: c.id,
      email: c.email,
      nume: c.user_name || null,
      furnizor: c.provider_display_name || c.type || null,
      activ: Boolean(c.active),
      implicit: Boolean(c.default),

      limitaZilnica,
      trimiseZilnicMediu,
      utilizareProcent:
        limitaZilnica ? Math.round((trimiseZilnicMediu / limitaZilnica) * 100) : null,
      pauzaIntreEmailuri: c.seconds_delay_between_emails ?? null,

      rate,
      ultimaSincronizare: c.last_synced_at || null,
      revocatLa: c.revoked_at || null,
      necesitaReautentificare: Boolean(c.needs_reauth_at),
      motivInactiv: c.inactive_reason || null,
      statusPlasareInbox: c.inbox_placement_test_health_status || null,

      ...evalueazaSanatatea({ rate, activ: c.active, necesitaReautentificare: Boolean(c.needs_reauth_at), utilizare: limitaZilnica ? (trimiseZilnicMediu / limitaZilnica) * 100 : 0 }),
    }
  })
}

function procent(valoare) {
  if (typeof valoare !== 'number') return null
  // Apollo întoarce fracții (0.42), noi vrem procente (42)
  return Math.round(valoare * 1000) / 10
}

/**
 * Verdictul asupra unui mailbox, cu motivele scrise în cuvinte.
 *
 * Pragurile stau în config/apollo.json → `sanatateEmail`.
 */
export function evalueazaSanatatea({ rate, activ, necesitaReautentificare, utilizare }) {
  const praguri = CONFIG.sanatateEmail
  const probleme = []
  const atentionari = []

  if (!activ) probleme.push('mailbox-ul e dezactivat în Apollo')
  if (necesitaReautentificare) probleme.push('trebuie reconectat (autentificare expirată)')

  if (rate.bounce != null && rate.bounce > praguri.bounceMaxProcent) {
    probleme.push(`bounce ${rate.bounce}% (peste ${praguri.bounceMaxProcent}%)`)
  }
  if (rate.spam != null && rate.spam > praguri.spamMaxProcent) {
    probleme.push(`marcat ca spam ${rate.spam}% (peste ${praguri.spamMaxProcent}%)`)
  }
  if (rate.livrare != null && rate.livrare > 0 && rate.livrare < praguri.livrareMinProcent) {
    probleme.push(`livrare doar ${rate.livrare}% (sub ${praguri.livrareMinProcent}%)`)
  }
  if (utilizare > praguri.avertismentUtilizareZilnicaProcent) {
    atentionari.push(`aproape de limita zilnică (${Math.round(utilizare)}%)`)
  }

  const stare = probleme.length ? 'periculos' : atentionari.length ? 'atentie' : 'bun'

  return {
    stare,
    probleme,
    atentionari,
    poateTrimite: probleme.length === 0,
  }
}

// ============================================================
// 5. STATISTICI ȘI RĂSPUNSURI
// ============================================================

/**
 * Tot ce s-a întâmplat cu o secvență: câte au ajuns, câte s-au deschis,
 * câte răspunsuri, câte au dat bounce — plus pașii de follow-up.
 *
 * Apollo își pune singur o siguranță: dacă rata de bounce trece de un prag,
 * oprește automat secvența (`auto_pause_config`). Citim și pragurile alea, ca
 * să te avertizăm ÎNAINTE să te oprească Apollo.
 */
export async function statisticiSecventa(secventaId) {
  const r = await apollo(`/emailer_campaigns/${secventaId}`)
  const s = r?.emailer_campaign || {}
  const praguriApollo = s.auto_pause_config || {}

  const stat = {
    id: s.id,
    nume: s.name,
    activa: Boolean(s.active),
    opritaAutomatLa: s.auto_paused_at || null,
    nivelAvertismentApollo: s.auto_pause_warning_level || null,

    // Cifre absolute — „câte răspunsuri am primit"
    livrate: s.unique_delivered ?? 0,
    deschise: s.unique_opened ?? 0,
    raspunsuri: s.unique_replied ?? 0,
    clicuri: s.unique_clicked ?? 0,
    bounce: s.unique_bounced ?? 0,
    bounceDur: s.unique_hard_bounced ?? 0,
    spam: s.unique_spam_blocked ?? 0,
    dezabonari: s.unique_unsubscribed ?? 0,

    // Procente
    rate: {
      deschidere: procent(s.open_rate),
      raspuns: procent(s.reply_rate),
      click: procent(s.click_rate),
      bounce: procent(s.bounce_rate),
      bounceDur: procent(s.hard_bounce_rate),
      spam: procent(s.spam_block_rate),
      dezabonare: procent(s.opt_out_rate),
    },

    // Unde stau contactele acum
    stariContacte: s.contact_statuses || {},

    // Pragurile la care Apollo oprește singur secvența
    autoPause: {
      activ: Boolean(s.auto_pause_enabled),
      pragAvertisment: praguriApollo.warning_threshold_pct ?? null,
      pragOprire: praguriApollo.auto_pause_threshold_pct ?? null,
      fereastraZile: praguriApollo.evaluation_window_days ?? null,
      volumMinim: praguriApollo.min_volume ?? null,
    },

    // Pașii = follow-up-ul
    pasi: (r?.emailer_steps || []).map((p) => ({
      id: p.id,
      pozitie: p.position,
      tip: p.type, // auto_email | manual_email | call | task...
      asteapta: p.wait_time,
      unitate: p.wait_mode, // minute | hour | day
      maxPeZi: p.max_emails_per_day ?? null,
    })),
  }

  stat.avertismente = evalueazaSecventa(stat)
  return stat
}

/**
 * Verdictul asupra unei secvențe, comparat cu propriile praguri ale Apollo.
 *
 * Dacă Apollo oprește la 6% bounce, nu are rost să te anunțăm noi la 10%.
 */
export function evalueazaSecventa(stat) {
  const avertismente = []
  const bounce = stat.rate.bounce

  if (stat.opritaAutomatLa) {
    avertismente.push({
      nivel: 'periculos',
      text: 'Apollo a oprit automat secvența — rata de bounce a depășit pragul.',
    })
  }

  if (bounce != null && stat.autoPause.pragOprire != null) {
    if (bounce >= stat.autoPause.pragOprire) {
      avertismente.push({
        nivel: 'periculos',
        text: `Bounce ${bounce}% — la sau peste pragul de oprire automată al Apollo (${stat.autoPause.pragOprire}%).`,
      })
    } else if (bounce >= stat.autoPause.pragAvertisment) {
      avertismente.push({
        nivel: 'atentie',
        text: `Bounce ${bounce}% — peste pragul de avertisment (${stat.autoPause.pragAvertisment}%). Apollo oprește secvența la ${stat.autoPause.pragOprire}%.`,
      })
    }
  }

  const praguriNoastre = CONFIG.sanatateEmail
  if (stat.rate.spam != null && stat.rate.spam > praguriNoastre.spamMaxProcent) {
    avertismente.push({
      nivel: 'atentie',
      text: `${stat.rate.spam}% dintre emailuri sunt blocate ca spam (prag ${praguriNoastre.spamMaxProcent}%).`,
    })
  }

  if (stat.livrate >= 50 && stat.rate.raspuns === 0) {
    avertismente.push({
      nivel: 'atentie',
      text: `${stat.livrate} emailuri livrate și niciun răspuns — merită schimbat textul.`,
    })
  }

  return avertismente
}

/**
 * Mesajele unei secvențe — de aici se văd răspunsurile primite.
 *
 * @param {string} secventaId
 * @param {object} optiuni
 * @param {boolean} [optiuni.doarRaspunsuri]  doar cele la care a răspuns cineva
 */
export async function mesajeSecventa(secventaId, { doarRaspunsuri = false, pagina = 1 } = {}) {
  const r = await apollo('/emailer_messages/search', {
    metoda: 'POST',
    corp: {
      emailer_campaign_ids: [secventaId],
      per_page: 50,
      page: pagina,
    },
  })

  const mesaje = (r?.emailer_messages || []).map((m) => ({
    id: m.id,
    catre: m.to_name || null,
    subiect: m.subject || null,
    status: m.status, // completed | scheduled | failed...
    trimisLa: m.completed_at || null,
    programatLa: m.due_at || null,

    aRaspuns: Boolean(m.replied),
    clasaRaspuns: m.reply_class || null, // interested | not_interested | ooo...
    bounce: Boolean(m.bounce),
    spam: Boolean(m.spam_blocked),
    motivEsec: m.failure_reason || m.not_sent_reason || null,

    contactId: m.contact_id || null,
    mailboxId: m.email_account_id || null,
    pasId: m.emailer_step_id || null,
  }))

  return {
    mesaje: doarRaspunsuri ? mesaje.filter((m) => m.aRaspuns) : mesaje,
    maiSuntPagini: mesaje.length === 50,
  }
}

/** Contactele dintr-o secvență, cu starea lor. */
export async function contacteSecventa(secventaId, pagina = 1) {
  const r = await apollo('/contacts/search', {
    metoda: 'POST',
    corp: { emailer_campaign_ids: [secventaId], per_page: 50, page: pagina },
  })

  return {
    contacte: (r?.contacts || []).map((c) => ({
      id: c.id,
      nume: c.name || `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      email: c.email || null,
      titlu: c.title || null,
      companie: c.organization_name || null,
      linkedinUrl: c.linkedin_url || null,
    })),
    total: r?.pagination?.total_entries ?? 0,
  }
}

// ============================================================
// 6. CREAREA SECVENȚELOR (editorul din PyWeb)
// ============================================================

/**
 * Programele de trimitere din Apollo — ferestrele orare în care pleacă
 * emailurile. O secvență nouă trebuie legată de unul dintre ele.
 */
export async function listeazaProgramari() {
  const r = await apollo('/emailer_schedules')

  return (r?.emailer_schedules || []).map((p) => ({
    id: p.id,
    nume: p.name || '(fără nume)',
    implicit: Boolean(p.default),
    fusOrar: p.time_zone || null,
    dupaFusulContactului: Boolean(p.use_contacts_time_zone),
    sareSarbatorile: Boolean(p.skip_holidays),
  }))
}

/**
 * Creează o secvență întreagă dintr-un singur apel: pașii și textele
 * emailurilor se trimit imbricate, Apollo nu are endpointuri separate.
 *
 * Reguli de care depinde funcționarea:
 *  - primul pas e mereu `new_thread`, restul `reply_to_thread` — așa ajung
 *    follow-up-urile în același fir de discuție, nu ca emailuri răzlețe;
 *  - un email pleacă doar dacă are `status: approved` ȘI corp nevid;
 *  - `wait_time` la primul pas e 0 (pleacă imediat ce adaugi contactul).
 *
 * @param {object} p
 * @param {string} p.nume
 * @param {string} p.programareId   fereastra orară de trimitere
 * @param {boolean} [p.activa]      implicit false — o pornești după ce verifici textele
 * @param {Array<{subiect, corp, asteapta, unitate}>} p.pasi
 */
export async function creeazaSecventa({ nume, programareId, activa = false, pasi }) {
  if (!nume?.trim()) throw new Error('Secvența are nevoie de un nume')
  if (!programareId) throw new Error('Alege programul de trimitere')
  if (!pasi?.length) throw new Error('Secvența are nevoie de cel puțin un email')

  for (const [i, pas] of pasi.entries()) {
    if (!pas.subiect?.trim()) throw new Error(`Pasul ${i + 1} nu are subiect`)
    if (!pas.corp?.trim()) throw new Error(`Pasul ${i + 1} nu are text — Apollo refuză emailurile goale`)
  }

  const corp = {
    name: nume.trim(),
    active: Boolean(activa),
    emailer_schedule_id: programareId,
    emailer_steps: pasi.map((pas, i) => ({
      type: 'auto_email',
      // Primul pleacă imediat; restul așteaptă cât ai spus tu.
      wait_time: i === 0 ? 0 : Number(pas.asteapta) || 1,
      wait_mode: i === 0 ? 'minute' : pas.unitate || 'day',
      emailer_touches: [
        {
          // Follow-up-urile continuă firul, ca destinatarul să vadă contextul.
          type: i === 0 ? 'new_thread' : 'reply_to_thread',
          status: 'approved',
          emailer_template: {
            subject: pas.subiect.trim(),
            body_html: textInHtml(pas.corp),
          },
        },
      ],
    })),
  }

  const r = await apollo('/sequences', { metoda: 'POST', corp })
  const creata = r?.emailer_campaign || r

  return {
    id: creata?.id || null,
    nume: creata?.name || nume,
    activa: Boolean(creata?.active),
    raspuns: r,
  }
}

/**
 * Textul scris în casetă devine HTML.
 *
 * Oamenii scriu cu Enter, nu cu <p>. Transformăm rândurile în paragrafe și
 * scăpăm caracterele speciale, ca un `<` din text să nu strice emailul.
 * Variabilele Apollo de tipul {{first_name}} rămân neatinse.
 */
export function textInHtml(text) {
  const scapat = String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  return scapat
    .split(/\n{2,}/)
    .map((paragraf) => `<p>${paragraf.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

/** Variabilele pe care Apollo le înlocuiește la trimitere. */
export const VARIABILE = [
  { cod: '{{first_name}}', descriere: 'prenumele destinatarului' },
  { cod: '{{last_name}}', descriere: 'numele de familie' },
  { cod: '{{title}}', descriere: 'funcția lui' },
  { cod: '{{company}}', descriere: 'numele firmei' },
  { cod: '{{sender_first_name}}', descriere: 'prenumele tău' },
  { cod: '{{sender_company}}', descriere: 'firma ta' },
]

/**
 * Arhivează o secvență. Apollo nu are ștergere prin API — arhivarea o scoate
 * din listă fără să piardă statisticile.
 */
export async function arhiveazaSecventa(secventaId, arhivata = true) {
  const r = await apollo(`/emailer_campaigns/${secventaId}`, {
    metoda: 'PUT',
    corp: { archived: Boolean(arhivata) },
  })
  return { id: r?.emailer_campaign?.id, arhivata: Boolean(r?.emailer_campaign?.archived) }
}

/** Pornește sau oprește o secvență. */
export async function comutaSecventa(secventaId, activa) {
  const r = await apollo(`/emailer_campaigns/${secventaId}`, {
    metoda: 'PUT',
    corp: { active: Boolean(activa) },
  })
  return { id: r?.emailer_campaign?.id, activa: Boolean(r?.emailer_campaign?.active) }
}
