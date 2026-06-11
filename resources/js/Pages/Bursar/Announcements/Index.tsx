import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Megaphone, Plus, Search, Filter, 
  MoreVertical, Edit2, Trash2, Eye,
  Clock, Globe, Users, BookOpen, X
} from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge, Avatar } from '@/Components/UI'
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

export default function AnnouncementIndex({ announcements, roles = [] }: Props) {
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
    post(route('bursar.announcements.store'), {
      onSuccess: () => {
        setModalOpen(false)
        reset()
        alert('Announcement broadcasted successfully!')
      }
    })
  }

  return (
    <AppLayout title="Institutional Notices">
      <Head title="Announcements & Notices" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Announcements</h1>
           <p className="text-sm text-surface-500 mt-1">Broadcast official institutional notices to students, staff, and departments.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="primary" size="sm" iconLeft={<Plus size={16} />} onClick={() => setModalOpen(true)}>
             Create Announcement
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {announcements.data.map((notice) => (
          <Card key={notice.id} className="group hover:border-brand-200 transition-all duration-300">
             <div className="flex items-start justify-between">
                <div className="flex gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex flex-shrink-0 items-center justify-center">
                      <Megaphone size={20} />
                   </div>
                   <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                         <h3 className="text-lg font-bold text-surface-900 group-hover:text-brand-600 transition-colors">{notice.title}</h3>
                         <Badge variant="neutral" className="text-[10px] uppercase tracking-widest">{notice.audience}</Badge>
                      </div>
                      <p className="text-sm text-surface-600 line-clamp-2 mb-4 leading-relaxed whitespace-pre-line">
                         {notice.body}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-surface-400">
                         <div className="flex items-center gap-1.5">
                            <Clock size={12} /> {formatDate(notice.created_at)}
                         </div>
                         <div className="flex items-center gap-1.5 font-medium text-surface-500">
                            <Avatar name={notice.author?.name || 'Admin'} size="xs" className="w-4 h-4" />
                            {notice.author?.name || 'Institutional Admin'}
                         </div>
                      </div>
                   </div>
                </div>
             </div>
          </Card>
        ))}

        {announcements.data.length === 0 && (
          <Card className="py-20 text-center">
             <Megaphone size={48} className="mx-auto text-surface-200 mb-4" />
             <p className="text-surface-500 font-medium text-lg">No announcements broadcast yet.</p>
             <p className="text-surface-400 text-sm mt-1">Keep your institution informed by posting official notices.</p>
             <Button variant="primary" className="mt-6" size="sm" iconLeft={<Plus size={16} />} onClick={() => setModalOpen(true)}>
               Post First Notice
             </Button>
          </Card>
        )}
      </div>

      {/* Create Announcement Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <div className="fixed inset-0 bg-surface-900/50 backdrop-blur-sm z-50 transition-opacity" onClick={() => setModalOpen(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              >
                <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2.5">
                    <Megaphone className="text-brand-600" size={20} />
                    <h3 className="font-bold text-surface-900">Broadcast New Announcement</h3>
                  </div>
                  <button onClick={() => setModalOpen(false)} className="text-surface-400 hover:text-surface-600 transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. End of Semester Examinations"
                      value={data.title}
                      onChange={(e) => setData('title', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    />
                    {errors.title && <p className="text-xs text-danger-500 mt-1">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Message Body</label>
                    <textarea 
                      required
                      rows={5}
                      placeholder="Enter the full announcement text..."
                      value={data.body}
                      onChange={(e) => setData('body', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-y"
                    />
                    {errors.body && <p className="text-xs text-danger-500 mt-1">{errors.body}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Target Audience</label>
                    <select 
                      value={data.audience}
                      onChange={(e) => setData('audience', e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="all">General School (Everyone)</option>
                      <option value="students">Only Students</option>
                      <option value="staff">All Staff</option>
                      <optgroup label="Specific Roles">
                        {roles.map(role => (
                          <option key={role} value={`role:${role}`}>{role.replace('_', ' ').toUpperCase()}</option>
                        ))}
                      </optgroup>
                    </select>
                    {errors.audience && <p className="text-xs text-danger-500 mt-1">{errors.audience}</p>}
                  </div>

                  <div className="flex gap-4 pt-2">
                    <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={data.send_email}
                        onChange={(e) => setData('send_email', e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 border-surface-300 w-4 h-4 cursor-pointer"
                      />
                      <span>Send via Email</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-surface-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={data.send_sms}
                        onChange={(e) => setData('send_sms', e.target.checked)}
                        className="rounded text-brand-600 focus:ring-brand-500 border-surface-300 w-4 h-4 cursor-pointer"
                      />
                      <span>Send via SMS</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-6 border-t border-surface-100 flex-shrink-0">
                    <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button type="submit" variant="primary" size="sm" loading={processing}>
                      Broadcast Notice
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </AppLayout>
  )
}
