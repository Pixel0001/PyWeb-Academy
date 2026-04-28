import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export async function GET() {
  try {
    await requireAdmin()
    const perm = await checkPermission('blogs.view')
    if (!perm.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi blogurile' }, { status: 403 })
    }
    const blogs = await prisma.blog.findMany({ orderBy: { publishedAt: 'desc' } })
    return NextResponse.json(blogs)
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch blogs' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    await requireAdmin()
    const perm = await checkPermission('blogs.create')
    if (!perm.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să creezi bloguri' }, { status: 403 })
    }
    const body = await request.json()
    const {
      title, slug, excerpt, coverImage, content, category, tags,
      recommendedCourseIds, recommendedBlogSlugs, published, publishedAt,
      seoTitle, seoDescription, readMinutes, authorName
    } = body

    if (!title || !slug) {
      return NextResponse.json({ error: 'Titlu și slug sunt obligatorii' }, { status: 400 })
    }

    const existing = await prisma.blog.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: 'Acest slug există deja' }, { status: 400 })
    }

    const blog = await prisma.blog.create({
      data: {
        title,
        slug,
        excerpt: excerpt || null,
        coverImage: coverImage || null,
        content: Array.isArray(content) ? content : [],
        category: category || null,
        tags: Array.isArray(tags) ? tags : [],
        recommendedCourseIds: Array.isArray(recommendedCourseIds) ? recommendedCourseIds : [],
        recommendedBlogSlugs: Array.isArray(recommendedBlogSlugs) ? recommendedBlogSlugs : [],
        published: published !== false,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        readMinutes: readMinutes ? parseInt(readMinutes) : null,
        authorName: authorName || null
      }
    })

    return NextResponse.json(blog, { status: 201 })
  } catch (error) {
    console.error('Error creating blog:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to create blog' }, { status: 500 })
  }
}
