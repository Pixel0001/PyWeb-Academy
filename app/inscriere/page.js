'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  AcademicCapIcon,
  CalendarIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'

const CLASE = [
  { id: 'pregatitoare', name: 'Clasa pregătitoare' },
  { id: '1', name: 'Clasa I' },
  { id: '2', name: 'Clasa a II-a' },
  { id: '3', name: 'Clasa a III-a' },
  { id: '4', name: 'Clasa a IV-a' },
  { id: '5', name: 'Clasa a V-a' },
  { id: '6', name: 'Clasa a VI-a' },
  { id: '7', name: 'Clasa a VII-a' },
  { id: '8', name: 'Clasa a VIII-a' },
  { id: '9', name: 'Clasa a IX-a' },
  { id: '10', name: 'Clasa a X-a' },
  { id: '11', name: 'Clasa a XI-a' },
  { id: '12', name: 'Clasa a XII-a' }
]

// Stepper steps
const STEPS = [
  { id: 1, title: 'Date părinte', icon: UserIcon },
  { id: 2, title: 'Date copil', icon: AcademicCapIcon },
  { id: 3, title: 'Curs', icon: RocketLaunchIcon },
]

export default function InscrieriPage() {
  const [cursuri, setCursuri] = useState([])
  const [loadingCursuri, setLoadingCursuri] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    numeParinte: '',
    numeCopil: '',
    email: '',
    telefon: '',
    clasa: '',
    cursuriSelectate: '',
    mesaj: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')
  const formRef = useRef(null)

  useEffect(() => {
    fetchCursuri()
  }, [])

  const fetchCursuri = async () => {
    try {
      const res = await fetch('/api/public/courses')
      if (res.ok) {
        const data = await res.json()
        setCursuri(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoadingCursuri(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCursChange = (cursId) => {
    setFormData(prev => ({
      ...prev,
      cursuriSelectate: cursId
    }))
  }

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const canProceedStep1 = formData.numeParinte && formData.email && formData.telefon
  const canProceedStep2 = formData.numeCopil && formData.clasa
  const canSubmit = formData.cursuriSelectate

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/inscrieri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'A apărut o eroare. Vă rugăm încercați din nou.')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-emerald-500/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-36 sm:w-72 h-36 sm:h-72 bg-teal-500/10 rounded-full blur-[100px]" />
        </div>
        
        {/* Confetti Effect */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#10b981', '#14b8a6', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
        </div>

        <div className="relative max-w-lg w-full">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center border border-white/10 shadow-2xl">
            {/* Success Icon */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-8">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 sm:mb-4">
              🎉 Felicitări!
            </h1>
            <p className="text-lg sm:text-xl text-emerald-400 font-semibold mb-2 sm:mb-4">
              Cererea ta a fost trimisă cu succes!
            </p>
            <p className="text-gray-400 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">
              Am primit cererea de înscriere și te vom contacta în curând pentru a discuta detaliile. 
              Verifică-ți email-ul pentru confirmare.
            </p>

            {/* What's Next */}
            <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 text-left">
              <p className="text-white font-semibold mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                Ce urmează?
              </p>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Te vom contacta în 24 de ore
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Vom programa o lecție de probă gratuită
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  Vei cunoaște profesorul și colegii
                </li>
              </ul>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              <ArrowLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              Înapoi la pagina principală
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#030303] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-teal-500/5 rounded-full blur-[120px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px'
      }} />

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10 bg-emerald-500/10 rounded-xl p-1">
                <Image
                  src="/pi.png"
                  alt="Pi School"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">Pi School</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Înapoi</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Title */}
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white mb-3 sm:mb-4">
            Începe aventura{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
              Pi School
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
            Completează formularul în 3 pași simpli și te vom contacta pentru a programa o lecție de probă gratuită.
          </p>
        </div>

        {/* Progress Stepper */}
        <div className="mb-6 sm:mb-10" ref={formRef}>
          <div className="flex items-center justify-center gap-1 sm:gap-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id)
                  }}
                  className={`flex flex-col items-center gap-1 sm:gap-2 group ${step.id < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                  disabled={step.id > currentStep}
                >
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    step.id === currentStep
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                      : step.id < currentStep
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-white/5 text-gray-600'
                  }`}>
                    {step.id < currentStep ? (
                      <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    ) : (
                      <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${step.id === currentStep ? 'text-white' : ''}`} />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium transition-colors text-center ${
                    step.id === currentStep ? 'text-emerald-400' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 sm:w-16 h-0.5 mx-1 sm:mx-2 rounded transition-colors ${
                    step.id < currentStep ? 'bg-emerald-500' : 'bg-white/10'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-white/10 shadow-2xl">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400">!</span>
                </div>
                {error}
              </div>
            )}

            {/* Step 1: Parent Data */}
            {currentStep === 1 && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Date părinte/tutore</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Informații de contact</p>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Numele complet *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <input
                      type="text"
                      name="numeParinte"
                      value={formData.numeParinte}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      placeholder="Ex: Maria Popescu"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Email *
                    </label>
                    <div className="relative">
                      <EnvelopeIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="email@exemplu.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Telefon *
                    </label>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                      <input
                        type="tel"
                        name="telefon"
                        value={formData.telefon}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        placeholder="06X XXX XXX"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedStep1}
                    className="w-full py-3 sm:py-4 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-gray-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continuă
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Child Data */}
            {currentStep === 2 && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Date elev</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Informații despre copil</p>
                  </div>
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Numele copilului *
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <input
                      type="text"
                      name="numeCopil"
                      value={formData.numeCopil}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all"
                      placeholder="Ex: Alex Popescu"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Clasa *
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <select
                      name="clasa"
                      value={formData.clasa}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="" className="bg-gray-900">Selectează clasa</option>
                      {CLASE.map(clasa => (
                        <option key={clasa.id} value={clasa.id} className="bg-gray-900">{clasa.name}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                <div className="pt-2 sm:pt-4 flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base transition-all flex items-center gap-1 sm:gap-2 border border-white/10"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span className="hidden sm:inline">Înapoi</span>
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    disabled={!canProceedStep2}
                    className="flex-1 py-3 sm:py-4 bg-purple-500 hover:bg-purple-400 disabled:bg-white/10 disabled:text-gray-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Continuă
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Course Selection */}
            {currentStep === 3 && (
              <div className="space-y-4 sm:space-y-6 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Alege cursul</h2>
                    <p className="text-gray-500 text-xs sm:text-sm">Selectează programul dorit</p>
                  </div>
                </div>

                {loadingCursuri ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-2 border-emerald-500 border-t-transparent"></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:gap-3">
                    {/* Opțiunea "Selectăm împreună" */}
                    <label
                      className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 ${
                        formData.cursuriSelectate === 'selectam-impreuna'
                          ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10'
                          : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-amber-500/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="curs"
                        checked={formData.cursuriSelectate === 'selectam-impreuna'}
                        onChange={() => handleCursChange('selectam-impreuna')}
                        className="sr-only"
                      />
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                        formData.cursuriSelectate === 'selectam-impreuna'
                          ? 'bg-amber-500 shadow-lg'
                          : 'bg-white/10'
                      }`}>
                        <SparklesIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${formData.cursuriSelectate === 'selectam-impreuna' ? 'text-white' : 'text-amber-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-semibold block text-sm sm:text-base ${formData.cursuriSelectate === 'selectam-impreuna' ? 'text-white' : 'text-gray-300'}`}>
                          Nu știu încă
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500">Selectăm împreună cursul potrivit</span>
                      </div>
                      {formData.cursuriSelectate === 'selectam-impreuna' && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                          <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                        </div>
                      )}
                    </label>

                    {/* Cursurile din baza de date */}
                    {cursuri.map(curs => (
                      <label
                        key={curs.id}
                        className={`relative flex items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-2xl border cursor-pointer transition-all duration-300 ${
                          formData.cursuriSelectate === curs.id
                            ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                            : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-emerald-500/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="curs"
                          checked={formData.cursuriSelectate === curs.id}
                          onChange={() => handleCursChange(curs.id)}
                          className="sr-only"
                        />
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                          formData.cursuriSelectate === curs.id
                            ? 'bg-emerald-500 shadow-lg'
                            : 'bg-white/10'
                        }`}>
                          <AcademicCapIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${formData.cursuriSelectate === curs.id ? 'text-white' : 'text-emerald-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`font-semibold block text-sm sm:text-base ${formData.cursuriSelectate === curs.id ? 'text-white' : 'text-gray-300'}`}>
                            {curs.title}
                          </span>
                          {curs.description && (
                            <span className="text-xs sm:text-sm text-gray-500 line-clamp-1">{curs.description}</span>
                          )}
                        </div>
                        {formData.cursuriSelectate === curs.id && (
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <CheckCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {/* Mesaj */}
                <div>
                  <label className="block text-white text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                    Mesaj (opțional)
                  </label>
                  <div className="relative">
                    <ChatBubbleBottomCenterTextIcon className="absolute left-3 sm:left-4 top-3 sm:top-4 w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                    <textarea
                      name="mesaj"
                      value={formData.mesaj}
                      onChange={handleChange}
                      rows={3}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-600 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
                      placeholder="Întrebări sau informații suplimentare..."
                    />
                  </div>
                </div>

                <div className="pt-2 sm:pt-4 flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-4 sm:px-6 py-3 sm:py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base transition-all flex items-center gap-1 sm:gap-2 border border-white/10"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    <span className="hidden sm:inline">Înapoi</span>
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !canSubmit}
                    className="flex-1 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-white/10 disabled:to-white/10 disabled:text-gray-500 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-emerald-500/25 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-sm sm:text-base">Se trimite...</span>
                      </>
                    ) : (
                      <>
                        <RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-sm sm:text-base">Finalizează înscrierea</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-gray-600 text-xs text-center mt-6">
            Prin trimiterea formularului, ești de acord cu procesarea datelor conform{' '}
            <Link href="/gdpr" className="text-emerald-500 hover:text-emerald-400 transition-colors">GDPR</Link>.
          </p>
        </form>

        {/* Trust Badges */}
        <div className="mt-6 sm:mt-10 grid grid-cols-3 gap-2 sm:gap-4">
          <div className="text-center p-2 sm:p-4 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <AcademicCapIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">Lecție de probă gratuită</p>
          </div>
          <div className="text-center p-2 sm:p-4 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">Răspuns în 24h</p>
          </div>
          <div className="text-center p-2 sm:p-4 bg-white/[0.02] rounded-xl sm:rounded-2xl border border-white/5">
            <div className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1 sm:mb-2 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[9px] sm:text-xs text-gray-500 leading-tight">+1000 familii fericite</p>
          </div>
        </div>
      </div>
    </div>
  )
}
