import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import ImpersonationBanner from '@/components/ImpersonationBanner'

export const metadata = {
  title: 'PyWeb Admin',
  description: 'Panou de administrare PyWeb Academy',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    title: 'PyWeb Admin',
    statusBarStyle: 'black-translucent',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  if (!['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
    // Dacă SUPERADMIN-ul impersonează un TEACHER și ajunge la /admin, redirecționăm la /teacher
    redirect('/teacher')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ImpersonationBanner />
      <AdminSidebar user={session.user} />
      <div className="lg:pl-72">
        <AdminHeader user={session.user} />
        <main className="py-4 xs:py-5 sm:py-6 px-3 xs:px-4 sm:px-6 lg:px-8 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  )
}
