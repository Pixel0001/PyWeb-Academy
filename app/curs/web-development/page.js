import { getCourseBySlug } from '@/lib/courses-data'
import CourseDetailPage from '@/components/public/CourseDetailPage'

export const metadata = {
  title: 'Web Development | PyWeb Academy',
  description: 'HTML, CSS și JavaScript de la zero. Adolescenții 13–16 ani construiesc site-uri reale cu portofoliu live. Max 10 elevi/grupă, Chișinău.',
}

export default function WebDevPage() {
  const course = getCourseBySlug('web-development')
  return <CourseDetailPage course={course} />
}
