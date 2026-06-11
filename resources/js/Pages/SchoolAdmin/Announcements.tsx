import { Head, Link, useForm } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { PageHeader } from '@/Components/UI/Advanced'
import { Card, Button, Badge } from '@/Components/UI'
import { Megaphone, Plus, Trash2 } from 'lucide-react'
import type { PageProps } from '@/types'

interface Announcement { id: number; title: string; body: string; audience: string; published_at?: string; author?: { name: string } }
interface AnnouncementsProps extends PageProps {
  announcements: { data: Announcement[]; links: any[] }
}

const audienceColor: Record<string, any> = { all: 'success', teachers: 'brand', students: 'warning', parents: 'danger' }

export default function Announcements({ announcements }: AnnouncementsProps) {
  const { delete: destroy } = useForm()

  return (
    <AppLayout title="Announcements">
      <Head title="Announcements" />
      <PageHeader
        title="Announcements"
        subtitle="Broadcast messages to students, teachers and parents"
        actions={
          <Link href="/admin/announcements/create">
            <Button variant="primary" icon={<Plus size={16} />}>New Announcement</Button>
          </Link>
        }
      />

      <div className="space-y-4">
        {announcements.data.length === 0 ? (
          <Card className="py-12 text-center text-surface-400">
            <Megaphone size={30} className="mx-auto mb-3 opacity-30" />
            No announcements published yet.
          </Card>
        ) : (
          announcements.data.map(a => (
            <Card key={a.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-surface-900">{a.title}</h3>
                    <Badge variant={audienceColor[a.audience] ?? 'default'} size="sm" className="capitalize">{a.audience}</Badge>
                    {!a.published_at && <Badge variant="warning" size="sm">Draft</Badge>}
                  </div>
                  <p className="text-sm text-surface-600 line-clamp-2">{a.body}</p>
                  <p className="text-xs text-surface-400 mt-2">
                    By {a.author?.name ?? 'System'} {a.published_at ? `— ${a.published_at.split('T')[0]}` : ''}
                  </p>
                </div>
                <button
                  className="text-surface-400 hover:text-danger-500 transition-colors"
                  onClick={() => { if (confirm('Delete this announcement?')) destroy(`/admin/announcements/${a.id}`) }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  )
}
