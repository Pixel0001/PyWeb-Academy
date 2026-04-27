import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import CourseDetailClient from './CourseDetailClient'

export const revalidate = 60

export async function generateStaticParams() {
  const courses = await prisma.course.findMany({
    where: { active: true },
    select: { slug: true },
  })
  return courses.map(c => ({ slug: c.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { title: true, descriptionShort: true, mainImageUrl: true, imageUrl: true },
  })
  if (!course) return { title: 'Curs negasit - PyWeb Academy' }
  const img = course.mainImageUrl || course.imageUrl
  return {
    title: course.title + ' - PyWeb Academy',
    description: course.descriptionShort,
    openGraph: {
      title: course.title + ' - PyWeb Academy',
      description: course.descriptionShort,
      images: img ? [img] : [],
    },
  }
}

export default async function CoursePage({ params }) {
  const { slug } = await params

  const [course, allCourses] = await Promise.all([
    prisma.course.findUnique({ where: { slug } }),
    prisma.course.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        title: true,
        descriptionShort: true,
        level: true,
        price: true,
        discountPrice: true,
        mainImageUrl: true,
        imageUrl: true,
        images: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  if (!course || !course.active) {
    notFound()
  }

  const otherCourses = allCourses.filter(c => c.slug !== slug)

  return (
    <>
      <Navbar forceOpaque />
      <CourseDetailClient course={course} allCourses={otherCourses} />
      <Footer />
    </>
  )
}
