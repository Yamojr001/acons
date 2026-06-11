import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import { motion } from 'framer-motion'
import { Send, Mail, MessageSquare, Target, Clock, Check } from 'lucide-react'
import AppLayout from '@/Layouts/AppLayout'
import { Card, Button, Badge } from '@/Components/UI'
import { formatDate } from '@/lib/utils'

interface Props {
  announcements: {
    data: any[]
    links: any[]
    total: number
  }
}

export default function Announcements({ announcements }: Props) {
  const { data, setData, post, processing, errors, recentlySuccessful, reset } = useForm({
    subject: '',
    message: '',
    target: 'all',
    channel: 'email'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post(route('admission_officer.announcements.store'), {
      onSuccess: () => {
        reset('subject', 'message')
      }
    })
  }

  return (
    <AppLayout title="Broadcaster & Announcements">
      <Head title="Broadcaster Desk" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
           <h1 className="text-3xl font-display font-bold text-surface-900">Broadcast Desk</h1>
           <p className="text-sm text-surface-500 mt-1">Send bulk announcements, emails, or SMS campaigns to specific targets in the applicant queue.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bulk Broadcast Form */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border border-surface-100 p-8">
            <h3 className="font-bold text-lg text-surface-900 mb-6 flex items-center gap-2">
              <Send size={18} className="text-brand-500" />
              Compose Bulk Campaign Broadcast
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Target Audience Segment</label>
                  <div className="relative">
                    <Target size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <select 
                      value={data.target}
                      onChange={(e) => setData('target', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="all">All Registered Applicants</option>
                      <option value="pending">Pending Application Reviews</option>
                      <option value="admitted">Admitted & Cleared Candidates</option>
                      <option value="rejected">Rejected Applicants Only</option>
                    </select>
                  </div>
                  {errors.target && <p className="text-xs text-danger-500 mt-1">{errors.target}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Delivery Channel</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400" />
                    <select 
                      value={data.channel}
                      onChange={(e) => setData('channel', e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    >
                      <option value="email">Email Broadcast (SMTP)</option>
                      <option value="sms">SMS Broadcast (Simulated)</option>
                      <option value="both">Multi-Channel (Email & SMS)</option>
                    </select>
                  </div>
                  {errors.channel && <p className="text-xs text-danger-500 mt-1">{errors.channel}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Broadcast Subject / Heading</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Schedule for Screening Exams and Certificate Verifications"
                  value={data.subject}
                  onChange={(e) => setData('subject', e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                />
                {errors.subject && <p className="text-xs text-danger-500 mt-1">{errors.subject}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Campaign Message Content</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="Compose your dynamic broadcast newsletter or alert here..."
                  value={data.message}
                  onChange={(e) => setData('message', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                />
                {errors.message && <p className="text-xs text-danger-500 mt-1">{errors.message}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-surface-100">
                <Button 
                  type="submit" 
                  variant="primary" 
                  className="rounded-xl px-6 flex items-center gap-2"
                  loading={processing}
                >
                  {recentlySuccessful ? (
                    <>
                      <Check size={16} /> Campaign Dispatched!
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Dispatch Broadcast Now
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* History / Logs Sidebar */}
        <div>
          <Card className="shadow-lg border border-surface-100 p-6 space-y-6 max-h-[80vh] flex flex-col">
            <h3 className="font-bold text-sm text-surface-900 flex items-center gap-2 border-b border-surface-100 pb-4 flex-shrink-0">
              <Clock size={16} className="text-brand-500" />
              Past Broadcast Campaigns
            </h3>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {announcements.data.map((log) => (
                <div key={log.id} className="bg-surface-50 border border-surface-100 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-surface-800 text-xs truncate max-w-[150px]">{log.title}</h4>
                    <Badge variant="neutral" className="text-[9px] px-2 py-0.5">{formatDate(log.created_at)}</Badge>
                  </div>
                  <p className="text-[11px] text-surface-500 leading-relaxed line-clamp-3">{log.content}</p>
                </div>
              ))}
              {announcements.data.length === 0 && (
                <div className="text-center py-12 text-surface-400 italic text-xs">
                  No past broadcast campaigns.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
