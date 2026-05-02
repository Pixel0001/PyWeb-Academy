'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Dacă PWA e deschisă de pe Home Screen, pornește de la /learn
// Acest component citește token-ul salvat și redirecționează automat
export default function LearnPWARedirect() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('learnToken')
    if (token) {
      router.replace(`/learn/${token}`)
    }
  }, [router])
  return null
}
