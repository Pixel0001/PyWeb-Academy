import { mc, sa, io } from './helpers.mjs'

export const javascriptModule = {
  slug: 'javascript-fundamentals',
  title: 'JavaScript Fundamentals',
  description: 'Învață JavaScript — limba web-ului. 20 de lecții complete cu probleme practice',
  language: 'javascript',
  order: 2,
  lessons: [
    {
      slug: 'introducere-console-log',
      title: '1. Introducere + console.log()',
      isFree: true,
      theory: `# Bun venit în JavaScript!

JavaScript este **limba web-ului**. Rulează în browser și face paginile interactive.

## Unde rulează?
- **În browser** (Chrome, Firefox) — Console (F12)
- **Pe server** — Node.js
- **În aplicații** — React, Vue, etc.

## console.log()
Afișează ceva în consolă:

\`\`\`javascript
console.log("Salut!");
console.log(42);
console.log("a", "b", "c");
\`\`\`

## Cum testezi?
1. Apasă **F12** în browser
2. Mergi la tab-ul **Console**
3. Scrie cod și apasă Enter
`,
      problems: [
        mc('Ce face console.log?',
          'Care este rolul lui `console.log()`?',
          ['Citește input', 'Afișează în consolă', 'Șterge variabile', 'Pornește serverul'],
          'Afișează în consolă',
          '`console.log()` afișează un mesaj în consola browserului.',
          { topic: 'basics' }),
        mc('Punct și virgulă',
          'Ce caracter se folosește (convențional) la sfârșitul unei instrucțiuni JS?',
          [':', '.', ';', ','],
          ';',
          'În JavaScript, instrucțiunile se termină convențional cu `;`.',
          { topic: 'basics' }),
        sa('Afișează text',
          'Scrie comanda care afișează textul **Hello** în consolă.',
          'console.log("Hello")',
          '`console.log("Hello")` — string-urile între ghilimele duble sau simple.',
          { topic: 'basics' }),
        mc('Tasta dev tools',
          'Ce tastă deschide DevTools în Chrome?',
          ['F1', 'F5', 'F12', 'F10'],
          'F12',
          'F12 deschide **DevTools** în majoritatea browserelor.',
          { topic: 'basics' }),
        sa('Afișează număr',
          'Cum afișezi numărul 100 în consolă?',
          'console.log(100)',
          'Numerele se trec direct, fără ghilimele.',
          { topic: 'basics' }),
      ],
    },
    {
      slug: 'variabile',
      title: '2. Variabile (let, const, var)',
      isFree: true,
      theory: `# Variabile în JavaScript

## Trei moduri de declarare
\`\`\`javascript
let nume = "Ana";       // poate fi modificată
const PI = 3.14;        // constantă, nu se modifică
var x = 10;             // VECHI — evită
\`\`\`

## Tipuri de date
- **number**: \`42\`, \`3.14\`
- **string**: \`"Ana"\`, \`'Ion'\`, \`\`\`backtick\`\`\`
- **boolean**: \`true\`, \`false\`
- **undefined**: nedefinit
- **null**: gol intenționat

## typeof
\`\`\`javascript
console.log(typeof 5);          // "number"
console.log(typeof "abc");      // "string"
console.log(typeof true);       // "boolean"
\`\`\`

## ⚠️ const = nu reasignezi
\`\`\`javascript
const x = 5;
x = 10;   // EROARE!
\`\`\`
`,
      problems: [
        mc('Diferență let/const',
          'Care e diferența principală?',
          ['let e mai rapid', 'const nu poate fi reasignată', 'let e doar pentru numere', 'Sunt identice'],
          'const nu poate fi reasignată',
          '`const` creează o referință care **nu** poate fi reasignată.',
          { topic: 'variables' }),
        mc('Tip',
          'Ce tip are `true`?',
          ['number', 'string', 'boolean', 'bool'],
          'boolean',
          'În JS valoarea logică este de tip `boolean`.',
          { topic: 'variables' }),
        mc('typeof null',
          'Ce returnează `typeof null`?',
          ['"null"', '"undefined"', '"object"', '"none"'],
          '"object"',
          'Aceasta este o **eroare istorică** în JavaScript: `typeof null` returnează `"object"`.',
          { topic: 'variables', difficulty: 'HARD' }),
        sa('Declarare const',
          'Declară o constantă numită `MAX` cu valoarea 100.',
          'const MAX = 100',
          'Folosim `const NUME = valoare;` — convenția este să scriem constantele cu majuscule.',
          { topic: 'variables' }),
        mc('Var vs let',
          'De ce să eviți `var` în cod modern?',
          ['Nu funcționează', 'E mai lent', 'Are scope-ul funcției, nu al blocului', 'Nu acceptă numere'],
          'Are scope-ul funcției, nu al blocului',
          '`var` are funcție-scope, `let`/`const` au block-scope (mai sigur, mai predictibil).',
          { topic: 'variables', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'input-interactiune',
      title: '3. Input + interacțiune (prompt, alert)',
      isFree: false,
      theory: `# Interacțiune cu utilizatorul

## prompt() — citește input
\`\`\`javascript
let nume = prompt("Cum te cheamă?");
console.log("Salut, " + nume);
\`\`\`

⚠️ \`prompt()\` returnează **întotdeauna string**.

## alert() — afișează mesaj
\`\`\`javascript
alert("Bună ziua!");
\`\`\`

## confirm() — Da/Nu
\`\`\`javascript
let raspuns = confirm("Ești sigur?");
if (raspuns) {
    console.log("Da");
} else {
    console.log("Nu");
}
\`\`\`

## Conversie la număr
\`\`\`javascript
let n = Number(prompt("Vârsta: "));
let m = parseInt("42");
let f = parseFloat("3.14");
\`\`\`
`,
      problems: [
        mc('Returnează prompt',
          'Ce tip returnează `prompt()`?',
          ['number', 'string', 'boolean', 'depinde'],
          'string',
          '`prompt()` returnează **întotdeauna string**, indiferent de input.',
          { topic: 'input' }),
        mc('Conversie int',
          'Cum convertești string-ul `"42"` la număr întreg?',
          ['int("42")', 'parseInt("42")', '"42".toInt()', 'toNumber("42")'],
          'parseInt("42")',
          '`parseInt()` convertește string-ul la întreg. Alternativ `Number("42")`.',
          { topic: 'input' }),
        mc('confirm',
          'Ce returnează `confirm()`?',
          ['string', 'number', 'boolean', 'object'],
          'boolean',
          '`confirm()` returnează `true` (OK) sau `false` (Cancel).',
          { topic: 'input' }),
        sa('Citește număr',
          'Scrie linia care cere un număr și-l salvează ca întreg în `n`.',
          'let n = parseInt(prompt())',
          'Combinăm `prompt()` cu `parseInt()` pentru a obține direct un întreg.',
          { topic: 'input' }),
        mc('alert vs console.log',
          'Care e diferența?',
          ['Sunt identice', 'alert e popup, console.log scrie în consolă', 'alert e mai rapid', 'console.log e doar pentru numere'],
          'alert e popup, console.log scrie în consolă',
          '`alert` deschide o fereastră popup; `console.log` doar scrie în consolă (DevTools).',
          { topic: 'input' }),
      ],
    },
    {
      slug: 'operatori-js',
      title: '4. Operatori',
      isFree: false,
      theory: `# Operatori JavaScript

## Aritmetici
| Op | Exemplu | Rezultat |
|----|---------|----------|
| \`+\` \`-\` \`*\` \`/\` | 10/3 | 3.333... |
| \`%\` | 10%3 | 1 |
| \`**\` | 2**3 | 8 |
| \`++\` | x++ | incrementează |
| \`--\` | x-- | decrementează |

## Comparație
| \`==\` | egal **slab** (cu conversie de tip) |
| \`===\` | egal **strict** (recomandat!) |
| \`!=\`, \`!==\` | diferit |
| \`<\`, \`>\`, \`<=\`, \`>=\` | comparații |

## ⚠️ == vs ===
\`\`\`javascript
"5" == 5    // true (face conversie!)
"5" === 5   // false (tipuri diferite)
\`\`\`

**Folosește mereu \`===\`!**
`,
      problems: [
        mc('==  vs  ===',
          'Care e mai sigur?',
          ['==', '===', 'sunt la fel', 'depinde'],
          '===',
          '`===` compară și valoarea ȘI tipul, fără conversie automată — mai sigur și predictibil.',
          { topic: 'operators' }),
        mc('"5" == 5',
          'Ce returnează `"5" == 5`?',
          ['true', 'false', 'undefined', 'eroare'],
          'true',
          '`==` face conversie automată — string-ul "5" devine numărul 5, apoi sunt egali.',
          { topic: 'operators', difficulty: 'MEDIUM' }),
        mc('"5" === 5',
          'Ce returnează `"5" === 5`?',
          ['true', 'false', 'undefined', 'eroare'],
          'false',
          '`===` cere același tip — string ≠ number, deci false.',
          { topic: 'operators', difficulty: 'MEDIUM' }),
        mc('Modulo',
          'Cât e `15 % 4`?',
          ['3', '4', '0', '60'],
          '3',
          '15 = 4·3 + 3, deci restul este 3.',
          { topic: 'operators' }),
        mc('Increment',
          'Ce face `x++`?',
          ['Decrementează x', 'Incrementează x cu 1', 'Înmulțește x cu 2', 'Inversează semnul'],
          'Incrementează x cu 1',
          '`x++` este echivalent cu `x = x + 1`.',
          { topic: 'operators' }),
      ],
    },
    {
      slug: 'if-else-js',
      title: '5. If / Else / Else if',
      isFree: false,
      theory: `# Decizii în JavaScript

\`\`\`javascript
let varsta = 18;

if (varsta >= 18) {
    console.log("Major");
} else if (varsta >= 13) {
    console.log("Adolescent");
} else {
    console.log("Copil");
}
\`\`\`

## Operatori logici
- \`&&\` (AND)
- \`||\` (OR)
- \`!\` (NOT)

\`\`\`javascript
if (varsta >= 18 && arePermis) {
    console.log("Poate conduce");
}
\`\`\`

## Operator ternar (scurtătură)
\`\`\`javascript
let mesaj = (varsta >= 18) ? "Major" : "Minor";
\`\`\`

## Truthy / Falsy
**Falsy**: \`false\`, \`0\`, \`""\`, \`null\`, \`undefined\`, \`NaN\`
**Truthy**: orice altceva
`,
      problems: [
        mc('Sintaxă if',
          'Care e sintaxa corectă?',
          ['if x > 0:', 'if (x > 0) {', 'if x > 0 then', 'if x > 0 do'],
          'if (x > 0) {',
          'În JS, condiția se pune între paranteze rotunde, iar codul în acolade.',
          { topic: 'conditionals' }),
        mc('AND',
          'Cum se scrie AND logic în JS?',
          ['and', '&&', '&', 'AND'],
          '&&',
          'În JavaScript, AND-ul logic este `&&`.',
          { topic: 'conditionals' }),
        mc('Operator ternar',
          'Ce face `x > 0 ? "+" : "-"`?',
          ['Sortează x', 'Returnează "+" dacă x > 0, altfel "-"', 'Eroare', 'Returnează x'],
          'Returnează "+" dacă x > 0, altfel "-"',
          'Operatorul ternar `?:` este un if-else compact ca expresie.',
          { topic: 'conditionals', difficulty: 'MEDIUM' }),
        mc('Falsy',
          'Care valoare NU e falsy?',
          ['0', '""', '"0"', 'null'],
          '"0"',
          'String-ul `"0"` (cu ghilimele) este truthy! Doar valoarea numerică `0` este falsy.',
          { topic: 'conditionals', difficulty: 'HARD' }),
        sa('Condiție',
          'Scrie expresia care verifică dacă `n` este între 1 și 10 (inclusiv).',
          'n >= 1 && n <= 10',
          'Combinăm două condiții cu `&&` (AND logic).',
          { topic: 'conditionals', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'probleme-conditii-js',
      title: '6. Probleme cu condiții',
      isFree: false,
      theory: `# Aplicații cu condiții

## Verifică nota
\`\`\`javascript
let nota = parseFloat(prompt("Nota: "));
if (nota < 5) console.log("Picat");
else if (nota < 7) console.log("Suficient");
else if (nota < 9) console.log("Bine");
else console.log("Excelent");
\`\`\`

## Par sau impar
\`\`\`javascript
let n = parseInt(prompt());
console.log(n % 2 === 0 ? "Par" : "Impar");
\`\`\`

## Verifică login
\`\`\`javascript
let user = prompt("Utilizator:");
let pass = prompt("Parolă:");
if (user === "admin" && pass === "1234") {
    console.log("OK");
} else {
    console.log("Date greșite!");
}
\`\`\`
`,
      problems: [
        mc('Par/impar',
          'Cum verifici dacă `n` e par?',
          ['n / 2 === 0', 'n % 2 === 0', 'n % 2 == "0"', 'isPair(n)'],
          'n % 2 === 0',
          'Restul împărțirii la 2 trebuie să fie 0.',
          { topic: 'conditionals' }),
        mc('Maxim',
          'Care expresie returnează maximul dintre a și b?',
          ['a > b ? a : b', 'a < b ? a : b', 'max(a, b)', 'a + b'],
          'a > b ? a : b',
          'Operatorul ternar verifică dacă a > b și returnează a, altfel b.',
          { topic: 'conditionals', difficulty: 'MEDIUM' }),
        sa('Verifică interval',
          'Expresia care verifică dacă x e între 10 și 20 (exclusiv).',
          'x > 10 && x < 20',
          'Pentru "exclusiv" folosim `>` și `<`, nu `>=`/`<=`.',
          { topic: 'conditionals', difficulty: 'MEDIUM' }),
        mc('Truthy',
          'Ce afișează `if ("hello") console.log("da")`?',
          ['da', 'nimic', 'eroare', 'undefined'],
          'da',
          'Orice string ne-vid este truthy → condiția e adevărată.',
          { topic: 'conditionals', difficulty: 'MEDIUM' }),
        mc('Mai multe condiții',
          'Cum verifici că x e 1 SAU 2 SAU 3?',
          ['x === 1 || 2 || 3', 'x === 1 && 2 && 3', 'x === 1 || x === 2 || x === 3', 'x in [1,2,3]'],
          'x === 1 || x === 2 || x === 3',
          'Trebuie repetată comparația — `x === 1 || 2` nu funcționează cum te-aștepți.',
          { topic: 'conditionals', difficulty: 'HARD' }),
      ],
    },
    {
      slug: 'while-js',
      title: '7. While loop',
      isFree: false,
      theory: `# While în JavaScript

\`\`\`javascript
let i = 1;
while (i <= 5) {
    console.log(i);
    i++;
}
\`\`\`

## do...while
Rulează **măcar o dată**, apoi verifică:
\`\`\`javascript
let n;
do {
    n = parseInt(prompt());
} while (n <= 0);
\`\`\`

## break / continue
\`\`\`javascript
let i = 0;
while (true) {
    i++;
    if (i === 5) continue;  // sare 5
    if (i > 10) break;      // se oprește
    console.log(i);
}
\`\`\`
`,
      problems: [
        mc('Câte iterații?',
          'Câte iterații face `let i=0; while (i<5) i++;`?',
          ['4', '5', '6', '0'],
          '5',
          'i ia valorile 0, 1, 2, 3, 4 → 5 iterații.',
          { topic: 'loops' }),
        mc('do...while',
          'Câte ori rulează cel puțin un do...while?',
          ['0', '1', 'depinde de condiție', 'infinit'],
          '1',
          '`do...while` execută blocul **înainte** de prima verificare → minim 1 dată.',
          { topic: 'loops', difficulty: 'MEDIUM' }),
        mc('Buclă infinită',
          'Care creează buclă infinită?',
          ['while (false)', 'while (true)', 'while (0)', 'while (null)'],
          'while (true)',
          '`true` este mereu adevărat → bucla nu se oprește (decât cu break).',
          { topic: 'loops' }),
        mc('continue',
          'Ce face `continue` într-o buclă?',
          ['Iese din buclă', 'Repornește bucla', 'Trece la următoarea iterație', 'Pune pauză'],
          'Trece la următoarea iterație',
          '`continue` sare codul rămas și începe direct iterația următoare.',
          { topic: 'loops' }),
        sa('Decrement',
          'Scrie operatorul echivalent cu `i = i - 1`.',
          'i--',
          '`i--` (post-decrement) este echivalent cu `i -= 1`.',
          { topic: 'loops' }),
      ],
    },
    {
      slug: 'for-js',
      title: '8. For loop',
      isFree: false,
      theory: `# Bucla for în JS

\`\`\`javascript
for (let i = 0; i < 5; i++) {
    console.log(i);
}
\`\`\`

Trei părți:
1. **Init**: \`let i = 0\`
2. **Condiție**: \`i < 5\`
3. **Pas**: \`i++\`

## Descrescător
\`\`\`javascript
for (let i = 10; i > 0; i--) {
    console.log(i);
}
\`\`\`

## for...of (pentru array-uri)
\`\`\`javascript
const fructe = ["mar", "para"];
for (const f of fructe) {
    console.log(f);
}
\`\`\`

## for...in (pentru obiecte/chei)
\`\`\`javascript
const obj = {a: 1, b: 2};
for (const k in obj) {
    console.log(k, obj[k]);
}
\`\`\`
`,
      problems: [
        mc('Sintaxă for',
          'Care este corectă?',
          ['for (i=0; i<5; i++)', 'for i in range(5)', 'for (let i=0, i<5, i++)', 'for (let i=0; i<5; i++)'],
          'for (let i=0; i<5; i++)',
          'Cele 3 părți sunt separate de `;`, nu de virgulă.',
          { topic: 'loops' }),
        mc('Câte iterații?',
          'Câte iterații `for (let i=1; i<=10; i++)`?',
          ['9', '10', '11', '0'],
          '10',
          'i ia valorile 1, 2, ..., 10 → 10 iterații.',
          { topic: 'loops' }),
        mc('for...of vs for...in',
          'Care iterează prin **valorile** unui array?',
          ['for...in', 'for...of', 'forEach', 'while'],
          'for...of',
          '`for...of` itera prin valori. `for...in` iterează prin chei/indici.',
          { topic: 'loops', difficulty: 'MEDIUM' }),
        mc('Pas descrescător',
          'Pentru a parcurge 10..1, ce folosim?',
          ['i++', 'i--', 'i+=2', 'i-=2'],
          'i--',
          'Decrementăm cu `i--` și pornim de la 10, condiție `i >= 1`.',
          { topic: 'loops' }),
        sa('Iterare 0..9',
          'Scrie partea de inițializare pentru un for care merge de la 0 la 9 (10 iterații).',
          'let i = 0; i < 10; i++',
          'Init `let i=0`, condiție `i<10`, pas `i++`.',
          { topic: 'loops' }),
      ],
    },
    {
      slug: 'for-vs-while-js',
      title: '9. For vs While',
      isFree: false,
      theory: `# Când folosești for vs while?

## **for** — iterații cunoscute
\`\`\`javascript
for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
}
\`\`\`

## **while** — condiție necunoscută
\`\`\`javascript
let n;
while ((n = parseInt(prompt())) !== 0) {
    console.log(n);
}
\`\`\`

## Echivalență
\`\`\`javascript
// for echivalent cu while
for (let i = 0; i < 5; i++) console.log(i);

// echivalent cu:
let i = 0;
while (i < 5) {
    console.log(i);
    i++;
}
\`\`\`

**Regula generală**:
- Iterezi printr-o colecție / număr fix → **for**
- Aștepți o condiție variabilă → **while**
`,
      problems: [
        mc('Iterare fixă',
          'Pentru 100 iterații exacte, ce folosești?',
          ['for', 'while', 'do-while', 'forEach'],
          'for',
          '`for` cu contor e cea mai naturală alegere pentru număr fix de iterații.',
          { topic: 'loops' }),
        mc('Condiție variabilă',
          'Pentru a citi date până la "stop", ce folosești?',
          ['for', 'while', 'switch', 'if'],
          'while',
          'Nu știm câte iterații → `while (true)` cu break sau condiție.',
          { topic: 'loops' }),
        mc('Convertește',
          'Ce e echivalent cu `for (let i=0; i<3; i++)`?',
          [
            'let i=0; while(i<=3) i++;',
            'let i=0; while(i<3) { ...; i++; }',
            'let i=1; while(i<3) i++;',
            'while(0<3) ;'
          ],
          'let i=0; while(i<3) { ...; i++; }',
          'Init i=0, condiție i<3, incrementare în corp.',
          { topic: 'loops', difficulty: 'MEDIUM' }),
        mc('forEach',
          'Ce face metoda `arr.forEach(fn)`?',
          ['Returnează primul element', 'Apelează fn pentru fiecare element', 'Sortează array-ul', 'Inversează'],
          'Apelează fn pentru fiecare element',
          '`forEach` execută o funcție pentru fiecare element din array.',
          { topic: 'loops', difficulty: 'MEDIUM' }),
        sa('Sumă cu while',
          'Inițializare și condiție pentru a calcula 1+2+...+10 cu while.',
          'let i = 1; while (i <= 10)',
          'Pornim de la 1, mergem cât timp i ≤ 10.',
          { topic: 'loops', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'nested-loops-js',
      title: '10. Nested loops',
      isFree: false,
      theory: `# Bucle imbricate

\`\`\`javascript
for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
        console.log(i, j);
    }
}
\`\`\`

## Pattern triunghi
\`\`\`javascript
let s = "";
for (let i = 1; i <= 5; i++) {
    for (let j = 0; j < i; j++) {
        s += "*";
    }
    s += "\\n";
}
console.log(s);
\`\`\`

## Tabla înmulțirii
\`\`\`javascript
for (let i = 1; i <= 10; i++) {
    let row = "";
    for (let j = 1; j <= 10; j++) {
        row += (i*j) + "\\t";
    }
    console.log(row);
}
\`\`\`
`,
      problems: [
        mc('Numărul de iterații',
          'Câte console.log-uri face: 2 bucle imbricate, fiecare 5 iterații?',
          ['10', '25', '5', '7'],
          '25',
          'Bucla externă rulează 5 × bucla internă 5 = 25 iterații.',
          { topic: 'nested-loops', difficulty: 'MEDIUM' }),
        mc('Performanță',
          'Care este complexitatea pentru 2 bucle imbricate de N iterații fiecare?',
          ['O(N)', 'O(N²)', 'O(log N)', 'O(1)'],
          'O(N²)',
          'N · N = N² operații → complexitate pătratică.',
          { topic: 'nested-loops', difficulty: 'HARD' }),
        mc('Variabile separate',
          'În bucle imbricate, variabilele de control trebuie să fie:',
          ['identice', 'diferite', 'globale', 'undefined'],
          'diferite',
          'Folosim variabile diferite (ex: i pentru externă, j pentru internă) ca să nu se suprascrie.',
          { topic: 'nested-loops' }),
        sa('Pătrat 4×4',
          'Ce returnează: pentru i=1..4, pentru j=1..4 sumează i*j? (totalul, scrie un singur număr)',
          '100',
          'Suma (1+2+3+4)·(1+2+3+4) = 10·10 = 100.',
          { topic: 'nested-loops', difficulty: 'HARD' }),
        mc('Break în nested',
          'Un `break` într-o buclă internă întrerupe:',
          ['Doar bucla internă', 'Ambele bucle', 'Programul', 'Funcția'],
          'Doar bucla internă',
          '`break` iese din **bucla cea mai apropiată**, nu din toate.',
          { topic: 'nested-loops', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'arrays-introducere',
      title: '11. Arrays (introducere)',
      isFree: false,
      theory: `# Arrays

Un **array** este o listă ordonată de valori.

\`\`\`javascript
const fructe = ["mar", "banana", "para"];
const numere = [1, 2, 3, 4, 5];
\`\`\`

## Acces (indexare de la 0)
\`\`\`javascript
console.log(fructe[0]);       // mar
console.log(fructe[2]);       // para
console.log(fructe.length);   // 3
\`\`\`

## Modificare
\`\`\`javascript
fructe[1] = "kiwi";
\`\`\`

## Ultim element
\`\`\`javascript
console.log(fructe[fructe.length - 1]);
// sau (modern):
console.log(fructe.at(-1));
\`\`\`
`,
      problems: [
        mc('Indexare',
          'De la ce index încep array-urile?',
          ['1', '0', '-1', '2'],
          '0',
          'Ca în majoritatea limbajelor, indexarea în JS începe de la **0**.',
          { topic: 'arrays' }),
        mc('Lungime',
          'Cum afli numărul de elemente?',
          ['arr.size', 'arr.length', 'arr.count', 'len(arr)'],
          'arr.length',
          'În JS folosim proprietatea `.length` (fără paranteze).',
          { topic: 'arrays' }),
        mc('Acces',
          'Care e `["a","b","c"][1]`?',
          ['"a"', '"b"', '"c"', 'undefined'],
          '"b"',
          'Indexul 1 = al doilea element (numărăm de la 0).',
          { topic: 'arrays' }),
        sa('Creează array',
          'Creează const numit `nums` cu valorile 10, 20, 30.',
          'const nums = [10, 20, 30]',
          'Folosim paranteze pătrate cu valori separate de virgulă.',
          { topic: 'arrays' }),
        mc('Index out of bounds',
          'Ce returnează `["a","b"][5]`?',
          ['""', 'null', 'undefined', 'eroare'],
          'undefined',
          'JavaScript returnează `undefined` pentru indici invalizi (nu aruncă eroare).',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'arrays-operatii',
      title: '12. Arrays — operații',
      isFree: false,
      theory: `# Operații pe arrays

## Adăugare
\`\`\`javascript
arr.push(x);       // la final
arr.unshift(x);    // la început
\`\`\`

## Ștergere
\`\`\`javascript
arr.pop();          // ultimul
arr.shift();        // primul
arr.splice(2, 1);   // 1 element de la indexul 2
\`\`\`

## Sortare
\`\`\`javascript
arr.sort();
arr.sort((a, b) => a - b);   // numeric crescător
arr.reverse();
\`\`\`

## Verificare
\`\`\`javascript
arr.includes(x);     // true/false
arr.indexOf(x);      // index sau -1
\`\`\`

## ⚠️ sort() implicit e alfabetic!
\`\`\`javascript
[10, 2, 30].sort();   // [10, 2, 30] greșit!
[10, 2, 30].sort((a, b) => a - b);   // [2, 10, 30]
\`\`\`
`,
      problems: [
        mc('push',
          'Ce face `arr.push(x)`?',
          ['Adaugă x la început', 'Adaugă x la final', 'Înlocuiește primul cu x', 'Sortează'],
          'Adaugă x la final',
          '`push` adaugă la sfârșitul array-ului.',
          { topic: 'arrays' }),
        mc('shift',
          'Ce face `arr.shift()`?',
          ['Adaugă la început', 'Scoate primul element', 'Scoate ultimul', 'Inversează'],
          'Scoate primul element',
          '`shift` îl scoate și-l returnează pe primul.',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
        mc('Sort numeric',
          'Cum sortezi `[10, 2, 30]` numeric?',
          ['arr.sort()', 'arr.sort((a,b)=>a-b)', 'arr.sortNum()', 'arr.numericSort()'],
          'arr.sort((a,b)=>a-b)',
          'Sort implicit compară ca string-uri. Trebuie funcție de comparare numerică.',
          { topic: 'arrays', difficulty: 'HARD' }),
        mc('includes',
          'Ce returnează `[1,2,3].includes(2)`?',
          ['true', 'false', '2', '1'],
          'true',
          '`includes` verifică prezența și returnează boolean.',
          { topic: 'arrays' }),
        sa('Adaugă la final',
          'Cum adaugi 99 la finalul array-ului `arr`?',
          'arr.push(99)',
          '`push()` este metoda standard pentru adăugare la final.',
          { topic: 'arrays' }),
      ],
    },
    {
      slug: 'arrays-loop',
      title: '13. Arrays + loop',
      isFree: false,
      theory: `# Parcurgere array

## Cu for clasic
\`\`\`javascript
for (let i = 0; i < arr.length; i++) {
    console.log(arr[i]);
}
\`\`\`

## Cu for...of
\`\`\`javascript
for (const x of arr) {
    console.log(x);
}
\`\`\`

## Cu forEach
\`\`\`javascript
arr.forEach((x, i) => console.log(i, x));
\`\`\`

## map, filter, reduce
\`\`\`javascript
const dubluri = arr.map(x => x * 2);
const pozitive = arr.filter(x => x > 0);
const suma = arr.reduce((s, x) => s + x, 0);
\`\`\`
`,
      problems: [
        mc('map',
          'Ce face `arr.map(fn)`?',
          ['Modifică array-ul existent', 'Creează unul nou cu fn aplicat la fiecare element', 'Sortează', 'Returnează doar primul element'],
          'Creează unul nou cu fn aplicat la fiecare element',
          '`map` returnează un **nou** array — nu modifică originalul.',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
        mc('filter',
          'Ce face `arr.filter(fn)`?',
          ['Returnează elementele pentru care fn e adevărată', 'Sortează', 'Numără elementele', 'Inversează'],
          'Returnează elementele pentru care fn e adevărată',
          '`filter` păstrează doar elementele care trec testul `fn`.',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
        mc('reduce',
          'Ce returnează `[1,2,3].reduce((s, x) => s + x, 0)`?',
          ['1', '6', '0', '[1,2,3]'],
          '6',
          '0 + 1 + 2 + 3 = 6 — `reduce` agregă valorile.',
          { topic: 'arrays', difficulty: 'HARD' }),
        mc('forEach return',
          'Ce returnează `arr.forEach()`?',
          ['Un nou array', 'Lungimea', 'undefined', 'true'],
          'undefined',
          '`forEach` doar iterează — nu returnează nimic util.',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
        sa('Sumă',
          'Care metodă e ideală pentru a calcula suma elementelor?',
          'reduce',
          '`reduce` agregă elementele într-o singură valoare.',
          { topic: 'arrays', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'algoritmi-js',
      title: '14. Algoritmi simpli',
      isFree: false,
      theory: `# Algoritmi de bază

## Maxim
\`\`\`javascript
let max = arr[0];
for (const x of arr) if (x > max) max = x;
// sau:
const max2 = Math.max(...arr);
\`\`\`

## Minim
\`\`\`javascript
const min = Math.min(...arr);
\`\`\`

## Sumă
\`\`\`javascript
const s = arr.reduce((a, b) => a + b, 0);
\`\`\`

## Căutare
\`\`\`javascript
const idx = arr.indexOf(x);   // -1 dacă nu există
const exists = arr.includes(x);
\`\`\`

## Numărare
\`\`\`javascript
const cate = arr.filter(x => x > 0).length;
\`\`\`
`,
      problems: [
        mc('Math.max',
          'Ce returnează `Math.max(3, 7, 2)`?',
          ['3', '7', '2', '12'],
          '7',
          '`Math.max` returnează cea mai mare valoare dintre argumente.',
          { topic: 'algorithms' }),
        mc('Spread',
          'Ce face `Math.max(...[1,2,3])`?',
          ['Eroare', 'Returnează 3', 'Returnează [1,2,3]', 'Returnează 6'],
          'Returnează 3',
          '`...` desface array-ul în argumente individuale: `Math.max(1, 2, 3)`.',
          { topic: 'algorithms', difficulty: 'MEDIUM' }),
        mc('Sumă cu reduce',
          'Ce dă `[1,2,3,4].reduce((a,b)=>a+b, 0)`?',
          ['10', '24', '4', '0'],
          '10',
          '0+1+2+3+4 = 10.',
          { topic: 'algorithms', difficulty: 'MEDIUM' }),
        mc('Numărare',
          'Cum numeri câte numere pozitive sunt în `arr`?',
          ['arr.length', 'arr.filter(x=>x>0).length', 'arr.count(x>0)', 'arr.size'],
          'arr.filter(x=>x>0).length',
          'Filtrează pozitivele și ia lungimea.',
          { topic: 'algorithms', difficulty: 'MEDIUM' }),
        mc('indexOf nu există',
          'Ce returnează `[1,2,3].indexOf(99)`?',
          ['null', '0', '-1', 'undefined'],
          '-1',
          'Convenția: -1 înseamnă "nu s-a găsit".',
          { topic: 'algorithms' }),
      ],
    },
    {
      slug: 'string-uri-js',
      title: '15. String-uri',
      isFree: false,
      theory: `# String-uri în JS

## Metode utile
\`\`\`javascript
let s = "Hello World";
s.length;              // 11
s.toUpperCase();       // "HELLO WORLD"
s.toLowerCase();
s.slice(0, 5);         // "Hello"
s.split(" ");          // ["Hello", "World"]
s.replace("World", "JS"); // "Hello JS"
s.includes("World");   // true
s.indexOf("o");        // 4
\`\`\`

## Template literals (backticks)
\`\`\`javascript
const nume = "Ana";
console.log(\`Salut, \${nume}!\`);
console.log(\`1 + 1 = \${1 + 1}\`);
\`\`\`

## Concatenare
\`\`\`javascript
"a" + "b"              // "ab"
"a".concat("b")        // "ab"
\`\`\`
`,
      problems: [
        mc('toUpperCase',
          'Ce returnează `"abc".toUpperCase()`?',
          ['ABC', 'Abc', 'abc', 'aBC'],
          'ABC',
          'Convertește tot string-ul în majuscule.',
          { topic: 'strings' }),
        mc('Template literal',
          'Ce caracter delimitează un template literal?',
          ['"', "'", '`', '/'],
          '`',
          'Template literals folosesc **backtick** (` ` `) — permit `${expr}` interior.',
          { topic: 'strings' }),
        mc('slice',
          'Ce returnează `"Hello".slice(1, 3)`?',
          ['He', 'el', 'ell', 'Hel'],
          'el',
          'slice(1, 3) → de la indexul 1 (inclusiv) la 3 (exclusiv) → "el".',
          { topic: 'strings', difficulty: 'MEDIUM' }),
        mc('Concat',
          'Ce returnează `"a" + "b"`?',
          ['"ab"', '"ba"', 'NaN', 'eroare'],
          '"ab"',
          '`+` cu string-uri face concatenare (lipire).',
          { topic: 'strings' }),
        sa('Lungime',
          'Cum afli numărul de caractere ale string-ului `s`?',
          's.length',
          'Proprietatea `.length` (fără paranteze).',
          { topic: 'strings' }),
      ],
    },
    {
      slug: 'obiecte-js',
      title: '16. Obiecte',
      isFree: false,
      theory: `# Obiecte (key → value)

\`\`\`javascript
const elev = {
    nume: "Ana",
    varsta: 12,
    clasa: 6
};
\`\`\`

## Acces
\`\`\`javascript
console.log(elev.nume);       // dot notation
console.log(elev["nume"]);    // bracket notation
\`\`\`

## Modificare / adăugare
\`\`\`javascript
elev.varsta = 13;
elev.scoala = "X";   // adaugă proprietate nouă
\`\`\`

## Ștergere
\`\`\`javascript
delete elev.clasa;
\`\`\`

## Iterare
\`\`\`javascript
for (const k in elev) {
    console.log(k, elev[k]);
}

Object.keys(elev);     // ["nume","varsta","clasa"]
Object.values(elev);
Object.entries(elev);  // [["nume","Ana"], ...]
\`\`\`
`,
      problems: [
        mc('Acces',
          'Care SUNT corecte pentru a accesa `obj.x`? (alege singura)',
          ['obj.x', 'obj->x', 'obj@x', 'obj~x'],
          'obj.x',
          'Notația cu **punct** este standard pentru chei valide.',
          { topic: 'objects' }),
        mc('Adăugare proprietate',
          'Cum adaugi proprietatea `nou` cu valoarea 5 obiectului `obj`?',
          ['obj.add("nou", 5)', 'obj.nou = 5', 'obj["nou"].push(5)', 'obj += {nou:5}'],
          'obj.nou = 5',
          'Atribuirea la o cheie inexistentă o creează automat.',
          { topic: 'objects' }),
        mc('Ștergere',
          'Cum ștergi proprietatea `x` din `obj`?',
          ['obj.x = null', 'delete obj.x', 'obj.remove("x")', 'obj["x"] = undefined'],
          'delete obj.x',
          'Operatorul `delete` șterge complet proprietatea.',
          { topic: 'objects', difficulty: 'MEDIUM' }),
        mc('Object.keys',
          'Ce returnează `Object.keys({a:1, b:2})`?',
          ['[1, 2]', '["a", "b"]', '{a, b}', '"ab"'],
          '["a", "b"]',
          '`Object.keys` returnează un array cu **numele** cheilor.',
          { topic: 'objects', difficulty: 'MEDIUM' }),
        sa('Bracket access',
          'Cum acceși cheia stocată în variabila `cheie` din obiectul `o`?',
          'o[cheie]',
          'Folosim **bracket notation** când cheia este în variabilă.',
          { topic: 'objects', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'functii-basic-js',
      title: '17. Funcții (basic)',
      isFree: false,
      theory: `# Funcții — reutilizarea codului

## Function declaration
\`\`\`javascript
function aduna(a, b) {
    return a + b;
}
console.log(aduna(3, 4));   // 7
\`\`\`

## Function expression
\`\`\`javascript
const aduna = function(a, b) {
    return a + b;
};
\`\`\`

## Default params
\`\`\`javascript
function saluta(nume = "prietene") {
    console.log("Salut, " + nume);
}
saluta();        // Salut, prietene
saluta("Ana");
\`\`\`

## Funcții fără return
Returnează \`undefined\`.
`,
      problems: [
        mc('Cuvânt cheie',
          'Cu ce cuvânt cheie definești o funcție clasică?',
          ['def', 'function', 'func', 'fn'],
          'function',
          'În JS: `function nume(params) { ... }`.',
          { topic: 'functions' }),
        mc('Return',
          'Ce returnează o funcție fără `return`?',
          ['null', 'undefined', '0', 'false'],
          'undefined',
          'Funcțiile fără return explicit returnează `undefined`.',
          { topic: 'functions', difficulty: 'MEDIUM' }),
        mc('Default param',
          'Ce afișează: `function f(x=5){return x*2} f()`?',
          ['NaN', '10', '5', 'undefined'],
          '10',
          'Fără argument, x = 5 (default), 5 * 2 = 10.',
          { topic: 'functions', difficulty: 'MEDIUM' }),
        sa('Apel',
          'Cum apelezi funcția `dublu` cu argumentul 5?',
          'dublu(5)',
          'Numele funcției + paranteze cu argumentele.',
          { topic: 'functions' }),
        mc('Multiple param',
          'Cum trimiți 3 argumente unei funcții?',
          ['fn(1,2,3)', 'fn(1)(2)(3)', 'fn[1,2,3]', 'fn 1 2 3'],
          'fn(1,2,3)',
          'Argumentele sunt separate de virgulă, în paranteze.',
          { topic: 'functions' }),
      ],
    },
    {
      slug: 'functii-avansat-js',
      title: '18. Funcții avansate (arrow + callbacks)',
      isFree: false,
      theory: `# Arrow functions

\`\`\`javascript
const aduna = (a, b) => a + b;
const patrat = x => x * x;
const saluta = () => console.log("Salut!");
\`\`\`

## Diferență față de function
- Sintaxă mai scurtă
- **Nu au propriul \`this\`**
- Nu pot fi folosite ca constructori

## Callbacks
O funcție trimisă **ca argument** altei funcții.

\`\`\`javascript
function executa(callback) {
    callback("Salut!");
}

executa(msg => console.log(msg));
\`\`\`

## Exemple uzuale
\`\`\`javascript
[1,2,3].map(x => x * 2);
[1,2,3].filter(x => x > 1);
setTimeout(() => console.log("after"), 1000);
\`\`\`
`,
      problems: [
        mc('Sintaxă arrow',
          'Care e o arrow function corectă?',
          ['x = (a, b) => a + b', 'function => (a,b) a+b', 'arrow(a,b) = a+b', '(a,b) -> a+b'],
          'x = (a, b) => a + b',
          'Sintaxa: `(parametri) => expresie` sau `(p) => { ... return ... }`.',
          { topic: 'functions' }),
        mc('Un singur param',
          'Pentru un singur parametru, parantezele sunt:',
          ['Obligatorii', 'Opționale', 'Interzise', 'Doar pentru numere'],
          'Opționale',
          '`x => x*2` și `(x) => x*2` sunt echivalente. Pentru 0 sau 2+ parametri sunt obligatorii.',
          { topic: 'functions', difficulty: 'MEDIUM' }),
        mc('Callback',
          'Un **callback** este:',
          ['O variabilă globală', 'O funcție trimisă ca argument', 'Un tip de eroare', 'Un loop'],
          'O funcție trimisă ca argument',
          'Callback-urile permit cod asincron și pattern-uri funcționale.',
          { topic: 'functions', difficulty: 'MEDIUM' }),
        mc('this',
          'Arrow functions au propriul `this`?',
          ['Da', 'Nu', 'Doar în clase', 'Doar în obiecte'],
          'Nu',
          'Arrow functions **moștenesc** `this` din scope-ul exterior.',
          { topic: 'functions', difficulty: 'HARD' }),
        sa('Map dublu',
          'Care expresie cu map face dublu fiecare element din `arr`?',
          'arr.map(x => x * 2)',
          '`map` aplică funcția pe fiecare element și returnează un array nou.',
          { topic: 'functions', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'erori-js',
      title: '19. Erori (try/catch)',
      isFree: false,
      theory: `# Try / Catch

\`\`\`javascript
try {
    let n = parseInt(prompt());
    if (isNaN(n)) throw new Error("Nu e număr!");
    console.log(10 / n);
} catch (e) {
    console.log("Eroare:", e.message);
} finally {
    console.log("Gata");
}
\`\`\`

## throw — aruncă erori
\`\`\`javascript
function imparte(a, b) {
    if (b === 0) throw new Error("Împărțire la 0!");
    return a / b;
}
\`\`\`

## Tipuri comune
- \`TypeError\` — operație pe tip greșit
- \`ReferenceError\` — variabilă nedeclarată
- \`SyntaxError\` — cod invalid

## isNaN
\`\`\`javascript
isNaN("abc")     // true
isNaN("123")     // false
\`\`\`
`,
      problems: [
        mc('Cuvânt cheie',
          'Ce cuvânt cheie aruncă o eroare manual?',
          ['error', 'throw', 'raise', 'panic'],
          'throw',
          'În JS folosim `throw new Error(...)`.',
          { topic: 'errors' }),
        mc('catch',
          'Ce face blocul `catch (e)`?',
          ['Aruncă o eroare', 'Prinde eroarea în variabila `e`', 'Iese din funcție', 'Repornește try'],
          'Prinde eroarea în variabila `e`',
          '`catch` interceptează erorile aruncate în try.',
          { topic: 'errors' }),
        mc('isNaN',
          'Ce returnează `isNaN("abc")`?',
          ['true', 'false', 'eroare', 'undefined'],
          'true',
          'String-ul "abc" nu poate fi convertit la număr → NaN → isNaN = true.',
          { topic: 'errors', difficulty: 'MEDIUM' }),
        mc('finally',
          'Când rulează `finally`?',
          ['Doar pe succes', 'Doar pe eroare', 'Mereu', 'Niciodată'],
          'Mereu',
          '`finally` rulează indiferent dacă a fost eroare sau nu.',
          { topic: 'errors' }),
        mc('parseInt cu NaN',
          'Ce returnează `parseInt("abc")`?',
          ['0', 'NaN', 'eroare', 'null'],
          'NaN',
          'Când conversia eșuează, parseInt returnează `NaN` (Not a Number).',
          { topic: 'errors', difficulty: 'MEDIUM' }),
      ],
    },
    {
      slug: 'dom',
      title: '20. DOM (IMPORTANT)',
      isFree: false,
      theory: `# DOM — Document Object Model

DOM este **arborele HTML** al paginii. JS îl poate citi și modifica.

## Selectare elemente
\`\`\`javascript
const titlu = document.querySelector("h1");
const buton = document.querySelector(".btn");
const elem = document.getElementById("main");
const toate = document.querySelectorAll("p");
\`\`\`

## Modificare conținut
\`\`\`javascript
titlu.textContent = "Titlu nou";
titlu.innerHTML = "<b>Bold</b>";
\`\`\`

## Modificare stil
\`\`\`javascript
titlu.style.color = "red";
titlu.style.fontSize = "30px";
titlu.classList.add("activ");
\`\`\`

## Click events
\`\`\`javascript
buton.addEventListener("click", () => {
    alert("Apăsat!");
});
\`\`\`

## Atribute
\`\`\`javascript
img.setAttribute("src", "img.jpg");
\`\`\`
`,
      problems: [
        mc('Selectare după ID',
          'Cum selectezi elementul cu id="main"?',
          ['document.querySelector("main")', 'document.getElementById("main")', 'document.id("main")', 'document.find("main")'],
          'document.getElementById("main")',
          'Pentru ID se folosește `getElementById` (sau `querySelector("#main")`).',
          { topic: 'dom' }),
        mc('Schimbă text',
          'Cum schimbi textul unui element?',
          ['el.text = ...', 'el.textContent = ...', 'el.value = ...', 'el.label = ...'],
          'el.textContent = ...',
          '`textContent` schimbă textul afișat. (`innerHTML` interpretează HTML.)',
          { topic: 'dom', difficulty: 'MEDIUM' }),
        mc('Click',
          'Cum atașezi un click handler?',
          ['el.click(fn)', 'el.on("click", fn)', 'el.addEventListener("click", fn)', 'el.handleClick(fn)'],
          'el.addEventListener("click", fn)',
          '`addEventListener` este modul standard în JS modern.',
          { topic: 'dom', difficulty: 'MEDIUM' }),
        mc('querySelectorAll',
          'Ce returnează `querySelectorAll(".item")`?',
          ['Primul element', 'Un array', 'Un NodeList cu toate elementele', 'undefined'],
          'Un NodeList cu toate elementele',
          '`querySelectorAll` returnează un **NodeList** (similar cu un array).',
          { topic: 'dom', difficulty: 'HARD' }),
        sa('Stil culoare',
          'Cum schimbi culoarea elementului `el` la roșu?',
          'el.style.color = "red"',
          'Accesăm `style.color` și-i atribuim valoarea CSS.',
          { topic: 'dom', difficulty: 'MEDIUM' }),
      ],
    },
  ],
}
