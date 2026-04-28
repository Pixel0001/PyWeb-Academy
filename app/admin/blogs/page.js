export const dynamic = 'force-dynamic'

import Link from 'next/link'
import prisma from '@/lib/prisma'
import DeleteBlogButton from '@/components/admin/DeleteBlogButton'
import PermissionGuard from '@/components/admin/PermissionGuard'
import { checkPermission } from '@/lib/permissions'

export default async function AdminBlogsPage() {
  return (
    <PermissionGuard permission="blogs.view">
      <BlogsContent />
    </PermissionGuard>
  )
}

async function BlogsContent() {
  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission('blogs.create'),
    checkPermission('blogs.edit'),
    checkPermission('blogs.delete')
  ])

  const blogs = await prisma.blog.findMany({ orderBy: { publishedAt: 'desc' } })

  return (
    <div className="space-y-4 xs:space-y-6">
      <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-3 xs:gap-0">
        <div>
          <h1 className="text-xl xs:text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm xs:text-base text-gray-600">
            Articole publicate pe site —{' '}
            <Link href="/blog" target="_blank" className="text-indigo-600 hover:underline text-sm">
              Vezi pe site →
            </Link>
          </p>
        </div>
        {canCreate.allowed && (
          <Link href="/admin/blogs/new"
            className="px-3 xs:px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm xs:text-base font-medium hover:bg-indigo-700 text-center whitespace-nowrap">
            + Adaugă blog
          </Link>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Titlu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Publicat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {blogs.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">Nu există bloguri. Adaugă primul!</td></tr>
            ) : blogs.map(b => (
              <tr key={b.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{b.title}</div>
                  <div className="text-xs text-gray-500 truncate max-w-md">/{b.slug}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{b.category || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(b.publishedAt).toLocaleDateString('ro-RO')}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${b.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {b.published ? 'Publicat' : 'Draft'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {canEdit.allowed && <Link href={`/admin/blogs/${b.id}/edit`} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">Editează</Link>}
                    {canDelete.allowed && <DeleteBlogButton id={b.id} title={b.title} />}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {blogs.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500 text-sm border border-gray-100">Nu există bloguri.</div>
        ) : blogs.map(b => (
          <div key={b.id} className="bg-white rounded-xl p-3 xs:p-4 border border-gray-100 shadow-sm">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-medium text-sm text-gray-900 truncate">{b.title}</h3>
                <p className="text-xs text-gray-500 truncate">/{b.slug}</p>
              </div>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full whitespace-nowrap ${b.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {b.published ? 'Publicat' : 'Draft'}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">{b.category || '-'} · {new Date(b.publishedAt).toLocaleDateString('ro-RO')}</div>
            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              {canEdit.allowed && <Link href={`/admin/blogs/${b.id}/edit`} className="text-indigo-600 text-sm font-medium">Editează</Link>}
              {canDelete.allowed && <DeleteBlogButton id={b.id} title={b.title} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
