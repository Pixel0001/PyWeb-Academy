import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAdmin } from '@/lib/session'
import { checkPermission } from '@/lib/permissions'

export async function GET(request, { params }) {
  try {
    await requireAdmin()
    const perm = await checkPermission('blogs.view')
    if (!perm.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să vezi blogurile' }, { status: 403 })
    }
    const { id } = await params
    const blog = await prisma.blog.findUnique({ where: { id } })
    if (!blog) return NextResponse.json({ error: 'Blog not found' }, { status: 404 })
    return NextResponse.json(blog)
  } catch (error) {
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to fetch blog' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin()
    const perm = await checkPermission('blogs.edit')
    if (!perm.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să editezi bloguri' }, { status: 403 })
    }
    const { id } = await params
    const body = await request.json()
    const {
      title, slug, excerpt, coverImage, content, category, tags,
      recommendedCourseIds, recommendedBlogSlugs, published, publishedAt,
      seoTitle, seoDescription, readMinutes, authorName
    } = body

    if (slug) {
      const existing = await prisma.blog.findFirst({ where: { slug, NOT: { id } } })
      if (existing) {
        return NextResponse.json({ error: 'Acest slug există deja' }, { status: 400 })
      }
    }

    const blog = await prisma.blog.update({
      where: { id },
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
        publishedAt: publishedAt ? new Date(publishedAt) : undefined,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        readMinutes: readMinutes ? parseInt(readMinutes) : null,
        authorName: authorName || null
      }
    })
    return NextResponse.json(blog)
  } catch (error) {
    console.error('Error updating blog:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to update blog' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const perm = await checkPermission('blogs.delete')
    if (!perm.allowed) {
      return NextResponse.json({ error: 'Nu ai permisiunea să ștergi bloguri' }, { status: 403 })
    }
    const { id } = await params
    await prisma.blog.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog:', error)
    if (error.message === 'Unauthorized' || error.message === 'Forbidden') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    return NextResponse.json({ error: 'Failed to delete blog' }, { status: 500 })
  }
}
