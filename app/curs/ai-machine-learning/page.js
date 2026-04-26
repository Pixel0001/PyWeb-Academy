import { getCourseBySlug } from '@/lib/courses-data'
import CourseDetailPage from '@/components/public/CourseDetailPage'

export const metadata = {
  title: 'AI & Machine Learning | PyWeb Academy',
  description: 'Inteligență artificială aplicată pentru adolescenți 15–18 ani. Modele ML, rețele neurale, proiect AI real. Max 10 elevi/grupă, Chișinău.',
}

export default function AIPage() {
  const course = getCourseBySlug('ai-machine-learning')
  return <CourseDetailPage course={course} />
}
