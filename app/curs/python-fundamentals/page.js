import { getCourseBySlug } from '@/lib/courses-data'
import CourseDetailPage from '@/components/public/CourseDetailPage'

export const metadata = {
  title: 'Python Fundamentals | PyWeb Academy',
  description: 'Bazele programării cu Python pentru adolescenți 12–14 ani. Variabile, funcții, jocuri și proiect final. Max 10 elevi/grupă, Chișinău.',
}

export default function PythonPage() {
  const course = getCourseBySlug('python-fundamentals')
  return <CourseDetailPage course={course} />
}
