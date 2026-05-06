import dynamic from 'next/dynamic'

const GroupsPageClient = dynamic(() => import('./GroupsPageClient'), { ssr: false })

export default function GroupsPage() {
  return <GroupsPageClient />
}

