/**
 * GET /api/admin/geocodare?q=adresă — coordonatele unei adrese (OpenStreetMap
 * Nominatim, gratuit). Folosit la proiecte, ca să pui pinul pe hartă fără să-l
 * cauți de mână.
 */

import { NextResponse } from 'next/server'
import { checkAnyPermission } from '@/lib/permissions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request) {
  const { allowed } = await checkAnyPermission(['projects.create', 'projects.edit'])
  if (!allowed) return NextResponse.json({ error: 'Acces interzis' }, { status: 403 })

  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 200)
  if (q.length < 3) return NextResponse.json({ rezultate: [] })

  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=ro&q=' +
    encodeURIComponent(q)
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'PyWebAcademy-Proiecte/1.0 (+https://pyweb.online)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!r.ok) {
      return NextResponse.json({ error: `Căutarea adresei a eșuat (${r.status}).` }, { status: 502 })
    }
    const date = await r.json()
    return NextResponse.json({
      rezultate: date.map((d) => ({ nume: d.display_name, lat: Number(d.lat), lng: Number(d.lon) })),
    })
  } catch {
    return NextResponse.json({ error: 'Căutarea adresei nu a răspuns. Încearcă din nou.' }, { status: 502 })
  }
}
