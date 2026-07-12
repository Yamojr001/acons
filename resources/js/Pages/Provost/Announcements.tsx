import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Plus, X, Globe, Users, BookOpen, Clock } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatDate } from '@/lib/utils'
import type { PageProps } from '@/types'

interface Props extends PageProps {
  announcements: {
    data: any[]
    links: any[]
    total: number
  }
  roles: string[]
}

const audienceLabels: Record<string, string> = {
  all: 'All Users',
  student: 'Students',
  lecturer: 'Lecturers',
  staff: 'Staff',
  registrar: 'Registrar',
  bursar: 'Bursar',
  hod: 'HODs',
}

export default function ProvostAnnouncements({ announcements, roles = [] }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  const { data, setData, post, processing, errors, reset } = useForm({
    title: '',
    body: '',
    audience: 'all',
    send_email: false,
    send_sms: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('provost.announcements.store'), {
      onSuccess: () => {
        setModalOpen(false)
        reset()
      }
    })
  }

  const items = announcements?.data ?? []

  return (
    <AppLayout title="Provost Announcements">
      <Head title="Provost — Announcements & Notices" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-surface-900">Announcements</h1>
          <p className="text-sm text-surface-500 mt-1">
            Broadcast official institutional notices from the Provost's Office.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          iconLeft={<Plus size={16} />}
          onClick={() => setModalOpen(true)}
        >
          New Announcement
        </Button>
      </div>

      {/* List */}
      {items.length > 0 ? (
        <div className="space-y-4">
          {items.map((a: any) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border border-surface-150 hover:shadow-sm transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <Megaphone size={18} className="text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-surface-900">{a.title}</h3>
                      <Badge variant="brand" className="text-[10px] font-bold uppercase tracking-wider">
                        {audienceLabels[a.audience] ?? a.audience}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-600 line-clamp-2">{a.body}</p>
                    <p className="text-[10px] text-surface-400 mt-2 flex items-center gap-1">
                      <Clock size={10} />
                      {a.published_at ? formatDate(a.published_at) : 'Not published'} · 
                      By {a.author?.name ?? 'Provost Office'}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16">
          <Megaphone size={40} className="mx-auto mb-3 text-surface-300" />
          <p className="font-bold text-surface-500">No announcements yet</p>
          <p className="text-sm text-surface-400 mt-1">Create the first institutional notice from the Provost's Office.</p>
        </Card>
      )}

      {/* Create Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 10 }}
              className="fixed inset-x-4 top-[5vh] md:top-[10vh] z-50 w-full max-w-lg mx-auto bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-surface-100 flex items-center justify-between">
                <h3 className="font-bold text-surface-900 text-lg">New Announcement</h3>
                <button onClick={() => setModalOpen(false)} className="text-surface-400 hover:text-surface-600 p-1.5 hover:bg-surface-100 rounded-xl">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                    Title <span className="text-danger-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={data.title}
                    onChange={e => setData('title', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                    placeholder="Announcement title..."
                  />
                  {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                    Message <span className="text-danger-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={data.body}
                    onChange={e => setData('body', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none shadow-sm"
                    placeholder="Write your announcement here..."
                  />
                  {errors.body && <p className="text-xs text-danger-500 mt-1">{errors.body}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">
                    Audience <span className="text-danger-500">*</span>
                  </label>
                  <select
                    value={data.audience}
                    onChange={e => setData('audience', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-sm"
                  >
                    <option value="all">All Users (Students, Staff, Lecturers)</option>
                    <option value="student">Students Only</option>
                    <option value="lecturer">Lecturers Only</option>
                    <option value="staff">Administrative Staff</option>
                    <option value="hod">Heads of Department</option>
                  </select>
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.send_email}
                      onChange={e => setData('send_email', e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span className="text-sm text-surface-700 font-medium">Send Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.send_sms}
                      onChange={e => setData('send_sms', e.target.checked)}
                      className="w-4 h-4 rounded accent-brand-600"
                    />
                    <span className="text-sm text-surface-700 font-medium">Send SMS</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="flex-1"
                    disabled={processing}
                  >
                    {processing ? 'Publishing...' : 'Publish Announcement'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
