import prisma from '@/lib/prisma'
import Navbar from '@/components/public/Navbar'
import Footer from '@/components/public/Footer'
import BlogListPage from '@/components/public/BlogListPage'

export const revalidate = 60

export const metadata = {
  title: 'Blog - PyWeb Academy',
  description: 'Articole, sfaturi și resurse despre programare pentru copii, web development și AI.',
  openGraph: {
    title: 'Blog - PyWeb Academy',
    description: 'Articole, sfaturi și resurse despre programare pentru copii.',
  },
}

export default async function BlogPage() {
  const blogs = await prisma.blog.findMany({
    where: { published: true },
    orderBy: { publishedAt: 'desc' },
    select: {
      id: true, slug: true, title: true, excerpt: true, coverImage: true,
      category: true, publishedAt: true, readMinutes: true, authorName: true
    }
  })

  return (
    <>
      <Navbar forceOpaque />
      <BlogListPage blogs={blogs} />
      <Footer />
    </>
  )
}
