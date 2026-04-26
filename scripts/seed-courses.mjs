import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const courses = [
  {
    title: 'Python Fundamentals',
    slug: 'python-fundamentals',
    descriptionShort: 'Variabile, funcții, bucle și proiecte reale. Baza oricărei cariere în tech.',
    descriptionLong: 'Cursul de Python Fundamentals este primul pas în lumea programării. Elevii vor învăța conceptele de bază ale programării: variabile, tipuri de date, structuri de control, funcții și programare orientată pe obiecte. La final, fiecare elev va construi un proiect real.',
    level: 'Începător',
    ageMin: 12,
    ageMax: 16,
    duration: '6 luni',
    lessonsCount: 24,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80'],
  },
  {
    title: 'HTML, CSS & JavaScript',
    slug: 'html-css-js',
    descriptionShort: 'De la prima pagină HTML la animații CSS și interactivitate JavaScript. Portofoliu live inclus.',
    descriptionLong: 'Cursul acoperă fundațiile web-ului modern: structurare cu HTML5, stilizare cu CSS3 și interactivitate cu JavaScript. Elevii vor construi pagini web reale și un portofoliu personal pe care îl pot arăta oricui.',
    level: 'Începător',
    ageMin: 12,
    ageMax: 16,
    duration: '6 luni',
    lessonsCount: 24,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1621839673705-6617adf9e890?w=800&q=80'],
  },
  {
    title: 'C++ Programming',
    slug: 'cpp-programming',
    descriptionShort: 'Limbajul din spatele jocurilor AAA, sistemelor embedded și aplicațiilor de înaltă performanță.',
    descriptionLong: 'C++ este unul dintre cele mai puternice limbaje de programare. În acest curs elevii vor învăța pointeri, gestionarea memoriei, OOP, STL și algoritmi. Perfect pentru cei care vor să ajungă la competiții de informatică sau să lucreze în game dev.',
    level: 'Intermediar',
    ageMin: 13,
    ageMax: 18,
    duration: '6 luni',
    lessonsCount: 24,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80'],
  },
  {
    title: 'React Development',
    slug: 'react-development',
    descriptionShort: 'Componente, hooks, state management și aplicații SPA complete. Cel mai căutat framework front-end.',
    descriptionLong: 'React este framework-ul front-end numărul 1 în industrie. Elevii vor învăța să construiască interfețe moderne cu componente, hooks, Context API și React Router. La final vor livra o aplicație SPA completă.',
    level: 'Intermediar',
    ageMin: 14,
    ageMax: 18,
    duration: '6 luni',
    lessonsCount: 24,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80'],
  },
  {
    title: 'Next.js Full-Stack',
    slug: 'nextjs-fullstack',
    descriptionShort: 'Server-side rendering, API routes, autentificare și deploy. Aplicații web complete de nivel profesional.',
    descriptionLong: 'Next.js combină puterea React cu un server Node.js integrat. Elevii vor învăța SSR, SSG, API Routes, autentificare cu NextAuth, baze de date și deploy pe Vercel. Cel mai complet curs pentru web development modern.',
    level: 'Avansat',
    ageMin: 15,
    ageMax: 18,
    duration: '6 luni',
    lessonsCount: 24,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=800&q=80'],
  },
  {
    title: 'React + Tailwind CSS',
    slug: 'tailwind-ui-design',
    descriptionShort: 'Creează interfețe frumoase cu Tailwind CSS și componente React reutilizabile. Design system complet.',
    descriptionLong: 'Tailwind CSS revoluționează modul în care scriem stiluri. Combinat cu React, devine o unealtă extrem de productivă. Elevii vor construi un design system complet cu componente reutilizabile, animații și design responsiv.',
    level: 'Intermediar',
    ageMin: 13,
    ageMax: 18,
    duration: '4 luni',
    lessonsCount: 16,
    price: 0,
    seatsTotal: 10,
    active: true,
    mainImageUrl: 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=800&q=80',
    images: ['https://images.unsplash.com/photo-1545670723-196ed0954986?w=800&q=80'],
  },
]

async function main() {
  console.log('🌱 Seeding courses...\n')

  let created = 0
  let skipped = 0

  for (const course of courses) {
    const existing = await prisma.course.findUnique({ where: { slug: course.slug } })
    if (existing) {
      console.log(`⏭️  Skip (already exists): ${course.title}`)
      skipped++
      continue
    }
    await prisma.course.create({ data: course })
    console.log(`✅ Created: ${course.title}`)
    created++
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
