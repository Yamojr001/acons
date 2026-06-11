import { Head } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, EmptyState, Badge } from '@/Components/UI'
import { Bell, Calendar, Megaphone } from 'lucide-react'
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

      <div className="mb-8 p-6 bg-gradient-to-r from-brand-600 to-brand-800 rounded-2xl text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <Megaphone size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Notice Board</h1>
            <p className="text-brand-100">Important updates and information from the institution administration.</p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      </div>

      <div className="space-y-4">
        {announcements.data.length > 0 ? (
          announcements.data.map((announcement) => (
            <Card key={announcement.id} className="hover:border-brand-200 transition-colors">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
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
                    <span className="px-2 py-0.5 bg-surface-100 rounded text-surface-600 capitalize">
                      To: {announcement.audience}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="py-16">
            <EmptyState
              title="No Announcements"
              description="There are currently no announcements for teachers. Check back later."
              icon={<Megaphone size={48} className="text-surface-300" />}
            />
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
