import EnrollPage from '@/components/public/EnrollPage'

export const metadata = {
  title: 'Programează lecția gratuită — PyWeb Academy',
  description: 'Rezervă o lecție de probă gratuită la cursurile de programare, IT și AI pentru copii și adolescenți (10–16 ani). Te contactăm în maxim 24h.',
  alternates: { canonical: 'https://pyweb.online/inscriere' },
  openGraph: {
    title: 'Programează lecția gratuită — PyWeb Academy',
    description: 'Lecție de probă 100% gratuită. Fără card, fără angajament.',
    url: 'https://pyweb.online/inscriere',
    type: 'website',
  },
}

export default function Page() {
  return <EnrollPage />
}
