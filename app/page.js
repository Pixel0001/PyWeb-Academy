import prisma from '@/lib/prisma'
import HomePage from '@/components/public/HomePage'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'

export const metadata = {
  title: 'PyWeb Academy - Cursuri de Programare pentru Copii (10–16 ani)',
  description: 'Copilul tău învață Python și creează jocuri și site-uri reale. Grupe mici, profesori cu experiență, program pe 3 ani. Prima lecție GRATUITĂ!',
}

export default async function Home() {
  const [dbCourses, dbReviews] = await Promise.all([
    prisma.course.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        title: true,
        slug: true,
        descriptionShort: true,
        level: true,
        ageMin: true,
        ageMax: true,
        duration: true,
        lessonsCount: true,
        price: true,
        discountPrice: true,
        seatsTotal: true,
        mainImageUrl: true,
        imageUrl: true,
      },
    }),
    prisma.review.findMany({
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        authorName: true,
        roleLabel: true,
        rating: true,
        message: true,
        avatarUrl: true,
      },
    }),
  ])

  return (
    <>
      <Navbar />
      <HomePage courses={dbCourses} reviews={dbReviews} />
      <Footer />
    </>
  )
}

