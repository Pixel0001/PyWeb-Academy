'use client'

/**
 * 🎤 Dictează: apeși, vorbești, apeși iar. Textul pleacă la OpenAI, iar
 * câmpurile găsite completează formularul — nimic nu se salvează singur.
 */

import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/solid'

export default function ButonVoce({ tip = 'task', onRezultat, eticheta = 'Dictează', mic = false }) {
  const [stare, setStare] = useState('liber') // liber | inregistrez | procesez
  const [secunde, setSecunde] = useState(0)
  const recorder = useRef(null)
  const bucati = useRef([])
  const ceas = useRef(null)

  useEffect(
    () => () => {
      clearInterval(ceas.current)
      recorder.current?.stream?.getTracks().forEach((t) => t.stop())
    },
    []
  )

  // Oprire automată după 2 minute
  useEffect(() => {
    if (stare === 'inregistrez' && secunde >= 120) opreste()
  }, [stare, secunde])

  async function porneste() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Browserul nu permite înregistrarea audio.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const tipuri = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      const mime = tipuri.find((t) => MediaRecorder.isTypeSupported?.(t)) || ''
      const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      bucati.current = []
      r.ondataavailable = (e) => e.data.size && bucati.current.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        trimite(new Blob(bucati.current, { type: r.mimeType || 'audio/webm' }))
      }
      recorder.current = r
      r.start()
      setSecunde(0)
      ceas.current = setInterval(() => setSecunde((s) => s + 1), 1000)
      setStare('inregistrez')
    } catch {
      toast.error('Nu am acces la microfon. Permite-l din bara browserului.')
    }
  }

  function opreste() {
    clearInterval(ceas.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }

  async function trimite(blob) {
    if (blob.size < 1500) {
      setStare('liber')
      toast.error('Înregistrarea e prea scurtă.')
      return
    }
    setStare('procesez')
    const fd = new FormData()
    fd.append('audio', blob, 'voce')
    fd.append('tip', tip)
    try {
      const r = await fetch('/api/admin/tasks/voce', { method: 'POST', body: fd })
      const date = await r.json().catch(() => ({}))
      if (!r.ok) throw new Error(date.error || 'Eroare la procesarea vocii.')
      onRezultat?.(date)
      toast.success('Am completat formularul — verifică și salvează.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setStare('liber')
    }
  }

  if (stare === 'inregistrez') {
    return (
      <button
        type="button"
        onClick={opreste}
        className={`inline-flex items-center gap-1.5 rounded-lg bg-st-cancelled font-semibold text-white hover:opacity-90 ${mic ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
        <StopIcon className="h-4 w-4" /> Gata ({secunde}s)
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={porneste}
      disabled={stare === 'procesez'}
      title="Spune ce trebuie făcut, pentru cine și până când — completez eu formularul"
      className={`inline-flex items-center gap-1.5 rounded-lg border border-brand/40 bg-brand/10 font-semibold text-brand hover:bg-brand/20 disabled:opacity-70 ${mic ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
    >
      <MicrophoneIcon className="h-4 w-4" />
      {stare === 'procesez' ? 'Ascult și scriu…' : eticheta}
    </button>
  )
}
