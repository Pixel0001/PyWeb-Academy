# Leaduri Web — instrument de prospectare

Caută firme din Republica Moldova pe Google Maps, verifică dacă au site și cât
de prost e, le dă un scor de la 0 la 100 și scoate un Excel din care suni.

Se găsește în panoul de admin la **`/admin/leads`** (în meniu: 🎯 Leaduri Web).

---

## 0. Instalare (o singură dată)

```bash
npm install          # aduce exceljs (singura dependință nouă)
npm run db:push      # creează colecțiile și indexul unic pe PLACE_ID
```

> `db:push` e **obligatoriu**. Fără el, indexul unic pe `placeId` nu există și
> aceeași firmă s-ar putea salva de mai multe ori.

---

## 1. Ce trebuie să pui în variabilele de mediu

| Variabilă | Obligatorie | La ce e |
|---|---|---|
| `GOOGLE_API_KEY` | **DA** | Căutarea firmelor (Google Places API New) |
| `OPENAI_API_KEY` | recomandat | Pitch-urile. **Aceeași cheie folosită deja de Mr. PyWeb** — nu trebuie una nouă |

Fără `OPENAI_API_KEY`, pitch-urile se generează din șabloane locale — gratis și
corecte, dar mai seci.

Verifică ce vede instrumentul:

```bash
npm run leaduri:modele
```

Îți spune dacă cheia e găsită, ce modele are contul tău și pe care îl va folosi.

---

## 2. Cum îți iei cheia de Google

1. Intră pe <https://console.cloud.google.com/> cu contul tău Google.
2. Sus de tot, **Select a project → New Project**. Nume: `pyweb-leaduri`. **Create**.
3. Meniu → **APIs & Services → Library**. Caută **Places API (New)** și apasă **Enable**.
   > Atenție: îți trebuie **Places API (New)**, nu vechiul „Places API".
4. Meniu → **APIs & Services → Credentials → Create credentials → API key**.
5. Copiază cheia. Apasă **Edit API key** și restricționeaz-o:
   - **API restrictions** → *Restrict key* → bifează doar **Places API (New)**.
   - **Application restrictions** → lasă *None* (cheia se folosește de pe server, nu din browser).
6. Pentru facturare îți trebuie un card: **Billing → Link a billing account**.
   Google dă credit gratuit lunar; cu limita de mai jos nu ajungi să plătești.

Pune cheia în `.env.local` (local) și în **Vercel → Settings → Environment Variables** (producție):

```
GOOGLE_API_KEY=AIza...
```

---

## 3. Cum îți pui limita de buget (fă asta, nu o sări)

Instrumentul are deja **două plase de siguranță**, dar pune-o și pe a treia, la Google:

**Plasa 1 — în cod.** `config/leads.json → buget.maxApeluriPeRulare` (implicit **900**).
Rularea se oprește singură când atinge pragul și te avertizează.

**Plasa 2 — în interfață.** Înainte de pornire vezi estimarea în apeluri și dolari,
iar dacă selecția depășește plafonul, butonul e blocat.

**Plasa 3 — la Google (cea care chiar oprește plata).**
1. Google Cloud Console → **Billing → Budgets & alerts → Create budget**.
2. Sumă: de exemplu **10 $/lună**. Alerte la 50 %, 90 %, 100 %.
3. În plus, **APIs & Services → Places API (New) → Quotas** — pune o cotă zilnică
   (ex. 100 cereri/zi). Cota chiar blochează cererile, alerta doar te anunță.

### Cât costă, de fapt

Text Search se facturează **per apel** (~0,035 $), nu per rezultat, iar un apel
îți aduce până la **20 de firme complete**.

| Ce rulezi | Interogări | Apeluri (max) | Cost (max) |
|---|---|---|---|
| 1 categorie × 1 oraș | 1 | 3 | ~0,11 $ |
| 37 categorii × 5 orașe (implicit) | 185 | 555 | ~19,43 $ |
| 37 categorii × 15 orașe | 555 | 1665 | **peste plafon — blocat** |

> Instrumentul **nu apelează niciodată Place Details**. Toate câmpurile (telefon,
> site, rating, recenzii) vin direct din Text Search, prin FieldMask. Un apel de
> Place Details per firmă ar înmulți costul cu 20.

---

## 4. Cum îl rulezi

### Din panoul de admin (normal)

1. Intră pe **`/admin/leads`**.
2. Apasă **Caută firme noi**.
3. Bifează orașele și categoriile. Uită-te la estimarea de cost.
4. **Pornește rularea.**

Rularea trece prin trei faze, cu bară de progres și jurnal live:

| Fază | Ce face |
|---|---|
| `SEARCH` | Caută firmele pe Google (produsul categorii × orașe) |
| `CHECK` | Verifică site-urile — 10 simultan, timeout 10s |
| `PITCH` | Scrie frazele de deschidere, în loturi de 20 |

Rularea e împărțită în pași mici, ceruți de browser unul câte unul. Dacă închizi
fila sau pică netul, rularea rămâne salvată exact unde a ajuns — o reiei intrând
din nou pe pagină.

### Din linia de comandă (test rapid)

```bash
node scripts/leaduri-test.mjs                     # restaurant în Chișinău
node scripts/leaduri-test.mjs "cafenea" "Bălți"   # altă combinație
```

Scrie `exports/leaduri.xlsx` și `exports/leaduri.csv` și îți arată primele 5 rânduri.
Fără `GOOGLE_API_KEY` rulează pe un set de test marcat `[TEST]` — restul lanțului
(verificare site, scor, pitch, fișiere) funcționează real.

---

## 5. Scorul (0–100)

```
scor = puncte_site + puncte_rating + puncte_recenzii
```

| CALITATE_SITE | Puncte | Ce înseamnă |
|---|---|---|
| `LIPSA` | 50 | Nu are deloc site |
| `MORT` | 45 | DNS invalid, timeout peste 10s, sau status 4xx/5xx |
| `DOAR_SOCIAL` | 40 | Doar Facebook / Instagram / ok.ru / vk.com / linktr.ee |
| `FARA_HTTPS` | 25 | Merge doar pe http://, sau certificat invalid/expirat |
| `NEADAPTAT_MOBIL` | 20 | Lipsește `<meta name="viewport">` |
| `LENT` | 15 | Se încarcă în peste 3 secunde |
| `OK` | 0 | Nimic din cele de mai sus |

**Rating:** ≥4,5 → 30 | 4,0–4,49 → 20 | 3,5–3,99 → 10 | sub 3,5 sau lipsă → 0
**Recenzii:** ≥100 → 20 | 30–99 → 15 | 10–29 → 8 | sub 10 → 0

Regulile de site se aplică **în ordinea de mai sus** — prima care se potrivește câștigă.

Clientul ideal iese sus: rating mare + multe recenzii + site prost. Are și bani,
și motiv să te asculte.

---

## 5b. Cum e făcut pitch-ul (partea de AI)

Fraza asta o citești unui om real la telefon, deci partea de AI e construită în
jurul unei singure idei: **mai bine o frază banală și corectă decât una elegantă
și mincinoasă.** Un model ieftin inventează cifre din când în când, așa că nu am
încredere în el — îl verific.

### Lanțul

```
lead-uri → loturi de 20, câte 3 în paralel
         → GENERARE   (OpenAI — model ales automat)
         → VALIDARE   (cifre reale, ton, lungime, duplicate)
         → REPARARE   (o rundă, i se spune exact ce a greșit)
         → VALIDARE   din nou
         → ȘABLON     pentru ce tot n-a trecut
```

Fiecare lead iese cu o frază. Garantat.

### Ce respinge validatorul

| Regulă | Exemplu respins |
|---|---|
| **Cifre inventate** | firma are 4,2 stele, modelul scrie „4,9 stele" |
| **Rotunjiri** | „peste 40 de recenzii" când sunt 41 — tot inventare |
| Peste 25 de cuvinte | frază lungă, imposibil de citit natural |
| Ton de agent | „stimate domn", „cel mai bun", semne de exclamare, emoji |
| Promisiuni | prețuri, „gratuit", „reducere", „garantez" |
| Fără detaliu verificabil | nu menționează nici rating, nici recenzii, nici orașul |
| Duplicat în lot | aceeași frază la două firme — sună a robot |

Cifrele permise sunt exact: ratingul (`4,2` sau `4.2`), numărul de recenzii, și
cifrele din `OBSERVATII_SITE` (`status 502`, `expirat în 2023`). Orice altceva
înseamnă că modelul a inventat.

### Ce vezi în jurnal

```
💬 40 pitch-uri (openai): 37 bune din prima, 2 după reparare, 1 din șablon.
   ↳ „Pizzeria X" respins: cifre care nu există în datele firmei: 4,9
```

Dacă vezi multe respingeri, modelul o ia razna — spune-mi și strâng promptul.

### Ce model folosește

Modelul **nu e scris în cod**. La prima rulare instrumentul întreabă
`/v1/models` ce are cheia ta și ia primul disponibil din `pitch.modelePreferate`
(config/leads.json), implicit:

```
gpt-5  →  gpt-4.1  →  gpt-4o        (rezervă: gpt-4o-mini)
```

Așa nu crapă rularea pentru că am scris în cod numele unui model la care nu ai
acces. Vrei alt model? Pune-l primul în listă. Vezi ce ai disponibil cu
`npm run leaduri:modele`.

Stratul se adaptează singur și la modelele pretențioase: dacă unul refuză
`max_tokens` sau `temperature`, cererea se reface în forma acceptată și
adaptarea se ține minte.

**Costul** se calculează din `pitch.preturi`. Dacă modelul ales nu e în tabel,
costul se raportează ca *necunoscut* — prefer să nu-ți dau o cifră inventată.
Adaugă prețul acolo și devine exact.

### Testarea, fără nicio cheie

```bash
npm run leaduri:test-pitch    # 32 verificări: validator + parsare răspuns
npm run leaduri:test-openai   # 15 verificări: alegere model, adaptare, cost
npm run leaduri:modele        # verifică cheia reală și listează modelele
```

Primele două rulează cu `fetch` simulat — fără rețea, fără cost, fără cheie.
Rulează-le dacă modifici `lib/leads/pitch-validare.js` sau `pitch-openai.js`.

---

## 6. Fișierul de ieșire

Butoanele **Excel** și **CSV** exportă exact ce e filtrat pe ecran.

18 coloane: `SCOR`, `DENUMIRE`, `TELEFON`, `ARE_SITE`, `CALITATE_SITE`, `SITE_URL`,
`OBSERVATII_SITE`, `RATING`, `NR_RECENZII`, `CATEGORIE`, `ORAS`, `ADRESA`,
`LINK_MAPS`, `PITCH`, `STATUS`, `DATA_APEL`, `NOTITE`, `PLACE_ID`.

- **Excel**: antet îngroșat și înghețat, filtre automate pe toate coloanele,
  SCOR colorat (verde >70, galben 40–70, gri <40), lățimi potrivite.
- **CSV**: UTF-8 **cu BOM**, separator `;`, zecimale cu virgulă — se deschide
  corect în Excel pe setări românești.

`STATUS`, `DATA_APEL` și `NOTITE` sunt coloanele tale — le completezi în timpul
apelurilor, direct în pagină (se salvează automat) sau în CRM.
Valori pentru STATUS: `DE_SUNAT`, `SUNAT`, `INTERESAT`, `REFUZ`, `NU_MA_SUNA`.

---

## 7. Ce poți schimba fără să umbli în cod

Tot în **`config/leads.json`**:

| Secțiune | Ce reglezi |
|---|---|
| `orase` / `oraseInactive` | Orașele active. Mută din a doua listă în prima ca să activezi |
| `categorii` | Cele 37 de categorii căutate |
| `buget` | Plafonul de apeluri, costul per apel, pragul de avertizare |
| `cache` | Câte zile ține cache-ul (implicit 30) |
| `verificareSite` | Timeout, concurență, pragul „lent", domeniile sociale |
| `scor` | Toate pragurile de punctaj |
| `pitch` | Modelul, mărimea lotului, numărul maxim de cuvinte |
| `filtre` | Regula de contact (vezi mai jos) / firmele închise definitiv |
| `pasi` | Cât lucru face un pas (dacă dai de timeout, micșorează) |

Orașele și categoriile se pot bifa și direct în interfață, la fiecare rulare —
lista din JSON e doar punctul de plecare.

### Ce firme se salvează (`filtre.doarCuContact`)

Se salvează firma doar dacă am **pe ce s-o contactez**:

| Situație | Se salvează? | Cum o contactez |
|---|---|---|
| Are telefon | **DA** | O sun |
| N-are telefon, dar are Facebook / Instagram / OK / VK / Linktree | **DA** | Îi scriu pe rețea |
| N-are nici telefon, nici social | **NU** | N-am cum ajunge la ea |
| Închisă definitiv (`CLOSED_PERMANENTLY`) | **NU** | Nu mai e client |

Rețelele recunoscute sunt cele din `verificareSite.domeniiSociale` — aceeași
listă folosită și pentru verdictul `DOAR_SOCIAL`.

În tabel, firmele fără telefon arată butonul albastru **„Scrie pe Facebook"**
(sau rețeaua respectivă) în loc de butonul verde de telefon. În Excel, coloana
`TELEFON` rămâne goală, iar linkul e în `SITE_URL`, cu `CALITATE_SITE = DOAR_SOCIAL`.

Pune `doarCuContact: false` dacă vrei să salvezi absolut tot ce găsește Google.

---

## 8. Cum nu plătești de două ori

- **Cache pe interogare.** O combinație „categorie + oraș" rulată în ultimele 30
  de zile e **sărită complet** (0 apeluri, 0 $). Le vezi în jurnal cu `⏭`.
- **Deduplicare pe `PLACE_ID`.** Aceeași firmă apărută la mai multe categorii se
  salvează o singură dată, dar reține toate categoriile sub care a apărut.
- **Site-urile nu se reverifică** dacă au fost verificate în ultimele 30 de zile
  și adresa nu s-a schimbat.
- **`STATUS`, `DATA_APEL` și `NOTITE` se păstrează** între rulări — munca ta de la
  telefon nu se pierde când mai rulezi o dată.

Ca să forțezi reverificarea, micșorează `cache.zileValabilitateInterogare`.

---

## 9. Permisiuni

SUPERADMIN le are automat. Pentru un ADMIN, dă-i din **Securitate → Permisiuni**:

- `leads.view` — vede tabelul și exportă
- `leads.manage` — pornește rulări (consumă buget) și editează status/notițe

---

## 10. Dacă ceva nu merge

| Simptom | Cauza | Ce faci |
|---|---|---|
| „Lipsește GOOGLE_API_KEY" | Variabila nu e setată | Pune-o în `.env.local` / Vercel și repornește |
| `Places 403` în jurnal | Places API (New) nu e activat, sau cheia e restricționată greșit | Vezi pasul 2.3 și 2.5 |
| `Places 429` | Ai depășit cota | Așteaptă, sau ridică cota din Quotas |
| Rularea pare blocată | Un pas e încă în lucru (lock de 3 minute) | Așteaptă; jurnalul arată unde s-a oprit |
| Toate site-urile ies `MORT` | Serverul nu are ieșire la internet | Verifică rețeaua |
| Diacritice stricate în Excel | Ai deschis CSV-ul prin import greșit | Folosește `.xlsx`, sau importă CSV-ul ca UTF-8 |
| Pitch-uri cam la fel | Nu există cheie OpenAI, merg șabloanele | Rulează `npm run leaduri:modele` |
| `OpenAI 401` în jurnal | Cheie invalidă sau revocată | Verific-o pe platform.openai.com |
| Cost raportat „necunoscut" | Modelul ales nu are preț în config | Adaugă-l în `pitch.preturi` |

Fiecare interogare e logată. Jurnalul rulării se vede în timp real în pagină și
rămâne salvat în baza de date (`lead_runs.loguri`).

---

## 11. Ce NU face instrumentul

- **Nu apelează Place Details** — ar înmulți costul cu 20.
- **Nu face scraping** pe Google Maps cu browser automatizat. Doar API-ul oficial.
- **Nu caută adrese de e-mail.** Contactul e la telefon.
- **Nu trimite nimic nimănui.** Doar generează fișierul; suni tu.
