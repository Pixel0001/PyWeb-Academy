import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const reviews = [
  {
    authorName: 'Elena Popa',
    roleLabel: 'Mama lui Radu, 12 ani',
    rating: 5,
    message: 'Copilul meu adoră cursurile de programare! Profesorii sunt excelenți și metodele de predare sunt adaptate perfect pentru copii. În doar 3 luni a creat primul său joc în Python.',
    published: true,
  },
  {
    authorName: 'Andrei Mihalache',
    roleLabel: 'Tatăl Sofiei, 13 ani',
    rating: 5,
    message: 'Am fost plăcut surprins de calitatea cursurilor. Grupele mici fac o diferență uriașă — instructorul acordă atenție fiecărui copil. Sofia progresează vizibil de la o săptămână la alta.',
    published: true,
  },
  {
    authorName: 'Cristina Rusu',
    roleLabel: 'Mama lui Mihai, 11 ani',
    rating: 5,
    message: 'La început eram sceptică, dar după prima lecție gratuită, Mihai nu mai vroia să plece. Acum visează să devină programator. Recomand cu toată încrederea oricărui părinte!',
    published: true,
  },
  {
    authorName: 'Maria Ionescu',
    roleLabel: 'Mama lui Alexandru, 14 ani',
    rating: 5,
    message: 'Fiul meu a încercat mai multe cursuri online, dar nimic nu se compară cu PyWeb Academy. Abordarea practică, proiectele reale și atmosfera prietenoasă îl motivează enorm.',
    published: true,
  },
  {
    authorName: 'Victor Georgescu',
    roleLabel: 'Tatăl Anei, 10 ani',
    rating: 5,
    message: 'Prima lecție gratuită ne-a convins imediat. Ana a venit acasă entuziasmată și a vrut să exerseze tot restul zilei. Recomand PyWeb Academy oricui vrea să ofere copilului un start în IT.',
    published: true,
  },
  {
    authorName: 'Ioana Constantin',
    roleLabel: 'Mama lui Luca, 15 ani',
    rating: 4,
    message: 'Cursurile sunt bine structurate și profesorii sunt răbdători. Luca a învățat HTML, CSS și acum lucrează la primul lui site. Suntem mulțumiți de progresul lui.',
    published: true,
  },
]

async function main() {
  console.log('🌱 Seeding reviews...')

  // Delete existing reviews
  await prisma.review.deleteMany()
  console.log('🗑️  Cleared existing reviews')

  // Create new reviews
  const created = await prisma.review.createMany({ data: reviews })
  console.log(`✅ Created ${created.count} reviews`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
