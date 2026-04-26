import prisma from '@/lib/prisma'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pyweb.online'

  // Pagini statice
  const staticPages = [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/login`, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${baseUrl}/gdpr`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/termeni`, changeFrequency: 'yearly', priority: 0.3 },
  ].map((p) => ({ ...p, lastModified: new Date().toISOString() }))

  // Cursuri dinamice din baza de date
  let coursePages = []
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
    })
    coursePages = courses.map((c) => ({
      url: `${baseUrl}/curs/${c.slug}`,
      lastModified: (c.updatedAt || new Date()).toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    }))
  } catch {
    // dacă DB nu e disponibil la build, ignorăm
  }

  return [...staticPages, ...coursePages]
}
