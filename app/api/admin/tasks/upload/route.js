/**
 * POST /api/admin/tasks/upload — dă browserului un token ca să urce fișierul
 * direct în Vercel Blob (fără să treacă prin funcția noastră, care e
 * limitată la 4.5 MB). După urcare, browserul salvează fișierul pe task prin
 * /api/admin/tasks/:id/atasamente.
 */

import { NextResponse } from 'next/server'
import { handleUpload } from '@vercel/blob/client'
import { checkPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MARIME_MAXIMA = 50 * 1024 * 1024

export async function POST(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: 'Stocarea nu e configurată: lipsește BLOB_READ_WRITE_TOKEN.' },
      { status: 500 }
    )
  }
  const body = await request.json()

  try {
    const raspuns = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const { allowed } = await checkPermission('tasks.view')
        if (!allowed) throw new Error('Nu ai acces la taskuri.')
        if (!pathname.startsWith('tasks/')) throw new Error('Cale invalidă.')
        return {
          maximumSizeInBytes: MARIME_MAXIMA,
          addRandomSuffix: true,
        }
      },
    })
    return NextResponse.json(raspuns)
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Încărcare refuzată.' }, { status: 400 })
  }
}
