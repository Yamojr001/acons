import { Head, useForm } from '@inertiajs/react'
import { Megaphone, Send, AlertCircle } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Input, EmptyState } from '@/Components/UI'
import { formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  notices: any[]
  courses: any[]
}

export default function LecturerAnnouncements({ notices, courses }: Props) {
  const { data, setData, post, processing, reset, errors } = useForm({
    title: '',
    body: '',
    course_id: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/lecturer/announcements', {
      onSuccess: () => reset()
    })
  }

  return (
    <AppLayout title="Course Notices">
      <Head title="Manage Notices" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold text-surface-900">Announcements</h1>
            <p className="text-sm text-surface-500 mt-1">Broadcast important information to your students.</p>
          </div>

          {notices.length > 0 ? notices.map(notice => (
            <Card key={notice.id} className="border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-surface-900">{notice.title}</h3>
                <span className="text-xs text-surface-400">{formatDate(notice.created_at)}</span>
              </div>
              <p className="text-sm text-surface-600 mb-4">{notice.body}</p>
              {notice.course_id && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-100 text-surface-600 text-[10px] font-bold uppercase tracking-wider">
                  <AlertCircle size={10} /> Course: {courses.find(c => c.id === notice.course_id)?.code || 'Academic'}
                </div>
              )}
            </Card>
          )) : (
            <EmptyState title="No notices posted" description="Your announcements will appear here." icon={<Megaphone size={48} />} />
          )}
        </div>

        <div>
          <Card>
            <h3 className="font-bold text-surface-900 mb-4">Post New Notice</h3>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-surface-500 uppercase">Target Course</label>
                <select 
                  value={data.course_id}
                  onChange={e => setData('course_id', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                >
                  <option value="">All My Students</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code}: {c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-surface-500 uppercase">Title</label>
                <input 
                  type="text"
                  value={data.title}
                  onChange={e => setData('title', e.target.value)}
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none"
                  placeholder="e.g. Test Postponement"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-surface-500 uppercase">Message</label>
                <textarea 
                  value={data.body}
                  onChange={e => setData('body', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                  placeholder="Enter your message here..."
                />
              </div>

              <Button type="submit" variant="brand" className="w-full" disabled={processing} iconLeft={<Send size={18} />}>
                {processing ? 'Posting...' : 'Broadcast Notice'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
