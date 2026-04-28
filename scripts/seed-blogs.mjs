// Run: node scripts/seed-blogs.mjs
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const blogs = [
  {
    title: 'De ce ar trebui copilul tău să învețe Python?',
    slug: 'de-ce-python-pentru-copii',
    excerpt: 'Python este unul dintre cele mai bune limbaje pentru copiii care fac primii pași în programare. Iată 7 motive concrete și ce poate construi efectiv copilul tău în 6 luni.',
    coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&q=80',
    category: 'Programare',
    tags: ['python', 'copii', 'începători'],
    authorName: 'Echipa PyWeb',
    readMinutes: 6,
    content: [
      { type: 'heading', text: 'De ce Python e perfect pentru copii' },
      { type: 'text', text: 'Python are o sintaxă simplă, aproape de limbajul natural. Asta înseamnă că un copil poate scrie primul program funcțional în doar câteva minute - fără să fie copleșit de paranteze, punct-virgulă sau termeni tehnici.\n\nÎn loc să se lupte cu detalii de sintaxă, copilul se concentrează pe logică și creativitate, exact ce ne dorim la vârsta de 8-14 ani.' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=1200&q=80', alt: 'Copil învățând să programeze', caption: 'Programarea dezvoltă gândirea logică și răbdarea' },
      { type: 'heading', text: 'Ce poate construi un copil în 6 luni?' },
      { type: 'text', text: 'Iată câteva proiecte reale realizate de elevii noștri în primele 6 luni:\n\n• Un joc de tip "Ghicește numărul"\n• Un quiz interactiv pe teme alese de el\n• Un mic chatbot care răspunde la întrebări\n• Desene și animații cu Turtle Graphics\n• Un program care calculează nota medie' },
      { type: 'quote', text: 'În prima săptămână fiul meu a scris un program care îi spunea bună dimineața. A fost foarte entuziasmat!', author: 'Maria, mamă a lui Andrei (10 ani)' },
      { type: 'faq', items: [
        { question: 'La ce vârstă poate începe copilul?', answer: 'Recomandăm de la 8 ani. Pentru copiii mai mici, începem cu Scratch și trecem treptat la Python.' },
        { question: 'Are nevoie de cunoștințe anterioare?', answer: 'Nu. Cursul este conceput pentru începători absoluți. Singurul lucru necesar este curiozitatea.' },
        { question: 'Cât timp trebuie să studieze acasă?', answer: '15-30 de minute, de 2-3 ori pe săptămână, sunt suficiente pentru progres constant.' }
      ]},
      { type: 'text', text: 'Programarea îi dă copilului tău un superputere reală pentru viitor - nu doar o abilitate tehnică, ci și încrederea că poate construi orice își propune.' }
    ]
  },
  {
    title: 'Scratch vs Python: cu ce să înceapă copilul?',
    slug: 'scratch-vs-python',
    excerpt: 'Două instrumente excelente pentru copii, dar care e potrivit pentru copilul tău? Comparația completă, cu vârste recomandate și avantaje.',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1200&q=80',
    category: 'Sfaturi părinți',
    tags: ['scratch', 'python', 'începători'],
    authorName: 'Echipa PyWeb',
    readMinutes: 5,
    content: [
      { type: 'heading', text: 'Diferența esențială' },
      { type: 'text', text: 'Scratch folosește blocuri colorate care se îmbină vizual - copilul nu scrie cod, ci aranjează piese de puzzle. Python e cod scris, dar foarte simplu și intuitiv.' },
      { type: 'heading', text: 'Când recomandăm Scratch' },
      { type: 'text', text: '• Vârsta 6-9 ani\n• Copii care au nevoie de feedback vizual rapid\n• Primul contact cu programarea\n• Copii care învață mai bine prin desen și culori' },
      { type: 'heading', text: 'Când recomandăm Python' },
      { type: 'text', text: '• Vârsta 9+ ani (sau copii mai mici cu experiență Scratch)\n• Copii care vor să facă "lucruri reale"\n• Cei interesați de matematică sau jocuri\n• Pas natural după Scratch' },
      { type: 'youtube', videoId: 'kqtD5dpn9C8', caption: 'Python pentru începători - introducere rapidă' },
      { type: 'faq', items: [
        { question: 'Pot trece de la Scratch la Python?', answer: 'Absolut! Mulți elevi încep cu Scratch la 8 ani și trec la Python după 6-12 luni. Tranziția e foarte naturală.' },
        { question: 'Care e mai ușor?', answer: 'Scratch e mai vizual deci pare mai prietenos la prima vedere. Dar Python, odată ce înțelegi sintaxa de bază, e foarte direct.' }
      ]}
    ]
  },
  {
    title: 'Web Development pentru adolescenți: HTML, CSS și JavaScript',
    slug: 'web-development-pentru-adolescenti',
    excerpt: 'Cum poate adolescentul tău să construiască primul lui website real în 3 luni. Roadmap complet, instrumente și proiecte recomandate.',
    coverImage: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=1200&q=80',
    category: 'Web Development',
    tags: ['web', 'html', 'css', 'javascript', 'adolescenți'],
    authorName: 'Echipa PyWeb',
    readMinutes: 7,
    content: [
      { type: 'heading', text: 'De ce web development?' },
      { type: 'text', text: 'Web development e una dintre cele mai accesibile și satisfăcătoare ramuri ale programării. În câteva ore, adolescentul tău poate vedea un website făcut de el rulând în browser - asta dă o motivație uriașă.' },
      { type: 'heading', text: 'Roadmap-ul de 3 luni' },
      { type: 'text', text: 'Luna 1 — HTML & CSS:\n• Structura unei pagini web\n• Stilizare modernă cu Flexbox și Grid\n• Design responsive pentru telefon și desktop\n\nLuna 2 — JavaScript de bază:\n• Variabile, funcții, condiții\n• Interacțiunea cu pagina (DOM)\n• Animații și efecte\n\nLuna 3 — Proiect personal:\n• Portfolio personal\n• Site pentru un hobby (muzică, sport, gaming)\n• Mini-joc în browser' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1200&q=80', alt: 'Cod HTML și CSS', caption: 'Primul tău site poate fi gata în 2 săptămâni' },
      { type: 'quote', text: 'După 2 luni de curs, fiica mea și-a făcut singură site-ul pentru proiectul de la școală. Profesoara a fost impresionată!', author: 'Andreea, mamă a lui Sofia (14 ani)' },
      { type: 'faq', items: [
        { question: 'Are nevoie de un calculator puternic?', answer: 'Nu. Orice laptop modern (chiar și unul mai vechi) este suficient pentru web development.' },
        { question: 'Ce program folosește?', answer: 'Folosim Visual Studio Code - gratuit, modern și folosit de profesioniștii din industrie.' },
        { question: 'Poate publica site-ul online?', answer: 'Da! Învățăm cum să publicăm site-uri gratuit pe Vercel sau GitHub Pages.' }
      ]}
    ]
  },
  {
    title: 'AI și Machine Learning explicate copiilor',
    slug: 'ai-si-machine-learning-pentru-copii',
    excerpt: 'Inteligența artificială nu mai e doar pentru oamenii de știință. Cum poate un adolescent să înțeleagă și să construiască primele lui modele AI.',
    coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
    category: 'AI',
    tags: ['ai', 'machine-learning', 'avansat'],
    authorName: 'Echipa PyWeb',
    readMinutes: 8,
    content: [
      { type: 'heading', text: 'Ce este AI, pe înțelesul tuturor' },
      { type: 'text', text: 'Imaginează-ți că vrei să înveți un computer să recunoască pisicile în poze. În loc să-i dai 1000 de reguli ("are mustăți, are urechi triunghiulare..."), îi arăți 1000 de poze și îi spui care au pisici. După un timp, computerul își dă seama singur ce caracteristici contează.\n\nAceasta este, în esență, învățarea automată (machine learning).' },
      { type: 'youtube', videoId: 'aircAruvnKk', caption: 'Ce sunt rețelele neuronale (3Blue1Brown)' },
      { type: 'heading', text: 'De ce e important acum' },
      { type: 'text', text: 'AI nu mai e SF. Adolescentul tău interacționează zilnic cu AI: ChatGPT pentru teme, recomandările YouTube, filtrele de pe Instagram, asistentul vocal de pe telefon. Înțelegând cum funcționează, va folosi aceste instrumente mai inteligent și mai responsabil.' },
      { type: 'heading', text: 'Ce poate construi un adolescent' },
      { type: 'text', text: '• Un program care recunoaște emoțiile dintr-o poză\n• Un chatbot personalizat pe un subiect ales de el\n• Un model care prezice notele bazat pe orele de studiu\n• Un sistem de recomandări (gen Netflix, dar pentru cărți)' },
      { type: 'faq', items: [
        { question: 'Trebuie să fie bun la matematică?', answer: 'Pentru noțiunile de bază nu e nevoie de matematică avansată. Pentru proiecte mai complexe, ajută cunoștințe de algebră de clasa a 9-a.' },
        { question: 'Are nevoie de Python?', answer: 'Da, AI se face cel mai bine în Python. Recomandăm minim 6 luni de Python înainte de a trece la AI.' },
        { question: 'De la ce vârstă?', answer: 'Recomandăm 13+ ani pentru cursul nostru de AI. Conceptele cer maturitate și răbdare.' }
      ]},
      { type: 'quote', text: 'AI e cel mai important skill pe care îl poate învăța un adolescent astăzi pentru cariera de mâine.', author: 'Andrew Ng, cofondator Coursera' }
    ]
  },
  {
    title: 'Cum să motivezi copilul să continue programarea',
    slug: 'cum-sa-motivezi-copilul-la-programare',
    excerpt: 'Începutul e ușor, dar cum păstrezi entuziasmul pe termen lung? 8 strategii testate cu sute de elevi.',
    coverImage: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=1200&q=80',
    category: 'Sfaturi părinți',
    tags: ['motivație', 'părinți', 'sfaturi'],
    authorName: 'Echipa PyWeb',
    readMinutes: 6,
    content: [
      { type: 'heading', text: 'Provocarea reală' },
      { type: 'text', text: 'Mulți copii sunt entuziasmați la primele lecții. Apoi vine momentul în care lucrurile devin mai grele - apar erori, conceptele devin mai abstracte. Aici se pierde un procent important de copii.\n\nDar cu strategiile potrivite, această fază poate deveni cea mai valoroasă din parcurs.' },
      { type: 'heading', text: '8 strategii care funcționează' },
      { type: 'text', text: '1. Lasă-l să aleagă proiectul. Dacă îi plac jocurile, fă jocuri. Dacă îi place muzica, fă o aplicație muzicală.\n\n2. Sărbătorește micile reușite. "Ai scris 50 de linii de cod fără ajutor!" e mare.\n\n3. Acceptă că eșuarea face parte. Erorile nu sunt eșecuri, sunt date. Programatorii profesioniști greșesc constant.\n\n4. Programează cu el. Chiar dacă nu știi cod, stai lângă el și încurajează-l. Întreabă "ce face linia asta?"\n\n5. Conectează-l cu alți copii care programează. Comunitatea e magie.\n\n6. Stabilește scopuri scurte și clare. "Săptămâna asta facem un calculator care adună" e mai bun decât "învățăm Python".\n\n7. Limitează frustrarea. Dacă se blochează 30 de minute, propune o pauză sau cere ajutor.\n\n8. Arată-i unde duce. Cărți, vloggeri, povești de succes ale altor copii. Inspirația contează.' },
      { type: 'image', url: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200&q=80', alt: 'Părinte și copil învățând împreună', caption: 'Implicarea părintelui face o diferență uriașă' },
      { type: 'faq', items: [
        { question: 'Ce fac dacă vrea să se lase după 3 luni?', answer: 'E normal. Discută cu profesorul - poate proiectele actuale nu îl entuziasmează. Schimbă tema, nu cursul.' },
        { question: 'Cum recunosc dacă progresează?', answer: 'Cere-i să-ți arate ce a făcut săptămâna asta. Dacă poate explica codul lui propriu, e pe drumul cel bun.' }
      ]},
      { type: 'quote', text: 'Cel mai bun cod scris de copilul meu nu a fost cel "perfect", ci cel pentru care a luptat 2 săptămâni să iasă bine. A învățat răbdarea.', author: 'Tatăl unui elev de 12 ani' }
    ]
  }
]

async function main() {
  console.log('🌱 Seeding blogs...\n')
  for (const b of blogs) {
    const existing = await prisma.blog.findUnique({ where: { slug: b.slug } })
    if (existing) {
      console.log(`  ⏭️  Skip (exists): ${b.title}`)
      continue
    }
    await prisma.blog.create({
      data: {
        ...b,
        published: true,
        publishedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000),
        recommendedCourseIds: [],
        recommendedBlogSlugs: blogs.filter(x => x.slug !== b.slug).slice(0, 2).map(x => x.slug)
      }
    })
    console.log(`  ✅ Created: ${b.title}`)
  }
  console.log(`\n🎉 Done. Vezi pe /blog`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
