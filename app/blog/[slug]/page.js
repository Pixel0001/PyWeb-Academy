import { notFound } from 'next/navigation'
import prisma from '@/lib/prisma'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import BlogDetailPage from '@/components/public/BlogDetailPage'

export const revalidate = 60

export async function generateStaticParams() {
  const blogs = await prisma.blog.findMany({
    where: { published: true },
    select: { slug: true },
  })
  return blogs.map(b => ({ slug: b.slug }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const blog = await prisma.blog.findUnique({
    where: { slug },
    select: { title: true, seoTitle: true, excerpt: true, seoDescription: true, coverImage: true }
  })
  if (!blog) return { title: 'Articol negăsit - PyWeb Academy' }
  const title = (blog.seoTitle || blog.title) + ' - PyWeb Blog'
  const description = blog.seoDescription || blog.excerpt || 'Articol PyWeb Academy'
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: blog.coverImage ? [blog.coverImage] : [],
      type: 'article',
    },
  }
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params

  const blog = await prisma.blog.findUnique({ where: { slug } })
  if (!blog || !blog.published) notFound()

  // Fetch recommended in parallel
  const [recommendedCourses, recommendedBlogs] = await Promise.all([
    blog.recommendedCourseIds?.length > 0
      ? prisma.course.findMany({
          where: { id: { in: blog.recommendedCourseIds }, active: true },
          select: { id: true, slug: true, title: true, descriptionShort: true, level: true, price: true, discountPrice: true, mainImageUrl: true, imageUrl: true, images: true }
        })
      : Promise.resolve([]),
    blog.recommendedBlogSlugs?.length > 0
      ? prisma.blog.findMany({
          where: { slug: { in: blog.recommendedBlogSlugs }, published: true },
          select: { id: true, slug: true, title: true, excerpt: true, coverImage: true }
        })
      : prisma.blog.findMany({
          where: { published: true, slug: { not: slug } },
          orderBy: { publishedAt: 'desc' },
          take: 3,
          select: { id: true, slug: true, title: true, excerpt: true, coverImage: true }
        })
  ])

  return (
    <>
      <Navbar forceOpaque />
      <BlogDetailPage blog={blog} recommendedCourses={recommendedCourses} recommendedBlogs={recommendedBlogs} />
      <Footer />
    </>
  )
}
