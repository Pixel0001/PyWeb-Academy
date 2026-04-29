'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShieldCheckIcon, LockClosedIcon, UserIcon, DocumentTextIcon, CameraIcon, ClockIcon, ScaleIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

export default function GDPRPage() {
  const sections = [
    {
      id: 1,
      title: 'Introducere',
      icon: ShieldCheckIcon,
      content: (
        <p className="text-gray-600 leading-relaxed">
          PyWeb Academy respectă dreptul la confidențialitate și se angajează să protejeze datele cu caracter personal ale copiilor și ale părinților/reprezentanților legali, în conformitate cu legislația în vigoare privind protecția datelor cu caracter personal (GDPR). Prezenta politică explică modul în care PyWeb Academy colectează, utilizează, stochează și protejează datele personale.
        </p>
      )
    },
    {
      id: 2,
      title: 'Ce date colectăm',
      icon: UserIcon,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Date despre copil:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Nume și prenume
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Data nașterii
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Clasa și instituția de învățământ
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Informații medicale relevante (alergii, intoleranțe, nevoi speciale – doar cu acordul părinților)
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Date despre părinte/reprezentant legal:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Nume și prenume
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Număr de telefon
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Adresă de e-mail
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Adresă de domiciliu
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Alte date:</h4>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Fotografii și materiale video realizate în timpul activităților (cu acord scris)
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
                Date necesare pentru evidența financiară și administrativă
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: 'Scopul colectării datelor',
      icon: DocumentTextIcon,
      content: (
        <div>
          <p className="text-gray-600 mb-4">Datele personale sunt colectate și utilizate exclusiv pentru:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Înscrierea copilului la programele PyWeb Academy
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Organizarea și desfășurarea activităților educaționale
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Comunicarea eficientă cu părinții
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Asigurarea siguranței și bunăstării copiilor
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Respectarea obligațiilor legale
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Promovarea activităților PyWeb Academy (doar cu consimțământ)
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 4,
      title: 'Temeiul legal al prelucrării',
      icon: ScaleIcon,
      content: (
        <div>
          <p className="text-gray-600 mb-4">Prelucrarea datelor se face în baza:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Consimțământului părintelui/reprezentantului legal
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Executării contractului de prestări servicii educaționale
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Obligațiilor legale
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Interesului legitim al centrului privind siguranța copiilor
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 5,
      title: 'Confidențialitatea și securitatea datelor',
      icon: LockClosedIcon,
      content: (
        <div>
          <p className="text-gray-600 mb-4">PyWeb Academy:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Nu divulgă datele personale către terți fără acordul legal
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Oferă acces la date doar personalului autorizat
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Aplică măsuri de securitate pentru protejarea datelor împotriva accesului neautorizat
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 6,
      title: 'Perioada de stocare',
      icon: ClockIcon,
      content: (
        <p className="text-gray-600 leading-relaxed">
          Datele sunt păstrate doar pe perioada necesară desfășurării relației contractuale sau conform cerințelor legale în vigoare.
        </p>
      )
    },
    {
      id: 7,
      title: 'Drepturile părinților/reprezentanților legali',
      icon: UserIcon,
      content: (
        <div>
          <p className="text-gray-600 mb-4">Conform legislației, aveți următoarele drepturi:</p>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de acces la date
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de rectificare a datelor
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de ștergere a datelor
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de restricționare a prelucrării
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de opoziție
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] mt-2 flex-shrink-0"></span>
              Dreptul de retragere a consimțământului în orice moment
            </li>
          </ul>
          <p className="text-gray-600 mt-4">
            Solicitările pot fi transmise în scris la datele de contact ale centrului.
          </p>
        </div>
      )
    },
    {
      id: 8,
      title: 'Fotografii și materiale video',
      icon: CameraIcon,
      content: (
        <p className="text-gray-600 leading-relaxed">
          Fotografiile și materialele video realizate în cadrul activităților PyWeb Academy pot fi utilizate exclusiv în scop educativ sau de promovare, doar cu acordul scris al părinților/reprezentanților legali.
        </p>
      )
    },
    {
      id: 9,
      title: 'Modificarea politicii',
      icon: DocumentTextIcon,
      content: (
        <p className="text-gray-600 leading-relaxed">
          PyWeb Academy își rezervă dreptul de a actualiza prezenta politică. Orice modificare va fi comunicată părinților.
        </p>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0f172a] to-[#1e3a8a] text-white py-10 sm:py-16">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <Image
            src="/PyWeb Academy logo.png"
            alt="PyWeb Academy"
            width={150}
            height={48}
            priority
            style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)', marginBottom: '1.25rem' }}
          />
          <Link 
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-[#3b82f6] hover:text-[#93c5fd] mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Înapoi la pagina principală
          </Link>
          <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
              <ShieldCheckIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-bold">Politica de Confidențialitate</h1>
              <p className="text-gray-400 mt-0.5 sm:mt-1 text-xs sm:text-base">GDPR - Protecția datelor cu caracter personal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-4 sm:space-y-8">
          {sections.map((section) => {
            const IconComponent = section.icon
            return (
              <div 
                key={section.id}
                className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3b82f6]/10 to-[#3b82f6]/5 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                    <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6]" />
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-gray-900">
                    {section.id}. {section.title}
                  </h2>
                </div>
                <div className="pl-11 sm:pl-14 text-sm sm:text-base">
                  {section.content}
                </div>
              </div>
            )
          })}

          {/* Contact Section */}
          <div className="bg-gradient-to-br from-[#3b82f6]/10 to-[#1d4ed8]/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-[#3b82f6]/20">
            <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-base sm:text-xl font-bold text-gray-900">
                10. Date de contact
              </h2>
            </div>
            <div className="pl-11 sm:pl-14">
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Pentru orice întrebări sau solicitări legate de protecția datelor:
              </p>
              <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                <h3 className="font-bold text-gray-900 text-base sm:text-lg">PyWeb Academy</h3>
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                    <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] flex-shrink-0" />
                    <span>Chișinău, Moldova</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                    <PhoneIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] flex-shrink-0" />
                    <a href="tel:+37368113314" className="hover:text-[#3b82f6] transition-colors">
                      068 113 314
                    </a>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-gray-600 text-sm sm:text-base">
                    <EnvelopeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#3b82f6] flex-shrink-0" />
                    <a href="mailto:pyweb.it.academy@gmail.com" className="hover:text-[#3b82f6] transition-colors break-all">
                      pyweb.it.academy@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-200 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
          <Link 
            href="/termeni"
            className="text-[#3b82f6] hover:text-[#1d4ed8] font-medium transition-colors text-sm sm:text-base"
          >
            Termeni și Condiții
          </Link>
          <span className="text-gray-300 hidden sm:inline">|</span>
          <Link 
            href="/"
            className="text-[#3b82f6] hover:text-[#1d4ed8] font-medium transition-colors text-sm sm:text-base"
          >
            Pagina principală
          </Link>
        </div>
      </div>
    </div>
  )
}
