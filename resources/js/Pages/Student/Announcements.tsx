import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, EmptyState, Badge } from '@/Components/UI'
import { Megaphone, Bell, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { PageProps, Announcement } from '@/types'

interface Props extends PageProps {
  announcements: {
    data: Announcement[]
    current_page: number
    last_page: number
    total: number
  }
}

export default function Announcements({ announcements }: Props) {
  return (
    <AppLayout title="Announcements">
      <Head title="Announcements" />

      <div className="mb-6">
        <h1 className="page-title">Institution Notices</h1>
        <p className="text-sm text-surface-500 mt-1 flex items-center gap-2">
          Updates and notices from the institution administration.
        </p>
      </div>

      <div className="space-y-4">
        {announcements.data.length > 0 ? (
          announcements.data.map((announcement) => (
             <Card key={announcement.id} className="hover:border-brand-200 transition-colors">
               <div className="flex flex-col sm:flex-row gap-4">
                 <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-surface-50 border border-surface-200 flex-shrink-0 text-center p-2">
                   <span className="text-sm font-bold text-surface-900 leading-none">
                     {new Date(announcement.published_at || announcement.created_at).getDate()}
                   </span>
                   <span className="text-xs text-surface-500 uppercase font-medium mt-1">
                     {new Date(announcement.published_at || announcement.created_at).toLocaleString('default', { month: 'short' })}
                   </span>
                 </div>
                 
                 <div className="flex-1">
                   <div className="flex items-start justify-between gap-4 mb-2">
                     <h3 className="text-lg font-semibold text-surface-900 leading-tight">
                       {announcement.title}
                     </h3>
                   </div>
                   
                   <div 
                     className="prose prose-sm prose-surface max-w-none text-surface-600 mb-4"
                     dangerouslySetInnerHTML={{ __html: announcement.body || '' }}
                   />
                   
                   <div className="flex items-center gap-4 text-xs text-surface-400 border-t border-surface-100 pt-3">
                     <span className="flex items-center gap-1.5">
                       <Calendar size={14} />
                       Published {formatDate(announcement.published_at || announcement.created_at, { timeStyle: 'short', dateStyle: 'medium' })}
                     </span>
                     <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">
                        {announcement.audience}
                     </Badge>
                   </div>
                 </div>
               </div>
             </Card>
          ))
        ) : (
          <Card className="py-16">
            <EmptyState
              title="No Notices"
              description="There are currently no notices geared towards students."
              icon={<Megaphone size={48} className="text-surface-300" />}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
