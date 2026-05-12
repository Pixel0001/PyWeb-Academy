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
    title: 'Liste în Python: ghid complet cu exerciții rezolvate',
    slug: 'liste-python-exercitii-rezolvate',
    excerpt: 'Tot ce trebuie să știi despre liste în Python: creare, accesare, modificare, metode și 10 exerciții rezolvate pas cu pas pentru clasa a 9-a și a 10-a.',
    coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&q=80',
    category: 'Programare',
    tags: ['python', 'liste', 'exerciții', 'clasa 9', 'informatică'],
    authorName: 'Echipa PyWeb',
    readMinutes: 10,
    content: [
      { type: 'heading', text: 'Ce este o listă în Python?' },
      { type: 'text', text: 'O listă este o colecție ordonată de valori care pot fi de orice tip: numere, texte, sau chiar alte liste. Se definește cu paranteze pătrate:\n\n```python\nnote = [8, 9, 10, 7, 9]\nnume = ["Ana", "Mihai", "Ioana"]\nmixt = [1, "doi", 3.0, True]\n```\n\nListele sunt **modificabile** (poți adăuga, șterge, schimba elemente) și **indexate** (primul element are indexul 0).' },
      { type: 'heading', text: 'Accesarea elementelor' },
      { type: 'text', text: '```python\nnote = [8, 9, 10, 7, 9]\n\nprint(note[0])   # 8 — primul element\nprint(note[-1])  # 9 — ultimul element\nprint(note[1:3]) # [9, 10] — slicing\n```\n\nIndexarea negativă: `note[-1]` înseamnă ultimul element, `note[-2]` penultimul etc.' },
      { type: 'heading', text: 'Metode esențiale' },
      { type: 'text', text: '```python\nnote = [8, 9, 10]\n\nnote.append(7)      # adaugă la final → [8, 9, 10, 7]\nnote.insert(1, 5)   # inserează pe poziția 1 → [8, 5, 9, 10, 7]\nnote.remove(9)      # șterge prima apariție a lui 9\nnote.pop()          # șterge și returnează ultimul element\nnote.sort()         # sortare crescătoare\nnote.sort(reverse=True)  # sortare descrescătoare\nnote.reverse()      # inversare\nlen(note)           # numărul de elemente\nsum(note)           # suma elementelor\nmin(note), max(note) # minim și maxim\n```' },
      { type: 'heading', text: '10 exerciții rezolvate' },
      { type: 'text', text: '**Ex 1 — Suma elementelor**\n```python\nn = [3, 7, 2, 8, 1]\nprint(sum(n))  # 21\n```\n\n**Ex 2 — Elementele pare**\n```python\nn = [1, 2, 3, 4, 5, 6]\npare = [x for x in n if x % 2 == 0]\nprint(pare)  # [2, 4, 6]\n```\n\n**Ex 3 — Inversarea listei fără reverse()**\n```python\nn = [1, 2, 3, 4, 5]\ninversat = n[::-1]\nprint(inversat)  # [5, 4, 3, 2, 1]\n```\n\n**Ex 4 — Maximul fără max()**\n```python\nn = [3, 7, 2, 9, 1]\nm = n[0]\nfor x in n:\n    if x > m:\n        m = x\nprint(m)  # 9\n```\n\n**Ex 5 — Eliminarea duplicatelor**\n```python\nn = [1, 2, 2, 3, 3, 3, 4]\nunice = list(set(n))\nprint(sorted(unice))  # [1, 2, 3, 4]\n```\n\n**Ex 6 — Numărarea aparițiilor**\n```python\nn = [1, 2, 2, 3, 2, 4]\nprint(n.count(2))  # 3\n```\n\n**Ex 7 — Concatenarea a două liste**\n```python\na = [1, 2, 3]\nb = [4, 5, 6]\nc = a + b\nprint(c)  # [1, 2, 3, 4, 5, 6]\n```\n\n**Ex 8 — Media aritmetică**\n```python\nnote = [8, 9, 7, 10, 6]\nmedie = sum(note) / len(note)\nprint(f"Media: {medie:.2f}")  # Media: 8.00\n```\n\n**Ex 9 — Sortare fără sort()**\n```python\nn = [3, 1, 4, 1, 5]\nfor i in range(len(n)):\n    for j in range(i+1, len(n)):\n        if n[i] > n[j]:\n            n[i], n[j] = n[j], n[i]\nprint(n)  # [1, 1, 3, 4, 5]\n```\n\n**Ex 10 — Matrice (listă de liste)**\n```python\nmatrice = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nfor linie in matrice:\n    for elem in linie:\n        print(elem, end=" ")\n    print()\n# 1 2 3\n# 4 5 6\n# 7 8 9\n```' },
      { type: 'faq', items: [
        { question: 'Care e diferența dintre listă și tuplu?', answer: 'Lista e modificabilă (mutable), tuplul nu. Lista folosește [], tuplul folosește (). Dacă datele nu se schimbă, folosește tuplu — e mai rapid.' },
        { question: 'Pot pune liste în liste?', answer: 'Da! Asta se numește listă de liste sau matrice. Util pentru tabele, grile, probleme de tip matrice la bacalaureat.' },
        { question: 'Ce e list comprehension?', answer: 'O modalitate scurtă de a crea liste: [x*2 for x in range(5)] creează [0, 2, 4, 6, 8]. E mai rapid și mai pythonic decât un for clasic.' }
      ]}
    ]
  },
  {
    title: 'Funcții în Python: teorie și exerciții pentru bacalaureat',
    slug: 'functii-python-exercitii-bacalaureat',
    excerpt: 'Ghid complet despre funcții în Python: def, parametri, return, funcții recursive. Cu exerciții tip bacalaureat rezolvate și explicate.',
    coverImage: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=1200&q=80',
    category: 'Programare',
    tags: ['python', 'funcții', 'bacalaureat', 'recursivitate', 'informatică'],
    authorName: 'Echipa PyWeb',
    readMinutes: 12,
    content: [
      { type: 'heading', text: 'Ce este o funcție?' },
      { type: 'text', text: 'O funcție este un bloc de cod cu un nume, care poate fi apelat oricând ai nevoie de el. Evită repetarea codului și face programul mai ușor de înțeles.\n\n```python\ndef salut(nume):\n    print(f"Bună ziua, {nume}!")\n\nsalut("Ana")    # Bună ziua, Ana!\nsalut("Mihai")  # Bună ziua, Mihai!\n```' },
      { type: 'heading', text: 'Parametri și valori returnate' },
      { type: 'text', text: '```python\n# Funcție cu parametri și return\ndef aduna(a, b):\n    return a + b\n\nrezultat = aduna(3, 5)\nprint(rezultat)  # 8\n\n# Parametri cu valoare implicită\ndef putere(baza, exponent=2):\n    return baza ** exponent\n\nprint(putere(3))     # 9  (3²)\nprint(putere(2, 10)) # 1024 (2¹⁰)\n```' },
      { type: 'heading', text: 'Recursivitate — explicat simplu' },
      { type: 'text', text: 'O funcție recursivă se apelează pe ea însăși. Are întotdeauna:\n1. **Cazul de bază** — condiția de oprire\n2. **Cazul recursiv** — apelul cu un subproblem mai mic\n\n```python\ndef factorial(n):\n    if n == 0 or n == 1:  # cazul de bază\n        return 1\n    return n * factorial(n - 1)  # cazul recursiv\n\nprint(factorial(5))  # 120 = 5×4×3×2×1\n```\n\nCum funcționează:\n- `factorial(5)` = 5 × `factorial(4)`\n- `factorial(4)` = 4 × `factorial(3)`\n- `factorial(3)` = 3 × `factorial(2)`\n- `factorial(2)` = 2 × `factorial(1)`\n- `factorial(1)` = 1 ← caz de bază, se întoarce' },
      { type: 'heading', text: 'Exerciții tip bacalaureat' },
      { type: 'text', text: '**Ex 1 — Cel mai mare divizor comun (cmmdc)**\n```python\ndef cmmdc(a, b):\n    while b != 0:\n        a, b = b, a % b\n    return a\n\nprint(cmmdc(48, 18))  # 6\n```\n\n**Ex 2 — Număr prim**\n```python\ndef este_prim(n):\n    if n < 2:\n        return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0:\n            return False\n    return True\n\nprint(este_prim(17))  # True\nprint(este_prim(15))  # False\n```\n\n**Ex 3 — Șirul Fibonacci recursiv**\n```python\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n\nfor i in range(10):\n    print(fib(i), end=" ")\n# 0 1 1 2 3 5 8 13 21 34\n```\n\n**Ex 4 — Suma cifrelor (recursiv)**\n```python\ndef suma_cifre(n):\n    if n < 10:\n        return n\n    return n % 10 + suma_cifre(n // 10)\n\nprint(suma_cifre(1234))  # 10\n```\n\n**Ex 5 — Funcție care returnează lista numerelor prime până la n**\n```python\ndef prime_pana_la(n):\n    return [x for x in range(2, n+1) if este_prim(x)]\n\nprint(prime_pana_la(30))\n# [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]\n```' },
      { type: 'faq', items: [
        { question: 'Care e diferența dintre print și return?', answer: 'print afișează pe ecran dar funcția nu "produce" nimic. return dă înapoi o valoare care poate fi folosită în altă parte. La bacalaureat, aproape mereu vei folosi return.' },
        { question: 'Ce se întâmplă dacă uit cazul de bază la recursivitate?', answer: 'Funcția se apelează la infinit până când Python oprește execuția cu RecursionError: maximum recursion depth exceeded.' },
        { question: 'Pot returna mai multe valori dintr-o funcție?', answer: 'Da: return a, b returnează un tuplu. Poți decomprima: x, y = functia().' }
      ]}
    ]
  },
  {
    title: 'Șiruri de caractere în Python: metode și exerciții rezolvate',
    slug: 'siruri-de-caractere-python-exercitii',
    excerpt: 'Ghid complet despre string-uri în Python: indexare, slicing, metode esențiale și exerciții rezolvate pentru clasa 9-10 și bacalaureat.',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80',
    category: 'Programare',
    tags: ['python', 'stringuri', 'siruri', 'exerciții', 'clasa 9'],
    authorName: 'Echipa PyWeb',
    readMinutes: 9,
    content: [
      { type: 'heading', text: 'Ce este un șir de caractere?' },
      { type: 'text', text: 'Un string (șir de caractere) este o secvență de caractere scrisă între ghilimele simple sau duble:\n\n```python\ns1 = "Bună ziua"\ns2 = \'Python e fain\'\ns3 = """Pot\nscrie\npe mai multe linii"""\n```\n\nStringurile sunt **imuabile** — nu poți modifica un caracter direct, ci creezi un string nou.' },
      { type: 'heading', text: 'Indexare și slicing' },
      { type: 'text', text: '```python\ns = "Python"\n\nprint(s[0])    # P — primul caracter\nprint(s[-1])   # n — ultimul caracter\nprint(s[1:4])  # yth — de la index 1 până la 3\nprint(s[:3])   # Pyt — primele 3\nprint(s[3:])   # hon — de la index 3 până la final\nprint(s[::-1]) # nohtyP — inversat\nprint(len(s))  # 6 — lungimea\n```' },
      { type: 'heading', text: 'Metode esențiale' },
      { type: 'text', text: '```python\ns = "  Buna ziua, Python!  "\n\nprint(s.upper())        # "  BUNA ZIUA, PYTHON!  "\nprint(s.lower())        # "  buna ziua, python!  "\nprint(s.strip())        # "Buna ziua, Python!" (elimină spații)\nprint(s.replace("ziua", "dimineata"))  # înlocuire\nprint(s.split(","))     # ["  Buna ziua", " Python!  "]\nprint(s.find("Python")) # indexul unde apare\nprint(s.count("a"))     # numărul de apariții ale lui "a"\nprint(s.startswith("  Buna"))  # True\nprint(s.isdigit())      # False — nu e format doar din cifre\n```' },
      { type: 'heading', text: 'Exerciții rezolvate' },
      { type: 'text', text: '**Ex 1 — Inversarea unui string**\n```python\ns = "Python"\ninversat = s[::-1]\nprint(inversat)  # nohtyP\n```\n\n**Ex 2 — Verificare palindrom**\n```python\ndef palindrom(s):\n    s = s.lower().replace(" ", "")\n    return s == s[::-1]\n\nprint(palindrom("Ana"))     # True\nprint(palindrom("Python"))  # False\nprint(palindrom("A man a plan a canal Panama"))  # True\n```\n\n**Ex 3 — Numărarea vocalelor**\n```python\ndef numar_vocale(s):\n    vocale = "aeiouAEIOU"\n    return sum(1 for c in s if c in vocale)\n\nprint(numar_vocale("Python este fain"))  # 5\n```\n\n**Ex 4 — Cuvinte unice**\n```python\ntext = "ana are mere ana mere are ana"\ncuvinte = text.split()\nunice = sorted(set(cuvinte))\nprint(unice)  # [\'ana\', \'are\', \'mere\']\n```\n\n**Ex 5 — Cel mai lung cuvânt**\n```python\ntext = "Python este un limbaj de programare"\ncuvinte = text.split()\ncel_mai_lung = max(cuvinte, key=len)\nprint(cel_mai_lung)  # programare\n```\n\n**Ex 6 — Formatare string**\n```python\nnume = "Ana"\nnota = 9.75\nprint(f"Elevul {nume} a luat nota {nota:.1f}")  # Elevul Ana a luat nota 9.8\n```' },
      { type: 'faq', items: [
        { question: 'De ce nu pot face s[0] = "A"?', answer: 'Stringurile sunt imuabile în Python. Pentru a "modifica" un caracter, creezi un string nou: s = "A" + s[1:]' },
        { question: 'Cum compar două stringuri?', answer: 'Cu == pentru egalitate, sau < > pentru ordine alfabetică (lexicografică). "ana" < "banana" returnează True.' },
        { question: 'Ce e diferența dintre find() și index()?', answer: 'Ambele returnează poziția unui substring. Diferența: find() returnează -1 dacă nu găsește, index() aruncă ValueError.' }
      ]}
    ]
  },
  {
    title: 'Instrucțiuni repetitive în Python: while și for cu exerciții',
    slug: 'instructiuni-repetitive-python-while-for',
    excerpt: 'Bucle while și for în Python explicate simplu, cu exemple și exerciții rezolvate pentru clasa a 9-a. Ideal pentru pregătirea tezei și a bacalaureatului.',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&q=80',
    category: 'Programare',
    tags: ['python', 'while', 'for', 'bucle', 'clasa 9', 'bacalaureat'],
    authorName: 'Echipa PyWeb',
    readMinutes: 10,
    content: [
      { type: 'heading', text: 'Bucla while' },
      { type: 'text', text: 'Bucla `while` repetă un bloc de cod atâta timp cât o condiție este adevărată.\n\n```python\ni = 1\nwhile i <= 5:\n    print(i)\n    i += 1\n# afișează 1, 2, 3, 4, 5\n```\n\n⚠️ Atenție la bucla infinită! Dacă condiția nu devine False niciodată, programul nu se oprește. Asigură-te că variabila din condiție se modifică în buclă.' },
      { type: 'heading', text: 'Bucla for' },
      { type: 'text', text: '```python\n# Iterare peste o secvență de numere\nfor i in range(1, 6):\n    print(i)  # 1, 2, 3, 4, 5\n\n# range(start, stop, step)\nfor i in range(0, 10, 2):\n    print(i)  # 0, 2, 4, 6, 8\n\n# Iterare peste o listă\nnote = [8, 9, 10, 7]\nfor nota in note:\n    print(nota)\n\n# Iterare cu index\nfor i, nota in enumerate(note):\n    print(f"Nota {i+1}: {nota}")\n```' },
      { type: 'heading', text: 'break și continue' },
      { type: 'text', text: '```python\n# break — oprește bucla complet\nfor i in range(10):\n    if i == 5:\n        break\n    print(i)  # 0, 1, 2, 3, 4\n\n# continue — sare peste iterația curentă\nfor i in range(10):\n    if i % 2 == 0:\n        continue\n    print(i)  # 1, 3, 5, 7, 9\n```' },
      { type: 'heading', text: 'Exerciții rezolvate' },
      { type: 'text', text: '**Ex 1 — Suma numerelor de la 1 la n**\n```python\nn = int(input("n = "))\ns = 0\nfor i in range(1, n+1):\n    s += i\nprint(f"Suma = {s}")  # Formula: n*(n+1)//2\n```\n\n**Ex 2 — Tabloul înmulțirii cu 7**\n```python\nfor i in range(1, 11):\n    print(f"7 x {i} = {7*i}")\n```\n\n**Ex 3 — Ghicește numărul**\n```python\nimport random\nsecret = random.randint(1, 100)\nwhile True:\n    ghicit = int(input("Ghicește: "))\n    if ghicit < secret:\n        print("Prea mic!")\n    elif ghicit > secret:\n        print("Prea mare!")\n    else:\n        print("Corect! 🎉")\n        break\n```\n\n**Ex 4 — Verificare număr prim cu while**\n```python\nn = int(input("n = "))\ni = 2\nprim = True\nwhile i * i <= n:\n    if n % i == 0:\n        prim = False\n        break\n    i += 1\nif n < 2:\n    prim = False\nprint("Prim" if prim else "Nu e prim")\n```\n\n**Ex 5 — Descompunere în factori primi**\n```python\nn = int(input("n = "))\nd = 2\nprint(f"{n} = ", end="")\nwhile n > 1:\n    while n % d == 0:\n        print(d, end="")\n        n //= d\n        if n > 1:\n            print(" × ", end="")\n    d += 1\nprint()\n```' },
      { type: 'faq', items: [
        { question: 'Când folosesc while și când for?', answer: 'Folosești for când știi de câte ori se repetă (de n ori, pentru fiecare element). Folosești while când nu știi — repeți până se îndeplinește o condiție (ex: citești până utilizatorul scrie "stop").' },
        { question: 'Ce face range(5)?', answer: 'Generează numerele 0, 1, 2, 3, 4 — adică 5 numere de la 0. range(1, 6) generează 1, 2, 3, 4, 5.' },
        { question: 'Cum parcurg o listă din spate?', answer: 'Folosești reversed(): for x in reversed(lista) sau slicing: for x in lista[::-1].' }
      ]}
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
