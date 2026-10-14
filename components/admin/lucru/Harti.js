'use client'

/**
 * Hărțile proiectelor (Mapbox, ca în StefanPWA).
 * Fără NEXT_PUBLIC_MAPBOX_TOKEN: un pin simplu pe OpenStreetMap și câmpuri de
 * coordonate — totul merge, doar fără harta interactivă.
 */

import { useEffect, useRef, useState } from 'react'
import 'mapbox-gl/dist/mapbox-gl.css'
import toast from 'react-hot-toast'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { linkuriHarta, statusProiect, refScurt, STATUSURI_PROIECT } from '@/lib/lucru/constante'
import { dlgInput as clsInput, cere } from './ui'

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const STIL = 'mapbox://styles/mapbox/streets-v12'
const CHISINAU = { lat: 47.0245, lng: 28.8322 }

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

export function LinkuriNavigare({ lat, lng, address, mic = false }) {
  const l = linkuriHarta({ lat, lng, address })
  if (!l) return null
  const cls = `inline-flex items-center gap-1 tap rounded-lg border border-line bg-surface-2 font-semibold text-ink hover:bg-surface ${mic ? 'h-7 px-2.5 text-[11px]' : 'px-3 py-1.5 text-xs'}`
  return (
    <div className="flex flex-wrap gap-1.5">
      <a href={l.waze} target="_blank" rel="noopener noreferrer" className={cls}>🚗 Waze</a>
      <a href={l.google} target="_blank" rel="noopener noreferrer" className={cls}>🗺️ Google Maps</a>
      <a href={l.apple} target="_blank" rel="noopener noreferrer" className={cls}>🍎 Apple</a>
    </div>
  )
}

function HartaOSM({ lat, lng, inaltime = 'h-64' }) {
  const d = 0.008
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`
  return <iframe title="Hartă" src={src} className={`${inaltime} w-full rounded-xl border border-line`} loading="lazy" />
}

/** Un singur pin, cu popup de navigare. */
export function HartaPunct({ lat, lng, address, inaltime = 'h-64' }) {
  const cutie = useRef(null)

  useEffect(() => {
    if (!TOKEN || !cutie.current) return
    let harta
    let anulat = false
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (anulat || !cutie.current) return
      mapboxgl.accessToken = TOKEN
      harta = new mapboxgl.Map({ container: cutie.current, style: STIL, center: [lng, lat], zoom: 14 })
      harta.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      const l = linkuriHarta({ lat, lng })
      const html = `<div style="font-family:system-ui,sans-serif;min-width:170px">
        ${address ? `<p style="font-size:13px;font-weight:600;margin:0 0 6px">${esc(address)}</p>` : ''}
        <a href="${l.waze}" target="_blank" rel="noopener" style="display:block;font-size:12px;font-weight:600;color:#4f46e5">🚗 Waze</a>
        <a href="${l.google}" target="_blank" rel="noopener" style="display:block;font-size:12px;font-weight:600;color:#4f46e5">🗺️ Google Maps</a>
        <a href="${l.apple}" target="_blank" rel="noopener" style="display:block;font-size:12px;font-weight:600;color:#4f46e5">🍎 Apple Maps</a>
      </div>`
      new mapboxgl.Marker({ color: '#4f46e5' })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup({ offset: 28 }).setHTML(html))
        .addTo(harta)
    })
    return () => {
      anulat = true
      harta?.remove()
    }
  }, [lat, lng, address])

  if (!TOKEN) return <HartaOSM lat={lat} lng={lng} inaltime={inaltime} />
  return <div ref={cutie} className={`${inaltime} w-full overflow-hidden rounded-xl border border-line`} />
}

/**
 * Alegerea locației: cauți adresa (OpenStreetMap, gratuit) sau dai clic /
 * tragi pinul pe hartă. `valoare` = { lat, lng } | null.
 */
export function AlegeLocatie({ valoare, onSchimbare, adresa, onAdresa }) {
  const cutie = useRef(null)
  const harta = useRef(null)
  const pin = useRef(null)
  const [cautare, setCautare] = useState('')
  const [rezultate, setRezultate] = useState([])
  const [caut, setCaut] = useState(false)

  useEffect(() => {
    if (!TOKEN || !cutie.current) return
    let anulat = false
    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (anulat || !cutie.current) return
      mapboxgl.accessToken = TOKEN
      const start = valoare || CHISINAU
      const h = new mapboxgl.Map({ container: cutie.current, style: STIL, center: [start.lng, start.lat], zoom: valoare ? 14 : 7 })
      h.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
      const m = new mapboxgl.Marker({ color: '#4f46e5', draggable: true }).setLngLat([start.lng, start.lat])
      if (valoare) m.addTo(h)
      const rotunjeste = ({ lat, lng }) => ({ lat: Math.round(lat * 1e6) / 1e6, lng: Math.round(lng * 1e6) / 1e6 })
      m.on('dragend', () => onSchimbare(rotunjeste(m.getLngLat())))
      h.on('click', (e) => {
        m.setLngLat(e.lngLat).addTo(h)
        onSchimbare(rotunjeste(e.lngLat))
      })
      harta.current = h
      pin.current = m
    })
    return () => {
      anulat = true
      harta.current?.remove()
      harta.current = null
    }
    // Harta se creează o singură dată; pinul se mută din efectul de mai jos
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!harta.current || !pin.current) return
    if (valoare) {
      pin.current.setLngLat([valoare.lng, valoare.lat]).addTo(harta.current)
    } else {
      pin.current.remove()
    }
  }, [valoare])

  async function cauta(text = cautare || adresa) {
    if (!text || text.trim().length < 3) {
      toast.error('Scrie adresa (minim 3 litere).')
      return
    }
    setCaut(true)
    try {
      const { rezultate } = await cere(`/api/admin/geocodare?q=${encodeURIComponent(text.trim())}`)
      setRezultate(rezultate)
      if (!rezultate.length) toast('Nu am găsit adresa. Încearcă cu orașul (ex. „str. Ismail 33, Chișinău").', { icon: '🔎' })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setCaut(false)
    }
  }

  function alege(r) {
    onSchimbare({ lat: Math.round(r.lat * 1e6) / 1e6, lng: Math.round(r.lng * 1e6) / 1e6 })
    if (!adresa && onAdresa) onAdresa(r.nume.split(',').slice(0, 3).join(',').trim())
    setRezultate([])
    harta.current?.flyTo({ center: [r.lng, r.lat], zoom: 15 })
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          className={clsInput}
          value={cautare}
          onChange={(e) => setCautare(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              cauta()
            }
          }}
          placeholder={adresa ? `Caută „${adresa}" sau altă adresă` : 'Caută adresa pe hartă…'}
        />
        <button
          type="button"
          onClick={() => cauta()}
          disabled={caut}
          className="tap inline-flex h-11 shrink-0 items-center gap-1 rounded-xl border border-line bg-surface px-3 text-sm font-medium text-ink hover:bg-surface-2 disabled:opacity-60"
        >
          <MagnifyingGlassIcon className="h-4 w-4" /> {caut ? '…' : 'Caută'}
        </button>
      </div>

      {rezultate.length > 0 && (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {rezultate.map((r, i) => (
            <li key={i}>
              <button type="button" onClick={() => alege(r)} className="w-full px-3 py-2 text-left text-xs text-ink hover:bg-surface-2">
                📍 {r.nume}
              </button>
            </li>
          ))}
        </ul>
      )}

      {TOKEN ? (
        <>
          <div ref={cutie} className="h-56 w-full overflow-hidden rounded-xl border border-line" />
          <p className="text-[11px] text-ink-soft">Dă clic pe hartă sau trage pinul ca să fixezi locul exact.</p>
        </>
      ) : (
        valoare && <HartaOSM lat={valoare.lat} lng={valoare.lng} inaltime="h-48" />
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          className={`${clsInput} font-mono`}
          type="number"
          step="any"
          placeholder="Latitudine"
          value={valoare?.lat ?? ''}
          onChange={(e) => onSchimbare(e.target.value === '' ? null : { lat: Number(e.target.value), lng: valoare?.lng ?? CHISINAU.lng })}
        />
        <input
          className={`${clsInput} font-mono`}
          type="number"
          step="any"
          placeholder="Longitudine"
          value={valoare?.lng ?? ''}
          onChange={(e) => onSchimbare(e.target.value === '' ? null : { lat: valoare?.lat ?? CHISINAU.lat, lng: Number(e.target.value) })}
        />
      </div>
      {valoare && (
        <button type="button" onClick={() => onSchimbare(null)} className="text-xs text-ink-soft hover:text-st-cancelled">
          ✕ Șterge locația
        </button>
      )}
    </div>
  )
}

/** Toate proiectele cu locație, grupate în clustere. */
export function HartaProiecte({ proiecte }) {
  const cutie = useRef(null)
  const pini = proiecte.filter((p) => p.lat != null && p.lng != null)

  useEffect(() => {
    if (!TOKEN || !cutie.current || !pini.length) return
    let harta
    let anulat = false

    const popupProiect = (p) => {
      const st = statusProiect(p.status)
      const l = linkuriHarta(p)
      return `<div style="font-family:system-ui,sans-serif;min-width:190px">
        <div style="font-weight:700;font-size:14px;margin-bottom:3px">${p.seq != null ? `<span style="font-family:monospace;font-size:11px;background:#eef2ff;color:#4f46e5;padding:1px 5px;border-radius:4px;margin-right:5px">${refScurt(p.seq)}</span>` : ''}${esc(p.name)}</div>
        <div style="font-size:12px;color:#6b7280"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${st.punct};margin-right:4px"></span>${st.label} · ${p.deschise ?? 0} taskuri deschise</div>
        ${p.address ? `<div style="font-size:12px;color:#6b7280;margin-top:2px">${esc(p.address)}</div>` : ''}
        <div style="display:flex;gap:10px;margin-top:8px"><a href="/admin/projects/${p.id}" style="font-size:12px;font-weight:600;color:#4f46e5">Detalii →</a><a href="/admin/tasks?project=${p.id}&scope=all" style="font-size:12px;font-weight:600;color:#4f46e5">Taskuri →</a></div>
        <div style="display:flex;gap:10px;margin-top:6px;padding-top:6px;border-top:1px solid #f3f4f6"><a href="${l.waze}" target="_blank" rel="noopener" style="font-size:11px;font-weight:600;color:#4f46e5">🚗 Waze</a><a href="${l.google}" target="_blank" rel="noopener" style="font-size:11px;font-weight:600;color:#4f46e5">🗺️ Maps</a><a href="${l.apple}" target="_blank" rel="noopener" style="font-size:11px;font-weight:600;color:#4f46e5">🍎 Apple</a></div>
      </div>`
    }

    import('mapbox-gl').then(({ default: mapboxgl }) => {
      if (anulat || !cutie.current) return
      mapboxgl.accessToken = TOKEN
      harta = new mapboxgl.Map({ container: cutie.current, style: STIL, center: [pini[0].lng, pini[0].lat], zoom: 7 })
      harta.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

      harta.on('load', () => {
        if (pini.length > 1) {
          const b = pini.reduce((acc, p) => acc.extend([p.lng, p.lat]), new mapboxgl.LngLatBounds([pini[0].lng, pini[0].lat], [pini[0].lng, pini[0].lat]))
          harta.fitBounds(b, { padding: 70, maxZoom: 13 })
        } else harta.setZoom(13)

        harta.addSource('proiecte', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: pini.map((p) => ({
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
              properties: {
                id: p.id,
                seq: p.seq,
                name: p.name,
                status: p.status,
                address: p.address || '',
                deschise: p.taskuri?.deschise ?? 0,
                lat: p.lat,
                lng: p.lng,
              },
            })),
          },
          cluster: true,
          clusterMaxZoom: 15,
          clusterRadius: 45,
        })
        harta.addLayer({
          id: 'clustere',
          type: 'circle',
          source: 'proiecte',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#4f46e5',
            'circle-radius': ['step', ['get', 'point_count'], 20, 5, 28, 20, 36],
            'circle-stroke-width': 3,
            'circle-stroke-color': '#fff',
            'circle-opacity': 0.9,
          },
        })
        harta.addLayer({
          id: 'numar-cluster',
          type: 'symbol',
          source: 'proiecte',
          filter: ['has', 'point_count'],
          layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-size': 14, 'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'] },
          paint: { 'text-color': '#ffffff' },
        })
        harta.addLayer({
          id: 'punct',
          type: 'circle',
          source: 'proiecte',
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['match', ['get', 'status'], ...STATUSURI_PROIECT.flatMap((s) => [s.value, s.punct]), '#6b7280'],
            'circle-radius': 10,
            'circle-stroke-width': 3,
            'circle-stroke-color': '#ffffff',
          },
        })

        harta.on('click', 'clustere', (e) => {
          const f = harta.queryRenderedFeatures(e.point, { layers: ['clustere'] })[0]
          if (!f) return
          const sursa = harta.getSource('proiecte')
          const idCluster = f.properties.cluster_id
          sursa.getClusterExpansionZoom(idCluster, (err, zoom) => {
            if (err) return
            if (zoom <= harta.getZoom() + 0.5 || zoom >= 16) {
              // Toate în același loc — arătăm lista
              sursa.getClusterLeaves(idCluster, 100, 0, (e2, frunze) => {
                if (e2 || !frunze?.length) return
                const html = `<div style="font-family:system-ui,sans-serif;max-height:280px;overflow:auto;min-width:200px">${frunze
                  .map((x) => `<div style="padding:5px 0;border-bottom:1px solid #f3f4f6"><a href="/admin/projects/${x.properties.id}" style="font-size:13px;font-weight:600;color:#111827">${esc(x.properties.name)}</a></div>`)
                  .join('')}</div>`
                new mapboxgl.Popup({ maxWidth: '280px' }).setLngLat(e.lngLat).setHTML(html).addTo(harta)
              })
            } else harta.easeTo({ center: f.geometry.coordinates, zoom })
          })
        })
        harta.on('click', 'punct', (e) => {
          const f = harta.queryRenderedFeatures(e.point, { layers: ['punct'] })[0]
          if (!f) return
          new mapboxgl.Popup({ maxWidth: '290px' }).setLngLat(e.lngLat).setHTML(popupProiect(f.properties)).addTo(harta)
        })
        for (const strat of ['clustere', 'punct']) {
          harta.on('mouseenter', strat, () => (harta.getCanvas().style.cursor = 'pointer'))
          harta.on('mouseleave', strat, () => (harta.getCanvas().style.cursor = ''))
        }
      })
    })
    return () => {
      anulat = true
      harta?.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proiecte])

  if (!pini.length) {
    return (
      <div className="lcard grid place-items-center p-16 text-center text-sm text-ink-soft">
        Niciun proiect nu are încă locație. Deschide un proiect → Editează → caută adresa.
      </div>
    )
  }
  if (!TOKEN) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Harta interactivă are nevoie de <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> în Vercel (același
          token ca în StefanPWA). Până atunci, ai linkurile de navigare pentru fiecare proiect:
        </div>
        <ul className="grid gap-2 sm:grid-cols-2">
          {pini.map((p) => (
            <li key={p.id} className="lcard p-3">
              <a href={`/admin/projects/${p.id}`} className="text-sm font-semibold text-ink hover:text-brand">
                {p.name}
              </a>
              {p.address && <p className="mb-2 text-xs text-ink-soft">{p.address}</p>}
              <LinkuriNavigare lat={p.lat} lng={p.lng} mic />
            </li>
          ))}
        </ul>
      </div>
    )
  }
  return <div ref={cutie} className="h-[70vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-line" />
}
