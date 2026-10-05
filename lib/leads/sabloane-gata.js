/**
 * Biblioteca de șabloane gata scrise — se adaugă în listă dintr-un clic,
 * din pagina „Șabloane mesaje".
 *
 * Cum sunt scrise, ca să primească răspuns și să nu pară trimise de un robot:
 *
 *  - încap pe un ecran de telefon; primul mesaj nu vinde, începe o discuție;
 *  - pornesc de la ceva ADEVĂRAT despre firmă (Google Maps, recenzii, site);
 *  - o singură întrebare, la care se răspunde cu „da" sau „nu";
 *  - fără link-uri în primul mesaj, fără liniuțe lungi, fără „sper că
 *    sunteți bine", fără „soluții inovatoare" și alte fraze de agenție;
 *  - 2-3 beneficii pe mesaj, alese pentru domeniul firmei — nu toată lista;
 *  - lauda din recenzii apare doar dacă e meritată ([[ ]]), iar micile
 *    variante (( | )) fac ca mesajele din aceeași zi să nu fie identice.
 *
 * `cheie` nu se schimbă niciodată — după ea știm ce ai adăugat deja.
 * `categorie` = grupa de categorii din config/leads.json, sau „Orice firmă".
 * `cuvinte` = după ele șablonul urcă primul la firmele din nișa lui.
 */

const t = (...linii) => linii.join('\n')

const FARA_SITE = ['LIPSA', 'DOAR_SOCIAL']

// Bucăți folosite des — aceeași formulare peste tot ar suna a șablon
const SUNT = '((Sunt|Mă numesc)) {{numele_meu}}'
const LAUDA = '((felicitări|frumos))'

export const SABLOANE_GATA = [
  // ============================================================
  // PRIMUL MESAJ · ORICE FIRMĂ
  // ============================================================
  {
    cheie: 'ro-general-fara-site',
    nume: 'Fără site · scurt și direct',
    nota: 'Cel mai sigur pentru început, merge la orice domeniu.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: FARA_SITE,
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      `Am dat de {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți site. Cine vă caută pe Google vede doar adresa și telefonul, iar mulți aleg firma unde pot vedea mai multe: servicii, prețuri, poze.`,
      '',
      'V-ar interesa să vă arăt cum ar putea arăta site-ul vostru?'
    ),
  },
  {
    cheie: 'ro-general-buton-site',
    nume: 'Fără site · butonul „Site" lipsește din Google Maps',
    nota: 'Observație concretă, pe care omul o poate verifica singur.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['LIPSA'],
    text: t(
      '{{salut}}! Am observat ceva la {{firma}} pe Google Maps: la voi lipsește butonul "Site". Cine vă găsește acolo nu are unde să vadă mai multe despre voi și de multe ori merge la următorul din listă, care îl are.',
      '',
      `${SUNT}, fac site-uri pentru afaceri. ((Vreți să vă arăt|V-ar interesa să vă arăt)) cum ar arăta unul pentru voi?`
    ),
  },
  {
    cheie: 'ro-general-doar-social',
    nume: 'Doar Instagram / Facebook',
    nota: 'Pentru firmele care au doar pagină pe rețele.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['DOAR_SOCIAL'],
    text: t(
      '{{salut}}, ((mă numesc|sunt)) {{numele_meu}}.',
      '',
      'Am văzut că {{firma}} are pagină pe rețelele sociale, dar nu și un site. Pe Instagram și Facebook vă găsesc mai ales cei care vă urmăresc deja. Pe Google vă găsesc și cei care încă nu vă știu.',
      '',
      'Fac site-uri pentru afaceri și cred că la voi ar merge bine unul simplu, legat de pagina pe care o aveți. ((Pot să vă trimit un exemplu?|Vă trimit un exemplu?))'
    ),
  },
  {
    cheie: 'ro-general-intrebare',
    nume: 'Fără site · începe cu o întrebare',
    nota: 'Începe cu o întrebare despre clienții lor — primește des răspuns.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: FARA_SITE,
    text: t(
      '{{salut}}! O întrebare scurtă: clienții noi vă găsesc mai mult din recomandări sau de pe Google?',
      '',
      'Întreb pentru că am văzut {{firma}} pe Google Maps[[ cu {{nota_google}}]], dar fără site, și cred că pierdeți o parte din cei care caută online[[ în {{oras}}]].',
      '',
      `${SUNT}, fac site-uri pentru afaceri. Dacă vă interesează, vă arăt ce s-ar putea face.`
    ),
  },
  {
    cheie: 'ro-general-schita',
    nume: 'Fără site · cu schiță gratuită',
    nota: 'Atenție: promiți o schiță gratuită. Cele mai multe răspunsuri, dar îți ia timp.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: FARA_SITE,
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri[[ din {{oras}}]].`,
      '',
      'Am văzut că {{firma}} nu are încă site și ((mi-a venit o idee|m-am gândit la ceva)): vă pot face gratuit o schiță a paginii principale, cu numele vostru, ce oferiți și butoane de apel și WhatsApp. O vedeți și abia apoi decideți dacă vă trebuie.',
      '',
      'Vă trimit schița aici?'
    ),
  },
  {
    cheie: 'ro-general-site-mort',
    nume: 'Site-ul nu se deschide · anunț util',
    nota: 'Le faci un serviciu: mulți nu știu că site-ul lor e căzut.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['MORT'],
    text: t(
      '{{salut}}! Am intrat pe site-ul {{firma}} din Google Maps și nu se deschide. ((M-am gândit să vă anunț|Am zis să vă scriu)), poate nu știți: oamenii apasă pe link, dau de eroare și sună la altcineva.',
      '',
      `${SUNT}, fac și repar site-uri. Vreți să mă uit ce s-a întâmplat? Uneori e o problemă mică.`
    ),
  },
  {
    cheie: 'ro-general-nesigur',
    nume: 'Site nesigur (fără HTTPS)',
    nota: 'Pentru site-urile marcate „Nesigur" în browser.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['FARA_HTTPS'],
    text: t(
      '{{salut}}! Am deschis site-ul {{firma}} și browserul îl marchează ca nesigur. Mulți închid pagina când văd asta, mai ales de pe telefon.',
      '',
      `${SUNT}, lucrez cu site-uri. De obicei se rezolvă repede, cu un certificat de securitate. Vreți să vă spun exact ce trebuie făcut?`
    ),
  },
  {
    cheie: 'ro-general-nemobil',
    nume: 'Site care nu merge bine pe telefon',
    nota: 'Pentru site-urile fără nicio adaptare pentru telefon.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['NEADAPTAT_MOBIL'],
    text: t(
      '{{salut}}! M-am uitat pe site-ul {{firma}} de pe telefon și se deschide micșorat, ca pe calculator: trebuie mărit ca să poți citi. Majoritatea clienților intră de pe telefon, așa că acolo se pierd primii.',
      '',
      `${SUNT}, fac site-uri care arată bine pe orice ecran. Vă trimit o captură să vedeți cum apare?`
    ),
  },
  {
    cheie: 'ro-general-lent',
    nume: 'Site lent',
    nota: 'Pentru site-urile care se încarcă greu.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['LENT'],
    text: t(
      '{{salut}}! Am intrat pe site-ul {{firma}} și s-a încărcat destul de greu. Pe telefon, cu internet mobil, oamenii de obicei nu așteaptă și închid pagina.',
      '',
      `${SUNT}, fac site-uri rapide. Dacă vreți, vă spun gratuit ce anume îl încetinește. Vă interesează?`
    ),
  },
  {
    cheie: 'ro-general-site-ok',
    nume: 'Are site · idei ca să aducă mai multe comenzi',
    nota: 'Pentru firmele cu site care merge — oferi idei, nu critici.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    situatii: ['OK', 'NECLAR'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      `M-am uitat pe site-ul {{firma}}[[ după ce am văzut recenziile de pe Google ({{nota_google}}, ${LAUDA})]]. Merge, dar cred că ar putea aduce mai multe comenzi: un formular rapid, prețuri la vedere și butoane de apel și WhatsApp care se văd bine pe telefon.`,
      '',
      'V-ar interesa câteva idei concrete pentru el? Vi le scriu aici, gratuit.'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · MAGAZINE
  // ============================================================
  {
    cheie: 'ro-magazin-haine',
    nume: 'Magazin de haine / încălțăminte',
    nota: 'Catalog cu mărimi și prețuri, comenzi și seara.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    situatii: FARA_SITE,
    cuvinte: ['haine', 'incaltaminte', 'boutique', 'lenjerie', 'imbracaminte', 'clothing', 'shoe', 'pantofi', 'fashion', 'rochii'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru magazine.`,
      '',
      `Am văzut {{firma}} pe Google[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Unul cu toate modelele, mărimile și prețurile v-ar scuti de multe mesaje de tipul "cât costă?" și "aveți mărimea M?", iar oamenii ar putea comanda și seara, când magazinul e închis.`,
      '',
      '((Vă pot arăta|Pot să vă arăt)) un exemplu de magazin de haine făcut așa?'
    ),
  },
  {
    cheie: 'ro-magazin-cosmetice',
    nume: 'Magazin de cosmetice / bijuterii / flori / cadouri',
    nota: 'Produse care se aleg din poze.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    situatii: FARA_SITE,
    cuvinte: ['cosmetic', 'bijuter', 'flori', 'florar', 'cadou', 'gift', 'jewel', 'parfum', 'accesori'],
    text: t(
      `{{salut}}! ${SUNT} și fac site-uri pentru magazine mici.`,
      '',
      '{{firma}} mi-a apărut pe Google Maps[[, cu {{nota_google}}]], dar fără site. La produse ca ale voastre, oamenii vor să vadă poze și prețuri înainte să scrie sau să vină. Un catalog online, cu comandă din două clicuri, face exact asta și arată mult mai serios decât o listă pe Instagram.',
      '',
      'V-ar interesa să vedeți cum ar arăta pentru voi?'
    ),
  },
  {
    cheie: 'ro-magazin-tehnica',
    nume: 'Magazin de electronice / mobilă / casă / piese',
    nota: 'Produse pe care oamenii le compară înainte să cumpere.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    situatii: FARA_SITE,
    cuvinte: ['electronic', 'telefon', 'mobila', 'casa', 'constructi', 'piese', 'biciclet', 'sport', 'jucari', 'tehnic', 'electrocasnic', 'gadget'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri și magazine online.`,
      '',
      'Am văzut că {{firma}} nu are încă site. La produse de felul ăsta, oamenii compară mult online înainte să cumpere și aleg de obicei magazinul unde văd stocul, prețul și garanția fără să sune.',
      '',
      'Un catalog simplu pe site v-ar aduce exact clienții ăștia[[ din {{oras}}]]. Vă trimit un exemplu?'
    ),
  },
  {
    cheie: 'ro-magazin-general',
    nume: 'Orice magazin · vitrina deschisă non-stop',
    nota: 'Pentru magazinele care nu intră în celelalte nișe.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    situatii: FARA_SITE,
    text: t(
      `{{salut}}! ${SUNT}.`,
      '',
      `Am văzut {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți site. Pentru un magazin, un site e ca o vitrină deschisă non-stop: oamenii văd produsele și prețurile, comandă când le e comod, iar cei din alte orașe pot cumpăra fără să vină.`,
      '',
      'Fac astfel de site-uri. Vreți să vă arăt cum ar arăta al vostru?'
    ),
  },
  {
    cheie: 'ro-magazin-instagram',
    nume: 'Magazin care vinde doar prin Instagram',
    nota: 'Pentru magazinele care au doar pagină pe rețele.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    situatii: ['DOAR_SOCIAL'],
    text: t(
      '{{salut}}! Văd că {{firma}} vinde mai mult prin rețelele sociale. Merge, dar fiecare comandă înseamnă mesaje în direct, aceleași întrebări de fiecare dată și clienți care uită să mai răspundă.',
      '',
      `${SUNT}, fac magazine online simple: omul alege produsul, lasă numărul și vă vine comanda gata scrisă. Pagina de Instagram rămâne, doar că vă aduce comenzi mai ușor.`,
      '',
      'Vă interesează să vedeți cum merge?'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · RESTAURANTE ȘI HORECA
  // ============================================================
  {
    cheie: 'ro-horeca-restaurant',
    nume: 'Restaurant / cafenea / bar / pizzerie',
    nota: 'Meniu cu poze și prețuri, rezervare fără telefon.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Restaurante și HoReCa',
    situatii: FARA_SITE,
    cuvinte: ['restaurant', 'cafenea', 'cafe', 'bar', 'pizz', 'bistro', 'fast food', 'sushi', 'burger', 'terasa', 'pub', 'grill', 'cantina', 'shaorma'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru restaurante și cafenele.`,
      '',
      'Am dat de {{firma}} pe Google Maps[[, aveți {{nota_google}}, se vede că oamenilor le place la voi]]. Am observat că nu aveți site. Cine caută unde să mănânce[[ în {{oras}}]] vrea să vadă meniul cu poze și prețuri înainte să vină și să rezerve o masă fără să sune.',
      '',
      'V-ar interesa un site de felul ăsta?'
    ),
  },
  {
    cheie: 'ro-horeca-cofetarie',
    nume: 'Cofetărie / patiserie / brutărie',
    nota: 'Catalog de torturi și comenzi pentru evenimente.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Restaurante și HoReCa',
    situatii: FARA_SITE,
    cuvinte: ['cofet', 'patiser', 'brutar', 'tort', 'prajitur', 'desert', 'bakery', 'pastry', 'dulciur', 'cake'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      `Am văzut {{firma}} pe Google[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. La torturi și prăjituri oamenii aleg din poze. Un catalog pe site, cu prețuri și un formular de comandă pentru zile de naștere și evenimente, v-ar aduce comenzi și de la cei care nu vă știu încă, nu doar de la cei care vă urmăresc pe Instagram.`,
      '',
      'Vă arăt un exemplu?'
    ),
  },
  {
    cheie: 'ro-horeca-hotel',
    nume: 'Hotel / pensiune',
    nota: 'Rezervări directe, fără comisionul Booking.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Restaurante și HoReCa',
    situatii: FARA_SITE,
    cuvinte: ['hotel', 'pensiun', 'guest', 'hostel', 'vila', 'cazare', 'motel', 'resort'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru hoteluri și pensiuni.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[, cu {{nota_google}}]], dar fără site. Un site al vostru, cu poze, prețuri și formular de rezervare, i-ar lăsa pe oaspeți să rezerve direct la voi, fără comisionul de pe Booking. Și vă găsesc mai ușor când caută cazare[[ în {{oras}}]].',
      '',
      'V-ar interesa să discutăm?'
    ),
  },
  {
    cheie: 'ro-horeca-catering',
    nume: 'Catering / banchete / săli de evenimente',
    nota: 'Clienții cer oferte la mai multe firme deodată.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Restaurante și HoReCa',
    situatii: FARA_SITE,
    cuvinte: ['catering', 'banchet', 'nunt', 'eveniment', 'sala de', 'event', 'festiv'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      'Am văzut că {{firma}} nu are încă site. La catering și evenimente, oamenii cer oferte de la mai multe firme deodată și o aleg pe cea care pare mai serioasă. Un site cu meniuri, poze de la evenimente și un formular de cerere vă pune direct în fața lor.',
      '',
      'Vreți să vă arăt cum ar arăta?'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · FRUMUSEȚE ȘI SĂNĂTATE
  // ============================================================
  {
    cheie: 'ro-frumusete-salon',
    nume: 'Salon / unghii / frizerie / cosmetologie',
    nota: 'Programare online, mai puține apeluri în timpul lucrului.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Frumusețe și sănătate',
    situatii: FARA_SITE,
    cuvinte: ['salon', 'unghii', 'nail', 'frizer', 'barber', 'coafur', 'cosmetolog', 'gene', 'spranc', 'beauty', 'manichiur', 'epilar', 'makeup', 'machiaj', 'hair'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru saloane.`,
      '',
      `Am văzut {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Unul cu servicii, prețuri, lucrări și programare online v-ar scăpa de multe apeluri în timp ce lucrați, iar clienții noi s-ar putea programa și seara, direct din telefon.`,
      '',
      'Vă interesează să vedeți cum funcționează?'
    ),
  },
  {
    cheie: 'ro-frumusete-clinica',
    nume: 'Clinică / stomatologie / cabinet medical',
    nota: 'Încredere: medici, prețuri, programare.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Frumusețe și sănătate',
    situatii: FARA_SITE,
    cuvinte: ['stomatolog', 'dentist', 'dental', 'clinic', 'medical', 'medic', 'laborator', 'ortodont', 'oftalmolog', 'sanatate'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru clinici și cabinete.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[ ({{nota_google}})]] și am observat că nu aveți încă site. La servicii medicale oamenii aleg pe cine îi inspiră încredere: vor să vadă medicii, prețurile orientative și să se programeze fără să aștepte la telefon. Un site făcut bine face exact asta.',
      '',
      'V-ar interesa să discutăm câteva minute?'
    ),
  },
  {
    cheie: 'ro-frumusete-veterinar',
    nume: 'Cabinet veterinar',
    nota: 'Program și servicii la vedere, când e urgent.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Frumusețe și sănătate',
    situatii: FARA_SITE,
    cuvinte: ['veterin', 'vet', 'animal'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[, cu {{nota_google}}]], dar fără site. Când un animal are o problemă, stăpânul caută repede pe telefon un veterinar aproape, cu program și servicii la vedere. Dacă nu le găsește, ajunge la cine apare primul cu toate informațiile.',
      '',
      'V-ar interesa unul simplu, cu programul, serviciile și programare online?'
    ),
  },
  {
    cheie: 'ro-frumusete-fitness',
    nume: 'Sală de fitness / masaj / spa / studio',
    nota: 'Prețuri, orar și programare, și seara.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Frumusețe și sănătate',
    situatii: FARA_SITE,
    cuvinte: ['fitness', 'gym', 'sala de sport', 'masaj', 'spa', 'yoga', 'pilates', 'crossfit', 'box', 'antrenament', 'studio'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru săli și studiouri.`,
      '',
      `Am văzut {{firma}} pe Google[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Unul cu prețurile, orarul și un buton de programare v-ar aduce clienți noi, inclusiv seara, când nu e nimeni să răspundă la telefon.`,
      '',
      'Vă arăt cum ar putea arăta?'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · ȘCOLI PRIVATE ȘI EDUCAȚIE
  // ============================================================
  {
    cheie: 'ro-scoli-limbi',
    nume: 'Centru de limbi străine / școală de engleză',
    nota: 'Lumea compară centrele online; formular pentru lecția de probă.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Școli private și educație',
    situatii: FARA_SITE,
    cuvinte: ['limb', 'englez', 'english', 'german', 'francez', 'spaniol', 'italian', 'language', 'ielts', 'cambridge'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru școli și centre de cursuri.`,
      '',
      `Am văzut {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Cine caută cursuri compară de obicei 3-4 centre online: programe, prețuri, profesori, recenzii. Centrul care are totul pe un site, cu formular pentru lecția de probă, primește de obicei și înscrierea.`,
      '',
      'V-ar interesa să vă arăt un exemplu?'
    ),
  },
  {
    cheie: 'ro-scoli-gradinita',
    nume: 'Grădiniță / after school / școală privată',
    nota: 'Părinții au nevoie de încredere înainte de prima vizită.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Școli private și educație',
    situatii: FARA_SITE,
    cuvinte: ['gradinit', 'after', 'scoala privata', 'liceu', 'kindergarten', 'cresa', 'primar', 'montessori', 'preschool', 'private school'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru școli și grădinițe private.`,
      '',
      'Am văzut că {{firma}} nu are încă site. Părinții aleg cu multă grijă și caută tot ce pot: poze din grupe, programul zilei, meniul, educatorii, prețul. Un site care arată toate astea creează încredere înainte de prima vizită și aduce cereri de înscriere direct pe telefon.',
      '',
      'V-ar interesa?'
    ),
  },
  {
    cheie: 'ro-scoli-cursuri',
    nume: 'Cursuri / meditații / programare / dans / muzică',
    nota: 'Orar, vârste, prețuri și înscriere în 30 de secunde.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Școli private și educație',
    situatii: FARA_SITE,
    cuvinte: ['meditat', 'curs', 'programar', 'robot', 'dans', 'muzic', 'sah', 'chess', 'desen', 'pictur', 'teatru', 'arte', 'educati', 'dezvoltare', 'tutor', 'coding'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru centre de cursuri.`,
      '',
      `Am văzut {{firma}} pe Google[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Unul cu cursurile, vârstele, orarul și prețurile, plus un formular de înscriere de 30 de secunde, ar aduce părinți care acum vă găsesc greu sau deloc online.`,
      '',
      'Vă pot arăta cum ar arăta pentru voi?'
    ),
  },
  {
    cheie: 'ro-scoli-auto',
    nume: 'Școală auto',
    nota: 'Prețuri, mașini, grupa nouă și înscriere.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Școli private și educație',
    situatii: FARA_SITE,
    cuvinte: ['soferi', 'scoala auto', 'permis', 'driving', 'instructor'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      `Am văzut {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Cine vrea să-și facă permisul caută pe telefon și compară prețul, mașinile, instructorii și când începe grupa nouă. Cu un site unde se văd toate astea și un buton de înscriere, ați primi cereri direct, nu doar apeluri.`,
      '',
      'V-ar interesa?'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · AUTO
  // ============================================================
  {
    cheie: 'ro-auto-service',
    nume: 'Service auto / vulcanizare / spălătorie',
    nota: 'Omul caută pe telefon și sună la primul care inspiră încredere.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Auto',
    situatii: FARA_SITE,
    cuvinte: ['service', 'vulcaniz', 'spalator', 'car wash', 'anvelop', 'diagnost', 'tinichig', 'vopsitor', 'detailing', 'car repair', 'tire'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[, cu {{nota_google}}]], dar fără site. Când are nevoie de ceva pentru mașină, omul caută pe telefon un service aproape și sună la primul care îi inspiră încredere. Un site cu serviciile, prețuri orientative și programare online vă pune în fața lui înaintea altora.',
      '',
      'Vă arăt cum ar arăta?'
    ),
  },
  {
    cheie: 'ro-auto-dealer',
    nume: 'Dealer / chirie auto',
    nota: 'Catalog propriu în loc de anunțuri împrăștiate.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Auto',
    situatii: FARA_SITE,
    cuvinte: ['dealer', 'chirie', 'rent', 'inchiri', 'masini', 'showroom', 'car rental', 'auto import'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri auto.`,
      '',
      'Am văzut că {{firma}} nu are încă site. La mașini, un catalog propriu cu poze, prețuri și disponibilitate arată mult mai serios decât anunțurile de pe platforme, iar clienții vă pot scrie direct din pagina mașinii care le place.',
      '',
      'V-ar interesa să vedeți un exemplu?'
    ),
  },

  // ============================================================
  // PRIMUL MESAJ · SERVICII
  // ============================================================
  {
    cheie: 'ro-servicii-constructii',
    nume: 'Construcții / reparații / instalator / electrician',
    nota: 'Portofoliu „înainte și după" și cerere de ofertă.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['construct', 'reparat', 'renovar', 'instalat', 'electric', 'sanitar', 'acoperis', 'ferestre', 'termopan', 'usi', 'montaj', 'mester', 'zidar', 'gips', 'plumber'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru firme de construcții și reparații.`,
      '',
      'Am văzut că {{firma}} nu are site. În domeniul vostru, oamenii vor să vadă lucrări făcute înainte să cheme pe cineva acasă. Un site cu poze înainte și după, serviciile și un formular de cerere de ofertă vă face mult mai credibili decât un număr de telefon pe Google.',
      '',
      'V-ar interesa să vă arăt cum ar arăta?'
    ),
  },
  {
    cheie: 'ro-servicii-juridic',
    nume: 'Avocat / notar / contabil',
    nota: 'Clientul alege după încredere — ton sobru.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['avocat', 'juridic', 'notar', 'contab', 'audit', 'consult', 'lawyer', 'account', 'fiscal', 'law'],
    text: t(
      `{{salut}}! ${SUNT} și fac site-uri pentru birouri de avocatură, notariale și de contabilitate.`,
      '',
      'Am văzut că {{firma}} nu are încă site. În domeniul vostru clientul alege după încredere: vrea să vadă cine sunteți, ce experiență aveți și cu ce îl puteți ajuta, înainte să sune. Un site sobru și clar face prima impresie în locul vostru.',
      '',
      'V-ar interesa să discutăm câteva minute?'
    ),
  },
  {
    cheie: 'ro-servicii-imobiliare',
    nume: 'Agenție imobiliară',
    nota: 'Ofertele proprii într-un loc, cererile direct la ei.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['imobil', 'real estate', 'apartament', 'realty', 'proprietat'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru agenții imobiliare.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[ ({{nota_google}})]] și am observat că nu aveți încă site. Cu unul propriu, toate ofertele voastre stau într-un singur loc, cu poze și filtre, iar cererile vin direct la voi, nu se pierd printre sutele de anunțuri ale altora de pe platforme.',
      '',
      'Vă arăt un exemplu de site imobiliar?'
    ),
  },
  {
    cheie: 'ro-servicii-foto',
    nume: 'Foto / video / evenimente',
    nota: 'Oamenii aleg din portofoliu.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['foto', 'video', 'eveniment', 'nunt', 'dj', 'decor', 'event', 'planner', 'animator'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      'Am văzut că {{firma}} nu are încă site. La foto și evenimente, oamenii aleg din portofoliu. Un site cu cele mai bune lucrări, pachetele cu prețuri și un formular cu data evenimentului vă aduce cereri de la cei care vă caută pe Google, nu doar de la cei care vă găsesc pe Instagram.',
      '',
      'V-ar interesa?'
    ),
  },
  {
    cheie: 'ro-servicii-mici',
    nume: 'Curățenie / mutări / croitorie / tipografie',
    nota: 'Preț orientativ și comandă într-un minut.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['curaten', 'cleaning', 'mutar', 'transport', 'croitor', 'curatator', 'tipograf', 'print', 'lacatus', 'chei', 'covoare'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru afaceri mici.`,
      '',
      `Am văzut {{firma}} pe Google Maps[[ (aveți {{nota_google}}, ${LAUDA})]] și am observat că nu aveți încă site. Pentru servicii ca ale voastre, oamenii vor un preț orientativ și un mod rapid de a comanda. Un site simplu, cu lista de prețuri și un formular de un minut, aduce mai multe comenzi și vă scutește de aceleași explicații la telefon.`,
      '',
      'V-ar interesa să vă arăt cum ar arăta?'
    ),
  },
  {
    cheie: 'ro-servicii-turism',
    nume: 'Agenție de turism',
    nota: 'Lumea caută vacanța seara, pe telefon.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Servicii',
    situatii: FARA_SITE,
    cuvinte: ['turism', 'travel', 'vacant', 'excursi', 'tour', 'bilete avion'],
    text: t(
      `{{salut}}! ${SUNT}, fac site-uri pentru agenții de turism.`,
      '',
      'Am văzut {{firma}} pe Google Maps[[ ({{nota_google}})]] și am observat că nu aveți încă site. Oamenii caută vacanța seara, pe telefon, și scriu la cine le arată ofertele clar, cu poze, prețuri și date. Un site cu ofertele voastre și un formular de cerere lucrează pentru voi și când agenția e închisă.',
      '',
      'Vă arăt un exemplu?'
    ),
  },

  // ============================================================
  // NU RĂSPUNDE · DUPĂ APEL
  // ============================================================
  {
    cheie: 'ro-nu-raspunde',
    nume: 'Am încercat să vă sun',
    nota: 'Cel mai natural motiv să scrii: ai sunat și n-a răspuns.',
    etapa: 'NU_RASPUNDE',
    categorie: 'Orice firmă',
    text: t(
      `{{salut}}! Am încercat să vă sun adineauri, probabil erați ocupați. ${SUNT}, fac site-uri pentru afaceri.`,
      '',
      'Vă scriu aici ca să nu vă deranjez cu apeluri: [[am observat că {{problema}} și ]]am câteva idei pentru {{firma}}. Când vă e comod să vorbim 5 minute?'
    ),
  },
  {
    cheie: 'ro-dupa-apel',
    nume: 'După apel · cum am vorbit',
    nota: 'Imediat după o discuție la telefon.',
    etapa: 'DUPA_APEL',
    categorie: 'Orice firmă',
    text: t(
      `{{salut}}! ${SUNT}, am vorbit adineauri la telefon. Cum am promis, vă scriu aici ca să aveți numărul meu.`,
      '',
      'Vă trimit în curând câteva exemple de site-uri potrivite pentru {{firma}}. Când vă e comod să ne auzim din nou, mâine sau poimâine?'
    ),
  },

  // ============================================================
  // REVENIRE
  // ============================================================
  {
    cheie: 'ro-revenire-1',
    nume: 'Revenire 1 · după 2-3 zile',
    nota: 'Scurt și ușor de răspuns.',
    etapa: 'REVENIRE',
    categorie: 'Orice firmă',
    text: t(
      '{{salut}}! Revin la mesajul de mai sus, poate s-a pierdut printre altele.',
      '',
      '((Vă interesează|V-ar interesa)) să vă arăt cum ar putea arăta un site pentru {{firma}}? Un simplu da sau nu e suficient 🙂'
    ),
  },
  {
    cheie: 'ro-revenire-2',
    nume: 'Revenire 2 · cu o idee concretă',
    nota: 'După încă 4-5 zile; aduci ceva nou, nu doar „revin".',
    etapa: 'REVENIRE',
    categorie: 'Orice firmă',
    text: t(
      '{{salut}}! M-am mai gândit la {{firma}} și am o idee concretă: o pagină cu ce oferiți, prețurile și un buton de WhatsApp, care să apară când cineva caută pe Google ce oferiți voi[[ în {{oras}}]]. Clientul vede tot și vă scrie direct.',
      '',
      'Dacă vreți, v-o fac ca exemplu, să vă faceți o idee. Vă interesează?'
    ),
  },
  {
    cheie: 'ro-revenire-ultima',
    nume: 'Ultimul mesaj · închidere politicoasă',
    nota: 'După o săptămână. Surprinzător de des primește răspuns.',
    etapa: 'REVENIRE',
    categorie: 'Orice firmă',
    text: t(
      '{{salut}}! Ultimul meu mesaj, promit. Înțeleg perfect dacă acum nu e momentul pentru un site.',
      '',
      'Dacă vă gândiți la asta mai încolo, salvați-mi numărul și scrieți-mi oricând. ((Vă doresc mult succes|Mult succes în continuare)) cu {{firma}}!'
    ),
  },

  // ============================================================
  // DUPĂ CE A RĂSPUNS
  // ============================================================
  {
    cheie: 'ro-raspuns-intrebari',
    nume: 'A zis da · 3 întrebări scurte',
    nota: 'Afli ce vor, ca să le arăți ceva potrivit.',
    etapa: 'DUPA_RASPUNS',
    categorie: 'Orice firmă',
    text: t(
      'Mulțumesc că mi-ați răspuns! Ca să vă arăt ceva potrivit pentru {{firma}}, am 3 întrebări scurte:',
      '',
      '1. Ce vreți să facă oamenii pe site: să sune, să comande, să se programeze?',
      '2. Aveți poze cu produsele, lucrările sau localul?',
      '3. Vă grăbiți sau putem lua 2-3 săptămâni?',
      '',
      'Răspundeți cum vă e comod, și prin mesaj vocal.'
    ),
  },
  {
    cheie: 'ro-raspuns-ce-include',
    nume: 'A zis da · ce primește un client',
    nota: 'Toate beneficiile, pe scurt — acum, că omul e interesat.',
    etapa: 'DUPA_RASPUNS',
    categorie: 'Orice firmă',
    text: t(
      'Pe scurt, ce primiți cu un site făcut de mine:',
      '',
      '- vă găsesc mai ușor pe Google cei care caută[[ în {{oras}}]] ce oferiți',
      '- produsele sau serviciile, cu poze și prețuri, arătate frumos',
      '- se deschide repede, pe telefon și pe calculator',
      '- formular de comandă sau programare și buton direct de WhatsApp',
      '- arătați ca o firmă serioasă, și asta vă deosebește de cei care au doar Instagram',
      '',
      'Vreți să vă trimit câteva exemple?'
    ),
  },
  {
    cheie: 'ro-raspuns-discutie',
    nume: 'A zis da · propune o discuție',
    nota: 'Când omul e interesat și vrei să vorbiți.',
    etapa: 'DUPA_RASPUNS',
    categorie: 'Orice firmă',
    text: t(
      'Super, mulțumesc! Cel mai simplu ar fi să vă arăt pe ecran câteva exemple, durează 10-15 minute. Putem face asta la telefon sau pe video, cum vă e mai comod.',
      '',
      'Când vă potrivește mai bine, azi după-amiază sau mâine dimineață?'
    ),
  },

  // ============================================================
  // RUSĂ — multe firme din Moldova vorbesc rusa
  // ============================================================
  {
    cheie: 'ru-general-fara-site',
    nume: 'RU · без сайта',
    nota: 'Pentru firmele care vorbesc rusa.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    limba: 'ru',
    situatii: FARA_SITE,
    text: t(
      '{{salut}}! Меня зовут {{numele_meu}}, я делаю сайты для бизнеса.',
      '',
      'Ваша компания {{firma}} попалась мне в Google Картах[[, у вас {{nota_google}}, ((отличный результат|это здорово))]]. Вижу, что сайта у вас пока нет. Те, кто ищет в Google, видят только адрес и телефон и часто выбирают тех, у кого есть сайт с ценами и фото.',
      '',
      'Показать, как мог бы выглядеть ваш сайт?'
    ),
  },
  {
    cheie: 'ru-magazin',
    nume: 'RU · магазин',
    nota: 'Magazine, în rusă.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Magazine',
    limba: 'ru',
    situatii: FARA_SITE,
    text: t(
      '{{salut}}! Меня зовут {{numele_meu}}, я делаю сайты для магазинов.',
      '',
      'Ваш магазин {{firma}} попался мне в Google Картах, и вижу, что сайта у вас пока нет. Сайт с каталогом, ценами и наличием избавит вас от десятков сообщений «сколько стоит?», а покупатели смогут заказать даже вечером, когда магазин закрыт.',
      '',
      'Показать пример такого сайта?'
    ),
  },
  {
    cheie: 'ru-salon',
    nume: 'RU · салон / онлайн-запись',
    nota: 'Saloane și servicii cu programare, în rusă.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Frumusețe și sănătate',
    limba: 'ru',
    situatii: FARA_SITE,
    text: t(
      '{{salut}}! Меня зовут {{numele_meu}}, я делаю сайты для салонов и студий.',
      '',
      'Вижу, что у {{firma}} пока нет сайта[[, хотя отзывы отличные: {{nota_google}}]]. Сайт с услугами, ценами, работами и онлайн-записью снимет с вас часть звонков во время работы, а новые клиенты смогут записаться даже ночью.',
      '',
      'Интересно посмотреть, как это работает?'
    ),
  },
  {
    cheie: 'ru-nu-raspunde',
    nume: 'RU · не дозвонились',
    nota: 'După un apel fără răspuns, în rusă.',
    etapa: 'NU_RASPUNDE',
    categorie: 'Orice firmă',
    limba: 'ru',
    text: t(
      '{{salut}}! Не получилось до вас дозвониться, наверное, вы были заняты. Меня зовут {{numele_meu}}, я делаю сайты для бизнеса.',
      '',
      'Пишу сюда, чтобы не отвлекать звонками: есть пара идей для {{firma}}. Когда вам удобно поговорить 5 минут?'
    ),
  },
  {
    cheie: 'ru-revenire',
    nume: 'RU · напоминание',
    nota: 'Revenire, în rusă.',
    etapa: 'REVENIRE',
    categorie: 'Orice firmă',
    limba: 'ru',
    text: t(
      '{{salut}}! Возвращаюсь к сообщению выше, вдруг оно потерялось среди других.',
      '',
      'Показать, как мог бы выглядеть сайт для {{firma}}? Достаточно ответить да или нет 🙂'
    ),
  },

  // ============================================================
  // ENGLEZĂ — firmele din Marea Britanie, SUA, Irlanda...
  // ============================================================
  {
    cheie: 'en-no-website',
    nume: 'EN · no website',
    nota: 'Firmele din străinătate fără site.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    limba: 'en',
    situatii: FARA_SITE,
    text: t(
      "{{salut}}, I'm {{numele_meu}}. I build websites for small businesses.",
      '',
      "I came across {{firma}} on Google Maps[[ ({{nota_google}}, ((nice work|that's great)))]] and noticed you don't have a website. People searching on Google only see your address and phone number, and a lot of them go with the business that shows them more.",
      '',
      'Would it help if I showed you what yours could look like?'
    ),
  },
  {
    cheie: 'en-site-issue',
    nume: 'EN · website problem',
    nota: 'Site mort, nesigur, lent sau nemobil — în engleză.',
    etapa: 'PRIMUL_CONTACT',
    categorie: 'Orice firmă',
    limba: 'en',
    situatii: ['MORT', 'FARA_HTTPS', 'NEADAPTAT_MOBIL', 'LENT'],
    text: t(
      '{{salut}}, quick heads-up: I opened the {{firma}} website from Google Maps and {{problema}}. Most people just close the page and call the next place.',
      '',
      "I'm {{numele_meu}}, I build and fix websites. Want me to tell you exactly what's causing it? It's often a quick fix."
    ),
  },
  {
    cheie: 'en-follow-up',
    nume: 'EN · follow-up',
    nota: 'Revenire, în engleză.',
    etapa: 'REVENIRE',
    categorie: 'Orice firmă',
    limba: 'en',
    text: "{{salut}}, just checking this didn't get buried. Would you like to see what a website for {{firma}} could look like? A simple yes or no is fine.",
  },
]

export const getSablonGata = (cheie) => SABLOANE_GATA.find((s) => s.cheie === cheie) || null
